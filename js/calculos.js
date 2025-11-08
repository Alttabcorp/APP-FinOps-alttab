// Funções de cálculo

// Função para calcular todos os valores
const calcularValores = () => {
    // Calcular total de receitas
    let valorRecebido = 0;
    document.querySelectorAll('.receita-item input[data-tipo="valor"]').forEach(input => {
        valorRecebido += parseFloat(input.value) || 0;
    });

    // Calcular custos fixos
    let custosFixos = 0;
    document.querySelectorAll('.despesa-fixa-item input[data-tipo="valor"]').forEach(input => {
        custosFixos += parseFloat(input.value) || 0;
    });

    // Calcular gastos variáveis
    let gastosVariaveis = 0;
    document.querySelectorAll('.despesa-variavel-item input[data-tipo="valor"]').forEach(input => {
        gastosVariaveis += parseFloat(input.value) || 0;
    });

    // Cálculos
    const poupanca = valorRecebido * 0.1;
    const sociedade = 100;
    const saldoFinal = valorRecebido - poupanca - sociedade - custosFixos - gastosVariaveis;

    // Atualizar valores na tela
    document.getElementById('receitaTotal').textContent = formatarMoeda(valorRecebido);
    document.getElementById('poupanca').textContent = formatarMoeda(poupanca);
    document.getElementById('sociedade').textContent = formatarMoeda(sociedade);
    document.getElementById('custosFixos').textContent = formatarMoeda(custosFixos);
    document.getElementById('gastosVariaveis').textContent = formatarMoeda(gastosVariaveis);
    document.getElementById('saldoFinal').textContent = formatarMoeda(saldoFinal);

    // Atualizar gráfico
    desenharGrafico(poupanca, sociedade, custosFixos, gastosVariaveis, saldoFinal);

    // Salvar dados
    salvarDados();
};