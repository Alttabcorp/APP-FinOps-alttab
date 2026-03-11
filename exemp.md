{
  "saldo": {
    "projeto": 1500.00,
    "pesquisa": 2000.00,
    "hujb": 1969.64,
    "total": 5469.64 (soma do saldo)
  },
  "extra": {
    "vale_transporte": 127.40,
    "vale_alimentacao": 465.50,
    "provento_fundo": 22.40,
    "extras": 0.00
  },
  "ganho_mes": 6084.94(soma do saldo + extra),
  "contas": {
    "credito_celular": 60.00,
    "magazine_luiza": 138.00,
    "celular": 260.00,
    "internet": 39.00,
    "casa": 615.53,
    "manutencao_conta_caixa": 35.50,
    "energia": 44.50,
    "agua_mineral": 58.00,
    "agua": 55.00,
    "racao": 40.00,
    "academia": 209.80,
    "total_contas": 1343.53(contas fixas do mês)
  },
  "extra_mes": {
    "gas": 120.00,
    "total_extra": 120.00(soma dos gastos extras do mês)
  },
  "gastos": {
    "gasto_mensal": 1463.53(soma das contas + extra_mes)
  },
  "saldo_contas": {
    "sobrou": 4008.11(ganho_mes - gasto_mensal)
  },
  "despesas_variaveis": {
    "feira": {
      "sugestao": 465.50,(valor do vale-alimentação)
      "real": 465.50
    },
    "cartao": {
      "sugestao": 3315.54,(valor ganho_mes - gasto_mensal - total investido)
      "real": 2321.00
    },
    "gasolina": {
      "sugestao": 127.40,(vale-transporte)
      "real": 108.19
    }
  },
  "investimentos": {
    "fundo_imobiliario": {
      "sugestao": 21.21,(sobra do vale-transporte)
      "ajuste": 22.40,(
        Reaplicação dos pronventos 
Quando o rendimento do provento fundo chegar a 100 

50% sera reaplicado
50% outros investimentos 

      )
      "total": 43.61
    },
    "alttab": {
      "valor": 100.00
    },
    "poupanca": {
      "sugestao": 546.96,(10% do saldo)
      "ajuste": 0.00,
      "total": 546.96
    },
    "total_investido": 690.57 (soma dos investimentos)
  },
  "resumo": {
    "ganhou": 6084.94,(soma do saldo + extra)
    "gasto": 5046.79, (soma do gasto_mensal + total_investido + cartao real + gasolina real + feira real)
    "sobrou": 1038.15 (ganhou - gasto)
  },
  "sugestoes": {
    "deposito_10_porcento": 103.81, (10% do que sobrou para a meta final)
    "gasto_individual": 467.17 ((sobrou - deposito_10_porcento) / 2 para cada pessoa)
  }
}