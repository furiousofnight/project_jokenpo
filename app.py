import logging
import os
import random
import re
import time
from logging.handlers import RotatingFileHandler
from urllib.parse import urlparse, urljoin
from dotenv import load_dotenv
from datetime import datetime

from flask import Flask, render_template, request, jsonify, send_from_directory, abort, redirect, make_response
from flask_caching import Cache  # type: ignore
from flask_cors import CORS
from flask_limiter import Limiter  # type: ignore
from flask_limiter.util import get_remote_address  # type: ignore
from prometheus_client import Counter  # type: ignore
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_talisman import Talisman  # Importando Flask-Talisman

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Gerar uma chave secreta forte se não existir
def generate_secret_key():
    """Gera uma chave secreta forte."""
    try:
        import secrets
        return secrets.token_hex(32)
    except ImportError:
        import random
        import string
        chars = string.ascii_letters + string.digits + string.punctuation
        return ''.join(random.SystemRandom().choice(chars) for _ in range(64))

# =============================
# Exceções personalizadas
# =============================
class JokenpoError(Exception):
    """Exceção base para erros do jogo."""
    pass

class JogadaInvalidaError(JokenpoError):
    """Exceção para jogadas inválidas."""
    pass

# =============================
# Configuração do aplicativo
# =============================
app = Flask(__name__, static_folder="static", template_folder="templates")
app.wsgi_app = ProxyFix(app.wsgi_app)

# Configuração da chave secreta
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or generate_secret_key()

# Configuração de CORS
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Permitir todas as origens temporariamente para debug
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Requested-With", "Authorization"],
        "supports_credentials": True
    }
})

# Configuração do Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Configuração do Limiter para rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=["200 per day", "50 per hour"]
)

# =============================
# Métricas com Prometheus
# =============================
jogadas_counter = Counter('jokenpo_jogadas_total', 'Total de jogadas realizadas')
vitorias_jogador = Counter('jokenpo_vitorias_jogador', 'Total de vitórias do jogador')

# =============================
# Configurações de desenvolvimento
# =============================
if app.debug:
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

# =============================
# Configuração do Logger
# =============================
handler = RotatingFileHandler('jokenpo.log', maxBytes=1000000, backupCount=3)
formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', '%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
if app.logger.handlers:
    app.logger.handlers = []
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
app.logger.info("Aplicativo de Jokenpô iniciado!")

# =============================
# Constantes do jogo
# =============================
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

# Constantes de validação e controle
INTERVALO_MIN_JOGADAS = 1.0  # segundos
MAX_HISTORICO = 100
MAX_TENTATIVAS_INVALIDAS = 5
TEMPO_BLOQUEIO = 300  # 5 minutos em segundos
LIMITE_JOGADAS_HORA = 100

# Dicionários de controle
ultimo_acesso = {}
historico_jogadas = []
tentativas_invalidas = {}
bloqueios = {}

# Criação de diretórios necessários para arquivos estáticos e de som
os.makedirs(app.static_folder, exist_ok=True)
os.makedirs(os.path.join(app.static_folder, 'sounds'), exist_ok=True)

# =============================
# Configurações de Segurança
# =============================
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=1800,  # 30 minutos
)

# Configurações de CSP mais permissivas para desenvolvimento
csp = {
    'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
    'style-src': ["'self'", "'unsafe-inline'", "*"],
    'font-src': ["'self'", "*"],
    'img-src': ["'self'", "data:", "*"],
    'media-src': ["'self'", "*"],
    'connect-src': ["'self'", "*"],
    'form-action': ["'self'", "*"]
}

# Configuração do Talisman com opções ajustadas
Talisman(app,
    force_https=True,
    strict_transport_security=True,
    session_cookie_secure=True,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src'],
    feature_policy={
        'geolocation': "'none'",
        'midi': "'none'",
        'notifications': "'none'",
        'push': "'none'",
        'sync-xhr': "'self'",
        'microphone': "'none'",
        'camera': "'none'",
        'magnetometer': "'none'",
        'gyroscope': "'none'",
        'speaker': "'self'",
        'vibrate': "'none'",
        'fullscreen': "'self'",
        'payment': "'none'"
    }
)

# Rate limiting mais restritivo para produção
if not app.debug:
    limiter.default_limits = ["100 per day", "30 per hour", "5 per minute"]

# =============================
# Funções de Lógica do Jogo
# =============================
def calcular_jogada_computador(ultimo_jogador):
    """Calcula a jogada do computador utilizando uma estratégia adaptativa."""
    app.logger.info(f"Calculando jogada do computador. Última jogada do jogador: {ultimo_jogador}")
    
    # Se não houver histórico ou última jogada inválida, joga aleatório
    if ultimo_jogador not in [0, 1, 2] or len(historico_jogadas) < 3:
        jogada = random.choice([0, 1, 2])
        app.logger.info(f"Jogada aleatória inicial: {ITENS[jogada]}")
        return jogada

    # Análise de padrões do jogador
    padrao_jogador = {}
    for i in range(len(historico_jogadas) - 1):
        atual = historico_jogadas[i]
        proxima = historico_jogadas[i + 1]
        if atual not in padrao_jogador:
            padrao_jogador[atual] = {0: 0, 1: 0, 2: 0}
        padrao_jogador[atual][proxima] += 1

    # Estratégia principal
    estrategia = random.random()
    
    if estrategia < 0.4:  # 40% chance de contra-atacar padrão
        if ultimo_jogador in padrao_jogador:
            provavel_proxima = max(padrao_jogador[ultimo_jogador].items(), key=lambda x: x[1])[0]
            jogada = JOGADA_QUE_VENCE[provavel_proxima]
            app.logger.info(f"Contra-ataque baseado em padrão: {ITENS[jogada]}")
            return jogada
            
    elif estrategia < 0.7:  # 30% chance de jogada que vence a última
        jogada = JOGADA_QUE_VENCE[ultimo_jogador]
        app.logger.info(f"Jogada para vencer última: {ITENS[jogada]}")
        return jogada
        
    # 30% chance de jogada aleatória
    jogada = random.choice([0, 1, 2])
    app.logger.info(f"Jogada aleatória: {ITENS[jogada]}")
    return jogada

def determinar_vencedor(jogada_jogador, jogada_computador):
    """
    Determina o vencedor do jogo baseado nas jogadas.
    1 = Pedra
    2 = Papel 
    3 = Tesoura
    """
    if jogada_jogador == jogada_computador:
        return "Empate"
    
    if (jogada_jogador == 1 and jogada_computador == 3) or \
       (jogada_jogador == 2 and jogada_computador == 1) or \
       (jogada_jogador == 3 and jogada_computador == 2):
        return "Vitória do jogador"
    
    return "Vitória do computador"

def determinar_resultado(jogador, computador):
    """Determina o resultado do jogo com base nas regras definidas."""
    if jogador == computador:
        return "EMPATE!"
    elif REGRAS_VITORIA[jogador] == computador:
        vitorias_jogador.inc()
        return "O JOGADOR GANHOU!"
    else:
        return "O COMPUTADOR GANHOU!"

def validar_jogada(jogada, ip_jogador):
    """
    Valida a jogada do jogador e controla limites de acesso.
    
    Args:
        jogada: A jogada do jogador (deve ser um inteiro entre 0 e 2)
        ip_jogador: O IP do jogador para controle de acesso
        
    Returns:
        tuple: (bool, str) indicando se a jogada é válida e mensagem de erro se houver
    """
    agora = time.time()
    
    # Verifica se o IP está bloqueado
    if ip_jogador in bloqueios and agora < bloqueios[ip_jogador]:
        tempo_restante = int(bloqueios[ip_jogador] - agora)
        return False, f"Acesso bloqueado por {tempo_restante} segundos devido a múltiplas tentativas inválidas"
    
    # Verifica o intervalo entre jogadas
    if ip_jogador in ultimo_acesso:
        tempo_desde_ultima = agora - ultimo_acesso[ip_jogador]
        if tempo_desde_ultima < INTERVALO_MIN_JOGADAS:
            return False, f"Aguarde {INTERVALO_MIN_JOGADAS - tempo_desde_ultima:.1f} segundos antes de jogar novamente"
    
    # Valida o tipo e valor da jogada
    if not isinstance(jogada, (int, float)):
        _incrementar_tentativas_invalidas(ip_jogador)
        return False, "A jogada deve ser um número"
    
    jogada = int(jogada)
    if jogada not in [0, 1, 2]:
        _incrementar_tentativas_invalidas(ip_jogador)
        return False, "Jogada inválida. Use 0 para Pedra, 1 para Papel ou 2 para Tesoura"
    
    # Atualiza o último acesso
    ultimo_acesso[ip_jogador] = agora
    
    # Limpa tentativas inválidas se a jogada for válida
    if ip_jogador in tentativas_invalidas:
        del tentativas_invalidas[ip_jogador]
    
    return True, ""

def _incrementar_tentativas_invalidas(ip_jogador):
    """
    Incrementa o contador de tentativas inválidas e bloqueia o IP se necessário.
    
    Args:
        ip_jogador: O IP do jogador
    """
    tentativas_invalidas[ip_jogador] = tentativas_invalidas.get(ip_jogador, 0) + 1
    
    if tentativas_invalidas[ip_jogador] >= MAX_TENTATIVAS_INVALIDAS:
        bloqueios[ip_jogador] = time.time() + TEMPO_BLOQUEIO
        del tentativas_invalidas[ip_jogador]

# =============================
# Segurança de URL
# =============================
def is_safe_url(target):
    """Garante que o redirecionamento ocorra apenas para o mesmo domínio."""
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc

# =============================
# Endpoints da aplicação
# =============================
@app.route('/')
def index():
    """Renderiza a página principal do jogo."""
    app.logger.info("Página inicial acessada.")
    return render_template('index.html')

@app.before_request
def before_request():
    """Validações de segurança antes de cada requisição."""
    # Verificar se é HTTPS em produção
    if not app.debug and not request.is_secure:
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

    # Validar headers
    if request.method == 'POST':
        content_type = request.headers.get('Content-Type', '')
        if not content_type.startswith('application/json'):
            return jsonify({"error": "Content-Type deve ser application/json"}), 400

    # Validar origem para requisições CORS
    if request.method == 'OPTIONS':
        headers = request.headers.get('Access-Control-Request-Headers', '')
        if 'content-type' not in headers.lower():
            return jsonify({"error": "Headers inválidos"}), 400

@app.after_request
def after_request(response):
    """Adiciona headers de segurança em cada resposta."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

def sanitize_input(data):
    """Sanitiza dados de entrada para prevenir injeções."""
    if isinstance(data, str):
        # Remove caracteres potencialmente perigosos
        return re.sub(r'[<>&;]', '', data)
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(x) for x in data]
    return data

@app.route('/jogar', methods=['POST'])
def jogar():
    inicio = time.time()
    ip_cliente = request.remote_addr
    app.logger.info(f"Nova jogada recebida do IP: {ip_cliente}")

    try:
        dados = request.get_json()
        if not dados:
            app.logger.warning(f"Dados inválidos recebidos do IP {ip_cliente}")
            return jsonify({'error': 'Dados inválidos'}), 400

        if 'jogador' not in dados:
            app.logger.warning(f"Campo 'jogador' ausente na requisição do IP {ip_cliente}")
            return jsonify({'error': 'Campo jogador é obrigatório'}), 400

        jogada_jogador = dados['jogador']
        ultimo_jogador = dados.get('ultimo_jogador')

        # Validar a jogada
        valido, mensagem_erro = validar_jogada(jogada_jogador, ip_cliente)
        if not valido:
            return jsonify({'error': mensagem_erro}), 400

        # Calcular jogada do computador usando a função calcular_jogada_computador
        jogada_comp = calcular_jogada_computador(ultimo_jogador)
        app.logger.info(f"Computador escolheu: {ITENS[jogada_comp]}")

        # Determinar resultado
        resultado = determinar_resultado(jogada_jogador, jogada_comp)
        
        jogadas_counter.inc()

        # Atualizar histórico
        historico_jogadas.append(jogada_jogador)
        if len(historico_jogadas) > MAX_HISTORICO:
            historico_jogadas.pop(0)

        tempo_processamento = time.time() - inicio
        app.logger.info(f"Jogada processada em {tempo_processamento:.3f}s - Resultado: {resultado}")

        return jsonify({
            'resultado': resultado,
            'jogada_computador': ITENS[jogada_comp]
        })

    except Exception as e:
        app.logger.error(f"Erro ao processar jogada do IP {ip_cliente}: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/static/sounds/<path:filename>')
def serve_sounds(filename):
    """Serve arquivos de som com cache."""
    app.logger.info(f"Requisição de áudio: {filename} de {request.remote_addr}")
    if ".." in filename or filename.startswith("/"):
        app.logger.warning(f"Tentativa de acesso inválido a arquivo: {filename} de {request.remote_addr}")
        abort(400, description="Acesso inválido.")
    sound_folder = os.path.join(app.static_folder, 'sounds')
    arquivo_completo = os.path.join(sound_folder, filename)
    app.logger.info(f"Buscando arquivo de som em: {arquivo_completo}")
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

@app.route('/ping')
def ping():
    """Endpoint para health check"""
    try:
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "server": "running",
            "version": "1.0.0"
        }), 200
    except Exception as e:
        app.logger.error(f"Erro no health check: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno no servidor"
        }), 500

@app.route('/safe-redirect')
def safe_redirect():
    """
    Endpoint de redirecionamento seguro.
    Recebe o parâmetro 'redirect_uri' e valida se é seguro redirecionar para o mesmo domínio.
    """
    redirect_uri = request.args.get('redirect_uri')
    if not redirect_uri or not is_safe_url(redirect_uri):
        abort(400, description="Redirecionamento inseguro detectado.")
    return redirect(redirect_uri)

# =============================
# Manipuladores de erro
# =============================
@app.errorhandler(400)
def error_400(e):
    app.logger.error(f"400 Bad Request: {e}")
    return jsonify({"error": getattr(e, 'description', "Requisição inválida.")}), 400

@app.errorhandler(404)
def error_404(e):
    app.logger.error(f"404 Not Found: {e}")
    return jsonify({"error": "Recurso não encontrado."}), 404

@app.errorhandler(500)
def error_500(e):
    app.logger.exception(f"500 Internal Server Error: {e}")
    return jsonify({"error": "Erro interno no servidor. Tente novamente mais tarde."}), 500

# =============================
# Execução do aplicativo
# =============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    cert_file = "certs/cert.pem"
    key_file = "certs/key.pem"

    # Verifica se os arquivos de certificado existem
    if os.path.exists(cert_file) and os.path.exists(key_file):
        # Executa com SSL
        app.run(host="0.0.0.0", port=port, debug=True, ssl_context=(cert_file, key_file))
    else:
        print("Erro: Certificados SSL não encontrados em:", cert_file, "e", key_file)
        print("Por favor, verifique se os arquivos existem no diretório correto.")
        exit(1)
