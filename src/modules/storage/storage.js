// 数据持久化模块

class Storage {
  /**
   * 初始化存储
   * @param {string} prefix - 存储键前缀
   */
  constructor(prefix = 'openmicrochat_') {
    this.prefix = prefix;
    this.isSupported = this.checkSupport();
  }

  /**
   * 检查本地存储是否支持
   * @returns {boolean} 是否支持本地存储
   */
  checkSupport() {
    try {
      const testKey = `${this.prefix}_test`;
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage is not supported:', error);
      return false;
    }
  }

  /**
   * 存储数据
   * @param {string} key - 存储键
   * @param {*} value - 存储值
   * @returns {boolean} 是否存储成功
   */
  set(key, value) {
    if (!this.isSupported) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  /**
   * 获取数据
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储值或默认值
   */
  get(key, defaultValue = null) {
    if (!this.isSupported) return defaultValue;
    
    try {
      const serializedValue = localStorage.getItem(this.prefix + key);
      return serializedValue ? JSON.parse(serializedValue) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 移除数据
   * @param {string} key - 存储键
   * @returns {boolean} 是否移除成功
   */
  remove(key) {
    if (!this.isSupported) return false;
    
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   * @returns {boolean} 是否清空成功
   */
  clear() {
    if (!this.isSupported) return false;
    
    try {
      // 只清空带有前缀的数据
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * 获取所有存储键
   * @returns {Array} 存储键列表
   */
  getKeys() {
    if (!this.isSupported) return [];
    
    try {
      return Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    } catch (error) {
      console.error('Storage getKeys error:', error);
      return [];
    }
  }

  /**
   * 批量存储数据
   * @param {Object} data - 数据对象
   * @returns {boolean} 是否存储成功
   */
  setMultiple(data) {
    if (!this.isSupported) return false;
    
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      return false;
    }
  }

  /**
   * 批量获取数据
   * @param {Array} keys - 键列表
   * @returns {Object} 数据对象
   */
  getMultiple(keys) {
    if (!this.isSupported) return {};
    
    try {
      const result = {};
      keys.forEach(key => {
        result[key] = this.get(key);
      });
      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  }
}

// 导出存储实例
let storageInstance = null;

/**
 * 初始化存储
 * @param {string} prefix - 存储键前缀
 * @returns {Storage} 存储实例
 */
export function initStorage(prefix = 'openmicrochat_') {
  if (!storageInstance) {
    storageInstance = new Storage(prefix);
  }
  return storageInstance;
}

/**
 * 获取存储实例
 * @returns {Storage} 存储实例
 */
export function getStorage() {
  if (!storageInstance) {
    storageInstance = new Storage();
  }
  return storageInstance;
}

export default Storage;