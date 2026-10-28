// ============================================================================
// SCRIPT 4 - PASO 7: GENERACIÓN PROCEDURAL DE GEOMETRÍAS 3D (VBO, VAO, EBO)
// Mini Motor Gráfico - Acuario Marino 3D (Gran Tanque, Tiburón, Medusa, Tortuga y Hábitat)
// ============================================================================

"use strict";

// Función general para crear y cargar mallas en buffers GPU (VAO, VBO, EBO)
function crearMallaGPU(glCtx, vertices, normales, uvs, indices) {
    const vao = glCtx.createVertexArray();
    glCtx.bindVertexArray(vao);

    // Buffer de Posiciones (Location 0)
    const posBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, posBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(vertices), glCtx.STATIC_DRAW);
    glCtx.enableVertexAttribArray(0);
    glCtx.vertexAttribPointer(0, 3, glCtx.FLOAT, false, 0, 0);

    // Buffer de Normales (Location 1 - Paso 8)
    const normBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, normBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(normales), glCtx.STATIC_DRAW);
    glCtx.enableVertexAttribArray(1);
    glCtx.vertexAttribPointer(1, 3, glCtx.FLOAT, false, 0, 0);

    // Buffer de UVs (Location 2 - Paso 9)
    const uvBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, uvBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(uvs), glCtx.STATIC_DRAW);
    glCtx.enableVertexAttribArray(2);
    glCtx.vertexAttribPointer(2, 2, glCtx.FLOAT, false, 0, 0);

    // Buffer de Índices (Paso 5)
    const idxBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, idxBuffer);
    glCtx.bufferData(glCtx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glCtx.STATIC_DRAW);

    glCtx.bindVertexArray(null);

    return {
        vao: vao,
        numElements: indices.length
    };
}

// ----------------------------------------------------------------------------
// 1. GEOMETRÍA DEL PEZ PAYASO Y CIRUJANO AZUL
// ----------------------------------------------------------------------------
function generarGeometriaPez() {
    const v = [
        // 0: Nariz
         0.75,  0.00,  0.00,
        // 1..4: Anillo branquias (X = 0.45)
         0.45,  0.18,  0.00,
         0.45,  0.00,  0.12,
         0.45, -0.16,  0.00,
         0.45,  0.00, -0.12,
        // 5..8: Anillo vientre máximo (X = 0.05)
         0.05,  0.28,  0.00,
         0.05,  0.00,  0.18,
         0.05, -0.24,  0.00,
         0.05,  0.00, -0.18,
        // 9..12: Anillo tronco posterior (X = -0.35)
        -0.35,  0.16,  0.00,
        -0.35,  0.00,  0.09,
        -0.35, -0.13,  0.00,
        -0.35,  0.00, -0.09,
        // 13..16: Pedúnculo de cola (X = -0.65)
        -0.65,  0.07,  0.00,
        -0.65,  0.00,  0.03,
        -0.65, -0.06,  0.00,
        -0.65,  0.00, -0.03,
        // 17, 18: Aleta dorsal
        -0.05,  0.46,  0.00,
        -0.30,  0.35,  0.00,
        // 19, 20: Aletas pectorales
         0.18, -0.08,  0.32,
         0.18, -0.08, -0.32
    ];

    const n = [
         1.0,  0.0,  0.0,
         0.4,  0.9,  0.0,   0.4,  0.0,  0.9,   0.4, -0.9,  0.0,   0.4,  0.0, -0.9,
         0.0,  1.0,  0.0,   0.0,  0.0,  1.0,   0.0, -1.0,  0.0,   0.0,  0.0, -1.0,
        -0.4,  0.9,  0.0,  -0.4,  0.0,  0.9,  -0.4, -0.9,  0.0,  -0.4,  0.0, -0.9,
        -0.8,  0.5,  0.0,  -0.8,  0.0,  0.6,  -0.8, -0.5,  0.0,  -0.8,  0.0, -0.6,
         0.0,  1.0,  0.0,  -0.3,  0.9,  0.0,
         0.2, -0.3,  0.9,   0.2, -0.3, -0.9
    ];

    const uv = [
        1.0, 0.5,
        0.8, 0.9,  0.8, 0.5,  0.8, 0.1,  0.8, 0.5,
        0.5, 1.0,  0.5, 0.5,  0.5, 0.0,  0.5, 0.5,
        0.3, 0.85, 0.3, 0.5,  0.3, 0.15, 0.3, 0.5,
        0.1, 0.7,  0.1, 0.5,  0.1, 0.3,  0.1, 0.5,
        0.45, 0.98, 0.35, 0.95,
        0.65, 0.35, 0.65, 0.35
    ];

    const idx = [
        0, 1, 2,   0, 2, 3,   0, 3, 4,   0, 4, 1,
        1, 5, 6,   1, 6, 2,   2, 6, 7,   2, 7, 3,
        3, 7, 8,   3, 8, 4,   4, 8, 5,   4, 5, 1,
        5, 9, 10,  5, 10, 6,  6, 10, 11, 6, 11, 7,
        7, 11, 12, 7, 12, 8,  8, 12, 9,  8, 9, 5,
        9, 13, 14, 9, 14, 10, 10, 14, 15, 10, 15, 11,
        11, 15, 16, 11, 16, 12, 12, 16, 13, 12, 13, 9,
        5, 17, 18, 5, 18, 9,
        2, 19, 6,  4, 8, 20
    ];

    return crearMallaGPU(gl, v, n, uv, idx);
}

function generarGeometriaCola() {
    const v = [
         0.00,  0.00,  0.00,
        -0.22,  0.18,  0.01,
        -0.45,  0.28,  0.01,
        -0.34,  0.00,  0.00,
        -0.45, -0.28,  0.01,
        -0.22, -0.18,  0.01,
        -0.45,  0.28, -0.01,
        -0.45, -0.28, -0.01
    ];
    const n = [
        0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
        0, 0, -1,  0, 0, -1
    ];
    const uv = [
        0.25, 0.5, 0.15, 0.8, 0.00, 1.0, 0.12, 0.5, 0.00, 0.0, 0.15, 0.2,
        0.00, 1.0, 0.00, 0.0
    ];
    const idx = [
        0, 1, 3,   1, 2, 3,   0, 3, 5,   3, 4, 5,
        0, 3, 1,   1, 3, 6,   0, 5, 3,   3, 5, 7
    ];
    return crearMallaGPU(gl, v, n, uv, idx);
}

// ----------------------------------------------------------------------------
// 2. GEOMETRÍA DEL TIBURÓN (Cuerpo estilizado hidrodinámico con aleta dorsal triangular)
// ----------------------------------------------------------------------------
function generarGeometriaTiburon() {
    const v = [
        // 0: Hocico cónico afilado
         1.40, -0.05,  0.00,
        // 1..4: Cabeza y branquias (X = 0.90)
         0.90,  0.24,  0.00,
         0.90, -0.02,  0.26,
         0.90, -0.22,  0.00,
         0.90, -0.02, -0.26,
        // 5..8: Tronco medio (X = 0.20)
         0.20,  0.38,  0.00,
         0.20,  0.00,  0.34,
         0.20, -0.28,  0.00,
         0.20,  0.00, -0.34,
        // 9..12: Zona pre-caudal (X = -0.70)
        -0.70,  0.20,  0.00,
        -0.70,  0.00,  0.16,
        -0.70, -0.16,  0.00,
        -0.70,  0.00, -0.16,
        // 13..16: Pedúnculo de inserción (X = -1.30)
        -1.30,  0.08,  0.00,
        -1.30,  0.00,  0.05,
        -1.30, -0.07,  0.00,
        -1.30,  0.00, -0.05,

        // 17, 18: Aleta Dorsal icónica triangular erguida
         0.25,  0.88,  0.00, // Punta de aleta dorsal
        -0.20,  0.38,  0.00, // Fin base dorsal

        // 19, 20: Aletas pectorales largas inclinadas hacia atrás
         0.40, -0.18,  0.85, // Punta pectoral derecha
         0.40, -0.18, -0.85  // Punta pectoral izquierda
    ];

    const n = [
         1.0, -0.1,  0.0,
         0.3,  0.9,  0.0,   0.3,  0.0,  0.9,   0.3, -0.9,  0.0,   0.3,  0.0, -0.9,
         0.0,  1.0,  0.0,   0.0,  0.0,  1.0,   0.0, -1.0,  0.0,   0.0,  0.0, -1.0,
        -0.4,  0.9,  0.0,  -0.4,  0.0,  0.9,  -0.4, -0.9,  0.0,  -0.4,  0.0, -0.9,
        -0.8,  0.5,  0.0,  -0.8,  0.0,  0.6,  -0.8, -0.5,  0.0,  -0.8,  0.0, -0.6,
         0.1,  1.0,  0.0,  -0.2,  0.8,  0.0,
         0.1, -0.4,  0.9,   0.1, -0.4, -0.9
    ];

    const uv = [
        1.0, 0.5,
        0.8, 0.85, 0.8, 0.5, 0.8, 0.15, 0.8, 0.5,
        0.5, 1.0,  0.5, 0.5, 0.5, 0.0,  0.5, 0.5,
        0.3, 0.85, 0.3, 0.5, 0.3, 0.15, 0.3, 0.5,
        0.1, 0.7,  0.1, 0.5, 0.1, 0.3,  0.1, 0.5,
        0.4, 0.98, 0.3, 0.85,
        0.6, 0.3,  0.6, 0.3
    ];

    const idx = [
        0, 1, 2,   0, 2, 3,   0, 3, 4,   0, 4, 1,
        1, 5, 6,   1, 6, 2,   2, 6, 7,   2, 7, 3,
        3, 7, 8,   3, 8, 4,   4, 8, 5,   4, 5, 1,
        5, 9, 10,  5, 10, 6,  6, 10, 11, 6, 11, 7,
        7, 11, 12, 7, 12, 8,  8, 12, 9,  8, 9, 5,
        9, 13, 14, 9, 14, 10, 10, 14, 15, 10, 15, 11,
        11, 15, 16, 11, 16, 12, 12, 16, 13, 12, 13, 9,
        // Aleta dorsal
        5, 17, 18, 5, 18, 9,
        // Pectorales
        2, 19, 6,  4, 8, 20
    ];

    return crearMallaGPU(gl, v, n, uv, idx);
}

function generarGeometriaColaTiburon() {
    // Cola heterocerca con lóbulo superior largo y lóbulo inferior más corto
    const v = [
         0.00,  0.00,  0.00,
        -0.35,  0.22,  0.01,
        -0.80,  0.62,  0.01, // Lóbulo superior estilizado
        -0.45,  0.05,  0.00,
        -0.55, -0.35,  0.01, // Lóbulo inferior
        -0.25, -0.15,  0.01,
        -0.80,  0.62, -0.01,
        -0.55, -0.35, -0.01
    ];
    const n = [
        0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
        0, 0, -1,  0, 0, -1
    ];
    const uv = [
        0.3, 0.5, 0.2, 0.8, 0.0, 1.0, 0.1, 0.5, 0.0, 0.0, 0.2, 0.2,
        0.0, 1.0, 0.0, 0.0
    ];
    const idx = [
        0, 1, 3,   1, 2, 3,   0, 3, 5,   3, 4, 5,
        0, 3, 1,   1, 3, 6,   0, 5, 3,   3, 5, 7
    ];
    return crearMallaGPU(gl, v, n, uv, idx);
}

// ----------------------------------------------------------------------------
// 3. GEOMETRÍA DE LA MEDUSA (Campana semiesférica y tentáculos bioluminiscentes dinámicos)
// ----------------------------------------------------------------------------
function generarGeometriaCampanaMedusa() {
    const v = [], n = [], uv = [], idx = [];
    const bands = 16, segs = 22;
    const radio = 0.65;

    // Cúpula / Campana de hongo (Apice en +Y, apertura en -Y)
    for (let b = 0; b <= bands; b++) {
        const theta = (b / bands) * (Math.PI * 0.58);
        const y = Math.cos(theta) * radio * 0.75;
        const rSub = Math.sin(theta) * radio;

        for (let s = 0; s <= segs; s++) {
            const phi = (s / segs) * Math.PI * 2;
            const x = Math.cos(phi) * rSub;
            const z = Math.sin(phi) * rSub;

            v.push(x, y, z);
            const nNorm = normVec3([x, y * 0.8, z]);
            n.push(nNorm[0], nNorm[1], nNorm[2]);
            uv.push(s / segs, b / bands);
        }
    }

    for (let b = 0; b < bands; b++) {
        for (let s = 0; s < segs; s++) {
            const i1 = b * (segs + 1) + s;
            const i2 = i1 + 1;
            const i3 = (b + 1) * (segs + 1) + s;
            const i4 = i3 + 1;
            idx.push(i1, i3, i2);
            idx.push(i2, i3, i4);
        }
    }

    // Brazos orales internos centrales
    const oralStart = v.length / 3;
    const numBrazos = 4;
    for (let br = 0; br < numBrazos; br++) {
        const a = (br / numBrazos) * Math.PI * 2;
        const rBr = 0.12;
        const bx = Math.cos(a) * rBr;
        const bz = Math.sin(a) * rBr;
        for (let k = 0; k <= 4; k++) {
            const by = -0.05 - k * 0.08;
            v.push(bx, by, bz);
            n.push(Math.cos(a), 0, Math.sin(a));
            uv.push(br / numBrazos, k / 4);

            v.push(bx + 0.03, by, bz + 0.03);
            n.push(Math.cos(a), 0, Math.sin(a));
            uv.push(br / numBrazos, k / 4);
        }
        for (let k = 0; k < 4; k++) {
            const p = oralStart + br * 10 + k * 2;
            idx.push(p, p + 2, p + 1);
            idx.push(p + 1, p + 2, p + 3);
        }
    }

    return crearMallaGPU(gl, v, n, uv, idx);
}

// Generador de Tentáculos Dinámicos con VBO dinámico para ondulación en tiempo real
function generarGeometriaTentaculosMedusaDinamica(glCtx) {
    const numTent = 10;
    const nodosPorTent = 8;
    const totalVertices = numTent * nodosPorTent * 2;

    const v = new Float32Array(totalVertices * 3);
    const n = new Float32Array(totalVertices * 3);
    const uv = new Float32Array(totalVertices * 2);
    const idx = [];

    let vIdx = 0;
    for (let t = 0; t < numTent; t++) {
        const a = (t / numTent) * Math.PI * 2;
        const rT = 0.38;
        const tx = Math.cos(a) * rT;
        const tz = Math.sin(a) * rT;

        const startV = t * nodosPorTent * 2;
        for (let k = 0; k < nodosPorTent; k++) {
            const frac = k / (nodosPorTent - 1);
            const ty = -0.15 - frac * 1.55;

            v[vIdx * 3]     = tx - 0.02;
            v[vIdx * 3 + 1] = ty;
            v[vIdx * 3 + 2] = tz;
            n[vIdx * 3]     = Math.cos(a);
            n[vIdx * 3 + 1] = 0;
            n[vIdx * 3 + 2] = Math.sin(a);
            uv[vIdx * 2]     = t / numTent;
            uv[vIdx * 2 + 1] = frac;
            vIdx++;

            v[vIdx * 3]     = tx + 0.02;
            v[vIdx * 3 + 1] = ty;
            v[vIdx * 3 + 2] = tz;
            n[vIdx * 3]     = Math.cos(a);
            n[vIdx * 3 + 1] = 0;
            n[vIdx * 3 + 2] = Math.sin(a);
            uv[vIdx * 2]     = t / numTent;
            uv[vIdx * 2 + 1] = frac;
            vIdx++;
        }

        for (let k = 0; k < nodosPorTent - 1; k++) {
            const p = startV + k * 2;
            idx.push(p, p + 2, p + 1);
            idx.push(p + 1, p + 2, p + 3);
            idx.push(p, p + 1, p + 2);
            idx.push(p + 1, p + 3, p + 2);
        }
    }

    const vao = glCtx.createVertexArray();
    glCtx.bindVertexArray(vao);

    const posBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, posBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, v, glCtx.DYNAMIC_DRAW);
    glCtx.enableVertexAttribArray(0);
    glCtx.vertexAttribPointer(0, 3, glCtx.FLOAT, false, 0, 0);

    const normBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, normBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, n, glCtx.DYNAMIC_DRAW);
    glCtx.enableVertexAttribArray(1);
    glCtx.vertexAttribPointer(1, 3, glCtx.FLOAT, false, 0, 0);

    const uvBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, uvBuffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, uv, glCtx.STATIC_DRAW);
    glCtx.enableVertexAttribArray(2);
    glCtx.vertexAttribPointer(2, 2, glCtx.FLOAT, false, 0, 0);

    const idxBuffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, idxBuffer);
    glCtx.bufferData(glCtx.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), glCtx.STATIC_DRAW);

    glCtx.bindVertexArray(null);

    return {
        vao: vao,
        posBuffer: posBuffer,
        normBuffer: normBuffer,
        vArray: v,
        nArray: n,
        numElements: idx.length,
        numTent: numTent,
        nodosPorTent: nodosPorTent
    };
}

function actualizarTentaculosMedusaDinamica(glCtx, meshTent, pulsePhase, velMedusa) {
    const v = meshTent.vArray;
    const n = meshTent.nArray;
    const numTent = meshTent.numTent;
    const nodos = meshTent.nodosPorTent;

    let vIdx = 0;
    for (let tr = 0; tr < numTent; tr++) {
        const a = (tr / numTent) * Math.PI * 2;
        const contraction = (Math.sin(pulsePhase) + 1.0) * 0.5;
        const rT = 0.38 * (1.0 - contraction * 0.28);
        const tx = Math.cos(a) * rT;
        const tz = Math.sin(a) * rT;
        const ancho = 0.022;

        for (let k = 0; k < nodos; k++) {
            const frac = k / (nodos - 1);
            const lag = frac * 4.4;

            const oscilacion1 = Math.sin(pulsePhase * 1.5 - lag + tr * 0.9) * (0.03 + frac * 0.16);
            const oscilacion2 = Math.cos(pulsePhase * 1.2 - lag + tr * 1.3) * (0.03 + frac * 0.14);

            const speedHoriz = Math.hypot(velMedusa[0], velMedusa[2]);
            const dragX = -speedHoriz * frac * 0.55;
            const dragY = -velMedusa[1] * frac * 0.35;

            const longitud = 1.60 * (1.0 + (1.0 - contraction) * 0.18);
            const ty = -0.10 - frac * longitud + dragY;

            const px = tx + oscilacion1 + dragX;
            const pz = tz + oscilacion2;

            v[vIdx * 3]     = px - ancho * (1.0 - frac * 0.5);
            v[vIdx * 3 + 1] = ty;
            v[vIdx * 3 + 2] = pz;
            n[vIdx * 3]     = Math.cos(a);
            n[vIdx * 3 + 1] = 0.1;
            n[vIdx * 3 + 2] = Math.sin(a);
            vIdx++;

            v[vIdx * 3]     = px + ancho * (1.0 - frac * 0.5);
            v[vIdx * 3 + 1] = ty;
            v[vIdx * 3 + 2] = pz;
            n[vIdx * 3]     = Math.cos(a);
            n[vIdx * 3 + 1] = 0.1;
            n[vIdx * 3 + 2] = Math.sin(a);
            vIdx++;
        }
    }

    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, meshTent.posBuffer);
    glCtx.bufferSubData(glCtx.ARRAY_BUFFER, 0, v);
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, meshTent.normBuffer);
    glCtx.bufferSubData(glCtx.ARRAY_BUFFER, 0, n);
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, null);
}

// ----------------------------------------------------------------------------
// 4. GEOMETRÍA DE LA TORTUGA MARINA (Caparazón carapacho, cabeza y aletas)
// ----------------------------------------------------------------------------
function generarGeometriaTortuga() {
    const v = [
        // Caparazón abovedado dorsal (0..8)
         0.00,  0.28,  0.00, // 0: Centro ápice del caparazón
         0.70,  0.08,  0.00, // 1: Borde anterior (cuello)
         0.45,  0.10,  0.42, // 2: Delantero derecho
        -0.20,  0.12,  0.50, // 3: Lateral derecho
        -0.70,  0.06,  0.30, // 4: Trasero derecho
        -0.85,  0.02,  0.00, // 5: Punta posterior caudal
        -0.70,  0.06, -0.30, // 6: Trasero izquierdo
        -0.20,  0.12, -0.50, // 7: Lateral izquierdo
         0.45,  0.10, -0.42, // 8: Delantero izquierdo

        // Plastrón ventral plano inferior (9..17)
         0.00, -0.12,  0.00, // 9: Centro plastrón
         0.65, -0.05,  0.00, // 10
         0.40, -0.06,  0.38, // 11
        -0.18, -0.06,  0.44, // 12
        -0.65, -0.05,  0.26, // 13
        -0.80, -0.05,  0.00, // 14
        -0.65, -0.05, -0.26, // 15
        -0.18, -0.06, -0.44, // 16
         0.40, -0.06, -0.38, // 17

        // Cabeza y cuello (18..21)
         0.95,  0.04,  0.00, // 18: Cuello
         1.25,  0.06,  0.00, // 19: Hocico
         1.10,  0.14,  0.12, // 20: Ojo der
         1.10,  0.14, -0.12  // 21: Ojo izq
    ];

    const n = [];
    for (let i = 0; i < v.length; i += 3) {
        if (i < 9 * 3) n.push(v[i] * 0.5, 0.9, v[i + 2] * 0.5);
        else if (i < 18 * 3) n.push(v[i] * 0.3, -0.9, v[i + 2] * 0.3);
        else n.push(0.8, 0.2, 0.0);
    }

    const uv = [];
    for (let i = 0; i < v.length; i += 3) {
        uv.push(0.5 + v[i] * 0.4, 0.5 + v[i + 2] * 0.4);
    }

    const idx = [
        // Caparazón dorsal en abanico
        0, 1, 2,   0, 2, 3,   0, 3, 4,   0, 4, 5,
        0, 5, 6,   0, 6, 7,   0, 7, 8,   0, 8, 1,
        // Plastrón ventral
        9, 11, 10, 9, 12, 11, 9, 13, 12, 9, 14, 13,
        9, 15, 14, 9, 16, 15, 9, 17, 16, 9, 10, 17,
        // Paredes laterales caparazón a plastrón
        1, 10, 11,  1, 11, 2,
        2, 11, 12,  2, 12, 3,
        3, 12, 13,  3, 13, 4,
        4, 13, 14,  4, 14, 5,
        5, 14, 15,  5, 15, 6,
        6, 15, 16,  6, 16, 7,
        7, 16, 17,  7, 17, 8,
        8, 17, 10,  8, 10, 1,
        // Cabeza
        1, 18, 19, 18, 20, 19, 18, 19, 21
    ];

    return crearMallaGPU(gl, v, n, uv, idx);
}

// Aleta anterior de la Tortuga (ala que bate)
function generarGeometriaAletaTortuga() {
    const v = [
         0.00,  0.00,  0.00, // Base articulación
         0.25,  0.02,  0.55,
         0.10, -0.01,  1.10, // Punta extrema del ala
        -0.12, -0.02,  0.85,
        -0.20,  0.00,  0.35,
        // Reverso
         0.10, -0.02,  1.10
    ];
    const n = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0];
    const uv = [0.2, 0.5, 0.5, 0.8, 1.0, 1.0, 0.8, 0.2, 0.3, 0.1, 1.0, 1.0];
    const idx = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 2, 1, 0, 3, 2, 0, 4, 3];
    return crearMallaGPU(gl, v, n, uv, idx);
}

// ----------------------------------------------------------------------------
// 5. HÁBITAT DEL PEZ PAYASO (Anémona marina con tentáculos curvos y Corales)
// ----------------------------------------------------------------------------
function generarGeometriaAnemona() {
    const v = [], n = [], uv = [], idx = [];
    const numTent = 24;

    // Base carnosa central
    v.push(0, 0.1, 0); n.push(0, 1, 0); uv.push(0.5, 0.5); // 0
    for (let i = 0; i < numTent; i++) {
        const a = (i / numTent) * Math.PI * 2;
        v.push(Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45);
        n.push(Math.cos(a), 0.3, Math.sin(a));
        uv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    }
    for (let i = 1; i <= numTent; i++) {
        const next = i === numTent ? 1 : i + 1;
        idx.push(0, i, next);
    }

    // Tentáculos curvos que se abren como pétalos marinos
    for (let t = 0; t < numTent; t++) {
        const a = (t / numTent) * Math.PI * 2;
        const rBase = 0.25 + (t % 3) * 0.12;
        const startIdx = v.length / 3;

        // 4 nodos por tentáculo
        for (let k = 0; k <= 4; k++) {
            const h = k * 0.22;
            const rCurva = rBase + Math.sin(k * 0.4) * 0.25;
            const x = Math.cos(a) * rCurva;
            const z = Math.sin(a) * rCurva;
            const grosor = (4 - k) * 0.028 + 0.015;

            v.push(x - grosor, h, z);
            n.push(Math.cos(a), 0.5, Math.sin(a));
            uv.push(t / numTent, k / 4);

            v.push(x + grosor, h, z);
            n.push(Math.cos(a), 0.5, Math.sin(a));
            uv.push(t / numTent, k / 4);
        }

        for (let k = 0; k < 4; k++) {
            const p = startIdx + k * 2;
            idx.push(p, p + 1, p + 2);
            idx.push(p + 1, p + 3, p + 2);
        }
    }

    return crearMallaGPU(gl, v, n, uv, idx);
}

// ----------------------------------------------------------------------------
// 6. SUELO DE ARENA AMPLIADO, ALGAS, ESFERAS Y TANQUE
// ----------------------------------------------------------------------------
function generarGeometriaSuelo(ancho, largo, resX = 36, resZ = 36) {
    const v = [], n = [], uv = [], idx = [];
    const hx = ancho / 2, hz = largo / 2;

    for (let iz = 0; iz <= resZ; iz++) {
        const z = -hz + (iz / resZ) * largo;
        for (let ix = 0; ix <= resX; ix++) {
            const x = -hx + (ix / resX) * ancho;
            const y = Math.sin(x * 1.2) * 0.18 + Math.cos(z * 1.0) * 0.12 + Math.sin(x * 2.8 + z * 2.2) * 0.04;

            v.push(x, y, z);
            const ny = 1.0;
            const nx = -0.18 * 1.2 * Math.cos(x * 1.2);
            const nz = 0.12 * 1.0 * Math.sin(z * 1.0);
            const nNorm = normVec3([nx, ny, nz]);
            n.push(nNorm[0], nNorm[1], nNorm[2]);

            uv.push((ix / resX) * 7.0, (iz / resZ) * 6.0);
        }
    }

    for (let iz = 0; iz < resZ; iz++) {
        for (let ix = 0; ix < resX; ix++) {
            const row1 = iz * (resX + 1);
            const row2 = (iz + 1) * (resX + 1);
            idx.push(row1 + ix, row2 + ix, row1 + ix + 1);
            idx.push(row1 + ix + 1, row2 + ix, row2 + ix + 1);
        }
    }

    return crearMallaGPU(gl, v, n, uv, idx);
}

function generarGeometriaAlga(altura = 2.6, segmentos = 10) {
    const v = [], n = [], uv = [], idx = [];
    const anchoHoja = 0.18;

    for (let i = 0; i <= segmentos; i++) {
        const y = (i / segmentos) * altura;
        const factorAncho = Math.sin((i / segmentos) * Math.PI) * anchoHoja + 0.04;
        
        v.push(-factorAncho, y, 0.0);
        n.push(0.0, 0.0, 1.0);
        uv.push(0.0, i / segmentos);

        v.push(factorAncho, y, 0.0);
        n.push(0.0, 0.0, 1.0);
        uv.push(1.0, i / segmentos);
    }

    for (let i = 0; i < segmentos; i++) {
        const b = i * 2;
        idx.push(b, b + 1, b + 2);
        idx.push(b + 1, b + 3, b + 2);
    }

    return crearMallaGPU(gl, v, n, uv, idx);
}

function generarGeometriaEsfera(radio = 1.0, latBands = 14, lonBands = 14) {
    const v = [], n = [], uv = [], idx = [];

    for (let lat = 0; lat <= latBands; lat++) {
        const theta = (lat * Math.PI) / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= lonBands; lon++) {
            const phi = (lon * 2 * Math.PI) / lonBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            v.push(radio * x, radio * y, radio * z);
            n.push(x, y, z);
            uv.push(lon / lonBands, lat / latBands);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < lonBands; lon++) {
            const first = lat * (lonBands + 1) + lon;
            const second = first + lonBands + 1;
            idx.push(first, second, first + 1);
            idx.push(second, second + 1, first + 1);
        }
    }

    return crearMallaGPU(gl, v, n, uv, idx);
}

function generarLineasTanque(w, h, d) {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const lines = [
        -hw, -hh, -hd,   hw, -hh, -hd,
         hw, -hh, -hd,   hw, -hh,  hd,
         hw, -hh,  hd,  -hw, -hh,  hd,
        -hw, -hh,  hd,  -hw, -hh, -hd,
        -hw,  hh, -hd,   hw,  hh, -hd,
         hw,  hh, -hd,   hw,  hh,  hd,
         hw,  hh,  hd,  -hw,  hh,  hd,
        -hw,  hh,  hd,  -hw,  hh, -hd,
        -hw, -hh, -hd,  -hw,  hh, -hd,
         hw, -hh, -hd,   hw,  hh, -hd,
         hw, -hh,  hd,   hw,  hh,  hd,
        -hw, -hh,  hd,  -hw,  hh,  hd
    ];

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    return { vao: vao, count: lines.length / 3 };
}

// DIMENSIONES DEL GRAN ACUARIO OCEÁNICO (Ampliadas para máximo realismo)
const TANK_WIDTH = 14.0;
const TANK_HEIGHT = 7.0;
const TANK_DEPTH = 9.0;

// Instanciar Mallas GPU
const meshPez = generarGeometriaPez();
const meshCola = generarGeometriaCola();
const meshTiburon = generarGeometriaTiburon();
const meshColaTiburon = generarGeometriaColaTiburon();
const meshCampanaMedusa = generarGeometriaCampanaMedusa();
const meshTentaculosMedusa = generarGeometriaTentaculosMedusaDinamica(gl);
const meshMedusa = meshCampanaMedusa; // Compatibilidad
const meshTortuga = generarGeometriaTortuga();
const meshAletaTortuga = generarGeometriaAletaTortuga();
const meshAnemona = generarGeometriaAnemona();
const meshSuelo = generarGeometriaSuelo(TANK_WIDTH, TANK_DEPTH, 36, 36);
const meshAlga = generarGeometriaAlga(2.8, 12);
const meshBurbuja = generarGeometriaEsfera(0.10, 12, 12);
const meshRoca = generarGeometriaEsfera(0.75, 10, 10);
const meshTanque = generarLineasTanque(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH);
