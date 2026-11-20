# 1. Visão geral do produto

## Problema

Rótulos de alimentos são difíceis de entender. A tabela nutricional usa gramas e porcentagens de um "valor diário"
genérico, a lista de ingredientes traz nomes técnicos e os alertas de alergênicos ficam em letras pequenas. Na prática,
quem precisa evitar glúten, lactose, açúcar ou sódio, ou só quer comer melhor, não consegue decidir em segundos, na
prateleira, se um produto serve para si.

## Público-alvo

- **Consumidores** que querem escolher alimentos melhores no dia a dia, principalmente quem tem restrição (doença
  celíaca, intolerância à lactose, diabetes, hipertensão) ou uma meta (reduzir açúcar, reduzir sódio, evitar
  ultraprocessados).
- **Nutricionistas** e clínicas (plano Institucional/B2B) que acompanham pacientes e querem ver as escolhas reais deles
  entre as consultas.
- **A equipe que opera a plataforma** (administração), que precisa acompanhar o uso e gerenciar os acessos.

## Proposta de solução

O **NutriDecifra** é um web app para celular (PWA). A pessoa aponta a câmera para o código de barras e recebe, em
linguagem simples:

- **quantas colheres de açúcar** a porção tem (açúcar ÷ 4 g);
- **quanto da cota diária** de açúcar isso representa, com base no limite que ela definiu;
- **alertas personalizados** pelo perfil dela (glúten, lactose, açúcar, sódio, aditivos);
- **alternativas melhores** da mesma categoria, com Nutri-Score superior.

As boas escolhas viram pontos, níveis e conquistas, e o histórico pode ser compartilhado, com autorização, com o
nutricionista.

## Diferencial e proposta de valor

| Para quem | Valor |
|---|---|
| Consumidor | Traduz o rótulo em algo concreto ("7 colheres de açúcar", "85% da sua cota") e personalizado (alerta só o que importa para o seu perfil), em segundos. |
| Nutricionista | Vê as escolhas reais do paciente entre as consultas, sem depender da memória dele, com consentimento e só para leitura. |
| Plataforma | Dados agregados sobre o que as pessoas consomem, sem expor ninguém individualmente. |

O que diferencia o app de uma simples leitura da tabela nutricional:

1. **Personalização:** o mesmo produto gera alertas diferentes para pessoas diferentes.
2. **Medida caseira:** colheres em vez de gramas.
3. **Ação imediata:** além de dizer o que está ruim, mostra o que comprar no lugar.
4. **Dados reais e transparentes:** tudo vem da base aberta Open Food Facts. Se o produto não está lá, o app diz isso e
   não inventa dados.

## Perfis (personas)

| Perfil | Persona | Tela inicial |
|---|---|---|
| **Consumidor** | Carla, 34 anos, celíaca, quer reduzir açúcar. Lê rótulos no mercado com o celular. | `/inicio` (Home do Figma) |
| **Nutricionista** | Dra. Nina, atende em clínica e acompanha pacientes com restrições alimentares. | `/profissional` (Meus pacientes) |
| **Administrador** | Alex, da equipe NutriDecifra, acompanha o uso da plataforma e define quem é nutricionista. | `/admin` (Painel) |

Os detalhes de permissões estão em [05-perfis-e-permissoes.md](05-perfis-e-permissoes.md).

## Jornadas principais (roteiro de demonstração)

**Consumidor**
1. Abre o app (Splash → Onboarding) e cria a conta.
2. Em *Personalizar alertas*, marca glúten e define o limite de açúcar.
3. Escaneia um produto → *Analisando* → *Resultado* com colheres, cota diária e alertas.
4. Toca em *Ver alternativas* e troca por um produto nota A ou B → *Produto salvo* com pontos.
5. Vê o *Histórico*, os *Alertas* e as *Conquistas*.
6. Em *Perfil → Meu nutricionista*, autoriza a Dra. Nina pelo e-mail dela.

**Nutricionista**
1. Entra com a conta de nutricionista e cai em *Meus pacientes*.
2. Vê os números dos últimos 30 dias de cada paciente e abre a *Ficha do paciente*.
3. Lê as últimas leituras, a distribuição do Nutri-Score e os alertas críticos.
4. Se quiser, encerra o acompanhamento.

**Administrador**
1. Entra com a conta de administrador e cai no *Painel do administrador*.
2. Em *Visão geral*, vê totais, leituras por dia, Nutri-Score e produtos mais lidos.
3. Em *Contas e perfis*, busca uma conta e muda o perfil dela para Nutricionista.

**Recuperação de senha (qualquer perfil)**
*Login → Esqueci minha senha → e-mail com link → Nova senha (com confirmação) → tela inicial do perfil.*
