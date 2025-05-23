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

// Mapeamentos e símbolos do jogo
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

// ================== Segurança: Função para escapar HTML ==================
// ... existing code ...
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, match => replacements[match]);
}

// ================== Funções de Utilidade ==================
function showLoadingOverlay(show) {
    if (loadingOverlay) {
        loadingOverlay.hidden = !show;
    }
}

function showFeedback(message, type = 'error') {
    if (feedbackMessage) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback-message ${type}`;
        feedbackMessage.hidden = false;
        setTimeout(() => {
            feedbackMessage.hidden = true;
        }, 3000);
    } else {
        console.warn("Elemento de feedback não encontrado.");
    }
}

function updateGameState(newState) {
    currentGameState = newState;
    document.body.dataset.gameState = newState;
}

// ================== Funções de Música e Som ==================
function initBackgroundMusic() {
    if (!backgroundMusic || !toggleMusicBtn) return;
    const musicState = localStorage.getItem('musicEnabled');
    backgroundMusic.volume = VOLUME_MUSICA_NORMAL;
    const musicIcon = toggleMusicBtn.querySelector('.music-icon');
    if (musicState === 'false') {
        if (musicIcon) musicIcon.textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        isMusicPlaying = false;
    } else {
        if (musicIcon) musicIcon.textContent = '🔊';
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
    if (!backgroundMusic || !toggleMusicBtn) return;
    const musicIcon = toggleMusicBtn.querySelector('.music-icon');
    if (isMusicPlaying) {
        backgroundMusic.pause();
        if (musicIcon) musicIcon.textContent = '🔈';
        toggleMusicBtn.classList.add('muted');
        localStorage.setItem('musicEnabled', 'false');
    } else {
        backgroundMusic.play().catch(err => console.error('Falha ao tocar música:', err));
        if (musicIcon) musicIcon.textContent = '🔊';
        toggleMusicBtn.classList.remove('muted');
        localStorage.setItem('musicEnabled', 'true');
    }
    isMusicPlaying = !isMusicPlaying;
}

function playGameSound(sound) {
    if (!sound || !backgroundMusic) return;
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
            <p>Vitórias: ${escapeHTML(storageStats.vitorias.toString())}</p>
            <p>Derrotas: ${escapeHTML(storageStats.derrotas.toString())}</p>
            <p>Empates: ${escapeHTML(storageStats.empates.toString())}</p>
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
    if (resultDisplay) {
        if (isLoading) {
            resultDisplay.innerHTML = '<span class="loading-text">Processando...</span>';
            resultDisplay.classList.add('loading');
        } else {
            resultDisplay.classList.remove('loading');
        }
    }
}

function displayTemporaryError(message) {
    if (resultDisplay) {
        resultDisplay.innerHTML = `<span class="error">Erro: ${escapeHTML(message)}</span>`;
        resultDisplay.classList.add('error');
        setTimeout(() => {
            if (resultDisplay.classList.contains('error')) {
                resultDisplay.textContent = "Tente novamente!";
                resultDisplay.classList.remove('error');
            }
        }, 4000);
    }
}

function initializeGame() {
    placar = { jogador: 0, computador: 0, empates: 0 };
    tentativasRestantes = TENTATIVAS_INICIAIS;
    ultimoJogador = null;
    updateGameState(GameState.PLAYING);
    setLoadingState(false);
    if (playerScoreDisplay) playerScoreDisplay.textContent = placar.jogador;
    if (computerScoreDisplay) computerScoreDisplay.textContent = placar.computador;
    if (attemptsDisplay) attemptsDisplay.textContent = tentativasRestantes;
    if (historyList) historyList.innerHTML = '';
    if (resultDisplay) {
        resultDisplay.textContent = "Faça sua jogada!";
        resultDisplay.className = 'result-display';
    }
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
        "O JOGADOR GANHOU!": "Você foi incrível! Vitória brilhante! 🌟",
        "O COMPUTADOR GANHOU!": "Oh não! O computador venceu essa. 🤖",
        "EMPATE!": "Foi um empate! Equilíbrio total! 😯"
    };
    const jogadaComputadorDisplay = escapeHTML(
        jogadaComputador.charAt(0).toUpperCase() + jogadaComputador.slice(1)
    );
    if (resultDisplay) {
        resultDisplay.innerHTML = `
            <div class="animated-message">
                <p>Computador escolheu: <strong>${jogadaComputadorDisplay}</strong></p>
                <p>${escapeHTML(messagesByResult[resultado] || resultado)}</p>
            </div>
        `;
        resultDisplay.classList.remove('loading', 'error');
    }
    switch (resultado) {
        case "O JOGADOR GANHOU!":
            playGameSound(sounds.win);
            break;
        case "O COMPUTADOR GANHOU!":
            playGameSound(sounds.lose);
            break;
        case "EMPATE!":
            playGameSound(sounds.draw);
            break;
    }
    showQuickResultMessage(resultado);
}

function updateScore(resultado) {
    if (resultado === "O JOGADOR GANHOU!") {
        placar.jogador++;
    } else if (resultado === "O COMPUTADOR GANHOU!") {
        placar.computador++;
    } else if (resultado === "EMPATE!") {
        placar.empates++;
    }
    tentativasRestantes = Math.max(tentativasRestantes - 1, 0);
    if (playerScoreDisplay) playerScoreDisplay.textContent = placar.jogador;
    if (computerScoreDisplay) computerScoreDisplay.textContent = placar.computador;
    if (attemptsDisplay) attemptsDisplay.textContent = tentativasRestantes;
}

function addToHistory(resultado, jogadaJogador, jogadaComputador) {
    if (!historyList) return;
    const li = document.createElement('li');
    let resultadoClasse = '';
    if (resultado === "O JOGADOR GANHOU!") {
        resultadoClasse = 'history-win';
    } else if (resultado === "O COMPUTADOR GANHOU!") {
        resultadoClasse = 'history-lose';
    } else {
        resultadoClasse = 'history-draw';
    }
    li.classList.add(resultadoClasse);
    const jogadaJogadorDisplay = escapeHTML(
        jogadaJogador.charAt(0).toUpperCase() + jogadaJogador.slice(1)
    );
    const jogadaComputadorDisplay = escapeHTML(
        jogadaComputador.charAt(0).toUpperCase() + jogadaComputador.slice(1)
    );
    const resultadoDisplay = escapeHTML(resultado);
    li.innerHTML = `
        <span>Jogador: <strong>${jogadaJogadorDisplay}</strong></span>
        <span>Computador: <strong>${jogadaComputadorDisplay}</strong></span>
        <span>Resultado: <strong class="result-text">${resultadoDisplay}</strong></span>
    `;
    historyList.prepend(li);
    while (historyList.children.length > HISTORY_LIMIT) {
        historyList.removeChild(historyList.lastChild);
    }
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
            const playAgainBtn = document.getElementById('play-again');
            if (playAgainBtn) {
                playAgainBtn.textContent = buttonText;
                playAgainBtn.onclick = initializeGame;
                playAgainBtn.disabled = false;
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

        const response = await fetch('/ping', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            showFeedback('Serviço temporariamente indisponível: ' + (data.message || 'Status não ok'), 'warning');
            return false;
        }
        
        // Verificar se o timestamp está muito desalinhado com o horário local
        const serverTime = new Date(data.timestamp);
        const localTime = new Date();
        const timeDiff = Math.abs(serverTime - localTime);
        
        if (timeDiff > 300000) { // 5 minutos de diferença
            showFeedback('Aviso: Relógio do servidor pode estar desalinhado', 'warning');
        }
        
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            showFeedback('Servidor está demorando para responder', 'warning');
        } else {
            showFeedback('Não foi possível conectar ao servidor: ' + (error.message || 'Erro desconhecido'));
        }
        return false;
    }
}

async function sendChoiceToServer(jogadorChoiceIndex, retryCount = 0) {
    if (isWaiting || tentativasRestantes <= 0) return;
    setLoadingState(true);
    playGameSound(sounds.click);

    const MAX_RETRIES = 3;
    const TIMEOUT = 10000; // 10 segundos

    try {
        if (!navigator.onLine) {
            throw new Error(OFFLINE_MESSAGE);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch('/jogar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                jogador: jogadorChoiceIndex,
                ultimo_jogador: ultimoJogador
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

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
        
        if (error.name === 'AbortError') {
            showFeedback('A conexão está muito lenta. Tentando novamente...');
        } else {
            showFeedback(error.message);
        }

        if (retryCount < MAX_RETRIES && (error.name === 'AbortError' || !navigator.onLine)) {
            setTimeout(() => {
                sendChoiceToServer(jogadorChoiceIndex, retryCount + 1);
            }, 1000 * (retryCount + 1)); // Backoff exponencial
        } else {
            setLoadingState(false);
        }
    }
}

function showQuickResultMessage(resultado) {
    if (!quickResultElement) return;
    let text = "";
    let className = "";
    
    if (resultado === "O JOGADOR GANHOU!") {
        text = "WIN";
        className = "win";
    } else if (resultado === "O COMPUTADOR GANHOU!") {
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
    if (offlineMessageElement) offlineMessageElement.hidden = true;
});
window.addEventListener('offline', () => {
    if (offlineMessageElement) offlineMessageElement.hidden = false;
    showFeedback(OFFLINE_MESSAGE, 'warning');
});

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    showLoadingOverlay(true);
    try {
        const serverOk = await checkApiHealth();
        if (!serverOk) {
            showFeedback('O jogo pode não funcionar corretamente. Tente recarregar a página.', 'warning');
        }
        
        await checkAudioFiles();
        initializeGame();
        initBackgroundMusic();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showFeedback('Erro ao inicializar o jogo. Por favor, recarregue a página.');
    } finally {
        showLoadingOverlay(false);
    }
});
