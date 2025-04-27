# 📦 Imagem base otimizada do Python
FROM python:3.13-slim

# 🌍 Define variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 🗂️ Define o diretório de trabalho dentro do container
WORKDIR /app

# 📄 Copia o arquivo de dependências
COPY requirements.txt .

# 🔧 Instala dependências do projeto
RUN pip install --no-cache-dir -r requirements.txt

# 👤 Cria um usuário e grupo não-root para rodar a aplicação
RUN addgroup --system app && adduser --system --ingroup app app

# 📁 Copia todos os arquivos da aplicação para o container
COPY . .

# 🔒 Muda a propriedade dos arquivos para o usuário 'app'
RUN chown -R app:app /app

# 👤 Muda para o usuário não-root
USER app

# 🌐 Define a variável de ambiente padrão da porta
ENV PORT=8080

# 📡 Expõe a porta usada pelo Gunicorn
EXPOSE 8080

# 🚀 Comando de inicialização do servidor com Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "--log-level", "debug", "app:app"]
