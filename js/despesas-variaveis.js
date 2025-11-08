// Funções para despesas variáveis dinâmicas

const adicionarDespesaVariavel = (nome = '', valor = '') => {
    const despesaId = Date.now(); // ID único
    const despesaDiv = document.createElement('div');
    despesaDiv.className = 'despesa-item despesa-variavel-item';
    despesaDiv.innerHTML = `
        <input type="text" placeholder="Nome da despesa variável" value="${nome}" data-tipo="nome" data-id="${despesaId}">
        <input type="number" placeholder="Valor" value="${valor}" step="0.01" data-tipo="valor" data-id="${despesaId}">
        <button class="btn btn-danger" onclick="removerDespesaVariavel(${despesaId})">Remover</button>
    `;
    despesasVariaveisContainer.appendChild(despesaDiv);

    // Adicionar event listeners
    despesaDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calcularValores);
    });
};

const removerDespesaVariavel = (id) => {
    const despesaDiv = document.querySelector(`[data-id="${id}"]`).closest('.despesa-variavel-item');
    if (despesaDiv) {
        despesaDiv.remove();
        calcularValores();
    }
};

// Tornar removerDespesaVariavel global
window.removerDespesaVariavel = removerDespesaVariavel;