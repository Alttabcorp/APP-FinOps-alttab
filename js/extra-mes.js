// Funções para gerenciar extra do mês

const adicionarExtraMes = (nome = '', valor = '') => {
    const extraId = Date.now();
    
    // Adicionar na tabela principal
    const tabelaExtraMes = document.getElementById('tabelaExtraMes');
    if (tabelaExtraMes) {
        const tr = document.createElement('tr');
        tr.className = 'extra-mes-row';
        tr.dataset.id = extraId;
        tr.innerHTML = `
            <td>
                <input type="text" placeholder="Nome" value="${nome}" data-tipo="nome" data-id="${extraId}" class="input-tabela" style="text-align: left;">
            </td>
            <td>
                <input type="number" placeholder="0,00" value="${valor}" step="0.01" data-tipo="valor" data-id="${extraId}" class="input-tabela">
            </td>
        `;
        tabelaExtraMes.appendChild(tr);
        
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                salvarDados();
                calcularValores();
            });
        });
    }
    
    // Adicionar no modal
    const extraDiv = document.createElement('div');
    extraDiv.className = 'extra-mes-item';
    extraDiv.dataset.id = extraId;
    extraDiv.innerHTML = `
        <input type="text" placeholder="Nome (ex: Gás, Compras extras)" value="${nome}" data-tipo="nome" data-id="${extraId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${extraId}">
        <button class="btn btn-danger" onclick="removerExtraMes(${extraId})">Remover</button>
    `;
    extraMesContainer.appendChild(extraDiv);

    extraDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            sincronizarExtraMes(extraId);
            salvarDados();
            calcularValores();
        });
    });
    
    // Salvar e recalcular após adicionar
    salvarDados();
    calcularValores();
};

const sincronizarExtraMes = (id) => {
    const modalInput = document.querySelector(`.extra-mes-item[data-id="${id}"]`);
    const tabelaRow = document.querySelector(`.extra-mes-row[data-id="${id}"]`);
    
    if (modalInput && tabelaRow) {
        const nomeModal = modalInput.querySelector('input[data-tipo="nome"]').value;
        const valorModal = modalInput.querySelector('input[data-tipo="valor"]').value;
        
        tabelaRow.querySelector('input[data-tipo="nome"]').value = nomeModal;
        tabelaRow.querySelector('input[data-tipo="valor"]').value = valorModal;
    }
};

const removerExtraMes = (id) => {
    const tabelaRow = document.querySelector(`.extra-mes-row[data-id="${id}"]`);
    if (tabelaRow) tabelaRow.remove();
    
    const modalDiv = document.querySelector(`.extra-mes-item[data-id="${id}"]`);
    if (modalDiv) modalDiv.remove();
    
    // Salvar e recalcular após remover
    salvarDados();
    calcularValores();
};

window.removerExtraMes = removerExtraMes;
