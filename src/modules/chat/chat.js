import { formatRelativeTime } from '../utils/data.js';

class ChatModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
    this.currentContactId = null;
  }

  init() {
    this.bindEvents();
    this.bindInput();
  }

  bindEvents() {
    this.events.on('contact:select', (contact) => {
      this.currentContactId = contact.id;
      this.showChatWindow(contact);
      this.renderMessages(contact);
    });

    this.events.on('settings:show', () => {
      this.hideChatWindow();
    });

    this.events.on('settings:close', () => {
      const contact = this.store.getState().currentContact;
      if (contact) {
        this.showChatWindow(contact);
        this.renderMessages(contact);
      }
    });
  }

  showChatWindow(contact) {
    const chatWindow = document.getElementById('chat-window');
    const emptyState = document.getElementById('empty-state');
    const settingsPage = document.getElementById('settings-page');

    if (emptyState) emptyState.style.display = 'none';
    if (settingsPage) settingsPage.style.display = 'none';
    if (chatWindow) chatWindow.style.display = 'flex';

    this.renderHeader(contact);
  }

  hideChatWindow() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.style.display = 'none';
  }

  renderHeader(contact) {
    const header = document.getElementById('chat-header');
    if (!header) return;

    const avatarHtml = contact.avatar
      ? `<img src="${contact.avatar}" alt="${contact.name}">`
      : `<div style="width:100%;height:100%;border-radius:8px;background:${this.getAvatarColor(contact.name)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${contact.name.charAt(0)}</div>`;

    header.innerHTML = `
      <div class="chat-header-info" id="chat-header-info">
        <div class="chat-header-avatar">
          ${avatarHtml}
          ${contact.isOnline ? '<span class="online-indicator"></span>' : ''}
        </div>
        <div class="chat-header-details">
          <div class="chat-header-name">${this.escapeHtml(contact.name)}</div>
          <div class="chat-header-status ${contact.isOnline ? '' : 'offline'}">
            ${contact.isOnline ? '在线' : '离线'}
            ${contact.type === 'group' && contact.memberCount ? ` · ${contact.memberCount}名成员` : ''}
          </div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="action-btn" id="chat-settings-btn" aria-label="设置">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
    `;

    header.querySelector('#chat-header-info')?.addEventListener('click', () => {
      const settingsType = contact.type === 'group' ? 'group' : 'friend';
      this.events.emit('settings:show', { type: settingsType, contact });
    });

    header.querySelector('#chat-settings-btn')?.addEventListener('click', () => {
      const settingsType = contact.type === 'group' ? 'group' : 'friend';
      this.events.emit('settings:show', { type: settingsType, contact });
    });
  }

  renderMessages(contact) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    container.innerHTML = '';

    const allMessages = this.store.getState().messages;
    const messages = allMessages[contact.id] || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);font-size:13px">
          暂无消息，发送一条消息开始聊天
        </div>
      `;
      return;
    }

    let lastDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      const dateStr = msgDate.toLocaleDateString('zh-CN');
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        const sep = document.createElement('div');
        sep.className = 'message-date-separator';
        const today = new Date().toLocaleDateString('zh-CN');
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN');
        let label = dateStr;
        if (dateStr === today) label = '今天';
        else if (dateStr === yesterday) label = '昨天';
        sep.innerHTML = `<span>${label}</span>`;
        container.appendChild(sep);
      }

      const isSent = msg.sender === 'user' || msg.sender === 'current-user';
      const el = document.createElement('div');
      el.className = `message ${isSent ? 'sent' : 'received'}`;

      const timeStr = new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let contentHtml = '';
      switch (msg.type) {
        case 'image':
          contentHtml = `<img src="${msg.content}" alt="图片" class="message-image">`;
          break;
        case 'voice':
          contentHtml = `
            <div class="voice-message">
              <button class="play-voice">▶</button>
              <span>${msg.duration || '0:00'}</span>
            </div>
          `;
          break;
        case 'file':
          contentHtml = `
            <div class="file-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <div class="file-info">
                <span class="file-name">${this.escapeHtml(msg.fileName || '文件')}</span>
                <a href="${msg.content}" download="${msg.fileName || 'file'}" class="download-link">下载</a>
              </div>
            </div>
          `;
          break;
        default:
          contentHtml = `<p>${this.escapeHtml(msg.content)}</p>`;
      }

      if (isSent) {
        el.innerHTML = `
          <div class="message-body">
            <div class="message-bubble">${contentHtml}</div>
            <span class="message-meta">${timeStr}</span>
          </div>
        `;
      } else {
        const senderAvatar = contact.avatar
          ? `<img src="${contact.avatar}" alt="${contact.name}">`
          : `<div style="width:100%;height:100%;border-radius:8px;background:${this.getAvatarColor(contact.name)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600">${contact.name.charAt(0)}</div>`;

        el.innerHTML = `
          <div class="message-avatar">${senderAvatar}</div>
          <div class="message-body">
            <div class="message-bubble">${contentHtml}</div>
            <span class="message-meta">${timeStr}</span>
          </div>
        `;
      }

      if (msg.type === 'voice') {
        el.querySelector('.play-voice')?.addEventListener('click', () => {
          this.playVoice(msg.content);
        });
      }

      container.appendChild(el);
    });

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

  bindInput() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    const attachBtn = document.getElementById('attach-button');
    const imageBtn = document.getElementById('image-button');
    const voiceBtn = document.getElementById('voice-button');

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendTextMessage(input);
        }
      });

      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
    }

    sendBtn?.addEventListener('click', () => {
      if (input) this.sendTextMessage(input);
    });

    imageBtn?.addEventListener('click', () => this.pickFile('image/*', 'image'));
    attachBtn?.addEventListener('click', () => this.pickFile('*/*', 'file'));
    voiceBtn?.addEventListener('click', () => this.startRecording());
  }

  sendTextMessage(input) {
    const content = input.value.trim();
    if (!content || !this.currentContactId) return;

    this.addMessage(this.currentContactId, {
      content,
      sender: 'user',
      type: 'text'
    });

    input.value = '';
    input.style.height = 'auto';

    if (this.store.getState().isDemo) {
      setTimeout(() => {
        this.addMessage(this.currentContactId, {
          content: this.getDemoReply(content),
          sender: this.currentContactId,
          type: 'text'
        });
      }, 800 + Math.random() * 1200);
    }
  }

  addMessage(contactId, msgData) {
    const message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      ...msgData,
      receiver: msgData.sender === 'user' ? contactId : 'user',
      timestamp: Date.now(),
      status: 'sent'
    };

    const allMessages = { ...this.store.getState().messages };
    if (!allMessages[contactId]) allMessages[contactId] = [];
    allMessages[contactId] = [...allMessages[contactId], message];
    this.store.setState({ messages: allMessages });

    const contacts = this.store.getState().contacts.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          lastMessage: msgData.type === 'text' ? msgData.content : `[${msgData.type === 'image' ? '图片' : msgData.type === 'voice' ? '语音' : '文件'}]`,
          lastMessageTime: Date.now()
        };
      }
      return c;
    });
    this.store.setState({ contacts });

    if (!this.store.getState().isDemo) {
      this.storage.set('messages', allMessages);
      this.storage.set('contacts', contacts);
    }

    const currentContact = this.store.getState().currentContact;
    if (currentContact && currentContact.id === contactId) {
      this.renderMessages(currentContact);
    }
    this.events.emit('contacts:update');
  }

  pickFile(accept, type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file || !this.currentContactId) return;

      const url = URL.createObjectURL(file);
      this.addMessage(this.currentContactId, {
        content: url,
        sender: 'user',
        type,
        fileName: file.name
      });
    };
    input.click();
  }

  startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('浏览器不支持录音功能');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        let seconds = 0;

        const overlay = document.createElement('div');
        overlay.className = 'recording-overlay';
        overlay.innerHTML = `
          <div class="recording-card">
            <div class="recording-indicator-dot"></div>
            <div class="recording-time" id="recording-time">0:00</div>
            <button class="btn btn-danger" id="stop-recording">停止录音</button>
          </div>
        `;
        document.body.appendChild(overlay);

        recorder.start();

        const timer = setInterval(() => {
          seconds++;
          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;
          const timeEl = document.getElementById('recording-time');
          if (timeEl) timeEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
        }, 1000);

        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = () => {
          clearInterval(timer);
          overlay.remove();
          stream.getTracks().forEach(t => t.stop());

          if (chunks.length > 0 && this.currentContactId) {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const duration = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

            this.addMessage(this.currentContactId, {
              content: url,
              sender: 'user',
              type: 'voice',
              duration
            });
          }
        };

        overlay.querySelector('#stop-recording')?.addEventListener('click', () => {
          recorder.stop();
        });
      })
      .catch(() => {
        alert('无法访问麦克风，请检查浏览器权限');
      });
  }

  playVoice(url) {
    const audio = new Audio(url);
    audio.play().catch(() => {
      alert('无法播放语音消息');
    });
  }

  clear() {
    const container = document.getElementById('messages-container');
    if (container) container.innerHTML = '';

    const chatWindow = document.getElementById('chat-window');
    const emptyState = document.getElementById('empty-state');
    if (chatWindow) chatWindow.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';

    this.currentContactId = null;
  }

  getDemoReply(content) {
    const replies = [
      '收到！',
      '好的，了解了。',
      '没问题~',
      '嗯嗯，我知道了。',
      '哈哈，好的！',
      '这个想法不错！',
      '我马上看看。',
      '稍等一下哦。',
      '明白了，谢谢！',
      '好嘞~'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
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

export default ChatModule;
