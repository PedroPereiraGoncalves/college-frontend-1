/* ==========================================================================
   Área: DADOS
   Os projetos da ONG e as funções que gravam e leem os cadastros
   no localStorage do navegador.
   ========================================================================== */
window.App = window.App || {};

App.dados = (function () {
  "use strict";

  var CHAVE = "sementes:cadastros";

  var projetos = [
    {
      area: "Educação",
      titulo: "Sementinha da Leitura",
      resumo: "Reforço escolar e clube de leitura para crianças de 6 a 15 anos, no contraturno."
    },
    {
      area: "Saúde",
      titulo: "Cuidar Perto de Casa",
      resumo: "Mutirões de triagem e acompanhamento de gestantes nas unidades do bairro."
    },
    {
      area: "Meio ambiente",
      titulo: "Horta que Alimenta",
      resumo: "Horta comunitária que produz hortaliças para sessenta famílias do entorno."
    }
  ];

  /* Lê a lista guardada no navegador */
  function listarCadastros() {
    try {
      return JSON.parse(window.localStorage.getItem(CHAVE)) || [];
    } catch (erro) {
      return [];
    }
  }

  /* Grava a lista inteira de volta no navegador */
  function gravar(lista) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch (erro) {
      /* se o navegador bloquear o localStorage, os dados não são guardados */
    }
  }

  function salvarCadastro(cadastro) {
    var lista = listarCadastros();

    cadastro.id = "cad" + Date.now();
    cadastro.criadoEm = new Date().toLocaleDateString("pt-BR");

    lista.push(cadastro);
    gravar(lista);

    return cadastro;
  }

  function removerCadastro(id) {
    gravar(listarCadastros().filter(function (cadastro) {
      return cadastro.id !== id;
    }));
  }

  function limparCadastros() {
    gravar([]);
  }

  return {
    projetos: projetos,
    listarCadastros: listarCadastros,
    salvarCadastro: salvarCadastro,
    removerCadastro: removerCadastro,
    limparCadastros: limparCadastros
  };
})();
