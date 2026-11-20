# NutriDecifra

**Decifre o que você come.** O NutriDecifra é um web app para celular: você lê o código de barras de um produto com a
câmera e vê, em linguagem simples, quantas colheres de açúcar ele tem, quanto da sua cota diária isso representa,
alertas personalizados (glúten, lactose, açúcar, sódio, aditivos) e alternativas mais saudáveis da mesma categoria.

O visual segue o arquivo do Figma **"NutriDecifra — Apresentação (cópia)"**.

> **App publicado:** _(cole aqui o endereço do Vercel depois de publicar; veja [Publicar](#publicar-vercel))_

---

## Perfis de acesso

| Perfil | Tela inicial | O que faz |
|---|---|---|
| **Consumidor** | Home | Lê rótulos, recebe alertas, vê alternativas, salva produtos, ganha pontos e conquistas. Pode autorizar um nutricionista. |
| **Nutricionista** | Meus pacientes | Acompanha, só para leitura, as leituras e os alertas dos pacientes que autorizaram (plano Institucional/B2B). |
| **Administrador** | Painel do administrador | Vê números gerais da plataforma e define o perfil de cada conta. Não vê dados individuais. |

Todos entram pela mesma tela de login. As regras de acesso são garantidas no banco (Row Level Security). Detalhes em
[docs/05-perfis-e-permissoes.md](docs/05-perfis-e-permissoes.md).

---

## O que é real no app

| Recurso | De onde vem |
|---|---|
| Dados do produto (nome, marca, tabela nutricional, alérgenos, aditivos, Nutri-Score, NOVA) | [Open Food Facts](https://world.openfoodfacts.org), base aberta e colaborativa de alimentos |
| Alternativas | Produtos reais da mesma categoria com Nutri-Score melhor, priorizando os vendidos no Brasil (Open Food Facts) |
| Colheres de açúcar | Açúcar da porção declarada (ou de 100 g) ÷ 4 g, que é uma colher de chá |
| Cota diária de açúcar | Açúcar da porção ÷ seu limite diário (padrão de 25 g, recomendação da OMS; ajustável) |
| "Alto em" açúcar, gordura saturada e sal | Classificação `nutrient_levels` do Open Food Facts |
| Contas, perfis, histórico, alertas, pontos, acompanhamento nutricional | Supabase (Postgres com RLS) |

Se um produto não estiver na base, o app diz isso e não inventa dados. O app não usa IA generativa: todas as análises
são regras explicáveis e testadas (veja [docs/07](docs/07-seguranca-privacidade-e-ia.md)).

**Ainda não disponível ("Em breve"):** assinatura do plano Premium, contratação do plano Institucional pelo app e login
com Apple (exige conta paga de desenvolvedor Apple). Enquanto o Premium não é lançado, todos os recursos ficam liberados
para todos.

---

## Tecnologias

- [React 19](https://react.dev) + TypeScript + [Vite](https://vite.dev), sem ferramentas low-code ou no-code
- [Tailwind CSS 4](https://tailwindcss.com), com as cores do Figma em `src/index.css`
- Ícones [Lucide](https://lucide.dev) (SVG), mais dois ícones próprios (colher e saleiro)
- [Supabase](https://supabase.com): login (e-mail/senha, Google e recuperação de senha) e banco Postgres com RLS
- [ZXing](https://github.com/zxing-js/browser) para ler códigos de barras (EAN-13, EAN-8, UPC) pela câmera
- PWA: pode ser instalado na tela inicial do celular
- [Vitest](https://vitest.dev) (testes) e [oxlint](https://oxc.rs) (lint)

---

## Como rodar no seu computador

### 1. Pré-requisitos

- [Node.js](https://nodejs.org) **20.6 ou mais recente** (`node -v` para conferir)
- [Git](https://git-scm.com)
- Uma conta gratuita no [Supabase](https://supabase.com)

### 2. Baixar o projeto e instalar as dependências

```bash
git clone https://github.com/ProjetoA3-UNP/NutriDecifra.git
cd NutriDecifra
npm install
```

### 3. Criar o banco no Supabase

1. No [painel do Supabase](https://supabase.com/dashboard), clique em **New project**, dê um nome e escolha uma senha
   para o banco.
2. Abra **SQL Editor → New query**, cole o conteúdo de
   [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) e clique em **Run**.
3. Faça o mesmo com [`supabase/migrations/002_perfis_e_permissoes.sql`](supabase/migrations/002_perfis_e_permissoes.sql).
   **A ordem importa:** primeiro o 001, depois o 002.
4. Em **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:5173` (depois de publicar, troque pelo endereço do Vercel)
   - **Redirect URLs:** adicione `http://localhost:5173/**` e, depois de publicar, `https://SEU-APP.vercel.app/**`

   Sem isso, os links de confirmação de e-mail e de recuperação de senha não voltam para o app.

### 4. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local      # no Windows (PowerShell): copy .env.example .env.local
```

Abra `.env.local` e preencha com os dados de **Project Settings → API Keys** do Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Use **apenas** a chave *publishable/anon* nessas duas linhas. O `.env.local` nunca vai para o GitHub.

### 5. Rodar

```bash
npm run dev
```

Abra http://localhost:5173. No computador o app aparece numa moldura de celular.

> **Câmera no celular durante o desenvolvimento:** navegadores só liberam a câmera em `https` ou em `localhost`. Para
> testar o scanner no telefone, use o endereço publicado no Vercel ou toque em "Digitar o código" no scanner.

### 6. Criar as contas de demonstração (uma por perfil)

Adicione ao `.env.local` (essas linhas ficam só no seu computador):

```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...     # Project Settings → API Keys → secret / service_role
DEMO_PASSWORD=escolha-uma-senha
```

```bash
npm run seed:demo
```

| Perfil | E-mail | Senha |
|---|---|---|
| Consumidor | `consumidor.demo@nutridecifra.app` | a de `DEMO_PASSWORD` |
| Nutricionista | `nutricionista.demo@nutridecifra.app` | a de `DEMO_PASSWORD` |
| Administrador | `admin.demo@nutridecifra.app` | a de `DEMO_PASSWORD` |

O script já vincula a consumidora à nutricionista. Pode rodá-lo de novo: ele só atualiza as contas.

**Sem o script:** cadastre-se pelo app (toda conta nova é Consumidor) e transforme a sua conta em administrador no
SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

Depois disso, o próprio administrador define os outros perfis na tela *Contas e perfis*.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento em http://localhost:5173 |
| `npm test` | testes automatizados (cálculos, gamificação, perfis e permissões) |
| `npm run lint` | verifica o código |
| `npm run build` | checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | testa a versão de produção localmente |
| `npm run seed:demo` | cria as contas de demonstração |

### Problemas comuns

| Sintoma | Solução |
|---|---|
| Tela "Configuração pendente" | Falta o `.env.local` ou ele está com nomes errados. Reinicie o `npm run dev` depois de criar. |
| `Port 5173 is already in use` | Outro programa usa a porta 5173. Feche-o, ou rode `npm run dev -- --port 5174` e adicione essa porta nas Redirect URLs. |
| Link do e-mail abre `localhost:3000` ou dá erro | Confira a **Site URL** e as **Redirect URLs** do passo 3. |
| Seed: "A coluna role não existe" | Rode o `002_perfis_e_permissoes.sql` no SQL Editor. |
| Login com Google mostra "em breve" | O provedor Google não está ativado no Supabase (opcional; veja abaixo). |

**Login com Google (opcional):** crie credenciais OAuth no Google Cloud Console e ative o provedor em
**Authentication → Sign In / Providers → Google**. Enquanto não estiver ativo, o botão mostra "em breve".

---

## Publicar (Vercel)

1. Em [vercel.com](https://vercel.com), entre com o GitHub e clique em **Add New → Project**.
2. Importe este repositório. O Vercel detecta o Vite sozinho.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (nunca a `service_role`).
4. Clique em **Deploy**. Cada `git push` na branch `main` publica uma nova versão.
5. No Supabase, atualize a **Site URL** e as **Redirect URLs** com o endereço do Vercel, e cole o link no topo deste
   README.

O arquivo `vercel.json` faz duas coisas: manda todas as rotas para o app (SPA) e encaminha `/off-search` para o serviço
de busca do Open Food Facts, que não aceita chamadas diretas do navegador.

---

## Estrutura

```
src/
  App.tsx           rotas e proteção por perfil
  screens/          uma tela por arquivo
  components/       peças reutilizáveis (ui, ícones, área profissional, campo de senha)
  context/          sessão, perfil e dados carregados do Supabase
  lib/              regras de negócio (nutrition, gamification, roles, care, admin, actions, off) + testes
supabase/migrations/ 001 estrutura do banco · 002 perfis e permissões
scripts/            seed-demo.mjs (contas de demonstração) · make-icons.mjs (ícones do PWA)
docs/               documentação técnica
```

| Tela | Rota | Arquivo | Perfil |
|---|---|---|---|
| 01 · Início da apresentação | `/` | `Splash.tsx` | público |
| 02 · Onboarding | `/boas-vindas` | `Onboarding.tsx` | público |
| 03 · Login / 03b · Cadastro | `/entrar`, `/cadastrar` | `Auth.tsx` | público |
| Esqueci minha senha | `/recuperar-senha` | `ForgotPassword.tsx` | público |
| Nova senha | `/redefinir-senha` | `ResetPassword.tsx` | público |
| 04 · Home | `/inicio` | `Home.tsx` | Consumidor |
| 05 · Scanner | `/scanner` | `Scanner.tsx` | Consumidor |
| 13 · Analisando rótulo | `/analisando/:codigo` | `Analyzing.tsx` | Consumidor |
| 06 · Resultado | `/resultado/:id` | `Result.tsx` | Consumidor |
| 08 · Alternativas | `/alternativas/:id` | `Alternatives.tsx` | Consumidor |
| 16 · Detalhe alternativa | `/alternativas/:id/:codigo` | `AlternativeDetail.tsx` | Consumidor |
| 15 · Produto salvo | `/salvo` | `Saved.tsx` | Consumidor |
| 12 · Histórico | `/historico` | `History.tsx` | Consumidor |
| 07 · Alertas | `/alertas` | `Alerts.tsx` | Consumidor |
| 14 · Personalizar alertas | `/alertas/personalizar` | `AlertSettings.tsx` | Consumidor |
| 10 · Perfil (com *Meu nutricionista*) | `/perfil` | `Profile.tsx` | Consumidor |
| 11 · Planos | `/planos` | `Plans.tsx` | Consumidor |
| 09 · Gamificação | `/conquistas` | `Gamification.tsx` | Consumidor |
| 17 · Acessibilidade | `/acessibilidade` | `Accessibility.tsx` | Consumidor |
| Meus pacientes | `/profissional` | `NutritionistHome.tsx` | Nutricionista |
| Ficha do paciente | `/profissional/paciente/:id` | `PatientDetail.tsx` | Nutricionista |
| Painel do administrador | `/admin` | `AdminHome.tsx` | Administrador |

As telas marcadas como "(Pitch)" ou "(apoio)" no Figma mostram estados das telas acima (por exemplo, a Home depois de
algumas leituras) e acontecem naturalmente com o uso.

---

## Banco de dados

| Tabela | Conteúdo |
|---|---|
| `profiles` | nome, perfil de acesso, restrições, objetivo, limites de açúcar e sódio, acessibilidade (criado no cadastro) |
| `scans` | cada produto lido, com uma cópia dos dados do Open Food Facts |
| `alerts` | alertas gerados para o perfil |
| `points_events` | pontos ganhos (base da gamificação) |
| `care_links` | autorização do paciente para um nutricionista ver seus dados |

Todas as tabelas têm **RLS**. Modelo, dicionário de dados e funções em [docs/04-banco-de-dados.md](docs/04-banco-de-dados.md).

---

## Pontos e conquistas

| Ação | Pontos |
|---|---|
| Salvar um produto | +10 |
| Salvar um produto com Nutri-Score A ou B | +20 |
| Trocar por uma alternativa melhor | +30 |
| Desafio da semana (ler 5 produtos diferentes de segunda a domingo) | +200 |

Níveis: Iniciante (0), Curioso dos rótulos (150), Explorador (400), Decifrador atento (800), Decifrador expert (1800),
Mestre dos rótulos (3500), Lenda NutriDecifra (6000).

---

## Documentação técnica

| Documento | Conteúdo |
|---|---|
| [01 · Visão geral](docs/01-visao-geral.md) | problema, público-alvo, proposta de valor, personas e jornadas |
| [02 · Requisitos](docs/02-requisitos.md) | requisitos funcionais e não funcionais, regras de negócio |
| [03 · Arquitetura](docs/03-arquitetura.md) | diagrama, tecnologias, pastas, rotas por perfil |
| [04 · Banco de dados](docs/04-banco-de-dados.md) | modelo ER, dicionário de dados, funções e gatilhos |
| [05 · Perfis e permissões](docs/05-perfis-e-permissoes.md) | matriz de permissões e políticas RLS |
| [06 · Testes](docs/06-testes.md) | testes automatizados, roteiro manual, teste em outro ambiente |
| [07 · Segurança, privacidade e IA](docs/07-seguranca-privacidade-e-ia.md) | segurança, LGPD, uso responsável, automação |

---

## Aviso

O NutriDecifra é informativo e não substitui a orientação de nutricionistas ou médicos. Os dados vêm de uma base
colaborativa: confira sempre o rótulo da embalagem, principalmente em caso de alergia.
