import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  Search,
  Heart,
  ShoppingCart,
  ChevronDown,
  Truck,
  Cpu,
  Monitor,
  Laptop,
  Keyboard,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Datos                                                              */
/* ------------------------------------------------------------------ */

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/catalogo", label: "Catálogo", mega: true },
  { to: "/ofertas", label: "Ofertas", sale: true },
  { to: "/armar-pc", label: "Armar mi PC" },
  { to: "/contact", label: "Contacto" },
];

const categories = [
  { slug: "pcs-gaming", label: "PCs gaming", desc: "Equipos armados y probados", icon: Cpu },
  { slug: "componentes", label: "Componentes", desc: "Procesadores, GPU, RAM, SSD", icon: Monitor },
  { slug: "laptops", label: "Laptops", desc: "Para trabajar, estudiar y jugar", icon: Laptop },
  { slug: "perifericos", label: "Periféricos", desc: "Teclados, mouse y monitores", icon: Keyboard },
];

const fmt = (n) => new Intl.NumberFormat("es-DO").format(n);

/* ------------------------------------------------------------------ */
/*  Piezas pequeñas                                                    */
/* ------------------------------------------------------------------ */

const desktopLink = ({ isActive }) =>
  [
    "relative py-2 text-sm font-medium transition-colors",
    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded after:bg-tech",
    "after:transition-transform after:duration-300 hover:after:scale-x-100",
    isActive ? "text-tech after:scale-x-100" : "text-slate-200 hover:text-tech after:scale-x-0",
  ].join(" ");

const iconBtn =
  "relative rounded-lg p-2.5 text-slate-200 transition hover:bg-white/10 hover:text-tech " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech";

function SearchBox({ inputRef, className = "" }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/catalogo?q=${encodeURIComponent(term)}`);
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Buscar tarjetas gráficas, laptops, teclados..."
        aria-label="Buscar productos"
        className="h-11 w-full rounded-xl border border-white/10 bg-dark-surface pl-10 pr-10 text-sm text-white placeholder:text-slate-500 transition focus:border-tech/60 focus:outline-none focus:ring-2 focus:ring-tech/30"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 text-xs text-slate-400 lg:block">
        /
      </kbd>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export default function Navbar({
  cartItems = [], // [{ id, name, price, qty }]
  wishlistCount = 0,
  onRemoveItem = () => {},
  freeShippingFrom = 5000,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);
  const megaRef = useRef(null);

  const count = cartItems.reduce((n, i) => n + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const closeAll = () => {
    setMenuOpen(false);
    setCartOpen(false);
    setMegaOpen(false);
  };

  // Sombra y barra de aviso al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape cierra todo, "/" enfoca la búsqueda
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Clic fuera cierra el mega menú
  useEffect(() => {
    const onDown = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Bloquear scroll del body con un drawer abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen || cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, cartOpen]);

  const missing = Math.max(freeShippingFrom - subtotal, 0);
  const progress = Math.min((subtotal / freeShippingFrom) * 100, 100);

  return (
    <>
      <style>{`
        @keyframes nb-bump { 0% { transform: scale(1); } 40% { transform: scale(1.5); } 100% { transform: scale(1); } }
        .nb-bump { animation: nb-bump .35s ease-out; }
        @media (prefers-reduced-motion: reduce) { .nb-bump { animation: none; } }
      `}</style>

      <header className="sticky top-0 z-50">
        {/* Barra de aviso */}
        <div
          className={`overflow-hidden bg-dark-surface text-slate-200 transition-all duration-300 ${
            scrolled ? "max-h-0" : "max-h-10"
          }`}
        >
          <p className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-xs sm:text-sm">
            <Truck size={16} className="text-tech" aria-hidden />
            Envío gratis en compras desde ${fmt(freeShippingFrom)}
          </p>
        </div>

        {/* Barra principal */}
        <nav
          aria-label="Principal"
          className={`border-b border-white/10 bg-dark/90 text-white backdrop-blur-md transition-shadow ${
            scrolled ? "shadow-lg shadow-black/30" : ""
          }`}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-6">
            {/* Botón menú móvil */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={`${iconBtn} -ml-2 md:hidden`}
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link to="/" onClick={closeAll} className="text-2xl font-extrabold tracking-tight">
              AP<span className="text-tech">ex</span>
            </Link>

            {/* Enlaces escritorio */}
            <ul className="ml-2 hidden items-center gap-6 md:flex">
              {links.map(({ to, label, end, mega, sale }) => (
                <li key={to} className="relative" ref={mega ? megaRef : undefined}>
                  {mega ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMegaOpen((v) => !v)}
                        onMouseEnter={() => setMegaOpen(true)}
                        aria-expanded={megaOpen}
                        aria-haspopup="true"
                        className="flex items-center gap-1 py-2 text-sm font-medium text-slate-200 transition-colors hover:text-tech focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech"
                      >
                        {label}
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <div
                        onMouseLeave={() => setMegaOpen(false)}
                        className={`absolute left-0 top-full w-[26rem] pt-3 transition-all duration-200 ${
                          megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="rounded-2xl border border-white/10 bg-dark-surface p-3 shadow-2xl shadow-black/50">
                          <div className="grid grid-cols-2 gap-1">
                            {categories.map(({ slug, label: l, desc, icon: Icon }) => (
                              <Link
                                key={slug}
                                to={`/catalogo?categoria=${slug}`}
                                onClick={closeAll}
                                className="group flex gap-3 rounded-xl p-3 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-tech"
                              >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-tech transition group-hover:bg-primary group-hover:text-white">
                                  <Icon size={20} />
                                </span>
                                <span>
                                  <span className="block text-sm font-semibold">{l}</span>
                                  <span className="block text-xs leading-snug text-slate-400">{desc}</span>
                                </span>
                              </Link>
                            ))}
                          </div>
                          <Link
                            to="/catalogo"
                            onClick={closeAll}
                            className="mt-2 block rounded-xl bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-tech transition hover:bg-white/10"
                          >
                            Ver todo el catálogo
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <NavLink
                      to={to}
                      end={end}
                      className={(s) =>
                        sale ? `${desktopLink(s)} !text-accent hover:!text-accent-hover after:!bg-accent` : desktopLink(s)
                      }
                    >
                      {label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>

            {/* Buscador escritorio */}
            <SearchBox inputRef={searchRef} className="mx-auto hidden max-w-md flex-1 md:block" />

            {/* Acciones */}
            <div className="ml-auto flex items-center gap-0.5 md:ml-0">
              <Link to="/favoritos" aria-label="Favoritos" className={`${iconBtn} hidden sm:block`}>
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/perfil" aria-label="Mi perfil" className={iconBtn}>
                <User size={22} />
              </Link>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Abrir carrito, ${count} productos`}
                aria-haspopup="dialog"
                className={iconBtn}
              >
                <ShoppingCart size={22} />
                {count > 0 && (
                  <span
                    key={count}
                    className="nb-bump absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white"
                  >
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Buscador móvil */}
          <div className="px-4 pb-3 md:hidden">
            <SearchBox />
          </div>
        </nav>
      </header>

      {/* Fondo oscuro de los drawers */}
      <div
        onClick={closeAll}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen || cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Menú móvil (izquierda) */}
      <aside
        id="mobile-menu"
        aria-label="Menú"
        className={`fixed inset-y-0 left-0 z-[60] flex w-80 max-w-[85%] flex-col bg-dark text-white shadow-2xl transition-all duration-300 md:hidden ${
          menuOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <span className="text-xl font-extrabold">
            AP<span className="text-tech">ex</span>
          </span>
          <button type="button" onClick={closeAll} aria-label="Cerrar menú" className={iconBtn}>
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <ul>
            {links.map(({ to, label, end, sale }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={closeAll}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-3 font-medium transition hover:bg-dark-surface ${
                      sale ? "text-accent" : isActive ? "text-tech" : "text-slate-200"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <p className="mt-5 px-4 text-sm text-slate-400">Categorías</p>
          <ul className="mt-1">
            {categories.map(({ slug, label, icon: Icon }) => (
              <li key={slug}>
                <Link
                  to={`/catalogo?categoria=${slug}`}
                  onClick={closeAll}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-200 transition hover:bg-dark-surface hover:text-tech"
                >
                  <Icon size={18} className="text-tech" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/favoritos"
          onClick={closeAll}
          className="flex items-center gap-3 border-t border-white/10 px-7 py-4 text-slate-200 hover:text-tech"
        >
          <Heart size={18} /> Favoritos {wishlistCount > 0 && `(${wishlistCount})`}
        </Link>
      </aside>

      {/* Carrito (derecha) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed inset-y-0 right-0 z-[60] flex w-96 max-w-full flex-col bg-dark text-white shadow-2xl transition-all duration-300 ${
          cartOpen ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <h2 className="text-lg font-bold">Tu carrito ({count})</h2>
          <button type="button" onClick={closeAll} aria-label="Cerrar carrito" className={iconBtn}>
            <X size={22} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <ShoppingCart size={40} className="mx-auto text-slate-600" />
              <p className="mt-4 font-semibold">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-slate-400">Agrega productos para verlos aquí.</p>
              <Link
                to="/catalogo"
                onClick={closeAll}
                className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold transition hover:bg-primary-hover"
              >
                Explorar el catálogo
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Progreso a envío gratis */}
            <div className="border-b border-white/10 px-5 py-4 text-sm">
              <p className="text-slate-300">
                {missing > 0 ? (
                  <>
                    Te faltan <span className="font-semibold text-tech">${fmt(missing)}</span> para el envío gratis
                  </>
                ) : (
                  <span className="font-semibold text-success">Tienes envío gratis</span>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-tech transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-5">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-slate-400">
                      {item.qty} x ${fmt(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">${fmt(item.price * item.qty)}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Quitar ${item.name}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 p-5">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span className="tabular-nums">${fmt(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={closeAll}
                className="mt-4 block rounded-xl bg-primary py-3.5 text-center font-semibold shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
              >
                Finalizar compra
              </Link>
              <Link
                to="/carrito"
                onClick={closeAll}
                className="mt-2 block rounded-xl py-3 text-center font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}