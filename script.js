const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDD-3bcwgeWTRlTQyHaWAI-N5nGdd9kxe34pBpLOS0M3v5-1GfEs7ANaCF1vFVvFzhG3FfhqoOjOwq/pub?output=csv';
const API_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbx9z6JBOgLXAWMYe7eMsRFboewiquCc0JhvgkN3_IabOGLRSojEZ39KIyBp-VH1x6yP/exec';
const MEU_WHATSAPP = '5583999646934'; // Substitua pelo seu número real

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
        console.error("Erro:", er);
    }
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
                        class="bg-gray-700 hover:bg-emerald-600 text-white text-sm font-bold p-3 rounded-lg border border-gray-600 active:scale-95 transition-all">
                    ${i}
                </button>`;
        } else {
            html += `
                <div class="bg-red-900/30 text-gray-500 text-sm p-3 rounded-lg border border-red-900/50 cursor-not-allowed opacity-50">
                    ${i}
                </div>`;
        }
    }
    grid.innerHTML = html;
}

async function reservarCota(numero) {
    const nome = prompt(`🛒 RESERVA DO NÚMERO ${numero}\n\nPara garantir a sua cota, digite o seu nome completo:`);

    if (!nome || nome.trim().length < 3) {
        alert("Por favor, digite o seu nome completo para continuar.");
        return;
    }

    // Feedback visual de carregamento
    const btnWhatsApp = document.querySelector('a[href^="https://wa.me"]');
    btnWhatsApp.innerText = "Processando reserva...";

    try {
        const response = await fetch(API_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', // Importante para o Google Apps Script
            cache: 'no-cache',
            body: JSON.stringify({ nome: nome, numero: numero })
        });

        // Como usamos no-cors, não conseguimos ler o JSON de resposta, 
        // mas o Google grava os dados quase instantaneamente.

        alert("✅ Reserva solicitada com sucesso!\n\nAgora vamos para o WhatsApp para validar o pagamento via Pix.");

        const mensagem = window.encodeURIComponent(`Olá! Sou ${nome} e acabei de reservar o número ${numero} no site. Como faço o pagamento?`);
        window.location.href = `https://wa.me/${MEU_WHATSAPP}?text=${mensagem}`;

    } catch (err) {
        alert("Erro na conexão. Verifique a internet e tente novamente.");
        console.error(err);
    } finally {
        btnWhatsApp.innerText = "Comprar via WhatsApp";
    }
}

// Inicializa
carregarDados();
// O cronómetro mantém-se como no código anterior