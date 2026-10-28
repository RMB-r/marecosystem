// ============================================================================
// SCRIPT 8 - PASO 4 Y 16: RENDER LOOP PRINCIPAL Y ORQUESTACIÓN DEL MINI MOTOR
// Mini Motor Gráfico - Acuario Marino 3D (Ecosistema Marino Completo)
// Ciclo de animación continuo + Ciclos Día/Tarde/Noche + Renderizado Multicriatura
// ============================================================================

"use strict";

let tiempoAnterior = 0;
let contadorFPS = 0;
let acumuladorTiempoFPS = 0;

// Presets de iluminación para el ciclo Día, Tarde y Noche
const configLuz = [
    {
        // 0: DÍA (Sol Cenital Brillante)
        lightPos: [0.0, TANK_HEIGHT / 2 + 3.5, 0.0],
        lightColor: [1.35, 1.40, 1.45],
        ambientColor: [0.09, 0.25, 0.44],
        fogColor: [0.015, 0.08, 0.20],
        causticIntensity: 1.0,
        clearColor: [0.010, 0.055, 0.14, 1.0]
    },
    {
        // 1: TARDE (Atardecer Dorado y Cálido)
        lightPos: [-TANK_WIDTH / 2 - 1.0, TANK_HEIGHT / 2 + 1.5, -2.5],
        lightColor: [1.45, 0.95, 0.52],
        ambientColor: [0.12, 0.16, 0.32],
        fogColor: [0.035, 0.065, 0.15],
        causticIntensity: 0.65,
        clearColor: [0.020, 0.035, 0.09, 1.0]
    },
    {
        // 2: NOCHE (Luz Lunar y Resplandor Bioluminiscente)
        lightPos: [2.5, TANK_HEIGHT / 2 + 2.0, 2.0],
        lightColor: [0.35, 0.50, 0.90],
        ambientColor: [0.012, 0.032, 0.08],
        fogColor: [0.005, 0.015, 0.04],
        causticIntensity: 0.18,
        clearColor: [0.002, 0.008, 0.020, 1.0]
    }
];

function render(tiempoActualMS) {
    const tiempoSegundos = tiempoActualMS * 0.001;
    let deltaTime = tiempoSegundos - tiempoAnterior;
    tiempoAnterior = tiempoSegundos;
    if (deltaTime > 0.1 || deltaTime <= 0) deltaTime = 0.016;

    // 1. Contador de FPS
    contadorFPS++;
    acumuladorTiempoFPS += deltaTime;
    if (acumuladorTiempoFPS >= 0.5) {
        const fpsEl = document.getElementById("lblFps");
        if (fpsEl) fpsEl.textContent = Math.round(contadorFPS / acumuladorTiempoFPS);
        contadorFPS = 0;
        acumuladorTiempoFPS = 0;
    }

    // 2. Gestión de Alimento
    if (tiempoAlimentoRestante > 0) {
        tiempoAlimentoRestante -= deltaTime;
        puntoAlimento[1] -= deltaTime * 0.40;
        if (tiempoAlimentoRestante <= 0 || puntoAlimento[1] < -TANK_HEIGHT / 2 + 0.25) {
            puntoAlimento = null;
        }
    }

    // 3. Actualizar el Cardumen Pacífico Central (Boids)
    const limitesTanque = { w: TANK_WIDTH, h: TANK_HEIGHT, d: TANK_DEPTH };
    for (let pez of cardumen) {
        pez.flock(cardumen);
        pez.actualizar(deltaTime, limitesTanque, puntoAlimento);
    }

    // 4. Actualizar los 5 Peces Payaso Territoriales en su Hábitat
    for (let payaso of pecesPayaso) {
        payaso.actualizar(deltaTime, tiempoSegundos);
    }

    // 5. Actualizar las Criaturas Principales
    tiburon.actualizar(deltaTime, tiempoSegundos);
    medusa.actualizar(deltaTime, tiempoSegundos);
    tortuga.actualizar(deltaTime, tiempoSegundos);

    // 6. Actualizar Burbujas de Aire
    for (let b of burbujas) {
        b.y += b.speed * deltaTime;
        if (b.y > TANK_HEIGHT / 2 - 0.2) {
            b.y = -TANK_HEIGHT / 2 + 0.15;
            b.x = (Math.random() - 0.5) * (TANK_WIDTH - 2.0);
            b.z = (Math.random() - 0.5) * (TANK_DEPTH - 2.0);
        }
    }

    // 7. Configuración de Cámara (View y Projection)
    let eye, target, up = [0, 1, 0];

    if (modoCamara === 1 || modoCamara === 2) {
        const cosP = Math.cos(camPhi);
        eye = [
            camRadio * Math.sin(camTheta) * cosP,
            camRadio * Math.sin(camPhi),
            camRadio * Math.cos(camTheta) * cosP
        ];
        target = [0, -0.2, 0];
    } else if (modoCamara === 3) {
        // Seguimiento del Pez Líder
        const pezLider = cardumen[0];
        const dir = normVec3(pezLider.vel);
        eye = subVec3(pezLider.pos, scaleVec3(dir, 1.8));
        eye[1] += 0.55;
        target = addVec3(pezLider.pos, scaleVec3(dir, 1.2));
    } else {
        // Modo 4: Seguimiento cinematográfico del Tiburón
        const dirTib = normVec3(tiburon.vel);
        eye = subVec3(tiburon.pos, scaleVec3(dirTib, 3.2));
        eye[1] += 0.8;
        target = addVec3(tiburon.pos, scaleVec3(dirTib, 1.5));
    }

    const viewMatrix = matrizLookAt(eye, target, up);
    const projMatrix = matrizPerspectiva(
        50 * Math.PI / 180,
        canvas.width / canvas.height,
        0.1,
        100.0
    );

    // 8. Limpieza de Pantalla según momento del día
    const lCfg = configLuz[cicloIluminacion] || configLuz[0];
    gl.clearColor(lCfg.clearColor[0], lCfg.clearColor[1], lCfg.clearColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 9. Activar Programa de Shaders e Iluminación Global
    gl.useProgram(mainProgram);
    gl.uniformMatrix4fv(mainLocs.uViewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mainLocs.uProjectionMatrix, false, projMatrix);
    gl.uniform3fv(mainLocs.uCameraPos, eye);
    gl.uniform1f(mainLocs.uTime, tiempoSegundos);

    // Parámetros de Iluminación del Ciclo Horario
    gl.uniform3fv(mainLocs.uLightPos, lCfg.lightPos);
    gl.uniform3fv(mainLocs.uLightColor, lCfg.lightColor);
    gl.uniform3fv(mainLocs.uAmbientColor, lCfg.ambientColor);
    gl.uniform3fv(mainLocs.uFogColor, lCfg.fogColor);
    gl.uniform1f(mainLocs.uCausticIntensity, lCfg.causticIntensity);
    gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

    // ------------------------------------------------------------------------
    // A. DIBUJAR SUELO DE ARENA MARINA
    // ------------------------------------------------------------------------
    {
        const model = matrizTraslacion4(0.0, -TANK_HEIGHT / 2 + 0.02, 0.0);
        const normMat = matrizNormal3(model);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMat);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.uniform1f(mainLocs.uShininess, 16.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.20);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texArena);
        gl.uniform1i(mainLocs.uTexture, 0);

        gl.bindVertexArray(meshSuelo.vao);
        gl.drawElements(gl.TRIANGLES, meshSuelo.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // ------------------------------------------------------------------------
    // B. DIBUJAR ROCAS Y ARRECIFES DISTRIBUIDOS
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texRoca);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(mainLocs.uShininess, 24.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.28);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        gl.bindVertexArray(meshRoca.vao);
        for (let r of rocas) {
            const T = matrizTraslacion4(r.pos[0], r.pos[1], r.pos[2]);
            const Ry = matrizRotacionY(r.rotY);
            const S = matrizEscala4(r.scale[0], r.scale[1], r.scale[2]);
            const model = multiplicarMat4(T, multiplicarMat4(Ry, S));
            const normMat = matrizNormal3(model);

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, normMat);
            gl.drawElements(gl.TRIANGLES, meshRoca.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // C. DIBUJAR HÁBITAT DE PECES PAYASO (Anémonas y Corales Vivos)
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texCoral);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.1, 1.0, 1.15, 1.0);
        gl.uniform1f(mainLocs.uShininess, 36.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.45);

        // Bioluminiscencia suave en la noche
        if (cicloIluminacion === 2) {
            gl.uniform3f(mainLocs.uEmissive, 0.18, 0.06, 0.32);
        } else {
            gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);
        }

        gl.bindVertexArray(meshAnemona.vao);

        // Anémona principal del nido
        {
            const T = matrizTraslacion4(HABITAT_ANEMONA[0], HABITAT_ANEMONA[1], HABITAT_ANEMONA[2]);
            const S = matrizEscala4(1.35, 1.20, 1.35);
            const model = multiplicarMat4(T, S);
            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
            gl.drawElements(gl.TRIANGLES, meshAnemona.numElements, gl.UNSIGNED_SHORT, 0);
        }

        // Anémona satélite vecina
        {
            const T = matrizTraslacion4(HABITAT_ANEMONA[0] + 0.9, HABITAT_ANEMONA[1] - 0.1, HABITAT_ANEMONA[2] + 0.6);
            const Ry = matrizRotacionY(1.4);
            const S = matrizEscala4(1.0, 0.95, 1.0);
            const model = multiplicarMat4(T, multiplicarMat4(Ry, S));
            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
            gl.drawElements(gl.TRIANGLES, meshAnemona.numElements, gl.UNSIGNED_SHORT, 0);
        }

        // Coral adyacente
        {
            const T = matrizTraslacion4(HABITAT_ANEMONA[0] - 0.7, HABITAT_ANEMONA[1] - 0.05, HABITAT_ANEMONA[2] - 0.5);
            const Ry = matrizRotacionY(2.8);
            const S = matrizEscala4(0.85, 1.10, 0.85);
            const model = multiplicarMat4(T, multiplicarMat4(Ry, S));
            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
            gl.drawElements(gl.TRIANGLES, meshAnemona.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // D. DIBUJAR LOS 5 PECES PAYASO EN SU HÁBITAT
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texPezPayaso);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(mainLocs.uShininess, 48.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.60);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        for (let payaso of pecesPayaso) {
            const T = matrizTraslacion4(payaso.pos[0], payaso.pos[1], payaso.pos[2]);
            const R_orient = matrizOrientacionHacia(payaso.vel);
            const R_bank = matrizRotacionX(payaso.bankAngle);
            const S = matrizEscala4(payaso.scale, payaso.scale, payaso.scale);
            const modelCuerpo = multiplicarMat4(T, multiplicarMat4(R_orient, multiplicarMat4(R_bank, S)));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCuerpo);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelCuerpo));

            // Cuerpo del Pez Payaso
            gl.bindVertexArray(meshPez.vao);
            gl.drawElements(gl.TRIANGLES, meshPez.numElements, gl.UNSIGNED_SHORT, 0);

            // Aleta Caudal articulada
            const anguloCola = Math.sin(payaso.tailPhase) * 0.55;
            const T_offset = matrizTraslacion4(-0.65, 0.0, 0.0);
            const R_cola = matrizRotacionY(anguloCola);
            const modelCola = multiplicarMat4(modelCuerpo, multiplicarMat4(T_offset, R_cola));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCola);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelCola));

            gl.bindVertexArray(meshCola.vao);
            gl.drawElements(gl.TRIANGLES, meshCola.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // E. DIBUJAR CARDUMEN PACÍFICO CENTRAL (Cirujanos Azules y Ángel Dorado)
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.uniform1f(mainLocs.uShininess, 48.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.65);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        for (let pez of cardumen) {
            const T = matrizTraslacion4(pez.pos[0], pez.pos[1], pez.pos[2]);
            const R_orient = matrizOrientacionHacia(pez.vel);
            const R_bank = matrizRotacionX(pez.bankAngle);
            const S = matrizEscala4(pez.scale, pez.scale, pez.scale);
            const modelCuerpo = multiplicarMat4(T, multiplicarMat4(R_orient, multiplicarMat4(R_bank, S)));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCuerpo);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelCuerpo));

            gl.activeTexture(gl.TEXTURE0);
            if (pez.tipo === 2) {
                gl.bindTexture(gl.TEXTURE_2D, texPezDorado);
                gl.uniform4f(mainLocs.uBaseColor, 1.15, 1.10, 1.0, 1.0);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, texPezAzul);
                gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
            }
            gl.uniform1i(mainLocs.uTexture, 0);

            // Cuerpo
            gl.bindVertexArray(meshPez.vao);
            gl.drawElements(gl.TRIANGLES, meshPez.numElements, gl.UNSIGNED_SHORT, 0);

            // Cola articulada
            const anguloCola = Math.sin(pez.tailPhase) * 0.50;
            const T_offset = matrizTraslacion4(-0.65, 0.0, 0.0);
            const R_cola = matrizRotacionY(anguloCola);
            const modelCola = multiplicarMat4(modelCuerpo, multiplicarMat4(T_offset, R_cola));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCola);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelCola));

            gl.bindVertexArray(meshCola.vao);
            gl.drawElements(gl.TRIANGLES, meshCola.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // F. DIBUJAR TIBURÓNCIN (Capa Superior del Tanque)
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texTiburon);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(mainLocs.uShininess, 55.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.70);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        const T = matrizTraslacion4(tiburon.pos[0], tiburon.pos[1], tiburon.pos[2]);
        const Ry = matrizRotacionY(tiburon.rotY);
        const Rz = matrizRotacionZ(tiburon.rotZ);
        const S = matrizEscala4(tiburon.scale, tiburon.scale, tiburon.scale);
        const modelTiburon = multiplicarMat4(T, multiplicarMat4(Ry, multiplicarMat4(Rz, S)));

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelTiburon);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelTiburon));

        // Cuerpo del tiburón
        gl.bindVertexArray(meshTiburon.vao);
        gl.drawElements(gl.TRIANGLES, meshTiburon.numElements, gl.UNSIGNED_SHORT, 0);

        // Cola heterocerca articulada
        const anguloColaTib = Math.sin(tiburon.tailPhase) * 0.38;
        const T_colaTib = matrizTraslacion4(-1.30, 0.0, 0.0);
        const R_colaTib = matrizRotacionY(anguloColaTib);
        const modelColaTib = multiplicarMat4(modelTiburon, multiplicarMat4(T_colaTib, R_colaTib));

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelColaTib);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelColaTib));

        gl.bindVertexArray(meshColaTiburon.vao);
        gl.drawElements(gl.TRIANGLES, meshColaTiburon.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // ------------------------------------------------------------------------
    // G. DIBUJAR MEDUSA BIOLUMINISCENTE (Vertical, Nado Pulsante y Tentáculos Dinámicos)
    // ------------------------------------------------------------------------
    {
        // Actualizar dinámicamente la ondulación y arrastre de tentáculos en GPU
        actualizarTentaculosMedusaDinamica(gl, meshTentaculosMedusa, medusa.pulsePhase, medusa.vel);

        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texMedusa);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 0.92);
        gl.uniform1f(mainLocs.uShininess, 75.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.85);

        // Bioluminiscencia intensa en la noche
        if (cicloIluminacion === 2) {
            gl.uniform3f(mainLocs.uEmissive, 0.25, 0.65, 0.90);
        } else if (cicloIluminacion === 1) {
            gl.uniform3f(mainLocs.uEmissive, 0.15, 0.35, 0.50);
        } else {
            gl.uniform3f(mainLocs.uEmissive, 0.08, 0.18, 0.25);
        }

        // Posición y orientación erguida en vertical con suave inclinación hacia el rumbo de nado
        const T = matrizTraslacion4(medusa.pos[0], medusa.pos[1], medusa.pos[2]);
        const Ry = matrizRotacionY(medusa.rotY);
        const Rz = matrizRotacionZ(-medusa.tiltAngle);
        const R_orient = multiplicarMat4(Ry, Rz);

        // 1. Dibujar Campana de la Medusa (contracción y expansión biológica)
        const S_campana = matrizEscala4(
            medusa.scale * medusa.deformXZ,
            medusa.scale * medusa.deformY,
            medusa.scale * medusa.deformXZ
        );
        const modelCampana = multiplicarMat4(T, multiplicarMat4(R_orient, S_campana));

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelCampana);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelCampana));

        gl.bindVertexArray(meshCampanaMedusa.vao);
        gl.drawElements(gl.TRIANGLES, meshCampanaMedusa.numElements, gl.UNSIGNED_SHORT, 0);

        // 2. Dibujar Tentáculos Dinámicos Ondulantes en Tiempo Real
        const S_tent = matrizEscala4(medusa.scale, medusa.scale, medusa.scale);
        const modelTent = multiplicarMat4(T, multiplicarMat4(R_orient, S_tent));

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelTent);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelTent));

        gl.bindVertexArray(meshTentaculosMedusa.vao);
        gl.drawElements(gl.TRIANGLES, meshTentaculosMedusa.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // ------------------------------------------------------------------------
    // H. DIBUJAR TORTUGA MARINA (Capa Inferior de Frente y Aleteo de Aletas)
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texTortuga);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(mainLocs.uShininess, 42.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.40);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        const T = matrizTraslacion4(tortuga.pos[0], tortuga.pos[1], tortuga.pos[2]);
        const Ry = matrizRotacionY(tortuga.rotY);
        const Rz = matrizRotacionZ(tortuga.rotZ);
        const S = matrizEscala4(tortuga.scale, tortuga.scale, tortuga.scale);
        const modelTortuga = multiplicarMat4(T, multiplicarMat4(Ry, multiplicarMat4(Rz, S)));

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelTortuga);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelTortuga));

        // Caparazón y cabeza
        gl.bindVertexArray(meshTortuga.vao);
        gl.drawElements(gl.TRIANGLES, meshTortuga.numElements, gl.UNSIGNED_SHORT, 0);

        // Aleta delantera derecha (aletea hacia abajo y arriba)
        {
            const T_aletaDer = matrizTraslacion4(0.40, -0.05, 0.38);
            const Rx_aletaDer = matrizRotacionX(tortuga.flipperAngle);
            const modelAletaDer = multiplicarMat4(modelTortuga, multiplicarMat4(T_aletaDer, Rx_aletaDer));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelAletaDer);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelAletaDer));

            gl.bindVertexArray(meshAletaTortuga.vao);
            gl.drawElements(gl.TRIANGLES, meshAletaTortuga.numElements, gl.UNSIGNED_SHORT, 0);
        }

        // Aleta delantera izquierda (espejada)
        {
            const T_aletaIzq = matrizTraslacion4(0.40, -0.05, -0.38);
            const Rx_aletaIzq = matrizRotacionX(-tortuga.flipperAngle);
            const S_espejo = matrizEscala4(1.0, 1.0, -1.0);
            const modelAletaIzq = multiplicarMat4(modelTortuga, multiplicarMat4(T_aletaIzq, multiplicarMat4(Rx_aletaIzq, S_espejo)));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, modelAletaIzq);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(modelAletaIzq));

            gl.bindVertexArray(meshAletaTortuga.vao);
            gl.drawElements(gl.TRIANGLES, meshAletaTortuga.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // I. DIBUJAR BOSQUE DE ALGAS MARINAS (Oscilación orgánica)
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texAlga);
        gl.uniform1i(mainLocs.uTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 0.95, 1.10, 0.95, 0.95);
        gl.uniform1f(mainLocs.uShininess, 32.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.35);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        gl.bindVertexArray(meshAlga.vao);
        for (let a of algas) {
            const oscZ = Math.sin(tiempoSegundos * a.vel + a.fase) * 0.16;
            const oscX = Math.cos(tiempoSegundos * (a.vel * 0.8) + a.fase) * 0.08;

            const T = matrizTraslacion4(a.pos[0], a.pos[1], a.pos[2]);
            const Rz = matrizRotacionZ(oscZ);
            const Rx = matrizRotacionX(oscX);
            const S = matrizEscala4(1.0, a.altura, 1.0);
            const model = multiplicarMat4(T, multiplicarMat4(multiplicarMat4(Rz, Rx), S));

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
            gl.drawElements(gl.TRIANGLES, meshAlga.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // J. DIBUJAR BURBUJAS DE AIRE
    // ------------------------------------------------------------------------
    {
        gl.uniform1i(mainLocs.uUseTexture, 0);
        gl.uniform4f(mainLocs.uBaseColor, 0.65, 0.92, 1.0, 0.40);
        gl.uniform1f(mainLocs.uShininess, 90.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.95);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        gl.bindVertexArray(meshBurbuja.vao);
        for (let b of burbujas) {
            const ox = b.x + Math.sin(tiempoSegundos * b.oscFreq + b.seed) * b.oscAmp;
            const oz = b.z + Math.cos(tiempoSegundos * b.oscFreq + b.seed) * b.oscAmp;
            const T = matrizTraslacion4(ox, b.y, oz);
            const S = matrizEscala4(b.scale, b.scale, b.scale);
            const model = multiplicarMat4(T, S);

            gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
            gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
            gl.drawElements(gl.TRIANGLES, meshBurbuja.numElements, gl.UNSIGNED_SHORT, 0);
        }
    }

    // ------------------------------------------------------------------------
    // K. DIBUJAR ALIMENTO SI ESTÁ CAYENDO
    // ------------------------------------------------------------------------
    if (puntoAlimento) {
        const T = matrizTraslacion4(puntoAlimento[0], puntoAlimento[1], puntoAlimento[2]);
        const S = matrizEscala4(0.12, 0.12, 0.12);
        const model = multiplicarMat4(T, S);

        gl.uniformMatrix4fv(mainLocs.uModelMatrix, false, model);
        gl.uniformMatrix3fv(mainLocs.uNormalMatrix, false, matrizNormal3(model));
        gl.uniform4f(mainLocs.uBaseColor, 1.0, 0.25, 0.1, 1.0);
        gl.uniform1f(mainLocs.uShininess, 20.0);
        gl.uniform1f(mainLocs.uSpecularPower, 0.3);
        gl.uniform3f(mainLocs.uEmissive, 0.0, 0.0, 0.0);

        gl.bindVertexArray(meshBurbuja.vao);
        gl.drawElements(gl.TRIANGLES, meshBurbuja.numElements, gl.UNSIGNED_SHORT, 0);
    }

    // ------------------------------------------------------------------------
    // L. DIBUJAR LÍMITES DEL TANQUE DE CRISTAL
    // ------------------------------------------------------------------------
    if (mostrarLimitesTanque) {
        gl.useProgram(lineProgram);
        gl.uniformMatrix4fv(lineLocs.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(lineLocs.uProjectionMatrix, false, projMatrix);
        gl.uniformMatrix4fv(lineLocs.uModelMatrix, false, matrizIdentidad4());
        gl.uniform4f(lineLocs.uLineColor, 0.25, 0.75, 1.0, 0.40);

        gl.bindVertexArray(meshTanque.vao);
        gl.drawArrays(gl.LINES, 0, meshTanque.count);
    }

    requestAnimationFrame(render);
}

// Iniciar el Render Loop
requestAnimationFrame(render);
