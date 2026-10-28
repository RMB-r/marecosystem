// ============================================================================
// SCRIPT 6 - PASO 4, 11 Y 13: SIMULACIÓN DE CARDÚMENES (BOIDS) Y ECOSISTEMA
// Mini Motor Gráfico - Acuario Marino 3D (Ecosistema Marino Completo)
// Algoritmo de Craig Reynolds + Hábitat Payaso + Tiburón + Medusa + Tortuga
// ============================================================================

"use strict";

// ----------------------------------------------------------------------------
// 1. CLASE BOID PARA EL CARDUMEN PACÍFICO CENTRAL (Cirujanos Azules y Ángel Líder)
// ----------------------------------------------------------------------------
class PezBoid {
    constructor(id, tipo, pos, vel) {
        this.id = id;
        this.tipo = tipo; // 1: Cirujano Azul (Dory), 2: Ángel Dorado Líder
        this.pos = pos;
        this.vel = vel;
        this.acc = [0, 0, 0];
        this.maxSpeed = tipo === 2 ? 1.60 : (1.25 + Math.random() * 0.25);
        this.maxForce = 0.045;
        this.tailPhase = Math.random() * Math.PI * 2;
        this.tailSpeed = 8.0 + Math.random() * 3.0;
        this.scale = tipo === 2 ? 0.38 : (0.24 + Math.random() * 0.06);
        this.bankAngle = 0.0; // Inclinación al girar
    }

    aplicarFuerza(f) {
        this.acc = addVec3(this.acc, f);
    }

    actualizar(dt, limites, puntoComida) {
        // Atracción hacia el alimento si está cayendo
        if (puntoComida) {
            const haciaComida = subVec3(puntoComida, this.pos);
            const d = lengthVec3(haciaComida);
            if (d < 7.0) {
                const deseada = scaleVec3(normVec3(haciaComida), this.maxSpeed * 1.35);
                const fuerzaComida = subVec3(deseada, this.vel);
                this.aplicarFuerza(scaleVec3(fuerzaComida, 0.09));
            }
        }

        // Confinamiento suave en el centro del gran tanque (evitando bordes)
        const marginX = limites.w / 2 - 1.2;
        const marginY = limites.h / 2 - 1.0;
        const marginZ = limites.d / 2 - 1.2;
        const fRepulsion = 0.08;

        if (this.pos[0] > marginX) this.acc[0] -= fRepulsion * (this.pos[0] - marginX);
        if (this.pos[0] < -marginX) this.acc[0] += fRepulsion * (-marginX - this.pos[0]);
        if (this.pos[1] > marginY) this.acc[1] -= fRepulsion * (this.pos[1] - marginY);
        if (this.pos[1] < -marginY + 0.8) this.acc[1] += fRepulsion * (-marginY + 0.8 - this.pos[1]);
        if (this.pos[2] > marginZ) this.acc[2] -= fRepulsion * (this.pos[2] - marginZ);
        if (this.pos[2] < -marginZ) this.acc[2] += fRepulsion * (-marginZ - this.pos[2]);

        // Evitar nadar cerca del hábitat de la anémona para respetar a los peces payaso
        const dHab = lengthVec3(subVec3(this.pos, HABITAT_ANEMONA));
        if (dHab < 2.2) {
            const fAlejarse = scaleVec3(normVec3(subVec3(this.pos, HABITAT_ANEMONA)), 0.06);
            this.aplicarFuerza(fAlejarse);
        }

        const prevVel = [...this.vel];

        // Integración de velocidad y posición
        this.vel = addVec3(this.vel, scaleVec3(this.acc, dt * 60.0));
        const speed = lengthVec3(this.vel);
        if (speed > this.maxSpeed) {
            this.vel = scaleVec3(normVec3(this.vel), this.maxSpeed);
        } else if (speed < 0.40) {
            this.vel = scaleVec3(normVec3(this.vel), 0.40);
        }

        this.pos = addVec3(this.pos, scaleVec3(this.vel, dt));

        // Inclinación orgánica de giro (Roll)
        const cambioDir = crossVec3(normVec3(prevVel), normVec3(this.vel));
        const giroY = cambioDir[1] * 26.0;
        this.bankAngle += (giroY - this.bankAngle) * Math.min(1.0, dt * 5.0);
        this.bankAngle = Math.max(-0.45, Math.min(0.45, this.bankAngle));

        this.acc = [0, 0, 0];
        this.tailPhase += dt * (this.tailSpeed * (speed / this.maxSpeed));
    }

    flock(cardumen) {
        let sep = [0, 0, 0], ali = [0, 0, 0], coh = [0, 0, 0];
        let totalSep = 0, totalVecinos = 0;

        const distSeparacion = 0.95;
        const distVecindad = 2.4;

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
            this.aplicarFuerza(scaleVec3(steerSep, 0.055));
        }

        if (totalVecinos > 0) {
            ali = scaleVec3(ali, 1.0 / totalVecinos);
            ali = scaleVec3(normVec3(ali), this.maxSpeed);
            let steerAli = subVec3(ali, this.vel);
            this.aplicarFuerza(scaleVec3(steerAli, 0.028));

            coh = scaleVec3(coh, 1.0 / totalVecinos);
            let haciaCentro = subVec3(coh, this.pos);
            haciaCentro = scaleVec3(normVec3(haciaCentro), this.maxSpeed);
            let steerCoh = subVec3(haciaCentro, this.vel);
            this.aplicarFuerza(scaleVec3(steerCoh, 0.024));
        }
    }
}

// ----------------------------------------------------------------------------
// 2. CONFIGURACIÓN DEL HÁBITAT DE PECES PAYASO (Anémona y Arrecife)
// ----------------------------------------------------------------------------
const HABITAT_ANEMONA = [-4.2, -TANK_HEIGHT / 2 + 0.85, -1.8];

// 5 Peces Payaso con comportamiento territorial
class PezPayasoTerritorial {
    constructor(id) {
        this.id = id;
        this.tipo = 0; // Pez Payaso
        this.scale = 0.24 + Math.random() * 0.06;
        this.basePos = [...HABITAT_ANEMONA];
        // Posición inicial cerca de la anémona
        this.pos = [
            this.basePos[0] + (Math.random() - 0.5) * 0.8,
            this.basePos[1] + 0.2 + Math.random() * 0.5,
            this.basePos[2] + (Math.random() - 0.5) * 0.8
        ];
        this.vel = [0.1, 0, 0.1];
        this.estado = "EN_ANEMONA"; // "EN_ANEMONA" o "EXPLORANDO"
        this.timerEstado = 2.0 + Math.random() * 4.0;
        this.objetivo = [...this.pos];
        this.tailPhase = Math.random() * Math.PI * 2;
        this.tailSpeed = 9.0;
        this.bankAngle = 0.0;
        this.frecuenciaOcultarse = 0.35 + Math.random() * 0.3;
    }

    actualizar(dt, tiempoTotal) {
        this.timerEstado -= dt;
        if (this.timerEstado <= 0) {
            // Alternar entre quedarse en los tentáculos o salir a curiosear
            if (this.estado === "EN_ANEMONA") {
                this.estado = "EXPLORANDO";
                this.timerEstado = 3.5 + Math.random() * 4.0;
                // Radio de exploración de hasta 1.8 metros alrededor del arrecife
                const ang = Math.random() * Math.PI * 2;
                const rExplor = 0.8 + Math.random() * 1.1;
                this.objetivo = [
                    this.basePos[0] + Math.cos(ang) * rExplor,
                    this.basePos[1] + 0.4 + Math.random() * 0.9,
                    this.basePos[2] + Math.sin(ang) * rExplor
                ];
            } else {
                this.estado = "EN_ANEMONA";
                this.timerEstado = 4.0 + Math.random() * 5.0;
                // Volver a ocultarse entre los tentáculos de la anémona
                const rNido = 0.15 + Math.random() * 0.35;
                const angNido = Math.random() * Math.PI * 2;
                this.objetivo = [
                    this.basePos[0] + Math.cos(angNido) * rNido,
                    this.basePos[1] + 0.15 + Math.random() * 0.25,
                    this.basePos[2] + Math.sin(angNido) * rNido
                ];
            }
        }

        // Si está en la anémona, añade un sutil balanceo simulando mecerse con los tentáculos
        let targetReal = [...this.objetivo];
        if (this.estado === "EN_ANEMONA") {
            targetReal[0] += Math.sin(tiempoTotal * 2.0 + this.id) * 0.12;
            targetReal[1] += Math.cos(tiempoTotal * 2.5 + this.id) * 0.08;
            targetReal[2] += Math.sin(tiempoTotal * 1.8 + this.id * 2) * 0.12;
        }

        const haciaObjetivo = subVec3(targetReal, this.pos);
        const dist = lengthVec3(haciaObjetivo);
        const velDeseada = dist > 0.1 ? scaleVec3(normVec3(haciaObjetivo), Math.min(dist * 1.6, 0.75)) : [0, 0, 0];

        // Suavizado de velocidad (inercia fluida de pez payaso)
        this.vel = [
            this.vel[0] + (velDeseada[0] - this.vel[0]) * Math.min(1.0, dt * 4.0),
            this.vel[1] + (velDeseada[1] - this.vel[1]) * Math.min(1.0, dt * 4.0),
            this.vel[2] + (velDeseada[2] - this.vel[2]) * Math.min(1.0, dt * 4.0)
        ];

        this.pos = addVec3(this.pos, scaleVec3(this.vel, dt));

        // Oscilación de aleta caudal activa
        const speed = lengthVec3(this.vel);
        this.tailPhase += dt * (this.tailSpeed * Math.max(0.4, speed));
        this.bankAngle = Math.sin(tiempoTotal * 3.0 + this.id) * 0.15;
    }
}

// Instanciar los 5 peces payaso territoriales
const NUM_PAYASOS = 5;
const pecesPayaso = [];
for (let i = 0; i < NUM_PAYASOS; i++) {
    pecesPayaso.push(new PezPayasoTerritorial(i));
}

// ----------------------------------------------------------------------------
// 3. TIBURÓNCIN (Patrullero Pacífico en la Capa Superior del Tanque)
// ----------------------------------------------------------------------------
const tiburon = {
    pos: [0.0, 1.8, 0.0],
    vel: [1.2, 0.0, 0.4],
    rotY: 0.0,
    rotZ: 0.0,
    scale: 0.85,
    tailPhase: 0.0,
    actualizar: function(dt, t) {
        // Trayectoria curva continua y majestuosa en la capa alta
        const posX = Math.sin(t * 0.28) * 5.2;
        const posZ = Math.cos(t * 0.42) * 3.2;
        const posY = 1.7 + Math.sin(t * 0.22) * 0.40;

        // Derivada analítica exacta de la velocidad instantánea
        const vx = 5.2 * 0.28 * Math.cos(t * 0.28);
        const vz = -3.2 * 0.42 * Math.sin(t * 0.42);
        const vy = 0.40 * 0.22 * Math.cos(t * 0.22);

        this.pos = [posX, posY, posZ];
        this.vel = [vx, vy, vz];

        // Orientación DE FRENTE hacia el avance (hocico siempre por delante)
        const targetRotY = Math.atan2(vz, vx);
        let diffY = targetRotY - this.rotY;
        while (diffY < -Math.PI) diffY += Math.PI * 2;
        while (diffY > Math.PI) diffY -= Math.PI * 2;
        this.rotY += diffY * Math.min(1.0, dt * 4.0);

        // Inclinación de cabeceo (Pitch) al subir y bajar
        const horizDist = Math.hypot(vx, vz);
        const targetRotZ = Math.atan2(vy, Math.max(0.001, horizDist));
        this.rotZ += (targetRotZ - this.rotZ) * Math.min(1.0, dt * 3.5);

        // Balanceo potente y majestuoso de aleta caudal heterocerca
        this.tailPhase += dt * (2.8 + horizDist * 1.2);
    }
};

// ----------------------------------------------------------------------------
// 4. MEDUSA BIOLUMINISCENTE (Desplazamiento Dinámico y Tentáculos Vivos)
// ----------------------------------------------------------------------------
const medusa = {
    pos: [3.5, 0.5, 1.2],
    vel: [0.0, 0.0, 0.0],
    scale: 0.68,
    pulsePhase: 0.0,
    deformY: 1.0,
    deformXZ: 1.0,
    rotY: 0.0,
    tiltAngle: 0.0,
    puntosRuta: [
        [ 4.5,  0.8,  1.6],
        [ 1.5,  1.3, -2.0],
        [-2.8,  0.4, -2.2],
        [-4.8,  1.0,  0.8],
        [-1.8, -0.3,  2.2],
        [ 2.2,  0.5,  0.5]
    ],
    indiceRuta: 0,
    actualizar: function(dt, t) {
        // Ciclo biológico de pulsación: propulsión y planeo
        this.pulsePhase += dt * 2.2;
        const fase = this.pulsePhase % (Math.PI * 2);

        // 1. Contracción elástica de la campana
        const pulso = Math.sin(fase);
        if (pulso > 0) {
            // Golpe de propulsión: la campana se contrae (se estrecha y estira hacia arriba)
            const power = Math.pow(pulso, 1.8);
            this.deformXZ = 1.0 - power * 0.28;
            this.deformY  = 1.0 + power * 0.35;
        } else {
            // Relajación: la campana se abre ancha como paraguas y planea
            const relax = Math.pow(-pulso, 1.4);
            this.deformXZ = 1.0 + relax * 0.16;
            this.deformY  = 1.0 - relax * 0.12;
        }

        // 2. Desplazamiento activo por el acuario (navega de punto a punto)
        const destino = this.puntosRuta[this.indiceRuta];
        const haciaDestino = subVec3(destino, this.pos);
        const dist = lengthVec3(haciaDestino);
        if (dist < 1.3) {
            this.indiceRuta = (this.indiceRuta + 1) % this.puntosRuta.length;
        }

        const dirDeseada = normVec3(haciaDestino);

        // Impulso propulsivo: empuja hacia adelante en cada contracción
        const empuje = Math.pow(Math.max(0.0, Math.sin(fase)), 3.0) * 0.90;
        const velObjetivo = empuje + 0.12;

        const targetVel = scaleVec3(dirDeseada, velObjetivo);
        this.vel[0] += (targetVel[0] - this.vel[0]) * Math.min(1.0, dt * 2.8);
        this.vel[1] += (targetVel[1] - this.vel[1]) * Math.min(1.0, dt * 2.8);
        this.vel[2] += (targetVel[2] - this.vel[2]) * Math.min(1.0, dt * 2.8);

        // Integrar movimiento en el agua
        this.pos = addVec3(this.pos, scaleVec3(this.vel, dt));

        // Orientación: erguida en VERTICAL con sutil inclinación hacia el rumbo de avance
        const targetRotY = Math.atan2(dirDeseada[2], dirDeseada[0]);
        let diffY = targetRotY - this.rotY;
        while (diffY < -Math.PI) diffY += Math.PI * 2;
        while (diffY > Math.PI) diffY -= Math.PI * 2;
        this.rotY += diffY * Math.min(1.0, dt * 2.0);

        // Inclinación hacia adelante dependiente de la velocidad de nado (máx 14 grados)
        const speed = lengthVec3(this.vel);
        const targetTilt = Math.min(0.25, speed * 0.22);
        this.tiltAngle += (targetTilt - this.tiltAngle) * Math.min(1.0, dt * 3.0);
    }
};

// ----------------------------------------------------------------------------
// 5. TORTUGA MARINA (Planeo Solemne de Piedra en Piedra en el Fondo)
// ----------------------------------------------------------------------------
const tortuga = {
    pos: [2.5, -TANK_HEIGHT / 2 + 0.65, 1.5],
    vel: [0.5, 0.0, 0.0],
    rotY: 0.0,
    rotZ: 0.0,
    flipperAngle: 0.0,
    scale: 0.72,
    puntosRuta: [
        [ 3.8, -TANK_HEIGHT / 2 + 0.65,  1.8],
        [ 1.2, -TANK_HEIGHT / 2 + 0.75, -2.2],
        [-1.8, -TANK_HEIGHT / 2 + 0.60,  2.0],
        [-3.2, -TANK_HEIGHT / 2 + 0.70, -0.5],
        [ 0.0, -TANK_HEIGHT / 2 + 0.65,  0.0]
    ],
    indiceRuta: 0,
    actualizar: function(dt, t) {
        const destino = this.puntosRuta[this.indiceRuta];
        const haciaDestino = subVec3(destino, this.pos);
        const dist = lengthVec3(haciaDestino);

        if (dist < 1.1) {
            this.indiceRuta = (this.indiceRuta + 1) % this.puntosRuta.length;
        }

        const dir = normVec3(haciaDestino);
        const velCrucero = 0.55;
        this.vel = scaleVec3(dir, velCrucero);
        this.pos = addVec3(this.pos, scaleVec3(this.vel, dt));

        // Rotación orientada DE FRENTE hacia el destino
        const targetRotY = Math.atan2(dir[2], dir[0]);
        let diffY = targetRotY - this.rotY;
        while (diffY < -Math.PI) diffY += Math.PI * 2;
        while (diffY > Math.PI) diffY -= Math.PI * 2;
        this.rotY += diffY * Math.min(1.0, dt * 2.5);

        // Cabeceo suave al subir o bajar entre las rocas
        const horizDist = Math.hypot(dir[0], dir[2]);
        const targetRotZ = Math.atan2(dir[1], Math.max(0.001, horizDist));
        this.rotZ += (targetRotZ - this.rotZ) * Math.min(1.0, dt * 2.0);

        // Aleteo rítmico de aletas delanteras (alas submarinas)
        this.flipperAngle = Math.sin(t * 2.2) * 0.42;
    }
};

// ----------------------------------------------------------------------------
// 6. CARDUMEN CENTRAL (22 Peces Boids Pacíficos: Cirujanos Azules y Ángel Líder)
// ----------------------------------------------------------------------------
const NUM_PECES_CENTRALES = 22;
const cardumen = [];
for (let i = 0; i < NUM_PECES_CENTRALES; i++) {
    const tipo = i === 0 ? 2 : 1; // 0 es Líder Ángel Dorado, resto Cirujanos Azules (Dory)
    const px = (Math.random() - 0.5) * (TANK_WIDTH - 4.0);
    const py = (Math.random() - 0.5) * (TANK_HEIGHT - 3.0);
    const pz = (Math.random() - 0.5) * (TANK_DEPTH - 3.5);
    const vx = (Math.random() - 0.5) * 1.1;
    const vy = (Math.random() - 0.5) * 0.30;
    const vz = (Math.random() - 0.5) * 1.1;
    cardumen.push(new PezBoid(i, tipo, [px, py, pz], normVec3([vx, vy, vz])));
}

// Actualizar contador visual de habitantes
const lblPeces = document.getElementById("lblPeces");
if (lblPeces) {
    lblPeces.textContent = `${cardumen.length + pecesPayaso.length + 3} criaturas`;
}

// ----------------------------------------------------------------------------
// 7. SISTEMA DE BURBUJAS DE AIRE ASCENDENTES
// ----------------------------------------------------------------------------
const NUM_BURBUJAS = 45;
const burbujas = [];
for (let i = 0; i < NUM_BURBUJAS; i++) {
    burbujas.push({
        x: (Math.random() - 0.5) * (TANK_WIDTH - 2.0),
        y: -TANK_HEIGHT / 2 + Math.random() * TANK_HEIGHT,
        z: (Math.random() - 0.5) * (TANK_DEPTH - 2.0),
        speed: 0.8 + Math.random() * 0.9,
        oscFreq: 2.2 + Math.random() * 2.8,
        oscAmp: 0.045 + Math.random() * 0.035,
        scale: 0.45 + Math.random() * 0.55,
        seed: Math.random() * 10.0
    });
}

// Se eliminan por completo las partículas oscuras del suelo (círculos negros)
const plancton = [];

// ----------------------------------------------------------------------------
// 8. ROCAS Y ARRECIFES DISTRIBUIDOS EN EL GRAN TANQUE (14x7x9)
// ----------------------------------------------------------------------------
const rocas = [
    // Hábitat Arrecife / Anémona (Lado Izquierdo)
    { pos: [-4.2, -TANK_HEIGHT / 2 + 0.40, -1.8], scale: [1.8, 0.75, 1.8], rotY: 0.4 },
    { pos: [-4.8, -TANK_HEIGHT / 2 + 0.55, -1.2], scale: [1.3, 1.10, 1.2], rotY: 1.2 },
    { pos: [-3.5, -TANK_HEIGHT / 2 + 0.45, -2.2], scale: [1.2, 0.90, 1.4], rotY: 2.3 },
    // Centro
    { pos: [ 0.2, -TANK_HEIGHT / 2 + 0.35, -2.6], scale: [1.5, 0.70, 1.2], rotY: 1.7 },
    { pos: [-0.8, -TANK_HEIGHT / 2 + 0.40,  2.2], scale: [1.3, 0.85, 1.1], rotY: 0.8 },
    // Arrecife Derecho
    { pos: [ 3.8, -TANK_HEIGHT / 2 + 0.50,  1.8], scale: [1.9, 1.00, 1.7], rotY: 2.1 },
    { pos: [ 4.6, -TANK_HEIGHT / 2 + 0.40,  0.8], scale: [1.4, 0.80, 1.3], rotY: 0.6 },
    { pos: [ 3.2, -TANK_HEIGHT / 2 + 0.35, -2.0], scale: [1.5, 0.70, 1.4], rotY: 1.5 }
];

// ----------------------------------------------------------------------------
// 9. BOSQUES DE ALGAS MARINAS (Kelp)
// ----------------------------------------------------------------------------
const algas = [
    // Algas cerca del hábitat payaso
    { pos: [-5.2, -TANK_HEIGHT / 2 + 0.05, -1.6], altura: 1.25, fase: 0.0, vel: 1.5 },
    { pos: [-4.6, -TANK_HEIGHT / 2 + 0.05, -2.5], altura: 1.10, fase: 1.2, vel: 1.7 },
    { pos: [-3.3, -TANK_HEIGHT / 2 + 0.05, -2.6], altura: 1.30, fase: 2.4, vel: 1.4 },
    // Algas centrales
    { pos: [ 0.0, -TANK_HEIGHT / 2 + 0.05, -2.8], altura: 1.20, fase: 1.5, vel: 1.6 },
    { pos: [-0.5, -TANK_HEIGHT / 2 + 0.05,  2.4], altura: 1.05, fase: 2.8, vel: 1.8 },
    // Algas arrecife derecho
    { pos: [ 4.2, -TANK_HEIGHT / 2 + 0.05,  2.2], altura: 1.35, fase: 0.8, vel: 1.5 },
    { pos: [ 4.8, -TANK_HEIGHT / 2 + 0.05,  0.6], altura: 1.15, fase: 2.1, vel: 1.6 },
    { pos: [ 3.6, -TANK_HEIGHT / 2 + 0.05, -2.2], altura: 1.20, fase: 3.1, vel: 1.7 }
];
