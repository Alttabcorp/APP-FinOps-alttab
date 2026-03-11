// Funções de cálculo seguindo o modelo exato

const calcularValores = () => {
    // === 1. SALDO ===
    let totalSaldo = 0;
    document.querySelectorAll('.saldo-row input[data-tipo="valor"]').forEach(input => {
        totalSaldo += parseFloat(input.value) || 0;
    });

    // === 2. EXTRA ===
    let totalExtra = 0;
    let valeTransporte = 0;
    let valeAlimentacao = 0;
    let proventoFundo = 0;
    
    // Somar todos os itens de extra e identificar valores específicos
    document.querySelectorAll('.extra-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        
        if (nomeInput && valorInput) {
            const nome = nomeInput.value.toLowerCase().trim();
            const valor = parseFloat(valorInput.value) || 0;
            
            totalExtra += valor;
            
            // Identificar valores específicos para cálculos posteriores
            if (nome.includes('vale') && nome.includes('transporte')) {
                valeTransporte = valor;
            } else if (nome.includes('vale') && nome.includes('alimenta')) {
                valeAlimentacao = valor;
            } else if (nome.includes('provento') || nome.includes('fundo')) {
                proventoFundo = valor;
            }
        }
    });

    // === 3. GANHO MÊS ===
    const ganhoMes = totalSaldo + totalExtra;

    // === 4. CONTAS FIXAS ===
    let totalContas = 0;
    document.querySelectorAll('.conta-row input[data-tipo="valor"]').forEach(input => {
        totalContas += parseFloat(input.value) || 0;
    });

    // === 5. EXTRA MÊS ===
    let totalExtraMes = 0;
    document.querySelectorAll('.extra-mes-row input[data-tipo="valor"]').forEach(input => {
        totalExtraMes += parseFloat(input.value) || 0;
    });

    // === 6. GASTO MENSAL ===
    const gastoMensal = totalContas + totalExtraMes;

    // === 7. SALDO CONTAS ===
    const saldoContas = totalSaldo - gastoMensal;

    // === 8. DESPESAS VARIÁVEIS ===
    const feiraReal = parseFloat(document.getElementById('feiraReal')?.value) || 0;
    const cartaoReal = parseFloat(document.getElementById('cartaoReal')?.value) || 0;
    const gasolinaReal = parseFloat(document.getElementById('gasolinaReal')?.value) || 0;

    // === 9. INVESTIMENTOS ===
    // Poupança: 10% do total saldo (sugestão)
    const poupancaSugestao = totalSaldo * 0.1;
    
    // Atualizar campo se não foi editado manualmente
    const poupancaInput = document.getElementById('poupancaReal');
    if (poupancaInput && !poupancaInput.dataset.editadoManualmente) {
        poupancaInput.value = poupancaSugestao.toFixed(2);
    }
    // Usar o valor do campo (pode ser editado manualmente), ou sugestão se vazio
    const poupancaReal = parseFloat(poupancaInput?.value) || poupancaSugestao;

    // Alttab: valor sugerido fixo de 100
    const alttabSugestao = 100;
    const alttabReal = parseFloat(document.getElementById('alttabReal')?.value) || 0;

    // Fundo Imobiliário: vale-transporte - gasolina + provento do fundo
    const fundoSugestaoBase = Math.max(0, valeTransporte - gasolinaReal + proventoFundo);
    
    // Lógica de reaplicação: quando provento chegar a 100, 50% reaplicar automaticamente
    let fundoAjusteAutomatico = 0;
    if (proventoFundo >= 100) {
        fundoAjusteAutomatico = proventoFundo * 0.5; // 50% reaplicado
    }
    
    const fundoSugestao = fundoSugestaoBase + fundoAjusteAutomatico;
    const fundoReal = parseFloat(document.getElementById('fundoReal')?.value) || 0;

    const totalInvestido = poupancaReal + alttabReal + fundoReal;

    // === 10. SUGESTÕES DESPESAS VARIÁVEIS ===
    const feirasugestao = valeAlimentacao;
    const gasolinaSugestao = valeTransporte;
    const cartaoSugestao = saldoContas - totalInvestido;

    // === 11. RESUMO ===
    const resumoGanhou = ganhoMes;
    const resumoGasto = gastoMensal + totalInvestido + feiraReal + cartaoReal + gasolinaReal;
    const resumoSobrou = resumoGanhou - resumoGasto;

    // === 12. DISTRIBUIÇÃO FINAL ===
    const metaFinal = Math.max(0, resumoSobrou * 0.1);
    const gastoIndividual = Math.max(0, (resumoSobrou - metaFinal) / 2);

    // === ATUALIZAR INTERFACE ===
    // Resumo Principal
    document.getElementById('resumoGanhou').textContent = formatarMoeda(resumoGanhou);
    document.getElementById('resumoGasto').textContent = formatarMoeda(resumoGasto);
    document.getElementById('resumoSobrou').textContent = formatarMoeda(resumoSobrou);

    // Saldo e Extra
    document.getElementById('totalSaldo').textContent = formatarMoeda(totalSaldo);
    document.getElementById('ganhoMes').textContent = formatarMoeda(ganhoMes);
    
    // Atualizar tabela de Extra na página principal
    const tabelaExtra = document.getElementById('tabelaExtra');
    if (tabelaExtra) {
        tabelaExtra.innerHTML = '';
        document.querySelectorAll('.extra-item').forEach(item => {
            const nomeInput = item.querySelector('input[data-tipo="nome"]');
            const valorInput = item.querySelector('input[data-tipo="valor"]');
            
            if (nomeInput && valorInput) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${nomeInput.value || 'Sem nome'}</strong></td>
                    <td>${formatarMoeda(parseFloat(valorInput.value) || 0)}</td>
                `;
                tabelaExtra.appendChild(tr);
            }
        });
    }
    
    if (document.getElementById('totalExtra')) {
        document.getElementById('totalExtra').textContent = formatarMoeda(totalExtra);
    }

    // Contas e Gastos
    document.getElementById('totalContas').textContent = formatarMoeda(totalContas);
    document.getElementById('totalExtraMes').textContent = formatarMoeda(totalExtraMes);
    document.getElementById('gastoMensal').textContent = formatarMoeda(gastoMensal);
    document.getElementById('saldoContas').textContent = formatarMoeda(saldoContas);

    // Despesas Variáveis - Sugestões
    document.getElementById('feirasugestao').textContent = formatarMoeda(feirasugestao);
    document.getElementById('cartaoSugestao').textContent = formatarMoeda(cartaoSugestao);
    document.getElementById('gasolinaSugestao').textContent = formatarMoeda(gasolinaSugestao);

    // Investimentos
    document.getElementById('fundoSugestao').textContent = formatarMoeda(fundoSugestao);
    document.getElementById('alttabSugestao').textContent = formatarMoeda(alttabSugestao);
    document.getElementById('poupancaSugestao').textContent = formatarMoeda(poupancaSugestao);
    document.getElementById('totalInvestido').textContent = formatarMoeda(totalInvestido);

    // Distribuição Final
    document.getElementById('metaFinal').textContent = formatarMoeda(metaFinal);
    document.getElementById('gastoIndividual').textContent = formatarMoeda(gastoIndividual);

    // Atualizar gráfico
    desenharGrafico({
        totalContas,
        totalExtraMes,
        feiraReal,
        cartaoReal,
        gasolinaReal,
        poupancaTotal: poupancaReal,
        alttabValor: alttabReal,
        fundoTotal: fundoReal,
        metaFinal,
        gastoIndividual
    });

    // Salvar dados
    salvarDados();
};