/* ==========================================================================
   Área: APLICAÇÃO
   O roteador da SPA. Ele lê o endereço depois do #, coloca a tela
   correspondente dentro do <main> e liga os eventos daquela tela.
   O menu e o aviso (toast) são componentes do Bootstrap.
   É o último arquivo carregado.
   ========================================================================== */
window.App = window.App || {};

App.app = (function () {
  "use strict";

  var conteudo;
  var toast;
  var botaoTema;

  /* Chave onde a escolha do tema fica guardada */
  var CHAVE_TEMA = "sementes:tema";

  /* Cada rota tem o título da aba, a função de telas.js que devolve o HTML
     e, quando precisa, uma função que liga os eventos da tela. */
  var rotas = {
    "/inicio": {
      titulo: "Projetos",
      tela: function () { return App.telas.inicio(); }
    },
    "/cadastro": {
      titulo: "Quero participar",
      tela: function () { return App.telas.cadastro(); },
      depois: ligarFormulario
    },
    "/cadastros": {
      titulo: "Cadastros salvos",
      tela: function () { return App.telas.cadastros(App.dados.listarCadastros()); },
      depois: ligarLista
    }
  };

  /* ---------- componentes do Bootstrap ---------- */

  /* Aviso rápido no canto da tela */
  function avisar(mensagem) {
    document.getElementById("toast-texto").textContent = mensagem;
    toast.show();
  }

  /* Fecha o menu do celular. Quem abre é o próprio Bootstrap. */
  function fecharMenu() {
    var menu = document.getElementById("menu");

    if (menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  }

  /* ---------- navegação ---------- */

  function caminhoAtual() {
    return window.location.hash.replace("#", "") || "/inicio";
  }

  function renderizar() {
    var caminho = caminhoAtual();
    var rota = rotas[caminho];

    fecharMenu();

    if (!rota) {
      conteudo.innerHTML = App.telas.naoEncontrado(caminho);
      document.title = "Página não encontrada";
      marcarLink(null);
      conteudo.focus();
      return;
    }

    conteudo.innerHTML = rota.tela();

    if (rota.depois) { rota.depois(); }

    document.title = rota.titulo + " | Sementes do Amanhã";
    marcarLink(caminho);
    window.scrollTo(0, 0);

    /* Leva o foco (e o leitor de tela) para o conteudo novo */
    conteudo.focus();
  }

  /* Marca no menu o link da tela que está aberta: a classe dá o visual e o
     aria-current avisa quem usa leitor de tela (WCAG 4.1.2) */
  function marcarLink(caminho) {
    var links = document.querySelectorAll(".navbar-nav .nav-link");

    Array.prototype.forEach.call(links, function (link) {
      var ativo = link.getAttribute("href") === "#" + caminho;

      link.classList.toggle("active", ativo);

      if (ativo) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* ---------- tema claro e escuro ---------- */

  /* A escolha salva vale mais que a preferência do sistema */
  function temaInicial() {
    var salvo = null;

    try { salvo = window.localStorage.getItem(CHAVE_TEMA); } catch (erro) { salvo = null; }

    if (salvo === "claro" || salvo === "escuro") { return salvo; }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }

  /* O Bootstrap troca as variáveis dos componentes pelo data-bs-theme */
  function aplicarTema(tema) {
    var escuro = tema === "escuro";

    document.documentElement.setAttribute("data-bs-theme", escuro ? "dark" : "light");
    botaoTema.setAttribute("aria-pressed", String(escuro));
    botaoTema.textContent = escuro ? "Modo claro" : "Modo escuro";
  }

  function ligarTema() {
    botaoTema = document.getElementById("botao-tema");

    aplicarTema(temaInicial());

    botaoTema.addEventListener("click", function () {
      var escuro = document.documentElement.getAttribute("data-bs-theme") === "dark";
      var novo = escuro ? "claro" : "escuro";

      aplicarTema(novo);
      avisar(novo === "escuro" ? "Tema escuro ativado." : "Tema claro ativado.");

      try { window.localStorage.setItem(CHAVE_TEMA, novo); } catch (erro) { /* sem storage, vale só nesta visita */ }
    });
  }

  /* ---------- eventos de cada tela ---------- */

  function ligarFormulario() {
    var formulario = document.getElementById("form-cadastro");

    App.formulario.ligar();

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();

      var erros = App.formulario.validar();

      if (erros.length > 0) {
        erros[0].campo.focus();
        avisar("Confira os " + erros.length + " campo(s) destacado(s).");
        return;
      }

      App.dados.salvarCadastro(App.formulario.coletarDados());
      avisar("Cadastro salvo!");
      window.location.hash = "#/cadastros";
    });

    /* O botão Limpar também tira as marcas de erro */
    formulario.addEventListener("reset", App.formulario.limpar);
  }

  function ligarLista() {
    document.getElementById("limpar").addEventListener("click", function () {
      App.dados.limparCadastros();
      renderizar();
      avisar("Todos os cadastros foram apagados.");
    });

    document.getElementById("lista-cadastros").addEventListener("click", function (evento) {
      var botao = evento.target.closest("[data-remover]");
      if (!botao) { return; }

      App.dados.removerCadastro(botao.getAttribute("data-remover"));
      renderizar();
      avisar("Cadastro removido.");
    });
  }

  /* ---------- início ---------- */

  function iniciar() {
    conteudo = document.getElementById("app");
    toast = bootstrap.Toast.getOrCreateInstance(document.getElementById("toast"));

    ligarTema();

    window.addEventListener("hashchange", renderizar);

    document.getElementById("menu").addEventListener("click", function (evento) {
      if (evento.target.closest("a")) { fecharMenu(); }
    });

    renderizar();
  }

  return {
    iniciar: iniciar,
    renderizar: renderizar,
    avisar: avisar
  };
})();

App.app.iniciar();
