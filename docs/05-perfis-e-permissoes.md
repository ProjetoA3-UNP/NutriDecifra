# 5. Perfis e permissões

O NutriDecifra tem **três perfis de acesso**. Todos entram pela mesma tela de login. O perfil fica gravado no banco
(`profiles.role`) e decide a tela inicial e o que a conta pode ler e alterar.

| Perfil | Tela inicial | Em uma frase |
|---|---|---|
| **Consumidor** (`consumer`) | Home (`/inicio`) | Usa o app do Figma: lê rótulos, recebe alertas, salva, ganha pontos. |
| **Nutricionista** (`nutritionist`) | Meus pacientes (`/profissional`) | Acompanha, só para leitura, quem autorizou. É o plano Institucional (B2B) do Figma. |
| **Administrador** (`admin`) | Painel (`/admin`) | Vê números gerais e define o perfil de cada conta. |

## Como uma conta vira cada perfil

1. **Todo cadastro novo é Consumidor.** O valor padrão da coluna é `consumer`, e o app não consegue gravar outro valor,
   porque a coluna `role` não está na lista de colunas que o usuário pode alterar.
2. **O primeiro Administrador** é definido uma única vez pelo SQL Editor:
   `update public.profiles set role = 'admin' where email = '...';`
3. **Os demais perfis** são definidos pelo Administrador na tela *Contas e perfis* (função `admin_set_role`).
4. Para demonstração, `npm run seed:demo` cria as três contas prontas (veja o README).

## Matriz de permissões

| Ação | Consumidor | Nutricionista | Administrador |
|---|:---:|:---:|:---:|
| Escanear, ver resultado, alternativas | Sim | Não | Não |
| Ler e alterar o **próprio** perfil (restrições, metas, acessibilidade) | Sim | Só nome | Só nome |
| Alterar o **próprio** perfil de acesso ou plano | Não | Não | Não |
| Ler o próprio histórico, alertas e pontos | Sim | Não (não usa) | Não (não usa) |
| Exportar e apagar o próprio histórico | Sim | Não | Não |
| Autorizar ou retirar um nutricionista | Sim | Não | Não |
| Ler perfil, leituras e alertas de **pacientes que autorizaram** | Não | Sim, só leitura | Não |
| Alterar dados de pacientes | Não | Não | Não |
| Encerrar o acompanhamento de um paciente | Não | Sim | Não |
| Ver números agregados da plataforma | Não | Não | Sim |
| Ver a lista de contas (nome, e-mail, perfil) | Não | Não | Sim |
| Ver leituras e alertas de outras pessoas | Não | Só pacientes | **Não** |
| Mudar o perfil de acesso de outra conta | Não | Não | Sim |

## Onde cada regra é garantida

As regras ficam em **duas camadas**:

1. **Navegação (app):** `RequireAuth` em `App.tsx` usa `canAccess(perfil, rota)` de `lib/roles.ts`. Quem abre uma rota de
   outro perfil volta para a própria tela inicial. Isso é só experiência de uso.
2. **Banco (a regra de verdade):** Row Level Security do Postgres e permissões por coluna. Mesmo que alguém chame a API
   direto com o próprio token, o banco só devolve o que a política permite.

### Políticas RLS

| Tabela | Política | Regra |
|---|---|---|
| `profiles` | ler o próprio / alterar o próprio / criar o próprio | `auth.uid() = id` |
| `profiles` | admin lê todos | `is_admin()` |
| `profiles` | nutricionista lê pacientes | `is_my_patient(id)` |
| `scans`, `alerts` | tudo nos próprios | `auth.uid() = user_id` |
| `scans`, `alerts` | nutricionista lê pacientes (só `select`) | `is_my_patient(user_id)` |
| `points_events` | ler e registrar os próprios (até 200 pontos), sem editar nem apagar | `auth.uid() = user_id` |
| `care_links` | ler os meus | paciente, nutricionista ou admin |
| `care_links` | encerrar | qualquer lado pode mudar para `revoked`; só o paciente reativa |

`is_my_patient(id)` só é verdadeira se quem consulta **tem perfil de nutricionista** e existe um vínculo **ativo** com
aquele paciente. Quando o paciente retira a autorização, a próxima consulta já não devolve nada.

### Permissões por coluna

```sql
grant insert (id, email, name) on profiles to authenticated;
grant update (name, restrictions, goal, sugar_limit_g, sodium_limit_mg,
              realtime_alerts, notifications, accessibility) on profiles to authenticated;
```

`role` e `plan` ficam fora dessas listas, então ninguém consegue se promover pela API.

### Funções com verificação de perfil

- `admin_overview()` e `admin_set_role()` começam com `if not is_admin() then raise exception`.
- `admin_set_role()` recusa mudar o próprio perfil, o que impede a plataforma de ficar sem administrador por engano.
  Ao tirar alguém do perfil Nutricionista, a função encerra os vínculos dessa pessoa.
- `link_nutritionist()` só aceita chamadas de Consumidor e só vincula contas que realmente são Nutricionista.

## Por que o Administrador não vê os dados individuais

O que uma pessoa come e as restrições dela (doença celíaca, diabetes...) são **dados pessoais sensíveis de saúde**
(LGPD, art. 5º, II). Para operar a plataforma, o administrador não precisa deles: os indicadores são agregados no próprio
banco (`admin_overview`) e só os totais saem de lá. Quem vê o detalhe é o próprio titular e, com o consentimento dele, o
nutricionista.
