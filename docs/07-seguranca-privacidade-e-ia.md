# 7. Segurança, privacidade e uso responsável

## Segurança

| Medida | Como foi feita |
|---|---|
| Autenticação | Supabase Auth: senha com hash, e-mail de confirmação, recuperação por link de uso único, sessão por JWT |
| Autorização | Row Level Security em **todas** as tabelas e permissões por coluna (veja o documento 05) |
| Chaves | O app usa só a chave pública (*publishable/anon*). A chave *service_role* fica só no `.env.local` de quem roda o seed e nunca vai para o GitHub nem para o Vercel |
| Segredos fora do Git | O `.gitignore` ignora `.env` e `.env.*` (menos o `.env.example`, que não tem valores reais) |
| Funções do banco | `security definer` com `search_path` vazio, verificação de perfil no início e `execute` liberado só para usuários logados |
| Escalada de privilégio | `role` e `plan` não podem ser alterados pela API; o administrador não pode mudar o próprio perfil |
| Pontos | Não podem ser editados nem apagados; cada ação pontua uma vez (`unique`) e há teto de 200 por evento |
| Transporte | HTTPS (Vercel e Supabase); a câmera só funciona em contexto seguro |

## Privacidade (LGPD)

- **Dados mínimos:** nome, e-mail, restrições, metas, produtos lidos, alertas e pontos. Não guardamos imagens da câmera:
  ela serve apenas para ler o código de barras.
- **Dados sensíveis de saúde** (restrições alimentares) ficam visíveis só para o titular e para o nutricionista que ele
  autorizar.
- **Consentimento explícito:** para compartilhar com um nutricionista, o paciente informa o e-mail e marca a autorização.
  Ele pode retirar o acesso a qualquer momento, com efeito imediato.
- **Direitos do titular** (*Perfil → Privacidade e dados*): baixar todos os dados (JSON) e apagar o histórico.
  Se a conta for excluída (em *Authentication → Users* no Supabase), todos os dados dela são apagados em cascata
  (`on delete cascade`).
- **Administração sem acesso individual:** o administrador vê só totais.

## Uso responsável

- O app avisa que é **informativo** e **não substitui** nutricionista ou médico (Ajuda, Resultado e área do
  nutricionista).
- Os dados vêm de uma base colaborativa e podem ter erros. Por isso o app pede que, em caso de alergia, a pessoa confira
  sempre a embalagem.
- Quando um dado não existe (produto fora da base, açúcar não informado), o app diz isso e não estima nem inventa.
- A gamificação premia boas escolhas, sem punições nem comparação com outras pessoas.

## Inteligência artificial e automação

O NutriDecifra **não usa IA generativa nem modelos de aprendizado de máquina**. Toda análise é feita por **regras
determinísticas e explicáveis**, documentadas e testadas:

| Automação | Regra |
|---|---|
| Colheres de açúcar | açúcar da porção ÷ 4 g |
| Cota diária | açúcar da porção ÷ limite do perfil |
| Alertas personalizados | restrições do perfil × alérgenos, traços e `nutrient_levels` do Open Food Facts |
| Alternativas | mesma categoria do Open Food Facts, Nutri-Score melhor, priorizando produtos vendidos no Brasil |
| Gamificação | pontos fixos por ação, níveis por faixa de pontos, desafio semanal |

Isso foi uma escolha de projeto: em saúde, a pessoa precisa entender **por que** recebeu um alerta. A mesma entrada
sempre produz a mesma saída, e cada regra pode ser conferida no código (`src/lib/nutrition.ts`) e nos testes.

A leitura em voz alta (Acessibilidade) usa a síntese de voz do próprio navegador (`speechSynthesis`), sem enviar dados
para fora.
