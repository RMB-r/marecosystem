// ============================================================================
// SCRIPT 2 - PASO 2: SHADERS EN GLSL ES 3.00 Y PROGRAMAS WEBGL
// Mini Motor Gráfico - Acuario Marino 3D (Renderizado Avanzado y Ciclo Día/Tarde/Noche)
// Modelo Blinn-Phong + Cáusticas Multicapa + Efecto Fresnel + Bioluminiscencia + Niebla
// ============================================================================

"use strict";

// 1. Vertex Shader Principal (Transformación MVP + Iluminación + UVs)
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

// 2. Fragment Shader Principal (Blinn-Phong + Especular + Cáusticas + Fresnel + Emisión + Niebla)
const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;

// Iluminación (Paso 8 y 12)
uniform vec3 uLightPos;          // Posición de la luz cenital (Sol / Foco / Luna)
uniform vec3 uLightColor;        // Color de la luz principal
uniform vec3 uAmbientColor;      // Luz ambiente marina
uniform vec3 uCameraPos;         // Posición del observador
uniform vec3 uFogColor;          // Color de la niebla según momento del día
uniform vec3 uEmissive;          // Bioluminiscencia propia (medusas, anémonas)

// Parámetros de Material y Especular (Blinn-Phong)
uniform sampler2D uTexture;
uniform vec4 uBaseColor;
uniform int uUseTexture;
uniform float uShininess;        // Brillo especular (exponente)
uniform float uSpecularPower;    // Intensidad especular
uniform float uCausticIntensity; // Intensidad de cáusticas (máxima de día, tenue de noche)
uniform float uTime;             // Factor temporal para cáusticas animadas

out vec4 outColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPos);
    
    // 1. Vector hacia la luz y atenuación por distancia
    vec3 L = uLightPos - vWorldPos;
    float dist = length(L);
    L = normalize(L);
    float atten = 1.0 / (1.0 + 0.035 * dist + 0.004 * dist * dist);

    // 2. Iluminación Difusa (Lambert)
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * uLightColor * atten;

    // 3. Iluminación Especular (Blinn-Phong)
    vec3 H = normalize(L + V);
    float specFactor = pow(max(dot(N, H), 0.0), uShininess);
    vec3 specular = specFactor * uLightColor * uSpecularPower * atten;

    // 4. Efecto Fresnel Submarino (Resplandor en los bordes de criaturas vivas y agua)
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);
    vec3 rimLight = fresnel * (uAmbientColor * 1.6 + vec3(0.05, 0.20, 0.35)) * 0.55;

    // 5. Cáusticas Subacuáticas Procedurales Multicapa
    float caustics = 0.0;
    if (uCausticIntensity > 0.01 && N.y > -0.3) {
        float wave1 = sin(vWorldPos.x * 2.2 + uTime * 2.0 + sin(vWorldPos.z * 1.8 + uTime * 1.1));
        float wave2 = cos(vWorldPos.z * 2.4 - uTime * 1.7 + cos(vWorldPos.x * 1.9 - uTime * 0.8));
        float causticPattern = (wave1 + wave2) * 0.5 + 0.5;
        caustics = pow(causticPattern, 3.2) * 0.45 * atten * max(0.15, N.y + 0.3) * uCausticIntensity;
    }

    // 6. Luz de rebote inferior del lecho marino (Bounce fill light)
    vec3 bounceLight = max(-N.y, 0.0) * (uAmbientColor * 0.55);

    vec3 totalLight = uAmbientColor + diffuse + bounceLight + vec3(caustics * 0.6, caustics * 0.9, caustics);

    // 7. Muestreo de textura o color base del objeto
    vec4 objColor = uBaseColor;
    if (uUseTexture == 1) {
        objColor = texture(uTexture, vTexCoord) * uBaseColor;
    }

    vec3 rgb = objColor.rgb * totalLight + specular + rimLight + uEmissive;

    // 8. Niebla Volumétrica de Profundidad Marina adaptada al ciclo horario
    float fogDistance = length(uCameraPos - vWorldPos);
    float fogFactor = clamp((fogDistance - 3.0) / 24.0, 0.0, 0.88);
    rgb = mix(rgb, uFogColor, fogFactor);

    outColor = vec4(rgb, objColor.a);
}`;

// 3. Shaders para Líneas del Tanque de Cristal (Paso 14)
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

// 4. Función Compiladora de Programas WebGL
function compilarPrograma(glContext, vSource, fSource) {
    function crearShader(ctx, tipo, fuente) {
        const shader = ctx.createShader(tipo);
        ctx.shaderSource(shader, fuente);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
            const err = ctx.getShaderInfoLog(shader);
            ctx.deleteShader(shader);
            throw new Error("Fallo al compilar shader:\n" + err);
        }
        return shader;
    }
    const vs = crearShader(glContext, glContext.VERTEX_SHADER, vSource);
    const fs = crearShader(glContext, glContext.FRAGMENT_SHADER, fSource);
    const program = glContext.createProgram();
    glContext.attachShader(program, vs);
    glContext.attachShader(program, fs);
    glContext.linkProgram(program);
    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
        throw new Error("Fallo al enlazar programa:\n" + glContext.getProgramInfoLog(program));
    }
    return program;
}

// 5. Compilación y Enlace de Programas
const mainProgram = compilarPrograma(gl, vertexShaderSource, fragmentShaderSource);
const lineProgram = compilarPrograma(gl, lineVertexSource, lineFragmentSource);

// 6. Ubicaciones de uniforms del programa principal
const mainLocs = {
    uModelMatrix: gl.getUniformLocation(mainProgram, "uModelMatrix"),
    uViewMatrix: gl.getUniformLocation(mainProgram, "uViewMatrix"),
    uProjectionMatrix: gl.getUniformLocation(mainProgram, "uProjectionMatrix"),
    uNormalMatrix: gl.getUniformLocation(mainProgram, "uNormalMatrix"),
    uLightPos: gl.getUniformLocation(mainProgram, "uLightPos"),
    uLightColor: gl.getUniformLocation(mainProgram, "uLightColor"),
    uAmbientColor: gl.getUniformLocation(mainProgram, "uAmbientColor"),
    uCameraPos: gl.getUniformLocation(mainProgram, "uCameraPos"),
    uFogColor: gl.getUniformLocation(mainProgram, "uFogColor"),
    uEmissive: gl.getUniformLocation(mainProgram, "uEmissive"),
    uTexture: gl.getUniformLocation(mainProgram, "uTexture"),
    uBaseColor: gl.getUniformLocation(mainProgram, "uBaseColor"),
    uUseTexture: gl.getUniformLocation(mainProgram, "uUseTexture"),
    uShininess: gl.getUniformLocation(mainProgram, "uShininess"),
    uSpecularPower: gl.getUniformLocation(mainProgram, "uSpecularPower"),
    uCausticIntensity: gl.getUniformLocation(mainProgram, "uCausticIntensity"),
    uTime: gl.getUniformLocation(mainProgram, "uTime")
};

// 7. Ubicaciones de uniforms del programa de líneas
const lineLocs = {
    uModelMatrix: gl.getUniformLocation(lineProgram, "uModelMatrix"),
    uViewMatrix: gl.getUniformLocation(lineProgram, "uViewMatrix"),
    uProjectionMatrix: gl.getUniformLocation(lineProgram, "uProjectionMatrix"),
    uLineColor: gl.getUniformLocation(lineProgram, "uLineColor")
};
