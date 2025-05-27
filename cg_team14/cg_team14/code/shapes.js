
function cylinder(r = 0.5, h = 0.5, step = defaultStep) {
  const triangles = [];
  const normals = [];
  const texCoords = [];
  let ccoord = circle(r, step);
  let ccoord2 = JSON.parse(JSON.stringify(ccoord));
  ccoord = ccoord.map(i => [i[0], -h, i[1]]);
  ccoord2 = ccoord2.map(i => [i[0], h, i[1]]);
  let tcoord = [];
  for (let i = 0; i < step; i++) {
    tcoord.push(i / step);
  }
  for (let i = 0; i < ccoord.length; i++) {
    const p1 = ccoord.at(i);
    const p2 = ccoord.at(i - 1);
    const p3 = ccoord2.at(i - 1);
    const p4 = ccoord2.at(i);

    const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
    const v3 = [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];

    triangles.push(
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
      p3[0], p3[1], p3[2],

      p1[0], p1[1], p1[2],
      p3[0], p3[1], p3[2],
      p4[0], p4[1], p4[2],
    );

    normals.push(
      v3[0], v3[1], v3[2],
      v3[0], v3[1], v3[2],
      v3[0], v3[1], v3[2],

      v3[0], v3[1], v3[2],
      v3[0], v3[1], v3[2],
      v3[0], v3[1], v3[2],
    );

    const t1 = tcoord.at(i);
    const t2 = tcoord.at(i - 1);

    texCoords.push(
      t1, 0,
      t2, 0,
      t2, 1,
  
      t1, 0,
      t2, 1,
      t1, 1,
    );
  }

  return {
    triangles: new Float32Array(triangles),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
  };
}

function sphere(x0, y0, z0, r, step = defaultStep) {
  const triangles = [];
  const normals = [];
  const texCoords = [];
  for (let i = 0; i < step; i++) {
    for (let j = 0; j < step; j++) {
      const sinT1 = Math.sin((i / step) * Math.PI);
      const sinT2 = Math.sin(((i + 1) / step) * Math.PI);
      const sinP1 = Math.sin((j / step) * Math.PI * 2);
      const sinP2 = Math.sin(((j + 1) / step) * Math.PI * 2);
      const cosT1 = Math.cos((i / step) * Math.PI);
      const cosT2 = Math.cos(((i + 1) / step) * Math.PI);
      const cosP1 = Math.cos((j / step) * Math.PI * 2);
      const cosP2 = Math.cos(((j + 1) / step) * Math.PI * 2);

      const p1 = [x0 + r * sinT1 * cosP1, y0 + r * sinT1 * sinP1, z0 + r * cosT1];
      const p2 = [x0 + r * sinT2 * cosP1, y0 + r * sinT2 * sinP1, z0 + r * cosT2];
      const p3 = [x0 + r * sinT1 * cosP2, y0 + r * sinT1 * sinP2, z0 + r * cosT1];
      const p4 = [x0 + r * sinT2 * cosP2, y0 + r * sinT2 * sinP2, z0 + r * cosT2];

      const nx1 = (p2[1] - p1[1]) * (p3[2] - p1[2]) - (p2[2] - p1[2]) * (p3[1] - p1[1]);
      const ny1 = (p2[2] - p1[2]) * (p3[0] - p1[0]) - (p2[0] - p1[0]) * (p3[2] - p1[2]);
      const nz1 = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
      const vec1Size_2 = nx1 * nx1 + ny1 * ny1 + nz1 * nz1;

      const nx2 = -((p3[1] - p2[1]) * (p4[2] - p2[2]) - (p3[2] - p2[2]) * (p4[1] - p2[1]));
      const ny2 = -((p3[2] - p2[2]) * (p4[0] - p2[0]) - (p3[0] - p2[0]) * (p4[2] - p2[2]));
      const nz2 = -((p3[0] - p2[0]) * (p4[1] - p2[1]) - (p3[1] - p2[1]) * (p4[0] - p2[0]));
      const vec2Size_2 = nx2 * nx2 + ny2 * ny2 + nz2 * nz2;
      if (vec1Size_2 !== 0) {
        triangles.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
        normals.push(nx1, ny1, nz1, nx1, ny1, nz1, nx1, ny1, nz1);
      }
      if (vec2Size_2 !== 0) {
        triangles.push(p2[0], p2[1], p2[2], p3[0], p3[1], p3[2], p4[0], p4[1], p4[2]);
        normals.push(nx2, ny2, nz2, nx2, ny2, nz2, nx2, ny2, nz2);
      }
    }
  }
  for (let i = 0; i < triangles.length / 3 * 2; i++) {
    texCoords.push(0);
  }
  return {
    triangles: new Float32Array(triangles),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
  };
}

function tetrahedron(sc = 1) {
  const texCoords = [];
  const sqrt3 = Math.sqrt(3);
  const sqrt2 = Math.sqrt(2);
  const cord = [
    [-0.5, -(sqrt2 * sqrt3 / 9), -sqrt3 / 6],
    [0.5, -(sqrt2 * sqrt3 / 9), -sqrt3 / 6],
    [0, -(sqrt2 * sqrt3 / 9), sqrt3 / 3],
    [0, 2 * sqrt2 * sqrt3 / 9, 0],
  ];
  cord.forEach((p) => {
    p[0] *= sc;
    p[1] *= sc;
    p[2] *= sc;
  });
  const triangles = [
    ...cord[0], ...cord[1], ...cord[2],
    ...cord[0], ...cord[2], ...cord[3],
    ...cord[0], ...cord[3], ...cord[1],
    ...cord[1], ...cord[3], ...cord[2],
  ];

  const p0 = cord[0];
  const p1 = cord[1];
  const p2 = cord[2];
  const p3 = cord[3];
  
  // cross product p0p1 x p0p2
  const n0 = [
    p0[1] * p1[2] - p0[2] * p1[1],
    p0[2] * p1[0] - p0[0] * p1[2],
    p0[0] * p1[1] - p0[1] * p1[0],
  ];
  // cross product p0p2 x p0p3
  const n1 = [
    p0[1] * p2[2] - p0[2] * p2[1],
    p0[2] * p2[0] - p0[0] * p2[2],
    p0[0] * p2[1] - p0[1] * p2[0],
  ];
  // cross product p0p3 x p0p1
  const n2 = [
    p0[1] * p3[2] - p0[2] * p3[1],
    p0[2] * p3[0] - p0[0] * p3[2],
    p0[0] * p3[1] - p0[1] * p3[0],
  ];
  // corss product p1p3 x p1p2
  const n3 = [
    p1[1] * p3[2] - p1[2] * p3[1],
    p1[2] * p3[0] - p1[0] * p3[2],
    p1[0] * p3[1] - p1[1] * p3[0],
  ];

  const normals = [
    ...n0, ...n0, ...n0,
    ...n1, ...n1, ...n1,
    ...n2, ...n2, ...n2,
    ...n3, ...n3, ...n3,
  ];
  for (let i = 0; i < triangles.length / 3 * 2; i++) {
    texCoords.push(0);
  }
  return {
    triangles: new Float32Array(triangles),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
  };
}

function cube(sc = 1) {
  const texCoords = [];
  const triangles = [
    // front
    -sc, -sc, sc, sc, -sc, sc, sc, sc, sc,
    -sc, -sc, sc, sc, sc, sc, -sc, sc, sc,
    // right
    sc, -sc, sc, sc, -sc, -sc, sc, sc, -sc,
    sc, -sc, sc, sc, sc, -sc, sc, sc, sc,
    // back
    sc, -sc, -sc, -sc, -sc, -sc, -sc, sc, -sc,
    sc, -sc, -sc, -sc, sc, -sc, sc, sc, -sc,
    // left
    -sc, -sc, -sc, -sc, -sc, sc, -sc, sc, sc,
    -sc, -sc, -sc, -sc, sc, sc, -sc, sc, -sc,
    // bottom
    -sc, -sc, sc, sc, -sc, sc, sc, -sc, -sc,
    -sc, -sc, sc, sc, -sc, -sc, -sc, -sc, -sc,
    // top
    -sc, sc, sc, sc, sc, sc, sc, sc, -sc,
    -sc, sc, sc, sc, sc, -sc, -sc, sc, -sc,
  ];
  const normals = [
    // front
    0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, 1, 0, 0, 1, 0, 0, 1,
    // right
    1, 0, 0, 1, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0,
    // back
    0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, -1, 0, 0, -1, 0, 0, -1,
    // left
    -1, 0, 0, -1, 0, 0, -1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0,
    // bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0,
    // top
    0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0,
  ];
  for (let i = 0; i < triangles.length / 3 * 2; i++) {
    texCoords.push(0);
  }

  return {
    triangles: new Float32Array(triangles),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
  };
}

function circle(r = 0.5, step = defaultStep) {
  let pt1 = [r, 0];
  let lst = [];
  const cosT = Math.cos(2 * Math.PI / step);
  const sinT = Math.sin(2 * Math.PI / step);
  for (let i = 0; i < step; i++) {
    const nPt = [pt1[0] * cosT - pt1[1] * sinT, pt1[0] * sinT + pt1[1] * cosT];
    lst.push([...nPt]);
    pt1 = nPt;
  }
  return lst;
}
