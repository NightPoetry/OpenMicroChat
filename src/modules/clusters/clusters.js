// 聚类模块
class ClustersModule {
  constructor(store, events, storage) {
    this.store = store;
    this.events = events;
    this.storage = storage;
    this.clusters = [];
  }

  init() {
    this.loadClusters();
    this.bindEvents();
    // 聚类功能只在编辑模式下显示，这里不主动渲染
  }

  renderClustersInEditMode() {
    const clustersList = document.getElementById('clusters-grid');
    if (!clustersList) return;

    clustersList.innerHTML = '';
    this.clusters.forEach(cluster => {
      const clusterItem = this.createClusterItem(cluster);
      clustersList.appendChild(clusterItem);
    });

    // 添加创建聚类按钮
    const addClusterButton = this.createAddClusterButton();
    clustersList.appendChild(addClusterButton);
  }

  loadClusters() {
    this.clusters = this.store.getState().clusters;
  }

  renderClusters() {
    const clustersList = document.getElementById('clusters-list');
    if (!clustersList) return;

    clustersList.innerHTML = '';
    this.clusters.forEach(cluster => {
      const clusterItem = this.createClusterItem(cluster);
      clustersList.appendChild(clusterItem);
    });

    // 添加创建聚类按钮
    const addClusterButton = this.createAddClusterButton();
    clustersList.appendChild(addClusterButton);
  }

  createClusterItem(cluster) {
    const item = document.createElement('div');
    item.className = 'cluster-item';
    item.dataset.id = cluster.id;

    item.innerHTML = `
      <div class="cluster-header">
        <div class="cluster-info">
          <div class="cluster-avatar" style="background-color: ${cluster.color}">
            ${cluster.name.charAt(0)}
          </div>
          <h3 class="cluster-name">${cluster.name}</h3>
          <span class="cluster-count">${cluster.count}</span>
        </div>
        <button class="cluster-expand">▼</button>
      </div>
      <div class="cluster-contacts">
        <!-- 聚类联系人将在这里动态添加 -->
      </div>
    `;

    const expandButton = item.querySelector('.cluster-expand');
    const contactsContainer = item.querySelector('.cluster-contacts');

    if (expandButton) {
      expandButton.addEventListener('click', () => {
        contactsContainer.classList.toggle('expanded');
        expandButton.textContent = contactsContainer.classList.contains('expanded') ? '▲' : '▼';
        if (contactsContainer.classList.contains('expanded')) {
          this.renderClusterContacts(cluster.id, contactsContainer);
        }
      });
    }

    return item;
  }

  createAddClusterButton() {
    const button = document.createElement('div');
    button.className = 'add-cluster-button';
    button.innerHTML = `
      <div class="add-cluster-icon">+</div>
      <span>创建新聚类</span>
    `;

    button.addEventListener('click', () => {
      this.createNewCluster();
    });

    return button;
  }

  renderClusterContacts(clusterId, container) {
    const contacts = this.store.getState().contacts.filter(
      contact => contact.tags && contact.tags.includes(clusterId)
    );

    container.innerHTML = '';
    contacts.forEach(contact => {
      const contactItem = document.createElement('div');
      contactItem.className = 'cluster-contact-item';
      contactItem.dataset.id = contact.id;

      contactItem.innerHTML = `
        <div class="contact-avatar">
          <img src="${contact.avatar}" alt="${contact.name}">
          ${contact.isOnline ? '<span class="online-indicator"></span>' : ''}
        </div>
        <span class="contact-name">${contact.name}</span>
      `;

      contactItem.addEventListener('click', () => {
        this.events.emit('contact:select', contact);
      });

      container.appendChild(contactItem);
    });
  }

  createNewCluster() {
    const clusterName = prompt('请输入聚类名称:');
    if (!clusterName) return;

    const newCluster = {
      id: Date.now().toString(),
      name: clusterName,
      count: 0,
      avatar: '',
      color: this.getRandomColor(),
      createdAt: new Date().toISOString()
    };

    this.clusters.push(newCluster);
    this.store.setState({ clusters: this.clusters });
    this.storage.set('clusters', this.clusters);
    this.renderClusters();
  }

  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  bindEvents() {
    this.events.on('clusters:update', () => {
      this.loadClusters();
      this.renderClusters();
    });

    this.events.on('contact:tag', (contactId, clusterId) => {
      this.addContactToCluster(contactId, clusterId);
    });

    this.events.on('contact:untag', (contactId, clusterId) => {
      this.removeContactFromCluster(contactId, clusterId);
    });
  }

  addContactToCluster(contactId, clusterId) {
    const contacts = this.store.getState().contacts;
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      if (!contact.tags) contact.tags = [];
      if (!contact.tags.includes(clusterId)) {
        contact.tags.push(clusterId);
        this.store.setState({ contacts });
        this.storage.set('contacts', contacts);
        this.updateClusterCount(clusterId);
      }
    }
  }

  removeContactFromCluster(contactId, clusterId) {
    const contacts = this.store.getState().contacts;
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.tags) {
      contact.tags = contact.tags.filter(tag => tag !== clusterId);
      this.store.setState({ contacts });
      this.storage.set('contacts', contacts);
      this.updateClusterCount(clusterId);
    }
  }

  updateClusterCount(clusterId) {
    const clusters = this.clusters.map(cluster => {
      if (cluster.id === clusterId) {
        const count = this.store.getState().contacts.filter(
          contact => contact.tags && contact.tags.includes(clusterId)
        ).length;
        return { ...cluster, count };
      }
      return cluster;
    });

    this.clusters = clusters;
    this.store.setState({ clusters });
    this.storage.set('clusters', clusters);
    this.renderClusters();
  }
}

export default ClustersModule;