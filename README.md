# 🎨 Paleta de colores · E-Commerce de PCs y Periféricos

Sistema de diseño de colores para una tienda de tecnología y gaming. Incluye tokens para **Tailwind CSS v4**, **Tailwind CSS v3** y **CSS puro**.

---

## 📋 Índice

- [Paleta](#-paleta)
- [Instalación en Tailwind v4](#-tailwind-css-v4)
- [Instalación en Tailwind v3](#-tailwind-css-v3)
- [Variables CSS con modo oscuro](#-variables-css-con-modo-oscuro)
- [Ejemplos de uso](#-ejemplos-de-uso)
- [Reglas de uso y accesibilidad](#-reglas-de-uso-y-accesibilidad)
- [Variante gaming](#-variante-gaming-alternativa)

---

## 🎯 Paleta

### Colores de marca

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Primario | Azul eléctrico | `#2563EB` | Enlaces, botones secundarios, elementos activos |
| Acento (CTA) | Naranja vivo | `#F97316` | "Añadir al carrito", "Comprar ahora", ofertas |
| Acento tech | Cian neón | `#22D3EE` | Badges "Nuevo", hover, iconos destacados |

### Neutros

| Rol | Hex | Uso |
|---|---|---|
| `dark` | `#0B1020` | Header, footer, hero |
| `dark-surface` | `#151B2E` | Tarjetas en modo oscuro |
| `light` | `#F5F7FA` | Fondo general en modo claro |
| `surface` | `#FFFFFF` | Tarjetas de producto |
| `border` | `#E2E8F0` | Divisores, inputs |
| `ink` | `#0F172A` | Títulos y cuerpo |
| `muted` | `#64748B` | Descripciones, specs |

### Semánticos

| Estado | Hex | Uso |
|---|---|---|
| Éxito | `#16A34A` | En stock, pedido confirmado |
| Alerta | `#EAB308` | Poco stock |
| Error | `#DC2626` | Agotado, errores de formulario |
| Oferta | `#E11D48` | Descuentos, precio tachado |

### Categorías

| Categoría | Hex |
|---|---|
| Gaming | `#7C3AED` |
| Oficina / Eco | `#10B981` |

---

## 🌊 Tailwind CSS v4

Tailwind v4 se configura directamente en CSS con la directiva `@theme`. Añade esto en tu archivo principal (por ejemplo `src/app.css` o `globals.css`):

```css
@import "tailwindcss";

@theme {
  /* Marca */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-accent: #f97316;
  --color-accent-hover: #ea580c;
  --color-tech: #22d3ee;

  /* Neutros */
  --color-dark: #0b1020;
  --color-dark-surface: #151b2e;
  --color-light: #f5f7fa;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-ink: #0f172a;
  --color-muted: #64748b;

  /* Semánticos */
  --color-success: #16a34a;
  --color-warning: #eab308;
  --color-danger: #dc2626;
  --color-sale: #e11d48;

  /* Categorías */
  --color-gaming: #7c3aed;
  --color-eco: #10b981;
}
```

Esto genera automáticamente las utilidades: `bg-primary`, `text-accent`, `border-border`, `ring-tech`, etc.

---

## 🌬️ Tailwind CSS v3

Si usas la versión 3, extiende los colores en `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue,svelte}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        accent: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
        },
        tech: "#22D3EE",

        dark: {
          DEFAULT: "#0B1020",
          surface: "#151B2E",
        },
        light: "#F5F7FA",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        ink: "#0F172A",
        muted: "#64748B",

        success: "#16A34A",
        warning: "#EAB308",
        danger: "#DC2626",
        sale: "#E11D48",

        gaming: "#7C3AED",
        eco: "#10B981",
      },
    },
  },
  plugins: [],
};
```

---

## 🌗 Variables CSS con modo oscuro

Para cambiar de tema sin duplicar clases, define tokens semánticos con variables CSS y mapéalos en Tailwind.

### 1. Variables (`globals.css`)

```css
:root {
  --bg: #f5f7fa;
  --bg-elevated: #ffffff;
  --text: #0f172a;
  --text-muted: #64748b;
  --line: #e2e8f0;

  --primary: #2563eb;
  --accent: #f97316;
  --tech: #22d3ee;
}

.dark {
  --bg: #0b1020;
  --bg-elevated: #151b2e;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --line: #243049;

  --primary: #3b82f6;
  --accent: #fb923c;
  --tech: #22d3ee;
}
```

### 2. Mapeo en Tailwind v4

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-bg: var(--bg);
  --color-bg-elevated: var(--bg-elevated);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-line: var(--line);
  --color-primary: var(--primary);
  --color-accent: var(--accent);
  --color-tech: var(--tech);
}
```

### 2b. Mapeo en Tailwind v3

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        line: "var(--line)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        tech: "var(--tech)",
      },
    },
  },
};
```

### 3. Alternar tema

```js
document.documentElement.classList.toggle("dark");
```

---

## 🧩 Ejemplos de uso

### Botón CTA

```html
<button class="bg-accent hover:bg-accent-hover text-dark font-semibold px-6 py-3 rounded-lg transition">
  Añadir al carrito
</button>
```

### Botón secundario

```html
<button class="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-lg transition">
  Ver detalles
</button>
```

### Tarjeta de producto

```html
<article class="bg-surface border border-border rounded-xl p-4 shadow-sm">
  <span class="inline-block bg-tech/15 text-tech text-xs font-semibold px-2 py-1 rounded-full">
    Nuevo
  </span>
  <h3 class="text-ink font-semibold mt-3">Teclado mecánico RGB</h3>
  <p class="text-muted text-sm">Switches rojos · Layout ES</p>

  <div class="flex items-center gap-2 mt-3">
    <span class="text-sale font-bold text-lg">$59.99</span>
    <span class="text-muted line-through text-sm">$79.99</span>
  </div>

  <p class="text-success text-sm mt-1">● En stock</p>
</article>
```

### Badges de estado

```html
<span class="bg-success/10 text-success px-2 py-1 rounded text-xs">En stock</span>
<span class="bg-warning/10 text-warning px-2 py-1 rounded text-xs">Quedan 3</span>
<span class="bg-danger/10 text-danger px-2 py-1 rounded text-xs">Agotado</span>
```

### Hero oscuro

```html
<section class="bg-dark text-white py-20">
  <h1 class="text-4xl font-bold">
    Arma tu PC <span class="text-tech">sin límites</span>
  </h1>
</section>
```

---

## ♿ Reglas de uso y accesibilidad

- **Regla 60-30-10:** 60% neutros, 30% azul primario, 10% naranja para CTAs. El botón de compra siempre debe ser el elemento más llamativo.
- **Texto sobre naranja:** usa `text-dark` (`#0B1020`), no blanco, para mantener el contraste.
- **Texto sobre azul y sobre fondo oscuro:** blanco cumple **WCAG AA**.
- **Cian (`#22D3EE`) sobre fondo blanco** no tiene contraste suficiente para texto; úsalo solo sobre fondos oscuros o como detalle decorativo.
- **No dependas solo del color** para comunicar estados: acompaña con icono o texto ("En stock", "Agotado").
- Verifica tus combinaciones con [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

---

## 🎮 Variante gaming (alternativa)

Para una sección o tienda 100% gamer, sustituye los tokens de marca:

```css
@theme {
  --color-dark: #0a0a0f;
  --color-primary: #8b5cf6;
  --color-accent: #22ff88;
  --color-secondary: #ec4899;
}
```

| Rol | Hex |
|---|---|
| Fondo | `#0A0A0F` |
| Primario (violeta) | `#8B5CF6` |
| Acento (verde neón) | `#22FF88` |
| Secundario (magenta) | `#EC4899` |

---

## 📄 Licencia

Libre para usar en tu proyecto.
