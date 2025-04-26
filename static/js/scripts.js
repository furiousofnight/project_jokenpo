// ================== Seletores do DOM ==================
const btnChoices = document.querySelectorAll('.btn-choice');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');
const scoreDisplay = document.getElementById('score-display');
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');
const attemptsDisplay = document.getElementById('remaining-attempts');
const finalMessageElement = document.getElementById('final-message');
const quickResultElement = document.getElementById('quick-result');
const statsDisplayElement = document.getElementById('stats-display');
const playAgainButton = document.getElementById('play-again');
const finalResultTextElement = document.getElementById('final-result-text');
const totalEmpatesElement = document.getElementById('total-empates');
const loadingOverlay = document.getElementById('loading-overlay');
const offlineMessageElement = document.getElementById('offline-message');
const feedbackMessage = document.getElementById('feedback-message');
// ================== Música de Fundo ==================
const backgroundMusic = document.getElementById('background-music');
const toggleMusicBtn = document.getElementById('toggle-music');
let isMusicPlaying = false;
// ================== Container da Animação ==================
let animationContainer = document.getElementById('jokenpo-animation');
if (!animationContainer) {
    animationContainer = document.createElement('div');
    animationContainer.id = 'jokenpo-animation';
    document.body.appendChild(animationContainer);
}
// ================== Constantes ==================
const HISTORY_LIMIT = 10;
const TENTATIVAS_INICIAIS = 10;
const VOLUME_MUSICA_NORMAL = 0.4;
const VOLUME_MUSICA_REDUZIDO = 0.1;
const DELAY_RESTAURAR_VOLUME = 1500;
const DELAY_ANIMACAO_RESULTADO = 800;
const DELAY_CHECK_FIM_JOGO = 500;
const DELAY_MENSAGEM_RAPIDA = 3000;
const OFFLINE_MESSAGE = "Você está offline. Algumas funcionalidades podem não estar disponíveis.";
// Constantes para resultados
const RESULTADO_JOGADOR_GANHOU = "O JOGADOR GANHOU!";
const RESULTADO_COMPUTADOR_GANHOU = "O COMPUTADOR GANHOU!";
const RESULTADO_EMPATE = "EMPATE!";
// Mapeamentos
const ITENS_JOGO = ['Pedra', 'Papel', 'Tesoura'];
const JOGADA_PARA_INDICE = {
    "pedra": 0,
    "papel": 1,
    "tesoura": 2
};
const SIMBOLOS_JOGO = ["👊", "✋", "✌️"];
// Estados do Jogo
const GameState = {
    PLAYING: 'playing',
    WAITING: 'waiting',
    FINISHED: 'finished'
};
// ================== Variáveis de Estado ==================
let ultimoJogador = null;
let placar = { jogador: 0, computador: 0, empates: 0 };
let tentativasRestantes = TENTATIVAS_INICIAIS;
let isWaiting = false;
let currentGameState = GameState.PLAYING;
// Estatísticas localStorage
let storageStats = {
    vitorias: parseInt(localStorage.getItem('vitorias')) || 0,
    derrotas: parseInt(localStorage.getItem('derrotas')) || 0,
    empates: parseInt(localStorage.getItem('empates')) || 0
};
// ================== Sons ==================
const sounds = {
    click: new Audio('/static/sounds/click.mp3'),
    win: new Audio('/static/sounds/win.mp3'),
    lose: new Audio('/static/sounds/lose.mp3'),
    draw: new Audio('/static/sounds/draw.mp3'),
    finalWin: new Audio('/static/sounds/final_win.mp3'),
    finalLose: new Audio('/static/sounds/final_lose.mp3'),
    finalDraw: new Audio('/static/sounds/final_draw.mp3')
};
// ================== Funções de Utilidade ==================
function showLoadingOverlay(show) {
    loadingOverlay.hidden = !show;
}
function showFeedback(message, type = 'error') {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message ${type}`;
    feedbackMessage.hidden = false;
    setTimeout(() => {
        feedbackMessage.hidden = true;
    }, 3000);
}
function updateGameState(newState) {
    currentGameState = newState;
    document.body.dataset.gameState = newState;
}
// ================== Funções de Música e Som ==================
function initBackgroundMusic() {
    const musicState = localStorage.getItem('musicEnabled');
    backgroundMusic.volume = VOLUME_MUSICA_NORMAL;
    const musicIcon = toggleMusicBtn.querySelector('.music-icon');

    if (musicState === 'false') {
        musicIcon.textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        isMusicPlaying = false;
    } else {
        musicIcon.textContent = '🔊';
        isMusicPlaying = true;
        const startMusicHandler = () => {
            backgroundMusic.play().catch(err => console.warn('Interação do usuário necessária para tocar música:', err));
            document.removeEventListener('click', startMusicHandler);
        };
        document.addEventListener('click', startMusicHandler, { once: true });
    }

    toggleMusicBtn.addEventListener('click', toggleBackgroundMusic);
}
function toggleBackgroundMusic() {
    const musicIcon = toggleMusicBtn.querySelector('.music-icon');
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicIcon.textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        localStorage.setItem('musicEnabled', 'false');
    } else {
        backgroundMusic.play().catch(err => console.error('Falha ao tocar música:', err));
        musicIcon.textContent = '🔊';
        toggleMusicBtn.classList.remove('muted');
        localStorage.setItem('musicEnabled', 'true');
    }
    isMusicPlaying = !isMusicPlaying;
}
function playGameSound(sound) {
    if (!sound) return;
    const currentMusicVolume = backgroundMusic.volume;
    if (isMusicPlaying) {
        backgroundMusic.volume = VOLUME_MUSICA_REDUZIDO;
    }
    sound.currentTime = 0;
    sound.play().catch(err => console.error("Erro ao tocar som:", err));
    setTimeout(() => {
        if (isMusicPlaying) {
            backgroundMusic.volume = currentMusicVolume;
        }
    }, DELAY_RESTAURAR_VOLUME);
}
// ================== Funções de Atualização do Estado do Jogo ==================
function updateLocalStorage(statusFinal) {
    switch (statusFinal) {
        case "vitoria":
            storageStats.vitorias++;
            localStorage.setItem('vitorias', storageStats.vitorias);
            break;
        case "derrota":
            storageStats.derrotas++;
            localStorage.setItem('derrotas', storageStats.derrotas);
            break;
        case "empate":
            storageStats.empates++;
            localStorage.setItem('empates', storageStats.empates);
            break;
    }
    displayTotalStats();
}
function displayTotalStats() {
    if (statsDisplayElement) {
        statsDisplayElement.innerHTML = `
            <p><strong>Estatísticas Gerais:</strong></p>
            <p>Vitórias: ${storageStats.vitorias}</p>
            <p>Derrotas: ${storageStats.derrotas}</p>
            <p>Empates: ${storageStats.empates}</p>
        `;
    }
}
function setLoadingState(isLoading) {
    isWaiting = isLoading;
    showLoadingOverlay(isLoading);
    btnChoices.forEach(button => {
        button.disabled = isLoading;
        button.classList.toggle('loading', isLoading);
    });
    if (isLoading) {
        resultDisplay.innerHTML = '<span class="loading-text">Processando...</span>';
        resultDisplay.classList.add('loading');
    } else {
        resultDisplay.classList.remove('loading');
    }
}
function displayTemporaryError(message) {
    resultDisplay.innerHTML = `<span class="error">Erro: ${message}</span>`;
    resultDisplay.classList.add('error');
    setTimeout(() => {
        if (resultDisplay.classList.contains('error')) {
            resultDisplay.innerHTML = "Tente novamente!";
            resultDisplay.classList.remove('error');
        }
    }, 4000);
}
function initializeGame() {
    placar = { jogador: 0, computador: 0, empates: 0 };
    tentativasRestantes = TENTATIVAS_INICIAIS;
    ultimoJogador = null;
    updateGameState(GameState.PLAYING);
    setLoadingState(false);

    playerScoreDisplay.textContent = placar.jogador;
    computerScoreDisplay.textContent = placar.computador;
    attemptsDisplay.textContent = tentativasRestantes;
    historyList.innerHTML = '';
    resultDisplay.textContent = "Faça sua jogada!";
    resultDisplay.className = 'result-display';

    if (finalMessageElement) {
        finalMessageElement.style.display = 'none';
    }

    btnChoices.forEach(button => {
        button.disabled = false;
        button.classList.remove('clicked', 'loading');
    });

    displayTotalStats();
}
// ================== Funções de Interface do Jogo ==================
function updateResultDisplay(resultado, jogadaComputador) {
    const messagesByResult = {
        [RESULTADO_JOGADOR_GANHOU]: "Você foi incrível! Vitória brilhante! 🌟",
        [RESULTADO_COMPUTADOR_GANHOU]: "Oh não! O computador venceu essa. 🤖",
        [RESULTADO_EMPATE]: "Foi um empate! Equilíbrio total! 😯"
    };
    const jogadaComputadorDisplay = jogadaComputador.charAt(0).toUpperCase() + jogadaComputador.slice(1);
    resultDisplay.innerHTML = `
        <div class="animated-message">
            <p>Computador escolheu: <strong>${jogadaComputadorDisplay}</strong></p>
            <p>${messagesByResult[resultado] || resultado}</p>
        </div>
    `;
    resultDisplay.classList.remove('loading', 'error');
    switch (resultado) {
        case RESULTADO_JOGADOR_GANHOU:
            playGameSound(sounds.win);
            break;
        case RESULTADO_COMPUTADOR_GANHOU:
            playGameSound(sounds.lose);
            break;
        case RESULTADO_EMPATE:
            playGameSound(sounds.draw);
            break;
    }

    showQuickResultMessage(resultado);
}
function addToHistory(resultado, jogadaJogador, jogadaComputador) {
    const li = document.createElement('li');
    let resultadoClasse = '';

    if (resultado === RESULTADO_JOGADOR_GANHOU) {
        resultadoClasse = 'history-win';
    } else if (resultado === RESULTADO_COMPUTADOR_GANHOU) {
        resultadoClasse = 'history-lose';
    } else {
        resultadoClasse = 'history-draw';
    }

    li.classList.add(resultadoClasse);
    const jogadaJogadorDisplay = jogadaJogador.charAt(0).toUpperCase() + jogadaJogador.slice(1);
    const jogadaComputadorDisplay = jogadaComputador.charAt(0).toUpperCase() + jogadaComputador.slice(1);

    li.innerHTML = `
        <span>Jogador: <strong>${jogadaJogadorDisplay}</strong></span>
        <span>Computador: <strong>${jogadaComputadorDisplay}</strong></span>
        <span>Resultado: <strong class="result-text">${resultado}</strong></span>
    `;

    historyList.prepend(li);
    while (historyList.children.length > HISTORY_LIMIT) {
        historyList.removeChild(historyList.lastChild);
    }
}
function updateScore(resultado) {
    if (resultado === RESULTADO_JOGADOR_GANHOU) {
        placar.jogador++;
    } else if (resultado === RESULTADO_COMPUTADOR_GANHOU) {
        placar.computador++;
    } else if (resultado === RESULTADO_EMPATE) {
        placar.empates++;
    }

    tentativasRestantes = Math.max(tentativasRestantes - 1, 0);
    playerScoreDisplay.textContent = placar.jogador;
    computerScoreDisplay.textContent = placar.computador;
    attemptsDisplay.textContent = tentativasRestantes;
}
function getRandomMessage(messages) {
    if (!messages || messages.length === 0) return "Fim de Jogo!";
    const index = Math.floor(Math.random() * messages.length);
    return messages.splice(index, 1)[0];
}
function checkForGameEnd() {
    if (tentativasRestantes <= 0) {
        let statusFinal = "empate";
        let finalSound = sounds.finalDraw;
        let buttonText = "Jogar Novamente";

        const winMessages = [
            "VITÓRIA! Você leu a mente do computador ou só deu sorte? 🤔🏆",
            "CAMPEÃO! O computador já pediu a revanche! 🎉",
            "INCRÍVEL! Suas habilidades no Jokenpô são lendárias! 🥇",
            "DOMINOU! O computador está calculando como você fez isso... 💪",
            "SHOW! Mandou bem demais! O troféu é seu! 👑",
            "PERFEITO! Nem a IA mais avançada te pararia! ✨",
            "UAU! Essa vitória foi mais bonita que um código sem bugs! 😉"
        ];

        const loseMessages = [
            "DERROTA! A Skynet mandou lembranças... 🤖",
            "OPS! O computador previu seus movimentos! 📟",
            "QUASE LÁ! Faltou pouco... ou muito? ⚠️",
            "IH! Acho que o computador andou treinando escondido! 🧐",
            "NÃO FOI DESSA VEZ! Mas a vingança é um prato que se joga frio! 💔",
            "GAME OVER! O computador riu em binário! 01101000 01100001! 😂",
            "MELHOR SORTE NA PRÓXIMA! Ou use Pedra, todo mundo usa Pedra... 🗿"
        ];

        const drawMessages = [
            "EMPATE! Conexão mental com a máquina? Bizarro! 🤷",
            "IGUAIS! Ninguém levou, mas a emoção foi real! 👏",
            "SINCRONIZADOS! Foi quase um dueto de Jokenpô! 🔄",
            "EQUILÍBRIO! A Força está balanceada entre vocês! 🤝",
            "NEM GANHOU, NEM PERDEU! Apenas... empatou! ⚖️",
            "DE NOVO? Vocês estão combinando as jogadas? 👀",
            "TÃO IGUAL QUE DEU BUG! Brincadeira... ou não? 🤔"
        ];
        let finalText = "";
        if (placar.jogador > placar.computador) {
            finalText = `🎉 ${getRandomMessage(winMessages)} 🎊`;
            finalSound = sounds.finalWin;
            statusFinal = "vitoria";
        } else if (placar.computador > placar.jogador) {
            finalText = `😞 ${getRandomMessage(loseMessages)}`;
            finalSound = sounds.finalLose;
            statusFinal = "derrota";
            buttonText = "Tentar Revanche";
        } else {
            finalText = `🤝 ${getRandomMessage(drawMessages)}`;
            statusFinal = "empate";
        }
        playGameSound(finalSound);
        updateGameState(GameState.FINISHED);
        if (finalMessageElement && finalResultTextElement && totalEmpatesElement) {
            finalResultTextElement.textContent = finalText;
            totalEmpatesElement.textContent = placar.empates;

            if (playAgainButton) {
                const newPlayAgainButton = playAgainButton.cloneNode(true);
                playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);
                newPlayAgainButton.addEventListener('click', initializeGame);
                newPlayAgainButton.textContent = buttonText;
            }

            finalMessageElement.style.display = 'flex';
        }

        updateLocalStorage(statusFinal);
        btnChoices.forEach(button => button.disabled = true);
    }
}
function showJokenpoAnimation(jogadorChoiceIndex, jogadaComputadorTexto, onAnimationEnd) {
    const jogadorSymbol = SIMBOLOS_JOGO[jogadorChoiceIndex];
    const computerIndex = JOGADA_PARA_INDICE[jogadaComputadorTexto.toLowerCase()];
    const computerFinalSymbol = SIMBOLOS_JOGO[computerIndex];
    animationContainer.innerHTML = `
        <div class="symbol-container">
            <div class="player-choice">
                <div class="choice-label">Você</div>
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
    animationContainer.classList.add('active', 'animating');
    const computerSymbolElement = animationContainer.querySelector('.computer-symbol');
    const countdownElement = animationContainer.querySelector('.countdown');
    const playerSymbolElement = animationContainer.querySelector('.player-symbol');

    playerSymbolElement.classList.add('highlight');

    let secondsLeft = 3;
    let symbolShuffleIndex = 0;

    const shuffleInterval = setInterval(() => {
        symbolShuffleIndex = (symbolShuffleIndex + 1) % SIMBOLOS_JOGO.length;
        computerSymbolElement.textContent = SIMBOLOS_JOGO[symbolShuffleIndex];
    }, 150);
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        countdownElement.textContent = secondsLeft > 0 ? secondsLeft : "Já!";

        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            clearInterval(shuffleInterval);
            computerSymbolElement.textContent = computerFinalSymbol;
            computerSymbolElement.classList.add('highlight');

            setTimeout(() => {
                animationContainer.classList.remove('active', 'animating');
                if (typeof onAnimationEnd === 'function') onAnimationEnd();
            }, DELAY_ANIMACAO_RESULTADO);
        }
    }, 1000);
}
async function checkAudioFiles() {
    try {
        const response = await fetch('/check_files');
        const data = await response.json();
        if (data.status !== 'ok') {
            showFeedback('Alguns arquivos de áudio estão faltando', 'warning');
        }
    } catch (error) {
        console.error('Erro ao verificar arquivos de áudio:', error);
    }
}
async function checkApiHealth() {
    try {
        const response = await fetch('/ping');
        const data = await response.json();
        if (data.status !== 'ok') {
            showFeedback('Serviço temporariamente indisponível', 'warning');
        }
    } catch (error) {
        showFeedback('Não foi possível conectar ao servidor');
    }
}
async function sendChoiceToServer(jogadorChoiceIndex) {
    if (isWaiting || tentativasRestantes <= 0) return;

    setLoadingState(true);
    playGameSound(sounds.click);
    try {
        if (!navigator.onLine) {
            throw new Error(OFFLINE_MESSAGE);
        }
        const response = await fetch('/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                jogador: jogadorChoiceIndex,
                ultimo_jogador: ultimoJogador
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        ultimoJogador = jogadorChoiceIndex;

        showJokenpoAnimation(jogadorChoiceIndex, data.jogada_computador, () => {
            updateResultDisplay(data.resultado, data.jogada_computador);
            addToHistory(data.resultado, ITENS_JOGO[jogadorChoiceIndex], data.jogada_computador);
            updateScore(data.resultado);

            setTimeout(() => {
                setLoadingState(false);
                checkForGameEnd();
            }, DELAY_CHECK_FIM_JOGO);
        });
    } catch (error) {
        console.error("Erro ao processar jogada:", error);
        showFeedback(error.message);
        setLoadingState(false);
    }
}
function showQuickResultMessage(resultado) {
    if (!quickResultElement) return;

    let text = "";
    let className = "";

    if (resultado === RESULTADO_JOGADOR_GANHOU) {
        text = "WIN";
        className = "win";
    } else if (resultado === RESULTADO_COMPUTADOR_GANHOU) {
        text = "LOSE";
        className = "lose";
    } else {
        text = "DRAW";
        className = "draw";
    }

    quickResultElement.textContent = text;
    quickResultElement.className = className;
    quickResultElement.style.display = "block";

    setTimeout(() => {
        quickResultElement.style.display = "none";
        quickResultElement.className = "";
    }, DELAY_MENSAGEM_RAPIDA);
}
// ================== Event Listeners e Inicialização ==================
btnChoices.forEach(button => {
    button.addEventListener('click', () => {
        if (!isWaiting) {
            btnChoices.forEach(btn => btn.classList.remove('clicked'));
            button.classList.add('clicked');
            const choiceIndex = parseInt(button.dataset.choice, 10);
            sendChoiceToServer(choiceIndex);
        }
    });
});
if (playAgainButton) {
    playAgainButton.addEventListener('click', initializeGame);
}
// Listeners para estado online/offline
window.addEventListener('online', () => {
    offlineMessageElement.hidden = true;
});
window.addEventListener('offline', () => {
    offlineMessageElement.hidden = false;
    showFeedback(OFFLINE_MESSAGE, 'warning');
});
// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await checkApiHealth();
    initializeGame();
    initBackgroundMusic();
    checkAudioFiles();
});