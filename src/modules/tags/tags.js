import VennDiagram from './venn.js';

class TagsModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
    this.venn = null;
  }

  init() {
    this.venn = new VennDiagram(document.getElementById('venn-container'));
    this.bindEvents();
  }

  bindEvents() {
    this.events.on('tags:change', () => this.onSelectionChange());
    this.events.on('tags:render', () => this.render());
    this.events.on('contacts:update', () => this.render());
  }

  render() {
    const bar = document.getElementById('tag-filter-bar');
    if (!bar) return;

    const tags = this.store.getState().tags || [];
    const selected = this.store.getState().selectedTags || [];

    const user = this.store.getState().user;
    if (!user) {
      bar.innerHTML = '';
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';

    const contacts = this.store.getState().contacts || [];

    bar.innerHTML = tags.map(tag => {
      const count = contacts.filter(c => c.tags?.includes(tag.id)).length;
      const isActive = selected.includes(tag.id);
      return `
        <button class="tag-capsule ${isActive ? 'active' : ''}"
                data-tag-id="${tag.id}"
                style="--tag-color: ${tag.color}">
          <span class="tag-capsule-dot"></span>
          <span class="tag-capsule-label">${tag.name}</span>
          <span class="tag-capsule-count">${count}</span>
        </button>
      `;
    }).join('') + `
      <button class="tag-capsule tag-capsule-add" id="tag-add-btn">
        <span class="tag-capsule-label">+</span>
      </button>
    `;

    bar.querySelectorAll('.tag-capsule[data-tag-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.dataset.tagId;
        this.toggleTag(tagId);
      });
    });

    bar.querySelector('#tag-add-btn')?.addEventListener('click', () => {
      this.showCreateTagDialog();
    });
  }

  toggleTag(tagId) {
    let selected = [...(this.store.getState().selectedTags || [])];
    const idx = selected.indexOf(tagId);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(tagId);
    }
    this.store.setState({ selectedTags: selected });
    this.events.emit('tags:change');
  }

  onSelectionChange() {
    this.render();

    const selected = this.store.getState().selectedTags || [];
    const tags = this.store.getState().tags || [];
    const contacts = this.store.getState().contacts || [];
    const selectedTagObjects = selected.map(id => tags.find(t => t.id === id)).filter(Boolean);

    if (selected.length === 0) {
      this.venn.hide();
    } else if (selected.length <= 2) {
      this.venn.show(selectedTagObjects, contacts, (subFilter) => {
        this.store.setState({ tagSubFilter: subFilter });
        this.events.emit('contacts:update');
      });
    } else {
      this.venn.hide();
    }

    this.events.emit('contacts:update');
  }

  showCreateTagDialog() {
    const colors = ['#ff2d55', '#00c7be', '#ff6482', '#bf5af2', '#007aff', '#34c759', '#ff9500', '#5856d6'];
    let selectedColor = colors[Math.floor(Math.random() * colors.length)];

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-card">
        <h3>新建标签</h3>
        <div class="form-group">
          <label>标签名称</label>
          <input type="text" class="form-input" id="new-tag-name" placeholder="输入标签名" autocomplete="off" maxlength="10">
        </div>
        <div class="form-group">
          <label>选择颜色</label>
          <div class="tag-color-picker" id="tag-color-picker">
            ${colors.map(c => `
              <button class="tag-color-option ${c === selectedColor ? 'active' : ''}"
                      data-color="${c}"
                      style="background:${c}"></button>
            `).join('')}
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" id="tag-create-cancel">取消</button>
          <button class="btn btn-primary" id="tag-create-confirm">创建</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#tag-color-picker').addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-color-option');
      if (!btn) return;
      selectedColor = btn.dataset.color;
      overlay.querySelectorAll('.tag-color-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#tag-create-cancel').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#tag-create-confirm').addEventListener('click', () => {
      const name = document.getElementById('new-tag-name')?.value?.trim();
      if (!name) return;

      const newTag = {
        id: 't' + Date.now(),
        name,
        color: selectedColor
      };

      const tags = [...(this.store.getState().tags || []), newTag];
      this.store.setState({ tags });
      this.storage.set('tags', tags);
      this.render();
      overlay.remove();
    });

    document.getElementById('new-tag-name')?.focus();
  }
}

export default TagsModule;
