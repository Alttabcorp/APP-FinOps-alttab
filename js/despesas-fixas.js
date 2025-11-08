// Funções para despesas fixas dinâmicas

const adicionarDespesaFixa = (nome = '', valor = '') => {
    const despesaId = Date.now(); // ID único
    const despesaDiv = document.createElement('div');
    despesaDiv.className = 'despesa-item despesa-fixa-item';
    despesaDiv.innerHTML = `
        <input type="text" placeholder="Nome da despesa fixa" value="${nome}" data-tipo="nome" data-id="${despesaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}">
        <button class="btn btn-danger" onclick="removerDespesaFixa(${despesaId})">Remover</button>
    `;
    despesasFixasContainer.appendChild(despesaDiv);

    // Adicionar event listeners
    despesaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calcularValores);
    });
};

const removerDespesaFixa = (id) => {
    const despesaDiv = document.querySelector(`[data-id="${id}"]`).closest('.despesa-fixa-item');
    if (despesaDiv) {
        despesaDiv.remove();
        calcularValores();
    }
};

// Tornar removerDespesaFixa global
window.removerDespesaFixa = removerDespesaFixa;