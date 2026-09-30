# Versionamento

## Fluxo de branches (GitFlow)

| Branch | Papel | Regra |
| --- | --- | --- |
| `main` | produção | só recebe merge de release (`develop`) ou de hotfix; toda entrada ganha tag |
| `develop` | integração | é dela que nasce toda branch de trabalho e é para ela que tudo volta |
| `feature/*` | uma funcionalidade ou etapa por branch | aberta a partir da `develop`, integrada por pull request e descartada depois |
| `hotfix/*` | correção urgente na versão publicada | nasce da `main` e volta para a `main` e para a `develop` |

A branch padrão do repositório é a `main`, porque é dela que sai a publicação. Mesmo trabalhando sozinho, nenhum commit é feito direto nela: a alteração entra por pull request, e o PR fica como registro do que mudou e de como foi verificado.

## Mensagens de commit

Padrão **Conventional Commits**: `tipo(escopo): descrição no imperativo`.

| Tipo | Quando usar | Exemplo deste repositório |
| --- | --- | --- |
| `feat` | funcionalidade nova | `feat(a11y): aria-current no link ativo e autocomplete nos campos` |
| `fix` | correção de defeito | `fix(a11y): corrige contraste dos links do menu e dos botoes de contorno` |
| `docs` | só documentação ou capturas | `docs(a11y): atualiza capturas e adiciona a do foco pelo teclado` |
| `build` | build e dependências | `build: adiciona script de build com esbuild e suite de verificacoes` |
| `test` | verificação automatizada | `test: adiciona verificacoes de formulario` |
| `chore` | manutenção sem efeito no produto | `chore: ajusta gitignore` |

O escopo `a11y` foi usado nas alterações de acessibilidade para que `git log --grep a11y` recupere todo o histórico do assunto.

## Versionamento semântico

As versões seguem `MAJOR.MINOR.PATCH`:

- **MAJOR** sobe quando algo quebra o que existia (endereços de rota, estrutura de dados gravada);
- **MINOR** sobe quando entra funcionalidade nova compatível (`feat`);
- **PATCH** sobe quando é só correção (`fix` e `hotfix`).

`docs`, `build`, `test` e `chore` não geram versão por si sós.

### Releases

| Versão | Conteúdo | Como foi feita |
| --- | --- | --- |
| `v1.0.0` | SPA entregue, com as correções de acessibilidade AA | merge do PR #1 na `main`, tag anotada (`git tag -a`) |
| `v1.1.0` | build para produção e documentação técnica (planejada) | `develop` → PR → `main`, com tag |

As tags são anotadas e apontam para o commit de merge na `main`, o que liga a versão publicada ao conjunto exato de alterações.

## Como contribuir

```bash
# 1. partir da develop atualizada
git checkout develop
git pull

# 2. criar a branch do trabalho
git checkout -b feature/nome-curto

# 3. commitar em passos pequenos, na mensagem padrão
git add arquivos
git commit -m "feat(escopo): o que mudou"

# 4. rodar as verificações antes de subir
npm test
npm run a11y

# 5. publicar e abrir o pull request contra a develop
git push -u origin feature/nome-curto
gh pr create --base develop --fill
```

Um pull request só é mergeado com o build passando (`npm run build`), as verificações passando (`npm test`) e a auditoria sem violação (`npm run a11y`). O corpo do PR descreve o contexto, o que mudou, o resultado medido e o critério de aceite da issue correspondente.
