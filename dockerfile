# 📦 Imagem base otimizada do Python
FROM python:3.13-slim

# 🌍 Define variáveis de ambiente (evita mensagens de aviso do pip e garante saída não bufferizada)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 🗂️ Define o diretório de trabalho dentro do container
WORKDIR /app

# 📄 Copia o arquivo de dependências
COPY requirements.txt .

# 🔧 Instala dependências do projeto
# (Opcional: Instalar como root para ter permissões globais, antes de criar o usuário)
RUN pip install --no-cache-dir -r requirements.txt

# 👤 Cria um usuário e grupo não-root para rodar a aplicação
RUN addgroup --system app && adduser --system --ingroup app app

# 📁 Copia todos os arquivos da aplicação para o container
# (Certifique-se de ter um .dockerignore para não copiar arquivos desnecessários)
COPY . .

# 🔒 Muda a propriedade dos arquivos para o usuário 'app'
RUN chown -R app:app /app

# 👤 Muda para o usuário não-root
USER app

# 🌐 Define a variável de ambiente padrão da porta (já definida pelo usuário 'app')
ENV PORT=8080

# 📡 Expõe a porta usada pelo Gunicorn
EXPOSE 8080

# 🚀 Comando de inicialização do servidor com Gunicorn (executado como usuário 'app')
# (Considere adicionar -w <num_workers>, ex: -w 4, para melhor performance)
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
