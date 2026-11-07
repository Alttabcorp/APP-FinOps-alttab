# Contas da casa (Alttab FinOps)

Versão web da lógica de organização das contas da casa, que antes vivia numa planilha (`Contas.xlsx`, hoje só um modelo de referência). O app responde a uma pergunta por mês: **de tudo que entrou, o que vai para contas, cartão, investimentos e gasto pessoal, e o que ainda falta fazer.**

## Plano de negócio

### Problema

A planilha exigia refazer fórmulas todo mês, não avisava quando algo estourava e não deixava marcar o que já foi pago ou depositado.

### Objetivo

Um caderno mensal simples, para um casal, que:

1. calcula sozinho quanto sobra e para onde cada real deve ir;
2. mostra o que falta pagar e depositar;
3. guarda o histórico mês a mês;
4. avisa quando o mês está no vermelho ou o cartão passou do teto.

### Usuários

Uma casa (duas pessoas), acessando pela rede local em `http://<ip-do-servidor>:3000`. Não há login. O dado fica no Postgres do servidor.

### Fluxo mensal

1. Abrir o app: a página inicial leva ao mês atual (`/meses/AAAA-MM`).
2. Responder "Sobrou algo do mês passado?" (soma a sobra ao saldo do mês novo).
3. Lançar **entradas** (saldo, vales, rendimentos).
4. Lançar e marcar **contas** como pagas (fixas, avulsas, anuais, compras no cartão).
5. Conferir o **cartão** (fatura × teto) e marcar "Fatura paga".
6. Marcar os **investimentos** como depositados (poupança, fundo imobiliário, empresa, meta).
7. Acompanhar as **pendências** no topo de "Fechar o mês" e **fechar o mês** quando estiver tudo certo.

### Telas

A tela inicial (`/`, aceita `?mes=AAAA-MM`) mostra o mês atual: quanto ganhou, gasto do mês, teto do cartão, sugestão de poupança, barra de progresso do objetivo (conta META, padrão R$ 10.000) e o checklist do que já foi pago (contas, fatura, poupança, fundo imobiliário, Alttab e objetivo).

O detalhe vive em `/meses/AAAA-MM`, com cinco abas:

| Aba | Para que serve |
| --- | --- |
| Fechar o mês | Pendências, resumo (ganhou, gastou, resultado), ordem do caixa, investimentos sugeridos, gráfico do ano |
| Entradas | Saldo (empregos, bicos), vales, rendimentos, fontes de renda |
| Gastos | Contas do mês, feira, gasolina, gasto pessoal, regras do mês |
| Investimentos | Aportes do mês com o valor sugerido, o real e o "feito"; objetivos das contas; histórico |
| Cartão | Fatura do mês, gastos fixos, compras parceladas, "Fatura paga" |

As rotas antigas (`/entradas`, `/contas`, `/cartao` e outras) redirecionam para a aba correspondente.

## Regras de negócio

Todas as regras ficam em `lib/domain/financeiro`, isoladas de Next e do banco, com testes em `*.test.ts`.

### Entradas

- **Saldo**: dinheiro que entra (empregos). Base para poupança e caixa.
- **Extras**: vale-transporte, vale-alimentação e proventos (fundo e poupança). O papel de cada extra é inferido pelo nome (`inferirPapelExtra`) quando não informado.
- `ganhou` = saldo + extras.

### Saídas do mês

- **Gasto mensal** = contas fixas + extras do mês (avulsas) + contas anuais.
- `gasto` (total) = gasto mensal + total investido + feira + fatura do cartão + gasolina.
- `sobrou` = `ganhou` − `gasto`.
- **Caixa operacional** = saldo + vale-transporte.
- **Caixa das contas** (`saldoContas`) = caixa operacional + rendimento usado nas contas − gasto mensal.

### Sugestões (valor sugerido × valor real)

| Item | Sugestão |
| --- | --- |
| Feira | Valor do vale-alimentação |
| Gasolina | Valor do vale-transporte |
| Poupança | 10% do saldo + rendimento da poupança reinvestido (editável) |
| Fundo imobiliário | R$ 50 de aporte + rendimento do fundo reaplicado |
| Empresa (Alttab) | R$ 100 por mês |
| Cartão (teto) | Caixa das contas − total investido |

Em mês apertado (veja abaixo) o aporte do fundo e da empresa vai a zero.

### Rendimento (proventos)

- Se o caixa cobre contas e cartão, o rendimento é **reinvestido** (fundo e poupança).
- Se o caixa **não cobre** (mês apertado), o rendimento vai primeiro para as contas: primeiro o da poupança, depois o do fundo, só até cobrir a falta.
- **Fundo**: quando o provento chega a R$ 100, 50% volta ao fundo e os outros 50% ficam para o mês seguinte. Abaixo disso, tudo é reaplicado.

### Cartão

- **Fatura** = gastos fixos + parcelas do mês + gasto avulso.
- **Teto** = caixa das contas − total investido (nunca negativo).
- **Disponível** = teto − fixos − parcelas. **Cabe** = teto − fatura.
- A fatura passa do teto → alerta crítico.
- **Compra parcelada**: valor total ÷ parcelas; a última parcela absorve o centavo de arredondamento. A parcela aparece na fatura de cada mês do prazo e some depois (mostrada como `1/3`, `2/3`…).
- Compra sem parcelas = 1x no mês escolhido.
- **Gastos fixos** do cartão (assinaturas) repetem todo mês até serem removidos.
- Remover uma compra ou gasto fixo do cartão apaga o item de todos os meses (por isso pede confirmação).

### Ordem do caixa (prioridade)

O caixa é gasto nesta ordem; o que faltar em cada etapa aparece como pendência:

1. Contas fixas
2. Cartão
3. Poupança
4. Feira (o vale-alimentação cobre primeiro)
5. Investimento (fundo + empresa)
6. Gastos pessoais
7. Repor a retirada (devolução de empréstimo da meta)
8. Meta / investimento (o que sobrar)

### Divisão da sobra

Depois das etapas 1 a 5, da sobra:

- **10%** vai para a objetivo de 10,000,00;
- o restante é dividido em **dois gastos individuais de 45% cada**;
- se houver um gasto pessoal definido nas preferências, ele é usado no lugar dos 45%.

Se o mês fecha no vermelho, o app não sugere depósito na meta.

### Contas

- **Só este mês**: avulsa (por exemplo IPTV, Magazine). Não se repete.
- **Todo mês (fixa)**: volta nos meses seguintes com o valor copiado do mês anterior.
- **Anual** (IPTU, IPVA, domínio): informa valor do ano, mês e dia da cobrança e em quantos meses juntar. O app sugere guardar um pedaço por mês até a cobrança (a última parcela absorve o arredondamento). A sugestão é "meses até a cobrança".
- **Cartão**: entra na fatura (ver regras do cartão).
- Cada conta tem o check de "paga". Contas fixas e avulsas podem ser renomeadas e removidas, com "Desfazer" por 8 segundos.

### Abrir um mês novo

Ao abrir um mês que ainda não existe, o app cria o mês copiando do mês anterior mais recente:

- copia: saldo, extras (vales e rendimentos) e contas fixas, com os valores;
- zera: contas avulsas do mês, feira, gasolina, cartão avulso, fundo, poupança, marcas de "feito" e "paga";
- alttab volta a R$ 100;
- parcelas do cartão não são copiadas, porque cada compra já sabe em que meses cai;
- a linha "Sobra de …" nunca é copiada.

### Sobra do mês anterior

Ao entrar num mês novo, o app pergunta "Sobrou algo de [mês passado]?", com o valor calculado já preenchido.

- **Somar às contas**: cria a linha "Sobra de [mês]" no saldo do mês novo.
- **Não sobrou nada**: só dispensa a pergunta.
- A pergunta aparece uma vez por mês, e não aparece em mês fechado.

### Marcas de "feito"

- Poupança, fundo, empresa e meta: caixas de "depósito feito" na aba Investimentos.
- Cartão: "Fatura paga" na aba Cartão.
- Contas: check de "paga" em cada linha.
- Em "Fechar o mês", as **pendências** resumem tudo isso e levam à aba certa.

### Fechar o mês

- Mês fechado fica somente leitura e entra no histórico.
- Pode ser reaberto.

### Alertas

- Mês no vermelho.
- Fatura do cartão acima do teto.
- Última parcela de uma compra.
- Feira ou gasolina acima da sugestão.
- Aporte marcado como feito com o mês negativo.

### Contas bancárias e objetivos

- Cada conta tem uma finalidade: investimento, poupança, meta, empresa ou reserva.
- Cada conta (menos a da empresa) pode ter um **objetivo** e uma renda mensal desejada, editáveis na aba Investimentos.
- Chaves PIX das contas e do destino do cartão alimentam o roteiro de transferências.

## Como rodar

O Postgres deste app sobe junto no `docker-compose` e grava em `./data`.

### Docker neste servidor

A rede `servicos` precisa existir (o Postgres compartilhado da máquina a cria). Depois:

```bash
cd /home/garcon/Alttab/APP-FinOps-alttab
cp .env.example .env
docker compose up --build -d
```

Acesse [http://localhost:3000](http://localhost:3000). A migração Prisma roda na inicialização do contêiner.

Se o build falhar com `can't stat data` (a pasta `./data` pertence ao Postgres), construa a imagem a partir de uma cópia sem `data/`, `node_modules/` e `.next/`, e depois suba com `docker compose up -d --no-build app`.

Para zerar o banco e cadastrar de novo (apaga `./data`):

```bash
docker compose down
rm -rf data
docker compose up -d
```

Não rode `prisma db seed`: o seed preenche nomes de exemplo. Cadastre as contas reais na tela.

### Desenvolvimento

Com o `db` no ar (`docker compose up -d db`) e o `DATABASE_URL` apontando para `127.0.0.1:5433`:

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Testes do motor de cálculo:

```bash
npm test
```

## Arquitetura

- `lib/domain` — regras puras, sem Next e sem banco (cálculo do mês, cartão, anuais, rendimento, prioridade, alertas, cópia de mês)
- `lib/application` — casos de uso (abrir, clonar e salvar mês; carregar cada aba)
- `lib/db` — Prisma/PostgreSQL
- `lib/ui` — utilitários de tela (salvar pendências antes de trocar de aba, redirecionar rotas antigas)
- `app` — páginas e server actions (`app/meses/[competencia]` renderiza as abas)
- `components` — telas do caderno do mês
- `prisma` — schema e migrações

### Convenções

- Competência no formato `AAAA-MM`.
- Salvamento automático com 600 ms de atraso; antes de trocar de aba ou de mês o app salva o que estiver pendente.
- Valores monetários em `Decimal(12,2)` no banco e arredondados a 2 casas no domínio.

## Ideias futuras

- Backup automático diário do banco.
- Senha de acesso para a rede.
- Duas colunas nas abas largas.
- Meta de rendimento passivo editável na tela.
