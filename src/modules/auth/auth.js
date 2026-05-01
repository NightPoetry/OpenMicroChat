class AuthModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
  }

  init() {
    this.renderAuthUI();
    this.checkExistingSession();
    this.bindAvatarButton();
  }

  checkExistingSession() {
    const token = this.storage.get('auth_token');
    const user = this.storage.get('user');
    if (token && user && this.isTokenValid(token)) {
      this.events.emit('auth:login', user);
    }
  }

  isTokenValid(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  renderAuthUI() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="auth-card" id="auth-card">
        <h2>OpenMicroChat</h2>
        <p class="auth-subtitle">登录以开始聊天</p>
        <div class="form-group">
          <label for="auth-username">用户名</label>
          <input type="text" id="auth-username" class="form-input" placeholder="请输入用户名" autocomplete="username">
        </div>
        <div class="form-group">
          <label for="auth-password">密码</label>
          <input type="password" id="auth-password" class="form-input" placeholder="请输入密码" autocomplete="current-password">
        </div>
        <div class="auth-actions">
          <button class="btn btn-primary" id="auth-login-btn">登录</button>
          <button class="btn btn-ghost" id="auth-register-btn">没有账号？注册</button>
        </div>
        <div class="auth-divider">或</div>
        <button class="btn btn-ghost" id="auth-demo-btn" style="width:100%">体验模式（无需注册）</button>
      </div>
    `;

    this.bindAuthEvents();
  }

  renderRegisterUI() {
    const card = document.getElementById('auth-card');
    if (!card) return;

    card.innerHTML = `
      <h2>创建账号</h2>
      <p class="auth-subtitle">注册以使用完整功能</p>
      <div class="form-group">
        <label for="reg-username">用户名</label>
        <input type="text" id="reg-username" class="form-input" placeholder="请输入用户名" autocomplete="username">
      </div>
      <div class="form-group">
        <label for="reg-email">邮箱</label>
        <input type="email" id="reg-email" class="form-input" placeholder="请输入邮箱" autocomplete="email">
      </div>
      <div class="form-group">
        <label for="reg-password">密码</label>
        <input type="password" id="reg-password" class="form-input" placeholder="请输入密码" autocomplete="new-password">
      </div>
      <div class="auth-actions">
        <button class="btn btn-primary" id="reg-submit-btn">注册</button>
        <button class="btn btn-ghost" id="reg-back-btn">返回登录</button>
      </div>
    `;

    document.getElementById('reg-submit-btn').addEventListener('click', () => this.handleRegister());
    document.getElementById('reg-back-btn').addEventListener('click', () => this.renderAuthUI());

    document.getElementById('reg-username')?.focus();

    card.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleRegister();
      });
    });
  }

  bindAuthEvents() {
    document.getElementById('auth-login-btn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('auth-register-btn')?.addEventListener('click', () => this.renderRegisterUI());
    document.getElementById('auth-demo-btn')?.addEventListener('click', () => this.events.emit('auth:demo'));

    document.getElementById('auth-username')?.focus();

    document.querySelectorAll('#auth-card .form-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });
  }

  async handleLogin() {
    const username = document.getElementById('auth-username')?.value?.trim();
    const password = document.getElementById('auth-password')?.value;

    if (!username || !password) {
      this.showError('请输入用户名和密码');
      return;
    }

    const btn = document.getElementById('auth-login-btn');
    if (btn) btn.textContent = '登录中...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        this.storage.set('auth_token', data.token);
        this.storage.set('user', data.user);
        this.events.emit('auth:login', data.user);
      } else {
        this.showError(data.error || '登录失败');
      }
    } catch {
      this.showError('无法连接服务器，请检查服务是否启动');
    }

    if (btn) btn.textContent = '登录';
  }

  async handleRegister() {
    const username = document.getElementById('reg-username')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const password = document.getElementById('reg-password')?.value;

    if (!username || !email || !password) {
      this.showError('请填写所有字段');
      return;
    }

    const btn = document.getElementById('reg-submit-btn');
    if (btn) btn.textContent = '注册中...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (data.success) {
        this.storage.set('auth_token', data.token);
        this.storage.set('user', data.user);
        this.events.emit('auth:login', data.user);
      } else {
        this.showError(data.error || '注册失败');
      }
    } catch {
      this.showError('无法连接服务器，请检查服务是否启动');
    }

    if (btn) btn.textContent = '注册';
  }

  showError(msg) {
    let errEl = document.querySelector('.auth-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'auth-error';
      errEl.style.cssText = 'color:var(--color-danger);font-size:13px;text-align:center;margin-top:12px';
      document.getElementById('auth-card')?.appendChild(errEl);
    }
    errEl.textContent = msg;
    setTimeout(() => errEl.remove(), 4000);
  }

  bindAvatarButton() {
    document.getElementById('user-avatar-btn')?.addEventListener('click', () => {
      this.showUserMenu();
    });
  }

  showUserMenu() {
    const user = this.store.getState().user;
    if (!user) return;

    const isDemo = this.store.getState().isDemo;
    const avatarContent = user.avatar
      ? `<img src="${user.avatar}" alt="${user.username}">`
      : `<div style="width:80px;height:80px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600">${(user.username || 'U').charAt(0).toUpperCase()}</div>`;

    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
      <div class="user-menu-card">
        <button class="user-menu-close" id="user-menu-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="user-menu-avatar">${avatarContent}</div>
        <div class="user-menu-name">${user.username || '用户'}</div>
        <div class="user-menu-email">${user.email || (isDemo ? '体验模式' : '')}</div>
        <div class="user-menu-actions">
          ${isDemo ? '' : '<button class="btn btn-ghost" id="user-menu-settings">用户设置</button>'}
          <button class="btn btn-ghost" id="user-menu-theme">切换主题</button>
          <button class="btn btn-danger" id="user-menu-logout">${isDemo ? '退出体验' : '退出登录'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(menu);

    menu.querySelector('#user-menu-close').addEventListener('click', () => menu.remove());
    menu.addEventListener('click', (e) => {
      if (e.target === menu) menu.remove();
    });

    menu.querySelector('#user-menu-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.events.emit('theme:change', next);
      menu.remove();
    });

    menu.querySelector('#user-menu-logout')?.addEventListener('click', () => {
      this.storage.remove('auth_token');
      this.storage.remove('user');
      this.storage.remove('contacts');
      this.storage.remove('messages');
      this.events.emit('auth:logout');
      this.renderAuthUI();
      menu.remove();
    });

    menu.querySelector('#user-menu-settings')?.addEventListener('click', () => {
      this.events.emit('settings:show', { type: 'user' });
      menu.remove();
    });
  }
}

export default AuthModule;
