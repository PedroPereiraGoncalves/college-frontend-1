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

function montarPagina(rota) {
  const script = [
    "<script>" + axe + "</script>",
    "<script>",
    'window.addEventListener("load", function () {',
    '  window.location.hash = "' + rota + '";',
    "  setTimeout(function () {",
    '    axe.run(document, { runOnly: { type: "tag", values: ' + JSON.stringify(REGRAS) + " } })",
    "      .then(function (r) {",
    '        var pre = document.createElement("pre");',
    '        pre.id = "axe";',
    "        pre.textContent = r.violations.map(function (v) {",
    '          return v.impact + " | " + v.id + " | " + v.help + " | " +',
    '                 v.nodes.map(function (n) { return n.target.join(" "); }).join(" ; ");',
    '        }).join("\\n") || "SEM VIOLACOES";',
    "        document.body.appendChild(pre);",
    "      })",
    '      .catch(function (e) { pre.textContent = "ERRO: " + e.message; });',
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
    await writeFile(temporario, montarPagina(rota));

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

    console.log("\n" + rota);
    console.log(resultado.split("\n").map((linha) => "  " + linha).join("\n"));

    if (resultado !== "SEM VIOLACOES") { comProblema += 1; }
  }
} finally {
  await rm(temporario, { force: true });
  await rm(perfil, { recursive: true, force: true });
}

console.log(comProblema
  ? "\n" + comProblema + " rota(s) com violacoes"
  : "\nnenhuma violacao de WCAG 2.1 A/AA nas rotas testadas");

process.exit(comProblema ? 1 : 0);
