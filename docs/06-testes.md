# 6. Testes

## Testes automatizados

```bash
npm test
```

O comando roda o [Vitest](https://vitest.dev) sobre as regras de negócio, que não dependem de rede nem de banco:

| Arquivo | O que verifica |
|---|---|
| `src/lib/nutrition.test.ts` | Colheres de açúcar, base da porção ou de 100 g, cota diária, conversão sal → sódio, alertas por restrição (crítico × atenção), limite pessoal de sódio, aditivos/ultraprocessado, produto sem alertas |
| `src/lib/gamification.test.ts` | Níveis e progresso, soma de pontos, sequência de dias (hoje, ontem, quebra), maior sequência, escolhas saudáveis, conquistas, desafio da semana (produtos repetidos contam uma vez) |
| `src/lib/roles.test.ts` | Tela inicial de cada perfil; quem pode abrir cada rota (consumidor × nutricionista × admin); resumo de 30 dias dos pacientes; busca de contas sem diferenciar acentos |

Outras verificações automáticas:

```bash
npm run lint    # oxlint
npm run build   # checagem de tipos (TypeScript) + build de produção
```

## Roteiro de testes manuais (aceitação)

Use as contas criadas por `npm run seed:demo` (veja o README). Marque cada item.

### Login e senha
- [ ] Cadastrar uma conta nova → chega o e-mail de confirmação → depois de confirmar, entra como **Consumidor**.
- [ ] Senha errada mostra "E-mail ou senha incorretos."
- [ ] O ícone de olho mostra e esconde a senha.
- [ ] *Esqueci minha senha* → informar e-mail → chega o link → *Nova senha* com confirmação → entra na tela inicial do perfil.
- [ ] Abrir um link de redefinição já usado mostra "O link expirou" e o botão *Pedir novo link*.

### Consumidor (`consumidor.demo@nutridecifra.app`)
- [ ] Entra na **Home**.
- [ ] Scanner: ler o código de barras de um produto em mãos (ou usar *Digitar o código*) → *Analisando* → *Resultado*.
- [ ] O resultado mostra colheres e cota diária. Num produto com muito açúcar, o alerta de açúcar aparece como
      **crítico**, porque a conta tem restrição de açúcar.
- [ ] *Ver alternativas* → abrir uma → *Trocar* → *Produto salvo* com pontos.
- [ ] Histórico, Alertas (filtros), Conquistas e Acessibilidade abrem e voltam corretamente.
- [ ] *Perfil → Meu nutricionista* mostra a Dra. Nina como autorizada.
- [ ] Digitar `/admin` ou `/profissional` na barra de endereço volta para a Home.

### Nutricionista (`nutricionista.demo@nutridecifra.app`)
- [ ] Entra em **Meus pacientes** e vê a Carla.
- [ ] Abre a **Ficha do paciente**: restrições, meta, leituras, Nutri-Score e alertas aparecem.
- [ ] Digitar `/inicio` ou `/admin` volta para *Meus pacientes*.
- [ ] Com a conta da Carla, retirar o acesso → na conta da nutricionista, a paciente some da lista.

### Administrador (`admin.demo@nutridecifra.app`)
- [ ] Entra no **Painel do administrador** e vê os números e os gráficos.
- [ ] *Contas e perfis*: buscar a Carla e mudar para Nutricionista (e voltar para Consumidor).
- [ ] Os botões do próprio administrador ficam desabilitados.
- [ ] Digitar `/inicio` volta para o Painel.

### Segurança no banco (SQL Editor do Supabase)
Para simular um usuário logado no SQL Editor, rode cada bloco separadamente, trocando o id pelo da conta
consumidora (*Authentication → Users*). O `rollback` desfaz tudo no final.

```sql
-- 1) tentar se promover a administrador: deve falhar com "permission denied"
begin;
select set_config('request.jwt.claims', '{"sub":"<uuid-da-consumidora>","role":"authenticated"}', true);
set local role authenticated;
update public.profiles set role = 'admin' where id = auth.uid();
rollback;

-- 2) ver só as próprias leituras: o total deve ser igual ao do histórico dela no app
begin;
select set_config('request.jwt.claims', '{"sub":"<uuid-da-consumidora>","role":"authenticated"}', true);
set local role authenticated;
select count(*) from public.scans;
rollback;

-- 3) abrir os números do administrador: deve falhar com "Acesso restrito a administradores."
begin;
select set_config('request.jwt.claims', '{"sub":"<uuid-da-consumidora>","role":"authenticated"}', true);
set local role authenticated;
select public.admin_overview();
rollback;
```

## Teste em outro ambiente

Antes da entrega, uma pessoa da equipe que **não** desenvolveu o projeto deve, em outro computador:

1. Clonar o repositório público.
2. Seguir o README do zero: `npm install`, `.env.local`, `npm run dev`.
3. Rodar `npm test` e `npm run build`.
4. Entrar com as três contas de demonstração e seguir o roteiro acima.
5. Anotar qualquer passo do README que não funcionou e corrigir o README.
