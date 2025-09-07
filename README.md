# Liquid Glass JS

A modern JavaScript library for creating stunning liquid glass effects with both CSS classes and web components. Features advanced SVG displacement filters, chromatic aberration, and smooth animations.

> **Inspired by**: [Liquid Glass in CSS (and SVG)](https://medium.com/ekino-france/liquid-glass-in-css-and-svg-839985fcb88d) by Adrien Gautier, but modified for custom HTML components and heavily optimized for rendering speed and reduced battery usage.

## Features

- 🌊 **Liquid Glass Effects**: Advanced displacement and blur effects
- 🎨 **Chromatic Aberration**: RGB channel separation for realistic glass distortion
- ⚡ **Web Components**: Modern `<liquid-glass>` custom element
- 🎯 **CSS Classes**: Simple class-based implementation
- 📱 **Responsive**: Works on all devices and screen sizes
- ♿ **Accessible**: Full keyboard navigation and screen reader support
- 🎛️ **Customizable**: Extensive configuration options

## Quick Start

### Web Component (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./liquid-glass.css">
    <script type="module" src="./liquid-glass.js"></script>
</head>
<body>
    <!-- Basic glass effect -->
    <liquid-glass>
        Hello, Glass World!
    </liquid-glass>

    <!-- Interactive button -->
    <liquid-glass interactive strength="120" depth="15">
        Click me!
    </liquid-glass>

    <!-- Link with glass effect -->
    <liquid-glass href="https://example.com" strength="100">
        Visit Example
    </liquid-glass>
</body>
</html>
```

### CSS Classes

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./liquid-glass.css">
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <!-- Basic glass container -->
    <div class="liquid-glass">
        Static glass container
    </div>

    <!-- Elevated style -->
    <div class="liquid-glass" data-elevated="true">
        Enhanced glass effect
    </div>
</body>
</html>
```

## Web Component API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `strength` | number | 100 | Displacement strength (0-200) |
| `depth` | number | 10 | Glass depth effect (0-30) |
| `blur` | number | 2 | Blur amount (0-10) |
| `chromatic` | number | 0 | Chromatic aberration (0-50) |
| `interactive` | boolean | false | Enable button-like interaction |
| `disabled` | boolean | false | Disable interactions |
| `elevated` | boolean | false | Enhanced visual styling |
| `href` | string | - | Make it a link (like `<a>`) |
| `target` | string | - | Link target (when href is set) |
| `rel` | string | - | Link relationship (when href is set) |

### Examples

```html
<!-- Subtle effect -->
<liquid-glass strength="50" blur="1" depth="5">
    Subtle glass effect
</liquid-glass>

<!-- Strong effect with chromatic aberration -->
<liquid-glass strength="150" chromatic="20" depth="15">
    Strong glass with color separation
</liquid-glass>

<!-- Interactive button -->
<liquid-glass interactive strength="100" blur="3">
    Interactive button
</liquid-glass>

<!-- Link component -->
<liquid-glass href="https://github.com" target="_blank" strength="80">
    GitHub Link
</liquid-glass>

<!-- Disabled state -->
<liquid-glass disabled strength="100">
    Disabled glass element
</liquid-glass>
```

## CSS Custom Properties

The web component supports CSS custom properties for advanced styling:

```css
liquid-glass {
    --lg-blur: 8px;
    --lg-saturate: 1.2;
    --lg-contrast: 1.1;
    --lg-brightness: 1.05;
    --lg-bg: rgba(255, 255, 255, 0.15);
    --lg-border: rgba(255, 255, 255, 0.3);
    --lg-radius: 20px;
}
```

## Browser Support

- ✅ Chrome 88+
- ✅ Firefox 87+
- ✅ Safari 14+
- ✅ Edge 88+

**Note**: Advanced displacement effects require modern browsers with SVG filter support. The library gracefully falls back to blur-only effects on older browsers.

## Performance

- Optimized with ResizeObserver for efficient updates
- RequestAnimationFrame-coalesced filter updates
- Minimal DOM mutations
- Lazy filter generation

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- Focus management
- ARIA attributes
- Reduced motion support

## Installation

### Direct Download

1. Download `liquid-glass.js` and `liquid-glass.css`
2. Include in your HTML:

```html
<link rel="stylesheet" href="./liquid-glass.css">
<script type="module" src="./liquid-glass.js"></script>
```


## Examples

Check out the [live demo](https://bemoredifferent.github.io/liquid-glass-js/) to see all effects in action.


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Web component implementation
- CSS class support
- Advanced SVG displacement filters
- Chromatic aberration effects
- Full accessibility support
