// ============================================================================
// SCRIPT 5 - PASOS 9 Y 10: TEXTURAS PROCEDURALES HD Y CARGA DE IMÁGENES REALES
// Mini Motor Gráfico - Acuario Marino 3D (Sistema Híbrido con Fallback Automático)
// Si existe la foto real (.jpg/.png) en texturas/, la carga en la GPU.
// Si no existe, utiliza la textura procedural HD en memoria sin detener la escena.
// ============================================================================

"use strict";

// 1. Generador de Lienzo Procedural 2D en Memoria
function crearCanvasProcedural(ancho, alto, dibujador) {
    const cvs = document.createElement("canvas");
    cvs.width = ancho;
    cvs.height = alto;
    const ctx = cvs.getContext("2d");
    dibujador(ctx, ancho, alto);
    return cvs;
}

// 2. Cargador Híbrido Paso 10: Foto Real (.jpg/.png) con Respaldo Procedural (Paso 9)
function cargarTexturaConRespaldo(urlImagen, cvsRespaldo) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Carga inicial inmediata con la textura procedural para que nunca haya pantalla negra
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cvsRespaldo);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Intento de carga asíncrona de la fotografía real externa
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        console.log(`[Textura HD Paso 10] Imagen real aplicada con éxito: ${urlImagen}`);
    };
    img.onerror = function() {
        // Si no está disponible en la carpeta o no se corre en servidor, mantiene la procedural
    };
    img.src = urlImagen;

    return tex;
}

// ----------------------------------------------------------------------------
// LIENZOS PROCEDURALES HD (Canvas 2D)
// ----------------------------------------------------------------------------

// A. Pez Payaso (Amphiprion ocellaris)
const cvsPezPayaso = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#ff4200");
    grad.addColorStop(0.35, "#ff6b18");
    grad.addColorStop(0.65, "#ff852a");
    grad.addColorStop(1.0, "#ffa645");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 235, 210, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 30; x < w - 40; x += 8) {
        ctx.beginPath();
        for (let y = 10; y < h - 10; y += 8) {
            ctx.arc(x + ((y % 16 === 0) ? 4 : 0), y, 5, 0, Math.PI * 0.9);
        }
        ctx.stroke();
    }

    const franjas = [
        { x: 0.28, wFranja: 38, curva: -12 },
        { x: 0.54, wFranja: 46, curva: -18 },
        { x: 0.78, wFranja: 38, curva: -10 }
    ];

    franjas.forEach(f => {
        const xC = f.x * w;
        ctx.fillStyle = "#121214";
        ctx.beginPath();
        ctx.moveTo(xC - f.wFranja / 2 - 5, 0);
        ctx.quadraticCurveTo(xC + f.curva - 5, h / 2, xC - f.wFranja / 2 - 5, h);
        ctx.lineTo(xC + f.wFranja / 2 + 5, h);
        ctx.quadraticCurveTo(xC + f.curva + 5, h / 2, xC + f.wFranja / 2 + 5, 0);
        ctx.closePath();
        ctx.fill();

        const gradBlanco = ctx.createLinearGradient(xC - f.wFranja, 0, xC + f.wFranja, 0);
        gradBlanco.addColorStop(0.0, "#f0f4f8");
        gradBlanco.addColorStop(0.5, "#ffffff");
        gradBlanco.addColorStop(1.0, "#f0f4f8");
        ctx.fillStyle = gradBlanco;
        ctx.beginPath();
        ctx.moveTo(xC - f.wFranja / 2, 0);
        ctx.quadraticCurveTo(xC + f.curva, h / 2, xC - f.wFranja / 2, h);
        ctx.lineTo(xC + f.wFranja / 2, h);
        ctx.quadraticCurveTo(xC + f.curva, h / 2, xC + f.wFranja / 2, 0);
        ctx.closePath();
        ctx.fill();
    });

    const eyeX = w * 0.88, eyeY = h * 0.44;
    ctx.fillStyle = "#d84400"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffaa00"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(eyeX - 2.5, eyeY - 2.5, 2.5, 0, Math.PI * 2); ctx.fill();
});

// B. Cirujano Azul (Paracanthurus hepatus)
const cvsPezAzul = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#082f8a");
    grad.addColorStop(0.5, "#1858e6");
    grad.addColorStop(1.0, "#0c3ca8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#080c14";
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h * 0.20);
    ctx.bezierCurveTo(w * 0.50, h * 0.05, w * 0.20, h * 0.20, w * 0.22, h * 0.60);
    ctx.bezierCurveTo(w * 0.24, h * 0.85, w * 0.55, h * 0.70, w * 0.65, h * 0.50);
    ctx.bezierCurveTo(w * 0.45, h * 0.45, w * 0.45, h * 0.30, w * 0.75, h * 0.20);
    ctx.closePath();
    ctx.fill();

    const gradAmarillo = ctx.createLinearGradient(0, 0, w * 0.35, 0);
    gradAmarillo.addColorStop(0.0, "#ffd000");
    gradAmarillo.addColorStop(0.7, "#ffe600");
    gradAmarillo.addColorStop(1.0, "rgba(255, 230, 0, 0)");
    ctx.fillStyle = gradAmarillo;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w * 0.32, h * 0.30); ctx.lineTo(w * 0.32, h * 0.70); ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    const eyeX = w * 0.88, eyeY = h * 0.44;
    ctx.fillStyle = "#001a4d"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#00d4ff"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(eyeX - 2, eyeY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
});

// C. Pez Ángel Dorado Líder
const cvsPezDorado = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#ff8800");
    grad.addColorStop(0.4, "#ffc107");
    grad.addColorStop(0.8, "#ffea00");
    grad.addColorStop(1.0, "#ff9800");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 6;
    for (let x = 60; x < w - 60; x += 55) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 15, h * 0.5, x - 15, h * 0.8, x + 5, h);
        ctx.stroke();
    }

    const eyeX = w * 0.87, eyeY = h * 0.44;
    ctx.fillStyle = "#00e5ff"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffaa00"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(eyeX - 2, eyeY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
});

// D. Tiburón Oceánico
const cvsTiburon = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#1c2b38");
    grad.addColorStop(0.35, "#344e66");
    grad.addColorStop(0.60, "#5b778f");
    grad.addColorStop(0.85, "#cbd7e3");
    grad.addColorStop(1.0, "#f0f4f8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let i = 0; i < 4000; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        ctx.fillRect(rx, ry, 1.5, 1.0);
    }

    ctx.strokeStyle = "#141e26";
    ctx.lineWidth = 3;
    const branchX = w * 0.72;
    for (let b = 0; b < 5; b++) {
        const bx = branchX + b * 9;
        ctx.beginPath();
        ctx.moveTo(bx, h * 0.38);
        ctx.quadraticCurveTo(bx - 3, h * 0.52, bx + 2, h * 0.66);
        ctx.stroke();
    }

    const eyeX = w * 0.88, eyeY = h * 0.40;
    ctx.fillStyle = "#0a1017"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e2a38"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(eyeX - 2, eyeY - 2, 2.0, 0, Math.PI * 2); ctx.fill();
});

// E. Medusa Bioluminiscente
const cvsMedusa = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0.0, "#00e5ff");
    grad.addColorStop(0.35, "#7c4dff");
    grad.addColorStop(0.70, "#e040fb");
    grad.addColorStop(1.0, "#00b0ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 4;
    for (let x = 20; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 10, h * 0.5, x, h);
        ctx.stroke();
    }

    for (let i = 0; i < 300; i++) {
        const px = Math.random() * w, py = Math.random() * h;
        const pr = 1.5 + Math.random() * 3.5;
        const gDot = ctx.createRadialGradient(px, py, 0, px, py, pr);
        gDot.addColorStop(0.0, "rgba(255, 255, 255, 0.9)");
        gDot.addColorStop(0.6, "rgba(0, 255, 240, 0.6)");
        gDot.addColorStop(1.0, "rgba(0, 255, 240, 0.0)");
        ctx.fillStyle = gDot;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
    }
});

// F. Tortuga Marina
const cvsTortuga = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0.0, "#3e4d29");
    grad.addColorStop(0.5, "#526233");
    grad.addColorStop(1.0, "#334120");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const filas = 4, cols = 8;
    const cellW = w / cols, cellH = h / filas;

    for (let r = 0; r < filas; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = c * cellW + cellW / 2 + ((r % 2 === 0) ? cellW * 0.25 : 0);
            const cy = r * cellH + cellH / 2;
            const rad = Math.min(cellW, cellH) * 0.42;

            ctx.strokeStyle = "#1b2411";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.stroke();

            const gScute = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
            gScute.addColorStop(0.0, "#c99738");
            gScute.addColorStop(0.6, "#5c6b32");
            gScute.addColorStop(1.0, "#2c381a");
            ctx.fillStyle = gScute;
            ctx.beginPath();
            ctx.arc(cx, cy, rad - 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const eyeX = w * 0.90, eyeY = h * 0.45;
    ctx.fillStyle = "#1a2212"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d4a024"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(eyeX - 1.5, eyeY - 1.5, 2.0, 0, Math.PI * 2); ctx.fill();
});

// G. Arrecife de Corales y Anémonas
const cvsCoral = crearCanvasProcedural(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0.0, "#ff1493");
    grad.addColorStop(0.35, "#ff6e40");
    grad.addColorStop(0.70, "#7c4dff");
    grad.addColorStop(1.0, "#00e5ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 90; i++) {
        const cx = Math.random() * w, cy = Math.random() * h;
        const rad = 6 + Math.random() * 18;
        const gPolyp = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
        gPolyp.addColorStop(0.0, "#ffffff");
        gPolyp.addColorStop(0.4, "rgba(255, 105, 180, 0.8)");
        gPolyp.addColorStop(1.0, "rgba(0, 229, 255, 0.0)");
        ctx.fillStyle = gPolyp;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let k = 0; k < 250; k++) {
        const px = Math.random() * w, py = Math.random() * h;
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 255, 230, 0.8)" : "rgba(255, 255, 150, 0.85)";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
});

// H. Suelo de Arena Marina con Ondulaciones
const cvsArena = crearCanvasProcedural(512, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0.0, "#c4ab7a");
    grad.addColorStop(0.5, "#d6be8c");
    grad.addColorStop(1.0, "#be9f6b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(245, 230, 200, 0.22)";
    ctx.lineWidth = 6;
    for (let y = 20; y < h; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + 15, w * 0.7, y - 15, w, y + 5);
        ctx.stroke();
    }

    for (let i = 0; i < 9000; i++) {
        const rx = Math.random() * w, ry = Math.random() * h;
        const rColor = Math.random();
        if (rColor > 0.65) ctx.fillStyle = "rgba(255, 245, 220, 0.45)";
        else if (rColor > 0.3) ctx.fillStyle = "rgba(150, 120, 75, 0.35)";
        else ctx.fillStyle = "rgba(90, 70, 45, 0.25)";
        ctx.fillRect(rx, ry, 1.8, 1.8);
    }
});

// I. Roca Basáltica
const cvsRoca = crearCanvasProcedural(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#3c4349";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
        const cx = Math.random() * w, cy = Math.random() * h;
        const rad = 10 + Math.random() * 25;
        const gCoral = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
        if (Math.random() > 0.5) {
            gCoral.addColorStop(0, "rgba(20, 140, 110, 0.65)");
            gCoral.addColorStop(1, "rgba(20, 140, 110, 0.0)");
        } else {
            gCoral.addColorStop(0, "rgba(180, 70, 85, 0.55)");
            gCoral.addColorStop(1, "rgba(180, 70, 85, 0.0)");
        }
        ctx.fillStyle = gCoral;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
    }
});

// J. Alga Marina (Kelp)
const cvsAlga = crearCanvasProcedural(128, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.0, "#084d28");
    grad.addColorStop(0.5, "#148a47");
    grad.addColorStop(1.0, "#084d28");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#27bf66";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
});

// ----------------------------------------------------------------------------
// INSTANCIACIÓN DE TEXTURAS (Paso 10 con Respaldo Automático)
// Si agregas las fotos a texturas/, se aplicarán en alta resolución.
// ----------------------------------------------------------------------------
const texPezPayaso = cargarTexturaConRespaldo("texturas/pez_payaso.jpg", cvsPezPayaso);
const texPezAzul   = cargarTexturaConRespaldo("texturas/pez_azul.jpg", cvsPezAzul);
const texPezDorado = cargarTexturaConRespaldo("texturas/pez_dorado.jpg", cvsPezDorado);
const texTiburon   = cargarTexturaConRespaldo("texturas/tiburon.jpg", cvsTiburon);
const texMedusa    = cargarTexturaConRespaldo("texturas/medusa.png", cvsMedusa);
const texTortuga   = cargarTexturaConRespaldo("texturas/tortuga.jpg", cvsTortuga);
const texCoral     = cargarTexturaConRespaldo("texturas/coral.jpg", cvsCoral);
const texArena     = cargarTexturaConRespaldo("texturas/arena.jpg", cvsArena);
const texRoca      = cargarTexturaConRespaldo("texturas/roca.jpg", cvsRoca);
const texAlga      = cargarTexturaConRespaldo("texturas/alga.png", cvsAlga);
