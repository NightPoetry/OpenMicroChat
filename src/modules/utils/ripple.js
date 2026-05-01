const RIPPLE_SELECTOR = '.tool-btn, .send-btn, .btn, .action-btn, .avatar-btn, .tag-capsule, .add-friend-button';

export function initRipple() {
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest(RIPPLE_SELECTOR);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.sqrt(rect.width ** 2 + rect.height ** 2) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    target.appendChild(wave);

    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  });
}
