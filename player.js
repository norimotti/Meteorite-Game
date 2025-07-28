import { mat4 } from './utils.js';

export class Player {
    constructor(gl, position = [0, 0.5, 0]) {
        this.gl = gl;
        this.position = position;
        this.speed = 10.0;
        this.keys = {};
        this.yaw = 0;
        this.pitch = 0;

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const cubeVertices = new Float32Array([
            // Front face
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            // Back face
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
        ]);

        const cubeIndices = new Uint16Array([
            // Front face
            0, 1, 2, 0, 2, 3,
            // Back face
            4, 6, 5, 4, 7, 6,
            // Top face
            3, 2, 6, 3, 6, 7,
            // Bottom face
            0, 5, 1, 0, 4, 5,
            // Right face
            1, 5, 6, 1, 6, 2,
            // Left face
            0, 3, 7, 0, 7, 4,
        ]);

        const cubeColors = new Float32Array([
            // Front face colors
            0.9, 0.5, 0.0, 0.9, 0.5, 0.0, 0.9, 0.5, 0.0, 0.9, 0.5, 0.0,
            // Back face colors
            0.9, 0.5, 0.0, 0.9, 0.5, 0.0, 0.9, 0.5, 0.0, 0.9, 0.5, 0.0,
        ]);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

        this.indicesLength = cubeIndices.length;
    }

    update(deltaTime, keys, yaw, pitch) {
        this.yaw = yaw;
        this.pitch = pitch;

        const moveDirection = [0, 0, 0];
        const cameraRight = [
            Math.sin((this.yaw + 90) * Math.PI / 180), 0,
            Math.cos((this.yaw + 90) * Math.PI / 180),
        ];
        const cameraForward = [
            Math.sin(this.yaw * Math.PI / 180), 0,
            Math.cos(this.yaw * Math.PI / 180),
        ];

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

        const length = Math.hypot(moveDirection[0], moveDirection[2]);
        if (length > 0) {
            moveDirection[0] /= length;
            moveDirection[2] /= length;
        }

        this.position[0] += moveDirection[0] * this.speed * deltaTime;
        this.position[2] += moveDirection[2] * this.speed * deltaTime;

        const groundRadius = 10.0;
        const playerDistanceFromCenter = Math.hypot(this.position[0], this.position[2]);
        if (playerDistanceFromCenter > groundRadius - 0.5) {
            const angle = Math.atan2(this.position[2], this.position[0]);
            this.position[0] = Math.cos(angle) * (groundRadius - 0.5);
            this.position[2] = Math.sin(angle) * (groundRadius - 0.5);
        }
    }

    draw(program, viewProjectionMatrix) {
        const gl = this.gl;
        gl.useProgram(program);

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.scale(modelMatrix, modelMatrix, [1, 1, 1]);

        const modelMatrixLocation = gl.getUniformLocation(program, 'uModelMatrix');
        const viewProjectionMatrixLocation = gl.getUniformLocation(program, 'uViewProjectionMatrix');
        const alphaLocation = gl.getUniformLocation(program, 'uAlpha');

        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
        gl.uniformMatrix4fv(viewProjectionMatrixLocation, false, viewProjectionMatrix);
        gl.uniform1f(alphaLocation, 1.0);

        const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);

        const colorAttributeLocation = gl.getAttribLocation(program, 'aColor');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indicesLength, gl.UNSIGNED_SHORT, 0);
    }
}
