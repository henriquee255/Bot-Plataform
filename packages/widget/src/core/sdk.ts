import { WidgetAPI } from './api';
import { WidgetSocket } from './socket-client';
import { getSessionToken, setSessionToken, setContactId, getContactId } from './storage';
import { getWidgetCSS } from '../ui/styles';

interface WidgetConfig {
  key: string;
  serverUrl?: string;
}

interface Message {
  id: string;
  sender_type: 'agent' | 'contact' | 'system';
  content: string | null;
  created_at: string;
}

export class Widget {
  private config: WidgetConfig;
  private api: WidgetAPI;
  private socket: WidgetSocket;
  private sessionToken: string | null = null;
  private contactId: string | null = null;
  private conversationId: string | null = null;
  private companyConfig: any = {};
  private isOpen = false;
  private unreadCount = 0;
  private guideOpen = false;
  private guidePanel: HTMLElement | null = null;

  // DOM refs
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private frame: HTMLElement | null = null;
  private launcher: HTMLButtonElement | null = null;
  private badge: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private input: HTMLTextAreaElement | null = null;
  private typingEl: HTMLElement | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: WidgetConfig) {
    this.config = config;
    let serverUrl = config.serverUrl || 'http://localhost:3001';
    // Remove trailing /api or / to normalize
    serverUrl = serverUrl.replace(/\/api$/, '').replace(/\/$/, '');
    this.api = new WidgetAPI(`${serverUrl}/api`);
    this.socket = new WidgetSocket();
  }

  async boot() {
    console.log('[ChatWidget] Booting...');
    try {
      const existingToken = getSessionToken();
      console.log('[ChatWidget] Existing token:', existingToken);

      const sessionRes = await this.api.initSession({
        widgetKey: this.config.key,
        sessionToken: existingToken,
        domain: window.location.hostname,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      });

      console.log('[ChatWidget] Session initialized:', sessionRes.contactId);
      this.sessionToken = sessionRes.sessionToken;
      this.contactId = sessionRes.contactId;
      this.companyConfig = sessionRes.config || {};
      setSessionToken(this.sessionToken);

      console.log('[ChatWidget] Injecting UI...');
      this.injectUI();

      console.log('[ChatWidget] Connecting socket...');
      this.connectSocket();

      this.trackNavigation();
      console.log('[ChatWidget] Boot complete');
    } catch (e) {
      console.error('[ChatWidget] Boot failed:', e);
    }
  }

  private injectUI() {
    this.host = document.createElement('div');
    this.host.id = 'cw-host';
    document.body.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = getWidgetCSS(
      this.companyConfig.primaryColor || '#6366f1',
      this.companyConfig.position || 'bottom-right',
    );
    this.shadow.appendChild(style);

    // Container for launcher and balloon
    const container = document.createElement('div');
    container.id = 'cw-launcher-container';
    this.shadow.appendChild(container);

    // Balloon
    const balloon = document.createElement('div');
    balloon.id = 'cw-balloon';
    balloon.textContent = this.companyConfig.balloonText || 'Dúvidas? Fale conosco!';
    if (!this.companyConfig.balloonText) balloon.classList.add('hidden');
    container.appendChild(balloon);

    // Launcher bubble
    this.launcher = document.createElement('button');
    this.launcher.id = 'cw-launcher';
    this.launcher.setAttribute('aria-label', 'Abrir chat');
    this.launcher.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    `;

    this.badge = document.createElement('span');
    this.badge.id = 'cw-badge';
    this.badge.className = 'hidden';
    this.launcher.appendChild(this.badge);

    const toggleChat = () => {
      this.toggle();
      balloon.classList.add('hidden');
    };

    this.launcher.addEventListener('click', toggleChat);
    balloon.addEventListener('click', toggleChat);
    container.appendChild(this.launcher);

    // Frame
    this.frame = document.createElement('div');
    this.frame.id = 'cw-frame';
    this.frame.className = 'hidden';
    this.frame.setAttribute('role', 'dialog');
    this.frame.setAttribute('aria-label', 'Chat de suporte');
    this.shadow.appendChild(this.frame);

    this.renderFrame();
  }

  private renderFrame() {
    if (!this.frame) return;

    const welcomeMsg = this.companyConfig.welcomeMessage || 'Como posso ajudar?';

    const companyName = this.companyConfig.companyName || 'Suporte';
    this.frame.innerHTML = `
      <div id="cw-header">
        <div id="cw-header-avatar">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
        <div id="cw-header-text">
          <h3>${companyName}</h3>
          <p>${welcomeMsg}</p>
        </div>
        <button id="cw-guide-btn" aria-label="Artigos de ajuda" title="Base de Conhecimento">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
        </button>
        <button id="cw-close" aria-label="Fechar">✕</button>
      </div>
    `;

    this.shadow?.querySelector('#cw-close')?.addEventListener('click', () => this.close());
    this.shadow?.querySelector('#cw-guide-btn')?.addEventListener('click', () => this.toggleGuide());

    if (!this.contactId) {
      this.renderIdentityForm();
    } else {
      this.renderConversation();
    }
  }

  private renderIdentityForm() {
    if (!this.frame) return;

    const requestName = this.companyConfig.requestName !== false;
    const requestEmail = this.companyConfig.requestEmail !== false;

    // If both are disabled, skip form
    if (!requestName && !requestEmail) {
      this.renderConversation();
      return;
    }

    const form = document.createElement('div');
    form.id = 'cw-identity';
    form.innerHTML = `
      <h3>Boas-vindas!</h3>
      <p>Como podemos te chamar?</p>
      ${requestName ? `
        <div class="cw-field">
          <label for="cw-name">Seu nome</label>
          <input type="text" id="cw-name" placeholder="Ex: João Silva" />
        </div>
      ` : ''}
      ${requestEmail ? `
        <div class="cw-field">
          <label for="cw-email">Email corporativo</label>
          <input type="email" id="cw-email" placeholder="nome@empresa.com" required />
        </div>
      ` : ''}
      <button id="cw-start-btn">Começar Chat →</button>
    `;
    this.frame?.appendChild(form);

    const btn = form.querySelector('#cw-start-btn') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      const emailInput = form.querySelector('#cw-email') as HTMLInputElement | null;
      const nameInput = form.querySelector('#cw-name') as HTMLInputElement | null;

      const email = emailInput?.value.trim() || `anon-${Math.random().toString(36).slice(-6)}@visitante.com`;
      const name = nameInput?.value.trim();

      if (requestEmail && !emailInput?.value) {
        emailInput?.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Iniciando...';

      try {
        if (!this.sessionToken) throw new Error('No session');
        const res = await this.api.identify(this.sessionToken, email, name || undefined);
        this.contactId = res.contactId;
        setContactId(this.contactId);

        form.remove();
        await this.renderConversation();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Erro ao conectar';
      }
    });
  }

  private async renderConversation() {
    if (!this.frame || !this.sessionToken) return;

    // Get or create conversation
    const { conversation } = await this.api.getConversation(this.sessionToken);
    if (conversation) {
      this.conversationId = conversation.id;
      this.socket.joinConversation(this.conversationId);

      // Load messages
      const messages = await this.api.getMessages(this.conversationId, this.sessionToken);

      // Messages area
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.id = 'cw-messages';
      messages.forEach((m: Message) => this.appendMessage(m));
      this.frame.appendChild(this.messagesContainer);
      this.scrollToBottom();
    }

    // Typing indicator
    this.typingEl = document.createElement('div');
    this.typingEl.id = 'cw-typing';
    this.typingEl.innerHTML = '<span></span><span></span><span></span>';
    this.frame.appendChild(this.typingEl);

    // Composer
    const composer = document.createElement('div');
    composer.id = 'cw-composer';
    composer.innerHTML = `
      <textarea id="cw-input" placeholder="Escreva uma mensagem..." rows="1"></textarea>
      <button id="cw-send" aria-label="Enviar">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    `;
    this.frame.appendChild(composer);

    this.input = composer.querySelector('#cw-input') as HTMLTextAreaElement;
    const sendBtn = composer.querySelector('#cw-send') as HTMLButtonElement;

    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.input.addEventListener('input', () => {
      if (this.conversationId) {
        this.socket.sendTypingStart(this.conversationId);
        if (this.typingTimer) clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
          if (this.conversationId) this.socket.sendTypingStop(this.conversationId);
        }, 2000);
      }
      // Auto-resize
      this.input!.style.height = 'auto';
      this.input!.style.height = `${this.input!.scrollHeight}px`;
    });

    sendBtn.addEventListener('click', () => this.sendMessage());
  }

  private appendMessage(msg: Message) {
    if (!this.messagesContainer) return;

    const el = document.createElement('div');
    const isAgent = msg.sender_type === 'agent';
    const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    el.className = `cw-msg ${isAgent ? 'cw-msg-agent' : 'cw-msg-contact'}`;
    el.innerHTML = `
      <div>${this.escapeHtml(msg.content || '')}</div>
      <div class="cw-msg-time">${time}</div>
    `;
    el.style.alignSelf = isAgent ? 'flex-end' : 'flex-start';
    el.dataset.id = msg.id;
    this.messagesContainer.appendChild(el);
    this.scrollToBottom();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  private async sendMessage() {
    if (!this.input || !this.conversationId || !this.sessionToken) return;
    const content = this.input.value.trim();
    if (!content) return;

    this.input.value = '';
    this.input.style.height = 'auto';

    // Optimistic
    const tempMsg: Message = {
      id: `tmp-${Date.now()}`,
      sender_type: 'contact',
      content,
      created_at: new Date().toISOString(),
    };
    this.appendMessage(tempMsg);

    try {
      await this.api.sendMessage(this.conversationId, this.sessionToken, content);
    } catch {
      // Could show error state on the message
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private connectSocket() {
    if (!this.sessionToken) return;
    const serverUrl = this.config.serverUrl || 'http://localhost:3001';
    this.socket.connect(serverUrl, this.sessionToken);

    this.socket.on('message:new', ({ message }: { message: Message }) => {
      if (message.sender_type === 'agent') {
        this.appendMessage(message);
        if (!this.isOpen) {
          this.unreadCount++;
          this.updateBadge();
        }
      }
    });

    this.socket.on('agent:typing', ({ isTyping }: { isTyping: boolean }) => {
      if (this.typingEl) {
        this.typingEl.className = isTyping ? 'visible' : '';
        if (isTyping) this.scrollToBottom();
      }
    });
  }

  private trackNavigation() {
    const update = () => {
      // SPA navigation tracking
    };
    window.addEventListener('popstate', update);
    const orig = history.pushState.bind(history);
    history.pushState = (...args) => {
      orig(...args);
      update();
    };
  }

  private updateBadge() {
    if (!this.badge) return;
    if (this.unreadCount > 0) {
      this.badge.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount);
      this.badge.className = '';
      this.launcher?.classList.add('cw-pulse');
    } else {
      this.badge.className = 'hidden';
      this.launcher?.classList.remove('cw-pulse');
    }
  }

  private async toggleGuide() {
    this.guideOpen = !this.guideOpen;

    // Hide/show chat content
    const messagesEl = this.shadow?.querySelector('#cw-messages') as HTMLElement | null;
    const composerEl = this.shadow?.querySelector('#cw-composer') as HTMLElement | null;
    const identityEl = this.shadow?.querySelector('#cw-identity') as HTMLElement | null;
    const typingEl = this.shadow?.querySelector('#cw-typing') as HTMLElement | null;

    if (this.guideOpen) {
      if (messagesEl) messagesEl.style.display = 'none';
      if (composerEl) composerEl.style.display = 'none';
      if (identityEl) identityEl.style.display = 'none';
      if (typingEl) typingEl.style.display = 'none';
      await this.renderGuide();
    } else {
      if (this.guidePanel) { this.guidePanel.remove(); this.guidePanel = null; }
      if (messagesEl) messagesEl.style.display = '';
      if (composerEl) composerEl.style.display = '';
      if (identityEl) identityEl.style.display = '';
      if (typingEl) typingEl.style.display = '';
    }
  }

  private async renderGuide() {
    if (!this.frame) return;
    if (this.guidePanel) this.guidePanel.remove();

    this.guidePanel = document.createElement('div');
    this.guidePanel.id = 'cw-guide';
    this.guidePanel.innerHTML = `
      <div id="cw-guide-search">
        <input id="cw-guide-q" type="text" placeholder="Buscar artigos..." />
      </div>
      <div id="cw-guide-list">
        <div class="cw-guide-empty">Carregando artigos...</div>
      </div>
    `;
    this.frame.appendChild(this.guidePanel);

    const listEl = this.guidePanel.querySelector('#cw-guide-list') as HTMLElement;
    const searchInput = this.guidePanel.querySelector('#cw-guide-q') as HTMLInputElement;

    const loadArticles = async (q?: string) => {
      listEl.innerHTML = '<div class="cw-guide-empty">Carregando...</div>';
      const articles = await this.api.getArticles(this.config.key, q);
      if (!articles || articles.length === 0) {
        listEl.innerHTML = '<div class="cw-guide-empty">Nenhum artigo encontrado</div>';
        return;
      }
      listEl.innerHTML = '';
      articles.forEach((article: any) => {
        const el = document.createElement('div');
        el.className = 'cw-article';
        el.innerHTML = `
          <div class="cw-article-title">${this.escapeHtml(article.title || '')}</div>
          <div class="cw-article-excerpt">${this.escapeHtml(article.excerpt || article.content?.slice(0, 120) || '')}</div>
        `;
        el.addEventListener('click', () => this.showArticle(article, listEl));
        listEl.appendChild(el);
      });
    };

    await loadArticles();

    let searchTimer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadArticles(searchInput.value.trim() || undefined), 400);
    });
  }

  private showArticle(article: any, listEl: HTMLElement) {
    listEl.innerHTML = `
      <button class="cw-guide-back">← Voltar</button>
      <div style="padding: 4px 0 12px">
        <div class="cw-article-title" style="font-size:15px;margin-bottom:8px">${this.escapeHtml(article.title || '')}</div>
        <div class="cw-article-content">${this.escapeHtml(article.content || '')}</div>
      </div>
    `;
    listEl.querySelector('.cw-guide-back')?.addEventListener('click', () => {
      if (this.guidePanel) {
        this.guidePanel.remove();
        this.guidePanel = null;
        this.renderGuide();
      }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.frame?.classList.remove('hidden');
    this.unreadCount = 0;
    this.updateBadge();
    this.input?.focus();
  }

  close() {
    this.isOpen = false;
    this.frame?.classList.add('hidden');
  }
}
