// Funções de gerenciamento de dados

// Função para carregar dados do localStorage
const carregarDados = () => {
    // Limpar tabelas
    const tabelaSaldo = document.getElementById('tabelaSaldo');
    if (tabelaSaldo) tabelaSaldo.innerHTML = '';
    
    const tabelaContas = document.getElementById('tabelaContas');
    if (tabelaContas) tabelaContas.innerHTML = '';
    
    const tabelaExtraMes = document.getElementById('tabelaExtraMes');
    if (tabelaExtraMes) tabelaExtraMes.innerHTML = '';
    
    // Limpar container de extra
    if (extraContainer) extraContainer.innerHTML = '';

    // Carregar despesas variáveis
    const feiraReal = localStorage.getItem('feiraReal');
    const cartaoReal = localStorage.getItem('cartaoReal');
    const gasolinaReal = localStorage.getItem('gasolinaReal');

    if (feiraReal && document.getElementById('feiraReal')) {
        document.getElementById('feiraReal').value = feiraReal;
    }
    if (cartaoReal && document.getElementById('cartaoReal')) {
        document.getElementById('cartaoReal').value = cartaoReal;
    }
    if (gasolinaReal && document.getElementById('gasolinaReal')) {
        document.getElementById('gasolinaReal').value = gasolinaReal;
    }

    // Carregar investimentos
    const alttabReal = localStorage.getItem('alttabReal');
    const fundoReal = localStorage.getItem('fundoReal');
    const poupancaReal = localStorage.getItem('poupancaReal');

    if (alttabReal && document.getElementById('alttabReal')) {
        document.getElementById('alttabReal').value = alttabReal;
    }
    if (fundoReal && document.getElementById('fundoReal')) {
        document.getElementById('fundoReal').value = fundoReal;
    }
    if (poupancaReal && document.getElementById('poupancaReal')) {
        document.getElementById('poupancaReal').value = poupancaReal;
        // Marcar como editado manualmente apenas se for diferente de 0
        if (parseFloat(poupancaReal) !== 0) {
            document.getElementById('poupancaReal').dataset.editadoManualmente = 'true';
        }
    }

    // Carregar itens de saldo
    const saldoSalvo = localStorage.getItem('saldo');
    if (saldoSalvo) {
        const saldos = JSON.parse(saldoSalvo);
        saldos.forEach(item => {
            adicionarSaldo(item.nome, item.valor);
        });
    } else {
        // Adicionar itens padrão
        adicionarSaldo('Projeto', '');
        adicionarSaldo('Pesquisa', '');
        adicionarSaldo('HUJB', '');
    }

    // Carregar itens de extra
    const extraSalvo = localStorage.getItem('extra');
    if (extraSalvo) {
        const extras = JSON.parse(extraSalvo);
        extras.forEach(item => {
            adicionarExtra(item.nome, item.valor);
        });
    } else {
        // Adicionar itens padrão
        adicionarExtra('Vale-Transporte', '');
        adicionarExtra('Vale-Alimentação', '');
        adicionarExtra('Provento Fundo', '');
    }

    // Carregar contas fixas
    const contasSalvas = localStorage.getItem('contas');
    if (contasSalvas) {
        const contas = JSON.parse(contasSalvas);
        contas.forEach(conta => {
            adicionarConta(conta.nome, conta.valor);
        });
    } else {
        // Adicionar contas padrão
        adicionarConta('Crédito Celular', '');
        adicionarConta('Internet', '');
        adicionarConta('Energia', '');
        adicionarConta('Água', '');
    }

    // Carregar extra mês
    const extraMesSalvo = localStorage.getItem('extraMes');
    if (extraMesSalvo) {
        const extraMes = JSON.parse(extraMesSalvo);
        extraMes.forEach(item => {
            adicionarExtraMes(item.nome, item.valor);
        });
    } else {
        // Adicionar item padrão
        adicionarExtraMes('Gás', '');
    }

    calcularValores();
};

// Função para salvar dados no localStorage
const salvarDados = () => {
    // Salvar despesas variáveis
    const feiraReal = document.getElementById('feiraReal');
    const cartaoReal = document.getElementById('cartaoReal');
    const gasolinaReal = document.getElementById('gasolinaReal');

    if (feiraReal) localStorage.setItem('feiraReal', feiraReal.value);
    if (cartaoReal) localStorage.setItem('cartaoReal', cartaoReal.value);
    if (gasolinaReal) localStorage.setItem('gasolinaReal', gasolinaReal.value);

    // Salvar investimentos
    const alttabReal = document.getElementById('alttabReal');
    const fundoReal = document.getElementById('fundoReal');
    const poupancaReal = document.getElementById('poupancaReal');

    if (alttabReal) localStorage.setItem('alttabReal', alttabReal.value);
    if (fundoReal) localStorage.setItem('fundoReal', fundoReal.value);
    if (poupancaReal) localStorage.setItem('poupancaReal', poupancaReal.value);

    // Salvar itens de saldo
    const saldo = [];
    document.querySelectorAll('.saldo-row').forEach(row => {
        const nomeInput = row.querySelector('input[data-tipo="nome"]');
        const valorInput = row.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            saldo.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('saldo', JSON.stringify(saldo));

    // Salvar itens de extra
    const extra = [];
    document.querySelectorAll('.extra-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            extra.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('extra', JSON.stringify(extra));

    // Salvar contas fixas
    const contas = [];
    document.querySelectorAll('.conta-row').forEach(row => {
        const nomeInput = row.querySelector('input[data-tipo="nome"]');
        const valorInput = row.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            contas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('contas', JSON.stringify(contas));

    // Salvar extra mês
    const extraMes = [];
    document.querySelectorAll('.extra-mes-row').forEach(row => {
        const nomeInput = row.querySelector('input[data-tipo="nome"]');
        const valorInput = row.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            extraMes.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('extraMes', JSON.stringify(extraMes));
};

// Função para salvar configurações explicitamente
const salvarConfiguracoes = () => {
    salvarDados();
    alert('Configurações salvas com sucesso!');
    fecharModal();
};