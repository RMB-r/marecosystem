// ============================================================================
// ECOSISTEMA ACUÁTICO 3D - MINI MOTOR GRÁFICO DESDE CERO
// Implementación completa basada en los Pasos 0 al 15 (WebGL 2.0 + GLSL ES 3.00)
// ============================================================================

"use strict";

// ----------------------------------------------------------------------------
// PASO 0 Y 1: INICIALIZACIÓN DE WEBGL2 Y PREPARACIÓN DEL LIENZO
// ----------------------------------------------------------------------------
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });

if (!gl) {
    alert("Error: WebGL 2.0 no está disponible en este navegador o GPU.");
    throw new Error("WebGL 2.0 no soportado.");
}

// Configuración inicial del viewport y color de fondo abisal marino
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.015, 0.08, 0.20, 1.0); // Azul marino profundo

// PASO 5: Activar prueba de profundidad (Depth Buffer) y mezcla alfa para transparencias
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// ----------------------------------------------------------------------------
// PASO 2, 6, 8, 9, 12: SHADERS EN GLSL ES 3.00 (MVP + Iluminación + Niebla + Textura)
// ----------------------------------------------------------------------------

// Vertex Shader Principal
const vertexShaderSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix; // Inversa traspuesta de la matriz de modelo

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}`;

// Fragment Shader Principal
const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;

// Fuentes de iluminación (Paso 8 y 12)
uniform vec3 uLightPos;          // Posición de la fuente puntual (Lámpara / Superficie)
uniform vec3 uLightColor;        // Color de la luz puntual
uniform vec3 uAmbientColor;      // Luz ambiente azul marina
uniform vec3 uCameraPos;         // Posición del observador para niebla

// Material y Textura (Paso 9 y 10)
uniform sampler2D uTexture;
uniform vec4 uBaseColor;
uniform int uUseTexture;
uniform float uTime;             // Factor temporal para cáusticas subacuáticas

out vec4 outColor;

void main() {
    vec3 N = normalize(vNormal);
    
    // Vector hacia la luz puntual y atenuación por distancia
    vec3 L = uLightPos - vWorldPos;
    float dist = length(L);
    L = normalize(L);
    float atten = 1.0 / (1.0 + 0.08 * dist + 0.015 * dist * dist);

    // Iluminación difusa (Lambert - Paso 8)
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * uLightColor * atten;

    // Efecto sutil de cáusticas de agua animadas en superficies horizontales
    float caustics = 0.0;
    if (N.y > 0.3) {
        float wave1 = sin(vWorldPos.x * 3.5 + uTime * 2.2);
        float wave2 = cos(vWorldPos.z * 3.5 + uTime * 2.0);
        caustics = max(0.0, wave1 * wave2) * 0.25 * atten;
    }

    vec3 finalLight = uAmbientColor + diffuse + vec3(caustics * 0.4, caustics * 0.8, caustics);

    // Muestreo de textura o color base
    vec4 objColor = uBaseColor;
    if (uUseTexture == 1) {
        objColor = texture(uTexture, vTexCoord) * uBaseColor;
    }

    vec3 rgb = objColor.rgb * finalLight;

    // Niebla de profundidad subacuática (Underwater Fog)
    float fogDistance = length(uCameraPos - vWorldPos);
    float fogFactor = clamp((fogDistance - 3.0) / 16.0, 0.0, 0.85);
    vec3 fogColor = vec3(0.015, 0.08, 0.20); // Azul abisal
    rgb = mix(rgb, fogColor, fogFactor);

    outColor = vec4(rgb, objColor.a);
}`;

// Shaders para Líneas del Tanque de Cristal (Paso 14)
const lineVertexSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}`;

const lineFragmentSource = `#version 300 es
precision highp float;
uniform vec4 uLineColor;
out vec4 outColor;
void main() {
    outColor = uLineColor;
}`;

// ----------------------------------------------------------------------------
// FUNCIÓN COMPILADORA DE PROGRAMAS WEBGL
// ----------------------------------------------------------------------------
function compilarPrograma(gl, vSource, fSource) {
    function crearShader(gl, tipo, fuente) {
        const shader = gl.createShader(tipo);
        gl.shaderSource(shader, fuente);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const err = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Fallo al compilar shader:\n" + err);
        }
        return shader;
    }
    const vs = crearShader(gl, gl.VERTEX_SHADER, vSource);
    const fs = crearShader(gl, gl.FRAGMENT_SHADER, fSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Fallo al enlazar programa:\n" + gl.getProgramInfoLog(program));
    }
    return program;
}

const mainProgram = compilarPrograma(gl, vertexShaderSource, fragmentShaderSource);
const lineProgram = compilarPrograma(gl, lineVertexSource, lineFragmentSource);

// Ubicaciones de uniforms del programa principal
const mainLocs = {
    uModelMatrix: gl.getUniformLocation(mainProgram, "uModelMatrix"),
    uViewMatrix: gl.getUniformLocation(mainProgram, "uViewMatrix"),
    uProjectionMatrix: gl.getUniformLocation(mainProgram, "uProjectionMatrix"),
    uNormalMatrix: gl.getUniformLocation(mainProgram, "uNormalMatrix"),
    uLightPos: gl.getUniformLocation(mainProgram, "uLightPos"),
    uLightColor: gl.getUniformLocation(mainProgram, "uLightColor"),
    uAmbientColor: gl.getUniformLocation(mainProgram, "uAmbientColor"),
    uCameraPos: gl.getUniformLocation(mainProgram, "uCameraPos"),
    uTexture: gl.getUniformLocation(mainProgram, "uTexture"),
    uBaseColor: gl.getUniformLocation(mainProgram, "uBaseColor"),
    uUseTexture: gl.getUniformLocation(mainProgram, "uUseTexture"),
    uTime: gl.getUniformLocation(mainProgram, "uTime")
};

// Ubicaciones de uniforms del programa de líneas
const lineLocs = {
    uModelMatrix: gl.getUniformLocation(lineProgram, "uModelMatrix"),
    uViewMatrix: gl.getUniformLocation(lineProgram, "uViewMatrix"),
    uProjectionMatrix: gl.getUniformLocation(lineProgram, "uProjectionMatrix"),
    uLineColor: gl.getUniformLocation(lineProgram, "uLineColor")
};

// ----------------------------------------------------------------------------
// PASO 3, 5 Y 6: BIBLIOTECA MATEMÁTICA MANUAL (Vectores y Matrices 4x4)
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

// Matrices 4x4 (almacenamiento por columnas compatible con WebGL)
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

// Matriz Normal 3x3 (inversa y transpuesta de la submatriz 3x3 del modelo)
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

// Matriz LookAt de la Cámara (Paso 6)
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

// Matriz de Proyección Perspectiva (Paso 6)
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

// ----------------------------------------------------------------------------
// PASO 7: GENERACIÓN PROCEDURAL DE GEOMETRÍAS (Pez, Cola, Arena, Burbujas, Tanque)
// ----------------------------------------------------------------------------

function crearMallaGPU(gl, vertices, normales, uvs, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Buffer de Posiciones
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Buffer de Normales (Paso 8)
    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normales), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    // Buffer de UVs (Paso 9)
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    // Buffer de Índices (Paso 5)
    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return {
        vao: vao,
        numElements: indices.length
    };
}

// 1. Geometría 3D del Pez (Cuerpo aerodinámico ahusado)
function generarGeometriaPez() {
    // Vértices del cuerpo: nariz frontal en +X, cintura central y cola en -X
    const v = [
        // 0: Nariz
         0.70,  0.00,  0.00,
        // 1..4: Sección media (Lomo, Vientre, Costado Der, Costado Izq)
         0.00,  0.22,  0.00,
         0.00, -0.20,  0.00,
         0.00,  0.00,  0.13,
         0.00,  0.00, -0.13,
        // 5..8: Sección posterior (previa a la aleta caudal)
        -0.55,  0.08,  0.00,
        -0.55, -0.08,  0.00,
        -0.55,  0.00,  0.04,
        -0.55,  0.00, -0.04,
        // 9: Aleta dorsal fija
        -0.10,  0.38,  0.00
    ];

    // Normales aproximadas por vértice
    const n = [
         1.0,  0.0,  0.0, // 0
         0.0,  1.0,  0.0, // 1
         0.0, -1.0,  0.0, // 2
         0.0,  0.0,  1.0, // 3
         0.0,  0.0, -1.0, // 4
        -0.5,  0.7,  0.0, // 5
        -0.5, -0.7,  0.0, // 6
        -0.5,  0.0,  0.8, // 7
        -0.5,  0.0, -0.8, // 8
         0.0,  1.0,  0.0  // 9
    ];

    // Coordenadas UV para mapear texturas con franjas
    const uv = [
        1.0, 0.5,  // 0
        0.5, 1.0,  // 1
        0.5, 0.0,  // 2
        0.5, 0.5,  // 3
        0.5, 0.5,  // 4
        0.1, 0.8,  // 5
        0.1, 0.2,  // 6
        0.1, 0.5,  // 7
        0.1, 0.5,  // 8
        0.4, 0.95  // 9
    ];

    // Índices formando los triángulos del sólido 3D
    const idx = [
        // Cono frontal (cabeza a sección media)
        0, 1, 3,   0, 3, 2,   0, 2, 4,   0, 4, 1,
        // Tronco medio (sección media a posterior)
        1, 5, 3,   3, 5, 7,
        3, 7, 2,   2, 7, 6,
        2, 6, 4,   4, 6, 8,
        4, 8, 1,   1, 8, 5,
        // Aleta dorsal unida al lomo
        1, 9, 5
    ];

    return crearMallaGPU(gl, v, n, uv, idx);
}

// 2. Geometría de la Aleta Caudal (Cola articulada para Jerarquía - Paso 11)
function generarGeometriaCola() {
    // Aleta tipo abanico en el plano XY partiendo desde el origen local hacia -X
    const v = [
         0.00,  0.00,  0.00, // 0: Base de articulación
        -0.35,  0.22,  0.01, // 1: Punta superior
        -0.45,  0.00,  0.00, // 2: Hendidura central de la cola
        -0.35, -0.22,  0.01, // 3: Punta inferior
        -0.35,  0.22, -0.01, // 4: Punta superior reverso
        -0.35, -0.22, -0.01  // 5: Punta inferior reverso
    ];
    const n = [
        0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
        0, 0, -1,  0, 0, -1
    ];
    const uv = [
        0.2, 0.5,  0.0, 1.0,  0.0, 0.5,  0.0, 0.0,
        0.0, 1.0,  0.0, 0.0
    ];
    const idx = [
        0, 1, 2,   0, 2, 3, // Cara positiva
        0, 2, 4,   0, 5, 2  // Cara negativa
    ];
    return crearMallaGPU(gl, v, n, uv, idx);
}

// 3. Geometría del Fondo Marino (Suelo de arena con ondulaciones)
function generarGeometriaSuelo(ancho, largo, resX = 24, resZ = 24) {
    const v = [], n = [], uv = [], idx = [];
    const hx = ancho / 2, hz = largo / 2;

    for (let iz = 0; iz <= resZ; iz++) {
        const z = -hz + (iz / resZ) * largo;
        for (let ix = 0; ix <= resX; ix++) {
            const x = -hx + (ix / resX) * ancho;
            // Ondulación sutil de dunas de arena en Y
            const y = Math.sin(x * 1.8) * 0.08 + Math.cos(z * 1.5) * 0.06;

            v.push(x, y, z);
            // Normal apuntando mayormente hacia arriba (+Y)
            const ny = 1.0;
            const nx = -0.08 * 1.8 * Math.cos(x * 1.8);
            const nz = 0.06 * 1.5 * Math.sin(z * 1.5);
            const nNorm = normVec3([nx, ny, nz]);
            n.push(nNorm[0], nNorm[1], nNorm[2]);

            uv.push((ix / resX) * 4.0, (iz / resZ) * 4.0); // Repetición de textura
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

// 4. Geometría de Esfera para Burbujas (Paso 7 - Latitud y Longitud)
function generarGeometriaEsfera(radio = 1.0, latBands = 10, lonBands = 10) {
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

// 5. Aristas del Tanque de Cristal (Líneas 3D - Paso 14)
function generarLineasTanque(w, h, d) {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    // 8 esquinas del prisma rectangular
    const lines = [
        // Base inferior
        -hw, -hh, -hd,   hw, -hh, -hd,
         hw, -hh, -hd,   hw, -hh,  hd,
         hw, -hh,  hd,  -hw, -hh,  hd,
        -hw, -hh,  hd,  -hw, -hh, -hd,
        // Base superior
        -hw,  hh, -hd,   hw,  hh, -hd,
         hw,  hh, -hd,   hw,  hh,  hd,
         hw,  hh,  hd,  -hw,  hh,  hd,
        -hw,  hh,  hd,  -hw,  hh, -hd,
        // Columnas verticales
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

// Dimensiones de la Pecera / Acuario
const TANK_WIDTH = 8.0;
const TANK_HEIGHT = 4.6;
const TANK_DEPTH = 5.6;

// Instanciar todas las mallas GPU
const meshPez = generarGeometriaPez();
const meshCola = generarGeometriaCola();
const meshSuelo = generarGeometriaSuelo(TANK_WIDTH, TANK_DEPTH, 20, 20);
const meshBurbuja = generarGeometriaEsfera(0.08, 8, 8);
const meshRoca = generarGeometriaEsfera(0.4, 6, 6);
const meshTanque = generarLineasTanque(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH);

// ----------------------------------------------------------------------------
// PASO 9 Y 10: TEXTURAS PROCEDURALES EN MEMORIA (Sin dependencias CORS)
// ----------------------------------------------------------------------------
function crearTexturaProcedural(ancho, alto, dibujador) {
    const cvs = document.createElement("canvas");
    cvs.width = ancho;
    cvs.height = alto;
    const ctx = cvs.getContext("2d");
    dibujador(ctx, ancho, alto);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cvs);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
}

// Textura 1: Pez Payaso (Naranja vibrante con bandas blancas contorneadas de negro)
const texPezPayaso = crearTexturaProcedural(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#ff6a00";
    ctx.fillRect(0, 0, w, h);

    // Franjas blancas con borde negro
    [0.32, 0.68].forEach(xRel => {
        const x = xRel * w;
        ctx.fillStyle = "#111111";
        ctx.fillRect(x - 18, 0, 36, h);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 12, 0, 24, h);
    });

    // Detalle del ojo
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(w * 0.88, h * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w * 0.89, h * 0.48, 2, 0, Math.PI * 2);
    ctx.fill();
});

// Textura 2: Pez Azul Tropical (Cirujano azul estilo Dory)
const texPezAzul = crearTexturaProcedural(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#1055e2";
    ctx.fillRect(0, 0, w, h);

    // Marca negra dorsal
    ctx.fillStyle = "#061329";
    ctx.beginPath();
    ctx.ellipse(w * 0.4, h * 0.5, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Franja amarilla caudal
    ctx.fillStyle = "#ffd000";
    ctx.fillRect(0, 0, w * 0.22, h);

    // Ojo
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w * 0.88, h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(w * 0.89, h * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
});

// Textura 3: Suelo de Arena Marina con textura granulada
const texArena = crearTexturaProcedural(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c2aa78";
    ctx.fillRect(0, 0, w, h);

    // Ruidos/granos de arena
    for (let i = 0; i < 4000; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        const col = Math.random() > 0.5 ? "rgba(140, 115, 75, 0.35)" : "rgba(240, 225, 190, 0.45)";
        ctx.fillStyle = col;
        ctx.fillRect(rx, ry, 2, 2);
    }
});

// ----------------------------------------------------------------------------
// PASO 4, 11 Y 13: SIMULACIÓN DE CARDÚMENES (BOIDS) Y ARTICULACIÓN JERÁRQUICA
// ----------------------------------------------------------------------------

class PezBoid {
    constructor(id, tipo, pos, vel) {
        this.id = id;
        this.tipo = tipo; // 0: Payaso, 1: Cirujano Azul, 2: Líder
        this.pos = pos;
        this.vel = vel;
        this.acc = [0, 0, 0];
        this.maxSpeed = tipo === 2 ? 1.7 : 1.45;
        this.maxForce = 0.045;
        this.tailPhase = Math.random() * Math.PI * 2;
        this.tailSpeed = 8.0 + Math.random() * 4.0;
        this.scale = tipo === 2 ? 0.38 : (0.24 + Math.random() * 0.08);
    }

    aplicarFuerza(f) {
        this.acc = addVec3(this.acc, f);
    }

    actualizar(dt, limites, puntoComida) {
        // Si hay comida en el agua, los peces se ven fuertemente atraídos
        if (puntoComida) {
            const haciaComida = subVec3(puntoComida, this.pos);
            const d = lengthVec3(haciaComida);
            if (d < 6.0) {
                const deseada = scaleVec3(normVec3(haciaComida), this.maxSpeed * 1.3);
                const fuerzaComida = subVec3(deseada, this.vel);
                this.aplicarFuerza(scaleVec3(fuerzaComida, 0.08));
            }
        }

        // Confinamiento suave en los límites de la pecera
        const marginX = limites.w / 2 - 0.6;
        const marginY = limites.h / 2 - 0.5;
        const marginZ = limites.d / 2 - 0.6;
        const fRepulsion = 0.06;

        if (this.pos[0] > marginX) this.acc[0] -= fRepulsion * (this.pos[0] - marginX);
        if (this.pos[0] < -marginX) this.acc[0] += fRepulsion * (-marginX - this.pos[0]);
        if (this.pos[1] > marginY) this.acc[1] -= fRepulsion * (this.pos[1] - marginY);
        if (this.pos[1] < -marginY + 0.3) this.acc[1] += fRepulsion * (-marginY + 0.3 - this.pos[1]);
        if (this.pos[2] > marginZ) this.acc[2] -= fRepulsion * (this.pos[2] - marginZ);
        if (this.pos[2] < -marginZ) this.acc[2] += fRepulsion * (-marginZ - this.pos[2]);

        // Integrar velocidad y posición
        this.vel = addVec3(this.vel, scaleVec3(this.acc, dt * 60.0));
        const speed = lengthVec3(this.vel);
        if (speed > this.maxSpeed) {
            this.vel = scaleVec3(normVec3(this.vel), this.maxSpeed);
        } else if (speed < 0.4) {
            this.vel = scaleVec3(normVec3(this.vel), 0.4);
        }

        this.pos = addVec3(this.pos, scaleVec3(this.vel, dt));
        this.acc = [0, 0, 0]; // Resetear aceleración

        // Frecuencia de movimiento de la cola dependiente de la velocidad
        this.tailPhase += dt * (this.tailSpeed * (speed / this.maxSpeed));
    }

    flock(cardumen) {
        let sep = [0, 0, 0], ali = [0, 0, 0], coh = [0, 0, 0];
        let totalSep = 0, totalVecinos = 0;

        const distSeparacion = 0.75;
        const distVecindad = 1.8;

        for (let otro of cardumen) {
            if (otro === this) continue;
            const diff = subVec3(this.pos, otro.pos);
            const d = lengthVec3(diff);

            if (d > 0 && d < distSeparacion) {
                const rep = scaleVec3(normVec3(diff), 1.0 / d);
                sep = addVec3(sep, rep);
                totalSep++;
            }
            if (d > 0 && d < distVecindad) {
                ali = addVec3(ali, otro.vel);
                coh = addVec3(coh, otro.pos);
                totalVecinos++;
            }
        }

        if (totalSep > 0) {
            sep = scaleVec3(normVec3(sep), this.maxSpeed);
            let steerSep = subVec3(sep, this.vel);
            this.aplicarFuerza(scaleVec3(steerSep, 0.05));
        }

        if (totalVecinos > 0) {
            // Alineación
            ali = scaleVec3(ali, 1.0 / totalVecinos);
            ali = scaleVec3(normVec3(ali), this.maxSpeed);
            let steerAli = subVec3(ali, this.vel);
            this.aplicarFuerza(scaleVec3(steerAli, 0.025));

            // Cohesión
            coh = scaleVec3(coh, 1.0 / totalVecinos);
            let haciaCentro = subVec3(coh, this.pos);
            haciaCentro = scaleVec3(normVec3(haciaCentro), this.maxSpeed);
            let steerCoh = subVec3(haciaCentro, this.vel);
            this.aplicarFuerza(scaleVec3(steerCoh, 0.02));
        }
    }
}

// Inicializar Cardumen de 45 Peces en el Acuario
const NUM_PECES = 45;
const cardumen = [];
for (let i = 0; i < NUM_PECES; i++) {
    const tipo = i === 0 ? 2 : (i % 2 === 0 ? 0 : 1);
    const px = (Math.random() - 0.5) * (TANK_WIDTH - 2.0);
    const py = (Math.random() - 0.5) * (TANK_HEIGHT - 2.0);
    const pz = (Math.random() - 0.5) * (TANK_DEPTH - 2.0);
    const vx = (Math.random() - 0.5) * 1.0;
    const vy = (Math.random() - 0.5) * 0.4;
    const vz = (Math.random() - 0.5) * 1.0;
    cardumen.push(new PezBoid(i, tipo, [px, py, pz], normVec3([vx, vy, vz])));
}

// Sistema de Burbujas de Aire Ascendentes
const NUM_BURBUJAS = 35;
const burbujas = [];
for (let i = 0; i < NUM_BURBUJAS; i++) {
    burbujas.push({
        x: (Math.random() - 0.5) * (TANK_WIDTH - 1.5),
        y: -TANK_HEIGHT / 2 + Math.random() * TANK_HEIGHT,
        z: (Math.random() - 0.5) * (TANK_DEPTH - 1.5),
        speed: 0.6 + Math.random() * 0.7,
        oscFreq: 2.0 + Math.random() * 3.0,
        oscAmp: 0.04 + Math.random() * 0.04,
        scale: 0.4 + Math.random() * 0.6,
        seed: Math.random() * 10.0
    });
}

// Rocas decorativas en el fondo
const rocas = [
    { pos: [-2.8, -TANK_HEIGHT/2 + 0.3, -1.8], scale: [1.2, 0.7, 1.0], color: [0.28, 0.32, 0.35, 1.0] },
    { pos: [-2.1, -TANK_HEIGHT/2 + 0.4, -1.5], scale: [0.8, 0.9, 0.8], color: [0.35, 0.30, 0.25, 1.0] },
    { pos: [ 2.6, -TANK_HEIGHT/2 + 0.35, 1.4], scale: [1.4, 0.8, 1.2], color: [0.30, 0.35, 0.30, 1.0] },
    { pos: [ 2.0, -TANK_HEIGHT/2 + 0.25, 1.8], scale: [0.9, 0.6, 0.7], color: [0.25, 0.28, 0.32, 1.0] }
];

// ----------------------------------------------------------------------------
// PASO 15: CÁMARA INTERACTIVA ORBITAL Y NAVEGACIÓN
// ----------------------------------------------------------------------------
let camTheta = 0.0;          // Ángulo azimutal
let camPhi = 0.25;           // Elevación vertical (en radianes)
let camRadio = 7.5;          // Distancia de la cámara al centro
let modoCamara = 1;          // 1: Orbital Exterior, 2: Submarina Interior, 3: Seguimiento Pez
let arrastrandoMouse = false;
let mouseXAnterior = 0;
let mouseYAnterior = 0;

let puntoAlimento = null;
let tiempoAlimentoRestante = 0;
let mostrarLimitesTanque = true;

// Eventos de Mouse
canvas.addEventListener("mousedown", (e) => {
    arrastrandoMouse = true;
    mouseXAnterior = e.clientX;
    mouseYAnterior = e.clientY;
});

window.addEventListener("mouseup", () => { arrastrandoMouse = false; });

window.addEventListener("mousemove", (e) => {
    if (!arrastrandoMouse) return;
    const deltaX = e.clientX - mouseXAnterior;
    const deltaY = e.clientY - mouseYAnterior;
    mouseXAnterior = e.clientX;
    mouseYAnterior = e.clientY;

    camTheta -= deltaX * 0.007;
    camPhi += deltaY * 0.007;

    // Limitar elevación vertical para no invertir la cámara
    camPhi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camPhi));
});

// Zoom con Rueda del Ratón
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    camRadio += e.deltaY * 0.006;
    camRadio = Math.max(2.8, Math.min(16.0, camRadio));
}, { passive: false });

// Controles de Teclado
window.addEventListener("keydown", (e) => {
    if (e.key === "1") {
        modoCamara = 1;
        camRadio = 7.5;
        document.getElementById("lblCamara").textContent = "Orbital Exterior";
    } else if (e.key === "2") {
        modoCamara = 2;
        camRadio = 2.8;
        document.getElementById("lblCamara").textContent = "Submarina Inmersiva";
    } else if (e.key === "3") {
        modoCamara = 3;
        document.getElementById("lblCamara").textContent = "Seguimiento Pez Líder";
    } else if (e.code === "Space") {
        soltarComida();
    }
});

// Botones de la Interfaz
document.getElementById("btnFood").addEventListener("click", soltarComida);
document.getElementById("btnScatter").addEventListener("click", () => {
    // Espantar peces en direcciones aleatorias con impulso súbito
    for (let pez of cardumen) {
        pez.vel = [
            (Math.random() - 0.5) * 3.5,
            (Math.random() - 0.5) * 2.0,
            (Math.random() - 0.5) * 3.5
        ];
    }
});
document.getElementById("btnToggleWire").addEventListener("click", () => {
    mostrarLimitesTanque = !mostrarLimitesTanque;
});

function soltarComida() {
    // Soltar alimento en la parte superior central de la pecera
    puntoAlimento = [(Math.random() - 0.5) * 2.0, TANK_HEIGHT / 2 - 0.3, (Math.random() - 0.5) * 2.0];
    tiempoAlimentoRestante = 4.5; // Duración de 4.5 segundos
}

// ----------------------------------------------------------------------------
// PASO 4: RENDER LOOP Y CICLO DE ANIMACIÓN BASADO EN DELTA TIME
// ----------------------------------------------------------------------------
let tiempoAnterior = 0;
let contadorFPS = 0;
let acumuladorTiempoFPS = 0;

function render(tiempoActualMS) {
    const tiempoSegundos = tiempoActualMS * 0.001;
    let deltaTime = tiempoSegundos - tiempoAnterior;
    tiempoAnterior = tiempoSegundos;
    if (deltaTime > 0.1 || deltaTime <= 0) deltaTime = 0.016;

    // Medición de FPS
    contadorFPS++;
    acumuladorTiempoFPS += deltaTime;
    if (acumuladorTiempoFPS >= 0.5) {
        document.getElementById("lblFps").textContent = Math.round((contadorFPS / acumuladorTiempoFPS));
        contadorFPS = 0;
        acumuladorTiempoFPS = 0;
    }

    // Gestionar tiempo del alimento
    if (tiempoAlimentoRestante > 0) {
        tiempoAlimentoRestante -= deltaTime;
        // La comida desciende suavemente hacia el fondo
        puntoAlimento[1] -= deltaTime * 0.35;
        if (tiempoAlimentoRestante <= 0 || puntoAlimento[1] < -TANK_HEIGHT / 2 + 0.3) {
            puntoAlimento = null;
        }
    }

    // Actualizar Boids del cardumen (Paso 13)
    const limitesTanque = { w: TANK_WIDTH, h: TANK_HEIGHT, d: TANK_DEPTH };
    for (let pez of cardumen) {
        pez.flock(cardumen);
        pez.actualizar(deltaTime, limitesTanque, puntoAlimento);
    }

    // Actualizar Burbujas
    for (let b of burbujas) {
        b.y += b.speed * deltaTime;
        // Al llegar a la superficie superior, reaparece en el sustrato del fondo
        if (b.y > TANK_HEIGHT / 2 - 0.2) {
            b.y = -TANK_HEIGHT / 2 + 0.15;
            b.x = (Math.random() - 0.5) * (TANK_WIDTH - 1.5);
            b.z = (Math.random() - 0.5) * (TANK_DEPTH - 1.5);
        }
    }

    // ------------------------------------------------------------------------
    // CÁLCULO DE CÁMARA (VIEW MATRIX - Paso 6 y 15)
    // ------------------------------------------------------------------------
    let eye, target, up = [0, 1, 0];

    if (modoCamara === 1 || modoCamara === 2) {
        // Cámara Orbital (Exterior o Inmersiva según camRadio)
        const cosP = Math.cos(camPhi);
        eye = [
            camRadio * Math.sin(camTheta) * cosP,
            camRadio * Math.sin(camPhi),
            camRadio * Math.cos(camTheta) * cosP
        ];
        target = [0, 0, 0];
    } else {
        // Modo 3: Seguimiento del Pez Líder
        const pezLider = cardumen[0];
        const dir = normVec3(pezLider.vel);
        // Cámara ubicada detrás y ligeramente arriba del pez
        eye = subVec3(pezLider.pos, scaleVec3(dir, 1.4));
        eye[1] += 0.45;
        target = addVec3(pezLider.pos, scaleVec3(dir, 1.0));
    }

    const viewMatrix = matrizLookAt(eye, target, up);
    const projMatrix = matrizPerspectiva(
        55 * Math.PI / 180,
        canvas.width / canvas.height,
        0.1,
        100.0
    );

    // ------------------------------------------------------------------------
    // COMUNICACIÓN CON SHADERS Y RENDERIZADO
    // ------------------------------------------------------------------------
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Activar Programa Principal
    gl.useProgram(mainProgram);
    gl.uniformMatrix4fv(mainLocs.uViewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mainLocs.uProjectionMatrix, false, projMatrix);

    // Luz Puntual Cenital (Lámpara del Acuario / Superficie marina - Paso 12)
    gl.uniform3f(mainLocs.uLightPos, 0.0, TANK_HEIGHT / 2 + 1.2, 0.0);
    gl.uniform3f(mainLocs.uLightColor, 1.1, 1.2, 1.3); // Luz blanca brillante
    gl.uniform3f(mainLocs.uAmbientColor, 0.08, 0.20, 0.36); // Ambiente azul subacuático
    gl.uniform3fv(mainLocs.uCameraPos, eye);
    gl.uniform1f(mainLocs.uTime, tiempoSegundos);

    // 1. DIBUJAR SUELO DE ARENA (Paso 7, 8, 9)
    {
        const T = matrizTraslacion4(0.0, -TANK_HEIGHT / 2 + 0.02, 0.0);
        const model = T;
        const normMat = matrizNormal3(model);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMat);
        gl.uniform4f(mainLocs.uBaseColor, 0.85, 0.82, 0.72, 1.0);
        gl.uniform1i(mainLocs.uUseTexture, 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texArena);
        gl.uniform1i(mainLocs.uTexture, 0);

        gl.bindVertexArray(meshSuelo.vao);
        gl.drawElements(gl.TRIANGLES, meshSuelo.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // 2. DIBUJAR ROCAS DECORATIVAS
    {
        gl.uniform1i(mainLocs.uUseTexture, 0);
        gl.bindVertexArray(meshRoca.vao);
        for (let r of rocas) {
            const T = matrizTraslacion4(r.pos[0], r.pos[1], r.pos[2]);
            const S = matrizEscala4(r.scale[0], r.scale[1], r.scale[2]);
            const model = multiplicarMat4(T, S);
            const normMat = matrizNormal3(model);

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMat);
            gl.uniform4fv(mainLocs.uBaseColor, r.color);

            gl.drawElements(gl.TRIANGLES, meshRoca.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // 3. DIBUJAR CARDUMEN DE PECES CON JERARQUÍA CUERPO -> COLA (Paso 11 y 13)
    for (let pez of cardumen) {
        // Matriz de Modelo del Cuerpo: T * R_Orientación * S
        const T = matrizTraslacion4(pez.pos[0], pez.pos[1], pez.pos[2]);
        const R = matrizOrientacionHacia(pez.vel);
        const S = matrizEscala4(pez.scale, pez.scale, pez.scale);
        const modelCuerpo = multiplicarMat4(T, multiplicarMat4(R, S));
        const normMatCuerpo = matrizNormal3(modelCuerpo);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCuerpo);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMatCuerpo);
        gl.uniform1i(mainLocs.uUseTexture, 1);

        // Asignar textura según especie
        gl.activeTexture(gl.TEXTURE0);
        if (pez.tipo === 0) {
            gl.bindTexture(gl.TEXTURE_2D, texPezPayaso);
            gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        } else if (pez.tipo === 1) {
            gl.bindTexture(gl.TEXTURE_2D, texPezAzul);
            gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        } else {
            // Pez Líder dorado
            gl.bindTexture(gl.TEXTURE_2D, texPezPayaso);
            gl.uniform4f(mainLocs.uBaseColor, 1.2, 0.9, 0.3, 1.0);
        }
        gl.uniform1i(mainLocs.uTexture, 0);

        // Dibujar Cuerpo
        gl.bindVertexArray(meshPez.vao);
        gl.drawElements(gl.TRIANGLES, meshPez.numElements, gl.UNSIGNED_SHORT, 0);

        // JERARQUÍA MULTINIVEL (Paso 11): Cola articulada dependiente del cuerpo
        // M_cola = M_cuerpo * T_offset_cola * R_y(oscilación)
        const anguloCola = Math.sin(pez.tailPhase) * 0.55;
        const T_offset = matrizTraslacion4(-0.55, 0.0, 0.0);
        const R_cola = matrizRotacionY(anguloCola);
        const modelCola = multiplicarMat4(modelCuerpo, multiplicarMat4(T_offset, R_cola));
        const normMatCola = matrizNormal3(modelCola);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCola);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMatCola);

        // Dibujar Aleta Caudal
        gl.bindVertexArray(meshCola.vao);
        gl.drawElements(gl.TRIANGLES, meshCola.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // 4. DIBUJAR BURBUJAS DE AIRE (Translúcidas con Blending)
    gl.uniform1i(mainLocs.uUseTexture, 0);
    gl.bindVertexArray(meshBurbuja.vao);
    gl.uniform4f(mainLocs.uBaseColor, 0.6, 0.9, 1.0, 0.45); // Cian translúcido

    for (let b of burbujas) {
        const ox = b.x + Math.sin(tiempoSegundos * b.oscFreq + b.seed) * b.oscAmp;
        const oz = b.z + Math.cos(tiempoSegundos * b.oscFreq + b.seed) * b.oscAmp;
        const T = matrizTraslacion4(ox, b.y, oz);
        const S = matrizEscala4(b.scale, b.scale, b.scale);
        const model = multiplicarMat4(T, S);
        const normMat = matrizNormal3(model);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMat);
        gl.drawElements(gl.TRIANGLES, meshBurbuja.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // 5. DIBUJAR ALIMENTO SI ESTÁ ACTIVO
    if (puntoAlimento) {
        const T = matrizTraslacion4(puntoAlimento[0], puntoAlimento[1], puntoAlimento[2]);
        const S = matrizEscala4(0.09, 0.09, 0.09);
        const model = multiplicarMat4(T, S);
        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 0.2, 0.1, 1.0); // Bolita roja de alimento
        gl.drawElements(gl.TRIANGLES, meshBurbuja.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // 6. DIBUJAR LÍMITES DEL TANQUE DE CRISTAL (Paso 14 - gl.LINES)
    if (mostrarLimitesTanque) {
        gl.useProgram(lineProgram);
        gl.uniformMatrix4fv(lineLocs.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(lineLocs.uProjectionMatrix, false, projMatrix);
        gl.uniformMatrix4fv(lineLocs.uModelMatrix, false, matrizIdentidad4());
        gl.uniform4f(lineLocs.uLineColor, 0.2, 0.7, 1.0, 0.45); // Brillo cian en aristas

        gl.bindVertexArray(meshTanque.vao);
        gl.drawArrays(gl.LINES, 0, meshTanque.count);
    }

    // Solicitar el siguiente cuadro al navegador
    requestAnimationFrame(render);
}

// Iniciar el Render Loop
requestAnimationFrame(render);
