<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Notas do projeto Ultra Veiculos

Diferencas do Next 16 que valem pra este codigo (conferidas em
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`):

- `middleware.ts` virou **`proxy.ts`**, com a funcao exportada chamada `proxy`.
  Runtime e sempre nodejs, nao configuravel. E ali que a sessao do painel e
  renovada.
- `revalidateTag(tag)` agora exige segundo argumento (`revalidateTag(tag, 'max')`).
  Para expiracao imediata dentro de Server Action, usar **`updateTag`**.
- `revalidatePath(path, type?)` continua igual. E o que este projeto usa quando
  o painel salva um veiculo.
- `params` e `searchParams` sao Promise. Sempre `await`.
- Tipos globais `PageProps<'/rota'>` e `LayoutProps<'/'>` sao gerados pelo Next.
- Turbopack e o padrao em dev e build.
- `images.domains` esta deprecado: usar `images.remotePatterns`.

Regras de seguranca deste projeto (ver `sites/057 - Ultra Veiculos/arquitetura.md`):

- **Nenhuma query do site publico toca `veiculo_financeiro`.** Custo e preco
  minimo so aparecem dentro de `/painel`.
- Leitura publica usa `criarClientePublico()` (sem cookie, pra nao matar o ISR).
  O painel usa o cliente com cookie.
- `SUPABASE_SERVICE_ROLE_KEY` nao existe neste projeto. Se precisar dela,
  o desenho esta errado.
- Rodar `bash scripts/teste-rls.sh` depois de qualquer mudanca em policy.
