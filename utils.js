export const mat4 = {
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