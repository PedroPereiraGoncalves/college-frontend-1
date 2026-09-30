/* ==========================================================================
   Verificações do projeto
   Roda sem nenhuma dependência externa (só Node):
   1. sintaxe dos módulos JavaScript;
   2. toda classe usada no HTML e nos templates tem estilo definido;
   3. todo id buscado pelo JavaScript existe no shell ou nos templates;
   4. requisitos de acessibilidade que já foram corrigidos não voltaram;
   5. o formulário tem rótulo e mensagem de erro em todos os campos.
   Uso: npm test
   ========================================================================== */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const MODULOS = ["dados", "telas", "formulario", "app"];

let falhas = 0;

function conferir(nome, condicao, detalhe) {
  console.log((condicao ? "  ok  " : " FALHA") + " " + nome + (detalhe ? "  -> " + detalhe : ""));
  if (!condicao) { falhas += 1; }
}

const ler = (arquivo) => readFile(path.join(raiz, arquivo), "utf8");

const html = await ler("html/index.html");
const css = await ler("css/style.css");
const bootstrap = await ler("css/bootstrap.min.css");
const telas = await ler("js/telas.js");
const modulos = await Promise.all(MODULOS.map((m) => ler("js/" + m + ".js")));
const js = modulos.join("\n");
const fonte = html + "\n" + telas;

/* ---------- 1. sintaxe ---------- */
console.log("\nsintaxe");
MODULOS.forEach(function (nome) {
  try {
    execFileSync(process.execPath, ["--check", path.join(raiz, "js/" + nome + ".js")]);
    conferir("js/" + nome + ".js", true);
  } catch (erro) {
    conferir("js/" + nome + ".js", false, String(erro.message).split("\n")[0]);
  }
});

/* ---------- 2. classes usadas x classes definidas ---------- */
console.log("\ncss");
const usadas = new Set();

[html, telas].forEach(function (texto) {
  for (const achado of texto.matchAll(/class="([^"]*)"/g)) {
    achado[1].split(/\s+/).forEach(function (classe) {
      if (classe) { usadas.add(classe); }
    });
  }
});

const semEstilo = [...usadas].filter((classe) => !bootstrap.includes("." + classe) && !css.includes("." + classe));
conferir("toda classe usada tem estilo", semEstilo.length === 0, semEstilo.join(", "));

/* ---------- 3. ids ---------- */
console.log("\nreferencias");
const buscados = [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
const existentes = new Set([...fonte.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const semId = [...new Set(buscados)].filter((id) => !existentes.has(id));
conferir("todo getElementById encontra o elemento", semId.length === 0, semId.join(", "));

/* ---------- 4. acessibilidade ---------- */
console.log("\nacessibilidade");
conferir("html declara o idioma", /<html lang="pt-BR">/.test(html));
conferir("link de pular vem antes do cabecalho", html.indexOf('class="pular-navegacao"') !== -1 && html.indexOf('class="pular-navegacao"') < html.indexOf("<header"));
conferir("main recebe foco depois da troca de tela", /<main id="app"[^>]*tabindex="-1"/.test(html));
conferir("navegacao tem rotulo", /<nav[^>]*aria-label=/.test(html));
conferir("botao do menu informa o estado", /navbar-toggler[^>]*aria-expanded=/.test(html));
conferir("aviso tem regiao viva", /id="toast"[^>]*aria-live=/.test(html));
conferir("nenhum outline removido no css", !/outline:\s*none/.test(css));
conferir("toda tela tem titulo de nivel 1", (telas.match(/<h1/g) || []).length >= 3, String((telas.match(/<h1/g) || []).length) + " h1");
conferir("imagem tem texto alternativo", /<img[^>]*alt="[^"]+"/.test(telas));
conferir("link ativo usa aria-current", js.includes('aria-current'));
conferir("campos identificam o proposito", (telas.match(/autocomplete="/g) || []).length >= 4);

/* ---------- 5. formulario ---------- */
console.log("\nformulario");
const campos = [...telas.matchAll(/<(?:input|select|textarea)[^>]*id="([^"]+)"/g)].map((m) => m[1]);
const semRotulo = campos.filter((id) => !telas.includes('for="' + id + '"'));
conferir("todo campo tem rotulo", semRotulo.length === 0, semRotulo.join(", "));

const avisos = (telas.match(/class="invalid-feedback"/g) || []).length;
conferir("todo campo tem aviso de erro", avisos === campos.length, avisos + " avisos para " + campos.length + " campos");

const semDescricao = campos.filter((id) => !telas.includes('aria-describedby="' + id + '-erro"'));
conferir("todo campo aponta para a sua mensagem", semDescricao.length === 0, semDescricao.join(", "));

conferir("campo invalido recebe aria-invalid", js.includes('setAttribute("aria-invalid"') && js.includes('removeAttribute("aria-invalid")'));
conferir("aviso e lido por inteiro", /id="toast"[^>]*aria-atomic="true"/.test(html));

console.log("\ntema");
conferir("css define a paleta do modo escuro", /\[data-bs-theme="dark"\]/.test(css));
conferir("botao de tema anuncia o estado", /id="botao-tema"[^>]*aria-pressed="/.test(html));
conferir("tema aplicado antes da primeira pintura", html.indexOf("data-bs-theme") !== -1 && html.indexOf("data-bs-theme") < html.indexOf("</head>"));
conferir("escolha do tema e persistida", js.includes("sementes:tema"));

const obrigatorios = (telas.match(/ required/g) || []).length;
conferir("campos obrigatorios marcados com required", obrigatorios >= 6, String(obrigatorios) + " campos");

/* ---------- resultado ---------- */
console.log(falhas ? "\n" + falhas + " verificacao(oes) falharam" : "\ntodas as verificacoes passaram");
process.exit(falhas ? 1 : 0);
