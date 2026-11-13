# NutriDecifra

**Decifre o que você come.** O NutriDecifra é um web app para celular: você lê o código de barras de um produto com a câmera e
vê, em linguagem simples, quantas colheres de açúcar ele tem, quanto da sua cota diária isso representa, alertas
personalizados (glúten, lactose, açúcar, sódio, aditivos) e alternativas mais saudáveis da mesma categoria.

O visual segue o arquivo do Figma **"NutriDecifra — Apresentação (cópia)"**.

---

## O que é real no app

| Recurso | De onde vem |
|---|---|
| Dados do produto (nome, marca, tabela nutricional, alérgenos, aditivos, Nutri-Score, NOVA) | [Open Food Facts](https://world.openfoodfacts.org), base aberta e colaborativa de alimentos |
| Alternativas | Produtos reais da mesma categoria com Nutri-Score melhor, priorizando os vendidos no Brasil (Open Food Facts) |
| Colheres de açúcar | Açúcar da porção declarada (ou de 100 g) ÷ 4 g, que é uma colher de chá |
| Cota diária de açúcar | Açúcar da porção ÷ seu limite diário (padrão de 25 g, recomendação da OMS; ajustável) |
| "Alto em" açúcar, gordura saturada e sal | Classificação `nutrient_levels` do Open Food Facts |
| Contas, histórico, alertas, pontos e conquistas | Supabase (cada usuário só vê os próprios dados) |

Se um produto não estiver na base, o app diz isso e não inventa dados.

**Ainda não disponível ("Em breve"):** assinatura do plano Premium, atendimento para empresas (B2B) e login com Apple
(exige conta paga de desenvolvedor Apple). Enquanto o Premium não é lançado, todos os recursos ficam liberados para todos.

---

## Tecnologias

- [React 19](https://react.dev) + TypeScript + [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com), com as cores do Figma em `src/index.css`
- [Supabase](https://supabase.com) para login (e-mail/senha e Google) e banco de dados Postgres com RLS
- [ZXing](https://github.com/zxing-js/browser) para ler códigos de barras (EAN-13, EAN-8, UPC) pela câmera
- PWA: pode ser instalado na tela inicial do celular

## Estrutura

```
src/
  screens/        uma tela do Figma por arquivo (Home, Scanner, Result, ...)
  components/ui   peças reutilizáveis (barra inferior, selo de nota, interruptor...)
  context/        sessão do usuário e dados carregados do Supabase
  lib/
    off.ts          busca no Open Food Facts
    nutrition.ts    cálculos (colheres, cota, alertas)
    compare.ts      comparação produto × alternativa
    gamification.ts níveis, sequência, conquistas, desafio da semana
    actions.ts      gravações no banco (leitura, salvar, trocar)
supabase/migrations/001_init.sql   estrutura do banco
```

| Tela no Figma | Rota | Arquivo |
|---|---|---|
| 01 · Início da apresentação | `/` | `Splash.tsx` |
| 02 · Onboarding | `/boas-vindas` | `Onboarding.tsx` |
| 03 · Login / 03b · Cadastro | `/entrar`, `/cadastrar` | `Auth.tsx` |
| 04 · Home | `/inicio` | `Home.tsx` |
| 05 · Scanner | `/scanner` | `Scanner.tsx` |
| 13 · Analisando rótulo | `/analisando/:codigo` | `Analyzing.tsx` |
| 06 · Resultado | `/resultado/:id` | `Result.tsx` |
| 08 · Alternativas | `/alternativas/:id` | `Alternatives.tsx` |
| 16 · Detalhe alternativa | `/alternativas/:id/:codigo` | `AlternativeDetail.tsx` |
| 15 · Produto salvo | `/salvo` | `Saved.tsx` |
| 12 · Histórico | `/historico` | `History.tsx` |
| 07 · Alertas | `/alertas` | `Alerts.tsx` |
| 14 · Personalizar alertas | `/alertas/personalizar` | `AlertSettings.tsx` |
| 10 · Perfil | `/perfil` | `Profile.tsx` |
| 11 · Planos | `/planos` | `Plans.tsx` |
| 09 · Gamificação | `/conquistas` | `Gamification.tsx` |
| 17 · Acessibilidade | `/acessibilidade` | `Accessibility.tsx` |

As telas marcadas como "(Pitch)" ou "(apoio)" no Figma mostram estados das telas acima (por exemplo, a Home depois de
algumas leituras) e acontecem naturalmente com o uso.

---

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
git clone <url-do-repositório>
cd NutriDecifra
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
```

Abra `.env.local` e preencha com os dados do Supabase do projeto (**Project Settings → API Keys**). Use apenas a chave
**publishable/anon**, nunca a `secret`/`service_role`.

```bash
npm run dev
```

Abra http://localhost:5173. No computador o app aparece numa moldura de celular.

> **Câmera no celular durante o desenvolvimento:** navegadores só liberam a câmera em `https` ou em `localhost`.
> Para testar o scanner no telefone, use o endereço publicado no Vercel ou toque em "Digitar o código" no scanner.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | gera a versão de produção em `dist/` |
| `npm run preview` | testa a versão de produção localmente |
| `npm run lint` | verifica o código |

---

## Banco de dados (Supabase)

Na primeira vez, rode o arquivo [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) inteiro no
**SQL Editor** do Supabase. Ele cria:

- `profiles`: nome, restrições, objetivo, limites de açúcar e sódio, acessibilidade (criado automaticamente no cadastro)
- `scans`: cada produto lido, com uma cópia dos dados do Open Food Facts
- `alerts`: alertas gerados para o perfil
- `points_events`: pontos ganhos (base da gamificação)

Todas as tabelas têm **RLS**: cada usuário só lê e altera os próprios dados.

### Autenticação

Em **Authentication → URL Configuration**:
- **Site URL:** o endereço do app publicado (ex.: `https://nutridecifra.vercel.app`)
- **Redirect URLs:** adicione `https://nutridecifra.vercel.app/**` e `http://localhost:5173/**`

**Login com Google (opcional):** crie credenciais OAuth no Google Cloud Console e ative o provedor em
**Authentication → Sign In / Providers → Google**. Enquanto não estiver ativo, o botão mostra "em breve".

---

## Publicar (Vercel)

1. Em [vercel.com](https://vercel.com), entre com o GitHub e clique em **Add New → Project**.
2. Importe este repositório. O Vercel detecta o Vite sozinho.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **Deploy**. Cada `git push` na branch `main` publica uma nova versão.

O arquivo `vercel.json` faz duas coisas: manda todas as rotas para o app (SPA) e encaminha `/off-search` para o serviço de
busca do Open Food Facts, que não aceita chamadas diretas do navegador.

---

## Pontos e conquistas

| Ação | Pontos |
|---|---|
| Salvar um produto | +10 |
| Salvar um produto com Nutri-Score A ou B | +20 |
| Trocar por uma alternativa melhor | +30 |
| Desafio da semana (salvar 5 produtos A/B de segunda a domingo) | +100 |

Níveis: Iniciante (0), Curioso dos Rótulos (100), Leitor Consciente (250), Decifrador (500), Decifrador Expert (1000),
Mestre dos Rótulos (2000), Lenda NutriDecifra (4000).

---

## Aviso

O NutriDecifra é informativo e não substitui a orientação de nutricionistas ou médicos. Os dados vêm de uma base
colaborativa: confira sempre o rótulo da embalagem, principalmente em caso de alergia.
