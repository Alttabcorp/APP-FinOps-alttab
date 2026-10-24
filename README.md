# Contas da casa

Caderno web para organizar as contas do mês: saldo, extras, contas fixas, cartão, feira, gasolina e investimentos. As regras de negócio ficam isoladas em `lib/domain/financeiro`.

## Como rodar

Este app **não sobe Postgres**. No servidor, use a instância compartilhada em `/home/garcon/infra/postgres` (um banco e um usuário por serviço).

### Docker neste servidor

1. Suba o Postgres compartilhado, se ainda não estiver no ar:

```bash
cd /home/garcon/infra/postgres
cp .env.example .env
docker compose up -d
./scripts/criar-servico.sh finops
```

2. Confira o `.env` deste projeto (`DATABASE_URL` para o host, `DATABASE_URL_DOCKER` para o container).

3. Suba o app:

```bash
cd /home/garcon/Alttab/APP-FinOps-alttab
docker compose up --build -d
```

Acesse [http://localhost:3000](http://localhost:3000). A migração Prisma roda na inicialização.

### Desenvolvimento no servidor

Com o Postgres compartilhado no ar e o `DATABASE_URL` apontando para `127.0.0.1`:

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

## Regras principais

- `saldoContas` = total do saldo − gasto mensal (contas + extra do mês)
- Feira sugerida = vale-alimentação; gasolina sugerida = vale-transporte
- Cartão sugerido = saldo das contas − total investido
- Poupança sugerida = 10% do saldo
- Fundo = sobra do vale-transporte + reaplicação do provento
- Se o provento chega a R$ 100, 50% volta ao fundo e 50% fica para outros investimentos
- Do que sobrou, 10% vai para a meta e o resto divide em dois gastos individuais

## Arquitetura

- `lib/domain` — regras puras, sem Next e sem banco
- `lib/application` — casos de uso (abrir, clonar e salvar mês)
- `lib/db` — Prisma/PostgreSQL
- `app` — páginas e server actions
- `components` — caderno do mês e histórico
