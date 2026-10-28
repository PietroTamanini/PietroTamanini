(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentLanguage = 'pt';

  const menuButton = $('.menu-toggle');
  const navigation = $('.main-nav');
  const navLinks = $$('.main-nav a[href^="#"]');
  const copyButton = $('.copy-email');
  const toast = $('.toast');
  const currentYear = $('#current-year');
  const progress = $('.scroll-progress span');
  const reveals = $$('.reveal');

  const editorTabs = $$('[data-editor-tab]');
  const editorPanels = $$('[data-editor-panel]');
  const editorPosition = $('#editor-position');
  const editorLanguage = $('#editor-language');
  const sidebarFiles = $$('[data-sidebar-file]');
  const runButton = $('[data-run-editor]');

  const terminal = $('[data-workspace-terminal]');
  const terminalToggle = $('[data-terminal-toggle]');
  const terminalClose = $('[data-terminal-close]');
  const terminalForm = $('[data-terminal-form]');
  const terminalInput = $('#terminal-input');
  const terminalOutput = $('#terminal-output');

  const projectDetails = $$('.repo-inspect');
  const projectFilters = $$('[data-project-filter]');
  const projectItems = $$('.repo-item[data-project-stack]');
  const projectCount = $('#project-count');

  const commandDialog = $('[data-command-dialog]');
  const commandTriggers = $$('[data-command-palette]');
  const commandClose = $('[data-command-close]');
  const commandSearch = $('[data-command-search]');
  const commandList = $('[data-command-list]');
  const commandEmpty = $('[data-command-empty]');

  const editorStatus = {
    profile: { position: 'Ln 9, Col 1', language: 'JSON' },
    api: { position: 'Ln 9, Col 1', language: 'HTTP' },
    docker: { position: 'Ln 9, Col 1', language: 'YAML' }
  };

  const projectUrls = {
    justraduz: 'https://github.com/TeamGHCP/JusTraduz',
    zokyo: 'https://github.com/PietroTamanini/Zokyo',
    oab: 'https://github.com/PietroTamanini/API-consulta-OAB',
    api: 'https://github.com/PietroTamanini/API-consulta-OAB'
  };

  let activeEditor = 'profile';
  let previousFocus = null;
  let commandSelection = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const setMenuState = (open, { restoreFocus = false } = {}) => {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? (currentLanguage === 'en' ? 'Close menu' : currentLanguage === 'es' ? 'Cerrar menú' : 'Fechar menu') : (currentLanguage === 'en' ? 'Open navigation menu' : currentLanguage === 'es' ? 'Abrir menú de navegación' : 'Abrir menu de navegação'));
    navigation.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);

    if (open) navigation.querySelector('a')?.focus({ preventScroll: true });
    else if (restoreFocus) menuButton.focus({ preventScroll: true });
  };

  const closeMenu = (options) => setMenuState(false, options);

  menuButton?.addEventListener('click', () => {
    setMenuState(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));

  document.addEventListener('click', (event) => {
    if (menuButton?.getAttribute('aria-expanded') !== 'true') return;
    if (navigation?.contains(event.target) || menuButton.contains(event.target)) return;
    closeMenu();
  });

  const desktopMedia = window.matchMedia('(min-width: 761px)');
  desktopMedia.addEventListener?.('change', (event) => {
    if (event.matches) closeMenu();
  });

  const setActiveNavigation = (sectionId) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const sections = $$('main section[id]');
  let navigationFrame = 0;

  const getActiveSectionId = () => {
    if (!sections.length) return '';

    const headerOffset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const activationLine = window.scrollY + headerOffset + Math.min(window.innerHeight * 0.28, 220);
    let activeId = sections[0].id;

    sections.forEach((section) => {
      if (section.offsetTop <= activationLine) activeId = section.id;
    });

    return activeId;
  };

  const updateActiveNavigation = () => {
    navigationFrame = 0;
    setActiveNavigation(getActiveSectionId());
  };

  const requestNavigationUpdate = () => {
    if (navigationFrame) return;
    navigationFrame = window.requestAnimationFrame(updateActiveNavigation);
  };

  reveals.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${(index % 3) * 55}ms`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6%', threshold: 0.08 });

    reveals.forEach((item) => revealObserver.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add('visible'));
  }

  const activateEditorTab = (name, { focus = false } = {}) => {
    const status = editorStatus[name];
    if (!status) return;
    activeEditor = name;

    editorTabs.forEach((tab) => {
      const active = tab.dataset.editorTab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus({ preventScroll: true });
    });

    editorPanels.forEach((panel) => {
      const active = panel.dataset.editorPanel === name;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });

    sidebarFiles.forEach((button) => {
      const active = button.dataset.sidebarFile === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (editorPosition) editorPosition.textContent = status.position;
    if (editorLanguage) editorLanguage.textContent = status.language;
  };

  editorTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      activateEditorTab(tab.dataset.editorTab);
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });

    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + editorTabs.length) % editorTabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % editorTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = editorTabs.length - 1;

      const nextTab = editorTabs[nextIndex];
      activateEditorTab(nextTab.dataset.editorTab, { focus: true });
      nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  });

  sidebarFiles.forEach((button) => {
    button.addEventListener('click', () => activateEditorTab(button.dataset.sidebarFile));
  });

  const initialEditorTab = editorTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || editorTabs[0];
  if (initialEditorTab) activateEditorTab(initialEditorTab.dataset.editorTab);

  $$('.code-lines li').forEach((line, index) => {
    line.tabIndex = 0;
    line.setAttribute('aria-label', currentLanguage === 'en' ? `Line ${index + 1}. Click to toggle breakpoint.` : currentLanguage === 'es' ? `Línea ${index + 1}. Haz clic para alternar el breakpoint.` : `Linha ${index + 1}. Clique para alternar breakpoint.`);

    const toggleBreakpoint = () => {
      line.classList.toggle('breakpoint');
      if (editorPosition) editorPosition.textContent = `Ln ${index + 1}, Col 1`;
      showToast(line.classList.contains('breakpoint') ? (currentLanguage === 'pt' ? `breakpoint na linha ${index + 1}` : currentLanguage === 'es' ? `breakpoint en la línea ${index + 1}` : `breakpoint on line ${index + 1}`) : (currentLanguage === 'pt' ? 'breakpoint removido' : currentLanguage === 'es' ? 'breakpoint eliminado' : 'breakpoint removed'));
    };

    line.addEventListener('click', toggleBreakpoint);
    line.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      toggleBreakpoint();
    });
  });

  const setTerminalState = (open, { focus = false } = {}) => {
    if (!terminal) return;
    terminal.classList.toggle('open', open);
    terminal.setAttribute('aria-hidden', String(!open));
    terminalToggle?.classList.toggle('active', open);
    terminalToggle?.setAttribute('aria-label', open ? (currentLanguage === 'en' ? 'Close terminal' : currentLanguage === 'es' ? 'Cerrar terminal' : 'Fechar terminal') : (currentLanguage === 'en' ? 'Open terminal' : currentLanguage === 'es' ? 'Abrir terminal' : 'Abrir terminal'));
    if (open && focus) window.setTimeout(() => terminalInput?.focus(), reducedMotion ? 0 : 180);
  };

  const appendTerminalLine = (text, className = '') => {
    if (!terminalOutput) return;
    const line = document.createElement('p');
    if (className) line.className = className;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  const appendTerminalCommand = (command) => {
    if (!terminalOutput) return;
    const line = document.createElement('p');
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = 'pietro@dev:~$';
    line.append(prompt, document.createTextNode(` ${command}`));
    terminalOutput.appendChild(line);
  };

  const scrollToSection = (selector) => {
    const section = $(selector);
    if (!section) return false;
    section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    return true;
  };

  const applyProjectFilter = (filter) => {
    let visible = 0;

    projectFilters.forEach((button) => {
      const active = button.dataset.projectFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    projectItems.forEach((item) => {
      const stack = (item.dataset.projectStack || '').split(/\s+/);
      const matches = filter === 'all' || stack.includes(filter);
      item.hidden = !matches;

      if (matches) {
        visible += 1;
        item.classList.remove('filter-enter');
        void item.offsetWidth;
        item.classList.add('filter-enter');
        window.setTimeout(() => item.classList.remove('filter-enter'), 320);
      } else {
        const details = $('.repo-inspect', item);
        if (details?.open) details.open = false;
      }
    });

    if (projectCount) projectCount.textContent = String(visible);
    return visible;
  };

  projectFilters.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter;
      const total = applyProjectFilter(filter);
      const filterLabel = currentLanguage === 'pt' ? ({ all: 'todos', python: 'Python', php: 'PHP', docker: 'Docker' }[filter] || filter) : currentLanguage === 'es' ? ({ all: 'todos', python: 'Python', php: 'PHP', docker: 'Docker' }[filter] || filter) : ({ all: 'all', python: 'Python', php: 'PHP', docker: 'Docker' }[filter] || filter);
      showToast(currentLanguage === 'pt' ? `${total} projeto(s) · ${filterLabel}` : currentLanguage === 'es' ? `${total} proyecto(s) · ${filterLabel}` : `${total} project${total === 1 ? '' : 's'} · ${filterLabel}`);
    });
  });

  const syncProjectDetails = (details) => {
    const summary = $('summary', details);
    const label = $('.inspect-label', details);
    const expanded = details.open;
    summary?.setAttribute('aria-expanded', String(expanded));
    if (label) label.textContent = expanded ? (currentLanguage === 'pt' ? 'fechar projeto' : currentLanguage === 'es' ? 'cerrar proyecto' : 'close project') : (currentLanguage === 'pt' ? 'ver detalhes do projeto' : currentLanguage === 'es' ? 'ver detalles del proyecto' : 'inspect project');
  };

  projectDetails.forEach((details) => {
    syncProjectDetails(details);
    details.addEventListener('toggle', () => {
      if (details.open) {
        projectDetails.forEach((other) => {
          if (other !== details && other.open) other.open = false;
        });
      }
      syncProjectDetails(details);
    });
  });

  const terminalCommands = {
    help: () => currentLanguage === 'pt' ? [
      'comandos: help, whoami, about, projects, stack, cv, contact, pwd, clear',
      'abrir: github, linkedin, justraduz, zokyo, oab',
      'filtros: filter all | python | php | docker'
    ] : currentLanguage === 'es' ? [
      'comandos: help, whoami, about, projects, stack, cv, contact, pwd, clear',
      'abrir: github, linkedin, justraduz, zokyo, oab',
      'filtros: filter all | python | php | docker'
    ] : [
      'commands: help, whoami, about, projects, stack, cv, contact, pwd, clear',
      'open: github, linkedin, justraduz, zokyo, oab',
      'filters: filter all | python | php | docker'
    ],
    whoami: () => [currentLanguage === 'pt' ? 'Pietro Tamanini · Desenvolvedor Full Stack Júnior' : currentLanguage === 'es' ? 'Pietro Tamanini · Desarrollador Full Stack Júnior' : 'Pietro Tamanini · Junior Full Stack Developer', 'HTML · CSS · JavaScript · Python · PHP · APIs · MySQL · Docker · Linux'],
    about: () => {
      scrollToSection('#about');
      return [currentLanguage === 'pt' ? 'abrindo ./sobre' : currentLanguage === 'es' ? 'abriendo ./sobre-mi' : 'opening ./about'];
    },
    projects: () => {
      scrollToSection('#projects');
      return ['JusTraduz/', 'Zokyo/', 'API-consulta-OAB/'];
    },
    ls: () => currentLanguage === 'pt'
      ? ['sobre/', 'projetos/', 'stack.yml', 'trajetória.log', 'docs/Pietro-Ramos-Tamanini-Curriculo-Full-Stack.pdf', 'contato.sh']
      : currentLanguage === 'es'
        ? ['sobre-mi/', 'proyectos/', 'stack.yml', 'trayectoria.log', 'docs/Pietro-Ramos-Tamanini-Curriculo-Full-Stack.pdf', 'contacto.sh']
        : ['about/', 'projects/', 'stack.yml', 'journey.log', 'docs/Pietro-Ramos-Tamanini-Curriculo-Full-Stack.pdf', 'contact.sh'],
    stack: () => currentLanguage === 'pt'
      ? ['backend: Python, PHP, Flask, APIs REST', 'dados: MySQL, MariaDB, SQLAlchemy', 'infraestrutura: Docker, Linux, Nginx, Gunicorn']
      : currentLanguage === 'es'
        ? ['backend: Python, PHP, Flask, API REST', 'datos: MySQL, MariaDB, SQLAlchemy', 'infraestructura: Docker, Linux, Nginx, Gunicorn']
        : ['backend: Python, PHP, Flask, REST APIs', 'data: MySQL, MariaDB, SQLAlchemy', 'infra: Docker, Linux, Nginx, Gunicorn'],
    cv: () => {
      scrollToSection('#cv');
      return ['docs/Pietro-Ramos-Tamanini-Curriculo-Full-Stack.pdf', currentLanguage === 'pt' ? 'use o botão de download para salvar o arquivo' : currentLanguage === 'es' ? 'usa el botón de descarga para guardar el archivo' : 'use the download button to save the file'];
    },
    contact: () => currentLanguage === 'pt'
      ? ['pietro@tamanini.dev.br', 'Joinville, Santa Catarina, Brasil']
      : currentLanguage === 'es'
        ? ['pietro@tamanini.dev.br', 'Joinville, Santa Catarina, Brasil']
        : ['pietro@tamanini.dev.br', 'Joinville, Santa Catarina, Brazil'],
    pwd: () => ['/home/pietro/portfolio'],
    date: () => [new Intl.DateTimeFormat(currentLanguage === 'pt' ? 'pt-BR' : currentLanguage === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date())]
  };

  const executeTerminalCommand = (rawCommand) => {
    const command = rawCommand.trim();
    if (!command) return;

    appendTerminalCommand(command);
    const [base, ...args] = command.toLowerCase().split(/\s+/);

    if (base === 'clear') {
      if (terminalOutput) terminalOutput.innerHTML = '';
      return;
    }

    if (base === 'open') {
      const target = args[0];
      if (target === 'github') window.open('https://github.com/PietroTamanini', '_blank', 'noopener,noreferrer');
      else if (target === 'linkedin') window.open('https://www.linkedin.com/in/pietrotamanini/', '_blank', 'noopener,noreferrer');
      else if (projectUrls[target]) window.open(projectUrls[target], '_blank', 'noopener,noreferrer');
      else {
        appendTerminalLine(`open: target not found: ${target || '(empty)'}`, 'terminal-error');
        return;
      }
      appendTerminalLine(`opening ${target}...`, 'terminal-success');
      return;
    }

    if (base === 'filter') {
      const filter = args[0] || 'all';
      const allowed = ['all', 'python', 'php', 'docker'];
      if (!allowed.includes(filter)) {
        appendTerminalLine(`filter: invalid option '${filter}'`, 'terminal-error');
        return;
      }
      const count = applyProjectFilter(filter);
      scrollToSection('#projects');
      appendTerminalLine(`${count} repositories match '${filter}'`, 'terminal-success');
      return;
    }

    const handler = terminalCommands[base];
    if (!handler) {
      appendTerminalLine(`command not found: ${base}. type 'help'.`, 'terminal-error');
      return;
    }

    const lines = handler();
    lines.forEach((line, index) => {
      window.setTimeout(() => appendTerminalLine(line, index === 0 ? 'terminal-success' : ''), reducedMotion ? 0 : index * 45);
    });
  };

  terminalToggle?.addEventListener('click', () => {
    setTerminalState(!terminal?.classList.contains('open'), { focus: true });
  });
  terminalClose?.addEventListener('click', () => setTerminalState(false));
  terminalForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const command = terminalInput?.value || '';
    if (terminalInput) terminalInput.value = '';
    executeTerminalCommand(command);
  });

  const runActiveFile = () => {
    const output = {
      profile: ['$ node profile.json', 'profile loaded · 6 technologies · status ready'],
      api: ['$ send api.http', 'GET /health 200 OK · database connected · 42ms'],
      docker: ['$ docker compose up -d', 'app started · database healthy · network ready']
    }[activeEditor];

    if (!output) return;
    setTerminalState(true);
    runButton?.classList.add('running');
    appendTerminalCommand(output[0].replace(/^\$\s*/, ''));

    window.setTimeout(() => {
      appendTerminalLine(output[1], 'terminal-success');
      runButton?.classList.remove('running');
    }, reducedMotion ? 0 : 420);
  };

  runButton?.addEventListener('click', runActiveFile);

  const getVisibleCommandItems = () => {
    if (!commandList) return [];
    return $$('button:not([hidden]), a:not([hidden])', commandList);
  };

  const updateCommandSelection = (index) => {
    const items = getVisibleCommandItems();
    if (!items.length) return;
    commandSelection = (index + items.length) % items.length;
    items.forEach((item, itemIndex) => item.classList.toggle('selected', itemIndex === commandSelection));
    items[commandSelection].scrollIntoView({ block: 'nearest' });
  };

  const filterCommands = () => {
    if (!commandSearch || !commandList) return;
    const query = commandSearch.value.trim().toLowerCase();
    const items = $$('button, a', commandList);
    let visible = 0;

    items.forEach((item) => {
      const haystack = `${item.textContent} ${item.dataset.keywords || ''}`.toLowerCase();
      const matches = !query || haystack.includes(query);
      item.hidden = !matches;
      item.classList.remove('selected');
      if (matches) visible += 1;
    });

    if (commandEmpty) commandEmpty.hidden = visible > 0;
    commandSelection = 0;
    if (visible) updateCommandSelection(0);
  };

  const setCommandDialogState = (open) => {
    if (!commandDialog) return;

    commandDialog.classList.toggle('open', open);
    commandDialog.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('dialog-open', open);

    if (open) {
      previousFocus = document.activeElement;
      if (commandSearch) commandSearch.value = '';
      filterCommands();
      window.setTimeout(() => commandSearch?.focus(), reducedMotion ? 0 : 60);
    } else if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }
  };

  commandTriggers.forEach((button) => button.addEventListener('click', () => setCommandDialogState(true)));
  commandClose?.addEventListener('click', () => setCommandDialogState(false));
  commandSearch?.addEventListener('input', filterCommands);

  commandList?.addEventListener('click', (event) => {
    const target = event.target.closest('button, a');
    if (!target) return;

    if (target.dataset.commandTarget) {
      event.preventDefault();
      setCommandDialogState(false);
      scrollToSection(target.dataset.commandTarget);
    } else if (target.dataset.commandAction === 'terminal') {
      event.preventDefault();
      setCommandDialogState(false);
      setTerminalState(true, { focus: true });
    } else {
      setCommandDialogState(false);
    }
  });

  commandSearch?.addEventListener('keydown', (event) => {
    const items = getVisibleCommandItems();
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      updateCommandSelection(commandSelection + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      updateCommandSelection(commandSelection - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[commandSelection]?.click();
    }
  });

  $$('.stack-row').forEach((row) => {
    row.tabIndex = 0;
    row.setAttribute('aria-selected', 'false');
    const activate = () => {
      const selected = !row.classList.contains('is-active');
      $$('.stack-row').forEach((other) => {
        other.classList.remove('is-active');
        other.setAttribute('aria-selected', 'false');
      });
      if (selected) {
        row.classList.add('is-active');
        row.setAttribute('aria-selected', 'true');
        const key = $('.stack-key', row)?.textContent?.replace(':', '') || 'stack';
        showToast(currentLanguage === 'pt' ? `${key} selecionado` : currentLanguage === 'es' ? `${key} seleccionado` : `${key} selected`);
      }
    };
    row.addEventListener('click', activate);
    row.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      activate();
    });
  });

  const copyTextFallback = (text) => {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.inset = '0 auto auto -9999px';
    document.body.appendChild(input);
    input.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      input.remove();
    }
    return copied;
  };

  copyButton?.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    if (!email) return;

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
        copied = true;
      } else copied = copyTextFallback(email);
    } catch {
      copied = copyTextFallback(email);
    }

    showToast(copied ? (currentLanguage === 'pt' ? 'e-mail copiado' : currentLanguage === 'es' ? 'correo copiado' : 'email copied') : email);
    if (!copied) return;

    const originalLabel = copyButton.textContent;
    copyButton.textContent = currentLanguage === 'pt' ? 'copiado' : currentLanguage === 'es' ? 'copiado' : 'copied';
    copyButton.disabled = true;
    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
      copyButton.disabled = false;
    }, 1400);
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

    if (event.key === 'Escape') {
      if (commandDialog?.classList.contains('open')) {
        event.preventDefault();
        setCommandDialogState(false);
        return;
      }
      if (menuButton?.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: true });
        return;
      }
      if (terminal?.classList.contains('open') && !typing) setTerminalState(false);
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setCommandDialogState(!commandDialog?.classList.contains('open'));
      return;
    }

    if (event.ctrlKey && event.key === '`') {
      event.preventDefault();
      setTerminalState(!terminal?.classList.contains('open'), { focus: true });
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !commandDialog?.classList.contains('open')) {
      event.preventDefault();
      runActiveFile();
      return;
    }

    if (event.key === '/' && !typing && !commandDialog?.classList.contains('open')) {
      event.preventDefault();
      setTerminalState(true, { focus: true });
    }

    if (commandDialog?.classList.contains('open') && event.key === 'Tab') {
      const focusable = $$('input, button:not([hidden]), a:not([hidden])', commandDialog).filter((element) => element.tabIndex !== -1);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  let progressFrame = 0;
  const updateProgress = () => {
    progressFrame = 0;
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  };

  const requestProgressUpdate = () => {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(updateProgress);
  };

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
  window.addEventListener('resize', requestNavigationUpdate);
  updateProgress();
  updateActiveNavigation();

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());


  // Site-wide, stable translations. Every translation is always derived from the
  // original DOM, so switching languages never stacks translations or loses text.
  const languageSwitcher = $('[data-language-switcher]');
  const languageTrigger = $('[data-language-menu-trigger]', languageSwitcher || document);
  const languageMenu = $('[data-language-menu]', languageSwitcher || document);
  const currentLanguageFlag = $('[data-current-language-flag]', languageSwitcher || document);
  const languageFlags = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
  const languageNames = { pt: 'Mudar idioma', en: 'Change language', es: 'Cambiar idioma' };
  const languageGroupNames = { pt: 'Selecionar idioma', en: 'Choose a language', es: 'Elegir idioma' };

  const setLanguageMenuOpen = (open, focusOption = false) => {
    if (!languageTrigger || !languageMenu) return;
    languageMenu.hidden = !open;
    languageTrigger.setAttribute('aria-expanded', String(open));
    if (open && focusOption) {
      const selected = $('[data-set-language].is-active', languageMenu) || $('[data-set-language]', languageMenu);
      selected?.focus({ preventScroll: true });
    }
  };

  languageTrigger?.addEventListener('click', () => {
    setLanguageMenuOpen(languageTrigger.getAttribute('aria-expanded') !== 'true', true);
  });

  document.addEventListener('click', (event) => {
    if (languageSwitcher && !languageSwitcher.contains(event.target)) setLanguageMenuOpen(false);
  });

  languageSwitcher?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && languageTrigger?.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setLanguageMenuOpen(false);
      languageTrigger.focus({ preventScroll: true });
    }
  });

  const translations = {
    pt: {
      'Skip to content':'Pular para o conteúdo','Full Stack Developer':'Desenvolvedor Full Stack Júnior',
      'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.':'Desenvolvo aplicações web de ponta a ponta: interfaces responsivas com HTML, CSS e JavaScript, serviços backend com Python/PHP, bancos de dados relacionais, integrações, testes e publicação.',
      'status':'status','available':'disponível','foco':'foco','runtime':'ambiente','workflow':'fluxo de trabalho','design → build → test':'planejar → desenvolver → testar',
      'software that runs':'software funcional','location':'localização','Joinville, Santa Catarina, Brazil':'Joinville, Santa Catarina, Brasil',
      'About me':'Sobre mim','I develop web applications from end to end: responsive interfaces, application logic, APIs, relational databases, integrations, authentication, access control, automated tests, and deployment environments.':'Desenvolvo aplicações web de ponta a ponta: interfaces responsivas, lógica de aplicação, APIs, bancos de dados relacionais, integrações, autenticação, controle de acesso, testes automatizados e ambientes de publicação.',
      'I enjoy taking a feature from idea to delivery: understanding requirements, shaping the interface, modeling data, implementing business rules, testing, documenting, deploying, and maintaining the system. I study Systems Analysis and Development at SENAI/SC and am looking for a junior Full Stack / Web Development opportunity.':'Gosto de acompanhar uma funcionalidade desde a ideia até a entrega: entender requisitos, estruturar a interface, modelar dados, implementar regras de negócio, testar, documentar, publicar e manter o sistema. Estudo Análise e Desenvolvimento de Sistemas no SENAI/SC e busco uma oportunidade júnior em Full Stack ou Desenvolvimento Web.',
      'Readability over cleverness.':'Clareza acima de soluções engenhosas.','Build clear boundaries between interface, logic, and data.':'Separe bem a interface, a lógica e os dados.','Without logs, debugging becomes guesswork.':'Sem logs, depurar vira adivinhação.','Deployment is part of the product.':'A publicação faz parte do produto.',
      'project':'projeto','projects':'projetos','./about':'./sobre','./projects':'./projetos','./stack':'./tecnologias','./journey':'./trajetória','./resume':'./currículo','./contact':'./contato',
      'Featured projects':'Projetos em destaque','all repositories ↗':'todos os repositórios ↗','view projects':'ver projetos','download résumé':'baixar currículo','1st place at SENAI/SC':'1º lugar no SENAI/SC',
      'A collaborative legal platform for document analysis, case management, communication, public case lookup, and payment integration — combining user-facing workflows with backend services.':'Plataforma jurídica colaborativa para análise de documentos, gestão de casos, comunicação, consulta pública de processos e integração de pagamentos, unindo fluxos de usuário e serviços backend.',
      'shipped':'entregue','view project details':'ver detalhes do projeto','My contribution':'Minha contribuição','Backend development, integrations, database modeling, security, infrastructure, and product evolution.':'Desenvolvimento backend, integrações, modelagem de banco de dados, segurança, infraestrutura e evolução do produto.',
      'Key implementation areas':'Principais áreas de implementação','Role-based permissions, audit trails, private file storage, processing, payments, and Docker.':'Permissões por perfil, trilhas de auditoria, armazenamento privado de arquivos, processamento, pagamentos e Docker.',
      'Architecture':'Arquitetura','Flask blueprints, service layer, SQLAlchemy, database migrations, and environment-based configuration.':'Blueprints Flask, camada de serviços, SQLAlchemy, migrações de banco e configuração por ambiente.',
      'Quality and delivery':'Qualidade e entrega','Request flow':'Fluxo da requisição','Local lookup, API request, controlled browser automation, data normalization, and persistence.':'Consulta local, requisição à API, automação controlada do navegador, normalização e persistência dos dados.',
      'Goal':'Objetivo','Reduce repeated lookups and provide a consistent interface for accessing public data.':'Reduzir consultas repetidas e oferecer uma interface consistente para consumir dados públicos.',
      'Technical stack':'Stack técnica','Journey':'Trajetória','achievement':'conquista','1st place in the Software Learning Project':'1º lugar no Projeto de Aprendizagem de Software',
      'JusTraduz was presented at SENAI/SC as a collaborative capstone project.':'O JusTraduz foi apresentado no SENAI/SC como projeto colaborativo de conclusão de etapa.','view announcement ↗':'ver publicação ↗','education':'formação','Studying at SENAI/SC in Joinville, with hands-on application development and team projects.':'Estudando no SENAI/SC em Joinville, com desenvolvimento prático de aplicações e projetos em equipe.',
      'Building skills in interfaces, backend architecture, data modeling, testing, application security, and Linux operations.':'Aprofundando habilidades em interfaces, arquitetura backend, modelagem de dados, testes, segurança de aplicações e operações Linux.',
      'professional résumé':'currículo profissional','My journey in technology.':'Minha trajetória em tecnologia.','Education, technical skills, projects, and professional information in one document.':'Formação, conhecimentos técnicos, projetos e informações profissionais em um único documento.',
      'format':'formato','focus':'foco','English':'Português','Let’s talk':'Vamos conversar','Open to junior Full Stack / Web Developer opportunities, collaborative projects, and technical conversations.':'Aberto a oportunidades júnior em Full Stack e Desenvolvimento Web, projetos colaborativos e conversas sobre tecnologia.',
      'email':'e-mail','copy email':'copiar e-mail','send email':'enviar e-mail','open PDF ↗':'abrir PDF ↗','download PDF':'baixar PDF','resume':'currículo','copy email':'copiar e-mail','copied':'copiado',
      'main':'principal','current':'atual','Full Stack development in practice':'Desenvolvimento Full Stack na prática','Systems Analysis and Development':'Análise e Desenvolvimento de Sistemas',
      'Open navigation menu':'Abrir menu de navegação','Main navigation':'Navegação principal','Close menu':'Fechar menu','Close terminal':'Fechar terminal','Open terminal':'Abrir terminal',
      'backend:':'backend:','data:':'dados:','infra:':'infraestrutura:','quality:':'qualidade:','security:':'segurança:','tools:':'ferramentas:','frontend:':'frontend:',
      'model before implementation':'modelar antes de implementar','separate business logic':'separar a lógica de negócio','test critical flows':'testar fluxos críticos','document how to run':'documentar como executar','automate deployment':'automatizar a publicação',
      'workflow.txt':'fluxo-trabalho.txt','sobre.md':'sobre.md','projetos/':'projetos/','trajetória.log':'trajetória.log','curriculo.pdf':'curriculo.pdf','contact.sh':'contato.sh',
      'client':'cliente','PHP application':'aplicação PHP','payment gateway':'gateway de pagamento','document pipeline':'pipeline de documentos','cache lookup':'consulta ao cache','browser task':'tarefa do navegador','MySQL persist':'persistência no MySQL',
      'PHP client':'cliente PHP','Flask API':'API Flask','currículo':'currículo','Português':'Português','formatoo':'formato','idioma':'idioma','localização':'localização','ver publicação ↗':'ver publicação ↗',
      'built with HTML, CSS and JavaScript':'feito com HTML, CSS e JavaScript','Close project':'fechar projeto','inspect project':'ver detalhes do projeto',
      'all repositories':'todos os repositórios','Open to opportunities':'Aberto a oportunidades','Plan':'Planejar','build':'desenvolver','test':'testar',
      'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.':'Desenvolvo aplicações web de ponta a ponta: interfaces responsivas com HTML, CSS e JavaScript, serviços backend com Python/PHP, bancos de dados relacionais, integrações, testes e publicação.',
      '"foco"':'"foco"','"software that runs"':'"software funcional"','runtime':'ambiente','workflow':'fluxo de trabalho','full stack':'full stack','linux':'Linux',
      '1º lugar no SENAI/SC ↗':'1º lugar no SENAI/SC ↗','Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose.',
      'team':'equipe','solo':'individual','shipped':'entregue','active':'ativo','public':'público','copy email':'copiar e-mail','github ↗':'github ↗','linkedin ↗':'linkedin ↗',
      '[Python, PHP, Flask, REST APIs, business rules, authentication, RBAC]':'[Python, PHP, Flask, APIs REST, regras de negócio, autenticação, controle de acesso por função]',
      '[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, relational modeling]':'[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, modelagem relacional]',
      '[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]':'[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]',
      '[Pytest, Playwright, Ruff, GitHub Actions, documentation]':'[Pytest, Playwright, Ruff, GitHub Actions, documentação]',
      '[CSRF, rate limiting, 2FA, audit trails, secrets management]':'[CSRF, limite de requisições, 2FA, trilhas de auditoria, gestão de segredos]',
      '[Git, GitHub, C, VS Code, Linux CLI, environment setup]':'[Git, GitHub, C, VS Code, terminal Linux, configuração de ambiente]',
      '[HTML5, CSS3, JavaScript, responsive UI, accessibility, DOM, Git/GitHub]':'[HTML5, CSS3, JavaScript, interface responsiva, acessibilidade, DOM, Git/GitHub]',
      'todos os repositórios ↗':'todos os repositórios ↗','A collaborative legal platform for document analysis, case management, communication, public case lookup, and payment integration — combining user-facing workflows with backend services.':'Plataforma jurídica colaborativa para análise de documentos, gestão de casos, comunicação, consulta pública de processos e integração de pagamentos, unindo fluxos de usuário e serviços backend.',
      'I develop web applications from end to end: responsive interfaces, application logic, APIs, relational databases, integrations, authentication, access control, automated tests, and deployment environments.':'Desenvolvo aplicações web de ponta a ponta: interfaces responsivas, lógica da aplicação, APIs, bancos de dados relacionais, integrações, autenticação, controle de acesso, testes automatizados e ambientes de publicação.',
      'I enjoy taking a feature from idea to delivery: understanding requirements, shaping the interface, modeling data, implementing business rules, testing, documenting, deploying, and maintaining the system. I study Systems Analysis and Development at SENAI/SC and am looking for a junior Full Stack / Web Development opportunity.':'Gosto de acompanhar uma funcionalidade desde a ideia até a entrega: entender requisitos, estruturar a interface, modelar dados, implementar regras de negócio, testar, documentar, publicar e manter o sistema. Estudo Análise e Desenvolvimento de Sistemas no SENAI/SC e busco uma oportunidade júnior em Full Stack ou Desenvolvimento Web.'
    },
    en: {
      'Skip to content':'Skip to content','Início':'Home','Navegação principal':'Main navigation','Selecionar idioma / Choose language / Elegir idioma':'Select language',
      './sobre':'./about','./projetos':'./projects','./tecnologias':'./stack','./trajetória':'./journey','./currículo':'./resume','./contato':'./contact',
      'Desenvolvedor Full Stack Júnior':'Junior Full Stack Developer','Desenvolvedor Full Stack':'Full Stack Developer','Desenvolvo aplicações web de ponta a ponta: interfaces responsivas com HTML, CSS e JavaScript, serviços backend com Python/PHP, bancos de dados relacionais, integrações, testes e publicação.':'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.',
      'ver projetos':'view projects','baixar currículo':'download résumé','Aberto a oportunidades Júnior em Full Stack e Desenvolvimento Web · Joinville, SC':'Open to junior Full Stack and Web Development opportunities · Joinville, Brazil',
      'disponível':'available','planejar → desenvolver → testar':'design → build → test','localização':'location','Sobre mim':'About me','Projetos em destaque':'Featured projects','todos os repositórios ↗':'all repositories ↗','ver detalhes do projeto':'view project details',
      'Minha contribuição':'My contribution','Desenvolvimento backend, integrações, modelagem de banco de dados, segurança, infraestrutura e evolução do produto.':'Backend development, integrations, database modeling, security, infrastructure, and product evolution.',
      'Principais áreas de implementação':'Key implementation areas','Permissões por perfil, trilhas de auditoria, armazenamento privado de arquivos, processamento, pagamentos e Docker.':'Role-based permissions, audit trails, private file storage, processing, payments, and Docker.',
      'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'Full Stack CRM/ERP for repair shops, with service orders, customers, devices, inventory, finance, reports, and customer workflows.',
      'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Web interface connected to a Flask API for automated public-data lookups, with caching, browser automation, and MySQL persistence.',
      'Arquitetura':'Architecture','Blueprints Flask, camada de serviços, SQLAlchemy, migrações de banco e configuração por ambiente.':'Flask blueprints, service layer, SQLAlchemy, database migrations, and environment-based configuration.',
      'Qualidade e entrega':'Quality and delivery','Fluxo da requisição':'Request flow','Consulta local, requisição à API, automação controlada do navegador, normalização e persistência dos dados.':'Local lookup, API request, controlled browser automation, data normalization, and persistence.',
      'Objetivo':'Goal','Reduzir consultas repetidas e oferecer uma interface consistente para consumir dados públicos.':'Reduce repeated lookups and provide a consistent interface for accessing public data.',
      'Stack técnica':'Technical stack','Trajetória':'Journey','achievement':'achievement','1º lugar no Projeto de Aprendizagem de Software':'1st place in the Software Learning Project','O JusTraduz foi apresentado no SENAI/SC como projeto colaborativo de conclusão de etapa.':'JusTraduz was presented at SENAI/SC as a collaborative capstone project.',
      'ver publicação ↗':'view announcement ↗','education':'education','Estudando no SENAI/SC em Joinville, com desenvolvimento prático de aplicações e projetos em equipe.':'Studying at SENAI/SC in Joinville, with hands-on application development and team projects.',
      'Aprofundando habilidades em interfaces, arquitetura backend, modelagem de dados, testes, segurança de aplicações e operações Linux.':'Building skills in interfaces, backend architecture, data modeling, testing, application security, and Linux operations.',
      'currículo profissional':'professional résumé','Minha trajetória em tecnologia.':'A closer look at my background.','Formação, conhecimentos técnicos, projetos e informações profissionais em um único documento.':'Education, technical skills, projects, and professional details in one document.',
      'formatoo':'format','foco':'focus','idioma':'language','Português':'English','Vamos conversar':'Get in touch','Open to junior Full Stack / Web Developer opportunities, collaborative projects, and technical conversations.':'Open to junior Full Stack / Web Developer opportunities, collaborative projects, and technical conversations.',
      'copiar e-mail':'copy email','enviar e-mail':'send email','abrir PDF ↗':'open PDF ↗','baixar PDF':'download PDF','baixar currículo':'download résumé','localização':'location','Joinville, Santa Catarina, Brazil':'Joinville, Santa Catarina, Brazil',
      'Main navigation':'Main navigation','Skip to content':'Skip to content','Fechar menu':'Close menu','Abrir menu de navegação':'Open navigation menu','feito com HTML, CSS e JavaScript':'built with HTML, CSS and JavaScript',
      'Full Stack Developer':'Junior Full Stack Developer','Sobre mim':'About me','Projetos em destaque':'Featured projects','todos os repositórios ↗':'all repositories ↗','Stack técnica':'Technical stack','Trajetória':'Journey','projetos/':'projects/','sobre.md':'about.md','trajetória.log':'journey.log','curriculo.pdf':'resume.pdf','contact.sh':'contact.sh','workflow.txt':'workflow.txt',
      'Readability over cleverness.':'Readability over cleverness.','Build clear boundaries between interface, logic, and data.':'Build clear boundaries between interface, logic, and data.','Without logs, debugging becomes guesswork.':'Without logs, debugging becomes guesswork.','Deployment is part of the product.':'Deployment is part of the product.',
      'planejar → desenvolver → testar':'plan → build → test','modelar antes de implementar':'model before implementation','separar a lógica de negócio':'separate business logic','testar fluxos críticos':'test critical flows','documentar como executar':'document how to run','automatizar a publicação':'automate deployment',
      'backend:':'backend:','dados:':'data:','infraestrutura:':'infra:','qualidade:':'quality:','segurança:':'security:','ferramentas:':'tools:','frontend:':'frontend:',
      'cliente':'client','aplicação PHP':'PHP application','gateway de pagamento':'payment gateway','pipeline de documentos':'document pipeline','consulta ao cache':'cache lookup','tarefa do navegador':'browser task','persistência no MySQL':'MySQL persistence','cliente PHP':'PHP client','API Flask':'Flask API',
      'ver projeto':'view project','copiar e-mail':'copy email','copiado':'copied','formato':'format','status':'status','ambiente':'runtime','fluxo de trabalho':'workflow','foco':'focus','disponível':'available','pular para o conteúdo':'Skip to content','Fechar projeto':'close project','ver detalhes do projeto':'inspect project',
      'feito com HTML, CSS e JavaScript':'built with HTML, CSS and JavaScript',
      '1º lugar no SENAI/SC ↗':'1st place at SENAI/SC ↗','1º lugar no SENAI/SC':'1st place at SENAI/SC',
      'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'Full Stack CRM/ERP for repair shops, with service orders, customers, devices, inventory, finance, reports, and customer workflows.',
      'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Web interface connected to a Flask API for automated public-data lookups, with caching, browser automation, and MySQL persistence.',
      'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx, and Docker Compose.',
      'Systems Analysis and Development':'Systems Analysis and Development','Aprofundando habilidades em interfaces, arquitetura backend, modelagem de dados, testes, segurança de aplicações e operações Linux.':'Building skills in interfaces, backend architecture, data modeling, testing, application security, and Linux operations.',
      'runtime':'runtime','workflow':'workflow','status':'status','foco':'focus','"foco"':'"focus"','"software that runs"':'"software that runs"',
      'team':'team','solo':'solo','shipped':'shipped','active':'active','public':'public','localização':'location','joinville/sc':'Joinville, Brazil',
      'Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx, and Docker Compose.',
      'My contribution':'My contribution','Arquitetura':'Architecture','Qualidade e entrega':'Quality and delivery','Fluxo da requisição':'Request flow','Objetivo':'Goal',
      'Desenvolvedor Full Stack Júnior':'Junior Full Stack Developer','Desenvolvedor Full Stack':'Full Stack Developer','Desenvolvo aplicações web de ponta a ponta: interfaces responsivas com HTML, CSS e JavaScript, serviços backend com Python/PHP, bancos de dados relacionais, integrações, testes e publicação.':'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.',
      '"foco"':'"focus"','software funcional':'software that runs','ambiente':'runtime','fluxo de trabalho':'workflow','Full Stack':'Full Stack','Pietro Tamanini':'Pietro Tamanini'
    },
    es: {
      'Skip to content':'Saltar al contenido','Início':'Inicio','Navegação principal':'Navegación principal','Selecionar idioma / Choose language / Elegir idioma':'Seleccionar idioma',
      './sobre':'./sobre-mi','./projetos':'./proyectos','./tecnologias':'./tecnologías','./trajetória':'./trayectoria','./currículo':'./currículum','./contato':'./contacto',
      'Full Stack Developer':'Desarrollador Full Stack Júnior','Desenvolvedor Full Stack Júnior':'Desarrollador Full Stack Júnior','Desenvolvedor Full Stack':'Desarrollador Full Stack',
      'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.':'Desarrollo aplicaciones web de principio a fin: interfaces adaptables con HTML, CSS y JavaScript, servicios backend con Python/PHP, bases de datos relacionales, integraciones, pruebas y despliegue.',
      'Desenvolvo aplicações web de ponta a ponta: interfaces responsivas com HTML, CSS e JavaScript, serviços backend com Python/PHP, bancos de dados relacionais, integrações, testes e publicação.':'Desarrollo aplicaciones web de principio a fin: interfaces adaptables con HTML, CSS y JavaScript, servicios backend con Python/PHP, bases de datos relacionales, integraciones, pruebas y despliegue.',
      'ver projetos':'ver proyectos','baixar currículo':'descargar currículum','Aberto a oportunidades Júnior em Full Stack e Desenvolvimento Web · Joinville, SC':'Abierto a oportunidades júnior en desarrollo Full Stack y web · Joinville, Brasil',
      'disponível':'disponible','planejar → desenvolver → testar':'planificar → desarrollar → probar','localização':'ubicación','Sobre mim':'Sobre mí','Projetos em destaque':'Proyectos destacados','todos os repositórios ↗':'todos los repositorios ↗','ver detalhes do projeto':'ver detalles del proyecto',
      'Minha contribuição':'Mi contribución','Desenvolvimento backend, integrações, modelagem de banco de dados, segurança, infraestrutura e evolução do produto.':'Desarrollo backend, integraciones, modelado de bases de datos, seguridad, infraestructura y evolución del producto.',
      'Principais áreas de implementação':'Áreas principales de implementación','Permissões por perfil, trilhas de auditoria, armazenamento privado de arquivos, processamento, pagamentos e Docker.':'Permisos por rol, registros de auditoría, almacenamiento privado de archivos, procesamiento, pagos y Docker.',
      'A collaborative legal platform for document analysis, case management, communication, public case lookup, and payment integration — combining user-facing workflows with backend services.':'Plataforma jurídica colaborativa para analizar documentos, gestionar casos, comunicarse, consultar expedientes públicos e integrar pagos, combinando flujos de usuario y servicios backend.',
      'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'CRM/ERP Full Stack para talleres de reparación, con órdenes de servicio, clientes, equipos, inventario, finanzas, informes y flujos para clientes.',
      'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Interfaz web conectada a una API Flask para consultas automatizadas de datos públicos, con caché, automatización del navegador y persistencia en MySQL.',
      'Arquitetura':'Arquitectura','Blueprints Flask, camada de serviços, SQLAlchemy, migrações de banco e configuração por ambiente.':'Blueprints de Flask, capa de servicios, SQLAlchemy, migraciones de base de datos y configuración por entorno.',
      'Qualidade e entrega':'Calidad y entrega','Fluxo da requisição':'Flujo de la solicitud','Consulta local, requisição à API, automação controlada do navegador, normalização e persistência dos dados.':'Consulta local, solicitud a la API, automatización controlada del navegador, normalización y persistencia de datos.',
      'Objetivo':'Objetivo','Reduzir consultas repetidas e oferecer uma interface consistente para consumir dados públicos.':'Reducir consultas repetidas y ofrecer una interfaz coherente para acceder a datos públicos.',
      'Stack técnica':'Tecnologías','Trajetória':'Trayectoria','achievement':'logro','1º lugar no Projeto de Aprendizagem de Software':'1.er puesto en el Proyecto de Aprendizaje de Software','O JusTraduz foi apresentado no SENAI/SC como projeto colaborativo de conclusão de etapa.':'JusTraduz se presentó en SENAI/SC como proyecto colaborativo de cierre de etapa.',
      'ver publicação ↗':'ver publicación ↗','education':'formación','Estudando no SENAI/SC em Joinville, com desenvolvimento prático de aplicações e projetos em equipe.':'Estudio en SENAI/SC en Joinville, con desarrollo práctico de aplicaciones y proyectos en equipo.',
      'Aprofundando habilidades em interfaces, arquitetura backend, modelagem de dados, testes, segurança de aplicações e operações Linux.':'Perfecciono mis habilidades en interfaces, arquitectura backend, modelado de datos, pruebas, seguridad de aplicaciones y operaciones Linux.',
      'currículo profissional':'currículum profesional','Minha trajetória em tecnologia.':'Mi trayectoria en tecnología.','Formação, conhecimentos técnicos, projetos e informações profissionais em um único documento.':'Formación, habilidades técnicas, proyectos e información profesional en un solo documento.',
      'formatoo':'formato','foco':'enfoque','idioma':'idioma','Português':'Español','Vamos conversar':'Hablemos','Open to junior Full Stack / Web Developer opportunities, collaborative projects, and technical conversations.':'Abierto a oportunidades júnior de desarrollo Full Stack/web, proyectos colaborativos y conversaciones técnicas.',
      'copiar e-mail':'copiar correo','enviar e-mail':'enviar correo','abrir PDF ↗':'abrir PDF ↗','baixar PDF':'descargar PDF','baixar currículo':'descargar currículum','localização':'ubicación','Joinville, Santa Catarina, Brazil':'Joinville, Santa Catarina, Brasil',
      'Open navigation menu':'Abrir menú de navegación','Fechar menu':'Cerrar menú','Open terminal':'Abrir terminal','Close terminal':'Cerrar terminal','feito com HTML, CSS e JavaScript':'hecho con HTML, CSS y JavaScript',
      'Readability over cleverness.':'Claridad antes que complejidad.','Build clear boundaries between interface, logic, and data.':'Mantener límites claros entre interfaz, lógica y datos.','Without logs, debugging becomes guesswork.':'Sin registros, depurar es adivinar.','Deployment is part of the product.':'El despliegue forma parte del producto.',
      'disponível':'disponible','planejar → desenvolver → testar':'planificar → desarrollar → probar','model before implementation':'modelar antes de implementar','separate business logic':'separar la lógica de negocio','test critical flows':'probar flujos críticos','document how to run':'documentar cómo ejecutar','automate deployment':'automatizar el despliegue',
      'workflow.txt':'flujo-trabajo.txt','sobre.md':'sobre.md','projetos/':'proyectos/','trajetória.log':'trayectoria.log','curriculo.pdf':'curriculum.pdf','contact.sh':'contacto.sh',
      'backend:':'backend:','data:':'datos:','infra:':'infraestructura:','quality:':'calidad:','security:':'seguridad:','tools:':'herramientas:','frontend:':'frontend:',
      'client':'cliente','PHP application':'aplicación PHP','payment gateway':'pasarela de pago','document pipeline':'flujo de documentos','cache lookup':'consulta de caché','browser task':'tarea del navegador','MySQL persist':'persistencia en MySQL','PHP client':'cliente PHP','Flask API':'API Flask',
      'professional résumé':'currículum profesional','format':'formato','focus':'enfoque','runtime':'entorno','workflow':'flujo de trabajo','status':'estado','available':'disponible','design → build → test':'diseñar → desarrollar → probar','software that runs':'software funcional',
      'all repositories':'todos los repositorios','close project':'cerrar proyecto','inspect project':'ver detalles del proyecto','copied':'copiado','copy email':'copiar correo','send email':'enviar correo','download PDF':'descargar PDF','open PDF ↗':'abrir PDF ↗','View project details':'ver detalles del proyecto',
      'About me':'Sobre mí','Featured projects':'Proyectos destacados','Technical stack':'Tecnologías','Journey':'Trayectoria','Get in touch':'Hablemos','My contribution':'Mi contribución','Key implementation areas':'Áreas principales de implementación','Request flow':'Flujo de la solicitud','Goal':'Objetivo','Architecture':'Arquitectura','Quality and delivery':'Calidad y entrega',
      'A closer look at my background.':'Un vistazo más de cerca a mi trayectoria.','Education, technical skills, projects, and professional details in one document.':'Formación, habilidades técnicas, proyectos e información profesional en un solo documento.',
      'My journey in technology.':'Mi trayectoria en tecnología.','all repositories ↗':'todos los repositorios ↗'
    }
  };


  Object.assign(translations.pt, {
    '1º lugar no SENAI/SC ↗':'1º lugar no SENAI/SC ↗',
    'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.',
    'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.',
    'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose.',
    '"role"':'"role"','"name"':'"name"','"stack"':'"stack"','"foco"':'"foco"','"software that runs"':'"software funcional"',
    '[Python, PHP, Flask, REST APIs, business rules, authentication, RBAC]':'[Python, PHP, Flask, APIs REST, regras de negócio, autenticação, controle de acesso por função]',
    '[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, relational modeling]':'[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, modelagem relacional]',
    '[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]':'[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]',
    '[Pytest, Playwright, Ruff, GitHub Actions, documentation]':'[Pytest, Playwright, Ruff, GitHub Actions, documentação]',
    '[CSRF, rate limiting, 2FA, audit trails, secrets management]':'[CSRF, limite de requisições, 2FA, trilhas de auditoria, gestão de segredos]',
    '[Git, GitHub, C, VS Code, Linux CLI, environment setup]':'[Git, GitHub, C, VS Code, terminal Linux, configuração de ambiente]',
    '[HTML5, CSS3, JavaScript, responsive UI, accessibility, DOM, Git/GitHub]':'[HTML5, CSS3, JavaScript, interface responsiva, acessibilidade, DOM, Git/GitHub]',
    'pietro@dev': 'pietro@dev',
    '1º lugar no Projeto de Aprendizagem de Software':'1º lugar no Projeto de Aprendizagem de Software'
  });

  Object.assign(translations.en, {
    'runtime':'runtime','workflow':'workflow','status':'status','foco':'focus','"foco"':'"focus"','"software that runs"':'"software that runs"',
    '1º lugar no SENAI/SC ↗':'1st place at SENAI/SC ↗','1º lugar no SENAI/SC':'1st place at SENAI/SC',
    '1º lugar no Projeto de Aprendizagem de Software':'1st place in the Software Learning Project',
    'contato.sh':'contact.sh','currículo':'résumé','resume':'résumé','user_id':'user_id','joinville/sc':'Joinville, SC',
    'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'Full Stack CRM/ERP for repair shops, with service orders, customers, devices, inventory, finance, reports, and customer workflows.',
    'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Web interface connected to a Flask API for automated public-data lookups, with caching, browser automation, and MySQL persistence.',
    'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx, and Docker Compose.',
    'Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx, and Docker Compose.',
    'team':'team','solo':'solo','shipped':'shipped','active':'active','public':'public',
    '"name"':'"name"','"role"':'"role"','"stack"':'"stack"','"foco"':'"focus"',
    '[Python, PHP, Flask, APIs REST, regras de negócio, autenticação, controle de acesso por função]':'[Python, PHP, Flask, REST APIs, business rules, authentication, RBAC]',
    '[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, modelagem relacional]':'[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, relational modeling]',
    '[Pytest, Playwright, Ruff, GitHub Actions, documentação]':'[Pytest, Playwright, Ruff, GitHub Actions, documentation]',
    '[CSRF, limite de requisições, 2FA, trilhas de auditoria, gestão de segredos]':'[CSRF, rate limiting, 2FA, audit trails, secrets management]',
    '[Git, GitHub, C, VS Code, terminal Linux, configuração de ambiente]':'[Git, GitHub, C, VS Code, Linux CLI, environment setup]',
    '[HTML5, CSS3, JavaScript, interface responsiva, acessibilidade, DOM, Git/GitHub]':'[HTML5, CSS3, JavaScript, responsive UI, accessibility, DOM, Git/GitHub]',
    'todos os repositórios ↗':'all repositories ↗','contato.sh':'contact.sh','resume':'résumé','user_id':'user_id','joinville/sc':'Joinville, SC','Sobre mim':'About me','Projetos em destaque':'Featured projects','Stack técnica':'Technical stack','Trajetória':'Journey','Minha trajetória em tecnologia.':'A closer look at my background.',
    'Full Stack development in practice':'Full Stack development in practice','Pietro Tamanini':'Pietro Tamanini','localização':'location','joinville/sc':'Joinville, Brazil',
    'feito com HTML, CSS e JavaScript':'built with HTML, CSS and JavaScript','pietro@dev':'pietro@dev'
  });

  Object.assign(translations.es, {
    'I build web applications across the stack: responsive interfaces with HTML, CSS and JavaScript, backend services with Python/PHP, relational databases, integrations, testing, and deployment.':'Desarrollo aplicaciones web de principio a fin: interfaces adaptables con HTML, CSS y JavaScript, servicios backend con Python/PHP, bases de datos relacionales, integraciones, pruebas y despliegue.',
    'I develop web applications from end to end: responsive interfaces, application logic, APIs, relational databases, integrations, authentication, access control, automated tests, and deployment environments.':'Desarrollo aplicaciones web de principio a fin: interfaces adaptables, lógica de aplicación, API, bases de datos relacionales, integraciones, autenticación, control de acceso, pruebas automatizadas y entornos de despliegue.',
    'I enjoy taking a feature from idea to delivery: understanding requirements, shaping the interface, modeling data, implementing business rules, testing, documenting, deploying, and maintaining the system. I study Systems Analysis and Development at SENAI/SC and am looking for a junior Full Stack / Web Development opportunity.':'Me gusta llevar una funcionalidad desde la idea hasta la entrega: comprender requisitos, diseñar la interfaz, modelar datos, implementar reglas de negocio, probar, documentar, desplegar y mantener el sistema. Estudio Análisis y Desarrollo de Sistemas en SENAI/SC y busco una oportunidad júnior en desarrollo Full Stack o web.',
    '1º lugar no SENAI/SC ↗':'1.er puesto en SENAI/SC ↗','1º lugar no SENAI/SC':'1.er puesto en SENAI/SC','1º lugar no Projeto de Aprendizagem de Software':'1.er puesto en el Proyecto de Aprendizaje de Software','1º lugar no Projeto de Aprendizagem de Software':'1.er puesto en el Proyecto de Aprendizaje de Software',
    'CRM/ERP Full Stack para assistências técnicas, com ordens de serviço, clientes, equipamentos, estoque, financeiro, relatórios e fluxos para clientes.':'CRM/ERP Full Stack para talleres de reparación, con órdenes de servicio, clientes, equipos, inventario, finanzas, informes y flujos para clientes.',
    'Interface web integrada a uma API Flask para consultas automatizadas de dados públicos, com cache, automação de navegador e persistência em MySQL.':'Interfaz web conectada a una API Flask para consultas automatizadas de datos públicos, con caché, automatización del navegador y persistencia en MySQL.',
    'Pytest, Playwright, Ruff, health checks, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, comprobaciones de salud, Gunicorn, Nginx y Docker Compose.',
    'Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose.':'Pytest, Playwright, Ruff, comprobaciones de salud, Gunicorn, Nginx y Docker Compose.',
    'team':'equipo','solo':'individual','shipped':'entregado','active':'activo','public':'público','runtime':'entorno','workflow':'flujo de trabajo','status':'estado','foco':'enfoque','"foco"':'"enfoque"','"software that runs"':'"software funcional"',
    '"name"':'"nombre"','"role"':'"rol"','"stack"':'"tecnologías"','"Full Stack Developer"':'"Desarrollador Full Stack"',
    '[Python, PHP, Flask, REST APIs, business rules, authentication, RBAC]':'[Python, PHP, Flask, API REST, reglas de negocio, autenticación, control de acceso por roles]',
    '[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, relational modeling]':'[MySQL, MariaDB, SQLAlchemy, Alembic, PDO, modelado relacional]',
    '[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]':'[Linux, Docker, Docker Compose, Nginx, Gunicorn, Apache]',
    '[Pytest, Playwright, Ruff, GitHub Actions, documentation]':'[Pytest, Playwright, Ruff, GitHub Actions, documentación]',
    '[CSRF, rate limiting, 2FA, audit trails, secrets management]':'[CSRF, límite de solicitudes, 2FA, registros de auditoría, gestión de secretos]',
    '[Git, GitHub, C, VS Code, Linux CLI, environment setup]':'[Git, GitHub, C, VS Code, terminal de Linux, configuración del entorno]',
    '[HTML5, CSS3, JavaScript, responsive UI, accessibility, DOM, Git/GitHub]':'[HTML5, CSS3, JavaScript, interfaz adaptable, accesibilidad, DOM, Git/GitHub]',
    'todos os repositórios ↗':'todos los repositorios ↗','contato.sh':'contacto.sh','resume':'currículum','user_id':'id_usuario','joinville/sc':'Joinville, Brasil','Systems Analysis and Development':'Análisis y Desarrollo de Sistemas','main':'principal','current':'actual','Sobre mim':'Sobre mí','Projetos em destaque':'Proyectos destacados','Stack técnica':'Tecnologías','Trajetória':'Trayectoria','Minha trajetória em tecnologia.':'Mi trayectoria en tecnología.',
    'Full Stack development in practice':'Desarrollo Full Stack en la práctica','Pietro Tamanini':'Pietro Tamanini','localização':'ubicación','joinville/sc':'Joinville, Brasil',
    'feito com HTML, CSS e JavaScript':'hecho con HTML, CSS y JavaScript','built with HTML, CSS and JavaScript':'hecho con HTML, CSS y JavaScript','contato.sh':'contacto.sh','pietro@dev':'pietro@dev','[Python, PHP, Flask, APIs REST, regras de negócio, autenticação, controle de acesso por função]':'[Python, PHP, Flask, API REST, reglas de negocio, autenticación, control de acceso por roles]',
    '[Pytest, Playwright, Ruff, verificações de saúde, Gunicorn, Nginx e Docker Compose]':'[Pytest, Playwright, Ruff, comprobaciones de salud, Gunicorn, Nginx y Docker Compose]'
  });

  const translatedAttributes = {
    pt: {
      'Português (Brasil)':'Português (Brasil)','English (United States)':'Inglês (Estados Unidos)','Español':'Espanhol',
      'Abrir menu de navegação':'Abrir menu de navegação','Navegação principal':'Navegação principal',
      'Code editor with Pietro Tamanini’s technical profile':'Editor de código com o perfil técnico de Pietro Tamanini','Editor files':'Arquivos do editor','Professional snapshot':'Resumo profissional','Technical skills':'Competências técnicas','Engineering workflow':'Fluxo de trabalho de engenharia','Resume details':'Dados do currículo','Engineering principles':'Princípios de engenharia','Technical stack':'Stack técnica'
    },
    en: {
      'Início':'Home','Português (Brasil)':'Portuguese (Brazil)','English (United States)':'English (United States)','Español':'Spanish',
      'Selecionar idioma':'Select language','Navegação principal':'Main navigation','Abrir menu de navegação':'Open navigation menu','Fechar menu':'Close menu',
      'Pietro Tamanini':'Pietro Tamanini','Code editor with Pietro Tamanini’s technical profile':'Code editor with Pietro Tamanini’s technical profile','Editor files':'Editor files','Professional snapshot':'Professional snapshot','Technical skills':'Technical skills','Engineering workflow':'Engineering workflow','Resume details':'Résumé details','Engineering principles':'Engineering principles','Technical stack':'Technical stack'
    },
    es: {
      'Início':'Inicio','Português (Brasil)':'Portugués (Brasil)','English (United States)':'Inglés (Estados Unidos)','Español':'Español',
      'Selecionar idioma':'Seleccionar idioma','Navegação principal':'Navegación principal','Abrir menu de navegação':'Abrir menú de navegación','Fechar menu':'Cerrar menú',
      'Code editor with Pietro Tamanini’s technical profile':'Editor de código con el perfil técnico de Pietro Tamanini','Editor files':'Archivos del editor','Professional snapshot':'Resumen profesional','Technical skills':'Competencias técnicas','Engineering workflow':'Flujo de trabajo de ingeniería','Resume details':'Datos del currículum','Engineering principles':'Principios de ingeniería','Technical stack':'Tecnologías'
    }
  };

  const pageTitles = {
    pt: 'Desenvolvedor Full Stack Júnior | Pietro Tamanini',
    en: 'Pietro Tamanini | Junior Full Stack Developer',
    es: 'Pietro Tamanini | Desarrollador Full Stack Júnior'
  };
  const certificatePageTitles = {
    pt: 'Certificados de Cursos | Pietro Tamanini',
    en: 'Course Certificates | Pietro Tamanini',
    es: 'Certificados de Cursos | Pietro Tamanini'
  };
  const certificateDescriptions = {
    pt: 'Conheça 11 certificados de Pietro Tamanini em programação Python e Java, desenvolvimento web, bancos de dados, hardware e aplicações móveis.',
    en: 'Explore 11 course certificates held by Pietro Tamanini in Python and Java programming, web development, databases, IT hardware, and mobile apps.',
    es: 'Consulta 11 certificados de Pietro Tamanini sobre programación con Python y Java, desarrollo web, bases de datos, hardware y aplicaciones móviles.'
  };
  const descriptions = {
    pt: 'Portfólio de Pietro Ramos Tamanini, desenvolvedor Full Stack júnior em Joinville, SC. Projetos com JavaScript, Python, PHP, APIs, bancos de dados e Docker.',
    en: 'Portfolio of Pietro Tamanini, a junior Full Stack Developer in Joinville, Brazil. Projects using Python, PHP, JavaScript, APIs, databases, and Docker.',
    es: 'Portafolio Full Stack de Pietro Tamanini en Joinville, Brasil, con proyectos en Python, PHP, JavaScript, API REST, bases de datos, Docker y pruebas.'
  };
  const localizedJobTitles = {
    pt: 'Desenvolvedor Full Stack Júnior',
    en: 'Junior Full Stack Developer',
    es: 'Desarrollador Full Stack Júnior'
  };
  const localizedSiteNames = {
    pt: 'Pietro Tamanini | Desenvolvedor Full Stack Júnior',
    en: 'Pietro Tamanini | Junior Full Stack Developer',
    es: 'Pietro Tamanini | Desarrollador Full Stack Júnior'
  };

  // Cache original text/attributes once. Never use parent.textContent for translation,
  // because replacing child nodes breaks later language changes.
  const textNodes = [];
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,noscript,template,[data-no-translate]')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    node.__portfolioOriginal = node.nodeValue;
    textNodes.push(node);
  }

  const attributeNodes = [];
  document.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach((element) => {
    if (element.closest('[data-no-translate]')) return;
    ['aria-label', 'title', 'alt', 'placeholder'].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      attributeNodes.push({ element, attribute, original: element.getAttribute(attribute) });
    });
  });

  const translateNodeValue = (original, language, node = null) => {
    const leading = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    const phrase = original.trim();
    const dict = translations[language] || {};
    let result = Object.prototype.hasOwnProperty.call(dict, phrase) ? dict[phrase] : phrase;
    // Also support longer code/example lines that contain one translatable prose phrase.
    const inCode = Boolean(node?.parentElement?.closest('code,pre'));
    if (result === phrase && (language !== 'pt' || inCode)) {
      const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
      for (const [source, target] of entries) {
        if (source.length < (inCode ? 3 : 8) || !result.includes(source)) continue;
        result = result.split(source).join(target);
      }
    }
    return leading + result + trailing;
  };

  const applyLanguage = (language) => {
    if (!['pt', 'en', 'es'].includes(language)) language = 'pt';
    currentLanguage = language;
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;
    if (document.documentElement.dataset.staticLocale !== 'true') {
      textNodes.forEach((node) => {
        if (!node.isConnected) return;
        node.nodeValue = translateNodeValue(node.__portfolioOriginal, language, node);
      });
      attributeNodes.forEach(({ element, attribute, original }) => {
        if (!element.isConnected) return;
        const translated = (translations[language] || {})[original] || (translatedAttributes[language] || {})[original] || original;
        element.setAttribute(attribute, translated);
      });
    }
    const localizedTitle = isCertificatePage ? certificatePageTitles[language] : pageTitles[language];
    const localizedDescription = isCertificatePage ? certificateDescriptions[language] : descriptions[language];
    document.title = localizedTitle;
    const setMeta = (selector, content) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', localizedDescription);
    setMeta('meta[property="og:title"]', localizedTitle);
    setMeta('meta[property="og:description"]', localizedDescription);
    setMeta('meta[property="og:site_name"]', localizedSiteNames[language]);
    setMeta('meta[property="og:locale"]', language === 'pt' ? 'pt_BR' : language === 'en' ? 'en_US' : 'es_ES');
    setMeta('meta[property="og:image:alt"]', isCertificatePage ? `${language === 'en' ? 'Course certificates' : language === 'es' ? 'Certificados de cursos' : 'Certificados de cursos'} | Pietro Tamanini` : `${localizedJobTitles[language]} | Pietro Tamanini`);
    setMeta('meta[name="twitter:title"]', localizedTitle);
    setMeta('meta[name="twitter:description"]', localizedDescription);
    setMeta('meta[name="twitter:image:alt"]', isCertificatePage ? `${language === 'en' ? 'Course certificates' : language === 'es' ? 'Certificados de cursos' : 'Certificados de cursos'} | Pietro Tamanini` : `${localizedJobTitles[language]} | Pietro Tamanini`);

    // Keep structured data aligned with the language selected by the visitor.
    const structuredData = document.getElementById('seo-structured-data');
    if (structuredData) {
      try {
        const schema = JSON.parse(structuredData.textContent);
        (schema['@graph'] || []).forEach((entity) => {
          if (entity['@type'] === 'WebSite') {
            entity.name = localizedSiteNames[language];
            entity.description = descriptions[language];
            entity.inLanguage = language === 'pt' ? 'pt-BR' : language;
          } else if (entity['@type'] === 'ProfilePage') {
            entity.name = localizedTitle;
            entity.description = localizedDescription;
            entity.inLanguage = language === 'pt' ? 'pt-BR' : language;
          } else if (entity['@type'] === 'CollectionPage') {
            entity.name = localizedTitle;
            entity.description = localizedDescription;
            entity.inLanguage = language === 'pt' ? 'pt-BR' : language;
          } else if (entity['@type'] === 'Person') {
            entity.jobTitle = localizedJobTitles[language];
            entity.description = descriptions[language];
          }
        });
        structuredData.textContent = JSON.stringify(schema);
      } catch (_) { /* Keep the statically valid schema if parsing fails. */ }
    }

    $$('[data-set-language]').forEach((option) => {
      const active = option.dataset.setLanguage === language;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-pressed', String(active));
      option.setAttribute('aria-selected', String(active));
    });
    if (languageSwitcher) languageSwitcher.setAttribute('aria-label', languageGroupNames[language]);
    if (languageTrigger) languageTrigger.setAttribute('aria-label', languageNames[language]);
    if (languageMenu) languageMenu.setAttribute('aria-label', languageGroupNames[language]);
    if (currentLanguageFlag) currentLanguageFlag.textContent = languageFlags[language];
    projectDetails.forEach((details) => syncProjectDetails(details));
    try { localStorage.setItem('portfolio-language', language); } catch (_) { /* storage may be disabled */ }
  };

  const staticLocalePage = document.documentElement.dataset.staticLocale === 'true';
  // Use same-directory links so language switching also works when the site is
  // hosted under a project subpath (for example, GitHub Pages without a CNAME).
  const homeLanguageRoutes = { pt: 'index.html', en: 'en.html', es: 'es.html' };
  const certificateLanguageRoutes = { pt: 'certificados.html', en: 'certificates.html', es: 'certificados-es.html' };
  const isCertificatePage = /(?:^|\/)(?:certificados|certificates|certificados-es)\.html$/.test(window.location.pathname);
  const languageRoutes = isCertificatePage ? certificateLanguageRoutes : homeLanguageRoutes;

  $$('[data-set-language]').forEach((option) => {
    option.addEventListener('click', () => {
      const targetLanguage = option.dataset.setLanguage;
      setLanguageMenuOpen(false);
      if (staticLocalePage) {
        if (targetLanguage === currentLanguage) {
          languageTrigger?.focus({ preventScroll: true });
          return;
        }
        try { localStorage.setItem('portfolio-language', targetLanguage); } catch (_) { /* storage may be disabled */ }
        window.location.assign(new URL(languageRoutes[targetLanguage] || 'index.html', window.location.href).href);
        return;
      }
      applyLanguage(targetLanguage);
      languageTrigger?.focus({ preventScroll: true });
    });
  });

  // Keep the active-language trigger visible; the option list is opened on demand.
  if (languageSwitcher) {
    languageSwitcher.style.display = 'inline-flex';
    languageSwitcher.style.visibility = 'visible';
    languageSwitcher.style.opacity = '1';
  }
  setLanguageMenuOpen(false);
  const pageLanguage = document.documentElement.dataset.siteLocale || 'pt';
  try { localStorage.setItem('portfolio-language', pageLanguage); } catch (_) { /* storage may be disabled */ }
  applyLanguage(pageLanguage);

})();
