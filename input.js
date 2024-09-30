export const keys = {};

export let yaw = 0;
export let pitch = 0;

let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

export function initInputHandlers(canvas) {
    window.addEventListener('keydown', function(e) {
        keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', function(e) {
        keys[e.key.toLowerCase()] = false;
    });

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
}