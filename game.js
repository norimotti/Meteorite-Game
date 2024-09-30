import { mat4 } from './utils.js';
import {
    objectVertexShaderSource,
    objectFragmentShaderSource,
    skyboxVertexShaderSource,
    skyboxFragmentShaderSource
} from './shaders.js';
import { keys, initInputHandlers, yaw, pitch } from './input.js';

export function initGame() {
    // Initialize WebGL2 context
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        alert('WebGL2 is not available in your browser.');
        return;
    }

    // Resize the canvas to fill the window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize input handlers
    initInputHandlers(canvas);

    // Function to create circle vertices (for ground)
    function createCircleVertices(radius, segments) {
        const vertices = [];
        vertices.push(0.0, 0.0, 0.0);  // Center

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            vertices.push(x, 0.0, z);
        }

        return new Float32Array(vertices);
    }

    // Compile shader function
    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create shader program
    function createProgram(gl, vShaderSource, fShaderSource) {
        const vertexShader = compileShader(gl, vShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, fShaderSource, gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            console.error('Program failed to link:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    // Create shader programs
    const objectProgram = createProgram(gl, objectVertexShaderSource, objectFragmentShaderSource);
    const skyboxProgram = createProgram(gl, skyboxVertexShaderSource, skyboxFragmentShaderSource);

    if (!objectProgram || !skyboxProgram) {
        alert('Failed to initialize shaders.');
        return;
    }

    // Get attribute and uniform locations for objects
    const objectPositionAttributeLocation = gl.getAttribLocation(objectProgram, 'aPosition');
    const objectColorAttributeLocation = gl.getAttribLocation(objectProgram, 'aColor');
    const objectViewProjectionMatrixLocation = gl.getUniformLocation(objectProgram, 'uViewProjectionMatrix');
    const objectModelMatrixLocation = gl.getUniformLocation(objectProgram, 'uModelMatrix');
    const objectAlphaUniformLocation = gl.getUniformLocation(objectProgram, 'uAlpha');

    // Define data for a cube (player and balls)
    const cubeVertices = new Float32Array([
        // Front face
        -0.5, -0.5,  0.5,  // 0
         0.5, -0.5,  0.5,  // 1
         0.5,  0.5,  0.5,  // 2
        -0.5,  0.5,  0.5,  // 3
        // Back face
        -0.5, -0.5, -0.5,  // 4
         0.5, -0.5, -0.5,  // 5
         0.5,  0.5, -0.5,  // 6
        -0.5,  0.5, -0.5,  // 7
    ]);

    const cubeIndices = new Uint16Array([
        // Front face
        0, 1, 2,
        0, 2, 3,
        // Back face
        4, 6, 5,
        4, 7, 6,
        // Top face
        3, 2, 6,
        3, 6, 7,
        // Bottom face
        0, 5, 1,
        0, 4, 5,
        // Right face
        1, 5, 6,
        1, 6, 2,
        // Left face
        0, 3, 7,
        0, 7, 4,
    ]);

    const cubeColors = new Float32Array([
        // Front face colors
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
        // Back face colors
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
        0.9, 0.5, 0.0,  // Orange
    ]);

    // Create buffers for cube
    const cubePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

    const cubeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

    const cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

    // Create ground
    const circleVertices = createCircleVertices(10.0, 64);  // Radius 10, 64 segments

    const circleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);

    // Create color buffer for ground
    const groundColor = new Float32Array(circleVertices.length / 3 * 3).fill(0.5); // Gray color
    const groundColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, groundColor, gl.STATIC_DRAW);

    // Shadow setup
    const shadowColor = new Float32Array(circleVertices.length / 3 * 3).fill(0.0); // Black color
    const shadowColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shadowColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, shadowColor, gl.STATIC_DRAW);

    // Skybox setup
    const skyboxVertices = new Float32Array([
        -1,  1, -1,
        -1, -1, -1,
         1, -1, -1,
         1, -1, -1,
         1,  1, -1,
        -1,  1, -1,

        -1, -1,  1,
        -1, -1, -1,
        -1,  1, -1,
        -1,  1, -1,
        -1,  1,  1,
        -1, -1,  1,

         1, -1, -1,
         1, -1,  1,
         1,  1,  1,
         1,  1,  1,
         1,  1, -1,
         1, -1, -1,

        -1, -1,  1,
        -1,  1,  1,
         1,  1,  1,
         1,  1,  1,
         1, -1,  1,
        -1, -1,  1,

        -1,  1, -1,
         1,  1, -1,
         1,  1,  1,
         1,  1,  1,
        -1,  1,  1,
        -1,  1, -1,

        -1, -1, -1,
        -1, -1,  1,
         1, -1, -1,
         1, -1, -1,
        -1, -1,  1,
         1, -1,  1
    ]);

    const skyboxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);

    // Get attribute and uniform locations for skybox
    const skyboxPositionAttributeLocation = gl.getAttribLocation(skyboxProgram, 'aPosition');
    const skyboxViewMatrixLocation = gl.getUniformLocation(skyboxProgram, 'uViewMatrix');
    const skyboxProjectionMatrixLocation = gl.getUniformLocation(skyboxProgram, 'uProjectionMatrix');

    // Disable depth writing for skybox
    gl.depthFunc(gl.LEQUAL);

    // Enable depth testing and blending
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND); // Enable blending for shadows
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function

    // Define the player and balls
    let player = {
        position: [0, 0.5, 0],  // Start slightly above ground
        speed: 10.0,
    };

    // Game phases
    let balls = [];
    let phase = 1;
    let phaseTime = 30; // Duration of each phase in seconds
    let restTime = 0;  // Duration of rest between phases in seconds
    let timeSincePhaseStart = 0;
    let inRest = false;

    // Function to create a new ball without overlapping existing balls
    function createBall(existingBalls, maxAttempts = 10) {
        const groundRadius = 10.0;
        const spawnRadius = groundRadius - 1.0; // Ensure balls spawn within the ground
        const y = 40.0; // Spawn above ground

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spawnRadius;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const position = [x, y, z];
            const radius = 5.0; // Adjusted radius for better spacing

            // Check for overlap with existing balls
            let overlapping = false;
            for (let ball of existingBalls) {
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
                return {
                    position: position,
                    velocity: [0, -8.0, 0], // Falling down
                    radius: radius,
                };
            }
        }

        // If a non-overlapping position wasn't found after maxAttempts, return null
        return null;
    }

    // Scoring system
    let score = 0;
    const scoreElement = document.getElementById('score');

    // Game over handling
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const restartButton = document.getElementById('restartButton');

    restartButton.addEventListener('click', () => {
        gameOverOverlay.style.display = 'none';
        resetGame();
    });

    // Reset game
    function resetGame() {
        player.position = [0, 0.5, 0];
        balls = [];
        phase = 1;
        score = 0;
        timeSincePhaseStart = 0;
        inRest = false;
        yaw = 0;
        pitch = 0;
    }

    // Game over function
    function handleGameOver() {
        gameOverOverlay.style.display = 'flex';
    }

    // Main render loop
    function render(now) {
        now *= 0.001;  // Convert to seconds
        const deltaTime = now - (render.lastTime || now);
        render.lastTime = now;

        // Update game logic
        timeSincePhaseStart += deltaTime;
        if (inRest) {
            if (timeSincePhaseStart >= restTime) {
                timeSincePhaseStart = 0;
                inRest = false;
                phase += 1;
            }
        } else {
            if (timeSincePhaseStart >= phaseTime) {
                timeSincePhaseStart = 0;
                inRest = true;
                balls = [];
            } else {
                // Generate balls up to phase * 5
                while (balls.length < phase * 5) {
                    const newBall = createBall(balls);
                    if (newBall) {
                        balls.push(newBall);
                    } else {
                        console.warn('Failed to spawn a new ball without overlapping after maximum attempts.');
                        break; // Exit the loop to prevent infinite spawning attempts
                    }
                }
            }
        }

        // Update player position based on input
        const moveDirection = [0, 0, 0];

        const cameraRight = [
            Math.sin((yaw + 90) * Math.PI / 180),
            0,
            Math.cos((yaw + 90) * Math.PI / 180),
        ];

        const cameraForward = [
            Math.sin(yaw * Math.PI / 180),
            0,
            Math.cos(yaw * Math.PI / 180),
        ];

        // WASD key movement
        if (keys['w']) {
            moveDirection[0] += cameraForward[0];
            moveDirection[2] += cameraForward[2];
        }
        if (keys['a']) {
            moveDirection[0] += cameraRight[0];
            moveDirection[2] += cameraRight[2];
        }
        if (keys['s']) {
            moveDirection[0] -= cameraForward[0];
            moveDirection[2] -= cameraForward[2];
        }
        if (keys['d']) {
            moveDirection[0] -= cameraRight[0];
            moveDirection[2] -= cameraRight[2];
        }

        // Normalize moveDirection
        const length = Math.hypot(moveDirection[0], moveDirection[2]);
        if (length > 0) {
            moveDirection[0] /= length;
            moveDirection[2] /= length;
        }

        // Update player's position
        player.position[0] += moveDirection[0] * player.speed * deltaTime;
        player.position[2] += moveDirection[2] * player.speed * deltaTime;

        // Update balls
        balls.forEach(ball => {
            ball.position[1] += ball.velocity[1] * deltaTime;
            // Check for collision with player
            const dx = ball.position[0] - player.position[0];
            const dy = ball.position[1] - player.position[1];
            const dz = ball.position[2] - player.position[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance < ball.radius + 0.0) { // Player radius 0.0
                // Collision detected, end game
                handleGameOver();
            }
        });

        // Calculate player distance from center (ground radius 10)
        const groundRadius = 10.0;
        const playerDistanceFromCenter = Math.hypot(player.position[0], player.position[2]);
        if (playerDistanceFromCenter > groundRadius - 0.5) { // Keep player within ground
            const angle = Math.atan2(player.position[2], player.position[0]);
            player.position[0] = Math.cos(angle) * (groundRadius - 0.5);
            player.position[2] = Math.sin(angle) * (groundRadius - 0.5);
        }

        // Remove balls that are below the ground
        balls = balls.filter(ball => ball.position[1] > -10);

        // Update score
        score += deltaTime * 10;
        scoreElement.innerText = `Score: ${Math.floor(score)}`;

        // Clear the canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Changed to black background
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- Render Skybox Start ---
        gl.useProgram(skyboxProgram);

        // Create view and projection matrices for skybox
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const fov = 60 * Math.PI / 180;
        const near = 0.1;
        const far = 100.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fov, aspect, near, far);

        // Calculate camera front vector based on yaw and pitch
        const cameraFront = [
            Math.sin(yaw * Math.PI / 180) * Math.cos(pitch * Math.PI / 180),
            Math.sin(pitch * Math.PI / 180),
            Math.cos(yaw * Math.PI / 180) * Math.cos(pitch * Math.PI / 180),
        ];

        // Camera position is slightly above the player's position
        const cameraPosition = [
            player.position[0],
            player.position[1] + 2, // Camera height above player
            player.position[2],
        ];

        // Camera target is in the direction the camera is facing
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

        // Draw the player
        const playerModelMatrix = mat4.create();
        mat4.translate(playerModelMatrix, playerModelMatrix, player.position);
        mat4.scale(playerModelMatrix, playerModelMatrix, [1, 1, 1]); // Player size

        gl.uniformMatrix4fv(objectModelMatrixLocation, false, playerModelMatrix);
        gl.uniform1f(objectAlphaUniformLocation, 1.0); // Full opacity for player
        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        // Draw the balls
        balls.forEach(ball => {
            const ballModelMatrix = mat4.create();
            mat4.translate(ballModelMatrix, ballModelMatrix, ball.position);
            mat4.scale(ballModelMatrix, ballModelMatrix, [ball.radius, ball.radius, ball.radius]);

            gl.uniformMatrix4fv(objectModelMatrixLocation, false, ballModelMatrix);
            gl.uniform1f(objectAlphaUniformLocation, 1.0); // Full opacity for balls
            gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
        });

        // --- Render Shadows Start ---
        // Set alpha for shadows
        gl.uniform1f(objectAlphaUniformLocation, 0.5); // Semi-transparent shadows

        // Bind the shadow color buffer (all vertices black)
        gl.bindBuffer(gl.ARRAY_BUFFER, shadowColorBuffer);
        gl.enableVertexAttribArray(objectColorAttributeLocation);
        gl.vertexAttribPointer(objectColorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Draw shadows for each ball
        balls.forEach(ball => {
            const shadowModelMatrix = mat4.create();
            // Project shadow slightly above the ground to prevent z-fighting
            mat4.translate(shadowModelMatrix, shadowModelMatrix, [ball.position[0], 0.01, ball.position[2]]);
            // Scale to create a flat shadow
            mat4.scale(shadowModelMatrix, shadowModelMatrix, [ball.radius, 0.01, ball.radius]);

            gl.uniformMatrix4fv(objectModelMatrixLocation, false, shadowModelMatrix);
            gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
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