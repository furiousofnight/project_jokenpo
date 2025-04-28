# 📦 Imagem base otimizada do Python
FROM python:3.13-slim
# 🌍 Define variáveis de ambiente para evitar a escrita de arquivos de bytecode e garantir saída não bufferizada
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# 🗂️ Configura o diretório de trabalho dentro do container
WORKDIR /app
# 📄 Copia o arquivo de dependências
COPY requirements.txt .
# 🔧 Instala as dependências definidas no requirements.txt, sem cache para manter a imagem enxuta
RUN pip install --no-cache-dir -r requirements.txt
# 👤 Cria um usuário e grupo não-root para rodar a aplicação com segurança
RUN addgroup --system app && adduser --system --ingroup app app
# 📁 Copia todos os arquivos da aplicação para dentro do container
COPY . .
# 🔒 Ajusta a propriedade dos arquivos para o usuário 'app'
RUN chown -R app:app /app
# 👤 Altera para o usuário não-root para maior segurança
USER app
# 🌐 Define a variável de ambiente padrão da porta
ENV PORT=8080
# 📡 Expõe a porta 8080 (usada pelo Gunicorn)
EXPOSE 8080
# 🚀 Comando de inicialização do servidor com Gunicorn,
# definindo a vinculação, número de workers, threads e timeout conforme necessário
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "0", "app:app"]