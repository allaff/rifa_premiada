const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDD-3bcwgeWTRlTQyHaWAI-N5nGdd9kxe34pBpLOS0M3v5-1GfEs7ANaCF1vFVvFzhG3FfhqoOjOwq/pub?output=csv';
const API_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbx9z6JBOgLXAWMYe7eMsRFboewiquCc0JhvgkN3_IabOGLRSojEZ39KIyBp-VH1x6yP/exec';
const MEU_WHATSAPP = '5583999646934';

let numerosSelecionados = [];

// Função para buscar dados e atualizar interface
async function carregarDados() {
    try {
        // O "?t=" + data atual força o navegador a buscar sempre a versão mais nova da planilha
        const cacheBuster = new Date().getTime();
        const response = await fetch(`${SHEET_URL}&t=${cacheBuster}`);
        const data = await response.text();

        // Divide por linhas e remove espaços em branco extras
        const linhas = data.split('\n').map(l => l.trim()).slice(1);

        const contagem = {};
        const numerosOcupados = [];

        linhas.forEach((linha, index) => {
            const colunas = linha.split(',');
            let nome = colunas[0] ? colunas[0].trim() : "";
            const numeroCota = (index + 1).toString();

            // CRITÉRIO DE DISPONIBILIDADE:
            // Um número só é considerado OCUPADO se:
            // 1. O campo nome NÃO estiver vazio
            // 2. O campo nome NÃO contiver a palavra "Pendente"
            // 3. O campo nome NÃO for apenas o número da cota (reset da planilha)
            const estaVazio = nome === "" || nome === undefined;
            const estaPendente = nome.toLowerCase().includes("pendente");
            const ehApenasNumero = /^\d+$/.test(nome);

            if (!estaVazio && !estaPendente && !ehApenasNumero) {
                contagem[nome] = (contagem[nome] || 0) + 1;
                numerosOcupados.push(numeroCota);
            }
        });

        // Atualiza Ranking e Grade
        const rankingRaw = Object.entries(contagem)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        const premios = ["10% off", "5% off", "Pelicula + Capinha"];
        renderizarRanking(rankingRaw.map((item, i) => ({ ...item, premio: premios[i] })));

        gerarNumerosDisponiveis(numerosOcupados);

    } catch (er) {
        console.error("Erro ao carregar dados:", er);
    }
}

function renderizarRanking(dados) {
    const container = document.getElementById('ranking-list');
    if (!container) return;
    if (dados.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center italic">Nenhuma compra confirmada.</p>';
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
        const estaSelecionado = numerosSelecionados.includes(i);

        if (!estaOcupado) {
            html += `<button id="num-${i}" onclick="toggleNumero(${i})" class="${estaSelecionado ? 'bg-emerald-500 border-white' : 'bg-gray-700 border-gray-600'} hover:border-emerald-400 text-white text-xs font-bold p-2 rounded-lg border transition-all">${i}</button>`;
        } else {
            html += `<div class="bg-red-900/30 text-gray-500 text-xs p-2 rounded-lg border border-red-900/50 cursor-not-allowed opacity-50 text-center">${i}</div>`;
        }
    }
    grid.innerHTML = html;
}

function toggleNumero(num) {
    const idx = numerosSelecionados.indexOf(num);
    const btn = document.getElementById(`num-${num}`);
    if (idx === -1) {
        numerosSelecionados.push(num);
        btn.classList.replace('bg-gray-700', 'bg-emerald-500');
    } else {
        numerosSelecionados.splice(idx, 1);
        btn.classList.replace('bg-emerald-500', 'bg-gray-700');
    }
    atualizarInterfaceSelecao();
}

function atualizarInterfaceSelecao() {
    const container = document.getElementById('selecao-container');
    const lista = document.getElementById('lista-selecionados');
    if (numerosSelecionados.length > 0) {
        container.classList.remove('hidden');
        lista.innerText = numerosSelecionados.sort((a, b) => a - b).join(', ');
    } else {
        container.classList.add('hidden');
    }
}

async function finalizarEscolha() {
    const nome = prompt(`🛒 RESERVA DE COTAS\nNúmeros: ${numerosSelecionados.join(', ')}\n\nDigite seu nome completo:`);
    if (!nome || nome.trim().length < 3) return alert("Nome inválido!");

    try {
        for (const num of numerosSelecionados) {
            await fetch(API_APPS_SCRIPT, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ nome: nome, numero: num }) });
        }
        const total = (numerosSelecionados.length * 5).toFixed(2);
        const msg = window.encodeURIComponent(`Olá! Tudo bem? Sou ${nome} e escolhi os números (${numerosSelecionados.join(', ')}) no site. Gostaria de receber os dados para o Pix de R$ ${total}. Fico no aguardo!`);
        window.location.href = `https://wa.me/${MEU_WHATSAPP}?text=${msg}`;
    } catch (err) { alert("Erro ao reservar."); }
}

function atualizarCronometro() {
    const alvo = new Date('2026-02-14T19:00:00').getTime();
    const agora = new Date().getTime();
    const diff = alvo - agora;
    const display = document.getElementById('countdown');
    if (!display) return;
    if (diff <= 0) { display.innerHTML = "🚀 O SORTEIO COMEÇOU!"; return; }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    display.innerText = `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const msg = window.encodeURIComponent("Olá! Tudo bem? Tenho uma dúvida sobre a rifa da Ponto A.");
    window.open(`https://wa.me/${MEU_WHATSAPP}?text=${msg}`, '_blank');
});

carregarDados();
setInterval(atualizarCronometro, 1000);
atualizarCronometro();