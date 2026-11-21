/* Lista de materiales (accesorios de termofusión) y verificación hidráulica simple.
   Se calcula a partir de la geometría de CASA.pipes, así que cambia con el perfil de diámetros. */
(function (g) {
  'use strict';
  const C = g.CASA;

  const DI = { 20: 13.2, 25: 16.6, 32: 21.2, 40: 26.6 };        // diámetro interior PPR PN20 (mm)
  const ROSCA = { 20: '½"', 25: '¾"', 32: '1"', 40: '1¼"' };
  const KS = 0.7, CHW = 150, LOC = 1.25, V_OK = 1.5, V_MAX = 2.0, P_MIN = 2.0;

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const key = p => p.map(v => Math.round(v / 0.01)).join(',');
  const len = P => P.pts.slice(1).reduce((s, p, i) => s + dist(p, P.pts[i]), 0);

  function onSegInterior(p, a, b) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const L2 = dot(ab, ab); if (L2 < 1e-12) return false;
    const t = dot(ap, ab) / L2; if (t <= 0.0005 || t >= 0.9995) return false;
    return dist([a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t], p) < 0.005;
  }

  // ---------------- HIDRÁULICA ----------------
  // Caudal instalado (L/s) por tramo; los cortes separan zonas con distinto caudal (después de cada derivación).
  const QS = {
    RED: [{ q: 0.25 }], SAL: [{ q: 0.55 }], COL: [{ q: 0.55 }], AFT: [{ q: 0.225 }], ACT: [{ q: 0.225 }],
    AFC: [{ p: [3.30, 4.45, 2.40], q: 0.325 }, { q: 0.075 }],
    AFB: [{ p: [3.00, 2.20, 0.30], q: 0.25 }, { p: [3.00, 1.45, 0.30], q: 0.20 }, { q: 0.10 }],
    ACB: [{ p: [3.00, 2.40, 0.80], q: 0.15 }, { q: 0.10 }],
    'AFB-I': [{ q: 0.10 }], 'AFB-L': [{ q: 0.05 }], 'ACB-L': [{ q: 0.05 }], ACK: [{ q: 0.075 }], FLOR: [{ q: 0.20 }],
  };
  const RUTAS = [
    { nombre: 'Ducha, agua caliente', ids: ['SAL', 'AFT', 'ACT', 'ACB', 'FLOR'], z: 2.10 },
    { nombre: 'Ducha, agua fría', ids: ['SAL', 'AFC@3.30,4.45,2.40', 'AFB', 'FLOR'], z: 2.10 },
    { nombre: 'Pileta cocina, agua caliente', ids: ['SAL', 'AFT', 'ACT', 'ACK'], z: 1.10 },
    { nombre: 'Pileta cocina, agua fría', ids: ['SAL', 'AFC'], z: 1.10 },
  ];
  function arco(P, p) { // distancia a lo largo de la cañería hasta el punto p
    let acum = 0, mejor = 1e9, s = 0;
    for (let i = 1; i < P.pts.length; i++) {
      const a = P.pts[i - 1], b = P.pts[i], ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = dot(ab, ab) || 1e-12;
      const t = Math.max(0, Math.min(1, dot([p[0] - a[0], p[1] - a[1], p[2] - a[2]], ab) / L2));
      const d = dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
      if (d < mejor) { mejor = d; s = acum + t * Math.sqrt(L2); }
      acum += Math.sqrt(L2);
    }
    return s;
  }
  const hazen = (L, q, d) => 10.67 * L * Math.pow(q / 1000, 1.852) / (Math.pow(CHW, 1.852) * Math.pow(DI[d] / 1000, 4.87));
  const vel = (q, d) => q / 1000 / (Math.PI / 4 * Math.pow(DI[d] / 1000, 2));
  // pérdida de un tramo de cañería hasta una distancia máxima (arc), con caudales por zona
  function perdidaTramo(P, hasta) {
    const total = len(P), fin = Math.min(hasta == null ? total : hasta, total);
    let desde = 0, hf = 0;
    QS[P.id].forEach(z => {
      const zFin = z.p ? arco(P, z.p) : total;
      const a = desde, b = Math.min(zFin, fin);
      if (b > a) hf += hazen(b - a, z.q * KS, P.diam);
      desde = zFin;
    });
    return hf;
  }
  function hidraulica() {
    const filas = [];
    C.pipes.forEach(P => {
      if (!QS[P.id]) return;
      let desde = 0; const total = len(P);
      const zonas = QS[P.id].map(z => { const fin = z.p ? arco(P, z.p) : total; const r = { q: z.q * KS, L: fin - desde }; desde = fin; return r; });
      const vmax = Math.max(...zonas.map(z => vel(z.q, P.diam)));
      const hf = perdidaTramo(P);
      filas.push({ id: P.id, nombre: P.nombre, diam: P.diam, q: Math.max(...zonas.map(z => z.q)), v: vmax, L: total, hf,
        nivel: vmax > V_MAX ? 'mal' : vmax > V_OK ? 'aviso' : 'ok' });
    });
    const rutas = RUTAS.map(r => {
      let hf = 0;
      r.ids.forEach(spec => {
        const [id, pt] = spec.split('@'); const P = C.pipes.find(x => x.id === id);
        hf += perdidaTramo(P, pt ? arco(P, pt.split(',').map(Number)) : null);
      });
      hf *= LOC;
      const presion = (C.tanque.z0 - r.z) - hf;
      return { nombre: r.nombre, hf, presion, nivel: presion < 1 ? 'mal' : presion < P_MIN ? 'aviso' : 'ok' };
    });
    const peor = filas.some(f => f.nivel === 'mal') || rutas.some(r => r.nivel === 'mal') ? 'mal'
      : filas.some(f => f.nivel === 'aviso') || rutas.some(r => r.nivel === 'aviso') ? 'aviso' : 'ok';
    return { filas, rutas, peor, vmax: Math.max(...filas.map(f => f.v)), pmin: Math.min(...rutas.map(r => r.presion)) };
  }
  // ---------------- MATERIALES ----------------
  function materiales(margen) {
    margen = margen == null ? 0.10 : margen;
    const items = new Map();
    const sumar = (cat, nombre, diam, qty, nota, conMargen) => {
      const k = cat + '|' + nombre;
      if (!items.has(k)) items.set(k, { cat, nombre, diam, qty: 0, nota: nota || '', conMargen: conMargen !== false });
      const it = items.get(k); it.qty += qty || 1;
      if (nota && !it.nota.split('; ').includes(nota)) it.nota = it.nota ? it.nota + '; ' + nota : nota;
    };

    // 1) grafo: se parten los tramos donde otra cañería termina sobre ellos
    const extremos = [];
    C.pipes.forEach(P => { extremos.push({ p: P.pts[0], P }); extremos.push({ p: P.pts[P.pts.length - 1], P }); });
    const nodos = new Map();
    const inc = (p, dir, P) => { const k = key(p); if (!nodos.has(k)) nodos.set(k, { p, inc: [] }); nodos.get(k).inc.push({ dir, P }); };
    C.pipes.forEach(P => {
      for (let i = 1; i < P.pts.length; i++) {
        const a = P.pts[i - 1], b = P.pts[i], cortes = [a, b];
        extremos.forEach(e => { if (e.P !== P && onSegInterior(e.p, a, b)) cortes.push(e.p); });
        cortes.sort((u, v) => dist(a, u) - dist(a, v));
        for (let j = 1; j < cortes.length; j++) {
          const u = cortes[j - 1], v = cortes[j], L = dist(u, v); if (L < 1e-6) continue;
          const d = [(v[0] - u[0]) / L, (v[1] - u[1]) / L, (v[2] - u[2]) / L];
          inc(u, d, P); inc(v, d.map(x => -x), P);
        }
      }
    });

    // 2) diámetro de cada llave según la cañería donde está
    const distAPipe = (p, P) => Math.min(...P.pts.slice(1).map((q, i) => {
      const a = P.pts[i], ab = [q[0] - a[0], q[1] - a[1], q[2] - a[2]], L2 = dot(ab, ab) || 1e-12;
      let t = Math.max(0, Math.min(1, dot([p[0] - a[0], p[1] - a[1], p[2] - a[2]], ab) / L2));
      return dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
    }));
    const valvulas = C.valves.map(v => {
      let mejor = null, d = 1e9;
      C.pipes.forEach(P => { const x = distAPipe(v.p, P); if (x < d) { d = x; mejor = P; } });
      return Object.assign({}, v, { diam: mejor.diam });
    });
    const valvulaEn = (p) => valvulas.find(v => dist(v.p, p) < 0.02);

    // 3) clasificación de cada nodo
    const D = n => 'Ø' + n;
    nodos.forEach(n => {
      const t = n.inc.length, diams = n.inc.map(i => i.P.diam);
      if (t === 1) return terminal(n);
      if (t === 2) {
        const c = dot(n.inc[0].dir, n.inc[1].dir), a = diams[0], b = diams[1];
        if (c < -0.99) { if (a !== b) sumar('Reducciones', `Reducción ${D(Math.max(a, b))} → ${D(Math.min(a, b))}`, Math.max(a, b), 1); }
        else {
          const dmax = Math.max(a, b);
          sumar('Codos', c > -0.8 && c < -0.6 ? `Codo 45° ${D(dmax)}` : `Codo 90° ${D(dmax)}`, dmax, 1);
          if (a !== b) sumar('Reducciones', `Reducción ${D(Math.max(a, b))} → ${D(Math.min(a, b))}`, Math.max(a, b), 1);
        }
        return;
      }
      // 3 o más: tee (el tramo recto + la derivación)
      let corrido = null;
      for (let i = 0; i < t && !corrido; i++) for (let j = i + 1; j < t; j++) if (dot(n.inc[i].dir, n.inc[j].dir) < -0.99) { corrido = [i, j]; break; }
      if (!corrido) { sumar('Tees', `Tee ${D(Math.max(...diams))} (revisar, sin tramo recto)`, Math.max(...diams), t - 2); return; }
      const ramas = n.inc.map((_, i) => i).filter(i => !corrido.includes(i));
      const dA = diams[corrido[0]], dB = diams[corrido[1]], dR = diams[ramas[0]], dC = Math.max(dA, dB);
      if (dA !== dB) sumar('Reducciones', `Reducción ${D(dC)} → ${D(Math.min(dA, dB))}`, dC, 1);
      if (dR < dC) sumar('Tees', `Tee reductora ${D(dC)} × ${D(dR)} (derivación ${D(dR)})`, dC, 1);
      else sumar('Tees', `Tee ${D(dC)}`, dC, 1);
      ramas.slice(1).forEach(() => sumar('Tees', `Tee ${D(dC)}`, dC, 1));
    });

    function terminal(n) {
      const P = n.inc[0].P, d = P.diam, p = n.p, r = ROSCA[d];
      if (valvulaEn(p)) return;                                 // la válvula ya es el remate (flotante)
      const esUltimo = dist(p, P.pts[P.pts.length - 1]) < 0.01, esPrimero = dist(p, P.pts[0]) < 0.01;
      const cerca = C.fixtures.find(f => [f.af, f.ac, [f.x, f.y, f.z]].some(q => q && dist(q, p) < 0.09));
      const tt = C.termotanque;
      if (cerca) {
        sumar('Terminales y adaptadores', `Codo 90° con inserto metálico rosca hembra ${r} (${D(d)})`, d, 1, 'Remate en griferías, sin soldar el metal');
        if (cerca.id === 'INOD' || cerca.id === 'LAV') sumar('Uniones y conexiones', `Conexión flexible inoxidable ${r} H-H`, d, 1, 'Artefacto a pared', false);
        return;
      }
      if (Math.abs(p[0] - tt.x) < 0.06 && p[1] > 3.9 && p[1] < 4.3 && Math.abs(p[2] - tt.z1) < 0.06) {
        sumar('Terminales y adaptadores', `Adaptador rosca macho ${r} (${D(d)})`, d, 1, 'Conexión al termotanque');
        sumar('Uniones y conexiones', `Unión doble PPR ${D(d)}`, d, 1, 'Permite desarmar y cambiar el termotanque');
        return;
      }
      if (P.id === 'SAL' && esPrimero) { sumar('Terminales y adaptadores', `Adaptador rosca hembra ${r} (${D(d)})`, d, 1, 'Salida del tanque'); return; }
      if (P.id === 'VENT' && esUltimo) { sumar('Terminales y adaptadores', `Adaptador rosca hembra ${r} (${D(d)})`, d, 1, 'Para el ruptor de vacío'); return; }
      if (P.id === 'RED' && esPrimero) { sumar('Terminales y adaptadores', `Adaptador rosca hembra ${r} (${D(d)})`, d, 1, 'Empalme con la conexión de red'); return; }
      if (P.id === 'LIMP' && esUltimo) { sumar('Terminales y adaptadores', `Adaptador rosca hembra ${r} (${D(d)})`, d, 1, 'Descarga de limpieza del tanque'); return; }
      sumar('Tapones', `Tapón PPR ${D(d)}`, d, 1, 'Extremo ciego del colector');
    }

    // 4) llaves de paso y válvulas especiales
    valvulas.forEach(v => {
      const d = v.diam, r = ROSCA[d];
      if (v.tipo === 'llave') sumar('Llaves de paso', `Llave de paso esférica PPR ${D(d)}`, d, 1, v.nombre.replace(/^Llave /, ''), false);
      if (v.tipo === 'flotante') {
        sumar('Complementos (no son termofusión)', `Válvula flotante ${r} para tanque`, d, 1, 'Entrada de red al tanque', false);
        sumar('Terminales y adaptadores', `Adaptador rosca hembra ${r} (${D(d)})`, d, 1, 'Para la válvula flotante');
      }
      if (v.tipo === 'seguridad') sumar('Complementos (no son termofusión)', `Válvula de seguridad ${r} (kit termotanque)`, d, 1, 'Descarga a pileta de patio. Suele venir con el equipo.', false);
    });

    // 5) complementos fijos
    const k = 'Complementos (no son termofusión)';
    sumar(k, 'Termotanque eléctrico 80 L', 0, 1, 'Verificar potencia y soporte para su peso lleno', false);
    sumar(k, `Tanque de reserva ${C.tanque.litros} L con tapa`, 0, 1, 'Con rebalse y ventilación', false);
    sumar(k, 'Pasatanque (salida del tanque)', 0, 1, 'Va con el adaptador rosca de la lista', false);
    sumar(k, 'Ruptor de vacío', 0, 1, 'Sobre el nivel del tanque', false);
    sumar(k, 'Cinta de teflón / sellador de roscas', 0, 1, '', false);
    sumar('Eléctrico del termotanque', 'Térmica bipolar 16 A (confirmar con la potencia del equipo)', 0, 1, 'Circuito exclusivo', false);
    sumar('Eléctrico del termotanque', 'Disyuntor diferencial 2×25 A / 30 mA', 0, 1, '', false);
    sumar('Eléctrico del termotanque', 'Cable 3×2,5 mm² con puesta a tierra', 0, 1, 'Largo según el recorrido, lo define el electricista', false);

    // 6) caños rectos (sólo resumen)
    const largos = {};
    C.pipes.forEach(P => { largos[P.diam] = (largos[P.diam] || 0) + len(P); });
    const tubos = Object.keys(largos).sort((a, b) => a - b).map(d => ({ diam: +d, m: largos[d], barras: Math.ceil(largos[d] * (1 + margen) / 4) }));

    const orden = ['Codos', 'Tees', 'Reducciones', 'Terminales y adaptadores', 'Uniones y conexiones', 'Llaves de paso', 'Tapones', 'Complementos (no son termofusión)', 'Eléctrico del termotanque'];
    const lista = [...items.values()].map(i => Object.assign(i, { comprar: i.conMargen ? Math.ceil(i.qty * (1 + margen)) : i.qty }));
    lista.sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat) || b.diam - a.diam || a.nombre.localeCompare(b.nombre));
    return { lista, orden, tubos, margen };
  }

  g.MAT = { hidraulica, materiales, KS, V_OK, V_MAX, P_MIN };
})(typeof window !== 'undefined' ? window : globalThis);


