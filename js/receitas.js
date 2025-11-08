// Funções para receitas dinâmicas

const adicionarReceita = (nome = '', valor = '') => {
    const receitaId = Date.now(); // ID único
    const receitaDiv = document.createElement('div');
    receitaDiv.className = 'receita-item';
    receitaDiv.innerHTML = `
        <input type="text" placeholder="Nome da receita" value="${nome}" data-tipo="nome" data-id="${receitaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${receitaId}">
        <button class="btn btn-danger" onclick="removerReceita(${receitaId})">Remover</button>
    `;
    receitasContainer.appendChild(receitaDiv);

    // Adicionar event listeners
    receitaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calcularValores);
    });
};

const removerReceita = (id) => {
    const receitaDiv = document.querySelector(`[data-id="${id}"]`).closest('.receita-item');
    if (receitaDiv) {
        receitaDiv.remove();
        calcularValores();
    }
};

// Tornar removerReceita global
window.removerReceita = removerReceita;