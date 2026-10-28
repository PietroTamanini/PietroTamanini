# Pietro Ramos Tamanini

```console
pietro@dev:~$ whoami
Junior Full Stack Developer

pietro@dev:~$ focus --areas
Frontend · Backend · APIs · Relational Databases · Testing · Deployment
```

I build web applications from the user interface to server-side logic. My work combines **HTML, CSS, JavaScript, Python, PHP, relational databases, API integrations, and deployment workflows**. I care about readable code, clear separation of responsibilities, secure defaults, and software that solves real operational problems.

[Portfolio](https://pietro.tamanini.dev.br/) · [LinkedIn](https://www.linkedin.com/in/pietrotamanini/) · [Email](mailto:pietro@tamanini.dev.br)

## `principles/`

**01** — Readability over cleverness.

**02** — Keep the interface, business logic, and data responsibilities clear.

**03** — Use tests and logs to make failures easier to understand.

**04** — Treat deployment and maintenance as part of the product.

## `projects/`

```console
pietro@dev:~/projects$ ls -la
```

### [JusTraduz](https://github.com/TeamGHCP/JusTraduz) · `team project`

A collaborative legal-tech platform for document analysis, case management, communication, public case lookup, and payment workflows. It brings together user-facing features and backend services for different user roles.

`PHP` `MySQL` `JavaScript` `HTML/CSS` `Docker` `APIs` `Asaas`

**My contribution**

Backend development, integrations, relational data modeling, security, infrastructure, and product improvements as part of the team.

**Areas of work**

- Authentication, role-based permissions, and administrative workflows.
- Document workflows and private file handling.
- Payment integration and related application flows.
- Docker-based development, testing, and operational documentation.

```text
User interface
  └─> PHP application
       ├─> MySQL database
       ├─> payment integration
       └─> document workflows
```

[1st place — SENAI/SC Software Learning Project presentation ↗](https://www.linkedin.com/posts/guilherme-arthur-silveira_enfim-3-semestre-finalizado-hoje-foi-o-ugcPost-7480422148482916352-v_en/)

### [Zokyo](https://github.com/PietroTamanini/Zokyo) · `individual project`

A full-stack CRM/ERP for technical assistance and repair businesses. It brings service orders, customers, equipment, inventory, suppliers, finance, reports, dashboards, and customer workflows together in one web application.

`Python` `Flask` `SQLAlchemy` `MariaDB` `HTML/CSS` `JavaScript` `Jinja2` `Docker`

**Application architecture**

- Flask blueprints for route organization and a service layer for business logic.
- SQLAlchemy models, relational database design, and database migrations.
- Server-rendered templates with JavaScript for interactive interface behavior.
- Configuration by environment to support different deployment setups.

**Testing and delivery**

- Pytest and Playwright for automated checks and critical user flows.
- Ruff for Python linting.
- Gunicorn, Nginx, Docker Compose, and health checks for deployment and operation.

```text
app/
  ├─ routes/       # HTTP routes and page endpoints
  ├─ services/     # business rules and application workflows
  ├─ models/       # database models
  ├─ templates/    # HTML templates
  └─ static/       # CSS, JavaScript, and assets
tests/
migrations/
```

### [API Consulta OAB/CNA](https://github.com/PietroTamanini/API-consulta-OAB) · `individual project`

A web interface and Flask API for automated lookup of public OAB/CNA data. The integration uses browser automation when needed and stores results in MySQL to support repeated lookups.

`PHP` `Python` `Flask` `REST API` `Playwright` `MySQL`

**Request flow**

- Check available local data first.
- Use the Flask API to coordinate a lookup when required.
- Automate the browser flow, normalize results, and persist data.
- Reuse stored results where possible to reduce repeated requests.

```text
PHP interface
  └─> Flask API
       ├─> local data / cache lookup
       ├─> browser automation when needed
       └─> MySQL persistence
```

## `stack.yml`

```yaml
frontend:
  languages:
    - HTML
    - CSS
    - JavaScript
  templating:
    - Jinja2

backend:
  languages:
    - Python
    - PHP
  frameworks_and_apis:
    - Flask
    - REST APIs
  application_concepts:
    - authentication and authorization
    - role-based access control
    - business logic and integrations

data:
  databases:
    - MySQL
    - MariaDB
  tools_and_practices:
    - SQLAlchemy
    - relational data modeling
    - database migrations

quality:
  - Pytest
  - Playwright
  - Ruff
  - GitHub Actions

security:
  - CSRF protection
  - role-based permissions
  - rate limiting
  - audit trails
  - secure file handling

infrastructure:
  - Linux
  - Docker
  - Docker Compose
  - Nginx
  - Gunicorn
```

## `workflow.txt`

```text
01  understand the requirement and model the solution
02  separate interface, business logic, and data access
03  validate inputs and handle failure cases
04  test critical user and API flows
05  document setup, configuration, and operation
06  automate repeatable checks and deployment steps
```

## `education/`

**Technical Program in Systems Analysis and Development — SENAI/SC, Joinville**  
`Mar 2025 – Dec 2026 · In progress`

Studying programming, web development, databases, systems modeling, and software engineering.

## `professional résumé/`

My portfolio contains more details about my projects, technical background, and professional profile.

```console
pietro@dev:~$ ./resume.sh
focus      Full Stack Development
level      Junior
portfolio  https://pietro.tamanini.dev.br/
```

## `contact.sh`

```console
pietro@dev:~$ ./contact.sh
email     pietro@tamanini.dev.br
location  Joinville, Santa Catarina, Brazil
portfolio https://pietro.tamanini.dev.br/
linkedin  linkedin.com/in/pietrotamanini
```

I'm looking for a junior opportunity where I can contribute to both frontend and backend work, learn from a team, and help build reliable, useful software.


## Certificados

A seção de certificados está disponível em português (`certificados.html`), inglês (`certificates.html`) e espanhol (`certificados-es.html`). As páginas reutilizam o cabeçalho completo, menu responsivo, seletor de idioma e rodapé do portfólio. O seletor de idioma mantém o visitante na seção de certificados ao alternar entre português, inglês e espanhol. Os 11 PDFs ficam em `assets/certificados/` e são exibidos em um visualizador modal.


## SEO, GEO e AIO (busca por IA)

O site inclui metadados por idioma, URLs canônicas, `hreflang` recíproco, Open Graph, cartões sociais, dados estruturados JSON-LD para o perfil e projetos, `sitemap.xml`, `robots.txt` e `llms.txt`. As páginas de certificados possuem metadados próprios, lista estruturada e links HTML rastreáveis para os PDFs. O GitHub Actions executa `scripts/validate_site.py` antes de publicar, para detectar metadados ausentes, links locais quebrados e problemas no sitemap.

Isso melhora a clareza técnica e a capacidade de descoberta, mas não garante indexação, rich results nem recomendações em respostas geradas por IA. Para acompanhar resultados, verifique o domínio em Google Search Console e Bing Webmaster Tools, envie `https://pietro.tamanini.dev.br/sitemap.xml` e monitore indexação, consultas, cliques e Core Web Vitals. Não adicione palavras-chave artificiais nem invente datas, emissores de certificados, emprego ou métricas.
