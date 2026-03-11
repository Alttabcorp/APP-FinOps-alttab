// Funções para despesas fixas dinâmicas

const adicionarDespesaFixa = (nome = '', valor = '') => {
    const despesaId = Date.now(); // ID único
    
    // Adicionar na tabela principal
    const tabelaDespesasFixas = document.getElementById('tabelaDespesasFixas');
    if (tabelaDespesasFixas) {
        const tr = document.createElement('tr');
        tr.className = 'despesa-fixa-row';
        tr.dataset.id = despesaId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome da despesa" value="${nome}" data-tipo="nome" data-id="${despesaId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}" class="input-tabela">
            </td>
        `;
        tabelaDespesasFixas.appendChild(tr);
        
        // Adicionar event listeners
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calcularValores);
        });
    }
    
    // Adicionar no modal de configurações
    const despesaDiv = document.createElement('div');
    despesaDiv.className = 'despesa-item despesa-fixa-item';
    despesaDiv.dataset.id = despesaId;
    despesaDiv.innerHTML = `
        <input type="text" placeholder="Nome da despesa fixa" value="${nome}" data-tipo="nome" data-id="${despesaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}">
        <button class="btn btn-danger" onclick="removerDespesaFixa(${despesaId})">Remover</button>
    `;
    despesasFixasContainer.appendChild(despesaDiv);

    // Adicionar event listeners
    despesaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            sincronizarDespesaFixa(despesaId);
            calcularValores();
        });
    });
};

const sincronizarDespesaFixa = (id) => {
    const modalInput = document.querySelector(`.despesa-fixa-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.despesa-fixa-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerDespesaFixa = (id) => {
    // Remover da tabela
    const tabelaRow = document.querySelector(`.despesa-fixa-row[data-id="${id}"]`);
    if (tabelaRow) {
        tabelaRow.remove();
    }
    
    // Remover do modal
    const modalDiv = document.querySelector(`.despesa-fixa-item[data-id="${id}"]`);
    if (modalDiv) {
        modalDiv.remove();
    }
    
    calcularValores();
};

// Tornar removerDespesaFixa global
window.removerDespesaFixa = removerDespesaFixa;