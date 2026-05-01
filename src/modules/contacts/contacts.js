import { formatRelativeTime } from '../utils/data.js';

class ContactsModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
    this.searchTerm = '';
    this.longPressTimer = null;
    this.touchStartPos = null;
  }

  init() {
    this.bindEvents();
    this.bindSearch();
  }

  bindEvents() {
    this.events.on('contacts:update', () => this.render());
    this.events.on('contact:select', (contact) => this.setActive(contact));
    this.events.on('auth:login', () => this.render());
    this.events.on('auth:demo', () => this.render());
  }

  bindSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;

    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.searchTerm = input.value.trim().toLowerCase();
        this.render();
      }, 200);
    });
  }

  render() {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    list.innerHTML = '';
    const isDemo = this.store.getState().isDemo;

    if (!isDemo) {
      const addBtn = document.createElement('div');
      addBtn.className = 'add-friend-button';
      addBtn.setAttribute('role', 'button');
      addBtn.setAttribute('tabindex', '0');
      addBtn.innerHTML = `
        <div class="add-friend-icon">+</div>
        <span class="add-friend-text">添加好友</span>
      `;
      addBtn.addEventListener('click', () => this.showAddFriendDialog());
      list.appendChild(addBtn);
    }

    let contacts = [...this.store.getState().contacts];

    // Tag filter (AND logic — intersection)
    const selectedTags = this.store.getState().selectedTags || [];
    if (selectedTags.length > 0) {
      const subFilter = this.store.getState().tagSubFilter;
      if (subFilter && subFilter.contacts) {
        contacts = contacts.filter(c => subFilter.contacts.includes(c.id));
      } else {
        contacts = contacts.filter(c =>
          selectedTags.every(tagId => c.tags?.includes(tagId))
        );
      }
    }

    // Text search
    if (this.searchTerm) {
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(this.searchTerm) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(this.searchTerm))
      );
    }

    if (contacts.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:40px 20px;color:var(--color-text-secondary);font-size:13px';
      empty.textContent = (this.searchTerm || selectedTags.length > 0)
        ? '没有找到匹配的联系人'
        : (isDemo ? '暂无联系人' : '还没有联系人，点击上方添加好友');
      list.appendChild(empty);
      return;
    }

    const currentContact = this.store.getState().currentContact;
    const allTags = this.store.getState().tags || [];

    contacts.forEach((contact, index) => {
      const item = document.createElement('div');
      item.className = 'contact-item fade-in';
      item.style.animationDelay = `${index * 30}ms`;
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.dataset.contactId = contact.id;

      if (currentContact && currentContact.id === contact.id) {
        item.classList.add('active');
      }

      const avatarHtml = contact.avatar
        ? `<img src="${contact.avatar}" alt="${contact.name}">`
        : `<div style="width:100%;height:100%;border-radius:10px;background:${this.getAvatarColor(contact.name)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:18px">${contact.name.charAt(0)}</div>`;

      const timeStr = contact.lastMessageTime
        ? formatRelativeTime(contact.lastMessageTime)
        : '';

      // Tag dots
      const contactTags = (contact.tags || [])
        .map(tid => allTags.find(t => t.id === tid))
        .filter(Boolean);
      const dotsHtml = contactTags.length > 0
        ? `<div class="contact-tag-dots">${contactTags.map(t => `<span class="tag-dot" style="background:${t.color}"></span>`).join('')}</div>`
        : '';

      item.innerHTML = `
        <div class="contact-avatar">
          ${avatarHtml}
          ${contact.isOnline ? '<span class="online-indicator"></span>' : ''}
        </div>
        <div class="contact-info">
          <div class="contact-name-row">
            <span class="contact-name">${this.escapeHtml(contact.name)}</span>
            ${dotsHtml}
          </div>
          ${contact.lastMessage ? `<div class="last-message">${this.escapeHtml(contact.lastMessage)}</div>` : ''}
        </div>
        <div class="contact-meta">
          ${timeStr ? `<span class="message-time">${timeStr}</span>` : ''}
          ${contact.unreadCount ? `<span class="unread-count">${contact.unreadCount > 99 ? '99+' : contact.unreadCount}</span>` : ''}
        </div>
      `;

      // Click to select
      item.addEventListener('click', () => {
        this.events.emit('contact:select', contact);
      });

      // Long-press to show tag sheet
      this.bindLongPress(item, contact);

      list.appendChild(item);
    });
  }

  bindLongPress(element, contact) {
    let timer = null;
    let startX = 0, startY = 0;
    let fired = false;

    const start = (x, y) => {
      startX = x;
      startY = y;
      fired = false;
      element.style.transition = 'transform 200ms ease';
      timer = setTimeout(() => {
        fired = true;
        element.style.transform = 'scale(0.97)';
        setTimeout(() => { element.style.transform = ''; }, 150);
        this.showTagSheet(contact, element);
      }, 500);
    };

    const cancel = () => {
      clearTimeout(timer);
      element.style.transform = '';
    };

    const move = (x, y) => {
      if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) {
        cancel();
      }
    };

    element.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
    element.addEventListener('mouseup', cancel);
    element.addEventListener('mouseleave', cancel);
    element.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));

    element.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });
    element.addEventListener('touchend', (e) => {
      cancel();
      if (fired) e.preventDefault();
    });
    element.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });
  }

  showTagSheet(contact, anchor) {
    // Remove existing
    document.querySelector('.tag-sheet-overlay')?.remove();

    const allTags = this.store.getState().tags || [];
    const contactTags = contact.tags || [];

    const overlay = document.createElement('div');
    overlay.className = 'tag-sheet-overlay';

    const rect = anchor.getBoundingClientRect();
    const sheetX = Math.min(rect.left, window.innerWidth - 260);
    const sheetY = rect.bottom + 4;

    overlay.innerHTML = `
      <div class="tag-sheet" style="left:${sheetX}px;top:${sheetY}px">
        <div class="tag-sheet-title">标签</div>
        <div class="tag-sheet-list">
          ${allTags.map(tag => {
            const active = contactTags.includes(tag.id);
            return `
              <button class="tag-sheet-item ${active ? 'active' : ''}" data-tag-id="${tag.id}" style="--tag-color:${tag.color}">
                <span class="tag-sheet-dot"></span>
                <span>${tag.name}</span>
                ${active ? '<span class="tag-sheet-check">✓</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); return; }
      const btn = e.target.closest('.tag-sheet-item');
      if (!btn) return;

      const tagId = btn.dataset.tagId;
      this.toggleContactTag(contact, tagId);
      overlay.remove();
    });
  }

  toggleContactTag(contact, tagId) {
    const contacts = this.store.getState().contacts.map(c => {
      if (c.id !== contact.id) return c;
      const tags = c.tags ? [...c.tags] : [];
      const idx = tags.indexOf(tagId);
      if (idx >= 0) tags.splice(idx, 1);
      else tags.push(tagId);
      return { ...c, tags };
    });

    this.store.setState({ contacts });
    this.storage.set('contacts', contacts);
    this.render();
    this.events.emit('tags:render');
  }

  setActive(contact) {
    document.querySelectorAll('.contact-item').forEach(item => {
      item.classList.toggle('active', item.dataset.contactId === contact.id);
    });
  }

  clear() {
    const list = document.getElementById('contacts-list');
    if (list) list.innerHTML = '';
  }

  getAvatarColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length];
  }

  generateAvatarSvg(name) {
    const color = this.getAvatarColor(name);
    const svg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" fill="${color}" rx="25"/><text x="25" y="32" font-size="20" text-anchor="middle" fill="white" font-weight="bold">${name.charAt(0).toUpperCase()}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  showAddFriendDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-card">
        <h3>添加好友</h3>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" class="form-input" id="add-friend-username" placeholder="请输入对方的用户名" autocomplete="off">
        </div>
        <div class="form-group">
          <label>验证消息</label>
          <input type="text" class="form-input" id="add-friend-message" placeholder="你好，我想添加你为好友" autocomplete="off">
        </div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" id="add-friend-cancel">取消</button>
          <button class="btn btn-primary" id="add-friend-confirm">发送请求</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#add-friend-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#add-friend-confirm').addEventListener('click', () => {
      const username = document.getElementById('add-friend-username')?.value?.trim();
      if (!username) return;
      this.sendFriendRequest(username);
      overlay.remove();
    });
    document.getElementById('add-friend-username')?.focus();
  }

  sendFriendRequest(username) {
    const newContact = {
      id: Date.now().toString(),
      name: username,
      avatar: this.generateAvatarSvg(username),
      isOnline: false,
      lastMessage: '',
      lastMessageTime: null,
      unreadCount: 0,
      type: 'personal',
      tags: []
    };

    const contacts = [...this.store.getState().contacts, newContact];
    this.store.setState({ contacts });
    this.storage.set('contacts', contacts);
    this.render();
  }
}

export default ContactsModule;
