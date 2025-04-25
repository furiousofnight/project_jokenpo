from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import random

# Configuração inicial do Flask
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # Opção para desenvolvimento. Pode ser removida em produção.

# Constantes do jogo
ITENS = ["pedra", "papel", "tesoura"]
REGRAS = {
    0: 1,  # Pedra → Papel (papel vence pedra)
    1: 2,  # Papel → Tesoura (tesoura vence papel)
    2: 0   # Tesoura → Pedra (pedra vence tesoura)
}


def jogada_computador(ultimo_jogador):
    """
    Calcula a jogada do computador com base na última jogada do jogador.
    """
    if ultimo_jogador not in [0, 1, 2]:
        app.logger.info("Nenhuma última jogada detectada. Escolha aleatória na primeira rodada.")
        return random.choice([0, 1, 2])  # Escolha aleatória no primeiro turno ou sem dados válidos.

    melhor_jogada = REGRAS[ultimo_jogador]  # Melhor jogada para vencer o jogador.
    pesos = [0.3, 0.3, 0.3]  # Probabilidades padrão para escolhas.
    pesos[melhor_jogada] = 0.6  # Maior peso na jogada vencedora.

    app.logger.info(f"Jogada sugerida pelo computador para vencer: {ITENS[melhor_jogada]}")
    return random.choices([0, 1, 2], weights=pesos, k=1)[0]


def determinar_resultado(jogador, computador):
    """
    Determina o resultado do jogo com base nas jogadas do jogador e do computador.
    """
    if jogador == computador:
        return "EMPATE!"
    elif (computador == 0 and jogador == 2) or \
         (computador == 1 and jogador == 0) or \
         (computador == 2 and jogador == 1):
        return "O COMPUTADOR GANHOU!"
    else:
        return "O JOGADOR GANHOU!"


@app.route('/')
def index():
    """
    Renderiza a página principal do jogo.
    """
    return render_template('index.html')


@app.route('/play', methods=['POST'])
def play():
    """
    Processa a jogada do Jokenpô recebida e retorna o resultado.
    """
    try:
        data = request.get_json()
        if not data or 'jogador' not in data:
            raise ValueError("Dados inválidos. O campo 'jogador' é obrigatório.")

        jogador = int(data['jogador'])
        if jogador not in [0, 1, 2]:
            raise ValueError("Jogada inválida. Escolha entre 0 (pedra), 1 (papel) ou 2 (tesoura).")

        ultimo_jogador = data.get('ultimo_jogador')  # Tenta recuperar a última jogada.
        try:
            if ultimo_jogador is not None:
                ultimo_jogador = int(ultimo_jogador)
                if ultimo_jogador not in [0, 1, 2]:
                    raise ValueError
        except ValueError:
            ultimo_jogador = None
            app.logger.warning("Valor inválido para última jogada. Usando 'None' como fallback.")

        computador = jogada_computador(ultimo_jogador)
        resultado = determinar_resultado(jogador, computador)

        app.logger.info(f"Jogador escolheu: {ITENS[jogador]}, Computador escolheu: {ITENS[computador]}. Resultado: {resultado}")

        return jsonify({
            "jogada_computador": ITENS[computador],
            "resultado": resultado
        }), 200

    except ValueError as ve:
        app.logger.error(f"Erro no processamento da jogada: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        app.logger.error(f"Erro interno: {e}")
        return jsonify({"error": "Erro interno no servidor. Tente novamente."}), 500


@app.route('/static/sounds/<path:filename>')
def serve_sounds(filename):
    """
    Rota para servir arquivos de som localmente.
    """
    sound_folder = os.path.join(app.static_folder, 'sounds')
    return send_from_directory(sound_folder, filename)


if __name__ == "__main__":
    # Configuração para rodar com o Flask (servidor local para testes).
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)