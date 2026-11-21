/* Modelo de la casa + instalación de agua fría (AF) y caliente (AC).
   Unidades: metros. X: contrafrente(0) -> frente(9.40). Y: norte(0) -> sur(7.60). Z: altura.
   Script clásico (sin módulos) para que funcione abriendo index.html con doble clic. */
(function (global) {
  'use strict';

  const H = {
    pbCielo: 2.70,      // altura losa PB (cara inferior)
    losa: 0.20,
    paPiso: 2.90,
    paCielo: 5.50,
    techo: 5.70,
    cielorrasoHumedo: 2.30, // cielorraso suspendido en baño y lavadero
    encadenado: [2.55, 2.70],
    dintel: [2.05, 2.20],
  };

  // ---------------- MUROS ----------------
  // a,b: extremos del eje en planta; t: espesor; z0,z1: alturas.
  const EXT = 0.30, INT = 0.15;
  const walls = [
    // Planta baja - exteriores
    { id: 'PB-N',   a: [2.90, 0.00], b: [9.40, 0.00], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-E',   a: [9.40, 0.00], b: [9.40, 7.60], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-S',   a: [0.00, 7.60], b: [9.40, 7.60], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-O',   a: [0.00, 3.00], b: [0.00, 7.60], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-NL',  a: [0.00, 3.00], b: [2.90, 3.00], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-OB',  a: [2.90, 0.00], b: [2.90, 3.00], t: EXT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    // Planta baja - interiores
    { id: 'PB-I1',  a: [4.96, 0.00], b: [4.96, 4.66], t: INT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-I2',  a: [2.90, 3.00], b: [4.96, 3.00], t: INT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-I3',  a: [4.96, 3.00], b: [9.40, 3.00], t: INT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    { id: 'PB-I4',  a: [0.00, 4.66], b: [4.96, 4.66], t: INT, z0: 0, z1: H.pbCielo, nivel: 'PB' },
    // Planta alta (distribución interior a definir)
    { id: 'PA-N',   a: [4.96, 0.00], b: [9.40, 0.00], t: EXT, z0: H.paPiso, z1: H.paCielo, nivel: 'PA' },
    { id: 'PA-E',   a: [9.40, 0.00], b: [9.40, 7.60], t: EXT, z0: H.paPiso, z1: H.paCielo, nivel: 'PA' },
    { id: 'PA-S',   a: [4.96, 7.60], b: [9.40, 7.60], t: EXT, z0: H.paPiso, z1: H.paCielo, nivel: 'PA' },
    { id: 'PA-O',   a: [4.96, 0.00], b: [4.96, 7.60], t: EXT, z0: H.paPiso, z1: H.paCielo, nivel: 'PA' },
  ];

  // ---------------- ABERTURAS (obstáculos) ----------------
  // wall: id del muro; s0,s1: posición a lo largo del eje (coordenada X o Y); z0,z1.
  const openings = [
    { id: 'P1', tipo: 'puerta',  nombre: 'Puerta principal',       wall: 'PB-E',  s0: 3.60, s1: 4.50, z0: 0,    z1: 2.05, abre: 'in' },
    { id: 'P2', tipo: 'puerta',  nombre: 'Puerta baño',            wall: 'PB-I2', s0: 4.00, s1: 4.75, z0: 0,    z1: 2.05, abre: 'N' },
    { id: 'P3', tipo: 'puerta',  nombre: 'Puerta lavadero-patio',  wall: 'PB-NL', s0: 1.95, s1: 2.75, z0: 0,    z1: 2.05, abre: 'S' },
    { id: 'P4', tipo: 'puerta',  nombre: 'Puerta lavadero-cocina', wall: 'PB-I4', s0: 3.95, s1: 4.75, z0: 0,    z1: 2.05, abre: 'N' },
    { id: 'P5', tipo: 'puerta',  nombre: 'Puerta dormitorio',      wall: 'PB-I3', s0: 8.10, s1: 8.90, z0: 0,    z1: 2.05, abre: 'N' },
    { id: 'V1', tipo: 'ventana', nombre: 'Ventana alta baño',      wall: 'PB-OB', s0: 0.40, s1: 2.30, z0: 1.65, z1: 2.25 },
    { id: 'V2', tipo: 'ventana', nombre: 'Ventanal cocina',        wall: 'PB-O',  s0: 4.80, s1: 7.30, z0: 0.00, z1: 2.25 },
    { id: 'V3', tipo: 'ventana', nombre: 'Ventana cocina (mesada)',wall: 'PB-S',  s0: 0.62, s1: 4.80, z0: 1.30, z1: 2.25 },
    { id: 'V4', tipo: 'ventana', nombre: 'Ventana frente PB sur',  wall: 'PB-E',  s0: 5.00, s1: 7.20, z0: 0.85, z1: 2.05 },
    { id: 'V5', tipo: 'ventana', nombre: 'Ventana frente PB norte',wall: 'PB-E',  s0: 0.40, s1: 2.80, z0: 0.85, z1: 2.05 },
    { id: 'V6', tipo: 'ventana', nombre: 'Ventana frente PA sur',  wall: 'PA-E',  s0: 4.85, s1: 7.05, z0: 3.80, z1: 5.00 },
    { id: 'V7', tipo: 'ventana', nombre: 'Ventana frente PA norte',wall: 'PA-E',  s0: 0.35, s1: 2.90, z0: 3.80, z1: 5.00 },
  ];

  // Columnas de HºAº en esquinas exteriores (supuesto; verificar con el cálculo estructural)
  const columns = [
    [2.90, 0.00], [9.40, 0.00], [9.40, 7.60], [0.00, 7.60], [0.00, 3.00], [2.90, 3.00],
    [0.00, 4.66], [4.96, 0.00], [9.40, 3.00], [4.96, 7.60],
  ].map((p, i) => ({ id: 'C' + (i + 1), x: p[0], y: p[1], s: 0.20 }));

  const rooms = [
    { nombre: 'BAÑO',            x0: 2.90, y0: 0.00, x1: 4.96, y1: 3.00, cielorraso: H.cielorrasoHumedo },
    { nombre: 'DORMITORIO',      x0: 4.96, y0: 0.00, x1: 9.40, y1: 3.00 },
    { nombre: 'LAVADERO',        x0: 0.00, y0: 3.00, x1: 4.96, y1: 4.66, cielorraso: H.cielorrasoHumedo },
    { nombre: 'COCINA - ESTAR',  x0: 0.00, y0: 4.66, x1: 9.40, y1: 7.60 },
    { nombre: 'PATIO',           x0: 0.00, y0: 0.00, x1: 2.90, y1: 3.00, exterior: true },
  ];

  // ---------------- EQUIPOS Y ARTEFACTOS ----------------
  const tanque = { x: 5.65, y: 6.80, r: 0.55, z0: 6.50, z1: 7.80, litros: 1000 };
  const torre = { x0: 4.80, y0: 6.20, x1: 6.30, y1: 7.45, z0: H.techo, z1: 6.50 };
  const termotanque = { x: 0.42, y: 4.10, r: 0.225, z0: 1.10, z1: 1.95, litros: 80 };

  const fixtures = [
    { id: 'DUCHA',  nombre: 'Grifería ducha (mezcladora)', x: 3.05, y: 0.60, z: 1.10, af: [3.00, 0.50, 1.10], ac: [3.00, 0.70, 1.10] },
    { id: 'FLOR',   nombre: 'Flor de ducha',               x: 3.35, y: 0.28, z: 2.10 },
    { id: 'INOD',   nombre: 'Inodoro c/ depósito (sólo AF)', x: 3.30, y: 1.45, z: 0.20, af: [3.00, 1.45, 0.20] },
    { id: 'LAV',    nombre: 'Lavatorio',                   x: 3.30, y: 2.30, z: 0.55, af: [3.00, 2.20, 0.55], ac: [3.00, 2.40, 0.55] },
    { id: 'PILETA', nombre: 'Pileta de cocina (grifería de pared)', x: 1.70, y: 7.25, z: 1.10, af: [1.55, 7.50, 1.10], ac: [1.85, 7.50, 1.10] },
  ];

  // Muebles (para decidir recorridos ocultos)
  const furniture = [
    { nombre: 'Mesada + bajo mesada', x0: 0.30, y0: 7.00, x1: 4.75, y1: 7.45, z0: 0, z1: 0.90 },
    { nombre: 'Inodoro', x0: 3.05, y0: 1.25, x1: 3.75, y1: 1.65, z0: 0, z1: 0.75 },
    { nombre: 'Vanitory', x0: 3.05, y0: 2.00, x1: 3.55, y1: 2.60, z0: 0, z1: 0.85 },
    { nombre: 'Plato de ducha', x0: 3.05, y0: 0.15, x1: 3.95, y1: 1.05, z0: 0, z1: 0.05 },
  ];

  // ---------------- CAÑERÍAS ----------------
  // red: 'AF' fría, 'AC' caliente, 'MZ' mezcla (salida a flor), 'RED' alimentación, 'VENT' ventilación.
  // diam en mm (termofusión PPR). Cada tramo es una polilinea de puntos [x,y,z].
  const pipes = [
    // --- Alimentación desde la red al tanque (con flotante) ---
    { id: 'RED', red: 'RED', diam: 20, nombre: 'Alimentación de red al tanque',
      pts: [[10.20, 7.30, -0.40], [9.80, 7.30, -0.40], [9.80, 7.90, -0.40], [6.60, 7.90, -0.40], [6.60, 7.90, 7.55], [6.60, 6.80, 7.55], [6.20, 6.80, 7.55]] },

    // --- Salida del tanque y colector ---
    { id: 'SAL', red: 'AF', diam: 32, nombre: 'Salida tanque a colector',
      pts: [[5.10, 6.80, 6.60], [4.88, 6.80, 6.60], [4.88, 6.80, 6.20]] },
    { id: 'COL', red: 'AF', diam: 32, flujo: -1, nombre: 'Colector',
      pts: [[4.88, 6.30, 6.20], [4.88, 7.10, 6.20]] },
    { id: 'LIMP', red: 'AF', diam: 25, nombre: 'Limpieza / desagote del tanque',
      pts: [[4.88, 7.00, 6.20], [4.60, 7.00, 6.20], [4.60, 7.00, 5.75]] },

    // --- Bajada exclusiva termotanque (AF-T) ---
    { id: 'AFT', red: 'AF', diam: 25, nombre: 'Bajada AF exclusiva termotanque',
      pts: [[4.88, 6.40, 6.20], [4.88, 6.40, 3.45], [4.88, 4.30, 3.45], [4.88, 4.30, 2.46], [0.42, 4.30, 2.46], [0.42, 4.20, 2.46], [0.42, 4.20, 1.95]] },
    { id: 'VENT', red: 'VENT', diam: 25, nombre: 'Ruptor de vacío (ventilación bajada termotanque)',
      pts: [[4.88, 6.40, 6.00], [4.70, 6.40, 6.00], [4.70, 6.40, 8.10], [4.70, 6.22, 8.10], [4.70, 6.22, 7.95]] },

    // --- Bajada AF consumo (AF-C) ---
    { id: 'AFC', red: 'AF', diam: 25, nombre: 'Bajada AF consumo (baño y cocina)',
      pts: [[4.88, 6.60, 6.20], [4.88, 6.60, 3.30], [4.88, 4.45, 3.30], [4.88, 4.45, 2.40], [0.30, 4.45, 2.40], [0.30, 4.56, 2.40],
            [0.30, 4.56, -0.05], [0.30, 7.45, -0.05], [1.55, 7.45, -0.05], [1.55, 7.50, -0.05], [1.55, 7.50, 1.10]] },
    { id: 'AFB', red: 'AF', diam: 20, nombre: 'AF baño',
      pts: [[3.30, 4.45, 2.40], [3.30, 2.65, 2.40], [3.00, 2.65, 2.40], [3.00, 2.65, 0.30], [3.00, 0.50, 0.30], [3.00, 0.50, 1.10]] },
    { id: 'AFB-I', red: 'AF', diam: 20, nombre: 'AF inodoro', pts: [[3.00, 1.45, 0.30], [3.00, 1.45, 0.20]] },
    { id: 'AFB-L', red: 'AF', diam: 20, nombre: 'AF lavatorio', pts: [[3.00, 2.20, 0.30], [3.00, 2.20, 0.55]] },

    // --- Agua caliente desde el termotanque ---
    { id: 'ACT', red: 'AC', diam: 25, nombre: 'Salida AC termotanque',
      pts: [[0.42, 4.00, 1.95], [0.42, 4.00, 2.52], [0.42, 3.60, 2.52]] },
    { id: 'ACB', red: 'AC', diam: 20, nombre: 'AC baño',
      pts: [[0.42, 3.60, 2.52], [0.42, 3.40, 2.52], [3.15, 3.40, 2.52], [3.15, 2.55, 2.52], [3.00, 2.55, 2.52],
            [3.00, 2.55, 0.80], [3.00, 0.70, 0.80], [3.00, 0.70, 1.10]] },
    { id: 'ACB-L', red: 'AC', diam: 20, nombre: 'AC lavatorio', pts: [[3.00, 2.40, 0.80], [3.00, 2.40, 0.55]] },
    { id: 'ACK', red: 'AC', diam: 20, nombre: 'AC cocina (por contrapiso)',
      pts: [[0.42, 3.60, 2.52], [0.10, 3.60, 2.52], [0.10, 3.60, -0.05], [0.45, 3.60, -0.05], [0.45, 7.30, -0.05],
            [1.85, 7.30, -0.05], [1.85, 7.50, -0.05], [1.85, 7.50, 1.10]] },

    // --- Salida a flor de ducha (agua mezclada) ---
    { id: 'FLOR', red: 'MZ', diam: 20, nombre: 'Salida a flor (rodea la ventana del baño)',
      pts: [[3.00, 0.60, 1.10], [3.00, 0.60, 1.20], [3.00, 0.28, 1.20], [3.00, 0.28, 2.10], [3.35, 0.28, 2.10]] },
  ];

  // Llaves de paso y accesorios
  const valves = [
    { tipo: 'llave', nombre: 'Llave de paso general (red)', p: [10.00, 7.30, -0.40] },
    { tipo: 'llave', nombre: 'Llave colector - bajada termotanque', p: [4.88, 6.40, 6.12] },
    { tipo: 'llave', nombre: 'Llave colector - bajada consumo', p: [4.88, 6.60, 6.05] },
    { tipo: 'llave', nombre: 'Llave limpieza tanque', p: [4.72, 7.00, 6.20] },
    { tipo: 'flotante', nombre: 'Válvula flotante', p: [6.20, 6.80, 7.55] },
    { tipo: 'llave', nombre: 'Llave entrada AF termotanque', p: [0.42, 4.20, 2.15] },
    { tipo: 'seguridad', nombre: 'Válvula de seguridad termotanque (a pileta de patio)', p: [0.42, 4.20, 2.02] },
    { tipo: 'llave', nombre: 'Llave de paso AF baño', p: [3.00, 2.65, 1.30] },
    { tipo: 'llave', nombre: 'Llave de paso AC baño', p: [3.00, 2.55, 1.30] },
    { tipo: 'llave', nombre: 'Llave de paso AF cocina (en bajo mesada)', p: [1.55, 7.50, 0.45] },
    { tipo: 'llave', nombre: 'Llave de paso AC cocina (en bajo mesada)', p: [1.85, 7.50, 0.45] },
  ];

  const extras = [
    { tipo: 'pileta_patio', nombre: 'Pileta de patio (desagote válvula de seguridad)', p: [0.80, 3.45, 0] },
    { tipo: 'electrico', nombre: 'Conexión eléctrica exclusiva termotanque (térmica + disyuntor 30 mA + PAT)', p: [0.10, 4.55, 1.80] },
  ];


  // ---------------- PERFILES DE DIAMETRO ----------------
  // Recomendada = diametros del proyecto. Economica = un paso menos (minimo 20 mm).
  // Sobredimensionada = un paso mas. VENT (ruptor de vacio) y LIMP no se agrandan.
  pipes.forEach(p => { p.dRec = p.diam; });
  const MAP_ECO = { 20: 20, 25: 20, 32: 25, 40: 32 };
  const MAP_SOB = { 20: 25, 25: 32, 32: 40, 40: 40 };
  const estado = { perfil: 'recomendada' };
  function aplicarPerfil(n) {
    estado.perfil = n;
    pipes.forEach(p => {
      if (n === 'economica') p.diam = MAP_ECO[p.dRec];
      else if (n === 'sobredimensionada') p.diam = (p.id === 'VENT' || p.id === 'LIMP') ? p.dRec : MAP_SOB[p.dRec];
      else p.diam = p.dRec;
    });
  }
  // ---------------- VERIFICACIÓN AUTOMÁTICA ----------------
  function wallById(id) { return walls.find(w => w.id === id); }

  function openingBox(o, margen) {
    const w = wallById(o.wall);
    const horiz = w.a[1] === w.b[1];
    const half = w.t / 2 + margen;
    if (horiz) return { x0: o.s0 - margen, x1: o.s1 + margen, y0: w.a[1] - half, y1: w.a[1] + half, z0: o.z0 - margen, z1: o.z1 + margen };
    return { x0: w.a[0] - half, x1: w.a[0] + half, y0: o.s0 - margen, y1: o.s1 + margen, z0: o.z0 - margen, z1: o.z1 + margen };
  }

  function segPts(a, b, paso) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.ceil(d / paso));
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
    return out;
  }

  function segSegDist(p1, q1, p2, q2) {
    // distancia mínima entre segmentos 3D (Ericson, Real-Time Collision Detection)
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2);
    const a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
    let s, t;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    if (a <= 1e-12 && e <= 1e-12) return Math.sqrt(dot(r, r));
    if (a <= 1e-12) { s = 0; t = clamp(f / e); }
    else {
      const c = dot(d1, r);
      if (e <= 1e-12) { t = 0; s = clamp(-c / a); }
      else {
        const b = dot(d1, d2), den = a * e - b * b;
        s = den !== 0 ? clamp((b * f - c * e) / den) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = clamp(-c / a); } else if (t > 1) { t = 1; s = clamp((b - c) / a); }
      }
    }
    const c1 = [p1[0] + d1[0] * s, p1[1] + d1[1] * s, p1[2] + d1[2] * s];
    const c2 = [p2[0] + d2[0] * t, p2[1] + d2[1] * t, p2[2] + d2[2] * t];
    const dd = sub(c1, c2);
    return Math.sqrt(dot(dd, dd));
  }

  function pipeTouches(A, B) {
    // true si un extremo de A está sobre B (o viceversa): es una derivación (T), no un choque
    const ends = (P) => [P.pts[0], P.pts[P.pts.length - 1]];
    const onPipe = (p, P) => P.pts.slice(1).some((q, i) => segSegDist(p, p, P.pts[i], q) < 0.005);
    return ends(A).some(p => onPipe(p, B)) || ends(B).some(p => onPipe(p, A));
  }

  function verificar() {
    const problemas = [], ok = [];
    const SEP_MIN = 0.05; // separación mínima entre ejes de cañerías distintas (m)

    // 1) cañerías vs aberturas (margen 8 cm)
    pipes.forEach(P => {
      for (let i = 1; i < P.pts.length; i++) {
        const muestras = segPts(P.pts[i - 1], P.pts[i], 0.01);
        openings.forEach(o => {
          const b = openingBox(o, 0.08);
          if (muestras.some(p => p[0] > b.x0 && p[0] < b.x1 && p[1] > b.y0 && p[1] < b.y1 && p[2] > b.z0 && p[2] < b.z1))
            problemas.push(`${P.id} invade ${o.nombre}`);
        });
        // 2) columnas: 25 cm desde el centro, sólo dentro de la altura de muros
        columns.forEach(c => {
          if (muestras.some(p => Math.hypot(p[0] - c.x, p[1] - c.y) < 0.25 && p[2] > 0 && p[2] < H.paCielo))
            problemas.push(`${P.id} pasa a menos de 25 cm de la columna ${c.id}`);
        });
        // 3) encadenado: ningún tramo horizontal dentro de un muro por encima de 2.55 en PB
        const a = P.pts[i - 1], q = P.pts[i];
        if (Math.abs(a[2] - q[2]) < 1e-6 && a[2] > H.encadenado[0] && a[2] < H.paPiso) {
          const enMuro = muestras.some(p => walls.some(w => w.nivel === 'PB' && dentroMuro(p, w)));
          if (enMuro) problemas.push(`${P.id} atraviesa el encadenado de un muro a z=${a[2]}`);
        }
      }
    });

    // 4) cañerías de redes distintas: sin choques ni cruces
    for (let i = 0; i < pipes.length; i++) for (let j = i + 1; j < pipes.length; j++) {
      const A = pipes[i], B = pipes[j];
      if (pipeTouches(A, B)) continue;
      let dmin = Infinity;
      for (let a = 1; a < A.pts.length; a++) for (let b = 1; b < B.pts.length; b++)
        dmin = Math.min(dmin, segSegDist(A.pts[a - 1], A.pts[a], B.pts[b - 1], B.pts[b]));
      if (dmin < SEP_MIN) problemas.push(`${A.id} y ${B.id} se cruzan o quedan a ${(dmin * 100).toFixed(1)} cm`);
    }

    // 5) en griferías: caliente a la izquierda mirando el artefacto
    fixtures.filter(f => f.af && f.ac).forEach(f => {
      const w = closestWallNormal(f.ac);
      // vector "izquierda" de quien mira el muro desde el ambiente
      const izq = [w.n[1], -w.n[0]];
      const dAC = f.ac[0] * izq[0] + f.ac[1] * izq[1], dAF = f.af[0] * izq[0] + f.af[1] * izq[1];
      if (dAC > dAF) ok.push(`${f.nombre}: caliente a la izquierda`);
      else problemas.push(`${f.nombre}: la caliente no queda a la izquierda`);
    });

    // 6) altura de tanque sobre la salida más alta (flor de ducha)
    const desnivel = tanque.z0 - 2.10;
    if (desnivel >= 2.0) ok.push(`Fondo de tanque ${desnivel.toFixed(2)} m sobre la flor de ducha (≥ 2.00 m)`);
    else problemas.push(`Tanque muy bajo: ${desnivel.toFixed(2)} m sobre la flor`);

    // 7) ruptor de vacío por encima del nivel del tanque
    const vent = pipes.find(p => p.id === 'VENT');
    const zv = Math.max(...vent.pts.map(p => p[2]));
    if (zv > tanque.z1 + 0.20) ok.push(`Ruptor de vacío ${(zv - tanque.z1).toFixed(2)} m sobre la tapa del tanque`);
    else problemas.push('Ruptor de vacío por debajo del nivel del tanque');

    if (!problemas.length) ok.unshift('Sin interferencias con puertas, ventanas, columnas, encadenados ni entre cañerías');
    return { problemas, ok };
  }

  function dentroMuro(p, w) {
    const horiz = w.a[1] === w.b[1];
    const h = w.t / 2;
    if (p[2] < w.z0 || p[2] > w.z1) return false;
    if (horiz) return p[0] >= Math.min(w.a[0], w.b[0]) && p[0] <= Math.max(w.a[0], w.b[0]) && Math.abs(p[1] - w.a[1]) <= h;
    return p[1] >= Math.min(w.a[1], w.b[1]) && p[1] <= Math.max(w.a[1], w.b[1]) && Math.abs(p[0] - w.a[0]) <= h;
  }

  function closestWallNormal(p) {
    let best = null, dbest = Infinity;
    walls.filter(w => w.nivel === 'PB').forEach(w => {
      const horiz = w.a[1] === w.b[1];
      const inRange = horiz ? (p[0] >= Math.min(w.a[0], w.b[0]) && p[0] <= Math.max(w.a[0], w.b[0]))
                            : (p[1] >= Math.min(w.a[1], w.b[1]) && p[1] <= Math.max(w.a[1], w.b[1]));
      if (!inRange) return;
      const d = horiz ? Math.abs(p[1] - w.a[1]) : Math.abs(p[0] - w.a[0]);
      if (d < dbest) { dbest = d; best = w; }
    });
    const horiz = best.a[1] === best.b[1];
    // normal hacia el lado donde está el punto (el ambiente)
    const n = horiz ? [0, Math.sign(p[1] - best.a[1]) || 1] : [Math.sign(p[0] - best.a[0]) || 1, 0];
    // el observador mira hacia el muro: dirección de mirada = -n
    return { w: best, n: [-n[0], -n[1]] };
  }

  function longitudes() {
    const tot = {};
    pipes.forEach(P => {
      let L = 0;
      for (let i = 1; i < P.pts.length; i++) L += Math.hypot(P.pts[i][0] - P.pts[i - 1][0], P.pts[i][1] - P.pts[i - 1][1], P.pts[i][2] - P.pts[i - 1][2]);
      const k = `${P.red} Ø${P.diam} mm`;
      tot[k] = (tot[k] || 0) + L;
    });
    return tot;
  }

  global.CASA = { H, walls, openings, columns, rooms, tanque, torre, termotanque, fixtures, furniture, pipes, valves, extras, verificar, longitudes, wallById, aplicarPerfil, estado };
})(typeof window !== 'undefined' ? window : globalThis);


