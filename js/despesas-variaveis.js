// Funções para despesas variáveis dinâmicas

const adicionarDespesaVariavel = (nome = '', valor = '') => {
    const despesaId = Date.now(); // ID único
    
    // Adicionar na tabela principal
    const tabelaDespesasVariaveis = document.getElementById('tabelaDespesasVariaveis');
    if (tabelaDespesasVariaveis) {
        const tr = document.createElement('tr');
        tr.className = 'despesa-variavel-row';
        tr.dataset.id = despesaId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome da despesa" value="${nome}" data-tipo="nome" data-id="${despesaId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}" class="input-tabela">
            </td>
        `;
        tabelaDespesasVariaveis.appendChild(tr);
        
        // Adicionar event listeners
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calcularValores);
        });
    }
    
    // Adicionar no modal de configurações
    const despesaDiv = document.createElement('div');
    despesaDiv.className = 'despesa-item despesa-variavel-item';
    despesaDiv.dataset.id = despesaId;
    despesaDiv.innerHTML = `
        <input type="text" placeholder="Nome da despesa variável" value="${nome}" data-tipo="nome" data-id="${despesaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}">
        <button class="btn btn-danger" onclick="removerDespesaVariavel(${despesaId})">Remover</button>
    `;
    despesasVariaveisContainer.appendChild(despesaDiv);

    // Adicionar event listeners
    despesaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            sincronizarDespesaVariavel(despesaId);
            calcularValores();
        });
    });
};

const sincronizarDespesaVariavel = (id) => {
    const modalInput = document.querySelector(`.despesa-variavel-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.despesa-variavel-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerDespesaVariavel = (id) => {
    // Remover da tabela
    const tabelaRow = document.querySelector(`.despesa-variavel-row[data-id="${id}"]`);
    if (tabelaRow) {
        tabelaRow.remove();
    }
    
    // Remover do modal
    const modalDiv = document.querySelector(`.despesa-variavel-item[data-id="${id}"]`);
    if (modalDiv) {
        modalDiv.remove();
    }
    
    calcularValores();
};

// Tornar removerDespesaVariavel global
window.removerDespesaVariavel = removerDespesaVariavel;