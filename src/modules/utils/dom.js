// DOM 操作工具模块

/**
 * 获取元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement} parent - 父元素，默认为 document
 * @returns {HTMLElement|null} 匹配的元素
 */
export function getElement(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * 获取多个元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement} parent - 父元素，默认为 document
 * @returns {NodeList} 匹配的元素列表
 */
export function getElements(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * 创建元素
 * @param {string} tag - 标签名
 * @param {Object} options - 元素选项
 * @param {Object} options.className - 类名
 * @param {Object} options.id - ID
 * @param {Object} options.attributes - 属性对象
 * @param {Object} options.style - 样式对象
 * @param {string} options.textContent - 文本内容
 * @returns {HTMLElement} 创建的元素
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  if (options.className) {
    element.className = options.className;
  }
  
  if (options.id) {
    element.id = options.id;
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (options.style) {
    Object.entries(options.style).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }
  
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  
  return element;
}

/**
 * 批量更新 DOM 元素
 * @param {HTMLElement} parent - 父元素
 * @param {Array<HTMLElement>} elements - 元素列表
 * @param {boolean} clearFirst - 是否先清空父元素
 */
export function batchUpdateElements(parent, elements, clearFirst = true) {
  const fragment = document.createDocumentFragment();
  
  elements.forEach(element => {
    fragment.appendChild(element);
  });
  
  if (clearFirst) {
    parent.innerHTML = '';
  }
  
  parent.appendChild(fragment);
}

/**
 * 添加事件监听器（支持事件委托）
 * @param {HTMLElement|string} target - 目标元素或选择器
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 * @param {string} options.delegate - 委托选择器
 */
export function addEventListener(target, event, handler, options = {}) {
  const element = typeof target === 'string' ? getElement(target) : target;
  
  if (!element) return;
  
  if (options.delegate) {
    element.addEventListener(event, function(e) {
      const delegateTarget = e.target.closest(options.delegate);
      if (delegateTarget) {
        handler.call(delegateTarget, e);
      }
    }, options);
  } else {
    element.addEventListener(event, handler, options);
  }
}

/**
 * 移除事件监听器
 * @param {HTMLElement} element - 元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 */
export function removeEventListener(element, event, handler) {
  element.removeEventListener(event, handler);
}

/**
 * 添加类名
 * @param {HTMLElement} element - 元素
 * @param {string|Array<string>} className - 类名或类名数组
 */
export function addClass(element, className) {
  if (Array.isArray(className)) {
    className.forEach(name => element.classList.add(name));
  } else {
    element.classList.add(className);
  }
}

/**
 * 移除类名
 * @param {HTMLElement} element - 元素
 * @param {string|Array<string>} className - 类名或类名数组
 */
export function removeClass(element, className) {
  if (Array.isArray(className)) {
    className.forEach(name => element.classList.remove(name));
  } else {
    element.classList.remove(className);
  }
}

/**
 * 切换类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 * @returns {boolean} 切换后的类名状态
 */
export function toggleClass(element, className) {
  return element.classList.toggle(className);
}

/**
 * 检查元素是否有指定类名
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 * @returns {boolean} 是否有指定类名
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * 设置元素样式
 * @param {HTMLElement} element - 元素
 * @param {Object} styles - 样式对象
 */
export function setStyles(element, styles) {
  Object.entries(styles).forEach(([key, value]) => {
    element.style[key] = value;
  });
}

/**
 * 动画元素
 * @param {HTMLElement} element - 元素
 * @param {Object} properties - 动画属性
 * @param {number} duration - 动画持续时间（毫秒）
 * @param {string} easing - 缓动函数
 * @param {Function} callback - 动画完成回调
 */
export function animateElement(element, properties, duration = 300, easing = 'ease', callback) {
  element.style.transition = `all ${duration}ms ${easing}`;
  
  Object.entries(properties).forEach(([key, value]) => {
    element.style[key] = value;
  });
  
  if (callback) {
    setTimeout(callback, duration);
  }
}

/**
 * 平滑滚动到元素
 * @param {HTMLElement} element - 目标元素
 * @param {number} duration - 滚动持续时间（毫秒）
 * @param {number} offset - 偏移量
 */
export function scrollToElement(element, duration = 300, offset = 0) {
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();
  
  function scroll(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    window.scrollTo(0, startPosition + distance * easeProgress);
    
    if (elapsedTime < duration) {
      requestAnimationFrame(scroll);
    }
  }
  
  requestAnimationFrame(scroll);
}

/**
 * 获取元素相对于文档的位置
 * @param {HTMLElement} element - 元素
 * @returns {Object} 位置对象 {top, left}
 */
export function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  };
}

/**
 * 获取元素尺寸
 * @param {HTMLElement} element - 元素
 * @returns {Object} 尺寸对象 {width, height}
 */
export function getElementSize(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}