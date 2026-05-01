// 状态管理模块

class Store {
  /**
   * 初始化状态管理
   * @param {Object} initialState - 初始状态
   */
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = {};
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getState() {
    return this.state;
  }

  /**
   * 更新状态
   * @param {Object} newState - 新状态
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  /**
   * 订阅状态变化
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  unsubscribe(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 通知所有监听器
   */
  notifyListeners() {
    Object.keys(this.listeners).forEach(event => {
      this.listeners[event].forEach(callback => callback(this.state));
    });
  }

  /**
   * 重置状态
   * @param {Object} state - 新状态
   */
  resetState(state = {}) {
    this.state = state;
    this.notifyListeners();
  }
}

// 导出状态管理实例
let storeInstance = null;

/**
 * 初始化状态管理
 * @param {Object} initialState - 初始状态
 * @returns {Store} 状态管理实例
 */
export function initStore(initialState = {}) {
  if (!storeInstance) {
    storeInstance = new Store(initialState);
  }
  return storeInstance;
}

/**
 * 获取状态管理实例
 * @returns {Store} 状态管理实例
 */
export function getStore() {
  if (!storeInstance) {
    storeInstance = new Store();
  }
  return storeInstance;
}

export default Store;