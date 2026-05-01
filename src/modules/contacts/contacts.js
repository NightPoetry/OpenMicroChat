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
    let ring = null;

    const DURATION = 500;
    const CIRCUMFERENCE = 2 * Math.PI * 23; // r=23

    const showRing = (clientX, clientY) => {
      ring?.remove();
      const rect = element.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('long-press-ring');
      svg.setAttribute('width', '52');
      svg.setAttribute('height', '52');
      svg.setAttribute('viewBox', '0 0 52 52');
      svg.style.left = `${relX - 26}px`;
      svg.style.top = `${relY - 26}px`;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '26');
      circle.setAttribute('cy', '26');
      circle.setAttribute('r', '23');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'var(--color-accent)');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('stroke-linecap', 'round');
      circle.setAttribute('stroke-dasharray', CIRCUMFERENCE);
      circle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
      circle.style.transform = 'rotate(-90deg)';
      circle.style.transformOrigin = '26px 26px';
      circle.style.animation = `long-press-ring ${DURATION}ms linear forwards`;
      svg.appendChild(circle);
      element.appendChild(svg);
      ring = svg;
    };

    const removeRing = (immediate) => {
      if (!ring) return;
      const el = ring;
      ring = null;
      if (immediate) { el.remove(); return; }
      el.style.transition = 'opacity 150ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 150);
    };

    const start = (x, y) => {
      startX = x;
      startY = y;
      fired = false;
      element.style.transition = 'transform 200ms ease';
      showRing(x, y);
      timer = setTimeout(() => {
        fired = true;
        removeRing(false);
        element.style.transform = 'scale(0.97)';
        setTimeout(() => { element.style.transform = ''; }, 150);
        this.showTagSheet(contact, startX, startY);
      }, DURATION);
    };

    const cancel = () => {
      clearTimeout(timer);
      removeRing(false);
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

  showTagSheet(contact, pressX, pressY) {
    document.querySelector('.tag-sheet-overlay')?.remove();

    const allTags = this.store.getState().tags || [];
    const contactTags = contact.tags || [];

    const overlay = document.createElement('div');
    overlay.className = 'tag-sheet-overlay';

    const sheetW = 240;
    const margin = 8;
    const sheetX = pressX + sheetW + margin > window.innerWidth
      ? Math.max(margin, pressX - sheetW)
      : pressX + margin;
    const flipUp = pressY + 200 > window.innerHeight;
    const sheetPos = flipUp
      ? `left:${sheetX}px;top:auto;bottom:${window.innerHeight - pressY + margin}px`
      : `left:${sheetX}px;top:${pressY + margin}px`;

    const renderSheet = () => {
      const currentTags = this.store.getState().tags || [];
      const currentContactTags = this.store.getState().contacts.find(c => c.id === contact.id)?.tags || [];

      const sheet = overlay.querySelector('.tag-sheet');
      if (!sheet) return;

      sheet.innerHTML = `
        <div class="tag-sheet-title">标签</div>
        <div class="tag-sheet-list">
          ${currentTags.map(tag => {
            const active = currentContactTags.includes(tag.id);
            return `
              <button class="tag-sheet-item ${active ? 'active' : ''}" data-tag-id="${tag.id}" style="--tag-color:${tag.color}">
                <span class="tag-sheet-dot"></span>
                <span>${tag.name}</span>
                ${active ? '<span class="tag-sheet-check">✓</span>' : ''}
              </button>
            `;
          }).join('')}
          <button class="tag-sheet-item tag-sheet-create" id="tag-sheet-create">
            <span class="tag-sheet-dot" style="background:var(--color-text-secondary)">+</span>
            <span>新建标签</span>
          </button>
        </div>
        <div class="tag-sheet-inline-create" id="tag-sheet-inline-create" style="display:none">
          <input type="text" class="tag-sheet-input" id="tag-sheet-new-name" placeholder="标签名称" maxlength="10" autocomplete="off">
          <div class="tag-sheet-color-row" id="tag-sheet-colors"></div>
          <div class="tag-sheet-inline-actions">
            <button class="tag-sheet-inline-btn cancel" id="tag-sheet-cancel-create">取消</button>
            <button class="tag-sheet-inline-btn confirm" id="tag-sheet-confirm-create">创建并添加</button>
          </div>
        </div>
      `;

      // Toggle existing tags
      sheet.querySelectorAll('.tag-sheet-item[data-tag-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.toggleContactTag(contact, btn.dataset.tagId);
          renderSheet();
          this.events.emit('tags:render');
        });
      });

      // Show inline create form
      sheet.querySelector('#tag-sheet-create')?.addEventListener('click', () => {
        this.showInlineTagCreate(sheet, contact, overlay, renderSheet);
      });
    };

    overlay.innerHTML = `<div class="tag-sheet" style="${sheetPos}"></div>`;
    document.body.appendChild(overlay);
    renderSheet();

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  showInlineTagCreate(sheet, contact, overlay, renderSheet) {
    const createBtn = sheet.querySelector('#tag-sheet-create');
    const inlineForm = sheet.querySelector('#tag-sheet-inline-create');
    if (createBtn) createBtn.style.display = 'none';
    if (inlineForm) inlineForm.style.display = 'block';

    const colors = ['#007aff', '#34c759', '#ff9500', '#5856d6', '#ff2d55', '#00c7be', '#ff6482', '#bf5af2'];
    let selectedColor = colors[Math.floor(Math.random() * colors.length)];

    const colorRow = sheet.querySelector('#tag-sheet-colors');
    if (colorRow) {
      colorRow.innerHTML = colors.map(c =>
        `<button class="tag-color-dot ${c === selectedColor ? 'active' : ''}" data-color="${c}" style="background:${c}"></button>`
      ).join('');

      colorRow.addEventListener('click', (e) => {
        const dot = e.target.closest('.tag-color-dot');
        if (!dot) return;
        selectedColor = dot.dataset.color;
        colorRow.querySelectorAll('.tag-color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    }

    const nameInput = sheet.querySelector('#tag-sheet-new-name');
    nameInput?.focus();

    const doCreate = () => {
      const name = nameInput?.value?.trim();
      if (!name) return;

      const newTag = { id: 't' + Date.now(), name, color: selectedColor };
      const tags = [...(this.store.getState().tags || []), newTag];
      this.store.setState({ tags });
      this.storage.set('tags', tags);

      this.toggleContactTag(contact, newTag.id);
      this.events.emit('tags:render');
      renderSheet();
    };

    nameInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') doCreate(); });
    sheet.querySelector('#tag-sheet-confirm-create')?.addEventListener('click', doCreate);
    sheet.querySelector('#tag-sheet-cancel-create')?.addEventListener('click', renderSheet);
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
