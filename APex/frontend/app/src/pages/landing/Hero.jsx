import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fmt = (n) => new Intl.NumberFormat("es-DO").format(n);

function useCountUp(target, duration = 1600, delay = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - t, 3)))); // easeOutCubic
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Partículas: aire entrando al case                                  */
/*                                                                     */
/*  Estelas que viajan de izquierda a derecha hacia el equipo, como el */
/*  flujo de los ventiladores de admisión. El mouse las desvía, unas   */
/*  pocas son brasas naranjas. Se pausan fuera de pantalla o con la    */
/*  pestaña oculta, y con "reducir movimiento" se dibuja un solo       */
/*  cuadro estático.                                                   */
/* ------------------------------------------------------------------ */

function AirflowParticles() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const host = canvas.parentElement;
    const reduced = prefersReducedMotion();
    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    const spawn = (anywhere) => {
      const z = Math.random(); // 0 = lejos, 1 = cerca
      return {
        x: anywhere ? rand(0, w) : rand(-60, 0),
        y: rand(0, h),
        z,
        vx: 16 + z * 46,
        vy: rand(-4, 4),
        len: 4 + z * 16,
        size: 0.6 + z * 1.4,
        phase: rand(0, TAU),
        hot: Math.random() < 0.08,
      };
    };

    const draw = (dt, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      const targetY = h * 0.46;

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        if (dt > 0) {
          // Se encauzan suavemente hacia la altura del case
          p.vy += (targetY - p.y) * 0.06 * dt;
          p.vy *= 1 - Math.min(0.9 * dt, 1);
          p.x += p.vx * dt;
          p.y += p.vy * dt + Math.sin(t * 0.9 + p.phase) * 6 * p.z * dt;

          // El cursor las aparta
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 130) {
            const f = (1 - d / 130) * 220 * dt;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }

          if (p.x > w + 40) {
            p = particles[i] = spawn(false);
          }
        }

        const base = 0.16 + p.z * 0.5;
        const edgeIn = Math.max(0, Math.min(1, p.x / 120));
        const edgeOut = Math.max(0, Math.min(1, (w - p.x) / 120));
        const towardCase = 0.35 + 0.65 * Math.max(0, Math.min(1, p.x / w)); // más brillo cerca del equipo
        const alpha = base * edgeIn * edgeOut * towardCase;
        if (alpha < 0.01) continue;

        const len = p.hot ? p.len * 0.55 : p.len;
        ctx.strokeStyle = p.hot ? `rgba(249,115,22,${alpha * 1.3})` : `rgba(34,211,238,${alpha})`;
        ctx.lineWidth = p.hot ? p.size + 0.4 : p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - len, p.y - p.vy * 0.05);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(110, Math.round((w * h) / 16000)));
      particles = Array.from({ length: count }, () => spawn(true));
      draw(0, 0); // cuadro estático (también es el único si se reduce el movimiento)
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt, now / 1000);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(host);

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}

/* ------------------------------------------------------------------ */
/*  Ilustración: case de PC con ventiladores y refrigeración líquida   */
/* ------------------------------------------------------------------ */

function Fan({ cx, cy, r, dur = 2.4, reverse = false }) {
  const blades = Array.from({ length: 7 }, (_, i) => i * (360 / 7));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0b1020" stroke="#22d3ee" strokeOpacity=".7" strokeWidth="2" />
      <g
        className="hp-spin"
        style={{ animationDuration: `${dur}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {/* círculo invisible: fija el centro de rotación */}
        <circle cx={cx} cy={cy} r={r} fill="transparent" />
        {blades.map((a) => (
          <ellipse
            key={a}
            cx={cx}
            cy={cy - r * 0.5}
            rx={r * 0.17}
            ry={r * 0.36}
            transform={`rotate(${a} ${cx} ${cy}) rotate(28 ${cx} ${cy - r * 0.5})`}
            fill="#22d3ee"
            fillOpacity=".75"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#151b2e" stroke="#22d3ee" strokeWidth="1.5" />
    </g>
  );
}

function PcCase() {
  return (
    <svg
      viewBox="0 0 400 480"
      className="h-full w-full"
      role="img"
      aria-label="Ilustración del Titan Obsidian X con refrigeración líquida y ventiladores girando"
    >
      <defs>
        <radialGradient id="hp-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity=".35" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hp-glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity=".09" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hp-led" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="hp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* reflejo en el piso */}
      <ellipse cx="200" cy="462" rx="170" ry="16" fill="url(#hp-floor)" className="hp-pulse" />

      {/* estructura del case */}
      <rect x="20" y="20" width="360" height="432" rx="22" fill="#0b1020" stroke="#22d3ee" strokeOpacity=".35" strokeWidth="1.5" />

      {/* componentes que "encienden" al cargar (con brillo) */}
      <g className="hp-poweron" filter="url(#hp-glow)">
        {/* radiador superior + 3 ventiladores */}
        <rect x="44" y="44" width="312" height="82" rx="10" fill="#151b2e" stroke="#22d3ee" strokeOpacity=".25" />
        <Fan cx={100} cy={85} r={32} dur={2.2} />
        <Fan cx={200} cy={85} r={32} dur={2.2} />
        <Fan cx={300} cy={85} r={32} dur={2.2} />

        {/* tubos con flujo de líquido */}
        {["M185 185 C185 155 100 160 100 126", "M215 185 C215 155 300 160 300 126"].map((d) => (
          <g key={d} fill="none" strokeLinecap="round">
            <path d={d} stroke="#0b1020" strokeWidth="9" />
            <path d={d} stroke="#22d3ee" strokeOpacity=".25" strokeWidth="6" />
            <path d={d} stroke="#22d3ee" strokeWidth="3" strokeDasharray="6 10" className="hp-flow" />
          </g>
        ))}

        {/* bloque CPU / bomba */}
        <rect x="170" y="185" width="60" height="60" rx="14" fill="#151b2e" stroke="#22d3ee" strokeWidth="1.5" />
        <circle cx="200" cy="215" r="18" fill="#0b1020" stroke="#2563eb" strokeWidth="2" className="hp-pulse" />

        {/* RAM con LED naranja */}
        {[252, 264, 276].map((x) => (
          <g key={x}>
            <rect x={x} y="178" width="7" height="76" rx="2" fill="#1e293b" />
            <rect x={x} y="178" width="7" height="10" rx="2" fill="#f97316" className="hp-pulse" />
          </g>
        ))}

        {/* ventilador trasero */}
        <Fan cx={322} cy={215} r={22} dur={2.8} reverse />

        {/* GPU */}
        <rect x="44" y="290" width="312" height="72" rx="12" fill="#151b2e" stroke="#22d3ee" strokeOpacity=".5" />
        <rect x="56" y="296" width="288" height="3" rx="1.5" fill="url(#hp-led)" className="hp-pulse" />
        <Fan cx={120} cy={331} r={26} dur={1.8} />
        <Fan cx={208} cy={331} r={26} dur={1.8} reverse />

        {/* fuente de poder */}
        <rect x="44" y="388" width="312" height="50" rx="10" fill="#0f1528" stroke="#22d3ee" strokeOpacity=".15" />
        {[70, 86, 102, 118, 134, 150].map((x) => (
          <line key={x} x1={x} y1="402" x2={x} y2="424" stroke="#22d3ee" strokeOpacity=".2" strokeWidth="2" />
        ))}
        <circle cx="330" cy="413" r="4" fill="#f97316" className="hp-pulse" />
      </g>

      {/* textos sin filtro, para que se lean nítidos */}
      <g className="hp-poweron">
        <text x="200" y="218" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">7800X3D</text>
        <text x="270" y="328" fontSize="14" fontWeight="700" fill="#fff">RTX 4090</text>
        <text x="270" y="344" fontSize="9" fill="#94a3b8">24 GB GDDR6X</text>
      </g>

      {/* brillo diagonal del vidrio */}
      <path d="M70 22 L210 22 L120 450 L28 450 Z" fill="url(#hp-glare)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function HeroTitan({
  price = 84999,
  onBuy = () => {},
  onCustomBuild = () => {},
  onDetails = () => {},
}) {
  const fps = useCountUp(184);
  const temp = useCountUp(54, 1400, 1100);
  const tiltRef = useRef(null);

  // Inclinación 3D siguiendo el mouse (solo si el usuario no pidió menos movimiento)
  const handleMove = (e) => {
    if (prefersReducedMotion() || !tiltRef.current) return;
    const rect = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRef.current.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
  };
  const resetTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(1000px) rotateY(0) rotateX(0)";
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-dark text-white"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

        .hp-spin { transform-box: fill-box; transform-origin: center; animation: hp-spin linear infinite; }
        .hp-flow { animation: hp-flow 1.1s linear infinite; }
        .hp-pulse { animation: hp-pulse 2.6s ease-in-out infinite; }
        .hp-poweron { animation: hp-poweron 1.4s .2s ease-out both; }

        /* Titular: se revela como un barrido de izquierda a derecha */
        .hp-wipe { animation: hp-wipe .9s cubic-bezier(.65,0,.2,1) backwards; }
        /* Resto del contenido: aparece de una vez cuando el case ya encendió */
        .hp-fade { animation: hp-fade .8s .6s ease-out backwards; }
        .hp-outline { color: transparent; -webkit-text-stroke: 1.25px #22d3ee; }

        @keyframes hp-spin { to { transform: rotate(360deg); } }
        @keyframes hp-flow { to { stroke-dashoffset: -32; } }
        @keyframes hp-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes hp-poweron { 0% { opacity: 0; } 30% { opacity: .5; } 45% { opacity: .2; } 100% { opacity: 1; } }
        @keyframes hp-wipe {
          from { clip-path: inset(-.2em 100% -.2em -.2em); transform: translateX(-10px); }
          to   { clip-path: inset(-.2em -.2em -.2em -.2em); transform: none; }
        }
        @keyframes hp-fade { from { opacity: 0; } to { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .hp-spin, .hp-flow, .hp-pulse, .hp-poweron, .hp-wipe, .hp-fade { animation: none !important; }
        }
      `}</style>

      {/* Partículas de flujo de aire */}
      <AirflowParticles />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        {/* ------------------------- Texto ------------------------- */}
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            <span className="hp-wipe block">Potencia absoluta.</span>
            <span
              className="hp-wipe hp-outline mt-3 block text-balance text-4xl font-bold sm:text-5xl xl:text-6xl"
              style={{ animationDelay: "180ms" }}
            >
              RTX 4090 + Ryzen 7 7800X3D
            </span>
          </h1>

          <div className="hp-fade">
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300">
              Ensamblada a mano, con refrigeración líquida de ciclo cerrado. Cada equipo pasa 72 horas
              de pruebas de estrés antes de llegar a tus manos.
            </p>

            {/* Ficha de rendimiento: una sola tira con divisores, no tres tarjetas */}
            <dl className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-white/10 border-y border-white/10">
              <div className="flex flex-col-reverse py-5 pr-5">
                <dt className="mt-1 text-xs leading-snug text-slate-400">promedio en 4K Ultra</dt>
                <dd className="text-3xl font-bold tabular-nums">
                  {fps}
                  <span className="ml-1 text-base font-medium text-slate-400">fps</span>
                </dd>
              </div>
              <div className="flex flex-col-reverse px-5 py-5">
                <dt className="mt-1 text-xs leading-snug text-slate-400">máx. de la GPU en carga</dt>
                <dd className="text-3xl font-bold tabular-nums">
                  {temp}
                  <span className="ml-1 text-base font-medium text-slate-400">°C</span>
                </dd>
              </div>
              <div className="flex flex-col-reverse py-5 pl-5">
                <dt className="mt-1 text-xs leading-snug text-slate-400">de garantía integral</dt>
                <dd className="text-3xl font-bold">
                  3<span className="ml-1 text-base font-medium text-slate-400">años</span>
                </dd>
              </div>
            </dl>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={onBuy}
                className="rounded-lg bg-primary px-7 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech"
              >
                Comprar ahora
              </button>
              <button
                onClick={onCustomBuild}
                className="rounded-lg border border-white/20 px-7 py-3.5 font-semibold text-white transition-colors hover:border-tech hover:text-tech active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech"
              >
                Armar mi PC a medida
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------- Visual ------------------------- */}
        <div className="relative mx-auto w-full max-w-md pb-16 lg:max-w-none">
          {/* Luz detrás del equipo y anillos que repiten la forma de los ventiladores */}
          <div
            aria-hidden
            className="absolute left-1/2 top-[42%] aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2"
            style={{ background: "radial-gradient(closest-side, rgba(34,211,238,.14), transparent)" }}
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-[42%] aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-tech/10"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-[42%] aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-tech/15"
          />

          <div
            ref={tiltRef}
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            className="relative mx-auto aspect-[5/6] w-full max-w-md transition-transform duration-200 ease-out will-change-transform"
          >
            <PcCase />
          </div>

          {/* Ficha del producto: sólida, jerarquía clara */}
          <div className="hp-fade absolute inset-x-4 bottom-0 mx-auto max-w-sm rounded-xl border border-white/10 bg-dark-surface p-4" style={{ animationDelay: "1.3s" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Serie Titan, generación 14</p>
                <p className="mt-0.5 font-semibold">Titan Obsidian X</p>
              </div>
              <p className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Stock listo
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-400">32 GB DDR5 6400 MHz, SSD 2 TB Gen5</p>
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
              <p className="text-2xl font-bold tabular-nums">${fmt(price)}</p>
              <button
                onClick={onDetails}
                className="text-sm font-semibold text-tech underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech"
              >
                Ver ficha técnica
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}