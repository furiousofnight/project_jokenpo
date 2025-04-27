import logging
import os
import random
from logging.handlers import RotatingFileHandler
from urllib.parse import urlparse, urljoin

from flask import Flask, render_template, request, jsonify, send_from_directory, abort, redirect
from flask_caching import Cache  # type: ignore
from flask_cors import CORS
from flask_limiter import Limiter  # type: ignore
from flask_limiter.util import get_remote_address  # type: ignore
from prometheus_client import Counter  # type: ignore
from werkzeug.middleware.proxy_fix import ProxyFix

# ======= NOVO: Flask-Talisman para segurança automática =======
from flask_talisman import Talisman

# Exceções personalizadas
class JokenpoError(Exception):
    """Exceção base para erros do jogo"""
    pass

class JogadaInvalidaError(JokenpoError):
    """Exceção para jogadas inválidas"""
    pass

# Configuração do aplicativo
app = Flask(__name__, static_folder="static", template_folder="templates")
app.wsgi_app = ProxyFix(app.wsgi_app)
CORS(app, resources={r"/play": {"origins": ["http://localhost:3000"]}})
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Configuração correta do Limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=["200 per day", "50 per hour"]
)

# Métricas
jogadas_counter = Counter('jokenpo_jogadas_total', 'Total de jogadas realizadas')
vitorias_jogador = Counter('jokenpo_vitorias_jogador', 'Vitórias do jogador')

# Configurações de desenvolvimento
if app.debug:
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

# Configuração do logger
handler = RotatingFileHandler('jokenpo.log', maxBytes=1000000, backupCount=3)
formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', '%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
if app.logger.handlers:
    app.logger.handlers = []
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
app.logger.info("Aplicativo de Jokenpô iniciado!")

# Constantes do jogo
ITENS = ["pedra", "papel", "tesoura"]
REGRAS_VITORIA = {
    0: 2,  # Pedra vence Tesoura
    1: 0,  # Papel vence Pedra
    2: 1   # Tesoura vence Papel
}
JOGADA_QUE_VENCE = {
    0: 1,  # Pedra é vencida por Papel
    1: 2,  # Papel é vencido por Tesoura
    2: 0   # Tesoura é vencida por Pedra
}

# Criação de diretórios necessários
os.makedirs(app.static_folder, exist_ok=True)
os.makedirs(os.path.join(app.static_folder, 'sounds'), exist_ok=True)

# ======= NOVO: Configuração do Flask-Talisman (CSP e outros headers) =======
csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:"],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'connect-src': ["'self'"]
}
Talisman(app, content_security_policy=csp)

def jogada_computador(ultimo_jogador):
    """
    Calcula a jogada do computador utilizando estratégias com probabilidades definidas.
    """
    if ultimo_jogador not in [0, 1, 2]:
        app.logger.info("Primeira rodada ou último jogador inválido. Escolha aleatória.")
        return random.choice([0, 1, 2])
    jogada_vencedora = JOGADA_QUE_VENCE[ultimo_jogador]
    jogada_perdedora = REGRAS_VITORIA[ultimo_jogador]
    jogada_empate = ultimo_jogador
    prob_vencer = 0.60
    prob_aleatoria = 0.20
    prob_empatar = 0.10
    estrategia = random.random()

    if estrategia < prob_vencer:
        app.logger.info(
            f"Estratégia: Tentar vencer. Última jogada do jogador: {ITENS[ultimo_jogador]} -> Computador joga: {ITENS[jogada_vencedora]}")
        return jogada_vencedora
    elif estrategia < prob_vencer + prob_aleatoria:
        jogada_aleatoria = random.choice([0, 1, 2])
        app.logger.info(f"Estratégia: Jogada aleatória. Computador joga: {ITENS[jogada_aleatoria]}")
        return jogada_aleatoria
    elif estrategia < prob_vencer + prob_aleatoria + prob_empatar:
        app.logger.info(f"Estratégia: Empatar. Computador joga: {ITENS[jogada_empate]}")
        return jogada_empate
    else:
        app.logger.info(f"Estratégia: Jogada perdedora. Computador joga: {ITENS[jogada_perdedora]}")
        return jogada_perdedora

def determinar_resultado(jogador, computador):
    """Determina o resultado do jogo."""
    if jogador == computador:
        return "EMPATE!"
    elif REGRAS_VITORIA[computador] == jogador:
        return "O COMPUTADOR GANHOU!"
    else:
        vitorias_jogador.inc()
        return "O JOGADOR GANHOU!"

def validar_jogada(dados):
    """Valida e processa os dados da requisição."""
    if not dados or not isinstance(dados, dict):
        raise JogadaInvalidaError("Formato de requisição inválido. Esperado um JSON.")
    jogador_str = dados.get('jogador')
    if jogador_str is None:
        raise JogadaInvalidaError("Dados inválidos: o campo 'jogador' é obrigatório.")
    try:
        jogador = int(jogador_str)
    except (ValueError, TypeError):
        raise JogadaInvalidaError("Tipo inválido para 'jogador'. Deve ser um número inteiro 0, 1 ou 2.")
    if jogador not in [0, 1, 2]:
        raise JogadaInvalidaError("Valor inválido para 'jogador'. Escolha entre 0, 1 ou 2.")
    ultimo_jogador = None
    ultimo_jogador_str = dados.get('ultimo_jogador')
    if ultimo_jogador_str is not None:
        try:
            ultimo_jogador_val = int(ultimo_jogador_str)
            if ultimo_jogador_val in [0, 1, 2]:
                ultimo_jogador = ultimo_jogador_val
            else:
                app.logger.warning(f"Valor inválido para 'ultimo_jogador' ({ultimo_jogador_str}). Valor ignorado.")
        except (ValueError, TypeError):
            app.logger.warning(f"Tipo inválido para 'ultimo_jogador' ({ultimo_jogador_str}). Valor ignorado.")
    return jogador, ultimo_jogador

# 2. Função para validar URLs de redirecionamento seguro
def is_safe_url(target):
    # Garante que o redirecionamento é apenas para o mesmo domínio
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc

# 3. Exemplo de endpoint seguro para redirecionamento (caso use OpenID/OAuth)
@app.route('/safe-redirect')
def safe_redirect():
    redirect_uri = request.args.get('redirect_uri')
    if not redirect_uri or not is_safe_url(redirect_uri):
        abort(400, description="Redirecionamento inseguro detectado.")
    return redirect(redirect_uri)

# Rotas
@app.route('/')
def index():
    """Renderiza a página principal do jogo."""
    app.logger.info("Página inicial acessada.")
    return render_template('index.html')

@app.route('/play', methods=['POST'])
@limiter.limit("30/minute")
def play():
    try:
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        dados = request.get_json(force=True)
        jogador, ultimo_jogador = validar_jogada(dados)
        computador = jogada_computador(ultimo_jogador)
        resultado = determinar_resultado(jogador, computador)
        jogadas_counter.inc()

        # LOG DETALHADO
        app.logger.info(
            f"[JOGADA] IP: {ip} | Jogador: {jogador} ({ITENS[jogador]}) | "
            f"Computador: {computador} ({ITENS[computador]}) | "
            f"Resultado: {resultado.upper()} | Dados recebidos: {dados}"
        )

        return jsonify({
            "jogada_computador": ITENS[computador],
            "resultado": resultado
        }), 200

    except JogadaInvalidaError as e:
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        app.logger.warning(f"[ERRO JOGADA] IP: {ip} | Erro: {e} | Dados: {request.get_json(force=True)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        app.logger.exception(f"[ERRO INTERNO] IP: {ip} | Erro: {e} | Dados: {request.get_json(force=True)}")
        return jsonify({"error": "Erro interno no servidor. Tente novamente mais tarde."}), 500

@app.route('/static/sounds/<path:filename>')
def serve_sounds(filename):
    """Serve arquivos de som com cache."""
    app.logger.info(f"Requisição de áudio: {filename} de {request.remote_addr}")
    if ".." in filename or filename.startswith("/"):
        app.logger.warning(f"Tentativa de acesso inválido a arquivo: {filename} de {request.remote_addr}")
        abort(400, description="Acesso inválido.")

    sound_folder = os.path.join(app.static_folder, 'sounds')
    app.logger.info(f"Buscando arquivo de som em: {os.path.join(sound_folder, filename)}")

    try:
        return send_from_directory(sound_folder, filename, as_attachment=False)
    except FileNotFoundError:
        app.logger.error(f"Arquivo de som não encontrado: {filename}")
        return jsonify({"error": "Arquivo não encontrado."}), 404
    except Exception as e:
        app.logger.exception(f"Erro ao servir arquivo de som: {filename} - {e}")
        return jsonify({"error": "Erro ao servir arquivo de som."}), 500

@app.route('/check_files', methods=['GET'])
def check_files():
    """Verifica a existência dos arquivos de som."""
    app.logger.info(f"Verificação dos arquivos de som iniciada por {request.remote_addr}")

    sound_files = [
        "background_music.mp3", "click.mp3", "win.mp3", "lose.mp3",
        "draw.mp3", "final_win.mp3", "final_lose.mp3", "final_draw.mp3"
    ]

    sound_folder = os.path.join(app.static_folder, 'sounds')
    status = {}
    all_found = True

    for sound in sound_files:
        file_path = os.path.join(sound_folder, sound)
        existe = os.path.exists(file_path)
        status[sound] = existe
        if not existe:
            app.logger.warning(f"Arquivo não encontrado: {sound} em {file_path}")
            all_found = False
        else:
            app.logger.info(f"Arquivo encontrado: {sound}")

    app.logger.info(f"Resultado da verificação de arquivos: {status}")
    return jsonify({
        "status": "ok" if all_found else "warning",
        "message": "Todos os arquivos de som encontrados." if all_found else "Alguns arquivos de som estão faltando.",
        "files": status
    })

@app.route('/ping', methods=['GET'])
def ping():
    """Endpoint de diagnóstico."""
    app.logger.info(f"Ping recebido de {request.remote_addr} - aplicação funcionando.")
    return jsonify({
        "status": "ok",
        "message": "Aplicação JoKenPô está rodando!",
        "timestamp": os.environ.get("FLY_ALLOC_ID", "local-dev")
    }), 200  # Adicionando o código de status HTTP 200

# Manipuladores de erro
@app.errorhandler(400)
def error_400(e):
    app.logger.error(f"400 Bad Request: {e}")
    return jsonify({"error": str(e.description) if hasattr(e, 'description') else "Requisição inválida."}), 400

@app.errorhandler(404)
def error_404(e):
    app.logger.error(f"404 Not Found: {e}")
    return jsonify({"error": "Recurso não encontrado."}), 404

@app.errorhandler(500)
def error_500(e):
    app.logger.exception(f"500 Internal Server Error: {e}")
    return jsonify({"error": "Erro interno no servidor. Tente novamente mais tarde."}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug_mode, ssl_context=('certs/cert.pem', 'certs/key.pem'))
