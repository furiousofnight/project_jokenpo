# 🎮 JOKENPÔ Mágico - Pedra, Papel e Tesoura

Este é um projeto web interativo do clássico jogo **Jokenpô** (Pedra, Papel e Tesoura), desenvolvido com Python, Flask, HTML, CSS e JavaScript. Com design responsivo, animações e elementos visuais atrativos, essa aplicação visa entreter e ensinar conceitos de lógica, condições e manipulação de dados.

---

## 🚀 Funcionalidades

- 🎨 Interface responsiva e moderna
- 🧠 IA simples para jogar contra o computador
- 🧾 Registro de histórico de partidas
- 🥇 Sistema de placar acumulado
- 🔁 Reinício rápido de jogo
- 🔊 Sons dinâmicos para ações (opcional)
- 🌎 Hospedagem pronta para o Fly.io

---

## 📁 Estrutura do Projeto

```
├Project_JOKENPO/
├── app.py
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── images/
│   │   └── example.png
│   ├── sounds/
│   │   ├── click.mp3
│   │   ├── win.mp3
│   │   ├── lose.mp3
│   │   └── demais audios
│   └── favicon.ico
├── templates/
│   └── index.html
├── Dockerfile
├── requirements.txt
└── fly.toml


---

## ⚙️ Tecnologias Utilizadas

- **Python 3.13**
- **Flask 3.1.0**
- **HTML5 / CSS3 / JavaScript**
- **Docker**
- **Gunicorn**
- **Fly.io** para deploy

---

## 💻 Como Executar Localmente

### Clonando o repositório
```bash
git clone https://github.com/SEU_USUARIO/Project_JOKENPO.git
cd Project_JOKENPO
```

### Com Python (recomendado para desenvolvimento)
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Com Docker (pronto para produção)
```bash
docker build -t jokenpo-app .
docker run -p 8080:8080 jokenpo-app
```
Acesse em: [http://localhost:8080](http://localhost:8080)

### Com Fly.io (deploy online)
```bash
flyctl launch       # Configure o app
flyctl deploy       # Publica na nuvem
```

---

## 🙌 Autor e Créditos

Projeto desenvolvido por **FuriousOfNight** 🌙

🎥 Veja mais no meu TikTok: [tiktok.com/@furiousofnight](https://www.tiktok.com/@furiousofnight)


---

## 📜 Licença

Este projeto está licenciado sob a Licença MIT. Sinta-se à vontade para estudar, modificar e compartilhar.

---

## 🌟 Screenshot

![Preview do Jogo](static/images/preview.png)

---

**Divirta-se jogando e aprendendo!** ✊🖐✌️

