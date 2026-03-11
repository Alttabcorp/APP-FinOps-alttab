// Funções para gerenciar contas fixas

const adicionarConta = (nome = '', valor = '') => {
    const contaId = Date.now();
    
    // Adicionar na tabela principal
    const tabelaContas = document.getElementById('tabelaContas');
    if (tabelaContas) {
        const tr = document.createElement('tr');
        tr.className = 'conta-row';
        tr.dataset.id = contaId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome da conta" value="${nome}" data-tipo="nome" data-id="${contaId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${contaId}" class="input-tabela">
            </td>
        `;
        tabelaContas.appendChild(tr);
        
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                salvarDados();
                calcularValores();
            });
        });
    }
    
    // Adicionar no modal
    const contaDiv = document.createElement('div');
    contaDiv.className = 'conta-item';
    contaDiv.dataset.id = contaId;
    contaDiv.innerHTML = `
        <input type="text" placeholder="Nome da conta" value="${nome}" data-tipo="nome" data-id="${contaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${contaId}">
        <button class="btn btn-danger" onclick="removerConta(${contaId})">Remover</button>
    `;
    contasContainer.appendChild(contaDiv);

    contaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            sincronizarConta(contaId);
            salvarDados();
            calcularValores();
        });
    });
    
    // Salvar e recalcular após adicionar
    salvarDados();
    calcularValores();
};

const sincronizarConta = (id) => {
    const modalInput = document.querySelector(`.conta-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.conta-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerConta = (id) => {
    const tabelaRow = document.querySelector(`.conta-row[data-id="${id}"]`);
    if (tabelaRow) tabelaRow.remove();
    
    const modalDiv = document.querySelector(`.conta-item[data-id="${id}"]`);
    if (modalDiv) modalDiv.remove();
    
    // Salvar e recalcular após remover
    salvarDados();
    calcularValores();
};

window.removerConta = removerConta;
