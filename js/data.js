// Funções de gerenciamento de dados

// Função para carregar dados do localStorage
const carregarDados = () => {
    // Carregar receitas
    const receitasSalvas = localStorage.getItem('receitas');
    if (receitasSalvas) {
        const receitas = JSON.parse(receitasSalvas);
        receitas.forEach(receita => {
            adicionarReceita(receita.nome, receita.valor);
        });
    } else {
        // Adicionar receita padrão se não houver nenhuma
        adicionarReceita('Salário', '');
    }

    // Carregar despesas fixas
    const despesasFixasSalvas = localStorage.getItem('despesasFixas');
    if (despesasFixasSalvas) {
        const despesasFixas = JSON.parse(despesasFixasSalvas);
        despesasFixas.forEach(despesa => {
            adicionarDespesaFixa(despesa.nome, despesa.valor);
        });
    } else {
        // Adicionar despesas fixas padrão se não houver nenhuma
        adicionarDespesaFixa('Água', '');
        adicionarDespesaFixa('Energia', '');
        adicionarDespesaFixa('Aluguel', '');
        adicionarDespesaFixa('Internet', '');
    }

    // Carregar despesas variáveis
    const despesasVariaveisSalvas = localStorage.getItem('despesasVariaveis');
    if (despesasVariaveisSalvas) {
        const despesasVariaveis = JSON.parse(despesasVariaveisSalvas);
        despesasVariaveis.forEach(despesa => {
            adicionarDespesaVariavel(despesa.nome, despesa.valor);
        });
    } else {
        // Adicionar despesas variáveis padrão se não houver nenhuma
        adicionarDespesaVariavel('Gastos no Cartão', '');
        adicionarDespesaVariavel('Supermercado', '');
    }

    calcularValores();
};

// Função para salvar dados no localStorage
const salvarDados = () => {
    // Salvar receitas
    const receitas = [];
    document.querySelectorAll('.receita-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            receitas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('receitas', JSON.stringify(receitas));

    // Salvar despesas fixas
    const despesasFixas = [];
    document.querySelectorAll('.despesa-fixa-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            despesasFixas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('despesasFixas', JSON.stringify(despesasFixas));

    // Salvar despesas variáveis
    const despesasVariaveis = [];
    document.querySelectorAll('.despesa-variavel-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            despesasVariaveis.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });
    localStorage.setItem('despesasVariaveis', JSON.stringify(despesasVariaveis));
};

// Função para salvar configurações explicitamente
const salvarConfiguracoes = () => {
    salvarDados();
    alert('Configurações salvas com sucesso!');
    fecharModal();
};