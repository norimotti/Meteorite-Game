// Initialize WebGL2 context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL2 is not available in your browser.');
}

// Resize the canvas to fill the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Minimal mat4 implementation for matrix operations
const mat4 = {
    create: function() {
        return new Float32Array([1, 0, 0, 0,
                                 0, 1, 0, 0,
                                 0, 0, 1, 0,
                                 0, 0, 0, 1]);
    },
    identity: function(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    },
    perspective: function(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
    },
    lookAt: function(out, eye, center, up) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0], eyey = eye[1], eyez = eye[2];
        let upx = up[0], upy = up[1], upz = up[2];
        let centerx = center[0], centery = center[1], centerz = center[2];

        if (
            Math.abs(eyex - centerx) < 0.000001 &&
            Math.abs(eyey - centery) < 0.000001 &&
            Math.abs(eyez - centerz) < 0.000001
        ) {
            return mat4.identity(out);
        }

        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len; z1 *= len; z2 *= len;

        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
            x0 = 0; x1 = 0; x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len; x1 *= len; x2 *= len;
        }

        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (!len) {
            y0 = 0; y1 = 0; y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len; y1 *= len; y2 *= len;
        }

        out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
        out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
        out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
    },
    multiply: function(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        const b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
        out[4] = b4 * a00 + b5 * a10 + b6 * a20 + b7 * a30;
        out[5] = b4 * a01 + b5 * a11 + b6 * a21 + b7 * a31;
        out[6] = b4 * a02 + b5 * a12 + b6 * a22 + b7 * a32;
        out[7] = b4 * a03 + b5 * a13 + b6 * a23 + b7 * a33;

        const b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
        out[8] = b8 * a00 + b9 * a10 + b10 * a20 + b11 * a30;
        out[9] = b8 * a01 + b9 * a11 + b10 * a21 + b11 * a31;
        out[10] = b8 * a02 + b9 * a12 + b10 * a22 + b11 * a32;
        out[11] = b8 * a03 + b9 * a13 + b10 * a23 + b11 * a33;

        const b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        out[12] = b12 * a00 + b13 * a10 + b14 * a20 + b15 * a30;
        out[13] = b12 * a01 + b13 * a11 + b14 * a21 + b15 * a31;
        out[14] = b12 * a02 + b13 * a12 + b14 * a22 + b15 * a32;
        out[15] = b12 * a03 + b13 * a13 + b14 * a23 + b15 * a33;
    },
    translate: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
            const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
            const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
            const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

            out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
            out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
            out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

            out[12] = a00 * x + a10 * y + a20 * z + a30;
            out[13] = a01 * x + a11 * y + a21 * z + a31;
            out[14] = a02 * x + a12 * y + a22 * z + a32;
            out[15] = a03 * x + a13 * y + a23 * z + a33;
        }
    },
    scale: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
        out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
        out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    },
    rotateX: function(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
    
        out[4] = a[4] * c + a[8] * s;
        out[5] = a[5] * c + a[9] * s;
        out[6] = a[6] * c + a[10] * s;
        out[7] = a[7] * c + a[11] * s;
        out[8] = a[8] * c - a[4] * s;
        out[9] = a[9] * c - a[5] * s;
        out[10] = a[10] * c - a[6] * s;
        out[11] = a[11] * c - a[7] * s;
    },
    rotateY: function(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
    
        out[0] = a[0] * c + a[8] * s;
        out[1] = a[1] * c + a[9] * s;
        out[2] = a[2] * c + a[10] * s;
        out[3] = a[3] * c + a[11] * s;
        out[8] = a[0] * -s + a[8] * c;
        out[9] = a[1] * -s + a[9] * c;
        out[10] = a[2] * -s + a[10] * c;
        out[11] = a[3] * -s + a[11] * c;
    }
};

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

// Define shaders for 3D objects with alpha support
const objectVertexShaderSource = `#version 300 es
in vec3 aPosition;
in vec3 aColor;
uniform mat4 uViewProjectionMatrix;
uniform mat4 uModelMatrix;
out vec3 vColor;

void main() {
    gl_Position = uViewProjectionMatrix * uModelMatrix * vec4(aPosition, 1.0);
    vColor = aColor;
}
`;

const objectFragmentShaderSource = `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uAlpha;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, uAlpha);
}
`;

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

// Define shaders for Skybox
const skyboxVertexShaderSource = `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vDirection;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    vec4 pos = uProjectionMatrix * mat4(mat3(uViewMatrix)) * vec4(aPosition, 1.0);
    gl_Position = pos.xyww; // Set w component equal to z for proper depth
    vDirection = aPosition;
}
`;

const skyboxFragmentShaderSource = `#version 300 es
precision highp float;
in vec3 vDirection;
out vec4 fragColor;

void main() {
    // Normalize the direction vector
    vec3 dir = normalize(vDirection);

    // Define gradient colors for evening sky
    // Deep blue at the top
    vec3 topColor = vec3(0.05, 0.05, 0.2); // Dark blue
    // Orange near the horizon
    vec3 horizonColor = vec3(0.8, 0.5, 0.2); // Orange

    // Calculate the interpolation factor based on the y-component
    float t = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    // Mix the colors
    vec3 color = mix(horizonColor, topColor, t);

    fragColor = vec4(color, 1.0);
}
`;

// Create shader programs
const objectProgram = createProgram(gl, objectVertexShaderSource, objectFragmentShaderSource);
const skyboxProgram = createProgram(gl, skyboxVertexShaderSource, skyboxFragmentShaderSource);

if (!objectProgram || !skyboxProgram) {
    alert('Failed to initialize shaders.');
}

// Get attribute and uniform locations for objects
const objectPositionAttributeLocation = gl.getAttribLocation(objectProgram, 'aPosition');
const objectColorAttributeLocation = gl.getAttribLocation(objectProgram, 'aColor');
const objectViewProjectionMatrixLocation = gl.getUniformLocation(objectProgram, 'uViewProjectionMatrix');
const objectModelMatrixLocation = gl.getUniformLocation(objectProgram, 'uModelMatrix');
const objectAlphaUniformLocation = gl.getUniformLocation(objectProgram, 'uAlpha'); // Added for alpha

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
    0.9, 0.5, 0.0,  // 1: Orange
    0.9, 0.5, 0.0,  // 2: Orange
    0.9, 0.5, 0.0,  // 3: Orange
    0.9, 0.5, 0.0,  // 4: Orange
    // Back face colors
    0.9, 0.5, 0.0,  // 5: Orange
    0.9, 0.5, 0.0,  // 6: Orange
    0.9, 0.5, 0.0,  // 7: Orange
    0.9, 0.5, 0.0,  // 8: Orange
]);

// Create buffer for cube positions
const cubePositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

// Create buffer for cube colors
const cubeColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

// Create buffer for cube indices
const cubeIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

// Create circular ground vertices
const circleVertices = createCircleVertices(10.0, 64);  // Radius 10, 64 segments

const circleVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);

// Create color buffer for ground (single color)
const groundColor = new Float32Array(circleVertices.length / 3 * 3).fill(0.5); // Gray color
const groundColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, groundColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, groundColor, gl.STATIC_DRAW);

// --- Shadow Setup Start ---

// Create a color buffer for shadows (all vertices black)
const shadowColor = new Float32Array(circleVertices.length / 3 * 3).fill(0.0); // Black color
const shadowColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, shadowColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, shadowColor, gl.STATIC_DRAW);

// --- Shadow Setup End ---

// --- Skybox Setup Start ---

// Define skybox cube vertices
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

// Create buffer for skybox
const skyboxBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);

// Get attribute and uniform locations for skybox
const skyboxPositionAttributeLocation = gl.getAttribLocation(skyboxProgram, 'aPosition');
const skyboxViewMatrixLocation = gl.getUniformLocation(skyboxProgram, 'uViewMatrix');
const skyboxProjectionMatrixLocation = gl.getUniformLocation(skyboxProgram, 'uProjectionMatrix');

// Disable depth writing for skybox
gl.depthFunc(gl.LEQUAL);

// --- Skybox Setup End ---

// Enable depth testing and blending
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND); // Enable blending for shadows
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function

// Handle keyboard input
let keys = {};
window.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', function(e) {
    keys[e.key.toLowerCase()] = false;
});

// Mouse movement for camera control
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;
let yaw = 0;
let pitch = 0;
canvas.addEventListener('mousedown', function(e) {
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
canvas.addEventListener('mouseup', function(e) {
    mouseDown = false;
});
canvas.addEventListener('mouseleave', function(e) {
    mouseDown = false;
});
canvas.addEventListener('mousemove', function(e) {
    if (!mouseDown) return;
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    yaw += deltaX * 0.2;
    pitch -= deltaY * 0.2;
    if (pitch > 89) pitch = 89;
    if (pitch < -89) pitch = -89;
});

// Define the player and balls
let player = {
    position: [0, 0.5, 0],  // Start slightly above ground
    speed: 10.0,
};

// Game Phases
let balls = [];
let phase = 1;
let phaseTime = 30; // Duration of each phase in seconds
let restTime = 0;  // Duration of rest between phases in seconds調整できるように残しとく
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
    lastMouseX = null;
    lastMouseY = null;
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

    // Create view and projection matrices for skybox (remove translation from view matrix)
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