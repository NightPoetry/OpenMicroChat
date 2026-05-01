class SettingsModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.events.on('settings:show', (data) => {
      this.show(data);
    });
  }

  show(data) {
    const { type, contact } = data;

    const chatWindow = document.getElementById('chat-window');
    const emptyState = document.getElementById('empty-state');
    const settingsPage = document.getElementById('settings-page');

    if (chatWindow) chatWindow.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (settingsPage) settingsPage.style.display = 'flex';

    switch (type) {
      case 'user':
        this.renderUserSettings();
        break;
      case 'friend':
        this.renderFriendSettings(contact);
        break;
      case 'group':
        this.renderGroupSettings(contact);
        break;
    }
  }

  close() {
    const settingsPage = document.getElementById('settings-page');
    if (settingsPage) settingsPage.style.display = 'none';
    this.events.emit('settings:close');
  }

  renderBackButton(title) {
    return `
      <div class="settings-header">
        <button class="back-btn" id="settings-back-btn" aria-label="返回">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="settings-title">${this.escapeHtml(title)}</div>
      </div>
    `;
  }

  bindBackButton() {
    document.getElementById('settings-back-btn')?.addEventListener('click', () => this.close());
  }

  renderUserSettings() {
    const page = document.getElementById('settings-page');
    if (!page) return;

    const user = this.store.getState().user;
    const settings = this.store.getState().settings;

    const avatarContent = user?.avatar
      ? `<img src="${user.avatar}" alt="${user.username}">`
      : `<div style="width:72px;height:72px;border-radius:18px;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600">${(user?.username || 'U').charAt(0).toUpperCase()}</div>`;

    page.innerHTML = `
      ${this.renderBackButton('设置')}
      <div class="settings-content">
        <div class="settings-profile">
          <div class="settings-profile-avatar">${avatarContent}</div>
          <div class="settings-profile-name">${this.escapeHtml(user?.username || '用户')}</div>
          <div class="settings-profile-status">${user?.email || ''}</div>
        </div>

        <div class="settings-section">
          ${this.renderItem('个人资料', '修改头像、昵称和个人信息', 'profile')}
          ${this.renderDivider()}
          ${this.renderItem('账号安全', '修改密码和管理登录设备', 'security')}
        </div>

        <div class="settings-section">
          ${this.renderToggleItem('消息通知', settings.notifications !== false, 'notifications')}
          ${this.renderDivider()}
          ${this.renderThemeItem(settings.theme)}
        </div>

        <div class="settings-section">
          ${this.renderItem('关于', 'OpenMicroChat v1.0.0', 'about')}
        </div>
      </div>
    `;

    this.bindBackButton();
    this.bindSettingsActions();
  }

  renderFriendSettings(contact) {
    const page = document.getElementById('settings-page');
    if (!page) return;

    const avatarContent = contact.avatar
      ? `<img src="${contact.avatar}" alt="${contact.name}">`
      : `<div style="width:72px;height:72px;border-radius:18px;background:${this.getAvatarColor(contact.name)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600">${contact.name.charAt(0)}</div>`;

    page.innerHTML = `
      ${this.renderBackButton(contact.name)}
      <div class="settings-content">
        <div class="settings-profile">
          <div class="settings-profile-avatar">${avatarContent}</div>
          <div class="settings-profile-name">${this.escapeHtml(contact.name)}</div>
          <div class="settings-profile-status">${contact.isOnline ? '在线' : '离线'}</div>
        </div>

        <div class="settings-section">
          ${this.renderItem('发送消息', '开始与' + this.escapeHtml(contact.name) + '聊天', 'send-message')}
          ${this.renderDivider()}
          ${this.renderItem('设置备注', '添加个性化备注', 'set-remark')}
        </div>

        <div class="settings-section">
          ${this.renderItem('查看聊天记录', '浏览历史消息', 'chat-history')}
          ${this.renderDivider()}
          ${this.renderItem('清空聊天记录', '删除所有消息', 'clear-history', true)}
        </div>

        <div class="settings-section">
          ${this.renderItem('删除好友', '', 'delete-friend', true)}
        </div>
      </div>
    `;

    this.bindBackButton();
    this.bindFriendActions(contact);
  }

  renderGroupSettings(contact) {
    const page = document.getElementById('settings-page');
    if (!page) return;

    const avatarContent = contact.avatar
      ? `<img src="${contact.avatar}" alt="${contact.name}">`
      : `<div style="width:72px;height:72px;border-radius:18px;background:${this.getAvatarColor(contact.name)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">${contact.name.charAt(0)}</div>`;

    page.innerHTML = `
      ${this.renderBackButton(contact.name)}
      <div class="settings-content">
        <div class="settings-profile">
          <div class="settings-profile-avatar">${avatarContent}</div>
          <div class="settings-profile-name">${this.escapeHtml(contact.name)}</div>
          <div class="settings-profile-status">${contact.memberCount || '?'}名成员</div>
        </div>

        <div class="settings-section">
          ${this.renderItem('群成员', '管理群成员列表', 'members')}
          ${this.renderDivider()}
          ${this.renderItem('群公告', '查看和编辑群公告', 'announcement')}
          ${this.renderDivider()}
          ${this.renderItem('群通知设置', '管理群消息通知', 'group-notification')}
        </div>

        <div class="settings-section">
          ${this.renderItem('退出群聊', '', 'leave-group', true)}
        </div>
      </div>
    `;

    this.bindBackButton();
    this.bindGroupActions(contact);
  }

  renderItem(title, description, action, danger = false) {
    return `
      <div class="settings-item ${danger ? 'danger' : ''}" data-action="${action}">
        <div class="settings-item-info">
          <div class="settings-item-title">${title}</div>
          ${description ? `<div class="settings-item-description">${description}</div>` : ''}
        </div>
        <div class="settings-item-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  }

  renderToggleItem(title, checked, action) {
    return `
      <div class="settings-item" data-action="${action}">
        <div class="settings-item-info">
          <div class="settings-item-title">${title}</div>
        </div>
        <label class="switch">
          <input type="checkbox" ${checked ? 'checked' : ''} data-setting="${action}">
          <span class="slider"></span>
        </label>
      </div>
    `;
  }

  renderThemeItem(currentTheme) {
    return `
      <div class="settings-item" data-action="theme">
        <div class="settings-item-info">
          <div class="settings-item-title">深色模式</div>
        </div>
        <label class="switch">
          <input type="checkbox" ${currentTheme === 'dark' ? 'checked' : ''} data-setting="theme">
          <span class="slider"></span>
        </label>
      </div>
    `;
  }

  renderDivider() {
    return '<div class="settings-divider"></div>';
  }

  bindSettingsActions() {
    const page = document.getElementById('settings-page');
    if (!page) return;

    page.querySelectorAll('input[data-setting]').forEach(input => {
      input.addEventListener('change', (e) => {
        const setting = e.target.dataset.setting;
        if (setting === 'theme') {
          this.events.emit('theme:change', e.target.checked ? 'dark' : 'light');
        } else if (setting === 'notifications') {
          const settings = { ...this.store.getState().settings, notifications: e.target.checked };
          this.store.setState({ settings });
          this.storage.set('settings', settings);
        }
      });
    });
  }

  bindFriendActions(contact) {
    const page = document.getElementById('settings-page');
    if (!page) return;

    page.querySelectorAll('.settings-item[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        switch (action) {
          case 'send-message':
            this.close();
            break;
          case 'clear-history':
            if (confirm('确定要清空与' + contact.name + '的聊天记录吗？')) {
              const messages = { ...this.store.getState().messages };
              delete messages[contact.id];
              this.store.setState({ messages });
              this.storage.set('messages', messages);
              this.close();
            }
            break;
          case 'delete-friend':
            if (confirm('确定要删除好友' + contact.name + '吗？')) {
              const contacts = this.store.getState().contacts.filter(c => c.id !== contact.id);
              const messages = { ...this.store.getState().messages };
              delete messages[contact.id];
              this.store.setState({ contacts, messages, currentContact: null });
              this.storage.set('contacts', contacts);
              this.storage.set('messages', messages);
              this.events.emit('contacts:update');
              this.close();
              const emptyState = document.getElementById('empty-state');
              const settingsPage = document.getElementById('settings-page');
              if (emptyState) emptyState.style.display = 'flex';
              if (settingsPage) settingsPage.style.display = 'none';
            }
            break;
        }
      });
    });
  }

  bindGroupActions(contact) {
    const page = document.getElementById('settings-page');
    if (!page) return;

    page.querySelectorAll('.settings-item[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'leave-group') {
          if (confirm('确定要退出群聊' + contact.name + '吗？')) {
            const contacts = this.store.getState().contacts.filter(c => c.id !== contact.id);
            const messages = { ...this.store.getState().messages };
            delete messages[contact.id];
            this.store.setState({ contacts, messages, currentContact: null });
            this.storage.set('contacts', contacts);
            this.storage.set('messages', messages);
            this.events.emit('contacts:update');
            this.close();
            const emptyState = document.getElementById('empty-state');
            const settingsPage = document.getElementById('settings-page');
            if (emptyState) emptyState.style.display = 'flex';
            if (settingsPage) settingsPage.style.display = 'none';
          }
        }
      });
    });
  }

  getAvatarColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length];
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export default SettingsModule;
