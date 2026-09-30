# Arquitetura

## Visão geral

A aplicação é uma SPA escrita em **JavaScript puro**, sem framework. A decisão foi consciente: o objetivo da disciplina é dominar DOM, eventos e modularização, e um framework esconderia justamente essas partes. O Bootstrap entra apenas como biblioteca de CSS e de componentes, não como estrutura da aplicação.

O documento tem um contêiner único — `<main id="app">` — e a barra de navegação, o rodapé e o aviso (toast) ficam fora dele. Isso significa que trocar de tela nunca remonta a estrutura da página.

## Módulos

| Arquivo | Responsabilidade | Depende de |
| --- | --- | --- |
| `js/dados.js` | projetos da ONG e todas as funções de `localStorage` | ninguém |
| `js/telas.js` | funções que devolvem o HTML de cada tela em forma de texto | `dados` (lê os projetos) |
| `js/formulario.js` | máscaras, validação e leitura dos campos | ninguém |
| `js/app.js` | rotas, eventos das telas e inicialização | os três acima e o Bootstrap |

Cada arquivo é uma IIFE que registra o seu módulo em `window.App` e devolve apenas uma API pequena. O que fica dentro fica privado: a chave do `localStorage`, por exemplo, só existe dentro do `dados.js`.

As dependências apontam todas para o mesmo sentido — o `app.js` conhece os outros três, o `telas.js` conhece o `dados.js`, e o `dados.js` e o `formulario.js` não conhecem ninguém. Não há ciclo.

## Fluxo de uma navegação

1. O link do menu é um `<a href="#/cadastro">` comum; o navegador troca apenas o fragmento, sem recarregar.
2. Isso dispara `hashchange`, ouvido uma única vez na inicialização.
3. `renderizar()` lê o `location.hash`, procura a rota na tabela e injeta o HTML no `<main>` com `innerHTML`.
4. Como o `innerHTML` cria elementos novos, os eventos da tela anterior morrem junto. Por isso cada rota pode declarar um `depois()`, chamado logo após a injeção, que religa o que aquela tela precisa (máscaras e envio no cadastro, remover na lista).
5. Fecha o menu do celular, atualiza o `document.title`, marca o link ativo com `aria-current` e move o foco para o conteúdo.

## Decisões técnicas

**Roteamento por hash, não History API.** Com `history.pushState` os endereços ficam mais bonitos, mas o servidor precisaria devolver o `index.html` para qualquer rota. Como o projeto também é aberto direto pelo arquivo (`file://`), recarregar em `#/cadastro` quebraria. Com hash, o navegador nunca pede outra página e o histórico funciona de graça.

**Scripts clássicos com `defer`, não ES modules.** Módulos ES são bloqueados por CORS quando a página é aberta por `file://`. Os scripts clássicos carregam em ordem e funcionam nos dois cenários. A separação em módulos existe do mesmo jeito; se o projeto passar a ser servido com build de bundler, a conversão é trocar as tags por `type="module"` e adicionar `import`/`export`.

**Templates por template literal + `innerHTML`.** O HTML de cada componente fica em um lugar só, junto dos dados que o preenchem. Toda informação vinda do usuário passa por `escapar()`, que troca `&`, `<`, `>` e `"` pelas entidades — sem isso, um nome digitado como `<script>` viraria código na página.

**Tema aplicado por atributo, não por classe.** O modo escuro usa o `data-bs-theme` no `<html>`, que é o mecanismo do próprio Bootstrap 5.3 para trocar as variáveis dos componentes. O projeto redefine a sua paleta dentro de `[data-bs-theme="dark"]`, e o JavaScript só troca o atributo e guarda a escolha. Aplicar o atributo num script do `<head>` evita o flash de tema errado na carga.

**Só o que o usuário cria vai para o `localStorage`.** Os projetos são fixos no código, então não faz sentido persistir. O que é gravado é a lista de cadastros, sob a chave `sementes:cadastros`, em JSON.

## Como adicionar uma tela

1. Crie a função em `js/telas.js` devolvendo o HTML em texto (comece por um `<h1>`).
2. Registre a rota em `js/app.js`, no objeto `rotas`, com `titulo` e `tela`.
3. Se a tela tiver interação, escreva um `depois()` e informe no registro da rota.
4. Adicione o link no menu, em `html/index.html`.
5. Rode `npm test` e `npm run a11y` antes de abrir o pull request.
