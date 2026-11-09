import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Cpu, Headphones, Keyboard, Leaf, Monitor, Mouse } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Datos                                                              */
/*                                                                     */
/*  Cada categoría toma un color de la paleta. `on` es el color del    */
/*  texto cuando la tarjeta se rellena al hacer hover (blanco o tinta, */
/*  según el contraste). Los valores de respaldo en var() evitan que   */
/*  falte un color si Tailwind no emite esa variable del tema.         */
/* ------------------------------------------------------------------ */

const WHITE = "#ffffff";
const INK = "var(--color-ink, #0f172a)";

const small = [
  { slug: "procesadores", name: "Procesadores", spec: "Intel / Ryzen", icon: Cpu, c: "var(--color-primary, #2563eb)", on: WHITE },
  { slug: "teclados", name: "Teclados", spec: "Hot-swap 8K", icon: Keyboard, c: "var(--color-accent, #f97316)", on: INK },
  { slug: "ratones", name: "Ratones Ultra", spec: "< 49 gramos", icon: Mouse, c: "var(--color-tech, #22d3ee)", on: INK },
  { slug: "monitores", name: "Monitores OLED", spec: "240Hz / 0.03ms", icon: Monitor, c: "var(--color-sale, #e11d48)", on: WHITE },
  { slug: "audio", name: "Audio Hi-Res", spec: "Planar Magnetic", icon: Headphones, c: "var(--color-warning, #eab308)", on: INK },
  { slug: "eco", name: "Eco-Titanium", spec: "94% Eficiencia", icon: Leaf, c: "var(--color-eco, #10b981)", on: INK },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Ilustraciones de las dos tarjetas grandes                          */
/* ------------------------------------------------------------------ */

function MiniFan({ cx, cy, r, color = "#22d3ee", dur = 2.4, reverse = false }) {
  const blades = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0b1020" stroke={color} strokeOpacity=".75" strokeWidth="1.6" />
      <g className="cat-spin" style={{ animationDuration: `${dur}s`, animationDirection: reverse ? "reverse" : "normal" }}>
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
      <MiniFan cx={64} cy={66} r={36} />
      <MiniFan cx={136} cy={66} r={36} reverse />
      <rect x="72" y="124" width="56" height="56" rx="14" fill="#151b2e" stroke="#22d3ee" strokeWidth="1.4" />
      <circle cx="100" cy="152" r="16" fill="#0b1020" stroke="#2563eb" strokeWidth="2" className="cat-pulse" />
      <rect x="24" y="196" width="152" height="32" rx="8" fill="#151b2e" stroke="#22d3ee" strokeOpacity=".5" />
      <MiniFan cx={56} cy={212} r={11} dur={1.8} />
      <MiniFan cx={88} cy={212} r={11} dur={1.8} reverse />
      <rect x="118" y="209" width="46" height="5" rx="2.5" fill="#f97316" className="cat-pulse" />
      <path d="M34 10 L110 10 L62 250 L12 250 Z" fill="#fff" fillOpacity=".05" />
    </svg>
  );
}

function GpuArt() {
  return (
    <svg viewBox="0 0 260 110" className="h-full w-auto" aria-hidden>
      <rect x="6" y="10" width="236" height="78" rx="13" fill="#0b1020" fillOpacity=".55" stroke="#fff" strokeOpacity=".4" strokeWidth="1.5" />
      <rect x="22" y="16" width="204" height="4" rx="2" fill="#f97316" className="cat-pulse" />
      <MiniFan cx={74} cy={52} r={27} color="#22d3ee" dur={1.9} />
      <MiniFan cx={162} cy={52} r={27} color="#22d3ee" dur={1.9} reverse />
      <rect x="40" y="88" width="112" height="9" rx="2" fill="#f97316" fillOpacity=".85" />
      {[46, 56, 66, 76, 86, 96, 106, 116, 126, 136, 146].map((x) => (
        <line key={x} x1={x} y1="90" x2={x} y2="96" stroke="#0b1020" strokeWidth="1.5" />
      ))}
      <rect x="236" y="22" width="14" height="54" rx="3" fill="#fff" fillOpacity=".25" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Sección                                                            */
/* ------------------------------------------------------------------ */

export default function Category() {
  const gridRef = useRef(null);
  const [shown, setShown] = useState(false);

  // Las tarjetas entran una sola vez, cuando la sección aparece en pantalla
  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (gridRef.current) io.observe(gridRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-light px-6 py-16 sm:py-20" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

        /* Tarjetas pequeñas: tinte de su color, y se rellenan al hacer hover */
        .cat {
          position: relative; overflow: hidden; isolation: isolate;
          background: color-mix(in oklab, var(--c) 10%, #fff);
          border: 1px solid color-mix(in oklab, var(--c) 30%, #fff);
          transition: transform .28s cubic-bezier(.2,.7,.2,1), background-color .28s, border-color .28s, box-shadow .28s;
        }
        .cat:hover, .cat:focus-visible {
          transform: translateY(-5px);
          background: var(--c); border-color: var(--c);
          box-shadow: 0 18px 32px -16px color-mix(in oklab, var(--c) 75%, transparent);
        }
        .cat:focus-visible, .cat-feat:focus-visible { outline: 2px solid var(--c, #22d3ee); outline-offset: 3px; }

        .cat-tile { background: var(--c); color: var(--on); transition: background-color .28s, color .28s, transform .35s cubic-bezier(.2,.7,.2,1); }
        .cat:hover .cat-tile { background: color-mix(in oklab, var(--on) 16%, transparent); transform: rotate(-8deg) scale(1.06); }
        .cat-name { color: var(--color-ink, #0f172a); transition: color .28s; }
        .cat-spec { color: var(--color-muted, #64748b); transition: color .28s; }
        .cat:hover .cat-name { color: var(--on); }
        .cat:hover .cat-spec { color: color-mix(in oklab, var(--on) 78%, transparent); }

        /* Icono gigante recortado al fondo de la tarjeta */
        .cat-mark { position: absolute; right: -14px; bottom: -14px; z-index: -1; color: var(--c); opacity: .14;
          transition: color .28s, opacity .28s, transform .5s cubic-bezier(.2,.7,.2,1); }
        .cat:hover .cat-mark { color: var(--on); opacity: .16; transform: rotate(-10deg) scale(1.12); }

        .cat-go { opacity: 0; transform: translate(-6px, 6px); color: var(--on); transition: opacity .25s, transform .25s; }
        .cat:hover .cat-go, .cat:focus-visible .cat-go { opacity: 1; transform: none; }

        /* Tarjetas grandes */
        .cat-feat { position: relative; overflow: hidden; isolation: isolate;
          transition: transform .28s cubic-bezier(.2,.7,.2,1), box-shadow .28s; }
        .cat-feat:hover { transform: translateY(-5px); }
        .cat-feat .art { transition: transform .5s cubic-bezier(.2,.7,.2,1); }
        .cat-feat:hover .art { transform: translateY(-6px) scale(1.04); }

        .cat-spin { transform-box: fill-box; transform-origin: center; animation: cat-spin linear infinite; }
        .cat-pulse { animation: cat-pulse 2.6s ease-in-out infinite; }

        /* Entrada escalonada */
        .cat-pending .cat-item { opacity: 0; }
        .is-in .cat-item { animation: cat-in .65s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(var(--i) * 70ms); }

        @keyframes cat-spin { to { transform: rotate(360deg); } }
        @keyframes cat-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes cat-in { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .cat-spin, .cat-pulse, .is-in .cat-item { animation: none !important; }
          .cat, .cat-feat, .cat-tile, .cat-mark, .cat-go, .cat-feat .art { transition: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Categorías de alto rendimiento
          </h2>
          <Link
            to="/catalogo"
            className="group inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Ver todas las divisiones
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Bento: 2 tarjetas grandes + 6 pequeñas */}
        <div
          ref={gridRef}
          className={`mt-10 grid auto-rows-[10.5rem] grid-cols-2 gap-4 md:grid-cols-4 lg:auto-rows-[11rem] ${
            shown ? "is-in" : "cat-pending"
          }`}
        >
          {/* PC Armada (oscura, 2x2) */}
          <Link
            to="/catalogo?categoria=pcs-armadas"
            style={{ "--i": 0, "--c": "var(--color-tech, #22d3ee)" }}
            className="cat-feat cat-item group col-span-2 row-span-2 rounded-2xl border border-primary/40 bg-dark-surface p-6 text-white sm:p-8"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{ background: "radial-gradient(60% 60% at 78% 58%, rgba(34,211,238,.22), transparent 70%), radial-gradient(40% 40% at 0% 0%, rgba(37,99,235,.28), transparent 70%)" }}
            />
            <div className="flex h-full flex-col justify-between">
              <div className="max-w-[55%]">
                <span className="inline-block rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-300">
                  Boutique
                </span>
                <h3 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">PC Armada</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Equipos ensamblados a mano y probados 72 horas antes de llegar a ti.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-semibold text-tech">
                Explorar PCs
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
              </span>
            </div>
            <div className="art absolute bottom-4 right-4 top-6 w-[38%] sm:right-8" aria-hidden>
              <PcArt />
            </div>
          </Link>

          {/* GPU (violeta, 2x1) */}
          <Link
            to="/catalogo?categoria=gpu"
            style={{ "--i": 1, "--c": "var(--color-gaming, #7c3aed)" }}
            className="cat-feat cat-item group col-span-2 rounded-2xl bg-gaming p-6 text-white shadow-lg shadow-gaming/25"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{ background: "radial-gradient(55% 90% at 85% 40%, rgba(255,255,255,.22), transparent 70%)" }}
            />
            <div className="flex h-full flex-col justify-between">
              <div>
                <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">Tarjetas GPU</h3>
                <p className="mt-1 text-sm font-medium text-white/80">Ada & RDNA</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                Ver tarjetas
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
              </span>
            </div>
            <div className="art absolute bottom-3 right-5 top-5 w-[52%]" aria-hidden>
              <div className="flex h-full items-center justify-end">
                <GpuArt />
              </div>
            </div>
          </Link>

          {/* Categorías pequeñas, cada una con su color */}
          {small.map(({ slug, name, spec, icon: Icon, c, on }, i) => (
            <Link
              key={slug}
              to={`/catalogo?categoria=${slug}`}
              style={{ "--i": i + 2, "--c": c, "--on": on }}
              className="cat cat-item flex flex-col justify-between rounded-2xl p-5"
            >
              <Icon aria-hidden size={110} strokeWidth={1.1} className="cat-mark" />
              <div className="flex items-start justify-between">
                <span className="cat-tile grid h-12 w-12 place-items-center rounded-xl">
                  <Icon size={24} />
                </span>
                <ArrowUpRight aria-hidden size={20} className="cat-go" />
              </div>
              <div>
                <p className="cat-name text-base font-bold leading-snug sm:text-lg">{name}</p>
                <p className="cat-spec mt-0.5 text-xs sm:text-sm">{spec}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}