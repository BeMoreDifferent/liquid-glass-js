/** @module LiquidGlass */
/**
 * <liquid-glass> — advanced "liquid glass" container or link with proper displacement effects.
 * Acts like a normal <div> (default) or <a> when `href` is present.
 *
 * Attributes:
 * - href, target, rel, download → link semantics (like <a>)
 * - interactive (boolean) → when no href, adds button-like keyboard activation
 * - disabled (boolean) → sets aria-disabled and blocks interaction
 * - elevated (boolean) → stronger border/tint (visual only)
 * - strength (number) → displacement strength (default: 100)
 * - depth (number) → glass depth effect (default: 10)
 * - blur (number) → blur amount (default: 2)
 * - chromatic (number) → chromatic aberration amount (default: 0)
 *
 * Events:
 * - Standard 'click' bubbles from the host (prevented when disabled)
 *
 * Accessibility:
 * - Uses real <a> if href; else, if interactive, sets role=button + keyboard (Enter/Space).
 */
export class LiquidGlass extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'target', 'rel', 'download', 'interactive', 'disabled', 'strength', 'depth', 'blur', 'chromatic'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./liquid-glass.css">
      <div class="surface" part="surface"><slot></slot></div>
    `;
    this._surface = this.shadowRoot.querySelector('.surface');
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._resizeObserver = null;
    this._updateFilter = this._updateFilter.bind(this);
    this._pending = false;
    this._prev = {};
    
    // Compute support once per class, not per instance
    if (LiquidGlass._advSupported == null) {
      LiquidGlass._advSupported = this._supportsAdvancedFilters();
    }
    this._advSupported = LiquidGlass._advSupported;
    
    // Stable filter ID per element (no Date.now/random per resize)
    this._filterId = `lg-${Math.random().toString(36).slice(2)}`;
  }

  connectedCallback() {
    this._upgrade();
    this._syncSurface();
    this.addEventListener('keydown', this._onKeyDown);
    this._surface.addEventListener('click', this._onClick);
    this._setupInteractionListeners();
    
    // rAF-coalesced resize observer to prevent cascades of updates
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        if (this._pending) return;
        this._pending = true;
        requestAnimationFrame(() => {
          this._pending = false;
          this._updateFilter();
        });
      });
      this._resizeObserver.observe(this);
    }
    
    // Initial filter update
    this._updateFilter();
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKeyDown);
    this._surface.removeEventListener('click', this._onClick);
    this._removeInteractionListeners();
    
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._syncSurface();
    if (['strength', 'depth', 'blur', 'chromatic'].includes(name)) {
      this._updateFilter();
    }
    if (['href', 'interactive', 'disabled'].includes(name)) {
      this._setupInteractionListeners();
    }
  }

  /** Swap inner element to <a> when href exists; otherwise <div>. */
  _syncSurface() {
    const needsAnchor = this.hasAttribute('href');
    const isAnchor = this._surface.tagName === 'A';

    if (needsAnchor && !isAnchor) {
      const a = document.createElement('a');
      a.className = 'surface';
      a.setAttribute('part', 'surface');
      a.append(...this._moveSlot());
      this._surface.replaceWith(a);
      this._surface = a;
      this._surface.addEventListener('click', this._onClick);
    } else if (!needsAnchor && isAnchor) {
      const d = document.createElement('div');
      d.className = 'surface';
      d.setAttribute('part', 'surface');
      d.append(...this._moveSlot());
      this._surface.replaceWith(d);
      this._surface = d;
      this._surface.addEventListener('click', this._onClick);
    }

    // Common attributes
    this._surface.tabIndex = -1; // host handles focus
    this.toggleAttribute('disabled', this.hasAttribute('disabled'));
    this._surface.setAttribute('aria-disabled', this.hasAttribute('disabled') ? 'true' : 'false');

    if (needsAnchor) {
      this._surface.href = this.getAttribute('href') || '';
      const t = this.getAttribute('target');
      if (t) this._surface.target = t;
      const rel = this.getAttribute('rel') || (t === '_blank' ? 'noopener noreferrer' : '');
      if (rel) this._surface.rel = rel;
      const dl = this.getAttribute('download');
      if (dl !== null) this._surface.setAttribute('download', dl === '' ? '' : dl);
      // Make the host focusable when linky.
      if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      this.removeAttribute('role');
    } else {
      // Div mode: optional button-like semantics
      const interactive = this.hasAttribute('interactive');
      if (interactive) {
        this.setAttribute('role', 'button');
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      } else {
        this.removeAttribute('role');
        if (!this.hasAttribute('tabindex')) this.removeAttribute('tabindex');
      }
    }
  }

  _onClick(ev) {
    if (this.hasAttribute('disabled')) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    // Forward click to host so consumers can listen on <liquid-glass>.
    if (ev.target !== this) this.dispatchEvent(new MouseEvent('click', ev));
  }

  _onKeyDown(ev) {
    if (this.hasAttribute('disabled')) return;
    // Button-like activation when interactive and no href
    if (!this.hasAttribute('href') && this.hasAttribute('interactive')) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        this._surface.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      }
    }
    // When href is set, Enter activation is handled natively by the <a> in shadow (host has focus).
    if (this.hasAttribute('href') && ev.key === 'Enter') {
      ev.preventDefault();
      this._surface.click();
    }
  }

  _moveSlot() {
    const slot = this.shadowRoot.querySelector('slot');
    return slot ? [slot] : [];
  }

  /** Check if element should have interactive states */
  _isInteractive() {
    return (this.hasAttribute('href') || this.hasAttribute('interactive')) && !this.hasAttribute('disabled');
  }

  /** Setup interaction listeners only for interactive elements */
  _setupInteractionListeners() {
    this._removeInteractionListeners();
    // Only add hover effects for interactive elements
    if (this._isInteractive()) {
      this.addEventListener('mouseenter', this._onMouseEnter);
      this.addEventListener('mouseleave', this._onMouseLeave);
    }
  }

  /** Remove interaction listeners */
  _removeInteractionListeners() {
    this.removeEventListener('mouseenter', this._onMouseEnter);
    this.removeEventListener('mouseleave', this._onMouseLeave);
  }

  /** Handle mouse enter - apply Liquid Glass hover state */
  _onMouseEnter() {
    if (!this._isInteractive()) return;
    this.style.setProperty('--lg-opacity', '1');
    this.style.setProperty('--lg-scale', '1.02');
  }

  /** Handle mouse leave - reset to default state */
  _onMouseLeave() {
    if (!this._isInteractive()) return;
    this.style.setProperty('--lg-opacity', '0.85');
    this.style.setProperty('--lg-scale', '1');
  }

  _upgrade() {
    // ensure boolean attributes reflect properties if you later add props
  }

  /** Get attribute value as number with default */
  _getNumberAttribute(name, defaultValue) {
    const value = this.getAttribute(name);
    return value ? parseFloat(value) : defaultValue;
  }

  /** Create displacement map SVG */
  _getDisplacementMap({ height, width, radius, depth }) {
    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
          .mix { mix-blend-mode: screen; }
      </style>
      <defs>
          <linearGradient 
            id="Y-${this._filterId}" 
            x1="0" 
            x2="0" 
            y1="${Math.ceil((radius / height) * 15)}%" 
            y2="${Math.floor(100 - (radius / height) * 15)}%">
              <stop offset="0%" stop-color="#0F0" />
              <stop offset="100%" stop-color="#000" />
          </linearGradient>
          <linearGradient 
            id="X-${this._filterId}" 
            x1="${Math.ceil((radius / width) * 15)}%" 
            x2="${Math.floor(100 - (radius / width) * 15)}%"
            y1="0" 
            y2="0">
              <stop offset="0%" stop-color="#F00" />
              <stop offset="100%" stop-color="#000" />
          </linearGradient>
      </defs>

      <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
      <g filter="blur(2px)">
        <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
        <rect
            x="0"
            y="0"
            height="${height}"
            width="${width}"
            fill="url(#Y-${this._filterId})"
            class="mix"
        />
        <rect
            x="0"
            y="0"
            height="${height}"
            width="${width}"
            fill="url(#X-${this._filterId})"
            class="mix"
        />
        <rect
            x="${depth}"
            y="${depth}"
            height="${height - 2 * depth}"
            width="${width - 2 * depth}"
            fill="#808080"
            rx="${radius}"
            ry="${radius}"
            filter="blur(${depth}px)"
        />
      </g>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  /** Create displacement filter */
  _getDisplacementFilter({ height, width, radius, depth, strength, chromaticAberration }) {
    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
          <filter id="displace-${this._filterId}" color-interpolation-filters="sRGB">
              <feImage x="0" y="0" height="${height}" width="${width}" href="${this._getDisplacementMap({
      height,
      width,
      radius,
      depth,
    })}" result="displacementMap" />
              <feDisplacementMap
                  transform-origin="center"
                  in="SourceGraphic"
                  in2="displacementMap"
                  scale="${strength + chromaticAberration * 2}"
                  xChannelSelector="R"
                  yChannelSelector="G"
              />
              <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="displacedR"
                      />
              <feDisplacementMap
                  in="SourceGraphic"
                  in2="displacementMap"
                  scale="${strength + chromaticAberration}"
                  xChannelSelector="R"
                  yChannelSelector="G"
              />
              <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="displacedG"
                      />
              <feDisplacementMap
                      in="SourceGraphic"
                      in2="displacementMap"
                      scale="${strength}"
                      xChannelSelector="R"
                      yChannelSelector="G"
                  />
                  <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0
                          0 0 0 0 0
                          0 0 1 0 0
                          0 0 0 1 0"
                  result="displacedB"
                          />
                <feBlend in="displacedR" in2="displacedG" mode="screen"/>
                <feBlend in2="displacedB" mode="screen"/>
          </filter>
      </defs>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace-" + this._filterId;
  }

  /** Check if advanced SVG filters are supported - compute once per class */
  _supportsAdvancedFilters() {
    // Fast path - just check CSS support without DOM mutations
    try {
      return CSS.supports('backdrop-filter', 'url(#x)');
    } catch {
      return false;
    }
  }

  /** Update the filter based on current element size and attributes */
  _updateFilter(force = false) {
    const rect = this.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Quantize to integers to avoid thrash while dragging
    const height = Math.round(rect.height);
    const width = Math.round(rect.width);
    const radius = 16; // Default radius
    const depth = this._getNumberAttribute('depth', 10);
    const strength = this._getNumberAttribute('strength', 100);
    const chromaticAberration = this._getNumberAttribute('chromatic', 0);
    const blur = this._getNumberAttribute('blur', 2);

    // Only touch CSS if changed
    if (this._prev.blur !== blur) {
      this.style.setProperty('--lg-blur', `${blur}px`);
    }

    // Set default interactive state only for interactive elements
    if (this._isInteractive()) {
      this.style.setProperty('--lg-opacity', '0.85');
      this.style.setProperty('--lg-scale', '1');
    } else {
      // Remove any state properties for non-interactive elements
      this.style.removeProperty('--lg-opacity');
      this.style.removeProperty('--lg-scale');
    }

    // Skip heavy work if nothing relevant changed
    const key = `${width}x${height}:${depth}:${strength}:${chromaticAberration}`;
    if (!force && this._prev.key === key) return;
    this._prev = { key, blur };

    // Only apply advanced displacement filter if supported
    if (this._advSupported && (strength > 0 || chromaticAberration > 0)) {
      // Create and inject the filter (using stable filter ID)
      const filterUrl = this._getDisplacementFilter({
        height,
        width,
        radius,
        depth,
        strength,
        chromaticAberration,
      });

      // Update the CSS custom property with the advanced filter
      this.style.setProperty('--lg-filter', `url('${filterUrl}')`);
    } else {
      // Clear the advanced filter, rely on blur fallback
      this.style.setProperty('--lg-filter', 'none');
    }
  }
}

// Define once
if (!customElements.get('liquid-glass')) {
  customElements.define('liquid-glass', LiquidGlass);
}
