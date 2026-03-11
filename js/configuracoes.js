// Funções de configurações (exportar/importar/resetar)

// Função para exportar configurações
const exportarConfiguracoes = () => {
    const configuracoes = {
        // Despesas variáveis
        feiraReal: document.getElementById('feiraReal')?.value || '0',
        cartaoReal: document.getElementById('cartaoReal')?.value || '0',
        gasolinaReal: document.getElementById('gasolinaReal')?.value || '0',
        
        // Investimentos
        alttabReal: document.getElementById('alttabReal')?.value || '100',
        fundoReal: document.getElementById('fundoReal')?.value || '0',
        poupancaReal: document.getElementById('poupancaReal')?.value || '0',
        
        // Arrays
        saldo: [],
        extra: [],
        contas: [],
        extraMes: []
    };

    // Coletar itens de saldo
    document.querySelectorAll('.saldo-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.saldo.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    // Coletar itens de extra
    document.querySelectorAll('.extra-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.extra.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    // Coletar contas fixas
    document.querySelectorAll('.conta-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.contas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    // Coletar extra mês
    document.querySelectorAll('.extra-mes-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.extraMes.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    const dataStr = JSON.stringify(configuracoes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'configuracoes-financeiras.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

// Função para importar configurações
const importarConfiguracoes = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const configuracoes = JSON.parse(e.target.result);

                // Importar despesas variáveis
                if (configuracoes.feiraReal && document.getElementById('feiraReal')) {
                    document.getElementById('feiraReal').value = configuracoes.feiraReal;
                }
                if (configuracoes.cartaoReal && document.getElementById('cartaoReal')) {
                    document.getElementById('cartaoReal').value = configuracoes.cartaoReal;
                }
                if (configuracoes.gasolinaReal && document.getElementById('gasolinaReal')) {
                    document.getElementById('gasolinaReal').value = configuracoes.gasolinaReal;
                }

                // Importar investimentos
                if (configuracoes.alttabReal && document.getElementById('alttabReal')) {
                    document.getElementById('alttabReal').value = configuracoes.alttabReal;
                }
                if (configuracoes.fundoReal && document.getElementById('fundoReal')) {
                    document.getElementById('fundoReal').value = configuracoes.fundoReal;
                }
                if (configuracoes.poupancaReal && document.getElementById('poupancaReal')) {
                    const valor = parseFloat(configuracoes.poupancaReal);
                    document.getElementById('poupancaReal').value = configuracoes.poupancaReal;
                    // Marcar como editado manualmente apenas se for diferente de 0
                    if (valor !== 0) {
                        document.getElementById('poupancaReal').dataset.editadoManualmente = 'true';
                    }
                }

                // Importar saldo
                if (configuracoes.saldo && Array.isArray(configuracoes.saldo)) {
                    saldoContainer.innerHTML = '';
                    configuracoes.saldo.forEach(item => {
                        adicionarSaldo(item.nome, item.valor);
                    });
                }

                // Importar itens de extra
                if (configuracoes.extra && Array.isArray(configuracoes.extra)) {
                    extraContainer.innerHTML = '';
                    configuracoes.extra.forEach(item => {
                        adicionarExtra(item.nome, item.valor);
                    });
                }

                // Importar contas fixas
                if (configuracoes.contas && Array.isArray(configuracoes.contas)) {
                    contasContainer.innerHTML = '';
                    configuracoes.contas.forEach(conta => {
                        adicionarConta(conta.nome, conta.valor);
                    });
                }

                // Importar extra mês
                if (configuracoes.extraMes && Array.isArray(configuracoes.extraMes)) {
                    extraMesContainer.innerHTML = '';
                    configuracoes.extraMes.forEach(item => {
                        adicionarExtraMes(item.nome, item.valor);
                    });
                }

                salvarDados();
                calcularValores();
                alert('Configurações importadas com sucesso!');
            } catch (error) {
                alert('Erro ao importar configurações. Verifique se o arquivo é válido.');
            }
        };
        reader.readAsText(file);
    }
};

// Função para resetar configurações
const resetarConfiguracoes = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
        // Resetar despesas variáveis
        if (document.getElementById('feiraReal')) document.getElementById('feiraReal').value = '0';
        if (document.getElementById('cartaoReal')) document.getElementById('cartaoReal').value = '0';
        if (document.getElementById('gasolinaReal')) document.getElementById('gasolinaReal').value = '0';

        // Resetar investimentos
        if (document.getElementById('alttabReal')) document.getElementById('alttabReal').value = '100';
        if (document.getElementById('fundoReal')) document.getElementById('fundoReal').value = '0';
        if (document.getElementById('poupancaReal')) {
            document.getElementById('poupancaReal').value = '0';
            // Remover flag de edição manual para voltar ao comportamento automático
            delete document.getElementById('poupancaReal').dataset.editadoManualmente;
        }

        // Limpar tabelas
        const tabelaSaldo = document.getElementById('tabelaSaldo');
        if (tabelaSaldo) tabelaSaldo.innerHTML = '';
        
        const tabelaContas = document.getElementById('tabelaContas');
        if (tabelaContas) tabelaContas.innerHTML = '';
        
        const tabelaExtraMes = document.getElementById('tabelaExtraMes');
        if (tabelaExtraMes) tabelaExtraMes.innerHTML = '';
        
        const tabelaExtra = document.getElementById('tabelaExtra');
        if (tabelaExtra) tabelaExtra.innerHTML = '';

        // Resetar containers
        saldoContainer.innerHTML = '';
        adicionarSaldo('Projeto', '');
        adicionarSaldo('Pesquisa', '');
        adicionarSaldo('HUJB', '');

        extraContainer.innerHTML = '';
        adicionarExtra('Vale-Transporte', '');
        adicionarExtra('Vale-Alimentação', '');
        adicionarExtra('Provento Fundo', '');

        contasContainer.innerHTML = '';
        adicionarConta('Crédito Celular', '');
        adicionarConta('Internet', '');
        adicionarConta('Energia', '');
        adicionarConta('Água', '');

        extraMesContainer.innerHTML = '';
        adicionarExtraMes('Gás', '');

        // Limpar localStorage
        localStorage.clear();
        calcularValores();
        alert('Configurações resetadas com sucesso!');
    }
};