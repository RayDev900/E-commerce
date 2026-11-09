import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, SearchX, SlidersHorizontal, X } from "lucide-react";

// Ajusta esta ruta a donde guardaste tu archivo de servicios
import { getAllProducts } from "../services/product.service";
import { ProductCard, SkeletonCard, fmt, toList, toneFor } from "./landing/ProductSection";

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

const SORTS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "discount", label: "Mayor descuento" },
  { value: "name", label: "Nombre (A-Z)" },
];

const slugify = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const catKey = (p) => String(p.categoryId ?? p.categoryName ?? "");
const discountOf = (p) => (p.oldPrice && p.oldPrice > p.price ? (p.oldPrice - p.price) / p.oldPrice : 0);

function pageList(page, total) {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/*  Paginación                                                         */
/* ------------------------------------------------------------------ */

function Pager({ page, total, onChange }) {
  if (total <= 1) return null;
  const btn =
    "grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  return (
    <nav aria-label="Paginación" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${btn} border-border bg-surface text-ink hover:bg-light disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50`}
      >
        <ChevronLeft size={18} />
      </button>
      {pageList(page, total).map((n) =>
        typeof n === "string" ? (
          <span key={n} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:bg-light"
            }`}
          >
            {n}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        aria-label="Página siguiente"
        className={`${btn} border-border bg-surface text-ink hover:bg-light disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50`}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Grupo colapsable del panel de filtros                              */
/* ------------------------------------------------------------------ */

function Group({ title, children, open = true }) {
  return (
    <details className="group border-b border-border py-5 first:pt-0 last:border-b-0" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */

export default function CatalogoPage({
  categories: categoriesProp, // opcional: [{ id, slug, name }]
  pageSize = 12,
  onAddToCart = () => {},
  onToggleWishlist = () => {},
  wishlist = new Set(),
}) {
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const gridTop = useRef(null);

  /* ------------------------- Carga de datos ------------------------- */
  // El catálogo trae todos los productos una vez y filtra en el cliente: los filtros son
  // instantáneos y los conteos son exactos. Si el catálogo crece a miles de productos,
  // conviene mover filtros y paginación al backend.
  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    getAllProducts()
      .then((data) => {
        if (ignore) return;
        setProducts(toList(data));
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        setError(err?.message || "Error en la petición");
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  /* --------------------------- Estado en URL ------------------------- */
  const q = (params.get("q") ?? "").trim();
  const catParam = params.get("categoria");
  const sort = params.get("sort") ?? "relevance";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const minP = params.get("min") ?? "";
  const maxP = params.get("max") ?? "";
  const inStock = params.get("stock") === "1";
  const onSale = params.get("oferta") === "1";
  const specSel = params.getAll("spec"); // "clave::valor"

  const update = useCallback(
    (patch, { keepPage = false } = {}) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => {
          next.delete(k);
          if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
          else if (v !== null && v !== undefined && v !== "") next.set(k, String(v));
        });
        if (!keepPage) next.delete("page");
        return next;
      });
    },
    [setParams]
  );

  /* ---------------------------- Categorías --------------------------- */
  const cats = useMemo(() => {
    if (categoriesProp) return categoriesProp;
    const map = new Map();
    products.forEach((p) => {
      if (p.categoryId == null && !p.categoryName) return;
      const key = catKey(p);
      if (!map.has(key)) {
        map.set(key, {
          id: p.categoryId ?? p.categoryName,
          slug: p.categorySlug,
          name: p.categoryName ?? `Categoría ${p.categoryId}`,
        });
      }
    });
    return [...map.values()];
  }, [products, categoriesProp]);

  // `categoria` puede ser id, slug o el nombre convertido a slug
  const activeCat = useMemo(
    () =>
      catParam
        ? cats.find((c) => String(c.id) === catParam || c.slug === catParam || slugify(c.name) === catParam) ?? null
        : null,
    [cats, catParam]
  );

  /* ---------------------------- Filtrado ----------------------------- */
  const matchesQuery = useCallback(
    (p) => {
      if (!q) return true;
      const hay = [p.name, p.categoryName, ...p.specs.map(([, v]) => v)].join(" ").toLowerCase();
      return hay.includes(q.toLowerCase());
    },
    [q]
  );

  const catCounts = useMemo(() => {
    const m = new Map();
    products.filter(matchesQuery).forEach((p) => m.set(catKey(p), (m.get(catKey(p)) || 0) + 1));
    return m;
  }, [products, matchesQuery]);

  const totalForQuery = useMemo(() => products.filter(matchesQuery).length, [products, matchesQuery]);

  const scoped = useMemo(
    () => products.filter((p) => matchesQuery(p) && (!activeCat || catKey(p) === String(activeCat.id))),
    [products, matchesQuery, activeCat]
  );

  const bounds = useMemo(() => {
    if (!scoped.length) return { min: 0, max: 0 };
    const prices = scoped.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [scoped]);

  // Filtros por especificación, deducidos de los productos de la categoría activa
  const facets = useMemo(() => {
    const m = new Map();
    scoped.forEach((p) =>
      p.specs.forEach(([k, v]) => {
        const key = String(k);
        const val = String(v);
        if (!m.has(key)) m.set(key, new Map());
        m.get(key).set(val, (m.get(key).get(val) || 0) + 1);
      })
    );
    return [...m.entries()]
      .filter(([, vm]) => vm.size >= 2 && vm.size <= 12)
      .map(([key, vm]) => ({
        key,
        total: [...vm.values()].reduce((a, b) => a + b, 0),
        values: [...vm.entries()].sort((a, b) => b[1] - a[1]),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [scoped]);

  const specGroups = useMemo(() => {
    const m = new Map();
    specSel.forEach((token) => {
      const i = token.indexOf("::");
      const k = token.slice(0, i);
      const v = token.slice(i + 2);
      if (!m.has(k)) m.set(k, new Set());
      m.get(k).add(v);
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const min = minP === "" ? null : Number(minP);
  const max = maxP === "" ? null : Number(maxP);

  const results = useMemo(() => {
    const list = scoped.filter(
      (p) =>
        (min === null || p.price >= min) &&
        (max === null || p.price <= max) &&
        (!inStock || p.stock === null || Number(p.stock) > 0) &&
        (!onSale || discountOf(p) > 0) &&
        [...specGroups].every(([k, set]) => p.specs.some(([sk, sv]) => String(sk) === k && set.has(String(sv))))
    );
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "discount") list.sort((a, b) => discountOf(b) - discountOf(a));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [scoped, min, max, inStock, onSale, specGroups, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = results.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ------------------------ Rango de precio (debounce) --------------- */
  const [minDraft, setMinDraft] = useState(minP);
  const [maxDraft, setMaxDraft] = useState(maxP);
  useEffect(() => setMinDraft(minP), [minP]);
  useEffect(() => setMaxDraft(maxP), [maxP]);
  useEffect(() => {
    if (minDraft === minP && maxDraft === maxP) return;
    const t = setTimeout(() => update({ min: minDraft, max: maxDraft }), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDraft, maxDraft]);

  /* ----------------------------- Acciones ---------------------------- */
  const selectCat = (c) => update({ categoria: c ? c.slug ?? c.id : null, spec: [] });
  const toggleSpec = (k, v) => {
    const token = `${k}::${v}`;
    update({ spec: specSel.includes(token) ? specSel.filter((t) => t !== token) : [...specSel, token] });
  };
  const clearAll = () => setParams(new URLSearchParams());
  const goToPage = (n) => update({ page: n === 1 ? null : n }, { keepPage: true });

  const toggleWish = (product) => onToggleWishlist(product, !wishlist.has(product.id));

  // Al cambiar de página, vuelve al inicio de los resultados
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    gridTop.current?.scrollIntoView({ block: "start" });
  }, [safePage]);

  // Drawer móvil: Escape cierra y bloquea el scroll del body
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  /* ------------------------- Chips de filtros activos ---------------- */
  const chips = [];
  if (activeCat) chips.push({ id: "cat", label: activeCat.name, remove: () => update({ categoria: null, spec: [] }) });
  if (min !== null || max !== null) {
    const label =
      min !== null && max !== null ? `$${fmt(min)} a $${fmt(max)}` : min !== null ? `Desde $${fmt(min)}` : `Hasta $${fmt(max)}`;
    chips.push({ id: "price", label, remove: () => update({ min: null, max: null }) });
  }
  if (inStock) chips.push({ id: "stock", label: "En stock", remove: () => update({ stock: null }) });
  if (onSale) chips.push({ id: "sale", label: "En oferta", remove: () => update({ oferta: null }) });
  specSel.forEach((t) => {
    const [k, v] = t.split("::");
    chips.push({ id: t, label: `${k}: ${v}`, remove: () => toggleSpec(k, v) });
  });
  if (q) chips.push({ id: "q", label: `"${q}"`, remove: () => update({ q: null }) });

  const filterCount = chips.filter((c) => c.id !== "q").length;
  const headerTone = activeCat ? toneFor(activeCat.id) : "var(--color-primary, #2563eb)";
  const title = activeCat?.name ?? (q ? `Resultados para "${q}"` : "Catálogo completo");

  /* --------------------------- Panel de filtros ---------------------- */
  const rowBase =
    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-primary";
  const inputBase =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

  const panel = (
    <div>
      <Group title="Categoría">
        <ul className="-mx-3 space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => selectCat(null)}
              aria-pressed={!activeCat}
              className={`${rowBase} ${!activeCat ? "bg-ink font-semibold text-white" : "text-ink hover:bg-light"}`}
            >
              <span>Todas</span>
              <span className={`text-xs tabular-nums ${!activeCat ? "text-white/70" : "text-muted"}`}>{totalForQuery}</span>
            </button>
          </li>
          {cats.map((c) => {
            const active = activeCat && String(activeCat.id) === String(c.id);
            const tone = toneFor(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectCat(c)}
                  aria-pressed={!!active}
                  className={`${rowBase} ${active ? "font-semibold text-ink" : "text-ink hover:bg-light"}`}
                  style={active ? { background: `color-mix(in oklab, ${tone} 14%, white)` } : undefined}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">{catCounts.get(String(c.id)) ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Precio">
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Precio mínimo</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              placeholder={fmt(bounds.min)}
              className={inputBase}
            />
          </label>
          <span className="text-muted">a</span>
          <label className="flex-1">
            <span className="sr-only">Precio máximo</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              placeholder={fmt(bounds.max)}
              className={inputBase}
            />
          </label>
        </div>
        {bounds.max > 0 && (
          <p className="mt-2 text-xs text-muted">
            Disponibles entre ${fmt(bounds.min)} y ${fmt(bounds.max)}
          </p>
        )}
      </Group>

      <Group title="Disponibilidad">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => update({ stock: e.target.checked ? 1 : null })}
              className="h-4 w-4 rounded accent-primary"
            />
            Solo con stock
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => update({ oferta: e.target.checked ? 1 : null })}
              className="h-4 w-4 rounded accent-sale"
            />
            Solo en oferta
          </label>
        </div>
      </Group>

      {facets.map((f) => (
        <Group key={f.key} title={f.key} open={false}>
          <ul className="space-y-3">
            {f.values.map(([val, count]) => (
              <li key={val}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-ink">
                  <span className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={specGroups.get(f.key)?.has(val) ?? false}
                      onChange={() => toggleSpec(f.key, val)}
                      className="h-4 w-4 shrink-0 rounded accent-primary"
                    />
                    <span className="truncate">{val}</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">{count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Group>
      ))}
    </div>
  );

  /* ------------------------------ Render ----------------------------- */
  return (
    <main className="bg-light text-ink" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .pr-card { animation: pr-in .55s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(var(--i) * 45ms); }
        .ct-drawer { animation: ct-slide .3s cubic-bezier(.2,.7,.2,1); }
        .ct-fade { animation: ct-fade .25s ease-out; }
        @keyframes pr-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ct-slide { from { transform: translateX(-100%); } to { transform: none; } }
        @keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .pr-card, .ct-drawer, .ct-fade { animation: none; } }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        {/* Encabezado */}
        <nav aria-label="Ruta" className="text-sm text-muted">
          <Link to="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          {activeCat ? (
            <>
              <Link to="/catalogo" className="hover:text-primary">
                Catálogo
              </Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-ink">{activeCat.name}</span>
            </>
          ) : (
            <span className="font-medium text-ink">Catálogo</span>
          )}
        </nav>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <span className="mt-4 block h-1 w-16 rounded-full" style={{ background: headerTone }} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_1fr]">
          {/* Sidebar (escritorio) */}
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-extrabold">Filtros</h2>
                {filterCount > 0 && (
                  <button type="button" onClick={clearAll} className="text-sm font-semibold text-primary hover:underline">
                    Limpiar
                  </button>
                )}
              </div>
              {panel}
            </div>
          </aside>

          {/* Resultados */}
          <div className="min-w-0">
            <div ref={gridTop} className="scroll-mt-32" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-white lg:hidden"
                >
                  <SlidersHorizontal size={16} />
                  Filtros
                  {filterCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-white">
                      {filterCount}
                    </span>
                  )}
                </button>
                <p className="text-sm text-muted" aria-live="polite">
                  {status === "ready"
                    ? results.length === 0
                      ? "Sin resultados"
                      : `Mostrando ${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, results.length)} de ${results.length}`
                    : status === "loading"
                    ? "Cargando catálogo..."
                    : ""}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="sr-only sm:not-sr-only">Ordenar por</span>
                <select
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value === "relevance" ? null : e.target.value })}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Filtros activos */}
            {chips.length > 0 && (
              <ul className="mt-4 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={c.remove}
                      aria-label={`Quitar filtro ${c.label}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1.5 pl-3 pr-2 text-sm font-medium transition hover:border-danger/50 hover:text-danger"
                    >
                      {c.label}
                      <X size={14} />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={clearAll} className="px-2 text-sm font-semibold text-primary hover:underline">
                    Limpiar todo
                  </button>
                </li>
              </ul>
            )}

            <div className="mt-6">
              {status === "loading" && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {status === "error" && (
                <div className="mx-auto max-w-md rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center" role="alert">
                  <AlertCircle size={36} className="mx-auto text-danger" />
                  <p className="mt-3 font-bold">No pudimos cargar el catálogo</p>
                  <p className="mt-1 text-sm text-muted">{error}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <RefreshCw size={16} /> Reintentar
                  </button>
                </div>
              )}

              {status === "ready" && results.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
                  <SearchX size={40} className="mx-auto text-muted" strokeWidth={1.4} />
                  <p className="mt-4 font-bold">No encontramos productos con esos filtros</p>
                  <p className="mt-1 text-sm text-muted">Amplía el rango de precio o quita algún filtro.</p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-5 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/85"
                  >
                    Quitar filtros
                  </button>
                </div>
              )}

              {status === "ready" && results.length > 0 && (
                <>
                  <div key={params.toString()} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {pageItems.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        index={i}
                        wished={wishlist.has(p.id)}
                        onToggleWish={toggleWish}
                        onAdd={onAddToCart}
                      />
                    ))}
                  </div>
                  <Pager page={safePage} total={totalPages} onChange={goToPage} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer de filtros (móvil) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="ct-fade absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="ct-drawer absolute inset-y-0 left-0 flex w-[22rem] max-w-[90%] flex-col bg-surface shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <h2 className="text-lg font-extrabold">Filtros</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar filtros"
                className="rounded-lg p-2 text-muted transition hover:bg-light hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
            <div className="flex shrink-0 gap-3 border-t border-border p-4">
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-semibold transition hover:bg-light"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Ver {results.length} {results.length === 1 ? "resultado" : "resultados"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}