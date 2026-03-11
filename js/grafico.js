// Funções de gráfico

// Função para desenhar o gráfico
const desenharGrafico = (dados) => {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Valores e labels
    const valores = [
        dados.totalContas || 0,
        dados.totalExtraMes || 0,
        dados.feiraReal || 0,
        dados.cartaoReal || 0,
        dados.gasolinaReal || 0,
        dados.poupancaTotal || 0,
        dados.alttabValor || 0,
        dados.fundoTotal || 0,
        dados.metaFinal || 0,
        dados.gastoIndividual || 0
    ];
    
    const labels = [
        'Contas',
        'Extra Mês',
        'Feira',
        'Cartão',
        'Gasolina',
        'Poupança',
        'Alttab',
        'Fundo',
        'Meta',
        'Individual'
    ];
    
    const cores = [
        '#ef4444', // Vermelho - Contas
        '#f59e0b', // Laranja - Extra Mês
        '#fbbf24', // Amarelo - Feira
        '#fb923c', // Laranja claro - Cartão
        '#facc15', // Amarelo claro - Gasolina
        '#10b981', // Verde - Poupança
        '#059669', // Verde escuro - Alttab
        '#14b8a6', // Teal - Fundo
        '#8b5cf6', // Roxo - Meta
        '#a78bfa'  // Roxo claro - Individual
    ];

    // Configurações do gráfico
    const alturaMaxima = canvas.height - 80;
    const larguraBarra = Math.min(50, (canvas.width - 100) / valores.length);
    const espacamento = 10;
    
    // Encontrar o valor máximo para escala
    const valorMaximo = Math.max(...valores, 1);

    // Desenhar barras
    valores.forEach((valor, index) => {
        const x = (index * (larguraBarra + espacamento)) + 50;
        const altura = (valor / valorMaximo) * alturaMaxima;
        const y = canvas.height - altura - 60;

        // Desenhar barra
        ctx.fillStyle = cores[index];
        ctx.fillRect(x, y, larguraBarra, altura);

        // Desenhar valor (apenas se maior que 0)
        if (valor > 0) {
            ctx.fillStyle = '#202124';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formatarMoeda(valor), x + larguraBarra/2, y - 5);
        }

        // Desenhar label
        ctx.fillStyle = '#495057';
        ctx.font = '10px Arial';
        ctx.save();
        ctx.translate(x + larguraBarra/2, canvas.height - 10);
        ctx.rotate(-Math.PI/4);
        ctx.textAlign = 'right';
        ctx.fillText(labels[index], 0, 0);
        ctx.restore();
    });
};