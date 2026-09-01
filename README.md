# Ultra Veículos

Site e painel da Ultra Veículos, revenda de seminovos em Suzano (SP).

Next 16 (App Router, Turbopack) + Supabase (Postgres, Auth e Storage) + Tailwind 4.

- **Site público:** home, catálogo com filtros, página do veículo, venda/consignação
- **Painel** (`/painel`): estoque, cadastro e edição de carro com fotos, banner, contatos

## Rodar na máquina

```bash
npm install
cp .env.example .env.local   # e preencha as duas variáveis
npm run dev
```

Abre em http://localhost:3000. O painel fica em `/painel`, com login em `/entrar`.

## Variáveis de ambiente

São só duas, e as duas são `NEXT_PUBLIC` **por design**: elas viajam pro
navegador. A segurança do projeto está nas policies de RLS do banco, não em
esconder a chave. **Não existe `SERVICE_ROLE_KEY` neste projeto**; se um dia
parecer que precisa dela, o desenho está errado.

| Variável | Onde achar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > Data API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API Keys > `anon` `public` |

> **As duas são lidas em tempo de BUILD**, não só em execução: o
> `next.config.ts` monta a Content-Security-Policy e o `images.remotePatterns`
> a partir do host do Supabase. Sem elas, o build cai num host de exemplo e o
> navegador passa a **bloquear** as fotos dos carros e as chamadas ao banco.
> Por isso, mudar essas variáveis exige **redeploy**, não basta salvar.

## Deploy na Vercel

1. Vercel > **Add New > Project** > importar `FelipeSitesRodrigues/057-ultraveiculos`
2. **Root Directory:** deixar na raiz. O repositório já é a pasta do site.
3. **Framework Preset:** Next.js (a Vercel detecta sozinha). Build e install ficam no padrão.
4. **Environment Variables:** colar o conteúdo do `.env.local` inteiro no campo
   (a Vercel aceita colar um arquivo `.env` de uma vez e separa as duas).
   Marcar Production, Preview e Development.
5. **Deploy.** A partir daí, todo push na `main` publica sozinho.

Depois de subir:

- **Domínio:** o `metadataBase` vem de `SITE.url` em `src/lib/site.ts`, hoje
  apontando pra `https://ultraveiculos.com.br`. Se o domínio final for outro,
  mudar lá **antes** de divulgar, senão as URLs canônicas que o Google lê vão
  apontar pro lugar errado.
- **Supabase > Authentication > URL Configuration:** incluir o domínio novo.

## Banco

As migrations vivem em `supabase/migrations/`. Depois de mexer em qualquer
policy, rodar a bateria de RLS:

```bash
bash scripts/teste-rls.sh
```

São 12 testes: conferem que o visitante não lê custo nem contato, não escreve
em nada, e que `registrar_lead` recusa entrada inválida.

> Migration que **apaga** dado precisa de trava por data
> (`criado_em < '...'`), que a torne inofensiva fora do dia em que foi escrita.
> Migration roda de novo em qualquer banco novo, e um `delete` com critério
> largo apagaria carro real da loja.

## Revisão visual

```bash
npm run dev
node scripts/revisar.mjs / /veiculos /venda-seu-carro
```

Abre o Edge via puppeteer-core em 4 viewports (390, 768, 1440 e 1920x720) e
checa overflow horizontal, erro de console, imagem sem alt e vazamento de dado
financeiro no HTML. Os prints saem em `../revisao/`.
