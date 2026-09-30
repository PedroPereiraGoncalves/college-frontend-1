/* ==========================================================================
   Área: FORMULÁRIO
   Máscaras de digitação, conferência dos dados e leitura do formulário.
   O formulário é novalidate: quem decide se pode salvar é este arquivo.
   Os campos com problema recebem a classe is-invalid do Bootstrap.
   ========================================================================== */
window.App = window.App || {};

App.formulario = (function () {
  "use strict";

  function apenasDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  /* ---------- máscaras ---------- */

  function mascaraCpf(campo) {
    var v = apenasDigitos(campo.value).slice(0, 11);

    campo.value = v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  function mascaraTelefone(campo) {
    var v = apenasDigitos(campo.value).slice(0, 11);
    var comDdd = v.replace(/^(\d{2})(\d)/, "($1) $2");

    /* Fixo tem 10 dígitos; celular tem 11 */
    campo.value = v.length > 10
      ? comDdd.replace(/(\d{5})(\d)/, "$1-$2")
      : comDdd.replace(/(\d{4})(\d)/, "$1-$2");
  }

  /* Liga as máscaras e limpa o vermelho quando a pessoa corrige o campo */
  function ligar() {
    var cpf = document.getElementById("cpf");
    var telefone = document.getElementById("telefone");
    var formulario = document.getElementById("form-cadastro");

    cpf.addEventListener("input", function () {
      mascaraCpf(cpf);
    });

    telefone.addEventListener("input", function () {
      mascaraTelefone(telefone);
    });

    formulario.addEventListener("input", function (evento) {
      desmarcar(evento.target);
    });
  }

  /* ---------- conferências ---------- */

  /* Confere os dois dígitos verificadores do CPF (cálculo módulo 11).
     O pattern do HTML só olha o formato, então 111.111.111-11 passaria. */
  function cpfValido(valor) {
    var cpf = apenasDigitos(valor);

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    function digito(base) {
      var soma = 0;

      for (var i = 0; i < base.length; i += 1) {
        soma += Number(base.charAt(i)) * (base.length + 1 - i);
      }

      var resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    }

    return digito(cpf.slice(0, 9)) === Number(cpf.charAt(9)) &&
           digito(cpf.slice(0, 10)) === Number(cpf.charAt(10));
  }

  /* Junta a validação nativa do HTML5 com a regra do CPF e devolve
     a lista de mensagens de erro. Lista vazia significa que está tudo certo. */
  function validar() {
    var formulario = document.getElementById("form-cadastro");
    var erros = [];

    limpar();

    Array.prototype.forEach.call(formulario.elements, function (campo) {
      if (campo.willValidate && !campo.checkValidity()) {
        erros.push(marcar(campo, mensagem(campo)));
      }
    });

    var cpf = document.getElementById("cpf");

    if (cpf.value.length === 14 && !cpfValido(cpf.value)) {
      erros.push(marcar(cpf, "Os dígitos verificadores não conferem, confira o número digitado."));
    }

    return erros;
  }

  /* Traduz o motivo da falha em uma mensagem curta em português */
  function mensagem(campo) {
    var v = campo.validity;

    if (v.valueMissing) { return "Preencha este campo."; }
    if (v.typeMismatch) { return "Digite um endereço de e-mail válido."; }
    if (v.patternMismatch) { return "Use o formato " + campo.getAttribute("title") + "."; }
    if (v.tooShort) { return "Digite pelo menos " + campo.getAttribute("minlength") + " caracteres."; }

    return "Valor inválido.";
  }

  /* Pinta o campo de vermelho e escreve a mensagem logo abaixo dele */
  function marcar(campo, texto) {
    campo.classList.add("is-invalid");
    campo.setAttribute("aria-invalid", "true");

    var aviso = campo.parentNode.querySelector(".invalid-feedback");
    if (aviso) { aviso.textContent = texto; }

    return { campo: campo, mensagem: texto };
  }

  /* Tira a marca de erro de um campo: a cor, o aviso e o estado para o leitor de tela */
  function desmarcar(campo) {
    if (!campo.classList) { return; }

    campo.classList.remove("is-invalid");
    campo.removeAttribute("aria-invalid");

    var aviso = campo.parentNode.querySelector(".invalid-feedback");
    if (aviso) { aviso.textContent = ""; }
  }

  /* Tira as marcas de erro de todos os campos */
  function limpar() {
    var formulario = document.getElementById("form-cadastro");

    Array.prototype.forEach.call(formulario.querySelectorAll(".is-invalid"), desmarcar);
  }

  /* Lê o formulário e devolve um objeto simples, pronto para ser gravado */
  function coletarDados() {
    function valor(id) {
      return document.getElementById(id).value.trim();
    }

    return {
      nome: valor("nome"),
      email: valor("email"),
      telefone: valor("telefone"),
      cpf: valor("cpf"),
      cidade: valor("cidade"),
      participacao: valor("participacao"),
      area: valor("area"),
      termos: document.getElementById("termos").checked
    };
  }

  return {
    ligar: ligar,
    limpar: limpar,
    validar: validar,
    coletarDados: coletarDados,
    cpfValido: cpfValido,
    apenasDigitos: apenasDigitos,
    mascaraCpf: mascaraCpf,
    mascaraTelefone: mascaraTelefone
  };
})();
