// Seletores do DOM
const btnChoices = document.querySelectorAll('.btn-choice');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');
const scoreDisplay = document.getElementById('score-display');
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');
const attemptsDisplay = document.getElementById('remaining-attempts');
const finalMessageElement = document.getElementById('final-message');

// Música de fundo
const backgroundMusic = document.getElementById('background-music');
const toggleMusicBtn = document.getElementById('toggle-music');
let isMusicPlaying = false;

// Adicione o container da animação
const animationContainer = document.createElement('div');
animationContainer.id = 'jokenpo-animation';
document.body.appendChild(animationContainer);

// Variáveis globais
let ultimoJogador = null; // Última jogada para passar ao backend
const HISTORY_LIMIT = 10; // Máximo de jogadas no histórico
let placar = { jogador: 0, computador: 0, empates: 0 }; // Placar
let tentativasRestantes = 10; // Número fixo de rodadas
let isWaiting = false; // Controle para evitar múltiplos cliques enquanto processa

// Definir tempos entre a interface do jogo
const JOGADA_DELAY = 3000; // 3 segundos para permitir interação entre jogadas
const FIM_JOGO_DELAY = 500; // 0,5 segundo para exibir a mensagem de fim do jogo rapidamente

// Sons (adicione arquivos no caminho correto)
const clickSound = new Audio('/static/sounds/click.mp3');
const winSound = new Audio('/static/sounds/win.mp3');
const loseSound = new Audio('/static/sounds/lose.mp3');
const drawSound = new Audio('/static/sounds/draw.mp3');
const finalWinSound = new Audio('/static/sounds/final_win.mp3');
const finalLoseSound = new Audio('/static/sounds/final_lose.mp3');
const finalDrawSound = new Audio('/static/sounds/final_draw.mp3');

// Estatísticas de armazenamento local (somente fim de jogo)
let storageStats = {
    vitorias: parseInt(localStorage.getItem('vitorias')) || 0,
    derrotas: parseInt(localStorage.getItem('derrotas')) || 0,
    empates: parseInt(localStorage.getItem('empates')) || 0
};

/**
 * Inicializa a música de fundo e configura o estado inicial
 */
function initBackgroundMusic() {
    // Verifica se o usuário já definiu uma preferência de música
    const musicState = localStorage.getItem('musicEnabled');

    // Configura o volume da música
    backgroundMusic.volume = 0.4; // 40% do volume

    // Configura o botão e estado baseado na preferência salva
    if (musicState === 'false') {
        toggleMusicBtn.querySelector('.music-icon').textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        isMusicPlaying = false;
    } else {
        // Tenta iniciar a música - navegadores modernos exigem interação do usuário
        toggleMusicBtn.querySelector('.music-icon').textContent = '🔊';
        isMusicPlaying = true;

        // Adiciona o evento para tocar música no primeiro clique
        document.addEventListener('click', function startMusicOnFirstInteraction() {
            backgroundMusic.play().catch(err => console.log('Esperando interação para tocar música'));
            document.removeEventListener('click', startMusicOnFirstInteraction);
        }, { once: true });
    }

    // Adiciona evento para o botão de ligar/desligar música
    toggleMusicBtn.addEventListener('click', toggleBackgroundMusic);
}

/**
 * Alterna o estado da música (ligado/desligado)
 */
function toggleBackgroundMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        toggleMusicBtn.querySelector('.music-icon').textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        isMusicPlaying = false;
        localStorage.setItem('musicEnabled', 'false');
    } else {
        backgroundMusic.play().catch(err => console.log('Falha ao tocar música:', err));
        toggleMusicBtn.querySelector('.music-icon').textContent = '🔊';
        toggleMusicBtn.classList.remove('muted');
        isMusicPlaying = true;
        localStorage.setItem('musicEnabled', 'true');
    }
}

/**
 * Ajusta o volume da música durante efeitos sonoros
 * @param {HTMLAudioElement} sound - Som a ser tocado
 */
function playGameSound(sound) {
    // Salva o volume atual da música
    const currentMusicVolume = backgroundMusic.volume;

    // Reduz o volume da música temporariamente
    if (isMusicPlaying) {
        backgroundMusic.volume = 0.1; // 10% do volume
    }

    // Toca o som
    sound.play();

    // Restaura o volume da música após um curto período
    setTimeout(() => {
        if (isMusicPlaying) {
            backgroundMusic.volume = currentMusicVolume;
        }
    }, 1500);
}

/**
 * Atualiza o localStorage com estatísticas de fim de jogo.
 * @param {string} statusFinal - "vitoria", "derrota" ou "empate".
 */
function updateLocalStorage(statusFinal) {
    if (statusFinal === "vitoria") {
        storageStats.vitorias += 1;
        localStorage.setItem('vitorias', storageStats.vitorias);
    } else if (statusFinal === "derrota") {
        storageStats.derrotas += 1;
        localStorage.setItem('derrotas', storageStats.derrotas);
    } else if (statusFinal === "empate") {
        storageStats.empates += 1;
        localStorage.setItem('empates', storageStats.empates);
    }
}

/**
 * Exibe as estatísticas gerais salvas no localStorage.
 */
function displayTotalStats() {
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) {
        statsDisplay.innerHTML = `
            <p><strong>Estatísticas Gerais:</strong></p>
            <p>Vitórias do Jogador: ${storageStats.vitorias}</p>
            <p>Derrotas para o Computador: ${storageStats.derrotas}</p>
            <p>Empates: ${storageStats.empates}</p>
        `;
    }
}

// Adiciona as estatísticas na interface ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    displayTotalStats();
    initBackgroundMusic(); // Inicializa a música

    // Garante que a mensagem final esteja oculta no início
    if (finalMessageElement) {
        finalMessageElement.style.display = 'none';
    }
});

// Função inicializadora do jogo
function initializeGame() {
    // Reseta placares e variáveis
    placar = { jogador: 0, computador: 0, empates: 0 };
    tentativasRestantes = 10;
    isWaiting = false;

    // Atualização inicial da UI
    playerScoreDisplay.textContent = 0;
    computerScoreDisplay.textContent = 0;
    attemptsDisplay.textContent = tentativasRestantes;
    historyList.innerHTML = '';
    resultDisplay.innerHTML = "Faça sua jogada!";
    resultDisplay.className = ''; // Remove possíveis classes adicionais

    // Oculta a mensagem final se estiver visível
    if (finalMessageElement) {
        finalMessageElement.style.display = 'none';
    }

    // Reativa os botões de escolha
    btnChoices.forEach(button => {
        button.disabled = false;
    });

    // Atualiza as estatísticas gerais salvas no localStorage
    displayTotalStats();
}

// Carrega o jogo ao iniciar
initializeGame();

/**
 * Atualiza o resultado da rodada no display.
 * @param {string} resultado - Resultado da rodada.
 * @param {string} jogadaComputador - Jogada realizada pelo computador.
 */
function updateResultDisplay(resultado, jogadaComputador) {
    const messagesByResult = {
        "O JOGADOR GANHOU!": "Você foi incrível! Vitória brilhante! 🌟",
        "O COMPUTADOR GANHOU!": "Oh não! Você perdeu essa batalha contra o computador. 🤖",
        "EMPATE!": "Foi um empate! Equilíbrio total! 😯"
    };

    resultDisplay.innerHTML = `
        <div class="animated-message">
            <p>O computador escolheu: <strong>${jogadaComputador}</strong></p>
            <p>${messagesByResult[resultado] || resultado}</p>
        </div>
    `;

    if (resultado.includes("O JOGADOR GANHOU")) {
        playGameSound(winSound);
    } else if (resultado.includes("O COMPUTADOR GANHOU")) {
        playGameSound(loseSound);
    } else if (resultado === "EMPATE!") {
        playGameSound(drawSound);
    }
}

/**
 * Registra jogadas no histórico com limite de exibição.
 * @param {string} resultado - Resultado da jogada.
 * @param {string} jogadaJogador - Jogada do jogador.
 * @param {string} jogadaComputador - Jogada do computador.
 */
function addToHistory(resultado, jogadaJogador, jogadaComputador) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>Jogador: <strong>${jogadaJogador}</strong></span>
        <span>Computador: <strong>${jogadaComputador}</strong></span>
        <span>Resultado: <strong>${resultado}</strong></span>
    `;
    historyList.prepend(li);

    // Remove jogadas antigas do histórico se exceder o limite
    if (historyList.children.length > HISTORY_LIMIT) {
        historyList.removeChild(historyList.lastChild);
    }
}

/**
 * Atualiza o placar geral.
 */
function updateScore(resultado) {
    if (resultado.includes("O JOGADOR GANHOU")) {
        placar.jogador += 1;
    } else if (resultado.includes("O COMPUTADOR GANHOU")) {
        placar.computador += 1;
    } else if (resultado === "EMPATE!") {
        placar.empates += 1;
    }

    tentativasRestantes -= 1;
    playerScoreDisplay.textContent = placar.jogador;
    computerScoreDisplay.textContent = placar.computador;
    attemptsDisplay.textContent = Math.max(tentativasRestantes, 0);
}

/**
 * Escolhe uma mensagem aleatória de um array e a remove para evitar repetição.
 * @param {string[]} messages - Array de mensagens.
 */
function getRandomMessage(messages) {
    const index = Math.floor(Math.random() * messages.length);
    return messages.splice(index, 1)[0]; // Remove a mensagem escolhida
}

/**
 * Verifica o fim de jogo (após todas as rodadas) e exibe mensagem final.
 */
function checkForGameEnd() {
    if (tentativasRestantes === 0) {
        let statusFinal;

        const winMessages = [
            "Você DOMINOU completamente o jogo! 🏆",
            "Parabéns, você é o campeão absoluto! 🎉",
            "Vitória épica! Você foi incrível! 🥇",
            "Você triunfou como um verdadeiro mestre! 💪",
            "Belo trabalho! Mostrou quem manda! 👑"
        ];

        const loseMessages = [
            "Você foi completamente destruído! 🤖",
            "O computador foi implacável! 📟",
            "Oh não! Parece que não foi seu dia... ⚠️",
            "Talvez seja hora de treinar mais! 🧐",
            "Derrota amarga, mas você pode tentar novamente! 💔"
        ];

        const drawMessages = [
            "Empate? Jogo equilibrado demais! 🤷",
            "Ninguém venceu, mas foi emocionante! 👏",
            "Foi cabeça a cabeça! Empate perfeito! 🔄",
            "Parece que vocês dois estão no mesmo nível! 🤝",
            "Que jogo igualado! Nenhum perdeu, mas ninguém ganhou! ⚖️"
        ];

        // Configura a mensagem com base no resultado
        if (finalMessageElement) {
            let finalText = "";
            let buttonText = "Jogar Novamente";

            if (placar.jogador > placar.computador) {
                finalText = `🎉 ${getRandomMessage(winMessages)} 🎊`;
                playGameSound(finalWinSound);
                statusFinal = "vitoria";
            } else if (placar.computador > placar.jogador) {
                finalText = `😞 ${getRandomMessage(loseMessages)}`;
                buttonText = "Tente Novamente";
                playGameSound(finalLoseSound);
                statusFinal = "derrota";
            } else {
                finalText = `🤝 ${getRandomMessage(drawMessages)}`;
                playGameSound(finalDrawSound);
                statusFinal = "empate";
            }

            // Atualiza o conteúdo da mensagem final
            document.getElementById('final-result-text').textContent = finalText;

            // Exibe a mensagem final
            finalMessageElement.style.display = 'flex';

            // Configura o botão de jogar novamente
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.textContent = buttonText;

                // Remove eventos antigos para evitar duplicação
                playAgainButton.replaceWith(playAgainButton.cloneNode(true));

                // Adiciona o evento de clique para o novo botão
                document.getElementById('play-again').addEventListener('click', () => {
                    initializeGame();
                });
            }
        }

        updateLocalStorage(statusFinal);

        btnChoices.forEach(button => {
            button.disabled = true; // Desativa os botões após o fim do jogo
        });
    }
}

/**
 * Cria e mostra a animação de embaralhamento de JoKenPo
 * @param {number} jogadorChoice - Escolha do jogador (0: Pedra, 1: Papel, 2: Tesoura)
 * @param {string} jogadaComputador - Escolha final do computador (já determinada pelo servidor)
 * @param {function} callback - Função a ser chamada ao término da animação
 */
function showJokenpoAnimation(jogadorChoice, jogadaComputador, callback) {
    // Símbolos do jogo
    const symbols = ["👊", "✋", "✌️"];
    const jogadorSymbol = symbols[jogadorChoice];

    // Mapeamento de jogada do computador para índice do array symbols
    const computerChoiceMapping = {
        "pedra": 0,
        "papel": 1,
        "tesoura": 2
    };

    // Índice para a jogada do computador
    const computerIndex = computerChoiceMapping[jogadaComputador.toLowerCase()];

    // Configurar a estrutura da animação
    animationContainer.innerHTML = `
        <div class="symbol-container">
            <div class="player-choice">
                <div class="choice-label">Você escolheu</div>
                <div class="jokenpo-symbol player-symbol">${jogadorSymbol}</div>
            </div>

            <div class="vs-text">VS</div>

            <div class="computer-choice">
                <div class="choice-label">Computador</div>
                <div class="jokenpo-symbol computer-symbol">?</div>
            </div>
        </div>
        <div class="countdown">3</div>
    `;

    // Mostrar a animação
    animationContainer.classList.add('active');

    const computerSymbol = animationContainer.querySelector('.computer-symbol');
    const countdown = animationContainer.querySelector('.countdown');
    const playerSymbol = animationContainer.querySelector('.player-symbol');

    // Destacar a escolha do jogador
    playerSymbol.classList.add('highlight');

    // Contador de tempo
    let secondsLeft = 3;
    let symbolIndex = 0;

    // Intervalo para trocar o símbolo do computador rapidamente (embaralhamento)
    const shuffleInterval = setInterval(() => {
        symbolIndex = (symbolIndex + 1) % 3;
        computerSymbol.textContent = symbols[symbolIndex];
    }, 150); // Troca símbolos a cada 150ms

    // Intervalo para o contador regressivo
    const countdownInterval = setInterval(() => {
        secondsLeft -= 1;
        countdown.textContent = secondsLeft;

        // Quando chegar a zero, mostrar o resultado real
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            clearInterval(shuffleInterval);

            // Mostrar a escolha real do computador
            computerSymbol.textContent = symbols[computerIndex];
            computerSymbol.classList.add('highlight');

            // Esperar mais um pouco para que o usuário veja o resultado
            setTimeout(() => {
                animationContainer.classList.remove('active');
                if (callback) callback();
            }, 800);
        }
    }, 1000);
}

/**
 * Envia a jogada do jogador ao servidor e processa a resposta.
 */
async function sendChoiceToServer(jogadorChoice) {
    if (isWaiting || tentativasRestantes === 0) return;

    try {
        isWaiting = true;
        playGameSound(clickSound);

        const response = await fetch('/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jogador: jogadorChoice, ultimo_jogador: ultimoJogador })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erro inesperado!");
        }

        const data = await response.json();
        const { jogada_computador, resultado } = data;
        ultimoJogador = jogadorChoice;

        // Agora passamos a jogada_computador diretamente para a animação
        showJokenpoAnimation(jogadorChoice, jogada_computador, () => {
            updateResultDisplay(resultado, jogada_computador);
            addToHistory(resultado, ITENS[jogadorChoice], jogada_computador);
            updateScore(resultado);

            setTimeout(() => {
                isWaiting = false;
                checkForGameEnd();
            }, 500);
        });

    } catch (error) {
        resultDisplay.innerHTML = `<span class="error">Erro: ${error.message}</span>`;
        isWaiting = false;
    }
}

// Mapeia as jogadas com os textos correspondentes
const ITENS = ['Pedra', 'Papel', 'Tesoura'];

// Adiciona os eventos de clique aos botões de escolha
btnChoices.forEach(button =>
    button.addEventListener('click', () => {
        if (!isWaiting) {
            btnChoices.forEach(btn => btn.classList.remove('clicked'));
            button.classList.add('clicked');
            sendChoiceToServer(parseInt(button.dataset.choice, 10));
        }
    })
);

// Configuração do botão "Jogar Novamente"
document.getElementById('play-again').addEventListener('click', () => {
    initializeGame();
});