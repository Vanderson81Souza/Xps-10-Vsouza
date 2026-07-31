# GitHub Pages deploy fix (static site)

Este repo não tinha workflow em `.github/workflows/`. Para evitar falhas genéricas no `actions/deploy-pages@v5/v4`, foi adicionado o workflow mínimo abaixo:

- usa `actions/upload-pages-artifact` para publicar o conteúdo estático do repo
- depois usa `actions/deploy-pages` para publicar no GitHub Pages
- configura permissões e `id-token: write` (necessário para OIDC)

Arquivo:
- `.github/workflows/deploy-pages.yml`

## Próximos passos
1. Commitar/pushar.
2. Acessar Actions → o novo workflow deve criar o Pages deployment.
3. Se o site não abrir na URL de Pages: checar se a branch `main` está correta e se o repo tem Pages habilitado em Settings.

