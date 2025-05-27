
// FOV, Aspect Ratio, Near, Far 
function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
    return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0];
}


function idMatrix(m) {
    m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
    m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
    m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
}

function mulStoreMatrix(r, m, k) {
    m0 = m[0]; m1 = m[1]; m2 = m[2]; m3 = m[3]; m4 = m[4]; m5 = m[5]; m6 = m[6]; m7 = m[7];
    m8 = m[8]; m9 = m[9]; m10 = m[10]; m11 = m[11]; m12 = m[12]; m13 = m[13]; m14 = m[14]; m15 = m[15];
    k0 = k[0]; k1 = k[1]; k2 = k[2]; k3 = k[3]; k4 = k[4]; k5 = k[5]; k6 = k[6]; k7 = k[7];
    k8 = k[8]; k9 = k[9]; k10 = k[10]; k11 = k[11]; k12 = k[12]; k13 = k[13]; k14 = k[14]; k15 = k[15];

    a0 = k0 * m0 + k3 * m12 + k1 * m4 + k2 * m8;
    a4 = k4 * m0 + k7 * m12 + k5 * m4 + k6 * m8;
    a8 = k8 * m0 + k11 * m12 + k9 * m4 + k10 * m8;
    a12 = k12 * m0 + k15 * m12 + k13 * m4 + k14 * m8;

    a1 = k0 * m1 + k3 * m13 + k1 * m5 + k2 * m9;
    a5 = k4 * m1 + k7 * m13 + k5 * m5 + k6 * m9;
    a9 = k8 * m1 + k11 * m13 + k9 * m5 + k10 * m9;
    a13 = k12 * m1 + k15 * m13 + k13 * m5 + k14 * m9;

    a2 = k2 * m10 + k3 * m14 + k0 * m2 + k1 * m6;
    a6 = k6 * m10 + k7 * m14 + k4 * m2 + k5 * m6;
    a10 = k10 * m10 + k11 * m14 + k8 * m2 + k9 * m6;
    a14 = k14 * m10 + k15 * m14 + k12 * m2 + k13 * m6;

    a3 = k2 * m11 + k3 * m15 + k0 * m3 + k1 * m7;
    a7 = k6 * m11 + k7 * m15 + k4 * m3 + k5 * m7;
    a11 = k10 * m11 + k11 * m15 + k8 * m3 + k9 * m7;
    a15 = k14 * m11 + k15 * m15 + k12 * m3 + k13 * m7;

    r[0] = a0; r[1] = a1; r[2] = a2; r[3] = a3; r[4] = a4; r[5] = a5; r[6] = a6; r[7] = a7;
    r[8] = a8; r[9] = a9; r[10] = a10; r[11] = a11; r[12] = a12; r[13] = a13; r[14] = a14; r[15] = a15;
}

function mulMatrix(m, k) {
    mulStoreMatrix(m, m, k);
}

function translate(m, tx, ty, tz) {
    var tm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    tm[12] = tx; tm[13] = ty; tm[14] = tz;
    mulMatrix(m, tm);
}

function scale(m, sx, sy, sz) {
    var tm = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
    mulMatrix(m, tm);
}


function rotateX(m, angle) {
    var rm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    rm[5] = c; rm[6] = s;
    rm[9] = -s; rm[10] = c;
    mulMatrix(m, rm);
}

function rotateY(m, angle) {
    var rm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    rm[0] = c; rm[2] = -s;
    rm[8] = s; rm[10] = c;
    mulMatrix(m, rm);
}

function rotateZ(m, angle) {
    var rm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    rm[0] = c; rm[1] = s;
    rm[4] = -s; rm[5] = c;
    mulMatrix(m, rm);
}

function normalizeVec3(v) {
    sq = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    sq = Math.sqrt(sq);
    if (sq < 0.000001) // Too Small
        return -1;
    v[0] /= sq; v[1] /= sq; v[2] /= sq;
}

function rotateArbAxis(m, angle, axis) {
    var axis_rot = [0, 0, 0];
    var ux, uy, uz;
    var rm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var c = Math.cos(angle);
    var c1 = 1.0 - c;
    var s = Math.sin(angle);
    axis_rot[0] = axis[0];
    axis_rot[1] = axis[1];
    axis_rot[2] = axis[2];
    if (normalizeVec3(axis_rot) == -1)
        return -1;
    ux = axis_rot[0]; uy = axis_rot[1]; uz = axis_rot[2];
    
    rm[0] = c + ux * ux * c1;
    rm[1] = uy * ux * c1 + uz * s;
    rm[2] = uz * ux * c1 - uy * s;
    rm[3] = 0;

    rm[4] = ux * uy * c1 - uz * s;
    rm[5] = c + uy * uy * c1;
    rm[6] = uz * uy * c1 + ux * s;
    rm[7] = 0;

    rm[8] = ux * uz * c1 + uy * s;
    rm[9] = uy * uz * c1 - ux * s;
    rm[10] = c + uz * uz * c1;
    rm[11] = 0;

    rm[12] = 0;
    rm[13] = 0;
    rm[14] = 0;
    rm[15] = 1;

    mulMatrix(m, rm);
}