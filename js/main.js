// Arquivo principal - Inicialização e event listeners

// Elementos do DOM
const canvas = document.getElementById('grafico');
const ctx = canvas.getContext('2d');
const openConfigBtn = document.getElementById('openConfigBtn');
const configModal = document.getElementById('configModal');
const closeModal = configModal.querySelector('.close');
const addReceitaBtn = document.getElementById('addReceitaBtn');
const receitasContainer = document.getElementById('receitasContainer');
const addDespesaFixaBtn = document.getElementById('addDespesaFixaBtn');
const addDespesaVariavelBtn = document.getElementById('addDespesaVariavelBtn');
const despesasFixasContainer = document.getElementById('despesasFixasContainer');
const despesasVariaveisContainer = document.getElementById('despesasVariaveisContainer');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

// Event listeners
openConfigBtn.addEventListener('click', abrirModal);
closeModal.addEventListener('click', fecharModal);
addReceitaBtn.addEventListener('click', () => adicionarReceita());
addDespesaFixaBtn.addEventListener('click', () => adicionarDespesaFixa());
addDespesaVariavelBtn.addEventListener('click', () => adicionarDespesaVariavel());
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
    ajustarCanvas();
    carregarDados();

    // Adicionar event listeners das abas após o DOM carregar
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            alternarAba(tabName);
        });
    });
});
window.addEventListener('resize', ajustarCanvas);