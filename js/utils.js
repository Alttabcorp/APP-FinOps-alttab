// Funções utilitárias

// Função para formatar valores em reais
const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
};