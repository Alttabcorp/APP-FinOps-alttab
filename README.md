# 💰 Painel Financeiro Mensal - Alttab Corp

Aplicação web para controle financeiro mensal seguindo modelo específico de planejamento com gestão inteligente de saldo, contas e investimentos.

## 📋 Funcionalidades

### Gestão Financeira Completa
- **Saldo Mensal**: Registre múltiplas fontes de saldo (Projeto, Pesquisa, HUJB, etc.)
- **Contas Fixas**: Controle contas fixas mensais (Crédito Celular, Internet, Energia, Água, etc.)
- **Extra Mês**: Gerencie despesas extras variáveis mensais (Gás, etc.)

### Sistema de Valores Extras
- **Vale-Transporte**: Registre o valor recebido
- **Vale-Alimentação**: Registre o valor recebido
- **Provento Fundo**: Rendimentos do fundo imobiliário
- **Extras**: Outros valores extras do mês

### Despesas Variáveis (Sugestão vs Real)
- **Feira**: Compare sugestão vs gasto real
- **Cartão**: Compare sugestão vs gasto real
- **Gasolina**: Compare sugestão vs gasto real

### Investimentos Automáticos
- **Poupança**: 
  - Sugestão automática de 10% do saldo total
  - Ajuste manual conforme necessário
- **Alttab**: Contribuição mensal (padrão R$ 100)
- **Fundo Imobiliário**: 
  - Sugestão: Vale-Transporte - Gasolina Real + Provento Fundo
  - Ajuste manual conforme necessário

### Distribuição Inteligente Final
Cálculo do que sobrou após todos os gastos e investimentos:
- 10% vai para **Meta Final**
- Restante é dividido igualmente entre **Gasto Individual** (você e cônjuge)

### Resumo Principal
Visualização de três indicadores principais:
- **Total Ganhou**: Saldo + Extra do mês
- **Total Gasto**: Contas + Extra Mês + Despesas Variáveis + Investimentos
- **Resumo Sobrou**: O que restou após todos os cálculos

### Recursos Adicionais
- 📊 Gráfico visual interativo com todas as categorias
- 💾 Salvamento automático no localStorage do navegador
- 📤 Exportar/Importar configurações (JSON)
- 🔄 Reset de configurações
- 📱 Interface responsiva minimalista
- ➕ Adicionar/Remover itens de todas as tabelas dinamicamente

## 🚀 Como Usar

1. **Abra a aplicação**: Basta abrir o arquivo `index.html` no navegador
   - Ou rode um servidor local: `python3 -m http.server 8000`
   - Acesse: `http://localhost:8000`

2. **Configure o Modal (botão ⚙️)**:
   - Adicione seus itens de **Saldo** (Projeto, Pesquisa, HUJB, etc.)
   - Configure suas **Contas Fixas** (Internet, Energia, Água, etc.)
   - Adicione items de **Extra Mês** (Gás, etc.)

3. **Preencha os valores na tela principal**:
   - **Extra**: Vale-Transporte, Vale-Alimentação, Provento Fundo, Extras
   - **Despesas Variáveis**: Feira Real, Cartão Real, Gasolina Real
   - **Investimentos**: Alttab Valor, Ajustes no Fundo e Poupança
   
4. **Acompanhe os resultados automaticamente**:
   - **Resumo Principal**: Total Ganhou, Total Gasto, Resumo Sobrou
   - **Saldo Contas**: Ganho Mês - Gasto Mensal
   - **Sugestões**: Valores sugeridos para Feira, Cartão e Gasolina
   - **Investimentos**: Poupança (10% do saldo), Fundo Imobiliário, Alttab
   - **Distribuição Final**: Meta Final (10% do que sobrou) e Gasto Individual

5. **Salve e gerencie**:
   - As alterações são salvas automaticamente no navegador
   - Use "Exportar" para fazer backup em arquivo JSON
   - Use "Importar" para restaurar configurações salvas
   - Use "Resetar" para limpar todos os dados

## 💡 Dicas de Uso

- **Saldo**: Adicione todas as suas fontes de renda mensal (projeto, pesquisa, etc.)
- **Contas**: Registre todas as contas fixas que se repetem mensalmente
- **Extra Mês**: Adicione gastos extras variáveis do mês
- **Despesas Variáveis**: Compare sempre a sugestão com o valor real gasto
- **Investimentos**: O sistema sugere valores mas permite ajustes manuais
- **Backup**: Exporte suas configurações periodicamente para não perder dados

## 🛠 Tecnologias

- HTML5
- CSS3 (Design minimalista e responsivo)
- JavaScript (Vanilla - sem dependências externas)
- LocalStorage API (Persistência de dados no navegador)
- Canvas API (Gráficos interativos)

## 📁 Estrutura do Projeto

```
├── index.html              # Página principal da aplicação
├── exemplo.json            # Exemplo de arquivo de configuração
├── css/
│   └── styles.css         # Estilos completos da aplicação
└── js/
    ├── main.js           # Inicialização e event listeners
    ├── calculos.js       # Lógica de cálculos financeiros (modelo específico)
    ├── data.js           # Gerenciamento de dados (salvar/carregar localStorage)
    ├── saldo.js          # Gestão de itens de saldo
    ├── contas.js         # Gestão de contas fixas
    ├── extra-mes.js      # Gestão de despesas extras do mês
    ├── grafico.js        # Renderização de gráficos no canvas
    ├── modal.js          # Controle do modal de configurações
    ├── configuracoes.js  # Exportar/Importar/Reset de configurações
    └── utils.js          # Funções utilitárias (formatação, etc.)
```

## 🔒 Privacidade

Todos os dados são salvos localmente no navegador (localStorage). Nenhuma informação é enviada para servidores externos.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Alttab Corp © 2025**
