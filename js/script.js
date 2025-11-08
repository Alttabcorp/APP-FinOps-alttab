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

        // Função para formatar valores em reais
        const formatarMoeda = (valor) => {
            return valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        };

        // Função para carregar dados do localStorage
        const carregarDados = () => {
            // Carregar receitas
            const receitasSalvas = localStorage.getItem('receitas');
            if (receitasSalvas) {
                const receitas = JSON.parse(receitasSalvas);
                receitas.forEach(receita => {
                    adicionarReceita(receita.nome, receita.valor);
                });
            } else {
                // Adicionar receita padrão se não houver nenhuma
                adicionarReceita('Salário', '');
            }
            
            // Carregar despesas fixas
            const despesasFixasSalvas = localStorage.getItem('despesasFixas');
            if (despesasFixasSalvas) {
                const despesasFixas = JSON.parse(despesasFixasSalvas);
                despesasFixas.forEach(despesa => {
                    adicionarDespesaFixa(despesa.nome, despesa.valor);
                });
            } else {
                // Adicionar despesas fixas padrão se não houver nenhuma
                adicionarDespesaFixa('Água', '');
                adicionarDespesaFixa('Energia', '');
                adicionarDespesaFixa('Aluguel', '');
                adicionarDespesaFixa('Internet', '');
            }
            
            // Carregar despesas variáveis
            const despesasVariaveisSalvas = localStorage.getItem('despesasVariaveis');
            if (despesasVariaveisSalvas) {
                const despesasVariaveis = JSON.parse(despesasVariaveisSalvas);
                despesasVariaveis.forEach(despesa => {
                    adicionarDespesaVariavel(despesa.nome, despesa.valor);
                });
            } else {
                // Adicionar despesas variáveis padrão se não houver nenhuma
                adicionarDespesaVariavel('Gastos no Cartão', '');
                adicionarDespesaVariavel('Supermercado', '');
            }
            
            calcularValores();
        };

        // Função para salvar dados no localStorage
        const salvarDados = () => {
            // Salvar receitas
            const receitas = [];
            document.querySelectorAll('.receita-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    receitas.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            localStorage.setItem('receitas', JSON.stringify(receitas));
            
            // Salvar despesas fixas
            const despesasFixas = [];
            document.querySelectorAll('.despesa-fixa-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    despesasFixas.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            localStorage.setItem('despesasFixas', JSON.stringify(despesasFixas));
            
            // Salvar despesas variáveis
            const despesasVariaveis = [];
            document.querySelectorAll('.despesa-variavel-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    despesasVariaveis.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            localStorage.setItem('despesasVariaveis', JSON.stringify(despesasVariaveis));
        };

        // Função para salvar configurações explicitamente
        const salvarConfiguracoes = () => {
            salvarDados();
            alert('Configurações salvas com sucesso!');
            fecharModal();
        };

        // Função para exportar configurações
        const exportarConfiguracoes = () => {
            const configuracoes = {
                receitas: [],
                despesasFixas: [],
                despesasVariaveis: []
            };
            
            // Coletar receitas
            document.querySelectorAll('.receita-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    configuracoes.receitas.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            
            // Coletar despesas fixas
            document.querySelectorAll('.despesa-fixa-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    configuracoes.despesasFixas.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            
            // Coletar despesas variáveis
            document.querySelectorAll('.despesa-variavel-item').forEach(item => {
                const nomeInput = item.querySelector('input[data-tipo="nome"]');
                const valorInput = item.querySelector('input[data-tipo="valor"]');
                if (nomeInput && valorInput) {
                    configuracoes.despesasVariaveis.push({
                        nome: nomeInput.value,
                        valor: valorInput.value
                    });
                }
            });
            
            const dataStr = JSON.stringify(configuracoes, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'configuracoes-financeiras.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        };

        // Função para importar configurações
        const importarConfiguracoes = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const configuracoes = JSON.parse(e.target.result);
                        
                        // Importar receitas
                        if (configuracoes.receitas && Array.isArray(configuracoes.receitas)) {
                            receitasContainer.innerHTML = '';
                            configuracoes.receitas.forEach(receita => {
                                adicionarReceita(receita.nome, receita.valor);
                            });
                        }
                        
                        // Importar despesas fixas
                        if (configuracoes.despesasFixas && Array.isArray(configuracoes.despesasFixas)) {
                            despesasFixasContainer.innerHTML = '';
                            configuracoes.despesasFixas.forEach(despesa => {
                                adicionarDespesaFixa(despesa.nome, despesa.valor);
                            });
                        }
                        
                        // Importar despesas variáveis
                        if (configuracoes.despesasVariaveis && Array.isArray(configuracoes.despesasVariaveis)) {
                            despesasVariaveisContainer.innerHTML = '';
                            configuracoes.despesasVariaveis.forEach(despesa => {
                                adicionarDespesaVariavel(despesa.nome, despesa.valor);
                            });
                        }
                        
                        // Suporte para formato antigo (despesas misturadas)
                        if (configuracoes.despesas && Array.isArray(configuracoes.despesas) && !configuracoes.despesasFixas && !configuracoes.despesasVariaveis) {
                            despesasFixasContainer.innerHTML = '';
                            despesasVariaveisContainer.innerHTML = '';
                            configuracoes.despesas.forEach(despesa => {
                                if (despesa.tipo === 'fixo') {
                                    adicionarDespesaFixa(despesa.nome, despesa.valor);
                                } else {
                                    adicionarDespesaVariavel(despesa.nome, despesa.valor);
                                }
                            });
                        }
                        
                        salvarDados();
                        calcularValores();
                        alert('Configurações importadas com sucesso!');
                    } catch (error) {
                        alert('Erro ao importar configurações. Verifique se o arquivo é válido.');
                    }
                };
                reader.readAsText(file);
            }
        };

        // Função para resetar configurações
        const resetarConfiguracoes = () => {
            if (confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
                // Resetar receitas
                receitasContainer.innerHTML = '';
                adicionarReceita(); // Adicionar uma receita vazia
                
                // Resetar despesas fixas
                despesasFixasContainer.innerHTML = '';
                adicionarDespesaFixa('Água', '');
                adicionarDespesaFixa('Energia', '');
                adicionarDespesaFixa('Aluguel', '');
                adicionarDespesaFixa('Internet', '');
                
                // Resetar despesas variáveis
                despesasVariaveisContainer.innerHTML = '';
                adicionarDespesaVariavel('Gastos no Cartão', '');
                adicionarDespesaVariavel('Supermercado', '');
                
                // Limpar localStorage
                localStorage.clear();
                calcularValores();
                alert('Configurações resetadas com sucesso!');
            }
        };

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

        // Funções para despesas dinâmicas
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

        const removerDespesaFixa = (id) => {
            const despesaDiv = document.querySelector(`[data-id="${id}"]`).closest('.despesa-fixa-item');
            if (despesaDiv) {
                despesaDiv.remove();
                calcularValores();
            }
        };

        const removerDespesaVariavel = (id) => {
            const despesaDiv = document.querySelector(`[data-id="${id}"]`).closest('.despesa-variavel-item');
            if (despesaDiv) {
                despesaDiv.remove();
                calcularValores();
            }
        };

        // Tornar funções globais
        window.removerDespesaFixa = removerDespesaFixa;
        window.removerDespesaVariavel = removerDespesaVariavel;

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

        // Função para calcular todos os valores
        const calcularValores = () => {
            // Calcular total de receitas
            let valorRecebido = 0;
            document.querySelectorAll('.receita-item input[data-tipo="valor"]').forEach(input => {
                valorRecebido += parseFloat(input.value) || 0;
            });
            
            // Calcular custos fixos
            let custosFixos = 0;
            document.querySelectorAll('.despesa-fixa-item input[data-tipo="valor"]').forEach(input => {
                custosFixos += parseFloat(input.value) || 0;
            });
            
            // Calcular gastos variáveis
            let gastosVariaveis = 0;
            document.querySelectorAll('.despesa-variavel-item input[data-tipo="valor"]').forEach(input => {
                gastosVariaveis += parseFloat(input.value) || 0;
            });

            // Cálculos
            const poupanca = valorRecebido * 0.1;
            const sociedade = 100;
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
        // Removido: inputs.forEach(input => { ... }) pois os inputs são criados dinamicamente

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