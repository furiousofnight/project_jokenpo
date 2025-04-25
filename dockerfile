# 📦 Imagem base otimizada do Python
FROM python:3.13-slim

# 🗂️ Define o diretório de trabalho dentro do container
WORKDIR /app

# 📄 Copia o arquivo de dependências
COPY requirements.txt .

# 🔧 Instala dependências do projeto
RUN pip install --no-cache-dir -r requirements.txt

# 📁 Copia todos os arquivos da aplicação para o container
COPY . .

# 🌐 Define a variável de ambiente padrão da porta
ENV PORT=8080

# 📡 Expõe a porta usada pelo Gunicorn
EXPOSE 8080

# 🚀 Comando de inicialização do servidor com Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
