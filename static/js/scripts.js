// Seletores do DOM
const btnChoices = document.querySelectorAll('.btn-choice');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');
const scoreDisplay = document.getElementById('score-display'); // Exibir placar (opção futura)
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');
const attemptsDisplay = document.getElementById('remaining-attempts');

// Variáveis globais
let ultimoJogador = null; // Última jogada para passar ao backend
const HISTORY_LIMIT = 10; // Limite de jogadas no histórico
let placar = { jogador: 0, computador: 0, empates: 0 }; // Placar global com empates
let tentativasRestantes = 10; // Número de rodadas fixado em 10
let isWaiting = false; // Flag para controle da espera entre jogadas

// Sons (adicione arquivos no caminho correto)
const clickSound = new Audio('/static/sounds/click.mp3');
const winSound = new Audio('/static/sounds/win.mp3');
const loseSound = new Audio('/static/sounds/lose.mp3');
const drawSound = new Audio('/static/sounds/draw.mp3');

// Função para inicializar as variáveis e exibir valores corretos na tela.
function initializeGame() {
    // Reinicia os valores do placar e as tentativas restantes
    placar = { jogador: 0, computador: 0, empates: 0 };
    tentativasRestantes = 10;
    isWaiting = false; // Certifica-se de que o jogo não está em estado de espera

    // Atualiza a exibição inicial dos valores na tela
    if (scoreDisplay) {
        playerScoreDisplay.textContent = 0;
        computerScoreDisplay.textContent = 0;
        attemptsDisplay.textContent = tentativasRestantes;
    }
    historyList.innerHTML = ''; // Limpa o histórico

    // Limpa o resultado anterior se houver
    resultDisplay.innerHTML = "Faça sua jogada!";
}

// Chama a inicialização ao carregar o script
initializeGame();

/**
 * Atualiza o display do resultado com destaque visual e feedback sonoro.
 * @param {string} resultado - Resultado do jogo enviado pelo backend.
 * @param {string} jogadaComputador - Jogada que o computador realizou.
 */
function updateResultDisplay(resultado, jogadaComputador) {
    // Exibe o resultado no display principal com animação de destaque.
    resultDisplay.innerHTML = `
        O computador jogou: <span>${jogadaComputador}</span><br>
        <strong>${resultado}</strong>
    `;
    resultDisplay.classList.add('highlight');
    setTimeout(() => resultDisplay.classList.remove('highlight'), 500);

    // Feedback sonoro baseado no resultado.
    if (resultado.includes("JOGADOR GANHOU")) {
        winSound.play();
    } else if (resultado.includes("COMPUTADOR GANHOU")) {
        loseSound.play();
    } else if (resultado === "EMPATE!") {
        drawSound.play();
    }
}

/**
 * Adiciona uma jogada ao histórico com limite de jogadas.
 * @param {string} resultado - Resultado do jogo.
 * @param {string} jogadaJogador - Jogada que o jogador realizou.
 * @param {string} jogadaComputador - Jogada que o computador realizou.
 */
function addToHistory(resultado, jogadaJogador, jogadaComputador) {
    const li = document.createElement('li');

    li.innerHTML = `
        <span>Jogador: <strong>${jogadaJogador}</strong></span>
        <span>Computador: <strong>${jogadaComputador}</strong></span>
        <span>Resultado: <strong>${resultado}</strong></span>
    `;
    historyList.prepend(li);

    // Limita o histórico a HISTORY_LIMIT entradas.
    if (historyList.children.length > HISTORY_LIMIT) {
        historyList.removeChild(historyList.lastChild);
    }
}

/**
 * Atualiza o placar do jogo com base no resultado.
 * @param {string} resultado - Resultado do jogo (ex. "JOGADOR GANHOU").
 */
function updateScore(resultado) {
    if (resultado.includes("JOGADOR GANHOU")) {
        placar.jogador += 1;
    } else if (resultado.includes("COMPUTADOR GANHOU")) {
        placar.computador += 1;
    } else if (resultado === "EMPATE!") {
        placar.empates += 1;
    }

    tentativasRestantes -= 1;

    // Exibe o placar atualizado
    if (scoreDisplay) {
        playerScoreDisplay.textContent = placar.jogador;
        computerScoreDisplay.textContent = placar.computador;
        attemptsDisplay.textContent = tentativasRestantes >= 0 ? tentativasRestantes : 0;
    }
}

/**
 * Envia a jogada do jogador para o backend e manipula a resposta.
 * @param {number} jogadorChoice - Escolha do jogador (0: Pedra, 1: Papel, 2: Tesoura).
 */
async function sendChoiceToServer(jogadorChoice) {
    try {
        // Evita que o jogador envie várias jogadas em rápida sucessão
        if (isWaiting) return;

        isWaiting = true; // Define o estado de espera

        // Feedback sonoro de clique.
        clickSound.play();

        // Dados que serão enviados ao backend.
        const requestBody = {
            jogador: jogadorChoice,
            ultimo_jogador: ultimoJogador
        };

        // Envia a jogada ao backend.
        const response = await fetch('/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        // Processa a resposta do servidor.
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro inesperado');
        }

        const { jogada_computador, resultado } = await response.json();

        // Atualiza o último jogador para a jogada atual.
        ultimoJogador = jogadorChoice;

        // Atualiza resultado, histórico e placar no frontend.
        updateResultDisplay(resultado, jogada_computador);
        addToHistory(resultado, ITENS[jogadorChoice], jogada_computador);
        updateScore(resultado);

        // Espera 2 segundos antes de permitir a próxima jogada
        setTimeout(() => {
            isWaiting = false; // Permite a próxima jogada
            checkForGameEnd(); // Verifica se o jogo terminou
        }, 2000);

    } catch (error) {
        // Exibe erro no display principal.
        resultDisplay.innerHTML = `<span style="color: red;">Erro: ${error.message}</span>`;
        isWaiting = false; // Libera para tentar novamente em caso de erro
    }
}

/**
 * Verifica se o jogo terminou após 10 rodadas e apresenta o vencedor.
 */
function checkForGameEnd() {
    if (tentativasRestantes === 0) {
        let message;

        if (placar.jogador > placar.computador) {
            message = `Parabéns, você venceu o jogo com mais vitórias!\n\nNúmero de empates: ${placar.empates}`;
        } else if (placar.computador > placar.jogador) {
            message = `O computador venceu o jogo com mais vitórias!\n\nNúmero de empates: ${placar.empates}`;
        } else {
            // Caso de empate
            message = `O jogo terminou empatado!\n\nNúmero de empates: ${placar.empates}`;
        }

        alert(message);

        // Reinicia o jogo
        initializeGame();
    }
}

// Mapeia os valores numéricos das jogadas com os textos correspondentes.
const ITENS = ['Pedra', 'Papel', 'Tesoura'];

/**
 * Adiciona eventos de clique nos botões (Jogadas).
 */
btnChoices.forEach((button) => {
    button.addEventListener('click', () => {
        // Remove estado "clicado" dos outros botões.
        btnChoices.forEach(btn => btn.classList.remove('clicked'));

        // Adiciona efeito visual ao botão clicado.
        button.classList.add('clicked');

        // Envia a jogada ao backend.
        const choice = parseInt(button.dataset.choice, 10);
        sendChoiceToServer(choice);
    });
});