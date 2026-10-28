// ============================================================================
// SCRIPT 3 - PASO 3, 5 Y 6: BIBLIOTECA MATEMÁTICA MANUAL (Vectores y Matrices 4x4)
// Mini Motor Gráfico - Acuario Marino 3D
// Implementado sin librerías externas (sin glMatrix ni Three.js)
// ============================================================================

"use strict";

// ----------------------------------------------------------------------------
// OPERACIONES VECTORIALES (3D)
// ----------------------------------------------------------------------------
function subVec3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function addVec3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function scaleVec3(v, s) { return [v[0] * s, v[1] * s, v[2] * s]; }
function lengthVec3(v) { return Math.hypot(v[0], v[1], v[2]); }
function normVec3(v) {
    const l = lengthVec3(v);
    return l > 0.00001 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0];
}
function crossVec3(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}
function dotVec3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

// ----------------------------------------------------------------------------
// MATRICES 4x4 (Almacenamiento por columnas compatible con WebGL)
// ----------------------------------------------------------------------------
function matrizIdentidad4() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function matrizTraslacion4(tx, ty, tz) {
    return new Float32Array([
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz, 1
    ]);
}

function matrizEscala4(sx, sy, sz) {
    return new Float32Array([
        sx, 0,  0,  0,
        0,  sy, 0,  0,
        0,  0,  sz, 0,
        0,  0,  0,  1
    ]);
}

function matrizRotacionX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
        1, 0,  0, 0,
        0, c,  s, 0,
        0, -s, c, 0,
        0, 0,  0, 1
    ]);
}

function matrizRotacionY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
         c, 0, -s, 0,
         0, 1,  0, 0,
         s, 0,  c, 0,
         0, 0,  0, 1
    ]);
}

function matrizRotacionZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1
    ]);
}

function multiplicarMat4(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
        for (let f = 0; f < 4; f++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[k * 4 + f] * b[c * 4 + k];
            }
            out[c * 4 + f] = sum;
        }
    }
    return out;
}

// Matriz Normal 3x3 (inversa y transpuesta de la submatriz 3x3 del modelo para iluminar correctamente)
function matrizNormal3(m4) {
    const a00 = m4[0], a01 = m4[1], a02 = m4[2];
    const a10 = m4[4], a11 = m4[5], a12 = m4[6];
    const a20 = m4[8], a21 = m4[9], a22 = m4[10];

    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) return new Float32Array([1,0,0, 0,1,0, 0,0,1]);
    det = 1.0 / det;

    return new Float32Array([
        b01 * det,
        (-a22 * a01 + a02 * a21) * det,
        (a12 * a01 - a02 * a11) * det,
        b11 * det,
        (a22 * a00 - a02 * a20) * det,
        (-a12 * a00 + a02 * a10) * det,
        b21 * det,
        (-a21 * a00 + a01 * a20) * det,
        (a11 * a00 - a01 * a10) * det
    ]);
}

// Matriz LookAt de la Cámara (Paso 6: Construye los ejes locales X, Y, Z del observador)
function matrizLookAt(eye, target, up) {
    const zAxis = normVec3(subVec3(eye, target));
    const xAxis = normVec3(crossVec3(up, zAxis));
    const yAxis = crossVec3(zAxis, xAxis);

    return new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]),
        -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]),
        -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]),
        1
    ]);
}

// Matriz de Proyección Perspectiva (Paso 6: FOV, Relación de Aspecto y Planos Near/Far)
function matrizPerspectiva(fovRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1.0 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
    ]);
}

// Matriz de orientación que alinea el eje +X de un objeto hacia un vector de dirección 3D
function matrizOrientacionHacia(dir, upDefault = [0, 1, 0]) {
    const forward = normVec3(dir); // Eje X local del pez apunta hacia forward
    let up = upDefault;
    if (Math.abs(dotVec3(forward, up)) > 0.95) {
        up = [0, 0, 1];
    }
    const right = normVec3(crossVec3(up, forward)); // Eje Z local
    const trueUp = crossVec3(forward, right);       // Eje Y local

    return new Float32Array([
        forward[0], forward[1], forward[2], 0,
        trueUp[0],  trueUp[1],  trueUp[2],  0,
        right[0],   right[1],   right[2],   0,
        0, 0, 0, 1
    ]);
}
