export function initWebGL(canvas) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not available in your browser.');
    }
    return gl;
}

export function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${info}`);
    }
    return shader;
}

export function createProgram(gl, vShaderSource, fShaderSource) {
    const vertexShader = compileShader(gl, vShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fShaderSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program failed to link: ${info}`);
    }
    return program;
}
