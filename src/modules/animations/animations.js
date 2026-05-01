// 动画模块
class AnimationsModule {
  constructor(store, events) {
    this.store = store;
    this.events = events;
  }

  init() {
    this.bindEvents();
    this.setupAnimations();
  }

  setupAnimations() {
    this.setupFadeAnimations();
    this.setupSlideAnimations();
    this.setupScaleAnimations();
  }

  setupFadeAnimations() {
    // 淡入淡出动画
    this.fadeIn = (element, duration = 300) => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.opacity = '1';
      }, 10);
    };

    this.fadeOut = (element, duration = 300) => {
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      
      setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
          element.style.display = 'none';
        }, duration);
      }, 10);
    };
  }

  setupSlideAnimations() {
    // 滑动动画
    this.slideIn = (element, direction = 'left', duration = 300) => {
      const startPosition = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : direction === 'top' ? '-100%' : '100%';
      const property = direction === 'left' || direction === 'right' ? 'transform' : 'transform';
      const transform = direction === 'left' || direction === 'right' ? `translateX(${startPosition})` : `translateY(${startPosition})`;

      element.style.transform = transform;
      element.style.transition = `transform ${duration}ms ease-in-out`;
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.transform = 'translate(0)';
      }, 10);
    };

    this.slideOut = (element, direction = 'left', duration = 300) => {
      const endPosition = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : direction === 'top' ? '-100%' : '100%';
      const transform = direction === 'left' || direction === 'right' ? `translateX(${endPosition})` : `translateY(${endPosition})`;

      element.style.transition = `transform ${duration}ms ease-in-out`;
      
      setTimeout(() => {
        element.style.transform = transform;
        setTimeout(() => {
          element.style.display = 'none';
        }, duration);
      }, 10);
    };
  }

  setupScaleAnimations() {
    // 缩放动画
    this.scaleIn = (element, duration = 300) => {
      element.style.transform = 'scale(0)';
      element.style.transition = `transform ${duration}ms ease-in-out`;
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 10);
    };

    this.scaleOut = (element, duration = 300) => {
      element.style.transition = `transform ${duration}ms ease-in-out`;
      
      setTimeout(() => {
        element.style.transform = 'scale(0)';
        setTimeout(() => {
          element.style.display = 'none';
        }, duration);
      }, 10);
    };
  }

  bindEvents() {
    this.events.on('animation:fadeIn', (element, duration) => {
      this.fadeIn(element, duration);
    });

    this.events.on('animation:fadeOut', (element, duration) => {
      this.fadeOut(element, duration);
    });

    this.events.on('animation:slideIn', (element, direction, duration) => {
      this.slideIn(element, direction, duration);
    });

    this.events.on('animation:slideOut', (element, direction, duration) => {
      this.slideOut(element, direction, duration);
    });

    this.events.on('animation:scaleIn', (element, duration) => {
      this.scaleIn(element, duration);
    });

    this.events.on('animation:scaleOut', (element, duration) => {
      this.scaleOut(element, duration);
    });

    // 页面切换动画
    this.events.on('page:change', (page) => {
      this.animatePageChange(page);
    });

    // 联系人选择动画
    this.events.on('contact:select', (contact) => {
      this.animateContactSelect(contact);
    });
  }

  animatePageChange(page) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      if (p.id === page + '-page') {
        this.fadeIn(p);
      } else {
        this.fadeOut(p);
      }
    });
  }

  animateContactSelect(contact) {
    const contactItem = document.querySelector(`.contact-item[data-id="${contact.id}"]`);
    if (contactItem) {
      contactItem.classList.add('selected');
      setTimeout(() => {
        contactItem.classList.remove('selected');
      }, 300);
    }
  }

  // 抖动动画（用于错误提示）
  shake(element, duration = 500) {
    element.classList.add('shake');
    setTimeout(() => {
      element.classList.remove('shake');
    }, duration);
  }

  // 脉冲动画（用于通知）
  pulse(element, duration = 2000) {
    element.classList.add('pulse');
    setTimeout(() => {
      element.classList.remove('pulse');
    }, duration);
  }

  // 呼吸动画（用于在线状态）
  breathe(element) {
    element.classList.add('breathe');
  }

  // 停止呼吸动画
  stopBreathe(element) {
    element.classList.remove('breathe');
  }
}

export default AnimationsModule;