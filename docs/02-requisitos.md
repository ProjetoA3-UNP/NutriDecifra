# 2. Requisitos

## Requisitos funcionais

| ID | Requisito | Perfil | Onde |
|---|---|---|---|
| RF01 | Criar conta com e-mail e senha (confirmação por e-mail) | Todos | `Auth.tsx` |
| RF02 | Entrar com e-mail e senha; login com Google quando ativado no Supabase | Todos | `Auth.tsx` |
| RF03 | Recuperar a senha por e-mail e definir uma nova senha (com confirmação) | Todos | `ForgotPassword.tsx`, `ResetPassword.tsx` |
| RF04 | Abrir a tela inicial adequada ao perfil após o login | Todos | `App.tsx` (`RequireAuth`), `lib/roles.ts` |
| RF05 | Ler o código de barras pela câmera (EAN-13, EAN-8, UPC) ou digitá-lo | Consumidor | `Scanner.tsx` |
| RF06 | Buscar os dados do produto no Open Food Facts e avisar quando ele não existe | Consumidor | `Analyzing.tsx`, `lib/off.ts` |
| RF07 | Mostrar colheres de açúcar, cota diária, Nutri-Score e alertas do produto | Consumidor | `Result.tsx`, `lib/nutrition.ts` |
| RF08 | Gerar alertas personalizados pelas restrições e limites do perfil | Consumidor | `lib/nutrition.ts`, `lib/actions.ts` |
| RF09 | Sugerir alternativas da mesma categoria com Nutri-Score melhor e comparar | Consumidor | `Alternatives.tsx`, `AlternativeDetail.tsx` |
| RF10 | Salvar produto, favoritar e trocar por alternativa | Consumidor | `Result.tsx`, `lib/actions.ts` |
| RF11 | Histórico de leituras com filtros | Consumidor | `History.tsx` |
| RF12 | Central de alertas com filtros (críticos, atenção) | Consumidor | `Alerts.tsx` |
| RF13 | Personalizar restrições, limites de açúcar e sódio e alertas em tempo real | Consumidor | `AlertSettings.tsx` |
| RF14 | Pontos, níveis, sequência, conquistas e desafio da semana | Consumidor | `Gamification.tsx`, `lib/gamification.ts` |
| RF15 | Ajustes de acessibilidade (texto maior, contraste, voz, menos animação, linguagem simples) | Consumidor | `Accessibility.tsx` |
| RF16 | Baixar os próprios dados e apagar o histórico | Consumidor | `Profile.tsx` (Privacidade e dados) |
| RF17 | Autorizar e retirar o acesso de um nutricionista aos próprios dados | Consumidor | `Profile.tsx` (Meu nutricionista) |
| RF18 | Listar pacientes que autorizaram, com resumo de 30 dias | Nutricionista | `NutritionistHome.tsx` |
| RF19 | Ver a ficha do paciente (perfil, leituras, Nutri-Score, alertas), só leitura | Nutricionista | `PatientDetail.tsx` |
| RF20 | Encerrar o acompanhamento de um paciente | Nutricionista | `PatientDetail.tsx` |
| RF21 | Ver indicadores agregados da plataforma | Administrador | `AdminHome.tsx` (Visão geral) |
| RF22 | Buscar contas e definir o perfil de acesso de cada uma | Administrador | `AdminHome.tsx` (Contas e perfis) |
| RF23 | Ver os planos Free, Premium e Institucional ("em breve") | Consumidor | `Plans.tsx` |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | **Mobile first:** layout de 375 × 812 do Figma; no computador aparece numa moldura de celular. |
| RNF02 | **PWA:** pode ser instalado na tela inicial; a câmera funciona em HTTPS. |
| RNF03 | **Segurança:** todas as tabelas com Row Level Security; o app usa só a chave pública (anon). |
| RNF04 | **Privacidade (LGPD):** dados mínimos, exportação e exclusão pelo próprio usuário, compartilhamento só com consentimento. |
| RNF05 | **Acessibilidade:** rótulos `aria-*` nos botões de ícone, alvos de toque de 44 px, opções de texto maior e alto contraste. |
| RNF06 | **Desempenho:** telas carregadas sob demanda (lazy loading); a abertura carrega só Splash, Login e Home. |
| RNF07 | **Transparência:** toda informação nutricional vem do Open Food Facts; o app avisa quando um dado não existe. |
| RNF08 | **Manutenibilidade:** TypeScript estrito, lint (oxlint) e testes automatizados (Vitest). |
| RNF09 | **Código próprio:** desenvolvido em código (React + TypeScript), sem ferramentas low-code ou no-code. |

## Regras de negócio

| ID | Regra |
|---|---|
| RN01 | 1 colher de chá de açúcar = 4 g. A base é a porção declarada no rótulo; sem porção, 100 g/ml. |
| RN02 | O limite diário de açúcar padrão é 25 g (recomendação da OMS), ajustável entre 5 e 200 g. O limite de sódio padrão é 400 mg por porção, ajustável entre 50 e 5000 mg. |
| RN03 | Glúten ou lactose presentes + restrição marcada = alerta **crítico**. Traços = alerta de **atenção**. |
| RN04 | Açúcar ou sódio altos viram alerta **crítico** quando o usuário marcou essa restrição; senão, **atenção**. |
| RN05 | Com "Alertas em tempo real" ligado, o app pede confirmação antes de salvar um produto com alerta crítico. |
| RN06 | Ao passar de 80% da cota diária de açúcar com os produtos salvos no dia, o app gera um alerta. |
| RN07 | Pontos: salvar +10; salvar nota A/B +20; trocar por alternativa +30; desafio da semana +200. Cada ação pontua uma única vez. |
| RN08 | Desafio da semana: ler 5 produtos diferentes de segunda a domingo. |
| RN09 | Todo cadastro novo é **Consumidor**. Só um Administrador muda o perfil de uma conta, e nunca o próprio. |
| RN10 | O Nutricionista só vê os dados de quem o autorizou, apenas para leitura, e perde o acesso no instante em que o paciente retira a autorização. |
| RN11 | O Administrador vê apenas números agregados e a lista de contas; nunca as leituras ou os alertas de uma pessoa. |
| RN12 | Se uma conta deixa de ser Nutricionista, todos os vínculos dela com pacientes são encerrados. |
