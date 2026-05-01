class VennDiagram {
  constructor(container) {
    this.container = container;
    this.currentTags = [];
    this.subFilterCallback = null;
    this.activeRegion = null;
  }

  show(tags, contacts, onSubFilter) {
    this.currentTags = tags;
    this.subFilterCallback = onSubFilter;
    this.activeRegion = null;

    if (!this.container) return;

    if (tags.length === 1) {
      this.showSingle(tags[0], contacts);
    } else if (tags.length === 2) {
      this.showDouble(tags[0], tags[1], contacts);
    }
  }

  hide() {
    if (!this.container) return;
    this.container.classList.remove('venn-visible');
    setTimeout(() => {
      if (!this.container.classList.contains('venn-visible')) {
        this.container.innerHTML = '';
      }
    }, 300);
    this.currentTags = [];
    this.activeRegion = null;
    if (this.subFilterCallback) {
      this.subFilterCallback(null);
      this.subFilterCallback = null;
    }
  }

  showSingle(tag, contacts) {
    const matched = contacts.filter(c => c.tags?.includes(tag.id));
    const count = matched.length;

    const r = 58;
    const cx = 150, cy = 80;

    this.container.innerHTML = `
      <svg class="venn-svg" viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg">
        <circle class="venn-circle venn-single"
                cx="${cx}" cy="${cy}" r="${r}"
                fill="${tag.color}" fill-opacity="0.12"
                stroke="${tag.color}" stroke-opacity="0.5" stroke-width="1.5"/>
        <text class="venn-count-text" x="${cx}" y="${cy - 4}"
              text-anchor="middle" fill="${tag.color}" font-size="22" font-weight="600"
              opacity="0">${count}</text>
        <text class="venn-label-text" x="${cx}" y="${cy + 16}"
              text-anchor="middle" fill="var(--color-text-secondary)" font-size="11"
              opacity="0">${tag.name}</text>
      </svg>
      <div class="venn-avatars" id="venn-avatars"></div>
    `;

    this.renderAvatars(matched);
    this.animateSingle();
    this.container.classList.add('venn-visible');
  }

  showDouble(tagA, tagB, contacts) {
    const setA = contacts.filter(c => c.tags?.includes(tagA.id));
    const setB = contacts.filter(c => c.tags?.includes(tagB.id));
    const intersection = contacts.filter(c => c.tags?.includes(tagA.id) && c.tags?.includes(tagB.id));
    const onlyA = setA.filter(c => !c.tags?.includes(tagB.id));
    const onlyB = setB.filter(c => !c.tags?.includes(tagA.id));

    const r = 55;
    const cxA = 115, cxB = 185, cy = 80;
    const blendColor = this.blendColors(tagA.color, tagB.color);

    this.container.innerHTML = `
      <svg class="venn-svg" viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clip-a"><circle cx="${cxA}" cy="${cy}" r="${r}"/></clipPath>
          <clipPath id="clip-b"><circle cx="${cxB}" cy="${cy}" r="${r}"/></clipPath>
        </defs>

        <!-- Left circle -->
        <circle class="venn-circle venn-left" id="venn-region-left"
                cx="${cxA}" cy="${cy}" r="${r}"
                fill="${tagA.color}" fill-opacity="0.12"
                stroke="${tagA.color}" stroke-opacity="0.45" stroke-width="1.5"/>

        <!-- Right circle -->
        <circle class="venn-circle venn-right" id="venn-region-right"
                cx="${cxB}" cy="${cy}" r="${r}"
                fill="${tagB.color}" fill-opacity="0.12"
                stroke="${tagB.color}" stroke-opacity="0.45" stroke-width="1.5"/>

        <!-- Intersection overlay -->
        <circle class="venn-intersection" id="venn-region-inter"
                cx="${cxB}" cy="${cy}" r="${r}"
                clip-path="url(#clip-a)"
                fill="${blendColor}" fill-opacity="0"
                stroke="none"/>

        <!-- Left-only label -->
        <text class="venn-region-label" x="${cxA - 24}" y="${cy - 6}"
              text-anchor="middle" fill="${tagA.color}" font-size="11" opacity="0">
          ${onlyA.length}
        </text>
        <text class="venn-region-sublabel" x="${cxA - 24}" y="${cy + 10}"
              text-anchor="middle" fill="var(--color-text-secondary)" font-size="9" opacity="0">
          ${tagA.name}
        </text>

        <!-- Intersection label -->
        <text class="venn-inter-count" x="${(cxA + cxB) / 2}" y="${cy - 6}"
              text-anchor="middle" fill="${blendColor}" font-size="18" font-weight="600" opacity="0">
          ${intersection.length}
        </text>
        <text class="venn-inter-label" x="${(cxA + cxB) / 2}" y="${cy + 12}"
              text-anchor="middle" fill="var(--color-text-secondary)" font-size="9" opacity="0">
          共同
        </text>

        <!-- Right-only label -->
        <text class="venn-region-label" x="${cxB + 24}" y="${cy - 6}"
              text-anchor="middle" fill="${tagB.color}" font-size="11" opacity="0">
          ${onlyB.length}
        </text>
        <text class="venn-region-sublabel" x="${cxB + 24}" y="${cy + 10}"
              text-anchor="middle" fill="var(--color-text-secondary)" font-size="9" opacity="0">
          ${tagB.name}
        </text>
      </svg>
      <div class="venn-avatars" id="venn-avatars"></div>
    `;

    this.bindRegionClicks(tagA, tagB, contacts, onlyA, intersection, onlyB);
    this.renderAvatars(intersection.length > 0 ? intersection : [...new Set([...setA, ...setB])]);
    this.animateDouble();
    this.container.classList.add('venn-visible');
  }

  animateSingle() {
    const circle = this.container.querySelector('.venn-single');
    const count = this.container.querySelector('.venn-count-text');
    const label = this.container.querySelector('.venn-label-text');

    if (circle) {
      circle.style.transform = 'scale(0)';
      circle.style.transformOrigin = 'center';
      circle.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      requestAnimationFrame(() => { circle.style.transform = 'scale(1)'; });
    }

    setTimeout(() => {
      if (count) { count.style.transition = 'opacity 250ms ease'; count.style.opacity = '1'; }
      if (label) { label.style.transition = 'opacity 250ms ease'; label.style.opacity = '1'; }
    }, 250);
  }

  animateDouble() {
    const left = this.container.querySelector('.venn-left');
    const right = this.container.querySelector('.venn-right');
    const inter = this.container.querySelector('.venn-intersection');

    const regionLabels = this.container.querySelectorAll('.venn-region-label, .venn-region-sublabel');
    const interLabels = this.container.querySelectorAll('.venn-inter-count, .venn-inter-label');

    [left, right].forEach(el => {
      if (!el) return;
      el.style.transform = 'scale(0)';
      el.style.transformOrigin = 'center';
    });

    if (left) {
      left.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      requestAnimationFrame(() => { left.style.transform = 'scale(1)'; });
    }

    setTimeout(() => {
      if (right) {
        right.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        right.style.transform = 'scale(1)';
      }
    }, 120);

    setTimeout(() => {
      if (inter) {
        inter.style.transition = 'fill-opacity 300ms ease';
        inter.setAttribute('fill-opacity', '0.18');
      }
    }, 380);

    setTimeout(() => {
      regionLabels.forEach(el => {
        el.style.transition = 'opacity 200ms ease';
        el.setAttribute('opacity', '1');
      });
      interLabels.forEach(el => {
        el.style.transition = 'opacity 200ms ease';
        el.setAttribute('opacity', '1');
      });
    }, 500);
  }

  bindRegionClicks(tagA, tagB, contacts, onlyA, intersection, onlyB) {
    const svg = this.container.querySelector('.venn-svg');
    if (!svg) return;

    const cxA = 115, cxB = 185, cy = 80, r = 55;

    svg.addEventListener('click', (e) => {
      const rect = svg.getBoundingClientRect();
      const svgWidth = 300, svgHeight = 160;
      const x = (e.clientX - rect.left) / rect.width * svgWidth;
      const y = (e.clientY - rect.top) / rect.height * svgHeight;

      const inA = Math.hypot(x - cxA, y - cy) <= r;
      const inB = Math.hypot(x - cxB, y - cy) <= r;

      let region = null;
      if (inA && inB) region = 'intersection';
      else if (inA) region = 'left-only';
      else if (inB) region = 'right-only';
      else return;

      if (this.activeRegion === region) {
        this.activeRegion = null;
        this.clearHighlight();
        if (this.subFilterCallback) this.subFilterCallback(null);
        this.renderAvatars(intersection.length > 0 ? intersection : [...new Set([...onlyA, ...intersection, ...onlyB])]);
      } else {
        this.activeRegion = region;
        this.highlightRegion(region);
        let filtered;
        if (region === 'left-only') filtered = onlyA;
        else if (region === 'right-only') filtered = onlyB;
        else filtered = intersection;

        if (this.subFilterCallback) {
          this.subFilterCallback({ region, contacts: filtered.map(c => c.id) });
        }
        this.renderAvatars(filtered);
      }
    });

    svg.style.cursor = 'pointer';
  }

  highlightRegion(region) {
    const left = this.container.querySelector('.venn-left');
    const right = this.container.querySelector('.venn-right');
    const inter = this.container.querySelector('.venn-intersection');

    const dim = '0.06';
    const bright = '0.22';

    if (region === 'left-only') {
      left?.setAttribute('fill-opacity', bright);
      right?.setAttribute('fill-opacity', dim);
      inter?.setAttribute('fill-opacity', dim);
    } else if (region === 'right-only') {
      left?.setAttribute('fill-opacity', dim);
      right?.setAttribute('fill-opacity', bright);
      inter?.setAttribute('fill-opacity', dim);
    } else {
      left?.setAttribute('fill-opacity', dim);
      right?.setAttribute('fill-opacity', dim);
      inter?.setAttribute('fill-opacity', '0.3');
    }
  }

  clearHighlight() {
    const left = this.container.querySelector('.venn-left');
    const right = this.container.querySelector('.venn-right');
    const inter = this.container.querySelector('.venn-intersection');
    left?.setAttribute('fill-opacity', '0.12');
    right?.setAttribute('fill-opacity', '0.12');
    inter?.setAttribute('fill-opacity', '0.18');
  }

  renderAvatars(contacts) {
    const container = document.getElementById('venn-avatars');
    if (!container) return;

    container.innerHTML = contacts.slice(0, 8).map((c, i) => {
      const avatarInner = c.avatar
        ? `<img src="${c.avatar}" alt="${c.name}">`
        : `<div class="venn-avatar-placeholder" style="background:${this.getColor(c.name)}">${c.name.charAt(0)}</div>`;
      return `
        <div class="venn-avatar-item fade-in" style="animation-delay:${i * 50}ms" title="${c.name}">
          ${avatarInner}
        </div>
      `;
    }).join('');

    if (contacts.length > 8) {
      container.innerHTML += `<div class="venn-avatar-more">+${contacts.length - 8}</div>`;
    }
  }

  blendColors(a, b) {
    const parse = (hex) => {
      const h = hex.replace('#', '');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const blend = (v1, v2) => Math.round((v1 + v2) / 2).toString(16).padStart(2, '0');
    return `#${blend(r1, r2)}${blend(g1, g2)}${blend(b1, b2)}`;
  }

  getColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length];
  }
}

export default VennDiagram;
