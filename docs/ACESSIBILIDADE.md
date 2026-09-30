# Acessibilidade — WCAG 2.1 nível AA

## Como a auditoria é feita

```bash
npm run a11y
```

O script injeta o **axe-core 4.10** nas três telas dentro de um navegador headless e roda as regras dos níveis A e AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). Sem violação, o comando termina com sucesso; com violação, ele lista o elemento, o impacto e a regra, e sai com erro.

Além do axe, três verificações são feitas à mão: navegação completa só com <kbd>Tab</kbd>, o layout a 320 px de largura (WCAG 1.4.10) e a leitura dos textos com o zoom em 200%.

## O que a auditoria encontrou

A primeira execução acusou duas falhas de contraste, as duas de nível AA (WCAG 1.4.3):

| Onde | Cor do texto | Fundo | Razão medida | Exigido |
| --- | --- | --- | --- | --- |
| Links do menu | `#99bcac` | `#1c6b47` | **3,12:1** | 4,5:1 |
| `.btn-outline-secondary` (Limpar, Remover) | `#6c757d` | `#fbf9f5` | **4,45:1** | 4,5:1 |

**Causas.** No menu, o `navbar-dark` do Bootstrap define `--bs-navbar-color` como branco a 55%; sobre o verde da paleta isso dá 3,12:1. Nos botões de contorno, o cinza padrão do Bootstrap (`#6c757d`) fica 4,45:1 sobre o fundo areia do projeto.

**Correção.** O tema passou a fixar as variáveis do navbar em branco puro e a definir as variáveis do `.btn-outline-secondary` com o verde da paleta. As duas cores ficaram em **6,4:1**. Depois da correção, o axe roda sem nenhuma violação nas três rotas.

## O que está implementado

| Critério | Como |
| --- | --- |
| 1.3.5 Identificar o propósito do campo | `autocomplete` em nome, e-mail, telefone e cidade |
| 1.4.3 Contraste mínimo | 6,4:1 nos itens corrigidos; textos e fundos com no mínimo 4,5:1 |
| 1.4.10 Reflow | testado a 320 px de largura, sem rolagem horizontal |
| 2.4.1 Mecanismo de bypass | link "Pular para o conteúdo principal" como primeiro elemento focável |
| 2.4.3 Ordem de foco | `main` com `tabindex="-1"` e foco movido a cada troca de rota |
| 2.4.7 Foco visível | contorno aparece em `:focus-visible`, inclusive no contêiner |
| 3.3.1 Identificação do erro | texto do erro abaixo de cada campo, ligado a ele por `aria-describedby` e `aria-invalid`, além da borda vermelha |
| 3.3.2 Rótulos | `<label for>` em todos os campos, inclusive nos seletores |
| 4.1.2 Nome, função e valor | `aria-current="page"` no link da tela aberta |
| 4.1.3 Mensagens de status | toast com `role="status"`, `aria-live="polite"` e `aria-atomic="true"` |

O link de pular aparece no primeiro <kbd>Tab</kbd> e leva direto ao conteúdo — a captura `capturas/05-foco-teclado.png` mostra o estado.

## Modos de cor

A aplicação tem **tema claro e tema escuro**, trocados pelo botão na barra de navegação. A técnica usa o `data-bs-theme` do Bootstrap 5.3, que troca as variáveis de todos os componentes; o que o projeto faz é redefinir a própria paleta dentro de `[data-bs-theme="dark"]`.

Três detalhes da implementação:

1. a cor de marca virou **duas**: `--verde` para fundo de barra, rodapé, botão e badge, e `--verde-texto` para títulos, legend e botões de contorno. No modo claro elas coincidem; no escuro precisam ser bem diferentes, porque verde escuro sobre fundo escuro não passa em contraste;
2. a escolha fica no `localStorage` (`sementes:tema`) e vale mais que a preferência do sistema; sem escolha salva, o app respeita o `prefers-color-scheme` do sistema operacional;
3. um script pequeno no `<head>` aplica o tema **antes da primeira pintura**, para não aparecer um flash branco em quem usa o modo escuro.

Rácios medidos (fórmula de contraste da WCAG 2.1, conferidos pelo axe):

| Elemento | Modo claro | Modo escuro | Exigido |
| --- | --- | --- | --- |
| Texto principal | 14,97:1 | 15,28:1 | 4,5:1 |
| Títulos e legend | 6,16:1 | 9,87:1 | 4,5:1 |
| Links do menu | 6,47:1 | 6,18:1 | 4,5:1 |
| Botão primário | 6,47:1 | 6,18:1 | 4,5:1 |
| Botão de contorno | 6,16:1 | 9,87:1 | 4,5:1 |
| Texto nos cartões | 15,75:1 | 13,89:1 | 4,5:1 |
| Rodapé | 6,47:1 | 6,18:1 | 4,5:1 |
| Mensagem de erro | 4,53:1 | 6,49:1 | 4,5:1 |

A auditoria do axe roda nas três rotas **nos dois temas** (seis combinações) e não encontra violação em nenhuma.

## Limitações conhecidas

- A auditoria é **automática**: regras como "a ordem de foco faz sentido" foram conferidas por inspeção, não por teste.
- Não houve teste com leitor de tela real (NVDA ou VoiceOver), apenas a checagem das propriedades ARIA e da estrutura de títulos.
- O contraste foi medido nos estados padrão; estados de `:hover` e `:focus` usam as cores do Bootstrap e não foram medidos um a um.
- O critério 1.4.12 (espaçamento do texto) e o 2.5.5 (tamanho do alvo) não foram verificados com ferramenta.

Essas lacunas estão registradas para uma próxima rodada de auditoria, e não como pendências escondidas.
