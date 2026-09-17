/* ==========================================================================
   CONFIGURAÇÃO DOS EXERCÍCIOS
   ========================================================================== */
const exercicios = [
    { pergunta: "Quanto é 3 + 4?", resposta: 7, tipo: "soma", dica: "3 mais 4 é igual a 7", audio: "q1.mp3" },
    { pergunta: "Quanto é 2 + 2?", resposta: 4, tipo: "soma", dica: "2 mais 2 é igual a 4", audio: "q2.mp3" },
    {
        pergunta: "Quanto é 6 - 3?",
        resposta: 3,
        tipo: "subtracao",
        inicial: 6,
        remover: 3,
        dica: "Selecione 6 blocos e depois retire 3",
        audio: "q3.mp3"
    },
    { pergunta: "Quanto é 1 + 4?",
     resposta: 5, 
     tipo: "soma", 
     
     dica: "O resultado é 5", 
     
     audio: "q4.mp3" },
    { 
        pergunta: "Quanto é 8 - 2?", 
        resposta: 6, 
        tipo: "subtracao", 
        inicial: 8, 
        remover: 2, 
        dica: "8 menos 2 sobra 6", 
        audio: "q5.mp3" 
    }
];

// Variáveis de Estado do Jogo
let indiceAtual = 0;
let somAtivo = true;
let focoIndex = 0; // Índice do bloco em foco (navegação por setas do teclado)
const COLUNAS = 4;
const LINHAS = 3;

// Elementos do DOM (Interface)
const grid = document.getElementById("grid-simples");
const instrucao = document.getElementById("instrucao");
const feedback = document.getElementById("msg-feedback");
const feedbackCard = document.getElementById("feedback-card");
const faseTexto = document.getElementById("fase-texto");
const progressoTexto = document.getElementById("progresso-texto");
const modalParabens = document.getElementById("modal-parabens");
const modalFase = document.getElementById("modal-fase");
const modalFaseTitulo = document.getElementById("modal-fase-titulo");
const modalOverlay = document.getElementById("modal-overlay");

/* ==========================================================================
   SISTEMA DE SOM
   ========================================================================== */
const sons = {
    tom: new Audio("./audios/tom.mp3"),
    erro: new Audio("./audios/erro.mp3"),
    parabens: new Audio("./audios/parabens.mp3"),
    tenteNovamente: new Audio("./audios/tente_novamente.mp3"),
    estouro: new Audio("./audios/estouro.mp3"),
    vitoriaFinal: new Audio("./audios/vitoria_final.mp3"),
    cima: new Audio("./audios/cima.mp3"),
    baixo: new Audio("./audios/baixo.mp3"),
    esquerda: new Audio("./audios/esquerda.mp3"),
    direita: new Audio("./audios/direita.mp3")
};

// Instâncias para os áudios dinâmicos (contagem e enunciados)
const audioPergunta = new Audio();
const audioContagem = new Audio();

function tocarSom(nome) {
    if (!somAtivo) return;
    const som = sons[nome];
    if (!som) return;
    som.currentTime = 0;
    som.play().catch(() => { });
}

function tocarAudioDinamico(instancia, caminho) {
    if (!somAtivo) return;
    instancia.pause();
    instancia.currentTime = 0;
    instancia.src = caminho;

    return instancia.play().catch(err => {
        console.warn("Navegador bloqueou a execução automática direta:", err);
    });
}

function tocarPerguntaAtual() {
    const item = exercicios[indiceAtual];
    if (item && item.audio) {
        tocarAudioDinamico(audioPergunta, `./audios/${item.audio}`);
    }
}

function pararTodosOsSons() {
    Object.values(sons).forEach(som => {
        som.pause();
        som.currentTime = 0;
    });
    audioPergunta.pause();
    audioPergunta.currentTime = 0;
    audioContagem.pause();
    audioContagem.currentTime = 0;
}

/* ==========================================================================
   PERSISTÊNCIA E ESTATÍSTICAS (LocalStorage)
   ========================================================================== */
function registrarEvento(tipo, fase, status, detalhe) {
    const dados = JSON.parse(localStorage.getItem('autismath_stats') || '[]');
    dados.push({
        tipo: tipo,
        fase: fase,
        status: status,
        detalhe: detalhe,
        data: new Date().toLocaleString()
    });
    localStorage.setItem('autismath_stats', JSON.stringify(dados));
}

/* ==========================================================================
   ATUALIZAÇÕES DA INTERFACE (UI)
   ========================================================================== */
function definirFeedback(texto, tipo) {
    feedback.innerText = texto;
    feedbackCard.classList.remove("sucesso", "erro", "dica");
    if (tipo && tipo !== "neutro") {
        feedbackCard.classList.add(tipo);
    }
}

function atualizarRodape() {
    faseTexto.innerText = `Fase ${indiceAtual + 1}`;
    progressoTexto.innerText = `${indiceAtual} de ${exercicios.length}`;
}

function atualizarFoco() {
    const blocos = document.querySelectorAll(".bloco");
    blocos.forEach(b => b.classList.remove("foco"));
    if (blocos[focoIndex]) {
        blocos[focoIndex].classList.add("foco");
    }
}

/* ==========================================================================
   LÓGICA DO JOGO E INTERAÇÃO COM OS BLOCOS
   ========================================================================== */
function iniciarExercicio() {
    grid.innerHTML = "";
    const item = exercicios[indiceAtual];
    instrucao.innerText = item.pergunta;
    definirFeedback("Selecione os blocos e clique em Verificar!", "neutro");
    atualizarRodape();
    focoIndex = 0;

    // Toca a pergunta ao iniciar a fase
    tocarPerguntaAtual();

    for (let i = 0; i < 12; i++) {
        const div = document.createElement("div");
        div.classList.add("bloco");

        div.onclick = () => {
            focoIndex = i;
            atualizarFoco();
            alternarBloco(div, item);
        };
        grid.appendChild(div);
    }
    atualizarFoco();
}

function alternarBloco(div, item) {
    pararTodosOsSons();

    let foiSelecionado = false;

    if (item.tipo === "subtracao") {
        if (!div.classList.contains("selecionado")) {
            div.classList.add("selecionado");
            div.innerText = "🤖";
            foiSelecionado = true;
        } else {
            div.classList.remove("selecionado");
            div.innerText = "";
            foiSelecionado = false;
        }
    } else {
        div.classList.toggle("selecionado");
        foiSelecionado = div.classList.contains("selecionado");
        div.innerText = foiSelecionado ? "🤖" : "";
    }

    // Só toca o som de contagem se um bloco tiver sido ADICIONADO
    if (foiSelecionado) {
        const totalSelecionados = document.querySelectorAll(".selecionado").length;
        if (totalSelecionados > 0 && totalSelecionados <= 12) {
            tocarAudioDinamico(audioContagem, `./audios/${totalSelecionados}.mp3`);
        } else {
            tocarSom("tom");
        }
    }
    // Ao apagar/desmarcar, não executa nenhum som (silêncio total)

    definirFeedback("Selecione os blocos e clique em Verificar!", "neutro");
}

function validar() {
    const item = exercicios[indiceAtual];

    if (item.tipo === "subtracao") {
        const selecionadosIniciais = document.querySelectorAll(".selecionado").length;
        const restantesCorretos = selecionadosIniciais === item.resposta;

        if (restantesCorretos) {
            processarAcerto(item.resposta);
            registrarEvento('Matemática', indiceAtual + 1, 'Acerto', `Subtração correta (${item.inicial} - ${item.remover})`);
        } else {
            pararTodosOsSons();
            tocarSom("tenteNovamente");
            definirFeedback(`Lembre-se: coloque ${item.inicial} blocos e depois retire ${item.remover}.`, "erro");
            registrarEvento('Matemática', indiceAtual + 1, 'Erro', `Erro na subtração`);
        }
    } else {
        const selecionados = document.querySelectorAll(".selecionado").length;
        const correta = item.resposta;

        if (selecionados === correta) {
            processarAcerto(correta);
            registrarEvento('Matemática', indiceAtual + 1, 'Acerto', `Respondeu ${correta} corretamente`);
        } else {
            pararTodosOsSons();
            tocarSom("tenteNovamente");
            definirFeedback("Tente contar novamente.", "erro");
            registrarEvento('Matemática', indiceAtual + 1, 'Erro', `Selecionou ${selecionados} em vez de ${correta}`);
        }
    }
}

function processarAcerto(correta) {
    pararTodosOsSons();
    tocarSom("parabens");
    tocarSom("estouro");
    definirFeedback("🌟 Parabéns! Você acertou!", "sucesso");

    if (window.confetti) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    setTimeout(() => {
        const faseConcluida = indiceAtual + 1;
        indiceAtual++;
        atualizarRodape();
        if (indiceAtual < exercicios.length) {
            mostrarModalFase(faseConcluida);
        } else {
            telaFinal();
        }
    }, 1200);
}

function limpar() {
    // Apaga os blocos em total silêncio
    pararTodosOsSons();

    document.querySelectorAll(".bloco").forEach(b => {
        b.classList.remove("selecionado");
        b.innerText = "";
    });
    definirFeedback("Selecione os blocos e clique em Verificar!", "neutro");
}

function ajuda() {
    definirFeedback(`💡 ${exercicios[indiceAtual].dica}`, "dica");
}

/* ==========================================================================
   MODAIS E NAVEGAÇÃO DE TELAS
   ========================================================================== */
function mostrarModalFase(numeroFaseConcluida) {
    modalFaseTitulo.innerText = `Fase ${numeroFaseConcluida} concluída!`;
    modalOverlay.style.display = "block";
    modalFase.style.display = "block";
}

function continuarFase() {
    pararTodosOsSons();
    modalFase.style.display = "none";
    modalOverlay.style.display = "none";
    iniciarExercicio();
}

function telaFinal() {
    pararTodosOsSons();
    tocarSom("vitoriaFinal");
    modalOverlay.style.display = "block";
    modalParabens.style.display = "block";
    if (window.confetti) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    }
}

function irParaLogica() {
    window.location.href = 'index2.html';
}

function verResultados() {
    window.location.href = 'resul.html';
}

function alternarSom() {
    somAtivo = !somAtivo;
    const icone = document.getElementById("icone-som");
    if (icone) icone.innerText = somAtivo ? "volume_up" : "volume_off";
    if (!somAtivo) {
        pararTodosOsSons();
    } else {
        tocarPerguntaAtual();
    }
}

/* ==========================================================================
   NAVEGAÇÃO POR TECLADO (Acessibilidade via Setas e Enter/Espaço)
   ========================================================================== */
document.addEventListener("keydown", (e) => {
    const blocos = document.querySelectorAll(".bloco");
    if (!blocos.length) return;

    const linhaAtual = Math.floor(focoIndex / COLUNAS);
    const colunaAtual = focoIndex % COLUNAS;

    switch (e.key) {
        case "ArrowUp":
            if (linhaAtual > 0) focoIndex -= COLUNAS;
            pararTodosOsSons();
            tocarSom("cima");
            e.preventDefault();
            break;
        case "ArrowDown":
            if (linhaAtual < LINHAS - 1) focoIndex += COLUNAS;
            pararTodosOsSons();
            tocarSom("baixo");
            e.preventDefault();
            break;
        case "ArrowLeft":
            if (colunaAtual > 0) focoIndex -= 1;
            pararTodosOsSons();
            tocarSom("esquerda");
            e.preventDefault();
            break;
        case "ArrowRight":
            if (colunaAtual < COLUNAS - 1) focoIndex += 1;
            pararTodosOsSons();
            tocarSom("direita");
            e.preventDefault();
            break;
        case "Enter":
        case " ":
            blocos[focoIndex]?.click();
            e.preventDefault();
            break;
        default:
            return;
    }
    atualizarFoco();
});

/* ==========================================================================
   INICIALIZAÇÃO DA APLICAÇÃO NO CARREGAMENTO DA PÁGINA
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
    iniciarExercicio();
});

// Força a leitura do áudio da questão imediatamente ao carregar
window.addEventListener("load", () => {
    tocarPerguntaAtual();
});