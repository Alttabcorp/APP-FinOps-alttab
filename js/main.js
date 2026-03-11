// Arquivo principal - Inicialização e event listeners

// Elementos do DOM
const canvas = document.getElementById('grafico');
const ctx = canvas.getContext('2d');
const openConfigBtn = document.getElementById('openConfigBtn');
const configModal = document.getElementById('configModal');
const closeModal = configModal.querySelector('.close');

// Novos containers
const saldoContainer = document.getElementById('saldoContainer');
const extraContainer = document.getElementById('extraContainer');
const contasContainer = document.getElementById('contasContainer');
const extraMesContainer = document.getElementById('extraMesContainer');

// Novos botões
const addSaldoBtn = document.getElementById('addSaldoBtn');
const addExtraBtn = document.getElementById('addExtraBtn');
const addContaBtn = document.getElementById('addContaBtn');
const addExtraMesBtn = document.getElementById('addExtraMesBtn');

const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

// Event listeners
openConfigBtn.addEventListener('click', abrirModal);
closeModal.addEventListener('click', fecharModal);

addSaldoBtn.addEventListener('click', () => adicionarSaldo());
addExtraBtn.addEventListener('click', () => adicionarExtra());
addContaBtn.addEventListener('click', () => adicionarConta());
addExtraMesBtn.addEventListener('click', () => adicionarExtraMes());

saveBtn.addEventListener('click', salvarConfiguracoes);
cancelBtn.addEventListener('click', fecharModal);
exportBtn.addEventListener('click', exportarConfiguracoes);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importarConfiguracoes);
resetBtn.addEventListener('click', resetarConfiguracoes);

// Ajustar tamanho do canvas
const ajustarCanvas = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    calcularValores();
};

window.addEventListener('load', () => {
    console.log('Página carregada, inicializando...');
    ajustarCanvas();
    carregarDados();

    // Adicionar event listeners das abas após o DOM carregar
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log('Botões de aba encontrados:', tabButtons.length);
    
    tabButtons.forEach((btn, index) => {
        const tabName = btn.getAttribute('data-tab');
        console.log(`Adicionando listener para aba ${index + 1}:`, tabName);
        btn.addEventListener('click', () => {
            console.log('Clique detectado na aba:', tabName);
            alternarAba(tabName);
        });
    });

    // Event listeners para despesas variáveis
    const feiraReal = document.getElementById('feiraReal');
    const cartaoReal = document.getElementById('cartaoReal');
    const gasolinaReal = document.getElementById('gasolinaReal');

    if (feiraReal) {
        feiraReal.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    }
    if (cartaoReal) {
        cartaoReal.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    }
    if (gasolinaReal) {
        gasolinaReal.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    }

    // Event listeners para investimentos
    const alttabReal = document.getElementById('alttabReal');
    const fundoReal = document.getElementById('fundoReal');
    const poupancaReal = document.getElementById('poupancaReal');

    if (alttabReal) {
        alttabReal.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    }
    if (fundoReal) {
        fundoReal.addEventListener('input', () => {
            salvarDados();
            calcularValores();
        });
    }
    if (poupancaReal) {
        poupancaReal.addEventListener('input', () => {
            // Marcar que foi editado manualmente
            poupancaReal.dataset.editadoManualmente = 'true';
            salvarDados();
            calcularValores();
        });
    }
});
window.addEventListener('resize', ajustarCanvas);