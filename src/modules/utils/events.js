// 事件系统模块

class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 事件处理函数
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 事件处理函数
   */
  off(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  /**
   * 注册一次性事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 事件处理函数
   */
  once(event, listener) {
    const onceListener = (data) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

// 导出事件系统实例
let eventEmitterInstance = null;

/**
 * 初始化事件系统
 * @returns {EventEmitter} 事件系统实例
 */
export function initEventSystem() {
  if (!eventEmitterInstance) {
    eventEmitterInstance = new EventEmitter();
  }
  return eventEmitterInstance;
}

/**
 * 获取事件系统实例
 * @returns {EventEmitter} 事件系统实例
 */
export function getEventEmitter() {
  if (!eventEmitterInstance) {
    eventEmitterInstance = new EventEmitter();
  }
  return eventEmitterInstance;
}

export default EventEmitter;