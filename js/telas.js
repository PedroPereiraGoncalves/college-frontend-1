/* ==========================================================================
   Área: TELAS
   Cada função devolve o HTML de uma tela em forma de texto. Quem coloca
   esse texto na página é o app.js: aqui não se mexe no DOM.
   ========================================================================== */
window.App = window.App || {};

App.telas = (function () {
  "use strict";

  /* Escapa os caracteres que teriam significado dentro do HTML.
     Sem isso, um nome digitado como <script> viraria código na página. */
  function escapar(texto) {
    return String(texto === undefined || texto === null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Um único modelo de cartão, reaproveitado nos três projetos */
  function cartaoProjeto(projeto) {
    return `
      <div class="col-12 col-md-4">
        <div class="card h-100 p-3">
          <span class="badge text-bg-primary align-self-start mb-2">${escapar(projeto.area)}</span>
          <h2 class="h5">${escapar(projeto.titulo)}</h2>
          <p class="mb-0">${escapar(projeto.resumo)}</p>
        </div>
      </div>`;
  }

  /* ---------- tela: projetos ---------- */
  function inicio() {
    var cartoes = App.dados.projetos.map(cartaoProjeto).join("");

    return `
      <h1 class="h3 mb-3">Nossos projetos</h1>

      <div class="row align-items-center g-4 mb-4">
        <div class="col-12 col-md-7">
          <p>
            O Instituto Sementes do Amanhã atua desde 2009 em cinco comunidades de baixa
            renda. Todos os projetos nascem de pedidos dos próprios moradores.
          </p>
          <a class="btn btn-primary" href="#/cadastro">Quero participar</a>
        </div>
        <div class="col-12 col-md-5">
          <picture>
            <source type="image/webp" srcset="../img/imagem-ong-480.webp 480w, ../img/imagem-ong.webp 800w" sizes="(max-width: 767px) 100vw, 40vw">
            <img class="img-fluid rounded" src="../img/imagem-ong.jpg" srcset="../img/imagem-ong-480.jpg 480w, ../img/imagem-ong.jpg 800w" sizes="(max-width: 767px) 100vw, 40vw" alt="Voluntários plantando mudas na horta comunitária." width="800" height="400" decoding="async">
          </picture>
        </div>
      </div>

      <div class="row g-3">${cartoes}</div>`;
  }

  /* ---------- tela: formulário de cadastro ---------- */
  function cadastro() {
    return `
      <h1 class="h3 mb-3">Quero participar</h1>

      <form id="form-cadastro" novalidate>
        <fieldset class="mb-3">
          <legend>1. Seus dados</legend>

          <div class="mb-3">
            <label class="form-label" for="nome">Nome completo: *</label>
            <input class="form-control" type="text" id="nome" maxlength="80" autocomplete="name" required minlength="3" aria-describedby="nome-erro">
            <div class="invalid-feedback" id="nome-erro"></div>
          </div>

          <div class="row">
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="email">E-mail: *</label>
              <input class="form-control" type="email" id="email" autocomplete="email" required aria-describedby="email-erro">
              <div class="invalid-feedback" id="email-erro"></div>
            </div>

            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="telefone">Telefone com DDD: *</label>
              <input class="form-control" type="tel" id="telefone" maxlength="15" placeholder="(83) 98765-4321" title="(00) 00000-0000" autocomplete="tel" required pattern="\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}" aria-describedby="telefone-erro">
              <div class="invalid-feedback" id="telefone-erro"></div>
            </div>
          </div>

          <div class="row">
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="cpf">CPF: *</label>
              <input class="form-control" type="text" id="cpf" maxlength="14" placeholder="000.000.000-00" title="000.000.000-00" required pattern="[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}" aria-describedby="cpf-erro">
              <div class="invalid-feedback" id="cpf-erro"></div>
            </div>

            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="cidade">Cidade: *</label>
              <input class="form-control" type="text" id="cidade" maxlength="60" autocomplete="address-level2" required aria-describedby="cidade-erro">
              <div class="invalid-feedback" id="cidade-erro"></div>
            </div>
          </div>
        </fieldset>

        <fieldset class="mb-3">
          <legend>2. Como quer participar</legend>

          <div class="row">
            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="participacao">Tipo de participação: *</label>
              <select class="form-select" id="participacao" required aria-describedby="participacao-erro">
                <option value="">Selecione</option>
                <option>Voluntário(a)</option>
                <option>Doador(a)</option>
                <option>Voluntário(a) e doador(a)</option>
              </select>
              <div class="invalid-feedback" id="participacao-erro"></div>
            </div>

            <div class="col-12 col-md-6 mb-3">
              <label class="form-label" for="area">Área de interesse: *</label>
              <select class="form-select" id="area" required aria-describedby="area-erro">
                <option value="">Selecione</option>
                <option>Educação</option>
                <option>Saúde</option>
                <option>Meio ambiente</option>
                <option>Administrativo</option>
              </select>
              <div class="invalid-feedback" id="area-erro"></div>
            </div>
          </div>

          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="termos" required aria-describedby="termos-erro">
            <label class="form-check-label" for="termos">Autorizo o uso dos meus dados para contato (LGPD). *</label>
            <div class="invalid-feedback" id="termos-erro"></div>
          </div>
        </fieldset>

        <button class="btn btn-primary" type="submit">Salvar cadastro</button>
        <button class="btn btn-outline-secondary" type="reset">Limpar</button>
      </form>`;
  }

  /* ---------- tela: cadastros salvos ---------- */
  function cartaoCadastro(cadastro) {
    return `
      <div class="col-12 col-md-6">
        <div class="card h-100 p-3">
          <span class="badge text-bg-primary align-self-start mb-2">${escapar(cadastro.participacao)}</span>
          <h2 class="h5 mb-1">${escapar(cadastro.nome)}</h2>
          <p class="mb-1">${escapar(cadastro.email)} · ${escapar(cadastro.telefone)}</p>
          <p class="text-body-secondary small">${escapar(cadastro.cidade)} · área: ${escapar(cadastro.area)} · salvo em ${escapar(cadastro.criadoEm)}</p>
          <button class="btn btn-sm btn-outline-secondary align-self-start" type="button" data-remover="${cadastro.id}">Remover</button>
        </div>
      </div>`;
  }

  function cadastros(lista) {
    var cartoes = lista.length
      ? lista.map(cartaoCadastro).join("")
      : `<p class="text-body-secondary">Nenhum cadastro salvo ainda. Preencha o formulário para ver a lista funcionando.</p>`;

    return `
      <h1 class="h3 mb-3">Cadastros salvos</h1>
      <p>${lista.length} cadastro(s) guardado(s) no localStorage deste navegador. Nada é enviado para servidor.</p>
      <p><button class="btn btn-sm btn-outline-secondary" type="button" id="limpar">Limpar todos</button></p>
      <div class="row g-3" id="lista-cadastros">${cartoes}</div>`;
  }

  /* ---------- tela: endereço que não existe ---------- */
  function naoEncontrado(caminho) {
    return `
      <h1 class="h3 mb-3">Página não encontrada</h1>
      <div class="alert alert-danger">O endereço <strong>${escapar(caminho)}</strong> não corresponde a nenhuma tela.</div>
      <a class="btn btn-primary" href="#/inicio">Voltar para os projetos</a>`;
  }

  return {
    escapar: escapar,
    inicio: inicio,
    cadastro: cadastro,
    cadastros: cadastros,
    naoEncontrado: naoEncontrado
  };
})();
