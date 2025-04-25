# Imagem base Python
FROM python:3.13-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências e instala as dependências do projeto
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código para o container
COPY . .

# Define a variável de ambiente para a porta
ENV PORT 8080

# Expõe a porta do aplicativo
EXPOSE 8080

# Substitui o comando para rodar o servidor usando gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]