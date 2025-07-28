import { mat4 } from './utils.js';

export class Ball {
    constructor(gl, position, radius = 5.0) {
        this.gl = gl;
        this.position = position;
        this.velocity = [0, -8.0, 0];
        this.radius = radius;

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

    update(deltaTime) {
        this.position[1] += this.velocity[1] * deltaTime;
    }

    draw(program, viewProjectionMatrix) {
        const gl = this.gl;
        gl.useProgram(program);

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.scale(modelMatrix, modelMatrix, [this.radius, this.radius, this.radius]);

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

    drawShadow(program, viewProjectionMatrix) {
        const gl = this.gl;
        gl.useProgram(program);

        const shadowModelMatrix = mat4.create();
        mat4.translate(shadowModelMatrix, shadowModelMatrix, [this.position[0], 0.01, this.position[2]]);
        mat4.scale(shadowModelMatrix, shadowModelMatrix, [this.radius, 0.01, this.radius]);

        const modelMatrixLocation = gl.getUniformLocation(program, 'uModelMatrix');
        const viewProjectionMatrixLocation = gl.getUniformLocation(program, 'uViewProjectionMatrix');
        const alphaLocation = gl.getUniformLocation(program, 'uAlpha');

        gl.uniformMatrix4fv(modelMatrixLocation, false, shadowModelMatrix);
        gl.uniformMatrix4fv(viewProjectionMatrixLocation, false, viewProjectionMatrix);
        gl.uniform1f(alphaLocation, 0.5);

        const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);

        const colorAttributeLocation = gl.getAttribLocation(program, 'aColor');
        const shadowColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shadowColorBuffer);
        const shadowColors = new Float32Array(this.indicesLength * 3).fill(0);
        gl.bufferData(gl.ARRAY_BUFFER, shadowColors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indicesLength, gl.UNSIGNED_SHORT, 0);
    }
}
