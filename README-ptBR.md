<div align="center">

# 🔥 DarkCall

### Plataforma de Videochamadas e Chat em Tempo Real

[![License: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Compatível-orange.svg)](https://developer.mozilla.org/pt-BR/docs/Web/API/WebSockets_API)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-purple.svg)](https://webrtc.org)

**Conecte. Converse. Compartilhe.**

[![English](https://img.shields.io/badge/English-README-green)](README.md)

</div>

---

## 📋 Sumário

- [Funcionalidades](#-funcionalidades)
- [Início Rápido](#-início-rápido)
- [Instalação](#-instalação)
- [Docker](#-docker)
- [Deploy em Produção](#-deploy-em-produção)
- [Configuração](#-configuração)
- [Arquitetura](#-arquitetura)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🎥 **Videochamadas** | Chamadas de vídeo em HD com WebRTC peer-to-peer |
| 🎙️ **Chamadas de Áudio** | Áudio cristalino com cancelamento de eco |
| 💬 **Chat em Tempo Real** | Mensagens instantâneas durante chamadas |
| 🖥️ **Compartilhamento de Tela** | Compartilhe sua tela com participantes |
| 🔐 **Códigos de Sala** | Códigos simples de 4 dígitos para entrar |
| 👤 **Avatares Personalizados** | Faça upload da sua foto de perfil |
| 📱 **Responsivo** | Funciona em desktop, tablet e celular |
| 🌙 **Modo Escuro** | Suave para os olhos, sempre |
| ⚡ **Sem Cadastro** | Escolha um nome e comece a chamar |
| 🔒 **Seguro** | WebRTC criptografado, pronto para HTTPS |

---

## 🚀 Início Rápido

```bash
# Clone o repositório
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall

# Execute o script de configuração
chmod +x scripts/run.sh
./scripts/run.sh
```

Abra http://localhost:8765 no seu navegador.

### Configuração Manual

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

---

## 📦 Instalação

Veja [docs/INSTALL.md](docs/INSTALL.md) para instruções detalhadas.

### Pré-requisitos

- Python 3.10 ou superior
- pip
- Git

### Instalação Rápida

```bash
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

---

## 🐳 Docker

```bash
# Usando Docker Compose
docker-compose up -d

# Ou build manual
docker build -t darkcall .
docker run -d -p 8765:8765 darkcall
```

---

## 🌐 Deploy em Produção

Veja [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) ou execute o script:

```bash
sudo ./scripts/setup.sh
```

### Deploy Rápido (Ubuntu 22.04)

```bash
# Instalar dependências
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

# Clonar e configurar
cd /opt
sudo git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
sudo python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Criar serviço systemd
sudo nano /etc/systemd/system/darkcall.service
```

```ini
[Unit]
Description=DarkCall Video Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/DarkCall
ExecStart=/opt/DarkCall/venv/bin/python server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable darkcall
sudo systemctl start darkcall
```

### Configuração Nginx

```nginx
server {
    listen 80;
    server_nameseudominio.com;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Habilitar HTTPS

```bash
sudo certbot --nginx -dseudominio.com
```

---

## ⚙️ Configuração

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `8765` | Porta do servidor |
| `HOST` | `0.0.0.0` | Host do servidor |

Edite `server.py` para alterar a porta:

```python
PORT = 8765
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Navegador 1 │  │  Navegador 2 │  │  Navegador 3 │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └────────┬────────┴────────┬────────┘               │
└──────────────────┼─────────────────┼────────────────────────┘
                   │                 │
            ┌──────▼──────┐   ┌──────▼──────┐
            │  WebSocket  │   │    WebRTC   │
            │(Sinalização)│   │  (Mídia P2P)│
            └──────┬──────┘   └──────┬──────┘
                   └────────┬────────┘
            ┌───────────────▼───────────────┐
            │        Servidor DarkCall       │
            │  - Gerenciamento de Salas      │
            │  - Sinalização WebSocket       │
            │  - Servindo Arquivos Estáticos │
            └───────────────────────────────┘
```

**Como funciona:**
1. **WebSocket** gerencia sinalização (entrar/sair de salas, chat)
2. **WebRTC** gerencia áudio/vídeo peer-to-peer
3. **Servidor** apenas retransmite sinais, nunca vê sua mídia
4. **Servidores STUN** ajudam peers a se conectarem

---

## 🤝 Contribuindo

Aceitamos contribuições! Veja [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
# Faça fork e clone
git clone https://github.com/SEU_USUARIO/DarkCall.git

# Crie branch de feature
git checkout -b feature/recurso-incrivel

# Commit e push
git commit -m "Adicionar recurso incrível"
git push origin feature/recurso-incrivel

# Abra Pull Request
```

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja [LICENSE](LICENSE).

---

<div align="center">

**Feito com ❤️ pela Equipe DarkCall**

[Reportar Bug](https://github.com/pedroamaraldossantos11-code/DarkCall/issues) · [Solicitar Recurso](https://github.com/pedroamaraldossantos11-code/DarkCall/issues)

</div>
