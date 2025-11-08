        // Elementos do DOM
        const form = document.getElementById('financialForm');
        const inputs = form.querySelectorAll('input');
        const canvas = document.getElementById('grafico');
        const ctx = canvas.getContext('2d');

        // Função para formatar valores em reais
        const formatarMoeda = (valor) => {
            return valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        };

        // Função para carregar dados do localStorage
        const carregarDados = () => {
            inputs.forEach(input => {
                const valorSalvo = localStorage.getItem(input.id);
                if (valorSalvo) {
                    input.value = valorSalvo;
                }
            });
            calcularValores();
        };

        // Função para salvar dados no localStorage
        const salvarDados = () => {
            inputs.forEach(input => {
                localStorage.setItem(input.id, input.value);
            });
        };

        // Função para calcular todos os valores
        const calcularValores = () => {
            const valorRecebido = parseFloat(document.getElementById('valorRecebido').value) || 0;
            const custoAgua = parseFloat(document.getElementById('custoAgua').value) || 0;
            const custoEnergia = parseFloat(document.getElementById('custoEnergia').value) || 0;
            const custoAluguel = parseFloat(document.getElementById('custoAluguel').value) || 0;
            const custoInternet = parseFloat(document.getElementById('custoInternet').value) || 0;
            const gastoCartao = parseFloat(document.getElementById('gastoCartao').value) || 0;

            // Cálculos
            const poupanca = valorRecebido * 0.1;
            const sociedade = 100;
            const custosFixos = custoAgua + custoEnergia + custoAluguel + custoInternet;
            const gastosVariaveis = gastoCartao;
            const saldoFinal = valorRecebido - poupanca - sociedade - custosFixos - gastosVariaveis;

            // Atualizar valores na tela
            document.getElementById('receitaTotal').textContent = formatarMoeda(valorRecebido);
            document.getElementById('poupanca').textContent = formatarMoeda(poupanca);
            document.getElementById('sociedade').textContent = formatarMoeda(sociedade);
            document.getElementById('custosFixos').textContent = formatarMoeda(custosFixos);
            document.getElementById('gastosVariaveis').textContent = formatarMoeda(gastosVariaveis);
            document.getElementById('saldoFinal').textContent = formatarMoeda(saldoFinal);

            // Atualizar gráfico
            desenharGrafico(poupanca, sociedade, custosFixos, gastosVariaveis, saldoFinal);
            
            // Salvar dados
            salvarDados();
        };

        // Função para desenhar o gráfico
        const desenharGrafico = (poupanca, sociedade, custosFixos, gastosVariaveis, saldoFinal) => {
            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Configurações do gráfico
            const alturaMaxima = canvas.height - 60;
            const larguraBarra = 80;
            const espacamento = 40;
            const valores = [poupanca, sociedade, custosFixos, gastosVariaveis, saldoFinal];
            const labels = ['Poupança', 'Sociedade', 'Fixos', 'Variáveis', 'Saldo'];
            const cores = ['#1a73e8', '#4285f4', '#34a853', '#fbbc05', '#ea4335'];

            // Encontrar o valor máximo para escala
            const valorMaximo = Math.max(...valores);

            // Desenhar barras
            valores.forEach((valor, index) => {
                const x = (index * (larguraBarra + espacamento)) + 50;
                const altura = (valor / valorMaximo) * alturaMaxima;
                const y = canvas.height - altura - 30;

                // Desenhar barra
                ctx.fillStyle = cores[index];
                ctx.fillRect(x, y, larguraBarra, altura);

                // Desenhar valor
                ctx.fillStyle = '#202124';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(formatarMoeda(valor), x + larguraBarra/2, y - 5);

                // Desenhar label
                ctx.fillText(labels[index], x + larguraBarra/2, canvas.height - 10);
            });
        };

        // Event listeners
        inputs.forEach(input => {
            input.addEventListener('input', calcularValores);
        });

        // Ajustar tamanho do canvas
        const ajustarCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            calcularValores();
        };

        window.addEventListener('load', () => {
            ajustarCanvas();
            carregarDados();
        });
        window.addEventListener('resize', ajustarCanvas);