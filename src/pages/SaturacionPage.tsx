import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Icons } from "../components/Icons";

const Y = 2026,
  DAYW = 3.0,
  LAB = 230,
  SATMAX = 4;
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const AREACOLORS: Record<string, string> = {
  "Producción/Diseño": "#6ea8fe",
  "Gráfica Digital": "#5fd0c5",
  Audio: "#f4a259",
  Ingeniería: "#b388eb",
  "IER (Electrónica)": "#e85d75",
  "TIM (Animación)": "#7bc96f",
  Investigación: "#e8c84a",
  "Realidad Virtual": "#4ea8de",
};
const D0 = Date.UTC(Y, 0, 1);
const DAYS = (Date.UTC(Y, 11, 31) - D0) / 86400000 + 1;
const di = (iso: string) => Math.round((new Date(iso + "T00:00:00Z").getTime() - D0) / 86400000);
const dlabel = (iso: string) => {
  const [, m, d] = iso.split("-");
  return +d + " " + MES[+m - 1];
};
const esc = (s: string) => (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

type Act = { id: string; area: string; titulo: string; tentativa?: boolean; continua?: boolean; oculta?: boolean; inicio?: string; fin?: string };
type Ses = { actividad_id: string; inicio: string; fin: string; tipo: string };

function heatColor(v: number) {
  if (v <= 0) return "#141722";
  const t = Math.min(1, v / SATMAX);
  const stops = [[29, 59, 47], [58, 125, 58], [207, 209, 74], [232, 146, 58], [214, 69, 58]];
  const p = t * (stops.length - 1),
    i = Math.min(stops.length - 2, Math.floor(p)),
    f = p - i;
  const c = stops[i].map((s, k) => Math.round(s + (stops[i + 1][k] - s) * f));
  return "rgb(" + c.join(",") + ")";
}

function buildGantt(host: HTMLDivElement, acts: Act[], sesByAct: Record<string, Ses[]>, tip: HTMLDivElement) {
  const WIDTH = DAYS * DAYW;
  host.innerHTML = "";
  host.style.width = WIDTH + LAB + "px";
  const sesOf = (a: Act): { inicio: string; fin: string; tipo: string }[] => {
    const ss = sesByAct[a.id];
    if (ss && ss.length) return ss;
    if (a.inicio && a.fin) return [{ inicio: a.inicio, fin: a.fin, tipo: a.continua ? "continua" : "bloque" }];
    return [];
  };
  const visibles = acts.filter((a) => !a.oculta);
  const heatActs = visibles.filter((a) => !a.continua);
  const heat = new Array(DAYS).fill(0) as number[];
  heatActs.forEach((a) => {
    const days = new Set<number>();
    sesOf(a).forEach((s) => {
      for (let i = di(s.inicio); i <= di(s.fin); i++) if (i >= 0 && i < DAYS) days.add(i);
    });
    days.forEach((i) => (heat[i]++));
  });
  const mx = Math.max(1, ...heat);

  const showTip = (e: MouseEvent, h: string) => {
    tip.innerHTML = h;
    tip.style.display = "block";
    let x = e.clientX + 14,
      y = e.clientY + 14;
    if (x + 320 > window.innerWidth) x = e.clientX - 306;
    if (y + 180 > window.innerHeight) y = e.clientY - 160;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  };
  const hideTip = () => (tip.style.display = "none");

  // months header
  const mh = document.createElement("div");
  mh.style.cssText = "position:sticky;top:0;z-index:8;display:flex;background:#171a23;border-bottom:1px solid #2a2f3e";
  const ml = document.createElement("div");
  ml.style.cssText = `position:sticky;left:0;z-index:9;width:${LAB}px;min-width:${LAB}px;background:#171a23;border-right:1px solid #2a2f3e;padding:6px 10px;font-size:12px;font-weight:700`;
  ml.textContent = "Mes";
  mh.appendChild(ml);
  const mt = document.createElement("div");
  mt.style.cssText = "position:relative;flex:1;height:26px";
  for (let m = 0; m < 12; m++) {
    const off = di(Y + "-" + String(m + 1).padStart(2, "0") + "-01");
    const c = document.createElement("div");
    c.style.cssText = `position:absolute;top:0;height:100%;border-left:1px solid #2a2f3e;font-size:11px;color:#9aa3b2;padding:5px 0 0 6px;text-transform:uppercase;left:${off * DAYW}px`;
    c.textContent = MES[m];
    mt.appendChild(c);
  }
  mh.appendChild(mt);
  host.appendChild(mh);

  // heat row
  const peaks: [number, number][] = [];
  {
    let s = -1;
    for (let i = 0; i <= DAYS; i++) {
      const hi = i < DAYS && heat[i] >= SATMAX;
      if (hi && s < 0) s = i;
      else if (!hi && s >= 0) {
        peaks.push([s, i - 1]);
        s = -1;
      }
    }
  }
  const hr = document.createElement("div");
  hr.style.cssText = "position:relative;display:flex;border-bottom:2px solid #2a2f3e";
  const hl = document.createElement("div");
  hl.style.cssText = `position:sticky;left:0;z-index:7;width:${LAB}px;min-width:${LAB}px;background:#171a23;border-right:1px solid #2a2f3e;padding:6px 10px;font-size:12px;font-weight:700;display:flex;flex-direction:column;justify-content:center`;
  hl.innerHTML = `Saturación / día<small style="color:#9aa3b2;font-weight:400">verde 1 · rojo 4+ · máx real ${mx}</small>`;
  hr.appendChild(hl);
  const ht = document.createElement("div");
  ht.style.cssText = "position:relative;flex:1;height:34px";
  for (let i = 0; i < DAYS; i++) {
    const cell = document.createElement("div");
    cell.style.cssText = `position:absolute;top:0;height:100%;left:${i * DAYW}px;width:${DAYW + 0.5}px;background:${heatColor(heat[i])}`;
    cell.addEventListener("mousemove", (e) => {
      const iso = new Date(D0 + i * 86400000).toISOString().slice(0, 10);
      const list = heatActs.filter((a) => sesOf(a).some((s) => di(s.inicio) <= i && i <= di(s.fin)));
      showTip(
        e,
        `<b>${dlabel(iso)} · ${list.length} simultáneas</b><br><span style="color:#9aa3b2">${list.slice(0, 12).map((a) => "• " + esc(a.titulo)).join("<br>")}${list.length > 12 ? "<br>…" : ""}</span>`
      );
    });
    cell.addEventListener("mouseleave", hideTip);
    ht.appendChild(cell);
  }
  peaks.forEach(([a, b]) => {
    const pk = document.createElement("div");
    pk.style.cssText = `position:absolute;top:0;bottom:0;left:${a * DAYW}px;width:${(b - a + 1) * DAYW}px;background:rgba(214,69,58,.10);border-left:1px dashed rgba(214,69,58,.5);border-right:1px dashed rgba(214,69,58,.5);pointer-events:none`;
    ht.appendChild(pk);
  });
  hr.appendChild(ht);
  host.appendChild(hr);

  // groups
  Object.keys(AREACOLORS).forEach((area) => {
    const list = visibles.filter((a) => a.area === area).sort((x, y) => ((x.inicio || "") < (y.inicio || "") ? -1 : 1));
    if (!list.length) return;
    const g = document.createElement("div");
    g.style.cssText = `position:sticky;left:0;z-index:6;background:#1d2130;padding:5px 12px;font-weight:700;font-size:12px;border-bottom:1px solid #2a2f3e;display:flex;align-items:center;gap:8px`;
    g.innerHTML = `<span style="width:11px;height:11px;border-radius:3px;display:inline-block;background:${AREACOLORS[area]}"></span>${area} · ${list.length}`;
    host.appendChild(g);
    list.forEach((a) => {
      const row = document.createElement("div");
      row.style.cssText = "position:relative;display:flex;border-bottom:1px solid #2a2f3e";
      const lab = document.createElement("div");
      lab.style.cssText = `position:sticky;left:0;z-index:5;width:${LAB}px;min-width:${LAB}px;background:#171a23;border-right:1px solid #2a2f3e;padding:6px 10px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
      lab.textContent = a.titulo;
      row.appendChild(lab);
      const tr = document.createElement("div");
      tr.style.cssText = "position:relative;flex:1;height:30px";
      sesOf(a).forEach((se) => {
        const s = di(se.inicio),
          e = di(se.fin);
        if (e < 0 || s >= DAYS) return;
        const w = Math.max(7, (e - s + 1) * DAYW);
        const bar = document.createElement("div");
        bar.style.cssText = `position:absolute;top:5px;height:20px;border-radius:5px;left:${s * DAYW}px;width:${w}px;background:${AREACOLORS[area]};box-shadow:0 1px 2px rgba(0,0,0,.35);cursor:default${a.continua ? ";opacity:.5;border:1px dashed rgba(255,255,255,.5)" : ""}`;
        bar.addEventListener("mousemove", (ev) => {
          const ds = se.inicio === se.fin ? dlabel(se.inicio) : dlabel(se.inicio) + " → " + dlabel(se.fin);
          showTip(ev, `<b>${esc(a.titulo)}</b><br><span style="color:#9aa3b2">${a.area}<br>Sesión: ${ds}</span>`);
        });
        bar.addEventListener("mouseleave", hideTip);
        tr.appendChild(bar);
      });
      row.appendChild(tr);
      host.appendChild(row);
    });
  });
}

export function SaturacionPage() {
  const auth = loadAuth();
  const allowed = !!auth && (auth.role === "ADMIN" || auth.role === "DIRECTOR");
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const [ra, rs] = await Promise.all([
        supabase.from("actividades").select("*"),
        supabase.from("sesiones").select("*"),
      ]);
      if (ra.error) {
        setState("error");
        setMsg(ra.error.message);
        return;
      }
      const acts = (ra.data || []) as Act[];
      if (!acts.length) {
        setState("empty");
        return;
      }
      const sesByAct: Record<string, Ses[]> = {};
      ((rs.data || []) as Ses[]).forEach((s) => {
        (sesByAct[s.actividad_id] = sesByAct[s.actividad_id] || []).push(s);
      });
      setState("ready");
      requestAnimationFrame(() => {
        if (hostRef.current && tipRef.current) buildGantt(hostRef.current, acts, sesByAct, tipRef.current);
      });
    })();
  }, [allowed]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Inicio
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-black/5">
          <Icons.CalendarRange size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Saturación / Calendario 2026</h1>
          <p className="text-xs text-slate-500">Actividades simultáneas por día · pasa el cursor sobre barras y franja de calor</p>
        </div>
      </div>

      {!allowed ? (
        <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Este módulo es solo para directores y administración.
        </p>
      ) : state === "loading" ? (
        <p className="mt-6 text-sm text-slate-500">Cargando…</p>
      ) : state === "error" ? (
        <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">Error: {msg}</p>
      ) : state === "empty" ? (
        <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 ring-1 ring-black/5">
          Aún no hay actividades para mostrar. Cuando se capturen fichas con sesiones, aparecerán aquí.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-black/10" style={{ background: "#0f1117" }}>
          <div ref={hostRef} style={{ position: "relative", color: "#e7eaf0", font: "13px -apple-system,Segoe UI,Roboto,sans-serif" }} />
        </div>
      )}
      <div
        ref={tipRef}
        style={{
          position: "fixed",
          zIndex: 50,
          pointerEvents: "none",
          display: "none",
          background: "#0b0d12",
          border: "1px solid #2a2f3e",
          borderRadius: 8,
          padding: "8px 10px",
          maxWidth: 320,
          fontSize: 12,
          color: "#e7eaf0",
          boxShadow: "0 8px 24px rgba(0,0,0,.5)",
        }}
      />
    </div>
  );
}
