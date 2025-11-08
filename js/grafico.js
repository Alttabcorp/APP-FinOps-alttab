// Funções de gráfico

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