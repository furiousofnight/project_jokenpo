# Usar uma imagem base do Python mais recente e segura
FROM python:3.13.3-slim-bookworm

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FLASK_ENV=production \
    FLASK_APP=app.py \
    PORT=8080

# Criar um diretório para o aplicativo
WORKDIR /app

# Criar um usuário não root para executar o aplicativo
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /app/static/sounds /app/static/images /app/certs \
    && chown -R appuser:appuser /app

# Copiar apenas o arquivo de requisitos primeiro
COPY --chown=appuser:appuser requirements.txt .

# Instalar as dependências com flags de segurança e curl para healthcheck
RUN apt-get update && apt-get install -y curl && \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache/pip/* && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar o restante do código do aplicativo
COPY --chown=appuser:appuser . .

# Criar diretórios necessários e definir permissões corretas
RUN mkdir -p /app/static/sounds /app/static/images /app/certs \
    && chmod -R 755 /app \
    && chmod -R 644 /app/static/* \
    && find /app -type d -exec chmod 755 {} \; \
    && chmod 600 /app/certs/* || true \
    && chown -R appuser:appuser /app

# Mudar para o usuário não privilegiado
USER appuser

# Expor a porta que o aplicativo irá escutar
EXPOSE ${PORT}

# Configurar healthcheck mais tolerante
HEALTHCHECK --interval=45s --timeout=45s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:${PORT}/ping || exit 1

# Comando para iniciar o aplicativo com Gunicorn com configurações de segurança
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--worker-class", "sync", "--timeout", "60", "--keep-alive", "5", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
