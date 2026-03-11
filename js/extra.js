// Funções para gerenciar itens de extra

const adicionarExtra = (nome = '', valor = '') => {
    const extraId = Date.now();
    
    // Adicionar no modal
    const extraDiv = document.createElement('div');
    extraDiv.className = 'extra-item';
    extraDiv.dataset.id = extraId;
    extraDiv.innerHTML = `
        <input type="text" placeholder="Nome (ex: Vale-Transporte, Provento Fundo)" value="${nome}" data-tipo="nome" data-id="${extraId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${extraId}">
        <button class="btn btn-danger" onclick="removerExtra(${extraId})">Remover</button>
    `;
    extraContainer.appendChild(extraDiv);

    extraDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    });
    
    // Salvar e recalcular após adicionar
    salvarDados();
    calcularValores();
};

const removerExtra = (id) => {
    const modalDiv = document.querySelector(`.extra-item[data-id="${id}"]`);
    if (modalDiv) modalDiv.remove();
    
    // Salvar e recalcular após remover
    salvarDados();
    calcularValores();
};

window.removerExtra = removerExtra;
