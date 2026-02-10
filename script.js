const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDD-3bcwgeWTRlTQyHaWAI-N5nGdd9kxe34pBpLOS0M3v5-1GfEs7ANaCF1vFVvFzhG3FfhqoOjOwq/pub?output=csv';
const API_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbx9z6JBOgLXAWMYe7eMsRFboewiquCc0JhvgkN3_IabOGLRSojEZ39KIyBp-VH1x6yP/exec';
const MEU_WHATSAPP = '5583999646934';

async function carregarDados() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const linhas = data.split('\n').slice(1);

        const contagem = {};
        const numerosOcupados = [];

        linhas.forEach((linha, index) => {
            const colunas = linha.split(',');
            const nome = colunas[0]?.trim();
            const numeroCota = (index + 1).toString();

            if (nome && nome !== "" && !/^\d+$/.test(nome)) {
                contagem[nome] = (contagem[nome] || 0) + 1;
                numerosOcupados.push(numeroCota);
            }
        });

        // 1. Ranking
        const rankingRaw = Object.entries(contagem)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        const premios = ["10% off", "5% off", "Pelicula + Capinha"];
        renderizarRanking(rankingRaw.map((item, i) => ({ ...item, premio: premios[i] })));

        // 2. Grade de Números
        gerarNumerosDisponiveis(numerosOcupados);

    } catch (er) {
        console.error("Erro ao carregar dados:", er);
    }
}

function renderizarRanking(dados) {
    const container = document.getElementById('ranking-list');
    if (!container) return;

    if (dados.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center italic">Nenhuma compra registrada ainda.</p>';
        return;
    }

    container.innerHTML = dados.map((c, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-xl mb-3">
            <div class="flex items-center gap-4">
                <span class="text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}">${index + 1}º</span>
                <div>
                    <p class="font-bold uppercase text-sm">${c.nome}</p>
                    <p class="text-[10px] text-emerald-400 font-medium">${c.premio}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-lg font-bold">${c.total}</p>
                <p class="text-[10px] text-gray-400 uppercase">Cotas</p>
            </div>
        </div>
    `).join('');
}

function gerarNumerosDisponiveis(ocupados) {
    const grid = document.getElementById('numeros-grid');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 200; i++) {
        const numeroStr = i.toString();
        const estaOcupado = ocupados.includes(numeroStr);

        if (!estaOcupado) {
            html += `
                <button onclick="reservarCota(${i})" 
                        class="bg-gray-700 hover:bg-emerald-600 text-white text-xs font-bold p-2 rounded-lg border border-gray-600 active:scale-95 transition-all">
                    ${i}
                </button>`;
        } else {
            html += `
                <div class="bg-red-900/30 text-gray-500 text-xs p-2 rounded-lg border border-red-900/50 cursor-not-allowed opacity-50 text-center">
                    ${i}
                </div>`;
        }
    }
    grid.innerHTML = html;
}

function atualizarCronometro() {
    // Sorteio: 14 de Fevereiro de 2026 às 19:00
    const dataSorteio = new Date('2026-02-14T19:00:00').getTime();
    const agora = new Date().getTime();
    const diferenca = dataSorteio - agora;
    const display = document.getElementById('countdown');

    if (!display) return;

    if (diferenca <= 0) {
        display.innerHTML = "🚀 O SORTEIO COMEÇOU!";
        return;
    }

    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

    const pad = (n) => n.toString().padStart(2, '0');
    display.innerText = `${pad(dias)}d ${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`;
}

async function reservarCota(numero) {
    const nome = prompt(`🛒 RESERVA DO NÚMERO ${numero}\n\nDigite seu nome completo:`);

    if (!nome || nome.trim().length < 3) {
        alert("Nome inválido!");
        return;
    }

    try {
        await fetch(API_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ nome: nome, numero: numero })
        });

        alert("✅ Sucesso! Agora confirme no WhatsApp.");
        const mensagem = window.encodeURIComponent(`Olá! Sou ${nome} e reservei o número ${numero}. Como faço o pagamento?`);
        window.location.href = `https://wa.me/${MEU_WHATSAPP}?text=${mensagem}`;

    } catch (err) {
        alert("Erro na conexão.");
    }
}

// Inicialização
carregarDados();
setInterval(atualizarCronometro, 1000);
atualizarCronometro();

document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const msgPadrao = window.encodeURIComponent("Olá! Tudo bem? Acabei de escolher meus números no site e gostaria de receber os dados para realizar o pagamento via Pix. Fico no aguardo!");
    window.open(`https://wa.me/${MEU_WHATSAPP}?text=${msgPadrao}`, '_blank');
});