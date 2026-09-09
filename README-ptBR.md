<![CDATA[<div align="center">

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
- [Demonstração](#-demonstração)
- [Início Rápido](#-início-rápido)
- [Instalação](#-instalação)
- [Docker](#-docker)
- [Deploy em Produção](#-deploy-em-produção)
- [Configuração](#-configuração)
- [Arquitetura](#-arquitetura)
- [Referência da API](#-referência-da-api)
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

## 🎬 Demonstração

> **Demo ao Vivo:** [darkcall.example.com](https://darkcall.example.com)

![Screenshot do DarkCall](https://via.placeholder.com/800x450/050b14/247cff?text=DarkCall+Screenshot)

---

## 🚀 Início Rápido

### Opção 1: Executar Diretamente

```bash
# Clone o repositório
git clone https://github.com/seuusuario/DarkCall.git
cd DarkCall

# Execute o script de configuração
chmod +x run.sh
./run.sh
```

Abra http://localhost:8765 no seu navegador.

### Opção 2: Configuração Manual

```bash
# Crie o ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python server.py
```

---

## 📦 Instalação

### Pré-requisitos

- Python 3.10 ou superior
- pip (gerenciador de pacotes Python)
- Git

### Passo a Passo

#### 1. Clone o Repositório

```bash
git clone https://github.com/seuusuario/DarkCall.git
cd DarkCall
```

#### 2. Crie o Ambiente Virtual

```bash
python3 -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 3. Instale as Dependências

```bash
pip install -r requirements.txt
```

#### 4. Inicie o Servidor

```bash
python server.py
```

#### 5. Abra o Navegador

Acesse: **http://localhost:8765**

---

## 🐳 Docker

### Usando Docker Compose (Recomendado)

```bash
# Build e execute
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

### Usando Docker Apenas

```bash
# Build da imagem
docker build -t darkcall .

# Executar o container
docker run -d -p 8765:8765 --name darkcall darkcall
```

---

## 🌐 Deploy em Produção

### Usando Nginx + Let's Encrypt

#### 1. Configuração do Servidor (Ubuntu 22.04)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar pacotes necessários
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

#### 2. Deploy da Aplicação

```bash
# Clonar em /opt
cd /opt
sudo git clone https://github.com/seuusuario/DarkCall.git
cd DarkCall

# Configurar
sudo python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Criar Serviço Systemd

```bash
sudo nano /etc/systemd/system/darkcall.service
```

Adicione este conteúdo:

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
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilite e inicie:

```bash
sudo systemctl daemon-reload
sudo systemctl enable darkcall
sudo systemctl start darkcall
```

#### 4. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/darkcall
```

Adicione este conteúdo:

```nginx
server {
    listen 80;
    server_nameseudominio.com www.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

Habilite o site:

```bash
sudo ln -s /etc/nginx/sites-available/darkcall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Habilitar HTTPS com Certbot

```bash
sudo certbot --nginx -dseudominio.com -d wwwseudominio.com
```

#### 6. Configurar Renovação Automática

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `8765` | Porta do servidor |
| `HOST` | `0.0.0.0` | Host do servidor |
| `LOG_LEVEL` | `info` | Nível de log |

### Configuração Personalizada

Edite `server.py` para alterar:

```python
PORT = 8765  # Altere para a porta desejada
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Navegador 1 │  │  Navegador 2 │  │  Navegador 3 │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └────────┬────────┴────────┬────────┘               │
│                  │                 │                        │
└──────────────────┼─────────────────┼────────────────────────┘
                   │                 │
            ┌──────▼──────┐   ┌──────▼──────┐
            │  WebSocket  │   │    WebRTC   │
            │(Sinalização)│   │  (Mídia P2P)│
            └──────┬──────┘   └──────┬──────┘
                   │                 │
            ┌──────▼──────────────────▼──────┐
            │        Servidor DarkCall        │
            │   - Gerenciamento de Salas      │
            │   - Sinalização WebSocket       │
            │   - Servindo Arquivos Estáticos │
            └────────────────────────────────┘
```

### Como Funciona

1. **WebSocket** gerencia sinalização (entrar/sair de salas, mensagens de chat)
2. **WebRTC** gerencia áudio/vídeo peer-to-peer (sem carga no servidor)
3. **Servidor** apenas retransmite sinais, nunca vê seu vídeo/áudio
4. **Servidores STUN** ajudam peers a se encontrarem através de NATs

---

## 📡 Referência da API

### Mensagens WebSocket

#### Entrar na Sala
```json
{
    "type": "join_room",
    "room": "1234",
    "name": "João",
    "avatar": "data:image/png;base64,..."
}
```

#### Mensagem de Chat
```json
{
    "type": "chat_message",
    "text": "Olá pessoal!"
}
```

#### Sinalização WebRTC
```json
{
    "type": "offer",
    "target": "peer_uid",
    "sdp": { ... }
}
```

---

## 🤝 Contribuindo

Aceitamos contribuições! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

### Início Rápido para Contribuidores

```bash
# Faça fork do repositório
# Clone seu fork
git clone https://github.com/seuusuario/DarkCall.git

# Crie uma branch de feature
git checkout -b feature/recurso-incrivel

# Faça suas alterações
# Commit
git commit -m "Adicionar recurso incrível"

# Push
git push origin feature/recurso-incrivel

# Abra um Pull Request
```

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno para Python
- [WebRTC](https://webrtc.org/) - Comunicação em tempo real
- [Uvicorn](https://www.uvicorn.org/) - Servidor ASGI ultrarrápido

---

<div align="center">

**Feito com ❤️ pela Equipe DarkCall**

[Reportar Bug](https://github.com/seuusuario/DarkCall/issues) · [Solicitar Recurso](https://github.com/seuusuario/DarkCall/issues)

</div>
]]>