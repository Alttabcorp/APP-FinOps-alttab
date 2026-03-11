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
    console.log('Alternando para aba:', tabName);
    
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Adicionar classe active na aba selecionada
    const btnSelecionado = document.querySelector(`[data-tab="${tabName}"]`);
    const painelSelecionado = document.getElementById(tabName);
    
    if (btnSelecionado) {
        btnSelecionado.classList.add('active');
        console.log('Botão ativado:', tabName);
    } else {
        console.error('Botão não encontrado:', tabName);
    }
    
    if (painelSelecionado) {
        painelSelecionado.classList.add('active');
        console.log('Painel ativado:', tabName);
    } else {
        console.error('Painel não encontrado:', tabName);
    }
};