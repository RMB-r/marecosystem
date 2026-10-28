//Paso 1
"use strict";

// 1. Obtener el elemento canvas desde el DOM
const canvas = document.getElementById("glCanvas");

// 2. Solicitar contexto gráfico WebGL 2.0
const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });

if (!gl) {
    alert("Error: WebGL 2.0 no está disponible en este navegador o GPU.");
    throw new Error("WebGL 2.0 no soportado.");
}

// 3. Ajustar el tamaño del canvas para que ocupe TODA la pantalla completa
function redimensionarCanvasPantallaCompleta() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
redimensionarCanvasPantallaCompleta();
window.addEventListener("resize", redimensionarCanvasPantallaCompleta);

// 4. Color de fondo del agua marina profunda (Azul abisal)
gl.clearColor(0.015, 0.08, 0.20, 1.0);

// 5. Configuración de buffers (Paso 5 del curso)
// Activar prueba de profundidad para que los objetos frontales tapen a los traseros
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// Activar mezcla alfa (Blending) para transparencia de agua y burbujas
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
