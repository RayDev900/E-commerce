import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Cpu,
  Heart,
  ImageOff,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { getProductBySlug, getProductsByCategory } from "../services/product.service";
import { ProductCard, featured, fmt, toList, toneFor } from "../pages/landing/ProductSection";

/* ------------------------------------------------------------------ */
/*  Datos                                                              */
/* ------------------------------------------------------------------ */

// Sin fotos, las ilustraciones se muestran con "vistas" (acercamientos) para llenar la galería
const ART_VIEWS = [
  { label: "Vista general", zoom: 1, origin: "50% 50%" },
  { label: "Detalle superior", zoom: 2.1, origin: "50% 18%" },
  { label: "Detalle central", zoom: 2.1, origin: "50% 55%" },
  { label: "Detalle inferior", zoom: 2.1, origin: "50% 88%" },
];

// Productos que vienen de la API: dan forma a descripción, galería, reseñas y opciones.
function normalizeDetail(raw) {
  const base = toList([raw])[0];
  const list = [raw.images, raw.gallery].find(Array.isArray) ?? [];
  const images = list.map((i) => (typeof i === "string" ? i : i?.url ?? i?.src)).filter(Boolean);
  if (!images.length && base.image) images.push(base.image);

  const options = (Array.isArray(raw.options) ? raw.options : [])
    .map((o) => ({
      name: o.name ?? o.label,
      values: (o.values ?? []).map((v) =>
        typeof v === "string"
          ? { label: v, delta: 0 }
          : { label: v.label ?? v.name, delta: Number(v.delta ?? v.price ?? 0) || 0 }
      ),
    }))
    .filter((o) => o.name && o.values.length);

  const rating = Number(raw.rating ?? raw.average_rating);
  const reviews = raw.reviews_count ?? raw.review_count ?? (typeof raw.reviews === "number" ? raw.reviews : null);

  return {
    ...base,
    images,
    options,
    description: raw.description ?? raw.desc ?? "",
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    reviews: reviews != null ? Number(reviews) : null,
  };
}

const fromStatic = (p) => ({ images: [], options: [], description: "", rating: null, reviews: null, ...p, isStatic: true });

/* ------------------------------------------------------------------ */
/*  Piezas pequeñas                                                    */
/* ------------------------------------------------------------------ */

function Stars({ value }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = (cls) => (
    <span className={`flex ${cls}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={16} fill="currentColor" strokeWidth={0} className="shrink-0" />
      ))}
    </span>
  );
  return (
    <span className="relative inline-flex" aria-hidden>
      {row("text-border")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row("text-warning")}
      </span>
    </span>
  );
}

function ArtFrame({ art, view, tone }) {
  return (
    <div className="h-full w-full" style={{ background: `color-mix(in oklab, ${tone} 9%, white)` }}>
      <div
        className="grid h-full w-full place-items-center p-[8%]"
        style={{ transform: `scale(${view.zoom})`, transformOrigin: view.origin }}
      >
        {art}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-4 w-64 rounded bg-light" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="flex gap-4">
          <div className="hidden w-20 space-y-3 sm:block">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-light" />
            ))}
          </div>
          <div className="aspect-[4/5] flex-1 rounded-2xl bg-light" />
        </div>
        <div className="space-y-5">
          <div className="h-6 w-28 rounded-full bg-light" />
          <div className="h-10 w-4/5 rounded bg-light" />
          <div className="h-4 w-48 rounded bg-light" />
          <div className="h-10 w-56 rounded bg-light" />
          <div className="h-20 rounded bg-light" />
          <div className="h-12 rounded-lg bg-light" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista del producto                                                 */
/* ------------------------------------------------------------------ */

function ProductView({ product, onAddToCart, onToggleWishlist, freeShippingFrom, wishlist }) {
  const tone = product.tone ?? toneFor(product.categoryId ?? product.categoryName);
  const toneText = `color-mix(in oklab, ${tone} 70%, black)`;

  // Galería
  const views = product.images.length
    ? product.images.map((src) => ({ type: "img", src, label: product.name }))
    : product.art
    ? ART_VIEWS.map((v) => ({ type: "art", ...v }))
    : [{ type: "none", label: product.name }];

  const [activeView, setActiveView] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [broken, setBroken] = useState(() => new Set());

  // Compra
  const [sel, setSel] = useState(() => product.options.map(() => 0));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState([]);
  const [buyVisible, setBuyVisible] = useState(true);
  const buyRef = useRef(null);

  const delta = product.options.reduce((sum, o, i) => sum + (o.values[sel[i]]?.delta ?? 0), 0);
  const unit = product.price + delta;
  const oldUnit = product.oldPrice && product.oldPrice > product.price ? product.oldPrice + delta : null;
  const discount = oldUnit ? Math.round((1 - unit / oldUnit) * 100) : 0;

  const stock = product.stock === null || product.stock === undefined ? null : Number(product.stock);
  const soldOut = stock !== null && stock <= 0;
  const low = !soldOut && stock !== null && stock <= 5;
  const maxQty = stock !== null && stock > 0 ? Math.min(stock, 10) : 10;

  const selectedLabels = product.options.map((o, i) => ({ name: o.name, label: o.values[sel[i]]?.label }));

  const handleAdd = () => {
    if (soldOut) return;
    const variant = selectedLabels.map((s) => s.label).join(" / ");
    onAddToCart({
      ...product,
      id: variant ? `${product.id}:${variant}` : product.id,
      productId: product.id,
      name: variant ? `${product.name} (${variant})` : product.name,
      price: unit,
      qty,
      selectedOptions: selectedLabels,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const wished = wishlist.has(product.id);
  const toggleWish = () => onToggleWishlist(product, !wished);

  // Productos relacionados: de la API por categoría, o los otros destacados si es un producto fijo
  useEffect(() => {
    let ignore = false;
    if (product.isStatic) {
      setRelated(featured.filter((p) => p.id !== product.id));
      return;
    }
    if (product.categoryId == null) return;
    getProductsByCategory(product.categoryId)
      .then((data) => {
        if (!ignore) setRelated(toList(data).filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => {}); // los relacionados son opcionales
    return () => {
      ignore = true;
    };
  }, [product.id, product.isStatic, product.categoryId]);

  // Escape sale del zoom
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => e.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  // Barra de compra fija en móvil cuando el botón principal sale de pantalla
  useEffect(() => {
    const el = buyRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e) => {
    if (!zoomed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const chooseView = (i) => {
    setActiveView(i);
    setZoomed(false);
  };

  const view = views[activeView] ?? views[0];
  const category = product.categoryName;
  const perks = [
    { icon: Truck, title: "Envío gratis", text: `En compras desde $${fmt(freeShippingFrom)}` },
    { icon: ShieldCheck, title: "Garantía integral", text: "3 años de cobertura" },
    { icon: Lock, title: "Pago seguro", text: "Tus datos siempre protegidos" },
  ];

  const tintBg = { background: `color-mix(in oklab, ${tone} 9%, white)` };

  return (
    <>
      {/* Ruta de navegación */}
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link to="/" className="hover:text-primary">
          Inicio
        </Link>
        <ChevronRight size={14} />
        <Link to="/catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        {category && (
          <>
            <ChevronRight size={14} />
            <Link
              to={`/catalogo?categoria=${product.categorySlug ?? product.categoryId ?? ""}`}
              className="hover:text-primary"
            >
              {category}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="max-w-[16rem] truncate font-medium text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* ------------------------- Galería ------------------------- */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          {views.length > 1 && (
            <ul className="flex gap-3 sm:w-20 sm:shrink-0 sm:flex-col" aria-label="Miniaturas">
              {views.map((v, i) => (
                <li key={i} className="w-20 sm:w-full">
                  <button
                    type="button"
                    onClick={() => chooseView(i)}
                    aria-label={v.label}
                    aria-current={i === activeView}
                    className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      i === activeView ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {v.type === "img" ? (
                      <img src={v.src} alt="" loading="lazy" className="h-full w-full bg-light object-cover" />
                    ) : (
                      <div className="h-full w-full overflow-hidden">
                        <ArtFrame art={product.art} view={v} tone={tone} />
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Imagen principal */}
          <div className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-2xl bg-light">
            <div
              onMouseMove={onMove}
              onClick={() => setZoomed((z) => !z)}
              className={`absolute inset-0 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            >
              <div
                className="h-full w-full transition-transform duration-300 ease-out"
                style={{ transform: zoomed ? "scale(2)" : "scale(1)", transformOrigin: `${origin.x}% ${origin.y}%` }}
              >
                {view.type === "art" ? (
                  <ArtFrame art={product.art} view={view} tone={tone} />
                ) : view.type === "img" && !broken.has(view.src) ? (
                  <img
                    src={view.src}
                    alt={product.name}
                    onError={() => setBroken((b) => new Set(b).add(view.src))}
                    className={`h-full w-full object-contain p-8 ${soldOut ? "opacity-50 grayscale" : ""}`}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center" style={{ ...tintBg, color: tone }}>
                    {view.type === "img" ? <ImageOff size={56} strokeWidth={1.25} /> : <Cpu size={64} strokeWidth={1.1} />}
                  </div>
                )}
              </div>
            </div>

            {/* Etiquetas de estado */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5">
              {low && <span className="rounded-md bg-warning px-2.5 py-1 text-xs font-bold text-ink">Últimas {stock}</span>}
              {soldOut && <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-bold text-white">Agotado</span>}
            </div>

            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Quitar zoom" : "Acercar imagen"}
              aria-pressed={zoomed}
              className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-lg shadow-ink/15 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
          </div>
        </div>

        {/* ---------------------- Información ------------------------ */}
        <div className="min-w-0">
          {category && (
            <span
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold"
              style={{ background: `color-mix(in oklab, ${tone} 14%, white)`, color: toneText }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
              {category}
            </span>
          )}

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>

          {product.rating && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Stars value={product.rating} />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              {product.reviews != null && <span className="text-muted">({fmt(product.reviews)} reseñas)</span>}
            </div>
          )}

          {/* Precio */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-4xl font-extrabold tabular-nums">${fmt(unit)}</p>
            {oldUnit && <p className="text-xl text-muted line-through">${fmt(oldUnit)}</p>}
            {discount > 0 && <span className="rounded-md bg-sale px-2.5 py-1 text-sm font-bold text-white">-{discount}%</span>}
          </div>

          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <span className={`h-2 w-2 rounded-full ${soldOut ? "bg-danger" : low ? "bg-warning" : "bg-success"}`} />
            {soldOut ? "Agotado" : low ? `Quedan ${stock} unidades` : "Stock listo para enviar"}
          </p>

          {product.description && <p className="mt-5 max-w-xl leading-relaxed text-muted">{product.description}</p>}

          {/* Opciones */}
          {product.options.length > 0 && (
            <div className="mt-6 space-y-6 border-t border-border pt-6">
              {product.options.map((opt, gi) => (
                <fieldset key={opt.name}>
                  <legend className="text-sm text-muted">
                    {opt.name}: <span className="font-bold text-ink">{opt.values[sel[gi]]?.label}</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {opt.values.map((v, vi) => {
                      const on = sel[gi] === vi;
                      return (
                        <button
                          key={v.label}
                          type="button"
                          onClick={() => setSel((s) => s.map((x, i) => (i === gi ? vi : x)))}
                          aria-pressed={on}
                          className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                            on ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:border-ink"
                          }`}
                        >
                          {v.label}
                          {v.delta > 0 && (
                            <span className={`ml-2 text-xs font-medium ${on ? "text-white/70" : "text-muted"}`}>
                              +${fmt(v.delta)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {/* Cantidad + comprar + favoritos */}
          <div ref={buyRef} className="mt-7 flex items-stretch gap-3">
            <div className="inline-flex items-center rounded-lg border border-border" role="group" aria-label="Cantidad">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1 || soldOut}
                aria-label="Menos unidades"
                className="grid h-12 w-11 place-items-center rounded-l-lg transition hover:bg-light disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty || soldOut}
                aria-label="Más unidades"
                className="grid h-12 w-11 place-items-center rounded-r-lg transition hover:bg-light disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-lg px-6 font-semibold text-white transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-border disabled:text-muted ${
                added ? "bg-success" : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {added ? <Check size={20} /> : <ShoppingCart size={20} />}
              {soldOut ? "Agotado" : added ? "Agregado al carrito" : "Agregar al carrito"}
            </button>

            <button
              type="button"
              onClick={toggleWish}
              aria-pressed={wished}
              aria-label={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                wished ? "border-sale text-sale" : "border-border text-ink hover:border-sale hover:text-sale"
              }`}
            >
              <Heart size={20} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Beneficios */}
          <ul className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-light text-primary">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold leading-tight">{title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ----------------- Especificaciones técnicas ---------------- */}
      {product.specs.length > 0 && (
        <section className="mt-16" aria-labelledby="specs-title">
          <h2 id="specs-title" className="text-2xl font-extrabold tracking-tight">
            Especificaciones técnicas
          </h2>
          <span className="mt-3 block h-1 w-12 rounded-full" style={{ background: tone }} />
          <dl className="mt-6 grid gap-x-12 sm:grid-cols-2">
            {product.specs.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b border-border py-3.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ------------------------ Relacionados ---------------------- */}
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-title" className="text-2xl font-extrabold tracking-tight">
              También te puede interesar
            </h2>
            <Link to="/catalogo" className="text-sm font-semibold text-primary hover:underline">
              Ver catálogo
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                  wished={wishlist.has(p.id)}
                  onToggleWish={(item) => onToggleWishlist(item, !wishlist.has(item.id))}
                onAdd={(item) => onAddToCart({ ...item, productId: item.id, qty: 1, selectedOptions: [] })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Barra de compra fija (móvil) */}
      {!buyVisible && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-lg font-extrabold tabular-nums">${fmt(unit)}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className={`inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition disabled:bg-border disabled:text-muted ${
              added ? "bg-success" : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            {soldOut ? "Agotado" : added ? "Agregado" : "Agregar"}
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/*                                                                     */
/*  Ruta:  <Route path="/producto/:slug" element={...} />              */
/*  Los 4 destacados del carrusel se resuelven sin API; el resto usa   */
/*  getProductBySlug(slug).                                            */
/* ------------------------------------------------------------------ */

export default function ProductoDetallePage({
  onAddToCart = () => {},
  onToggleWishlist = () => {},
  freeShippingFrom = 5000,
  wishlist = new Set(),
}) {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fixed = featured.find((p) => p.slug === slug);
    if (fixed) {
      setState({ status: "ready", product: fromStatic(fixed) });
      return;
    }

    let ignore = false;
    setState({ status: "loading" });
    getProductBySlug(slug)
      .then((data) => {
        if (ignore) return;
        const raw = data?.product ?? data?.data ?? data;
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Producto no encontrado");
        setState({ status: "ready", product: normalizeDetail(raw) });
      })
      .catch((err) => {
        if (!ignore) setState({ status: "error", message: err?.message || "Error en la petición" });
      });
    return () => {
      ignore = true;
    };
  }, [slug, reloadKey]);

  useEffect(() => {
    if (state.product) document.title = `${state.product.name} | APex`;
  }, [state.product]);

  return (
    <main className="bg-surface pb-24 text-ink lg:pb-0" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .pr-card { animation: pr-in .55s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(var(--i) * 70ms); }
        .ps-spin { transform-box: fill-box; transform-origin: center; animation: ps-spin linear infinite; }
        .ps-pulse { animation: ps-pulse 2.6s ease-in-out infinite; }
        @keyframes pr-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ps-spin { to { transform: rotate(360deg); } }
        @keyframes ps-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .pr-card, .ps-spin, .ps-pulse { animation: none; } }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12">
        {state.status === "loading" && <PageSkeleton />}

        {state.status === "error" && (
          <div className="mx-auto max-w-md rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center" role="alert">
            <AlertCircle size={36} className="mx-auto text-danger" />
            <p className="mt-3 font-bold">No encontramos este producto</p>
            <p className="mt-1 text-sm text-muted">{state.message}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
              <Link to="/catalogo" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-light">
                Volver al catálogo
              </Link>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <ProductView
            key={state.product.id}
            product={state.product}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            freeShippingFrom={freeShippingFrom}
            wishlist={wishlist}
          />
        )}
      </div>
    </main>
  );
}