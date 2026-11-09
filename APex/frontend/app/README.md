# PHLOX - E-commerce de Tecnología y Gadgets

Sitio e-commerce completo y funcional construido con React + Vite + Tailwind CSS v4.

## Stack

- React 19 + Vite
- JavaScript puro (sin TypeScript)
- Tailwind CSS v4 (`@tailwindcss/vite`) con tokens de diseño en `src/index.css`
- React Router DOM para enrutamiento
- Zustand para estado del carrito (persistido en localStorage)
- lucide-react para iconos
- clsx + tailwind-merge (función `cn()`)
- Zod para validación de formularios y datos
- Vitest + Testing Library para pruebas

## Estructura de carpetas

```
src/
├── components/
│   ├── layout/          # Header, Footer
│   └── shared/ui/       # Boton, Campo, Skeleton, EstadoVacio,
│                         TarjetaProducto, TarjetaCategoria,
│                         BannerPromo, DrawerCarrito
├── features/
│   ├── carrito/
│   │   └── store.js     # Zustand store con persistencia localStorage
│   └── catalogo/
│       ├── api.js       # Funciones async que imitan API (latencia simulada)
│       └── data/
│           └── products.js  # 16 productos simulados + 6 categorías
├── lib/
│   ├── cn.js            # Utilidad clsx + tailwind-merge
│   └── validaciones.js  # Esquemas Zod
├── pages/
│   ├── Home.jsx         # Landing page completa
│   ├── Tienda.jsx       # Catálogo con filtros y búsqueda
│   ├── Producto.jsx     # Detalle de producto
│   ├── Checkout.jsx     # Checkout en 3 pasos
│   ├── Confirmacion.jsx # Página de confirmación
│   ├── Blog.jsx
│   ├── Nosotros.jsx
│   ├── Contacto.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
├── components/shared/
│   └── ErrorBoundary.jsx
├── App.jsx              # Rutas con React.lazy + Suspense
├── main.jsx
└── index.css            # Tokens de paleta (obligatoria)
```

## Instalación y ejecución

### Requisitos

- Node.js 18+
- npm

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:5173

# 4. Build para producción
npm run build

# 5. Preview del build
npm run preview

# 6. Ejecutar pruebas
npm test
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (pruebas unitarias) |

## Paleta de colores (obligatoria)

Definida en `src/index.css` usando `@theme` de Tailwind v4:

- **primary**: #2563eb (CTA principal, logo PHLOX)
- **primary-hover**: #1d4ed8
- **accent**: #f97316 (CTA secundario, botones de banner)
- **accent-hover**: #ea580c
- **tech**: #22d3ee (detalles, bordes sobre fondos oscuros)
- **dark**: #0b1020 (fondos oscuros, categorías)
- **dark-surface**: #151b2e (tarjetas sobre dark)
- **light**: #f5f7fa (fondo de página)
- **surface**: #ffffff (tarjetas, paneles)
- **border**: #e2e8f0 (bordes decorativos)
- **ink**: #0f172a (texto principal)
- **muted-strong**: #475569 (texto secundario)
- **sale**: #e11d48 (ofertas, texto blanco)
- **gaming**: #7c3aed (categoría consolas)
- **eco**: #10b981 (categoría parlantes)

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home / Landing page |
| `/tienda` | Catálogo con filtros |
| `/tienda?categoria=<id>` | Filtrar por categoría |
| `/producto/:slug` | Detalle de producto |
| `/checkout` | Checkout en 3 pasos |
| `/confirmacion` | Confirmación de pedido |
| `/blog` | Blog |
| `/nosotros` | Nosotros |
| `/contacto` | Contacto |
| `/login` | Login / Registro simulado |
| `*` | 404 |

## Características UX/UI

- Diseño móvil primero (360px)
- Estados de carga (skeletons), vacío, error y éxito
- Carrito persistido en localStorage con toast "Deshacer"
- Checkout con validación Zod y 3 pasos
- Búsqueda con filtros en query string
- Accesibilidad WCAG 2.2 AA (foco visible, aria-labels, semántica HTML)
- Contrastes verificados según la paleta definida
