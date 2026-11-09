import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Cpu, Heart, ImageOff, ShoppingCart } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Normalización de datos de la API                                   */
/*                                                                     */
/*  ProductosSection ya NO consume la API. Estas utilidades se         */
/*  mantienen porque CatalogoPage las importa para dar forma a los     */
/*  productos que sí vienen del backend.                               */
/* ------------------------------------------------------------------ */

function parseSpecs(raw) {
  let specs = raw;
  if (typeof specs === "string") {
    try {
      specs = JSON.parse(specs);
    } catch {
      return [];
    }
  }
  if (Array.isArray(specs)) {
    return specs
      .map((s) => [s.key ?? s.name ?? s.label, s.value])
      .filter(([k, v]) => k && v != null);
  }
  if (specs && typeof specs === "object") return Object.entries(specs).filter(([, v]) => v != null && v !== "");
  return [];
}

function normalize(p) {
  const old = p.compare_price ?? p.old_price ?? p.original_price ?? null;
  const img = p.image ?? p.image_url ?? p.images?.[0]?.url ?? p.images?.[0] ?? null;
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    name: p.name ?? p.title ?? "Producto",
    price: Number(p.price) || 0,
    oldPrice: old != null ? Number(old) : null,
    stock: p.stock ?? p.quantity ?? null,
    image: typeof img === "string" ? img : null,
    categoryId: p.category_id ?? p.category?.id ?? null,
    categorySlug: p.category_slug ?? p.category?.slug ?? null,
    categoryName:
      p.category_name ?? p.category?.name ?? (typeof p.category === "string" ? p.category : null),
    specs: parseSpecs(p.specs),
  };
}

export const toList = (data) =>
  (Array.isArray(data) ? data : data?.products ?? data?.data ?? []).map(normalize);

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

export const fmt = (n) => new Intl.NumberFormat("es-DO").format(n);

// Cada categoría toma un color de la paleta (estable según su id o nombre)
const TONES = [
  "var(--color-primary, #2563eb)",
  "var(--color-accent, #f97316)",
  "var(--color-tech, #22d3ee)",
  "var(--color-gaming, #7c3aed)",
  "var(--color-sale, #e11d48)",
  "var(--color-eco, #10b981)",
];
export const toneFor = (key) => {
  const s = String(key ?? "x");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

/* ------------------------------------------------------------------ */
/*  Tarjeta de producto (también la usa CatalogoPage)                  */
/*                                                                     */
/*  Opcionales en `product`:                                           */
/*    art  -> elemento React que se dibuja en lugar de la imagen       */
/*    tone -> color CSS para la categoría (si no, se calcula)          */
/* ------------------------------------------------------------------ */

export function ProductCard({ product, index, wished, onToggleWish, onAdd }) {
  const [broken, setBroken] = useState(false);
  const [added, setAdded] = useState(false);

  const { name, slug, price, oldPrice, stock, image, categoryId, categoryName, specs, art } = product;
  const tone = product.tone ?? toneFor(categoryId ?? categoryName);
  const soldOut = stock !== null && Number(stock) <= 0;
  const low = !soldOut && stock !== null && Number(stock) <= 5;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
  const showImage = image && !broken;

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article
      className="pr-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10"
      style={{ "--i": Math.min(index, 11) }}
    >
      {/* Imagen */}
      <div className="relative">
        <Link
          to={`/producto/${slug}`}
          aria-label={`Ver ${name}`}
          className="relative block aspect-[4/3] overflow-hidden bg-light focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          {art ? (
            <div
              className={`grid h-full w-full place-items-center p-5 transition duration-500 group-hover:scale-105 ${
                soldOut ? "opacity-50 grayscale" : ""
              }`}
              style={{ background: `color-mix(in oklab, ${tone} 9%, white)` }}
            >
              {art}
            </div>
          ) : showImage ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
              className={`h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105 ${
                soldOut ? "opacity-50 grayscale" : ""
              }`}
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center"
              style={{ background: `color-mix(in oklab, ${tone} 12%, white)`, color: tone }}
            >
              {image && broken ? <ImageOff size={44} strokeWidth={1.25} /> : <Cpu size={52} strokeWidth={1.1} />}
            </div>
          )}
        </Link>

        {/* Etiquetas */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && !soldOut && (
            <span className="rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">-{discount}%</span>
          )}
          {low && (
            <span className="rounded-md bg-warning px-2 py-1 text-xs font-bold text-ink">Últimas {stock}</span>
          )}
          {soldOut && <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">Agotado</span>}
        </div>

        {/* Favoritos */}
        <button
          type="button"
          onClick={() => onToggleWish(product)}
          aria-pressed={wished}
          aria-label={wished ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border bg-surface/90 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            wished ? "border-sale text-sale" : "border-border text-muted hover:text-sale"
          }`}
        >
          <Heart size={18} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {categoryName && (
          <p
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: `color-mix(in oklab, ${tone} 70%, black)` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
            {categoryName}
          </p>
        )}

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-ink">
          <Link to={`/producto/${slug}`} className="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            {name}
          </Link>
        </h3>

        {specs.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {specs.slice(0, 3).map(([k, v]) => (
              <li key={k} title={String(k)} className="max-w-full truncate rounded-md bg-light px-2 py-1 text-xs text-muted">
                {String(v)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {discount > 0 && <p className="text-sm text-muted line-through">${fmt(oldPrice)}</p>}
            <p className="text-xl font-extrabold tabular-nums text-ink">${fmt(price)}</p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={`Agregar ${name} al carrito`}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-border disabled:text-muted ${
              added ? "bg-success" : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            {soldOut ? "Agotado" : added ? "Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface" aria-hidden>
      <div className="aspect-[4/3] bg-light" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-light" />
        <div className="h-4 w-4/5 rounded bg-light" />
        <div className="h-4 w-3/5 rounded bg-light" />
        <div className="flex items-end justify-between pt-4">
          <div className="h-6 w-24 rounded bg-light" />
          <div className="h-10 w-28 rounded-lg bg-light" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ilustraciones de los productos destacados                          */
/* ------------------------------------------------------------------ */

function Fan({ cx, cy, r, color = "#22d3ee", dur = 2.4, reverse = false }) {
  const blades = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0b1020" stroke={color} strokeOpacity=".75" strokeWidth="1.6" />
      <g className="ps-spin" style={{ animationDuration: `${dur}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        <circle cx={cx} cy={cy} r={r} fill="transparent" />
        {blades.map((a) => (
          <ellipse
            key={a}
            cx={cx}
            cy={cy - r * 0.5}
            rx={r * 0.18}
            ry={r * 0.36}
            transform={`rotate(${a} ${cx} ${cy}) rotate(26 ${cx} ${cy - r * 0.5})`}
            fill={color}
            fillOpacity=".8"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.2} fill="#151b2e" stroke={color} strokeWidth="1.2" />
    </g>
  );
}

function PcArt() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-auto" aria-hidden>
      <rect x="8" y="8" width="184" height="244" rx="16" fill="#0b1020" stroke="#22d3ee" strokeOpacity=".45" strokeWidth="1.5" />
      <Fan cx={64} cy={66} r={36} />
      <Fan cx={136} cy={66} r={36} reverse />
      <rect x="72" y="124" width="56" height="56" rx="14" fill="#151b2e" stroke="#22d3ee" strokeWidth="1.4" />
      <circle cx="100" cy="152" r="16" fill="#0b1020" stroke="#2563eb" strokeWidth="2" className="ps-pulse" />
      <rect x="24" y="196" width="152" height="32" rx="8" fill="#151b2e" stroke="#22d3ee" strokeOpacity=".5" />
      <Fan cx={56} cy={212} r={11} dur={1.8} />
      <Fan cx={88} cy={212} r={11} dur={1.8} reverse />
      <rect x="118" y="209" width="46" height="5" rx="2.5" fill="#f97316" className="ps-pulse" />
      <path d="M34 10 L110 10 L62 250 L12 250 Z" fill="#fff" fillOpacity=".05" />
    </svg>
  );
}

function GpuArt() {
  return (
    <svg viewBox="0 0 260 110" className="h-full w-full" aria-hidden>
      <rect x="6" y="10" width="236" height="78" rx="13" fill="#0b1020" stroke="#7c3aed" strokeOpacity=".7" strokeWidth="1.5" />
      <rect x="22" y="16" width="204" height="4" rx="2" fill="#f97316" className="ps-pulse" />
      <Fan cx={74} cy={52} r={27} color="#a78bfa" dur={1.9} />
      <Fan cx={162} cy={52} r={27} color="#a78bfa" dur={1.9} reverse />
      <rect x="40" y="88" width="112" height="9" rx="2" fill="#f97316" fillOpacity=".85" />
      {[46, 56, 66, 76, 86, 96, 106, 116, 126, 136, 146].map((x) => (
        <line key={x} x1={x} y1="90" x2={x} y2="96" stroke="#0b1020" strokeWidth="1.5" />
      ))}
      <rect x="236" y="22" width="14" height="54" rx="3" fill="#7c3aed" fillOpacity=".5" />
    </svg>
  );
}

function CpuArt() {
  const pins = Array.from({ length: 10 }, (_, i) => 44 + i * 12);
  return (
    <svg viewBox="0 0 200 200" className="h-full w-auto" aria-hidden>
      {pins.map((p) => (
        <g key={p} stroke="#2563eb" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round">
          <line x1={p} y1="12" x2={p} y2="30" />
          <line x1={p} y1="170" x2={p} y2="188" />
          <line x1="12" y1={p} x2="30" y2={p} />
          <line x1="170" y1={p} x2="188" y2={p} />
        </g>
      ))}
      <rect x="30" y="30" width="140" height="140" rx="16" fill="#151b2e" stroke="#2563eb" strokeWidth="2" />
      <rect x="48" y="48" width="104" height="104" rx="10" fill="#0b1020" stroke="#22d3ee" strokeOpacity=".7" className="ps-pulse" />
      <text x="100" y="94" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">RYZEN 7</text>
      <text x="100" y="114" textAnchor="middle" fontSize="12" fontWeight="700" fill="#22d3ee">7800X3D</text>
      <path d="M30 46 L30 30 L46 30 Z" fill="#f97316" />
    </svg>
  );
}

function MonitorArt() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-auto" aria-hidden>
      <defs>
        <linearGradient id="ps-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="220" height="136" rx="10" fill="#0b1020" stroke="#e11d48" strokeOpacity=".6" strokeWidth="1.5" />
      <rect x="18" y="18" width="204" height="120" rx="5" fill="url(#ps-screen)" />
      <path d="M18 108 C60 80 90 128 130 100 S190 84 222 104 L222 138 L18 138 Z" fill="#0b1020" fillOpacity=".45" />
      <circle cx="170" cy="52" r="16" fill="#fff" fillOpacity=".85" className="ps-pulse" />
      <rect x="108" y="146" width="24" height="24" fill="#151b2e" />
      <rect x="76" y="168" width="88" height="9" rx="4.5" fill="#151b2e" stroke="#e11d48" strokeOpacity=".5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Productos destacados (datos de ejemplo, sin API)                   */
/*  Edita esta lista cuando quieras cambiar el carrusel.               */
/* ------------------------------------------------------------------ */

export const featured = [
  {
    id: "titan-obsidian-x",
    slug: "titan-obsidian-x",
    name: "Titan Obsidian X",
    categoryName: "PC Armada",
    tone: "var(--color-tech, #22d3ee)",
    price: 84999,
    oldPrice: null,
    stock: 8,
    specs: [["GPU", "RTX 4090"], ["CPU", "Ryzen 7 7800X3D"], ["RAM", "32 GB DDR5"]],
    art: <PcArt />,
  },
  {
    id: "rtx-4090-24gb",
    slug: "nvidia-geforce-rtx-4090",
    name: "NVIDIA GeForce RTX 4090 24 GB",
    categoryName: "Tarjetas GPU",
    tone: "var(--color-gaming, #7c3aed)",
    price: 119999,
    oldPrice: null,
    stock: 12,
    specs: [["Arquitectura", "Ada"], ["Memoria", "24 GB GDDR6X"], ["Resolución", "4K Ultra"]],
    art: <GpuArt />,
  },
  {
    id: "ryzen-7-7800x3d",
    slug: "amd-ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    categoryName: "Procesadores",
    tone: "var(--color-primary, #2563eb)",
    price: 24999,
    oldPrice: 27999,
    stock: 20,
    specs: [["Núcleos", "8 núcleos"], ["Socket", "AM5"], ["Caché", "3D V-Cache"]],
    art: <CpuArt />,
  },
  {
    id: "monitor-oled-240",
    slug: "monitor-oled-27-240hz",
    name: 'Monitor OLED 27" 240 Hz',
    categoryName: "Monitores OLED",
    tone: "var(--color-sale, #e11d48)",
    price: 42999,
    oldPrice: null,
    stock: 3,
    specs: [["Panel", "OLED"], ["Frecuencia", "240 Hz"], ["Respuesta", "0.03 ms"]],
    art: <MonitorArt />,
  },
];

/* ------------------------------------------------------------------ */
/*  Carrusel tipo coverflow                                            */
/*                                                                     */
/*  El producto activo va al centro, grande y con sombra; los vecinos  */
/*  se reducen, se atenúan y quedan parcialmente tapados por él. Se    */
/*  navega con las flechas, el teclado, deslizando, o tocando un       */
/*  vecino. Es circular: el último producto vuelve al primero.         */
/* ------------------------------------------------------------------ */

// x: separación del centro (en anchos de tarjeta), s: escala, o: opacidad, dim: velo oscuro
const SLOTS = {
  0: { x: 0, s: 1, o: 1, dim: 0 },
  1: { x: 0.8, s: 0.84, o: 1, dim: 0.1 },
  2: { x: 1.4, s: 0.7, o: 0.75, dim: 0.2 },
};
const HIDDEN = { x: 0, s: 0.6, o: 0, dim: 0.2 };

export default function ProductosSection({
  products = featured,
  onAddToCart = () => {},
  onToggleWishlist = () => {},
  wishlist = new Set(),
}) {
  const [active, setActive] = useState(0);
  const drag = useRef({ x: 0, down: false, moved: false });

  const n = products.length;
  if (n === 0) return null;

  const R = n >= 5 ? 2 : 1; // cuántos vecinos se ven a cada lado
  const go = (dir) => setActive((a) => (a + dir + n) % n);
  const offsetOf = (i) => {
    let d = (((i - active) % n) + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  const current = products[active];
  const currentTone = current.tone ?? toneFor(current.categoryId ?? current.categoryName);

  const toggleWish = (product) => onToggleWishlist(product, !wishlist.has(product.id));

  // Deslizar con el dedo o el mouse
  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, down: true, moved: false };
  };
  const onPointerUp = (e) => {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.x;
    drag.current.down = false;
    if (Math.abs(dx) > 50) {
      drag.current.moved = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onClickCapture = (e) => {
    // si fue un arrastre, no dispares el clic del botón o enlace que estaba debajo
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  const circle =
    "grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink transition hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <section id="productos" className="overflow-hidden bg-surface px-6 py-16 sm:py-20" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .pr-card { animation: pr-in .55s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(var(--i) * 70ms); }
        .ps-spin { transform-box: fill-box; transform-origin: center; animation: ps-spin linear infinite; }
        .ps-pulse { animation: ps-pulse 2.6s ease-in-out infinite; }
        .cf-item { transition: transform .65s cubic-bezier(.22,.9,.28,1), opacity .5s ease, visibility .65s, box-shadow .65s ease; will-change: transform; }
        .cf-dim { transition: opacity .5s ease; }
        .cf-glow { transition: background-color .8s ease; }
        @keyframes pr-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ps-spin { to { transform: rotate(360deg); } }
        @keyframes ps-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .pr-card, .ps-spin, .ps-pulse { animation: none; }
          .cf-item, .cf-dim, .cf-glow { transition: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Productos destacados</h2>
          <Link
            to="/catalogo"
            className="group inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Ver todo el catálogo
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div role="region" aria-roledescription="carrusel" aria-label="Productos destacados" onKeyDown={onKeyDown} className="mt-6">
          {/* Escenario */}
          <div
            className="relative mx-auto h-[31rem] [--cw:17.5rem] sm:[--cw:20rem]"
            style={{ touchAction: "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (drag.current.down = false)}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Luz del color de la categoría activa, detrás de la tarjeta central */}
            <div
              aria-hidden
              className="cf-glow pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
              style={{ background: currentTone }}
            />

            {products.map((p, i) => {
              const d = offsetOf(i);
              const abs = Math.abs(d);
              const visible = abs <= R;
              const slot = visible ? SLOTS[abs] : HIDDEN;
              const isActive = d === 0;
              const sign = Math.sign(d);

              return (
                <div
                  key={p.id}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} de ${n}`}
                  aria-hidden={!isActive}
                  className="cf-item absolute left-0 top-0 h-full rounded-2xl"
                  style={{
                    left: "50%",
                    width: "var(--cw)",
                    transform: `translateX(calc(-50% + ${sign * slot.x} * var(--cw))) scale(${slot.s})`,
                    opacity: slot.o,
                    visibility: visible ? "visible" : "hidden",
                    zIndex: visible ? 30 - abs * 10 : 0,
                    boxShadow: isActive
                      ? "0 36px 60px -24px rgba(15,23,42,.4), 0 12px 24px -12px rgba(15,23,42,.18)"
                      : "0 14px 28px -16px rgba(15,23,42,.3)",
                  }}
                >
                  {/* inert: los vecinos no reciben foco ni clics internos */}
                  <div ref={(el) => el && (el.inert = !isActive)} className="h-full">
                    <ProductCard
                      product={p}
                      index={i}
                      wished={wishlist.has(p.id)}
                      onToggleWish={toggleWish}
                      onAdd={onAddToCart}
                    />
                  </div>

                  {/* Velo que atenúa a los vecinos */}
                  <div
                    aria-hidden
                    className="cf-dim pointer-events-none absolute inset-0 rounded-2xl bg-ink"
                    style={{ opacity: slot.dim }}
                  />

                  {/* Al tocar un vecino, pasa al centro */}
                  {!isActive && visible && (
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Ver ${p.name}`}
                      className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Controles */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => go(-1)} aria-label="Producto anterior" className={circle}>
              <ArrowLeft size={18} />
            </button>
            <span className="min-w-14 text-center text-sm font-semibold tabular-nums text-muted" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              <span className="sr-only">: {current.name}</span>
            </span>
            <button type="button" onClick={() => go(1)} aria-label="Producto siguiente" className={circle}>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}