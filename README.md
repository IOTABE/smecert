# Gerenciador de Eventos - Aplicativo Web Completo

Este é um aplicativo web completo para gerenciamento de eventos, controle de presença e emissão de certificados, desenvolvido conforme solicitado.

## Visão Geral

O sistema permite que administradores/organizadores gerenciem eventos e participantes, registrem frequência, configurem e emitam certificados. Os participantes podem se registrar, visualizar eventos, marcar presença via QR Code e acessar seus certificados.

## Funcionalidades Principais

*   **Módulo Administrador/Organizador:**
    *   CRUD de Eventos (Nome, descrição, datas, carga horária, local, palestrantes).
    *   CRUD de Participantes (Cadastro manual, importação CSV - *implementação futura*).
    *   Registro e Visualização de Frequência (Manual, por QR Code).
    *   Geração de Relatórios de Frequência (*implementação futura*).
    *   Configuração de Modelo de Certificado (*via código no backend*).
    *   Geração Automática/Manual de Certificados.
    *   Validação de Certificados (QR Code/Código Único).
    *   Dashboards e Relatórios (*implementação futura*).
*   **Módulo Participante:**
    *   Registro e Login.
    *   Visualização de Eventos.
    *   Registro de Presença (Check-in/Check-out via QR Code com Geolocalização opcional).
    *   Acompanhamento de Frequência e Carga Horária.
    *   Acesso e Download de Certificados (PDF).
*   **Certificados:**
    *   Carga horária total do participante.
    *   Verso com detalhamento dos eventos frequentados e suas cargas horárias.

## Tecnologias Utilizadas

*   **Backend:** Python, Django, Django REST Framework, PostgreSQL, ReportLab (PDF), qrcode, djangorestframework-simplejwt (JWT).
*   **Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios, html5-qrcode.
*   **Banco de Dados:** PostgreSQL.

## Estrutura do Projeto

```
event_manager_app/
├── backend/             # Projeto Django (API)
│   ├── event_manager/   # Configurações Django
│   ├── api/             # App da API (models, views, serializers, urls, utils)
│   ├── venv/            # Ambiente virtual Python
│   ├── manage.py
│   └── requirements.txt
├── frontend/            # Projeto React (UI)
│   ├── public/
│   ├── src/             # Código fonte React
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── routes.js
│   ├── node_modules/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .gitignore
└── README.md            # Este arquivo
```
(Consulte `/home/ubuntu/project_structure_details.md` para detalhes completos da estrutura inicial planejada).

## Pré-requisitos

*   Python 3.10+
*   Node.js 18.x+ e npm/yarn
*   PostgreSQL Server

## Configuração e Execução

Siga os passos abaixo para configurar e executar o projeto localmente.

### 1. Backend (Django API)

```bash
# 1. Navegue até a pasta backend
cd event_manager_app/backend

# 2. Crie e ative um ambiente virtual Python
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 3. Instale as dependências Python
pip install -r requirements.txt

# 4. Configure o Banco de Dados PostgreSQL
#    - Certifique-se que o PostgreSQL está instalado e rodando.
#    - Crie um banco de dados e um usuário para a aplicação.
#      Exemplo (pode precisar de sudo ou ser feito via pgAdmin):
#      CREATE DATABASE event_manager_db;
#      CREATE USER event_manager_user WITH PASSWORD 'password';
#      GRANT ALL PRIVILEGES ON DATABASE event_manager_db TO event_manager_user;

# 5. Configure as Variáveis de Ambiente (Opcional - Padrões definidos em settings.py)
#    Crie um arquivo .env na pasta backend/ (adicione .env ao .gitignore!)
#    Exemplo .env:
#    DJANGO_SECRET_KEY=\'sua_chave_secreta_super_segura\'
#    DB_NAME=\'event_manager_db\'
#    DB_USER=\'event_manager_user\'
#    DB_PASSWORD=\'password\'
#    DB_HOST=\'localhost\' # ou o host do seu DB
#    DB_PORT=\'5432\'
#    DJANGO_DEBUG=\'True\' # Mude para False em produção
#    FRONTEND_VALIDATION_URL=\'http://localhost:5173/validate-certificate\' # URL base do frontend para validação no QR Code

# 6. Aplique as migrações do banco de dados
python manage.py makemigrations api
python manage.py migrate

# 7. Crie um superusuário (administrador) para acessar o Django Admin (opcional)
python manage.py createsuperuser

# 8. Inicie o servidor de desenvolvimento do backend
python manage.py runserver
# A API estará disponível em http://localhost:8000/api/
```

### 2. Frontend (React App)
 
```bash
# 1. Navegue até a pasta frontend (em um novo terminal)
cd event_manager_app/frontend

# 2. Instale as dependências Node.js
npm install
# ou: yarn install

# 3. Configure as Variáveis de Ambiente (Opcional)
#    Crie um arquivo .env na pasta frontend/
#    Exemplo .env:
#    REACT_APP_API_URL=\'http://localhost:8000/api\' # URL base da API backend

# 4. Inicie o servidor de desenvolvimento do frontend
npm run dev
# ou: yarn dev

# A aplicação estará disponível em http://localhost:5173 (ou outra porta indicada pelo Vite)
```

### 3. Acessando a Aplicação

*   Abra seu navegador e acesse `http://localhost:5173` (ou a porta informada pelo Vite).
*   Registre uma nova conta de participante.
*   Use o Django Admin (`http://localhost:8000/admin/`) com o superusuário criado para:
    *   Mudar o papel (`role`) do seu usuário para `admin` (no modelo CustomUser).
    *   Criar eventos de teste.
*   Faça login como admin ou participante para acessar as respectivas áreas.

## Detalhes Adicionais

*   **Geração de Certificados:** A geração é feita no backend via API (`/api/certificates/generate/` para admin, `/api/certificates/{id}/download_pdf/` para download). O layout é definido em `backend/api/utils.py` usando ReportLab.
*   **QR Code:**
    *   Geração: O QR Code no certificado PDF contém a URL de validação pública do frontend.
    *   Leitura (Check-in): A página de check-in do participante usa `html5-qrcode` para ler o QR Code. A lógica de validação do conteúdo do QR Code no backend (`/api/attendances/check-in/`) é um *placeholder* e precisa ser implementada (ex: gerar QR Codes específicos por evento/sessão com tokens).
*   **Segurança:**
    *   Autenticação: JWT (SimpleJWT) com tokens de acesso e atualização.
    *   Autorização: Permissões baseadas em papéis (Admin, Participante) implementadas no backend.
    *   CORS: Configurado no backend para permitir requisições do frontend (ajustar `CORS_ALLOWED_ORIGINS` em produção).
    *   Proteções Básicas: Django oferece proteção contra CSRF (verificar configuração para API), XSS (templates) e SQL Injection (ORM). Validação de entrada é feita nos serializers.

## Próximos Passos / Melhorias

*   Implementar funcionalidades marcadas como (*implementação futura*): Importação CSV, Relatórios, Dashboards.
*   Refinar a lógica de validação do QR Code para check-in.
*   Implementar componentes de UI mais elaborados (Tabelas com paginação/filtros, formulários com melhor validação, etc.).
*   Adicionar testes automatizados (backend e frontend).
*   Melhorar o tratamento de erros e feedback ao usuário.
*   Configurar o envio de emails (confirmação de registro, etc.).
*   Preparar para deploy em produção (configurações de DEBUG, ALLOWED_HOSTS, HTTPS, WSGI/ASGI server, servir arquivos estáticos).


