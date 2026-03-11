// Funções para receitas dinâmicas

const adicionarReceita = (nome = '', valor = '') => {
    const receitaId = Date.now(); // ID único
    
    // Adicionar na tabela principal
    const tabelaReceitas = document.getElementById('tabelaReceitas');
    if (tabelaReceitas) {
        const tr = document.createElement('tr');
        tr.className = 'receita-row';
        tr.dataset.id = receitaId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome da receita" value="${nome}" data-tipo="nome" data-id="${receitaId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${receitaId}" class="input-tabela">
            </td>
        `;
        tabelaReceitas.appendChild(tr);
        
        // Adicionar event listeners
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calcularValores);
        });
    }
    
    // Adicionar no modal de configurações
    const receitaDiv = document.createElement('div');
    receitaDiv.className = 'receita-item';
    receitaDiv.dataset.id = receitaId;
    receitaDiv.innerHTML = `
        <input type="text" placeholder="Nome da receita" value="${nome}" data-tipo="nome" data-id="${receitaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${receitaId}">
        <button class="btn btn-danger" onclick="removerReceita(${receitaId})">Remover</button>
    `;
    receitasContainer.appendChild(receitaDiv);

    // Adicionar event listeners
    receitaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            // Sincronizar com a tabela
            sincronizarReceita(receitaId);
            calcularValores();
        });
    });
};

const sincronizarReceita = (id) => {
    const modalInput = document.querySelector(`.receita-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.receita-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerReceita = (id) => {
    // Remover da tabela
    const tabelaRow = document.querySelector(`.receita-row[data-id="${id}"]`);
    if (tabelaRow) {
        tabelaRow.remove();
    }
    
    // Remover do modal
    const modalDiv = document.querySelector(`.receita-item[data-id="${id}"]`);
    if (modalDiv) {
        modalDiv.remove();
    }
    
    calcularValores();
};

// Tornar removerReceita global
window.removerReceita = removerReceita;