// Funções de configurações (exportar/importar/resetar)

// Função para exportar configurações
const exportarConfiguracoes = () => {
    const configuracoes = {
        receitas: [],
        despesasFixas: [],
        despesasVariaveis: []
    };

    // Coletar receitas
    document.querySelectorAll('.receita-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.receitas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    // Coletar despesas fixas
    document.querySelectorAll('.despesa-fixa-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.despesasFixas.push({
                nome: nomeInput.value,
                valor: valorInput.value
            });
        }
    });

    // Coletar despesas variáveis
    document.querySelectorAll('.despesa-variavel-item').forEach(item => {
        const nomeInput = item.querySelector('input[data-tipo="nome"]');
        const valorInput = item.querySelector('input[data-tipo="valor"]');
        if (nomeInput && valorInput) {
            configuracoes.despesasVariaveis.push({
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

                // Importar receitas
                if (configuracoes.receitas && Array.isArray(configuracoes.receitas)) {
                    receitasContainer.innerHTML = '';
                    configuracoes.receitas.forEach(receita => {
                        adicionarReceita(receita.nome, receita.valor);
                    });
                }

                // Importar despesas fixas
                if (configuracoes.despesasFixas && Array.isArray(configuracoes.despesasFixas)) {
                    despesasFixasContainer.innerHTML = '';
                    configuracoes.despesasFixas.forEach(despesa => {
                        adicionarDespesaFixa(despesa.nome, despesa.valor);
                    });
                }

                // Importar despesas variáveis
                if (configuracoes.despesasVariaveis && Array.isArray(configuracoes.despesasVariaveis)) {
                    despesasVariaveisContainer.innerHTML = '';
                    configuracoes.despesasVariaveis.forEach(despesa => {
                        adicionarDespesaVariavel(despesa.nome, despesa.valor);
                    });
                }

                // Suporte para formato antigo (despesas misturadas)
                if (configuracoes.despesas && Array.isArray(configuracoes.despesas) && !configuracoes.despesasFixas && !configuracoes.despesasVariaveis) {
                    despesasFixasContainer.innerHTML = '';
                    despesasVariaveisContainer.innerHTML = '';
                    configuracoes.despesas.forEach(despesa => {
                        if (despesa.tipo === 'fixo') {
                            adicionarDespesaFixa(despesa.nome, despesa.valor);
                        } else {
                            adicionarDespesaVariavel(despesa.nome, despesa.valor);
                        }
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
        // Resetar receitas
        receitasContainer.innerHTML = '';
        adicionarReceita(); // Adicionar uma receita vazia

        // Resetar despesas fixas
        despesasFixasContainer.innerHTML = '';
        adicionarDespesaFixa('Água', '');
        adicionarDespesaFixa('Energia', '');
        adicionarDespesaFixa('Aluguel', '');
        adicionarDespesaFixa('Internet', '');

        // Resetar despesas variáveis
        despesasVariaveisContainer.innerHTML = '';
        adicionarDespesaVariavel('Gastos no Cartão', '');
        adicionarDespesaVariavel('Supermercado', '');

        // Limpar localStorage
        localStorage.clear();
        calcularValores();
        alert('Configurações resetadas com sucesso!');
    }
};