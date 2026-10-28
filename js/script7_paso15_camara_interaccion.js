// ============================================================================
// SCRIPT 7 - PASO 15: CÁMARA INTERACTIVA ORBITAL, NAVEGACIÓN Y EVENTOS
// Mini Motor Gráfico - Acuario Marino 3D (Gran Tanque y Ciclo Día/Tarde/Noche)
// Control de mouse (arrastre, scroll zoom), teclado y botones UI
// ============================================================================

"use strict";

// Variables de estado de la Cámara Orbital (Adaptada a Tanque 14 x 7 x 9)
let camTheta = 0.0;          // Ángulo azimutal (giro horizontal)
let camPhi = 0.22;           // Ángulo de elevación vertical
let camRadio = 10.8;         // Distancia idónea para apreciar el gran acuario completo
let modoCamara = 1;          // 1: Orbital Exterior, 2: Submarina Inmersiva, 3: Seguimiento Cardumen, 4: Seguimiento Tiburón
let arrastrandoMouse = false;
let mouseXAnterior = 0;
let mouseYAnterior = 0;

// Ciclo de Iluminación: 0 = Día (Sol brillante), 1 = Tarde (Atardecer dorado), 2 = Noche (Bioluminiscencia lunar)
let cicloIluminacion = 0;

// Variables de interacción del usuario
let puntoAlimento = null;
let tiempoAlimentoRestante = 0;
let mostrarLimitesTanque = true;

// 1. Eventos de Mouse para Orbitar la Escena 3D
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

    // Limitar elevación vertical para evitar invertir el vector UP de la cámara
    camPhi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camPhi));
});

// 2. Zoom mediante la Rueda del Ratón
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    camRadio += e.deltaY * 0.008;
    camRadio = Math.max(2.5, Math.min(22.0, camRadio));
}, { passive: false });

// 3. Función para cambiar el ciclo de iluminación (Día, Tarde, Noche)
function cambiarCicloIluminacion(nuevoCiclo) {
    cicloIluminacion = nuevoCiclo;
    const btns = [document.getElementById("btnDia"), document.getElementById("btnTarde"), document.getElementById("btnNoche")];
    btns.forEach((b, idx) => {
        if (b) {
            if (idx === nuevoCiclo) {
                b.classList.add("active-cycle");
            } else {
                b.classList.remove("active-cycle");
            }
        }
    });

    const lblCiclo = document.getElementById("lblCiclo");
    if (lblCiclo) {
        lblCiclo.textContent = nuevoCiclo === 0 ? "☀️ Día (Sol Cenital)" : (nuevoCiclo === 1 ? "🌅 Tarde (Atardecer Dorado)" : "🌙 Noche (Bioluminiscente)");
    }
}

// 4. Controles de Teclado
window.addEventListener("keydown", (e) => {
    const lblCam = document.getElementById("lblCamara");
    if (e.key === "1") {
        modoCamara = 1;
        camRadio = 10.8;
        if (lblCam) lblCam.textContent = "Orbital Gran Tanque";
    } else if (e.key === "2") {
        modoCamara = 2;
        camRadio = 4.5;
        if (lblCam) lblCam.textContent = "Submarina Inmersiva";
    } else if (e.key === "3") {
        modoCamara = 3;
        if (lblCam) lblCam.textContent = "Seguimiento Cardumen";
    } else if (e.key === "4") {
        modoCamara = 4;
        if (lblCam) lblCam.textContent = "Seguimiento Tiburón";
    } else if (e.key === "d" || e.key === "D") {
        cambiarCicloIluminacion(0);
    } else if (e.key === "t" || e.key === "T") {
        cambiarCicloIluminacion(1);
    } else if (e.key === "n" || e.key === "N") {
        cambiarCicloIluminacion(2);
    } else if (e.code === "Space") {
        soltarComida();
    }
});

// 5. Botones de la Interfaz Web con verificaciones seguras
const btnFood = document.getElementById("btnFood");
if (btnFood) {
    btnFood.addEventListener("click", soltarComida);
}

const btnScatter = document.getElementById("btnScatter");
if (btnScatter) {
    btnScatter.addEventListener("click", () => {
        for (let pez of cardumen) {
            pez.vel = [
                (Math.random() - 0.5) * 3.8,
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 3.8
            ];
        }
    });
}

const btnToggleWire = document.getElementById("btnToggleWire");
if (btnToggleWire) {
    btnToggleWire.addEventListener("click", () => {
        mostrarLimitesTanque = !mostrarLimitesTanque;
    });
}

const btnDia = document.getElementById("btnDia");
if (btnDia) btnDia.addEventListener("click", () => cambiarCicloIluminacion(0));

const btnTarde = document.getElementById("btnTarde");
if (btnTarde) btnTarde.addEventListener("click", () => cambiarCicloIluminacion(1));

const btnNoche = document.getElementById("btnNoche");
if (btnNoche) btnNoche.addEventListener("click", () => cambiarCicloIluminacion(2));

// Función para soltar comida en el agua
function soltarComida() {
    puntoAlimento = [
        (Math.random() - 0.5) * 5.0,
        TANK_HEIGHT / 2 - 0.3,
        (Math.random() - 0.5) * 3.5
    ];
    tiempoAlimentoRestante = 4.8;
}
