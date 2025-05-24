let gl;
let currentMode = "TRIANGLES";
let color = [0.1, 0.5, 0.1];

let uNormalMatrix;

let move = [0.0, 0.0, 0.0];
let isRotating = [false, false, false];
let angle = [0.0, 0.0, 0.0];
let zoom = 1.0;

let eye = vec3(0, 0, 2);
let at = vec3(0, 0, 0);
let up = vec3(0, 1, 0);

let vPosition, uColor;
let buffer;
let normalBuffer, vNormal;

let ambientStrength = 0.2, specularStrength = 1.0,diffuseStrength = 1.0,shineStrength = 50.0;
let uAmbientStrength, uSpecularStrength, uShineStrength, uDiffuseStrength;
let lightPos = vec3(3.0, 3.0, 5.0);
let uLightPos;

const point_vertices = [
vec3(-0.65, 0.3, 0.0),
vec3(-0.65, 0.2, 0.0),
vec3(-0.65, 0.1, 0.0),
vec3(-0.65, 0.0, 0.0),
vec3(-0.65, -0.1, 0.0),
vec3(-0.65, -0.2, 0.0),
vec3(-0.65, -0.3, 0.0),

vec3(-0.55, 0.3, 0.0),
vec3(-0.55, 0.2, 0.0),
vec3(-0.55, 0.1, 0.0),
vec3(-0.55, 0.0, 0.0),
vec3(-0.55, -0.1, 0.0),
vec3(-0.55, -0.2, 0.0),
vec3(-0.55, -0.3, 0.0),

vec3(-0.5, 0.05, 0.0),
vec3(-0.5, -0.05, 0.0),
vec3(-0.4, 0.05, 0.0),
vec3(-0.4, -0.05, 0.0),

vec3(-0.35, 0.3, 0.0),
vec3(-0.35, 0.2, 0.0),
vec3(-0.35, 0.1, 0.0),
vec3(-0.35, 0.0, 0.0),
vec3(-0.35, -0.1, 0.0),
vec3(-0.35, -0.2, 0.0),
vec3(-0.35, -0.3, 0.0),

vec3(-0.25, 0.3, 0.0),
vec3(-0.25, 0.2, 0.0),
vec3(-0.25, 0.1, 0.0),
vec3(-0.25, 0.0, 0.0),
vec3(-0.25, -0.1, 0.0),
vec3(-0.25, -0.2, 0.0),
vec3(-0.25, -0.3, 0.0),

vec3(-0.1, 0.3, 0.0),
vec3(-0.1, 0.2, 0.0),
vec3(-0.1, 0.1, 0.0),
vec3(-0.1, 0.0, 0.0),
vec3(-0.1, -0.1, 0.0),
vec3(-0.1, -0.2, 0.0),
vec3(-0.1, -0.3, 0.0),

vec3(0.0, 0.3, 0.0),
vec3(0.0, 0.2, 0.0),
vec3(0.0, 0.1, 0.0),
vec3(0.0, -0.1, 0.0),
vec3(0.0, -0.2, 0.0),
vec3(0.0, -0.3, 0.0),

vec3(0.05, 0.0, 0.0),

vec3(0.1, 0.3, 0.0),
vec3(0.1, 0.15, 0.0),
vec3(0.1, 0.05, 0.0),
vec3(0.1, -0.05, 0.0),
vec3(0.1, -0.15, 0.0),
vec3(0.1, -0.3, 0.0),

vec3(0.15, 0.25, 0.0),
vec3(0.15, -0.25, 0.0),

vec3(0.2, 0.2, 0.0),
vec3(0.2, 0.1, 0.0),
vec3(0.2, -0.1, 0.0),
vec3(0.2, -0.2, 0.0),

vec3(0.35, 0.3, 0.0),
vec3(0.35, 0.2, 0.0),
vec3(0.35, 0.1, 0.0),
vec3(0.35, 0.0, 0.0),
vec3(0.35, -0.1, 0.0),
vec3(0.35, -0.2, 0.0),
vec3(0.35, -0.3, 0.0),

vec3(0.45, 0.3, 0.0),
vec3(0.45, 0.2, 0.0),
vec3(0.45, 0.1, 0.0),
vec3(0.45, -0.1, 0.0),
vec3(0.45, -0.2, 0.0),
vec3(0.45, -0.3, 0.0),

vec3(0.5, 0.0, 0.0),

vec3(0.55, 0.15, 0.0),
vec3(0.55, -0.15, 0.0),

vec3(0.55, 0.15, 0.0),
vec3(0.55, -0.15, 0.0),

vec3(0.6, 0.2, 0.0),
vec3(0.6, 0.05, 0.0),
vec3(0.6, -0.05, 0.0),
vec3(0.6, -0.2, 0.0),

vec3(0.65, 0.3, 0.0),
vec3(0.65, 0.1, 0.0),
vec3(0.65, -0.1, 0.0),
vec3(0.65, -0.3, 0.0),

vec3(0.7, 0.3, 0.0),
vec3(0.7, 0.2, 0.0),
vec3(0.7, -0.2, 0.0),
vec3(0.7, -0.3, 0.0)
];

const line_vertices = [
vec3(-0.65, -0.3, 0.0), vec3(-0.65, 0.3, 0.0),
vec3(-0.65, 0.3, 0.0), vec3(-0.55, 0.3, 0.0),
vec3(-0.55, 0.3, 0.0), vec3(-0.55, 0.1, 0.0),
vec3(-0.55, 0.1, 0.0), vec3(-0.5, 0.05, 0.0),
vec3(-0.5, 0.05, 0.0), vec3(-0.4, 0.05, 0.0),
vec3(-0.4, 0.05, 0.0), vec3(-0.35, 0.1, 0.0),
vec3(-0.35, 0.1, 0.0), vec3(-0.35, 0.3, 0.0),
vec3(-0.35, 0.3, 0.0), vec3(-0.25, 0.3, 0.0),
vec3(-0.25, 0.3, 0.0), vec3(-0.25, -0.3, 0.0),
vec3(-0.25, -0.3, 0.0), vec3(-0.35, -0.3, 0.0),
vec3(-0.35, -0.3, 0.0), vec3(-0.35, -0.1, 0.0),
vec3(-0.35, -0.1, 0.0), vec3(-0.4, -0.05, 0.0),
vec3(-0.4, -0.05, 0.0), vec3(-0.5, -0.05, 0.0),
vec3(-0.5, -0.05, 0.0), vec3(-0.55, -0.1, 0.0),
vec3(-0.55, -0.1, 0.0), vec3(-0.55, -0.3, 0.0),
vec3(-0.55, -0.3, 0.0), vec3(-0.65, -0.3, 0.0),

vec3(-0.1, 0.3, 0.0), vec3(0.1, 0.3, 0.0),
vec3(0.1, 0.3, 0.0), vec3(0.2, 0.2, 0.0),
vec3(0.2, 0.2, 0.0), vec3(0.2, 0.1, 0.0),
vec3(0.2, 0.1, 0.0), vec3(0.1, 0.05, 0.0),
vec3(0.1, 0.05, 0.0), vec3(0.05, 0.0, 0.0),
vec3(0.05, 0.0, 0.0), vec3(0.1, -0.05, 0.0),
vec3(0.1, -0.05, 0.0), vec3(0.2, -0.1, 0.0),
vec3(0.2, -0.2, 0.0), vec3(0.2, -0.1, 0.0),
vec3(0.1, -0.3, 0.0), vec3(0.2, -0.2, 0.0),
vec3(-0.1, -0.3, 0.0), vec3(0.1, -0.3, 0.0),
vec3(-0.1, 0.3, 0.0), vec3(-0.1, -0.3, 0.0),
vec3(0.0, 0.1, 0.0), vec3(0.0, 0.2, 0.0),
vec3(0.0, 0.2, 0.0), vec3(0.1, 0.15, 0.0),
vec3(0.1, 0.15, 0.0), vec3(0.0, 0.1, 0.0),
vec3(0.0, -0.1, 0.0), vec3(0.0, -0.2, 0.0),
vec3(0.0, -0.2, 0.0), vec3(0.1, -0.15, 0.0),
vec3(0.1, -0.15, 0.0), vec3(0.0, -0.1, 0.0),

vec3(0.35, 0.3, 0.0), vec3(0.45, 0.3, 0.0),
vec3(0.45, 0.3, 0.0), vec3(0.45, 0.1, 0.0),
vec3(0.45, 0.1, 0.0), vec3(0.55, 0.15, 0.0),
vec3(0.55, 0.15, 0.0), vec3(0.6, 0.2, 0.0),
vec3(0.6, 0.2, 0.0), vec3(0.65, 0.3, 0.0),
vec3(0.65, 0.3, 0.0), vec3(0.7, 0.3, 0.0),
vec3(0.7, 0.3, 0.0), vec3(0.7, 0.2, 0.0),
vec3(0.7, 0.2, 0.0), vec3(0.65, 0.1, 0.0),
vec3(0.65, 0.1, 0.0), vec3(0.6, 0.05, 0.0),
vec3(0.6, 0.05, 0.0), vec3(0.5, 0.0, 0.0),
vec3(0.35, -0.3, 0.0), vec3(0.45, -0.3, 0.0),
vec3(0.45, -0.3, 0.0), vec3(0.45, -0.1, 0.0),
vec3(0.45, -0.1, 0.0), vec3(0.55, -0.15, 0.0),
vec3(0.55, -0.15, 0.0), vec3(0.6, -0.2, 0.0),
vec3(0.6, -0.2, 0.0), vec3(0.65, -0.3, 0.0),
vec3(0.65, -0.3, 0.0), vec3(0.7, -0.3, 0.0),
vec3(0.7, -0.3, 0.0), vec3(0.7, -0.2, 0.0),
vec3(0.7, -0.2, 0.0), vec3(0.65, -0.1, 0.0),
vec3(0.65, -0.1, 0.0), vec3(0.6, -0.05, 0.0),
vec3(0.6, -0.05, 0.0), vec3(0.5, -0.0, 0.0),
vec3(0.35, -0.3, 0.0), vec3(0.35, 0.3, 0.0),
];

const triangle_vertices = [

vec3(-0.65, 0.3, 0.0), vec3(-0.65, -0.3, 0.0), vec3(-0.55, -0.3, 0.0), 
vec3(-0.55, 0.3, 0.0), vec3(-0.55, -0.3, 0.0), vec3(-0.65, 0.3, 0.0),

vec3(-0.35, 0.3, 0.0), vec3(-0.35, -0.3, 0.0), vec3(-0.25, -0.3, 0.0), 
vec3(-0.25, 0.3, 0.0), vec3(-0.25, -0.3, 0.0), vec3(-0.35, 0.3, 0.0),

vec3(-0.1, 0.3, 0.0), vec3(-0.1, -0.3, 0.0), vec3(-0.0, -0.3, 0.0), 
vec3(-0.0, 0.3, 0.0), vec3(-0.0, -0.3, 0.0), vec3(-0.1, 0.3, 0.0),

vec3(0.35, 0.3, 0.0), vec3(0.35, -0.3, 0.0), vec3(0.45, -0.3, 0.0), 
vec3(0.45, 0.3, 0.0), vec3(0.45, -0.3, 0.0), vec3(0.35, 0.3, 0.0),

vec3(-0.55, 0.1, 0.0), vec3(-0.55, -0.1, 0.0), vec3(-0.5, 0.05, 0.0),
vec3(-0.5, 0.05, 0.0), vec3(-0.5, -0.05, 0.0), vec3(-0.55, -0.1, 0.0),

vec3(-0.35, 0.1, 0.0), vec3(-0.35, -0.1, 0.0), vec3(-0.4, 0.05, 0.0),
vec3(-0.4, 0.05, 0.0), vec3(-0.4, -0.05, 0.0), vec3(-0.35, -0.1, 0.0),

vec3(-0.5, 0.05, 0.0), vec3(-0.4, 0.05, 0.0), vec3(-0.4, -0.05, 0.0),
vec3(-0.5, -0.05, 0.0), vec3(-0.4, -0.05, 0.0), vec3(-0.5, 0.05, 0.0),

vec3(0.0, 0.3, 0.0), vec3(0.0, 0.2, 0.0), vec3(0.1, 0.3, 0.0),
vec3(0.0, 0.2, 0.0), vec3(0.2, 0.2, 0.0), vec3(0.1, 0.3, 0.0),
vec3(0.0, 0.2, 0.0), vec3(0.2, 0.2, 0.0), vec3(0.2, 0.1, 0.0),
vec3(0.0, 0.1, 0.0), vec3(0.2, 0.1, 0.0), vec3(0.1, 0.15, 0.0),
vec3(0.0, 0.1, 0.0), vec3(0.2, 0.1, 0.0), vec3(0.1, 0.05, 0.0),
vec3(0.0, 0.1, 0.0), vec3(0.0, -0.05, 0.0), vec3(0.1, 0.05, 0.0),
vec3(0.45, 0.1, 0.0), vec3(0.65, 0.1, 0.0), vec3(0.55, 0.15, 0.0),
vec3(0.6, 0.2, 0.0), vec3(0.65, 0.1, 0.0), vec3(0.55, 0.15, 0.0),
vec3(0.6, 0.2, 0.0), vec3(0.65, 0.1, 0.0), vec3(0.7, 0.2, 0.0),
vec3(0.6, 0.2, 0.0), vec3(0.65, 0.3, 0.0), vec3(0.7, 0.2, 0.0),
vec3(0.7, 0.2, 0.0), vec3(0.65, 0.3, 0.0), vec3(0.7, 0.3, 0.0),
vec3(0.45, 0.1, 0.0), vec3(0.65, 0.1, 0.0), vec3(0.6, 0.05, 0.0),
vec3(0.45, 0.1, 0.0), vec3(0.45, -0.05, 0.0), vec3(0.6, 0.05, 0.0),

vec3(0.0, -0.3, 0.0), vec3(0.0, -0.2, 0.0), vec3(0.1, -0.3, 0.0),
vec3(0.0, -0.2, 0.0), vec3(0.2, -0.2, 0.0), vec3(0.1, -0.3, 0.0),
vec3(0.0, -0.2, 0.0), vec3(0.2, -0.2, 0.0), vec3(0.2, -0.1, 0.0),
vec3(0.0, -0.1, 0.0), vec3(0.2, -0.1, 0.0), vec3(0.1, -0.15, 0.0),
vec3(0.0, -0.1, 0.0), vec3(0.2, -0.1, 0.0), vec3(0.1, -0.05, 0.0),
vec3(0.0, -0.1, 0.0), vec3(0.0, 0.05, 0.0), vec3(0.1, -0.05, 0.0),
vec3(0.45, -0.1, 0.0), vec3(0.65, -0.1, 0.0), vec3(0.55, -0.15, 0.0),
vec3(0.6, -0.2, 0.0), vec3(0.65, -0.1, 0.0), vec3(0.55, -0.15, 0.0),
vec3(0.6, -0.2, 0.0), vec3(0.65, -0.1, 0.0), vec3(0.7, -0.2, 0.0),
vec3(0.6, -0.2, 0.0), vec3(0.65, -0.3, 0.0), vec3(0.7, -0.2, 0.0),
vec3(0.7, -0.2, 0.0), vec3(0.65, -0.3, 0.0), vec3(0.7, -0.3, 0.0),
vec3(0.45, -0.1, 0.0), vec3(0.65, -0.1, 0.0), vec3(0.6, -0.05, 0.0),
vec3(0.45, -0.1, 0.0), vec3(0.45, 0.05, 0.0), vec3(0.6, -0.05, 0.0),

];

window.onload = function () { 
  const canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported!");
    return;
  }

  const vs = `
    attribute vec3 vPosition;
    attribute vec3 vNormal;

    uniform mat4 modelView;
    uniform mat4 projection;
    uniform mat3 normalMatrix;

    varying vec3 fPosition;
    varying vec3 fNormal;

    void main() {
      vec4 mvPos = modelView * vec4(vPosition, 1.0);
      fPosition = mvPos.xyz;
      fNormal = normalize(normalMatrix * vNormal);

      gl_Position = projection * mvPos;
      gl_PointSize = 5.0;
    }
  `;

  const fs = `
      precision mediump float;

      uniform vec3 uColor;
      uniform vec3 lightPos;
      uniform vec3 cameraPos;
      uniform float ambientStrength;
      uniform float diffuseStrength;
      uniform float specularStrength;
      uniform float shineStrength;

      varying vec3 fPosition;
      varying vec3 fNormal;

      void main() {
        vec3 ambient = ambientStrength * uColor;
        vec3 L = normalize(lightPos - fPosition);
        vec3 V = normalize(cameraPos - fPosition);
        vec3 N0 = normalize(fNormal);
        vec3 N = (dot(N0, V) < 0.0) ? -N0 : N0;
        vec3 H = normalize(L + V);
        float diff = max(dot(N, L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), shineStrength);
        vec3 diffuse = diffuseStrength * diff * uColor;
        vec3 specular = specularStrength * spec * vec3(1.0);
        gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
      }
  `;

  window.onkeydown = function (e) {
    const step = 0.02;
    if (e.key === "ArrowLeft")  move[0] -= step;
    if (e.key === "ArrowRight") move[0] += step;
    if (e.key === "ArrowUp") move[1] += step;
    if (e.key === "ArrowDown") move[1] -= step;
  };

  let point_size = point_vertices.length;

  for (let i = 0; i < point_size; i++) {
    let v1 = point_vertices[i].slice();
    v1[2]+=0.1;
    point_vertices.push(v1);
  }

  let tri_size = triangle_vertices.length;

  for (let i = 0; i < tri_size; i+=3) {
    let v1 = triangle_vertices[i].slice();
    let v2 = triangle_vertices[i+1].slice();
    let v3 = triangle_vertices[i+2].slice();
    v1[2]+=0.1, v2[2]+=0.1, v3[2]+=0.1;

    triangle_vertices.push(v1);
    triangle_vertices.push(v2);
    triangle_vertices.push(v3);
  }

  let line_size = line_vertices.length;

  for (let i = 0; i < line_size; i+=2) {
    let v1 = line_vertices[i].slice();
    let v2 = line_vertices[i+1].slice();
    v1[2]+=0.1, v2[2]+=0.1;

    line_vertices.push(v1);
    line_vertices.push(v2);
  }

  for (let i = 0; i < line_size; i+=2) {
    let v1 = line_vertices[i].slice();
    let v2 = line_vertices[i+1].slice();

    let u1 = line_vertices[line_size+i].slice();
    let u2 = line_vertices[line_size+i+1].slice();

    triangle_vertices.push(v1);
    triangle_vertices.push(v2);
    triangle_vertices.push(u1);

    triangle_vertices.push(u1);
    triangle_vertices.push(u2);
    triangle_vertices.push(v2);
  }

  for (let i = 0; i < line_size; i++) {
    let v1 = line_vertices[i].slice();
    let v2 = line_vertices[line_size+i].slice();

    line_vertices.push(v1);
    line_vertices.push(v2);
  }

  const triangle_normals = [];
  for (let i = 0; i < triangle_vertices.length; i += 3) {
    const p1 = triangle_vertices[i];
    const p2 = triangle_vertices[i + 1];
    const p3 = triangle_vertices[i + 2];
    const u = subtract(p2, p1);
    const v = subtract(p3, p1);
    const n = normalize(cross(u, v));
    triangle_normals.push(n, n, n);
  }
  
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vs);
  gl.compileShader(vShader);

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fs);
  gl.compileShader(fShader);

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.STATIC_DRAW);

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(triangle_normals), gl.STATIC_DRAW);

  vPosition = gl.getAttribLocation(program, "vPosition");
  vNormal = gl.getAttribLocation(program, "vNormal");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  uColor = gl.getUniformLocation(program, "uColor");
  modelView = gl.getUniformLocation(program, "modelView");
  projection = gl.getUniformLocation(program, "projection");
  uAmbientStrength = gl.getUniformLocation(program, "ambientStrength");
  uSpecularStrength = gl.getUniformLocation(program, "specularStrength");
  uDiffuseStrength = gl.getUniformLocation(program, "diffuseStrength");
  uShineStrength = gl.getUniformLocation(program, "shineStrength");
  uLightPos = gl.getUniformLocation(program, "lightPos");

  document.getElementById("R").oninput = e => color[0] = parseFloat(e.target.value);
  document.getElementById("G").oninput = e => color[1] = parseFloat(e.target.value);
  document.getElementById("B").oninput = e => color[2] = parseFloat(e.target.value);

  document.getElementById("ambientStrength").oninput = e => ambientStrength = parseFloat(e.target.value);
  document.getElementById("specularStrength").oninput = e => specularStrength = parseFloat(e.target.value);
  document.getElementById("diffuseStrength").oninput = e => diffuseStrength = parseFloat(e.target.value);
  document.getElementById("shineStrength").oninput = e => shineStrength = parseFloat(e.target.value);
  document.getElementById("lightX").oninput = e => lightPos[0] = parseFloat(e.target.value);
  document.getElementById("lightY").oninput = e => lightPos[1] = parseFloat(e.target.value);
  document.getElementById("lightZ").oninput = e => lightPos[2] = parseFloat(e.target.value);

  document.getElementById("mode").onchange = e => { currentMode = e.target.value; };

  document.getElementById("rotateX").onclick = () => angle[0] += 5.0;
  document.getElementById("rotateY").onclick = () => angle[1] += 5.0;
  document.getElementById("rotateZ").onclick = () => angle[2] += 5.0;

  document.getElementById("translateX").onclick = () => move[0] += 0.1;
  document.getElementById("translateY").onclick = () => move[1] += 0.1;
  document.getElementById("translateZ").onclick = () => move[2] += 0.1;

  document.getElementById("scaleUp").onclick = () => zoom *= 1.1;
  document.getElementById("scaleDown").onclick = () => zoom /= 1.1;

  document.getElementById("auto_rotateX").onclick = () => {
    isRotating[0] = isRotating[0]^1; 
  };
  document.getElementById("auto_rotateY").onclick = () => {
    isRotating[1] = isRotating[1]^1; 
  };
  document.getElementById("auto_rotateZ").onclick = () => {
    isRotating[2] = isRotating[2]^1; 
  };

  const eyeInputs = ["eyeX", "eyeY", "eyeZ", "atX", "atY", "atZ", "upX", "upY", "upZ"];
  eyeInputs.forEach(id => document.getElementById(id).oninput = updateCamera);

  function updateCamera() {
    eye = vec3(
      parseFloat(document.getElementById("eyeX").value),
      parseFloat(document.getElementById("eyeY").value),
      parseFloat(document.getElementById("eyeZ").value)
    );
    at = vec3(
      parseFloat(document.getElementById("atX").value),
      parseFloat(document.getElementById("atY").value),
      parseFloat(document.getElementById("atZ").value)
    );
    up = vec3(
      parseFloat(document.getElementById("upX").value),
      parseFloat(document.getElementById("upY").value),
      parseFloat(document.getElementById("upZ").value)
    );
  }

  document.getElementById("viewFront").onclick = () => {
    document.getElementById("eyeX").value = 0;
    document.getElementById("eyeY").value = 0;
    document.getElementById("eyeZ").value = 2;
    updateCamera();
  };
  
  document.getElementById("viewSide").onclick = () => {
    document.getElementById("eyeX").value = 2;
    document.getElementById("eyeY").value = 0;
    document.getElementById("eyeZ").value = 0;
    updateCamera();
  };
  
  document.getElementById("viewTop").onclick = () => {
    document.getElementById("eyeX").value = 0;
    document.getElementById("eyeY").value = 2;
    document.getElementById("eyeZ").value = 0;
    updateCamera();
  };

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const width = canvas.width;
    const height = canvas.height;

    const ndcX = (x / width) * 2 - 1;       
    const ndcY = -((y / height) * 2 - 1);   
  
    const eyeX = ndcX * 3.0; 
    const eyeY = ndcY * 3.0; 
    const eyeZ = 3.0 - 1.5 * Math.abs(ndcY); 
  
    document.getElementById("eyeX").value = eyeX.toFixed(2);
    document.getElementById("eyeY").value = eyeY.toFixed(2);
    document.getElementById("eyeZ").value = eyeZ.toFixed(2);
  
    updateCamera();
  });

  uCameraPos = gl.getUniformLocation(program, "cameraPos");
  uNormalMatrix = gl.getUniformLocation(program, "normalMatrix");
  
  render();
};

function render() {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.uniform3fv(uColor, color);

  if (isRotating[0]) {
    angle[0] += 1.0;
  }
  if (isRotating[1]) {
    angle[1] += 1.0;
  }
  if (isRotating[2]) {
    angle[2] += 1.0;
  }

  let mvMatrix = mat4();
  mvMatrix = mult(mvMatrix, translate(vec3(move[0], move[1], move[2])));
  mvMatrix = mult(mvMatrix, rotateX(angle[0]));
  mvMatrix = mult(mvMatrix, rotateY(angle[1]));
  mvMatrix = mult(mvMatrix, rotateZ(angle[2]));
  mvMatrix = mult(mvMatrix, scalem(zoom, zoom, zoom));
  mvMatrix = mult(lookAt(eye, at, up), mvMatrix);

  let normalMatrix = [
    mvMatrix[0].slice(0, 3),
    mvMatrix[1].slice(0, 3),
    mvMatrix[2].slice(0, 3)
  ];

  let pMatrix = perspective(45, 1, 0.1, 10);

  gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(projection, false, flatten(pMatrix));
  gl.uniformMatrix3fv(uNormalMatrix, false, flatten(normalMatrix));

  gl.uniform3fv(uLightPos, lightPos);
  gl.uniform3fv(uCameraPos, eye);               
  gl.uniform1f(uAmbientStrength, ambientStrength);
  gl.uniform1f(uSpecularStrength, specularStrength);
  gl.uniform1f(uDiffuseStrength, diffuseStrength);
  gl.uniform1f(uShineStrength, shineStrength);
  
  let vertices = [];
  if (currentMode === "POINTS") vertices = point_vertices;
  else if (currentMode === "LINES") vertices = line_vertices;
  else if (currentMode === "TRIANGLES") vertices = triangle_vertices;
  else if (currentMode === "ALL") vertices = triangle_vertices.concat(line_vertices, point_vertices);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  if (currentMode === "TRIANGLES" || currentMode === "ALL") {
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
  } else {
    gl.disableVertexAttribArray(vNormal);
    gl.vertexAttrib3f(vNormal, 0.0, 0.0, 1.0);
  }

  if (currentMode === "POINTS") gl.drawArrays(gl.POINTS, 0, vertices.length);
  else if (currentMode === "LINES") gl.drawArrays(gl.LINES, 0, vertices.length);
  else if (currentMode === "TRIANGLES") gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
  else if (currentMode === "ALL") {
    const triLen = triangle_vertices.length;
    const lineLen = line_vertices.length;
    gl.drawArrays(gl.TRIANGLES, 0, triLen);
    gl.drawArrays(gl.LINES, triLen, lineLen);
    gl.drawArrays(gl.POINTS, triLen + lineLen, point_vertices.length);
  }

  requestAnimationFrame(render);
}