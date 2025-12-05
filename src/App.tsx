// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

/* Small Tailwind loader hook (safe even if index.html used CDN) */
const useTailwind = () => {
  useEffect(() => {
    const id = "tailwind-cdn-inject";
    if ((document as any).getElementById(id) || (window as any)._twLoaded) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://cdn.tailwindcss.com";
    s.async = true;
    document.head.appendChild(s);
    (window as any)._twLoaded = true;
  }, []);
};

/* Minimal math renderer (not LaTeX engine — displays math text) */
const M: React.FC<{ children: React.ReactNode; block?: boolean }> = ({ children, block }) => (
  <span className={`inline-block ${block ? "block text-center my-2" : ""} font-mono text-sm`} aria-hidden>
    {children}
  </span>
);

const g = 9.81;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* Simple FBD SVG component (horizontal or incline) */
type FBDProps = {
  width?: number;
  height?: number;
  mg?: number;
  normal?: number;
  friction?: number;
  applied?: { magnitude: number; angleDeg: number } | null;
  inclineDeg?: number;
  showLabels?: boolean;
};
const FBDBlock: React.FC<FBDProps> = ({ width = 320, height = 200, mg = 9.81, normal = 9.81, friction = 0, applied = null, inclineDeg = 0, showLabels = true }) => {
  const cx = width / 2;
  const cy = height / 2;
  const blockW = 72;
  const blockH = 44;
  const inclineRad = (inclineDeg * Math.PI) / 180;
  const maxArrow = Math.max(Math.abs(mg), Math.abs(normal), Math.abs(friction), applied ? applied.magnitude : 1);
  const scale = 28 / maxArrow;

  const arrow = (x1: number, y1: number, x2: number, y2: number, label?: string) => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const h1 = [x2 - 7 * Math.cos(ang - 0.35), y2 - 7 * Math.sin(ang - 0.35)];
    const h2 = [x2 - 7 * Math.cos(ang + 0.35), y2 - 7 * Math.sin(ang + 0.35)];
    return (
      <g key={`${x1}-${y1}-${x2}-${y2}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth={2} />
        <polyline points={`${x2},${y2} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}`} fill="none" stroke="#111" strokeWidth={2} />
        {label ? <text x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2 - 8} fontSize={12}>{label}</text> : null}
      </g>
    );
  };

  if (inclineDeg !== 0) {
    const len = width * 0.9;
    const sx = (width - len) / 2;
    const sy = height - 36;
    const ex = sx + len * Math.cos(-inclineRad);
    const ey = sy + len * Math.sin(-inclineRad);
    const bx = sx + len * 0.35 * Math.cos(-inclineRad);
    const by = sy + len * 0.35 * Math.sin(-inclineRad);

    const mgTo = { x: bx, y: by + mg * scale };
    const nTo = { x: bx + normal * scale * Math.cos(-inclineRad + Math.PI / 2), y: by + normal * scale * Math.sin(-inclineRad + Math.PI / 2) };
    const fTo = { x: bx - friction * scale * Math.cos(-inclineRad), y: by - friction * scale * Math.sin(-inclineRad) };
    const aTo = applied ? { x: bx + applied.magnitude * scale * Math.cos((applied.angleDeg * Math.PI) / 180), y: by - applied.magnitude * scale * Math.sin((applied.angleDeg * Math.PI) / 180) } : null;

    return (
      <svg width={width} height={height}>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#666" strokeWidth={4} />
        <g transform={`translate(${bx},${by}) rotate(${(-inclineDeg).toFixed(2)})`}>
          <rect x={-blockW / 2} y={-blockH / 2} width={blockW} height={blockH} rx={6} fill="#f3e8ff" stroke="#6b21a8" />
        </g>
        {arrow(bx, by, mgTo.x, mgTo.y, showLabels ? "mg" : undefined)}
        {arrow(bx, by, nTo.x, nTo.y, showLabels ? "N" : undefined)}
        {friction > 0 && arrow(bx, by, fTo.x, fTo.y, showLabels ? "f" : undefined)}
        {aTo && arrow(bx, by, aTo.x, aTo.y, showLabels ? "F" : undefined)}
      </svg>
    );
  }

  // horizontal
  const bx = cx;
  const by = cy + 12;
  const nTo = { x: bx, y: by - normal * scale };
  const mgTo = { x: bx, y: by + mg * scale };
  const fTo = { x: bx - friction * scale, y: by };
  const appliedTo = applied ? { x: bx + applied.magnitude * scale * Math.cos((applied.angleDeg * Math.PI) / 180), y: by - applied.magnitude * scale * Math.sin((applied.angleDeg * Math.PI) / 180) } : null;

  return (
    <svg width={width} height={height}>
      <rect x={36} y={by + blockH / 2 + 6} width={width - 72} height={8} rx={4} fill="#cfcfcf" />
      <rect x={bx - blockW / 2} y={by - blockH / 2} width={blockW} height={blockH} rx={6} fill="#f3e8ff" stroke="#6b21a8" />
      {arrow(bx, by, nTo.x, nTo.y, showLabels ? "N" : undefined)}
      {arrow(bx, by, mgTo.x, mgTo.y, showLabels ? "mg" : undefined)}
      {friction > 0 && arrow(bx, by, fTo.x, fTo.y, showLabels ? "f" : undefined)}
      {appliedTo && arrow(bx, by, appliedTo.x, appliedTo.y, showLabels ? "F" : undefined)}
    </svg>
  );
};

/* Small interactive pieces */
const ConceptVisualizer: React.FC = () => {
  const [A, setA] = useState(8);
  const [B, setB] = useState(6);
  const net = A - B;
  return (
    <section className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: "#4c1d95" }}>Concept Visualiser</h3>
      <div className="grid md:grid-cols-2 gap-3 mt-2">
        <div>
          <label>Force A (right): {A} N</label>
          <input type="range" min={0} max={15} value={A} onChange={(e) => setA(Number(e.target.value))} />
          <label className="block mt-2">Force B (left): {B} N</label>
          <input type="range" min={0} max={15} value={B} onChange={(e) => setB(Number(e.target.value))} />
          <div className="mt-2 text-sm">Net = {net.toFixed(2)} N — {net === 0 ? "balanced" : net > 0 ? "right" : "left"}</div>
          <div className="mt-2"><M block>$\sum F = ma$</M></div>
        </div>
        <div className="flex items-center justify-center">
          <svg width={240} height={120}>
            <rect x={20} y={40} width={200} height={30} rx={6} fill="#fde68a" stroke="#b45309" />
            <text x={110} y={62} fontSize={14} fontWeight={600}>Block</text>
            <text x={8} y={14} fontSize={12}>Net = {net.toFixed(2)} N</text>
          </svg>
        </div>
      </div>
    </section>
  );
};

const InteractiveLab: React.FC = () => {
  const [m, setM] = useState(6.0);
  const [F, setF] = useState(40);
  const [theta, setTheta] = useState(30);
  const [mu, setMu] = useState(0.2);
  const [inc, setInc] = useState(0);

  const Fx = F * Math.cos((theta * Math.PI) / 180);
  const Fy = F * Math.sin((theta * Math.PI) / 180);
  const N = inc === 0 ? m * g - Fy : m * g * Math.cos((inc * Math.PI) / 180);
  const fk = mu * N;
  const netX = inc === 0 ? Fx - fk : m * g * Math.sin((inc * Math.PI) / 180) - fk;
  const a = netX / m;

  return (
    <section className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: "#4c1d95" }}>Interactive Lab</h3>
      <div className="grid md:grid-cols-2 gap-3 mt-2">
        <div>
          <label>Mass (kg): {m.toFixed(2)}</label>
          <input type="range" min={0.5} max={50} step={0.1} value={m} onChange={(e) => setM(Number(e.target.value))} />
          <label className="block mt-2">Force (N): {F.toFixed(1)}</label>
          <input type="range" min={0} max={200} step={0.5} value={F} onChange={(e) => setF(Number(e.target.value))} />
          <label className="block mt-2">Angle θ°: {theta}</label>
          <input type="range" min={0} max={80} value={theta} onChange={(e) => setTheta(Number(e.target.value))} />
          <label className="block mt-2">μ_k: {mu.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={mu} onChange={(e) => setMu(Number(e.target.value))} />
          <label className="block mt-2">Incline °: {inc}</label>
          <input type="range" min={0} max={45} value={inc} onChange={(e) => setInc(Number(e.target.value))} />
          <div className="mt-2 text-sm">
            Fx = {Fx.toFixed(2)} N, Fy = {Fy.toFixed(2)} N<br />
            N ≈ {N.toFixed(2)} N, fk ≈ {fk.toFixed(2)} N<br />
            Net ≈ {netX.toFixed(2)} N → a ≈ {a.toFixed(3)} m·s⁻²
          </div>
        </div>
        <div>
          <div className="border rounded p-2 bg-gray-50">
            <FBDBlock width={380} height={220} mg={m * g} normal={N} friction={fk} applied={{ magnitude: F, angleDeg: theta }} inclineDeg={inc} showLabels />
          </div>
        </div>
      </div>
    </section>
  );
};

/* Derived content + solvers + quiz */
const DerivationStation: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Vector law", lines: ["ΣF = m a (vector)"], math: "$$\\sum \\vec F = m \\vec a$$" },
    { title: "Components", lines: ["ΣF_x = m a_x; ΣF_y = m a_y"], math: "$$\\sum F_x = m a_x$$" },
    { title: "Incline", lines: ["Parallel: mg sinθ; Perp: mg cosθ"], math: "$$mg\\sin\\theta,\\;mg\\cos\\theta$$" }
  ];
  return (
    <section className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: "#4c1d95" }}>Derivation Station</h3>
      <div className="flex gap-3 mt-2">
        <nav className="w-44 space-y-2">
          {steps.map((s, i) => <button key={i} onClick={() => setStep(i)} className={`w-full p-2 rounded ${i === step ? "bg-purple-900 text-white" : "bg-gray-50"}`}>{i + 1}. {s.title}</button>)}
        </nav>
        <div className="flex-1">
          {steps[step].lines.map((l, idx) => <p key={idx} className="text-sm text-gray-700">{l}</p>)}
          <div className="mt-2"><M block>{steps[step].math}</M></div>
        </div>
      </div>
    </section>
  );
};

const StepSolvers: React.FC = () => {
  const [m, setM] = useState(10.0);
  const [F, setF] = useState(30.0);
  const [mu, setMu] = useState(0.25);
  const N = m * g;
  const fk = mu * N;
  const a = (F - fk) / m;
  return (
    <section className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: "#4c1d95" }}>Step-by-step Solvers</h3>
      <div className="mt-2 text-sm">m={m.toFixed(2)} kg, F={F.toFixed(1)} N, μ_k={mu.toFixed(2)}</div>
      <div className="grid md:grid-cols-3 gap-2 mt-2">
        <div><label>m: {m.toFixed(2)}</label><input type="range" min={0.5} max={50} step={0.1} value={m} onChange={(e) => setM(Number(e.target.value))} /></div>
        <div><label>F: {F.toFixed(1)}</label><input type="range" min={0} max={200} step={0.5} value={F} onChange={(e) => setF(Number(e.target.value))} /></div>
        <div><label>μ_k: {mu.toFixed(2)}</label><input type="range" min={0} max={1} step={0.01} value={mu} onChange={(e) => setMu(Number(e.target.value))} /></div>
      </div>
      <div className="mt-2 bg-gray-50 p-2 rounded text-sm">N={N.toFixed(2)} N, f_k={fk.toFixed(2)} N → a={a.toFixed(3)} m·s⁻²</div>
      <div className="mt-2"><FBDBlock width={360} height={140} mg={m * g} normal={N} friction={fk} applied={{ magnitude: F, angleDeg: 0 }} showLabels /></div>
    </section>
  );
};

const Quiz: React.FC = () => {
  const qs = [{ q: "If ΣF=0, which is true?", opts: ["At rest", "Constant velocity", "Accelerating"], a: 1 }, { q: "Action–reaction forces act on:", opts: ["Same object", "Different objects"], a: 1 }];
  const [ans, setAns] = useState<number[]>(Array(qs.length).fill(-1));
  const [show, setShow] = useState(false);
  return (
    <section className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: "#4c1d95" }}>Quick Quiz</h3>
      <div className="mt-2 space-y-2">
        {qs.map((it, i) => (
          <div key={i} className="p-2 border rounded">
            <div className="font-medium">{i + 1}. {it.q}</div>
            <div className="mt-1 grid gap-1">{it.opts.map((o, j) => <label key={j} className="inline-flex items-center gap-2"><input type="radio" name={`q${i}`} checked={ans[i] === j} onChange={() => setAns((a) => a.map((v, k) => (k === i ? j : v)))} /><span className="text-sm">{o}</span></label>)}</div>
          </div>
        ))}
        <div className="flex gap-2 mt-2"><button className="px-3 py-1 rounded" style={{ background: "#4c1d95", color: "white" }} onClick={() => setShow(true)}>Check</button><button className="px-3 py-1 rounded border" onClick={() => { setAns(Array(qs.length).fill(-1)); setShow(false); }}>Reset</button></div>
        {show && <div className="mt-2 bg-gray-50 p-2 rounded text-sm">{qs.map((it, i) => <div key={i} className={ans[i] === it.a ? "text-green-700" : "text-red-700"}>Correct: {it.opts[it.a]} {ans[i] === it.a ? "✔" : ` (You chose: ${ans[i] >= 0 ? it.opts[ans[i]] : "no answer"})`}</div>)}</div>}
      </div>
    </section>
  );
};

/* Slide wrapper */
const Slide: React.FC<{ title: string; time?: string; children?: React.ReactNode }> = ({ title, time = "3 min", children }) => (
  <article className="p-4 rounded bg-gradient-to-br from-white to-amber-50 border shadow-sm">
    <header className="flex justify-between items-start"><h2 className="text-2xl font-bold" style={{ color: "#4c1d95" }}>{title}</h2><div className="text-sm text-gray-600">Est: {time}</div></header>
    <div className="mt-3 space-y-3">{children}</div>
  </article>
);

/* Main App */
export default function App(): JSX.Element {
  useTailwind();
  const slides = useMemo(() => [
    { id: "title", title: "Chapter 5 — Newton's Laws" },
    { id: "overview", title: "Overview" },
    { id: "n1", title: "Newton 1" },
    { id: "n2", title: "Newton 2" },
    { id: "n3", title: "Newton 3" },
    { id: "fbd", title: "Free-Body Diagrams" },
    { id: "lab", title: "Interactive Lab" },
    { id: "derive", title: "Derivation" },
    { id: "solve", title: "Solvers" },
    { id: "quiz", title: "Quiz" },
    { id: "summary", title: "Summary" }
  ], []);
  const [index, setIndex] = useState(0);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-amber-50 to-white text-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-3xl font-extrabold" style={{ color: "#4c1d95" }}>PHY110 — Chapter Template</h1><p className="text-sm text-gray-600">Teaching template (UiTM theme)</p></div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded" style={{ background: "#4c1d95", color: "white" }} onClick={() => setIndex(0)}>Start</button>
            <button className="px-3 py-2 rounded border" onClick={() => setIndex((i) => clamp(i - 1, 0, slides.length - 1))}>Prev</button>
            <button className="px-3 py-2 rounded border" onClick={() => setIndex((i) => clamp(i + 1, 0, slides.length - 1))}>Next →</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-4">
            {slides[index].id === "title" && <Slide title={slides[index].title} time="1 min"><p className="text-sm">Hook: everyday examples. Emphasise FBDs.</p></Slide>}
            {slides[index].id === "overview" && <Slide title="Overview" time="3 min"><ol className="list-decimal ml-6 text-sm"><li>Newton 1–3</li><li>Friction</li><li>Inclined plane</li></ol></Slide>}
            {slides[index].id === "n1" && <Slide title="Newton 1" time="4 min"><p className="text-sm">Inertia; ΣF=0</p></Slide>}
            {slides[index].id === "n2" && <Slide title="Newton 2" time="6 min"><p className="text-sm">ΣF = m a; components</p></Slide>}
            {slides[index].id === "n3" && <Slide title="Newton 3" time="4 min"><p className="text-sm">Action-reaction pairs</p></Slide>}
            {slides[index].id === "fbd" && <Slide title="Free-Body Diagrams" time="6 min"><ol className="list-decimal ml-6 text-sm"><li>Isolate object</li><li>Draw external forces</li><li>Resolve components</li></ol><div className="mt-3"><FBDBlock width={520} height={220} mg={9.81 * 6} normal={9.81 * 6 * Math.cos((25 * Math.PI) / 180)} friction={0} inclineDeg={25} showLabels /></div></Slide>}
            {slides[index].id === "lab" && <Slide title="Interactive Lab" time="6 min"><InteractiveLab /></Slide>}
            {slides[index].id === "derive" && <Slide title="Derivation" time="4 min"><DerivationStation /></Slide>}
            {slides[index].id === "solve" && <Slide title="Solvers" time="6 min"><StepSolvers /></Slide>}
            {slides[index].id === "quiz" && <Slide title="Quiz" time="2 min"><Quiz /></Slide>}
            {slides[index].id === "summary" && <Slide title="Summary" time="6 min"><ul className="list-disc ml-6 text-sm"><li>Recap Newton 1–3</li><li>Friction: f_s ≤ μ_s N; f_k = μ_k N</li></ul></Slide>}
          </div>

          <aside className="space-y-4">
            <div className="p-3 rounded border bg-white sticky top-6">
              <div className="text-sm font-semibold mb-2">Slides</div>
              <ul className="space-y-1 text-sm">
                {slides.map((s, i) => <li key={s.id}><button onClick={() => setIndex(i)} className={`text-left w-full py-1 px-2 rounded ${i === index ? "bg-purple-900 text-white" : "hover:bg-purple-50"}`}>{i + 1}. {s.title}</button></li>)}
              </ul>
            </div>

            <div className="p-3 rounded border bg-white">
              <div className="text-sm font-semibold">Speaker notes</div>
              <div className="mt-2 text-xs text-gray-700">Start each problem with FBD, list variables, check units, choose axes.</div>
            </div>

            <div className="p-3 rounded border bg-white">
              <div className="text-sm font-semibold">References</div>
              <ol className="text-xs mt-2 text-gray-700"><li>PHY110 lecture notes (UiTM)</li><li>Giancoli — Physics</li></ol>
            </div>
          </aside>
        </div>

        <footer className="mt-6 text-xs text-gray-500 text-center">PHY110 — teaching template (UiTM theme)</footer>
      </div>
    </div>
  );
}
