# 🕹️ JOKENPÔ Mágico - Pedra, Papel ou Tesoura!

Este é um super jogo interativo de Jokenpô desenvolvido com carinho pelo Furious usando **Python**, **Flask**, **HTML**, **CSS** e **JavaScript**! Um projeto de aprendizado que virou uma experiência divertida! 🌟

---

## 🌟 Funcionalidades:

- Interface responsiva, linda e fluida 📊
- Jogabilidade intuitiva com três opções clássicas: pedra, papel e tesoura
- Sons para vitórias, derrotas e empates
- Placar de melhor de 3 rodadas com histórico de partidas
- Animações e efeitos visuais para uma experiência divertida
- Totalmente hospedado no **Fly.io** com Docker

---

## 🏙️ Tecnologias Utilizadas:

### Backend
- Python 3.13
- Flask 3.1.0
- Gunicorn (para produção)

### Frontend
- HTML5
- CSS3 (com gradientes, sombras e animações)
- JavaScript

### DevOps & Deploy
- Docker
- Fly.io
- Waitress (local)

---

## 🛋️ Como rodar localmente

```bash
# Clone o repositório
$ git clone https://github.com/seu-usuario/seu-repositorio.git
$ cd seu-repositorio

# Crie o ambiente virtual e ative
$ python -m venv venv
$ source venv/bin/activate  # Windows: venv\Scripts\activate

# Instale as dependências
$ pip install -r requirements.txt

# Rode localmente
$ python app.py
```

---

## 🚀 Rodar com Docker
```bash
# Build da imagem
$ docker build -t jokenpo-app .

# Run com porta 8080
$ docker run -p 8080:8080 jokenpo-app
```
Acesse via navegador em: `http://localhost:8080`

---

## 🌐 Deploy no Fly.io
```bash
# Instale o CLI do Fly.io
$ flyctl launch
# Configure nome, região e porta (8080)

# Deploy
$ flyctl deploy
```
Visualize o app em: `https://<nome-do-app>.fly.dev`

---

## 🌟 Estrutura do Projeto
```
Project_JOKENPO/
├── app.py
├── static/
│   ├── css/styles.css
│   ├── js/script.js
│   ├── images/
│   │   ├── pedra.png
│   │   ├── papel.png
│   │   └── tesoura.png
│   └── sounds/
│       ├── win.mp3
│       ├── lose.mp3
│       └── draw.mp3
├── templates/
│   └── index.html
├── Dockerfile
├── fly.toml
└── requirements.txt
```

---

## 🌈 Créditos & Contato
Criado por: **FURIOUSOFNIGHT**   
TikTok: [@furiousofnight](https://tiktok.com/@furiousofnight)

---

## 📄 Licença
MIT License. Use, melhore e compartilhe ✨

