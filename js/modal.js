// Funções da modal

const abrirModal = () => {
    configModal.style.display = 'block';
};

const fecharModal = () => {
    configModal.style.display = 'none';
};

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === configModal) {
        fecharModal();
    }
});

// Funções das abas
const alternarAba = (tabName) => {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Adicionar classe active na aba selecionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
};