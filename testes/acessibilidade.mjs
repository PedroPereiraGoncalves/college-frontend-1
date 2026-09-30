/* ==========================================================================
   Auditoria de acessibilidade
   Injeta o axe-core nas três telas da SPA, roda as regras de WCAG 2.1
   níveis A e AA num navegador headless e imprime as violações encontradas.
   Uso: npm run a11y   (precisa de um Chrome ou Chromium instalado)
   ========================================================================== */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const executar = promisify(execFile);
const raiz = path.resolve(import.meta.dirname, "..");

const CANDIDATOS = [
  process.env.CHROME,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  process.env.HOME && path.join(
    process.env.HOME,
    ".cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
  )
].filter(Boolean);

const navegador = CANDIDATOS.find((caminho) => existsSync(caminho));

if (!navegador) {
  console.log("\nnenhum Chrome ou Chromium encontrado.");
  console.log("defina a variável CHROME com o caminho do executável, por exemplo:");
  console.log("  CHROME=/usr/bin/google-chrome npm run a11y\n");
  process.exit(0);
}

const ROTAS = ["/inicio", "/cadastro", "/cadastros"];
const TEMAS = ["claro", "escuro"];
const REGRAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const axe = await readFile(path.join(raiz, "node_modules/axe-core/axe.min.js"), "utf8");
const modelo = await readFile(path.join(raiz, "html/index.html"), "utf8");
const temporario = path.join(raiz, "html", "_auditoria.html");
const perfil = path.join(raiz, ".chrome-perfil");

function escaparHtml(texto) {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function montarPagina(rota, tema) {
  const script = [
    "<script>" + axe + "</script>",
    "<script>",
    'window.addEventListener("load", function () {',
    '  document.documentElement.setAttribute("data-bs-theme", "' + (tema === "escuro" ? "dark" : "light") + '");',
    '  window.location.hash = "' + rota + '";',
    "  setTimeout(function () {",
    "    var linhas = [];",
    "",
    "    /* ordem de foco: quem aparece primeiro e quem tem tabindex positivo */",
    '    var candidatos = document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]");',
    "    var focaveis = Array.prototype.filter.call(candidatos, function (el) {",
    '      return el.tabIndex >= 0 && !el.disabled && el.offsetParent !== null;',
    "    });",
    "",
    "    function nome(el) {",
    '      if (!el) { return "nenhum"; }',
    '      var classe = typeof el.className === "string" ? "." + el.className.split(" ")[0] : "";',
    '      return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + classe;',
    "    }",
    "",
    '    var positivos = focaveis.filter(function (el) { return el.tabIndex > 0; });',
    "",
    '    linhas.push("TECLADO | primeiro: " + nome(focaveis[0]));',
    '    linhas.push("TECLADO | ordem: " + focaveis.slice(0, 6).map(nome).join(" > "));',
    '    linhas.push("TECLADO | tabindex positivo: " + positivos.length);',
    '    linhas.push("TECLADO | elementos focaveis: " + focaveis.length);',
    "",
    '    axe.run(document, { runOnly: { type: "tag", values: ' + JSON.stringify(REGRAS) + " } })",
    "      .then(function (r) {",
    "        r.violations.forEach(function (v) {",
    '          linhas.push("AXE | " + v.impact + " | " + v.id + " | " + v.help + " | " +',
    '                      v.nodes.map(function (n) { return n.target.join(" "); }).join(" ; "));',
    "        });",
    '        linhas.push(r.violations.length ? "" : "AXE | SEM VIOLACOES");',
    '        var pre = document.createElement("pre");',
    '        pre.id = "axe";',
    '        pre.textContent = linhas.join("\\n");',
    "        document.body.appendChild(pre);",
    "      })",
    "      .catch(function (e) {",
    '        linhas.push("AXE | ERRO: " + e.message);',
    '        var pre = document.createElement("pre");',
    '        pre.id = "axe";',
    '        pre.textContent = linhas.join("\\n");',
    "        document.body.appendChild(pre);",
    "      });",
    "  }, 600);",
    "});",
    "</script>",
    "</body>"
  ].join("\n");

  return modelo.replace("</body>", script);
}

let comProblema = 0;

try {
  for (const rota of ROTAS) {
   for (const tema of TEMAS) {
    await writeFile(temporario, montarPagina(rota, tema));

    const { stdout } = await executar(navegador, [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--window-size=1280,900",
      "--virtual-time-budget=20000",
      "--user-data-dir=" + perfil,
      "--dump-dom",
      "file://" + temporario
    ], { maxBuffer: 64 * 1024 * 1024 });

    const achado = stdout.match(/<pre id="axe">([\s\S]*?)<\/pre>/);
    const resultado = achado ? escaparHtml(achado[1]) : "NAO RODOU";

    console.log("\n" + rota + " (" + tema + ")");
    console.log(resultado.split("\n").map((linha) => "  " + linha).join("\n"));

    /* a rota passa quando nao ha violacao do axe, o primeiro foco e o link de
       pular e nenhum elemento tem tabindex positivo */
    const semViolacao = !/^AXE \| (?!SEM)/m.test(resultado);
    const focoCerto = resultado.includes("TECLADO | primeiro: a.pular-navegacao");
    const semTabindexPositivo = resultado.includes("TECLADO | tabindex positivo: 0");

    if (!semViolacao) { console.log("  -> violacoes de acessibilidade"); }
    if (!focoCerto) { console.log("  -> o primeiro elemento focavel nao e o link de pular"); }
    if (!semTabindexPositivo) { console.log("  -> existe tabindex positivo na pagina"); }

    if (!semViolacao || !focoCerto || !semTabindexPositivo) { comProblema += 1; }
   }
  }
} finally {
  await rm(temporario, { force: true });
  await rm(perfil, { recursive: true, force: true });
}

console.log(comProblema
  ? "\n" + comProblema + " combinacao(oes) de rota e tema com problema"
  : "\nnenhuma violacao de WCAG 2.1 A/AA nas rotas, nos dois temas");

process.exit(comProblema ? 1 : 0);
