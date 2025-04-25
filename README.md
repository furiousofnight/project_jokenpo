# JOKENPÔ Web - Pedra, Papel ou Tesoura!

Bem-vindo ao **Jokenpô Web**, um projeto divertido de Pedra, Papel e Tesoura feito com **Python**, **Flask**, **HTML**, **CSS** e **JavaScript**, inspirado em um exercício de lógica e evoluído para se tornar um jogo responsivo hospedado na web!

---

## 🎉 Destaques do Projeto

- Interface amigável e responsiva para web.
- Jogabilidade intuitiva com opções de Pedra, Papel e Tesoura.
- Resultados exibidos dinamicamente com feedback visual e sonoro.
- Deploy funcional com **Docker** e **Fly.io**.
- Código organizado, modularizado e de fácil manutenção.

---

## 🚀 Tecnologias Utilizadas

### Backend:
- **Python 3.13**
- **Flask 3.1.0**
- **gunicorn** para produção

### Frontend:
- **HTML5**
- **CSS3**
- **JavaScript**

### Outros:
- **Docker** (ambiente portátil)
- **Fly.io** (hospedagem cloud)

---

## 🌎 Como Executar Localmente

### 1. Clonando o projeto
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Ambiente virtual e dependências
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Executando localmente
```bash
python app.py
```
Acesse em `http://127.0.0.1:5000`

---

## 🚚 Rodando com Docker

```bash
docker build -t jokenpo-app .
docker run -p 8080:8080 jokenpo-app
```

---

## 🌐 Deploy com Fly.io

```bash
flyctl launch  # configurar nome do app e porta 8080
flyctl deploy
```
Acesse: https://seu-app.fly.dev

---

## 🏠 Estrutura do Projeto

```
.
├── app.py
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   ├── images/
│   │   ├── pedra.png
│   │   ├── papel.png
│   │   └── tesoura.png
│   └── sounds/
│       ├── click.mp3
│       ├── win.mp3
│       ├── lose.mp3
│       └── draw.mp3
├── Dockerfile
├── requirements.txt
└── fly.toml
```

---

## 🙌 Contribuições

Sugestões, melhorias e feedback são bem-vindos! Crie uma issue ou envie um pull request.

---

## 📖 Licença

Este projeto está sob a Licença MIT.

---

## 😎 Autor

Desenvolvido por **FuriousOfNight** com o suporte da assistente **Queen**.

Para mais projetos, visite meu TikTok ou acompanhe as atualizações por aqui!

---

**✨ Divirta-se jogando e explorando o código!**

