export const objectVertexShaderSource = `#version 300 es
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

export const objectFragmentShaderSource = `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uAlpha;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, uAlpha);
}
`;

export const skyboxVertexShaderSource = `#version 300 es
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

export const skyboxFragmentShaderSource = `#version 300 es
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
