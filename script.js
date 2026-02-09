const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDD-3bcwgeWTRlTQyHaWAI-N5nGdd9kxe34pBpLOS0M3v5-1GfEs7ANaCF1vFVvFzhG3FfhqoOjOwq/pub?output=csv';

async function carregarDados() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const linhas = data.split('\n').slice(1); // Pula o cabeçalho

        const contagem = {};

        linhas.forEach(linha => {
            const colunas = linha.split(',');
            const nome = colunas[0]?.trim(); // Pega a primeira coluna (Nome)

            if (nome && !/^\d+$/.test(nome)) { // Ignora se for apenas número ou vazio
                contagem[nome] = (contagem[nome] || 0) + 1;
            }
        });

        // Transforma em array, ordena por quem tem mais e pega o Top 3
        const rankingRaw = Object.entries(contagem)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        // Define os prêmios fixos baseados na sua planilha
        const premios = ["10% off", "5% off", "Pelicula + Capinha"];
        const rankingFinal = rankingRaw.map((item, i) => ({
            ...item,
            premio: premios[i]
        }));

        renderizarRanking(rankingFinal);
    } catch (er) {
        console.error("Erro ao ler planilha:", er);
    }
}

function renderizarRanking(dados) {
    const container = document.getElementById('ranking-list');
    container.innerHTML = dados.map((c, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-xl mb-3">
            <div class="flex items-center gap-4">
                <span class="text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}">${index + 1}º</span>
                <div>
                    <p class="font-bold uppercase">${c.nome}</p>
                    <p class="text-xs text-emerald-400 font-medium">${c.premio}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-lg font-bold">${c.total}</p>
                <p class="text-[10px] text-gray-400 uppercase">Cotas</p>
            </div>
        </div>
    `).join('');
}

carregarDados();