// Funções para gerenciar itens de saldo

const adicionarSaldo = (nome = '', valor = '') => {
    const saldoId = Date.now();
    
    // Adicionar na tabela principal
    const tabelaSaldo = document.getElementById('tabelaSaldo');
    if (tabelaSaldo) {
        const tr = document.createElement('tr');
        tr.className = 'saldo-row';
        tr.dataset.id = saldoId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome" value="${nome}" data-tipo="nome" data-id="${saldoId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${saldoId}" class="input-tabela">
            </td>
        `;
        tabelaSaldo.appendChild(tr);
        
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                salvarDados();
                calcularValores();
            });
        });
    }
    
    // Adicionar no modal
    const saldoDiv = document.createElement('div');
    saldoDiv.className = 'saldo-item';
    saldoDiv.dataset.id = saldoId;
    saldoDiv.innerHTML = `
        <input type="text" placeholder="Nome (ex: Projeto, Pesquisa)" value="${nome}" data-tipo="nome" data-id="${saldoId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${saldoId}">
        <button class="btn btn-danger" onclick="removerSaldo(${saldoId})">Remover</button>
    `;
    saldoContainer.appendChild(saldoDiv);

    saldoDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            sincronizarSaldo(saldoId);
            salvarDados();
            calcularValores();
        });
    });
    
    // Salvar e recalcular após adicionar
    salvarDados();
    calcularValores();
};

const sincronizarSaldo = (id) => {
    const modalInput = document.querySelector(`.saldo-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.saldo-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerSaldo = (id) => {
    const tabelaRow = document.querySelector(`.saldo-row[data-id="${id}"]`);
    if (tabelaRow) tabelaRow.remove();
    
    const modalDiv = document.querySelector(`.saldo-item[data-id="${id}"]`);
    if (modalDiv) modalDiv.remove();
    
    // Salvar e recalcular após remover
    salvarDados();
    calcularValores();
};

window.removerSaldo = removerSaldo;
