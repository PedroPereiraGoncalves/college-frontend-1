/* ==========================================================================
   Build de produção
   Gera a pasta dist/ pronta para publicar:
   - minifica o CSS do tema e os quatro módulos JavaScript (esbuild);
   - copia o Bootstrap e a imagem para dentro do dist;
   - reescreve os caminhos do index.html, que saem de ../ para a raiz do dist.
   Uso: npm run build
   ========================================================================== */
import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const dist = path.join(raiz, "dist");

const MODULOS = ["dados", "telas", "formulario", "app"];

/* Arquivo temporário que importa os módulos na ordem de carregamento, para o
   esbuild agrupar tudo em um único arquivo minificado. */
const ENTRADA = ".entrada-build.js";

const relatorio = [];

function tamanho(texto) {
  return Buffer.byteLength(texto, "utf8");
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1).padStart(6) + " KB";
}

/* Minifica um arquivo e devolve o conteúdo pronto */
async function minificar(entrada) {
  const resultado = await build({
    entryPoints: [path.join(raiz, entrada)],
    minify: true,
    write: false,
    target: ["es2019"]
  });

  return resultado.outputFiles[0].text;
}

/* Reescreve os caminhos do index.html para a raiz do dist */
function ajustarHtml(html) {
  const trocas = [
    ['href="../css/bootstrap.min.css"', 'href="css/bootstrap.min.css"'],
    ['href="../css/style.css"', 'href="css/style.min.css"'],
    ['src="../js/bootstrap.bundle.min.js"', 'src="js/bootstrap.bundle.min.js"']
  ];

  /* Os quatro scripts viram um só no dist */
  MODULOS.forEach(function (nome) {
    const tag = '  <script src="../js/' + nome + '.js" defer></script>\n';

    if (!html.includes(tag)) {
      throw new Error("tag de script não encontrada: " + tag.trim());
    }

    html = html.replace(tag, "");
  });

  /* O bootstrap já foi reescrito acima; aqui entra o bundle dos módulos */
  trocas.push([
    '<script src="js/bootstrap.bundle.min.js" defer></script>',
    '<script src="js/bootstrap.bundle.min.js" defer></script>\n  <script src="js/app.min.js" defer></script>'
  ]);

  trocas.forEach(function (par) {
    if (!html.includes(par[0])) {
      throw new Error("caminho não encontrado no index.html: " + par[0]);
    }
    html = html.replace(par[0], par[1]);
  });

  return html;
}

/* ---------- limpa e recria a pasta ---------- */
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "css"), { recursive: true });
await mkdir(path.join(dist, "js"), { recursive: true });

/* ---------- CSS ---------- */
const cssOriginal = await readFile(path.join(raiz, "css/style.css"), "utf8");
const cssMinificado = await minificar("css/style.css");
await writeFile(path.join(dist, "css/style.min.css"), cssMinificado);
relatorio.push(["css/style.css", "css/style.min.css", tamanho(cssOriginal), tamanho(cssMinificado), tamanho(gzipSync(cssMinificado))]);

/* ---------- JavaScript: um arquivo só ---------- */
const fontes = await Promise.all(MODULOS.map((nome) => readFile(path.join(raiz, "js/" + nome + ".js"), "utf8")));
const codigoOriginal = fontes.join("\n");

await writeFile(
  path.join(raiz, ENTRADA),
  MODULOS.map((nome) => 'import "./js/' + nome + '.js";').join("\n") + "\n"
);

const agrupado = await build({
  entryPoints: [path.join(raiz, ENTRADA)],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: ["es2019"]
});

await rm(path.join(raiz, ENTRADA), { force: true });

/* As imagens ficam um nível acima do script em desenvolvimento; no dist os
   dois estão na raiz do site. */
const jsMinificado = agrupado.outputFiles[0].text.replaceAll('"../img/', '"img/');

await writeFile(path.join(dist, "js/app.min.js"), jsMinificado);
relatorio.push(["js/ (4 módulos)", "js/app.min.js", tamanho(codigoOriginal), tamanho(jsMinificado), tamanho(gzipSync(jsMinificado))]);

/* ---------- arquivos copiados ---------- */
await cp(path.join(raiz, "css/bootstrap.min.css"), path.join(dist, "css/bootstrap.min.css"));
await cp(path.join(raiz, "js/bootstrap.bundle.min.js"), path.join(dist, "js/bootstrap.bundle.min.js"));
await cp(path.join(raiz, "img"), path.join(dist, "img"), { recursive: true });

/* ---------- página ---------- */
const html = ajustarHtml(await readFile(path.join(raiz, "html/index.html"), "utf8"));
await writeFile(path.join(dist, "index.html"), html);

/* ---------- relatório ---------- */
console.log("\narquivo de origem        -> arquivo publicado        antes     depois    gzip");
relatorio.forEach(function (linha) {
  console.log(
    linha[0].padEnd(24) + " -> " + linha[1].padEnd(24) +
    kb(linha[2]) + "  " + kb(linha[3]) + "  " + kb(linha[4])
  );
});

const antes = relatorio.reduce((soma, l) => soma + l[2], 0);
const depois = relatorio.reduce((soma, l) => soma + l[3], 0);
console.log("\ntotal dos nossos arquivos: " + kb(antes) + " -> " + kb(depois) +
            "  (" + Math.round((1 - depois / antes) * 100) + "% menor antes do gzip)");
console.log("dist/ gerado com index.html, css/, js/ e img/\n");
