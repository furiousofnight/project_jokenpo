# 🎮 JOKENPÔ - Pedra, Papel e Tesoura

[![Status](https://img.shields.io/badge/status-online-brightgreen)](https://furious-jokenpo.fly.dev)
[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![Flask Version](https://img.shields.io/badge/flask-2.0+-lightgrey.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Um jogo clássico de Pedra, Papel e Tesoura desenvolvido com Python/Flask e implantado na plataforma Fly.io. Apresenta uma interface moderna, efeitos sonoros e uma IA desafiadora que aprende com as jogadas do usuário.

🎯LINK PARA TESTE 🎯 https://furious-jokenpo.fly.dev/

- [Características](#-características)
- [Demo](#-demo)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias Utilizadas](#%EF%B8%8F-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Local](#-instalação-local)
- [Deploy](#-deploy)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Como Jogar](#-como-jogar)
- [Segurança](#-segurança)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)
- [Autor](#-autor)
- [Agradecimentos](#-agradecimentos)

## 🌟 Características

- 🎯 Interface moderna e responsiva com animações suaves
- 🎵 Efeitos sonoros e música de fundo personalizáveis
- 🤖 IA adaptativa que aprende com o padrão de jogadas do usuário
- 📊 Sistema completo de pontuação e estatísticas
- 🔒 Implementação segura com proteções contra ataques comuns
- 🌐 Suporte a HTTPS e headers de segurança modernos
- 📱 Design responsivo para todos os dispositivos
- 🔄 Sistema de histórico de partidas em tempo real
- 🌍 Suporte a internacionalização
- ⚡ Cache inteligente para melhor performance

## 🚀 Demo

Experimente agora em: [https://furious-jokenpo.fly.dev](https://furious-jokenpo.fly.dev)

## 📁 Estrutura do Projeto

```plaintext
Project_JOKENPO/
├── app.py                 # Arquivo principal da aplicação Flask
├── static/               # Arquivos estáticos
│   ├── css/
│   │   └── styles.css   # Estilos CSS da aplicação
│   ├── images/          # Imagens e ícones
│   │   └── example.png
│   ├── sounds/          # Efeitos sonoros e música
│   │   ├── click.mp3
│   │   ├── win.mp3
│   │   ├── lose.mp3
│   │   └── outros...
│   └── favicon.ico      # Ícone do site
├── templates/           # Templates HTML
│   └── index.html      # Página principal do jogo
├── Dockerfile          # Configuração do container
├── requirements.txt    # Dependências Python
└── fly.toml           # Configuração do deploy Fly.io
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.10+**: Linguagem principal
- **Flask 2.0+**: Framework web
- **Gunicorn**: Servidor WSGI para produção
- **Flask-Talisman**: Segurança HTTPS/CSP
- **Flask-Limiter**: Rate limiting
- **Flask-Caching**: Sistema de cache
- **Prometheus**: Métricas e monitoramento

### Frontend
- **HTML5**: Estrutura semântica moderna
- **CSS3**: Animações e layout responsivo
- **JavaScript**: Interatividade e efeitos
- **Web Audio API**: Sistema de áudio

### DevOps
- **Docker**: Containerização
- **Fly.io**: Platform as a Service (PaaS)
- **GitHub Actions**: CI/CD (opcional)

## 📋 Pré-requisitos

- Python 3.10 ou superior
- pip (gerenciador de pacotes Python)
- Git
- Navegador web moderno
- Docker (opcional)
- Conta no Fly.io (para deploy)

## 🔧 Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/Project_JOKENPO.git
cd Project_JOKENPO
```

2. Crie e ative um ambiente virtual:
```bash
# Windows
python -m venv venv
venv\\Scripts\\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env com:
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=sua_chave_secreta_aqui
PORT=8080
```

5. Execute a aplicação:
```bash
# Desenvolvimento
flask run

# Produção
gunicorn -w 2 -b 0.0.0.0:8080 app:app
```

### 🐳 Usando Docker

```bash
# Build da imagem
docker build -t jokenpo-app .

# Executar o container
docker run -p 8080:8080 jokenpo-app
```

## 🚀 Deploy

### Deploy no Fly.io

1. Instale o Flyctl:
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

2. Login e Deploy:
```bash
# Login
fly auth login

# Primeiro deploy
fly launch

# Deploys subsequentes
fly deploy
```

3. Configure os secrets:
```bash
fly secrets set SECRET_KEY=sua_chave_secreta_aqui
```

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `FLASK_APP` | Arquivo principal | `app.py` |
| `FLASK_ENV` | Ambiente (development/production) | `production` |
| `SECRET_KEY` | Chave para sessões e CSRF | Requerido |
| `PORT` | Porta do servidor | `8080` |

## 🎮 Como Jogar

1. Acesse o jogo pelo navegador
2. Escolha sua jogada (Pedra, Papel ou Tesoura)
3. Observe a animação da jogada do computador
4. Veja o resultado e suas estatísticas
5. Acompanhe seu histórico de partidas

### 🎵 Controles
- 🔊 Botão de som: Ativa/desativa música
- 🔄 Botão de reinício: Nova partida
- 📊 Painel de estatísticas: Acompanhe seu desempenho

## 🔒 Segurança

- HTTPS forçado em produção
- Headers de segurança via Flask-Talisman
- Rate limiting para prevenção de abusos
- Sanitização de inputs
- Proteção contra CSRF
- CSP (Content Security Policy)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch: `git checkout -b feature/NovaFuncionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/NovaFuncionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**FuriousOfNight**
- 🎥 TikTok: [@furiousofnightgames](https://www.tiktok.com/@furiousofnightgames)
- 🌟 GitHub: [@Furiousofnight](https://github.com/furiousofnight)

## 🙏 Agradecimentos

- Equipe do Flask pelo framework incrível
- Comunidade Python por recursos e suporte
- Fly.io pela excelente plataforma de hosting
- Todos os contribuidores e jogadores

## 📈 Status do Projeto

O projeto está em desenvolvimento ativo. Novas funcionalidades são adicionadas regularmente.

---
⭐️ Se você gostou do projeto, por favor deixe uma estrela no GitHub!

📧 Para questões de segurança, por favor envie um email para [furiousofnightgames@gmail.com]

