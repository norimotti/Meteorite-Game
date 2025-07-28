import { mat4 } from './utils.js';
import {
    objectVertexShaderSource,
    objectFragmentShaderSource,
    skyboxVertexShaderSource,
    skyboxFragmentShaderSource
} from './shaders.js';
import { keys, initInputHandlers, yaw, pitch } from './input.js';
import { initWebGL, createProgram } from './webgl.js';
import { Player } from './player.js';
import { Ball } from './ball.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        this.gl = initWebGL(this.canvas);
        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.render = this.render.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);
        initInputHandlers(this.canvas);

        this.objectProgram = createProgram(this.gl, objectVertexShaderSource, objectFragmentShaderSource);
        this.skyboxProgram = createProgram(this.gl, skyboxVertexShaderSource, skyboxFragmentShaderSource);

        this.objectPositionAttributeLocation = this.gl.getAttribLocation(this.objectProgram, 'aPosition');
        this.objectColorAttributeLocation = this.gl.getAttribLocation(this.objectProgram, 'aColor');
        this.objectViewProjectionMatrixLocation = this.gl.getUniformLocation(this.objectProgram, 'uViewProjectionMatrix');
        this.objectModelMatrixLocation = this.gl.getUniformLocation(this.objectProgram, 'uModelMatrix');
        this.objectAlphaUniformLocation = this.gl.getUniformLocation(this.objectProgram, 'uAlpha');

        this.skyboxPositionAttributeLocation = this.gl.getAttribLocation(this.skyboxProgram, 'aPosition');
        this.skyboxViewMatrixLocation = this.gl.getUniformLocation(this.skyboxProgram, 'uViewMatrix');
        this.skyboxProjectionMatrixLocation = this.gl.getUniformLocation(this.skyboxProgram, 'uProjectionMatrix');

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.initGround();
        this.initSkybox();

        this.player = new Player(this.gl);
        this.balls = [];
        this.phase = 1;
        this.phaseTime = 30;
        this.restTime = 0;
        this.timeSincePhaseStart = 0;
        this.inRest = false;
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.restartButton = document.getElementById('restartButton');
        this.restartButton.addEventListener('click', () => {
            this.gameOverOverlay.style.display = 'none';
            this.resetGame();
        });

        requestAnimationFrame(this.render);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    initGround() {
        const vertices = this.createCircleVertices(10.0, 64);
        this.circleVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.circleVerticesLength = vertices.length / 3;

        const groundColor = new Float32Array(vertices.length).fill(0.5);
        this.groundColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groundColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, groundColor, this.gl.STATIC_DRAW);
    }

    initSkybox() {
        const skyboxVertices = new Float32Array([
            -1,  1, -1, -1, -1, -1,  1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1,
            -1, -1,  1, -1, -1, -1, -1,  1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1,
             1, -1, -1,  1, -1,  1,  1,  1,  1,  1,  1,  1,  1,  1, -1,  1, -1, -1,
            -1, -1,  1, -1,  1,  1,  1,  1,  1,  1,  1,  1,  1, -1,  1, -1, -1,  1,
            -1,  1, -1,  1,  1, -1,  1,  1,  1,  1,  1,  1, -1,  1,  1, -1,  1, -1,
            -1, -1, -1, -1, -1,  1,  1, -1, -1,  1, -1, -1, -1, -1,  1,  1, -1,  1
        ]);
        this.skyboxBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyboxBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, skyboxVertices, this.gl.STATIC_DRAW);
        this.skyboxVerticesLength = skyboxVertices.length / 3;
    }

    createCircleVertices(radius, segments) {
        const vertices = [0.0, 0.0, 0.0];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            vertices.push(x, 0.0, z);
        }
        return new Float32Array(vertices);
    }

    createBall() {
        const groundRadius = 10.0;
        const spawnRadius = groundRadius - 1.0;
        const y = 40.0;
        const maxAttempts = 10;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spawnRadius;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const position = [x, y, z];
            const radius = 5.0;

            let overlapping = false;
            for (let ball of this.balls) {
                const dx = ball.position[0] - position[0];
                const dy = ball.position[1] - position[1];
                const dz = ball.position[2] - position[2];
                const distanceBetween = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (distanceBetween < (ball.radius + radius)) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                return new Ball(this.gl, position, radius);
            }
        }
        return null;
    }

    resetGame() {
        this.player.position = [0, 0.5, 0];
        this.player.yaw = 0;
        this.player.pitch = 0;
        this.balls = [];
        this.phase = 1;
        this.score = 0;
        this.timeSincePhaseStart = 0;
        this.inRest = false;
        yaw = 0;
        pitch = 0;
    }

    handleGameOver() {
        this.gameOverOverlay.style.display = 'flex';
    }

    render(now) {
        now *= 0.001;
        const deltaTime = now - (this.lastTime || now);
        this.lastTime = now;

        this.timeSincePhaseStart += deltaTime;
        if (this.inRest) {
            if (this.timeSincePhaseStart >= this.restTime) {
                this.timeSincePhaseStart = 0;
                this.inRest = false;
                this.phase += 1;
            }
        } else {
            if (this.timeSincePhaseStart >= this.phaseTime) {
                this.timeSincePhaseStart = 0;
                this.inRest = true;
                this.balls = [];
            } else {
                while (this.balls.length < this.phase * 5) {
                    const newBall = this.createBall();
                    if (newBall) {
                        this.balls.push(newBall);
                    } else {
                        console.warn('Failed to spawn a new ball without overlapping.');
                        break;
                    }
                }
            }
        }

        this.player.update(deltaTime, keys, yaw, pitch);

        this.balls.forEach(ball => {
            ball.update(deltaTime);
            const dx = ball.position[0] - this.player.position[0];
            const dy = ball.position[1] - this.player.position[1];
            const dz = ball.position[2] - this.player.position[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance < ball.radius + 0.0) {
                this.handleGameOver();
            }
        });

        this.balls = this.balls.filter(ball => ball.position[1] > -10);

        this.score += deltaTime * 10;
        this.scoreElement.innerText = `Score: ${Math.floor(this.score)}`;

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const fov = 60 * Math.PI / 180;
        const near = 0.1;
        const far = 100.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fov, aspect, near, far);

        const cameraFront = [
            Math.sin(yaw * Math.PI / 180) * Math.cos(pitch * Math.PI / 180),
            Math.sin(pitch * Math.PI / 180),
            Math.cos(yaw * Math.PI / 180) * Math.cos(pitch * Math.PI / 180),
        ];

        const cameraPosition = [
            this.player.position[0],
            this.player.position[1] + 2,
            this.player.position[2],
        ];

        const cameraTarget = [
            cameraPosition[0] + cameraFront[0],
            cameraPosition[1] + cameraFront[1],
            cameraPosition[2] + cameraFront[2],
        ];

        const up = [0, 1, 0];
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, up);

        // Set uniform matrices
        gl.uniformMatrix4fv(skyboxViewMatrixLocation, false, viewMatrix);
        gl.uniformMatrix4fv(skyboxProjectionMatrixLocation, false, projectionMatrix);

        // Bind skybox buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
        gl.enableVertexAttribArray(skyboxPositionAttributeLocation);
        gl.vertexAttribPointer(skyboxPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Draw skybox
        gl.depthMask(false); // Disable depth writing
        gl.drawArrays(gl.TRIANGLES, 0, skyboxVertices.length / 3);
        gl.depthMask(true); // Re-enable depth writing

        // --- Render Skybox End ---

        // Set up the view and projection matrices for objects
        // (Recalculate in case the view matrix has changed)
        mat4.perspective(projectionMatrix, fov, aspect, near, far);

        // Create viewProjectionMatrix
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

        // Use the object program for rendering objects and ground
        gl.useProgram(objectProgram);
        gl.uniformMatrix4fv(objectViewProjectionMatrixLocation, false, viewProjectionMatrix);
        gl.uniform1f(objectAlphaUniformLocation, 1.0); // Default alpha for regular objects

        // Draw the ground
        gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
        gl.enableVertexAttribArray(objectPositionAttributeLocation);
        gl.vertexAttribPointer(objectPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, groundColorBuffer);
        gl.enableVertexAttribArray(objectColorAttributeLocation);
        gl.vertexAttribPointer(objectColorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        const groundModelMatrix = mat4.create();
        mat4.identity(groundModelMatrix);

        gl.uniformMatrix4fv(objectModelMatrixLocation, false, groundModelMatrix);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length / 3);

        // Bind the cube buffers for player and balls
        gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
        gl.enableVertexAttribArray(objectPositionAttributeLocation);
        gl.vertexAttribPointer(objectPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
        gl.enableVertexAttribArray(objectColorAttributeLocation);
        gl.vertexAttribPointer(objectColorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

        player.draw(objectProgram, viewProjectionMatrix);

        // Draw the balls
        balls.forEach(ball => {
            ball.draw(objectProgram, viewProjectionMatrix);
        });

        // --- Render Shadows Start ---
        balls.forEach(ball => {
            ball.drawShadow(objectProgram, viewProjectionMatrix);
        });

        // Reset color buffer to original for further rendering
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
        gl.enableVertexAttribArray(objectColorAttributeLocation);
        gl.vertexAttribPointer(objectColorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(objectAlphaUniformLocation, 1.0); // Reset alpha

        // --- Render Shadows End ---

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}