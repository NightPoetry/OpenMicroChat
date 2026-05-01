import { initStore } from './modules/store/store.js';
import { initEventSystem } from './modules/utils/events.js';
import { initStorage } from './modules/storage/storage.js';
import defaultContacts from './data/contacts.js';
import defaultMessages from './data/messages.js';
import defaultTags from './data/tags.js';

import AuthModule from './modules/auth/auth.js';
import ContactsModule from './modules/contacts/contacts.js';
import ChatModule from './modules/chat/chat.js';
import SettingsModule from './modules/settings/settings.js';
import TagsModule from './modules/tags/tags.js';

class App {
  constructor() {
    this.store = initStore({
      contacts: [],
      currentContact: null,
      messages: {},
      settings: {
        theme: 'light',
        notifications: true,
        language: 'zh-CN'
      },
      user: null,
      isDemo: false,
      tags: [],
      selectedTags: [],
      tagSubFilter: null
    });

    this.events = initEventSystem();
    this.storage = initStorage();
  }

  init() {
    this.authModule = new AuthModule(this.store, this.events, this.storage);
    this.contactsModule = new ContactsModule(this.store, this.events, this.storage);
    this.chatModule = new ChatModule(this.store, this.events, this.storage);
    this.settingsModule = new SettingsModule(this.store, this.events, this.storage);
    this.tagsModule = new TagsModule(this.store, this.events, this.storage);

    this.authModule.init();
    this.contactsModule.init();
    this.chatModule.init();
    this.settingsModule.init();
    this.tagsModule.init();

    this.loadSettings();
    this.bindGlobalEvents();
    this.setupMobileNavigation();
  }

  loadSettings() {
    const settings = this.storage.get('settings');
    if (settings) {
      this.store.setState({ settings });
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
    }
  }

  bindGlobalEvents() {
    this.events.on('auth:login', (user) => {
      this.store.setState({ user, isDemo: false });
      this.loadUserData();
      this.showApp();
    });

    this.events.on('auth:demo', () => {
      this.store.setState({ isDemo: true, user: { username: '体验用户', avatar: null } });
      this.loadDemoData();
      this.showApp();
    });

    this.events.on('auth:logout', () => {
      this.store.setState({
        user: null,
        contacts: [],
        currentContact: null,
        messages: {},
        isDemo: false,
        tags: [],
        selectedTags: [],
        tagSubFilter: null
      });
      this.hideApp();
      this.contactsModule.clear();
      this.chatModule.clear();
      this.tagsModule.render();
    });

    this.events.on('theme:change', (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      const settings = this.store.getState().settings;
      settings.theme = theme;
      this.store.setState({ settings });
      this.storage.set('settings', settings);
    });

    this.events.on('contact:select', (contact) => {
      this.store.setState({ currentContact: contact });
    });

    window.addEventListener('beforeunload', () => {
      const state = this.store.getState();
      if (state.user && !state.isDemo) {
        this.storage.set('contacts', state.contacts);
        this.storage.set('messages', state.messages);
        this.storage.set('settings', state.settings);
      }
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }
    });
  }

  loadUserData() {
    const contacts = this.storage.get('contacts') || [];
    const messages = this.storage.get('messages') || {};
    const tags = this.storage.get('tags') || defaultTags;
    this.store.setState({ contacts, messages, tags });
    this.tagsModule.render();
    this.contactsModule.render();
    if (contacts.length > 0) {
      this.events.emit('contact:select', contacts[0]);
    }
  }

  loadDemoData() {
    const messages = {};
    for (const [contactId, msgs] of Object.entries(defaultMessages)) {
      messages[contactId] = msgs;
    }
    this.store.setState({ contacts: defaultContacts, messages, tags: defaultTags });
    this.tagsModule.render();
    this.contactsModule.render();
    if (defaultContacts.length > 0) {
      this.events.emit('contact:select', defaultContacts[0]);
    }
  }

  showApp() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.add('hidden');

    const avatarBtn = document.getElementById('user-avatar-btn');
    const user = this.store.getState().user;
    if (avatarBtn && user) {
      if (user.avatar) {
        avatarBtn.innerHTML = `<img src="${user.avatar}" alt="${user.username}">`;
      } else {
        avatarBtn.querySelector('.avatar-placeholder').textContent =
          (user.username || 'U').charAt(0).toUpperCase();
      }
    }
  }

  hideApp() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  setupMobileNavigation() {
    const mobileBackBtn = document.getElementById('mobile-back-btn');
    if (mobileBackBtn) {
      mobileBackBtn.addEventListener('click', () => {
        this.showSidebar();
      });
    }

    this.events.on('contact:select', () => {
      if (window.innerWidth <= 600) {
        this.hideSidebar();
      }
    });

    this.events.on('navigation:back', () => {
      this.showSidebar();
    });
  }

  hideSidebar() {
    const sidebar = document.getElementById('contacts-sidebar');
    const backBtn = document.getElementById('mobile-back-btn');
    if (sidebar) sidebar.classList.add('sidebar-hidden');
    if (backBtn) backBtn.style.display = 'flex';
  }

  showSidebar() {
    const sidebar = document.getElementById('contacts-sidebar');
    const backBtn = document.getElementById('mobile-back-btn');
    if (sidebar) sidebar.classList.remove('sidebar-hidden');
    if (backBtn) backBtn.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

export default App;
