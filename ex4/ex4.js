"use strict";
var gl;

var pointsArray = [];
var normalsArray = [];

var lightPosition = vec4(0.0, 0.0, 1.0, 1.0);
var a = 1.0;
var b = 0.1;
var c = 0.01;

var xl = 0.0;
var yl = 0.0;
var zl = 0.0;
var wl = 1.0;

var lightAmbient = vec4(0.2, 0.2, 0.2, 0.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 ); 
var materialDiffuse = vec4( 1.0, 0.8, 0.5, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.5, 1.0 );
var materialShininess = 100.0;

var ambProductLoc;
var difProductLoc;
var speProductLoc;
var lightPosLoc;
var shininessLoc;
var aLoc;
var bLoc;
var cLoc;

var texSize = 32;

var vMatrix;
var vMatrixLoc;

var mvMatrix;
var mvMatrixLoc;

var pMatrix;
var pMatrixLoc;

var eye = vec3(0, 0, 2);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

var xe = 0;
var ye = 0;
var ze = 10;

var xa = 0;
var ya = 0;
var za = 0;

var xu = 0;
var yu = 1;
var zu = 0;

var viewStatus = 0;

var elbowtheta = [0, 0, 0];
var theta = [0, 0, 0];
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var xthetaValue = 0;
var ythetaValue = 0;
var zthetaValue = 0;

var xt = 0;
var yt = 0;
var zt = 0;

var xs = 1;
var ys = 1;
var zs = 1;

var fovy = 60;
var aspect = 1;
var near = 0.1;
var far = 100;

var vertices = [
    vec4( -0.5, 0.5, 1.0, 1.0),
    vec4( 0.5, 0.5, 1.0, 1.0),
    vec4( 0.5, -0.5, 1.0, 1.0),
    vec4( -0.5, -0.5, 1.0, 1.0),
    vec4( -0.5, 0.5, -1.0, 1.0),
    vec4( 0.5, 0.5, -1.0, 1.0),
    vec4( 0.5, -0.5, -1.0, 1.0),
    vec4( -0.5, -0.5, -1.0, 1.0),
];

var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function trio(a, b, c) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[a]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);
}

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[0]);
    
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[3]);
}

function colorCube() {
    quad(1, 0, 3, 2); // Front face
    quad(4, 5, 6, 7); // Back face
    quad(5, 1, 2, 6); // Right face
    quad(0, 4, 7, 3); // Left face
    quad(4, 0, 1, 5); // Top face
    quad(3, 7, 6, 2); // Bottom face
  }


window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1, 1, 1, 0.0 );

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // normal
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    // position
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // texture
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var texture;
    var ex_image;
    
    function initTextures() {
        texture = gl.createTexture();
        ex_image = new Image();
        ex_image.onload = function () {
            handleTextureLoaded(ex_image, texture);
        };
        ex_image.src = "data:image/jpeg;base64,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";
    }
    
    function handleTextureLoaded(image, texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap( gl.TEXTURE_2D );
    }
    
    initTextures();

    // Set Values for Blinn-Phong Shading
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    ambProductLoc = gl.getUniformLocation(program, "ambientProduct");
    difProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    speProductLoc = gl.getUniformLocation(program, "specularProduct");
    lightPosLoc = gl.getUniformLocation(program, "lightPosition");
    shininessLoc = gl.getUniformLocation(program, "shininess");

    gl.uniform4fv(ambProductLoc, flatten(ambientProduct));
    gl.uniform4fv(difProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(speProductLoc, flatten(specularProduct));
    gl.uniform4fv(lightPosLoc, flatten(lightPosition));
    gl.uniform1f(shininessLoc, materialShininess);

    // Set distance constant
    aLoc = gl.getUniformLocation(program, "a");
    bLoc = gl.getUniformLocation(program, "b");
    cLoc = gl.getUniformLocation(program, "c");
    gl.uniform1f(aLoc, a);
    gl.uniform1f(bLoc, b);
    gl.uniform1f(cLoc, c);

    // Initialize the shader's vMatrix with an identity matrix
    vMatrix = mat4();
    vMatrixLoc = gl.getUniformLocation(program, "vMatrix");
    gl.uniformMatrix4fv(vMatrixLoc, false, flatten(vMatrix));

    // Initialize the shader's mvMatrix with an identity matrix
    mvMatrix = mat4();
    mvMatrixLoc = gl.getUniformLocation(program,"mvMatrix");
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

    // Initialize the shader's pMatrix with an identity matrix
    pMatrix = mat4();
    pMatrixLoc = gl.getUniformLocation(program, "pMatrix");
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));

    // Translation 
    document.getElementById("xt-slider").oninput =
    function(event)
    {
        xt = event.target.value;
    };

    document.getElementById("yt-slider").oninput =
    function(event)
    {
        yt = event.target.value;
    };

    document.getElementById("zt-slider").oninput =
    function(event)
    {
        zt = event.target.value;
    };

    // Scaling
    document.getElementById("xs-slider").oninput = 
    function(event) 
    {
        xs = event.target.value;
    };
    
    document.getElementById("ys-slider").oninput = 
    function(event) 
    {
        ys = event.target.value;
    };
    
    document.getElementById("zs-slider").oninput = 
    function(event) 
    {
        zs = event.target.value;
    };
    
    document.getElementById("elbow-x").oninput = 
    function(event) 
    {
        elbowtheta[0] = event.target.value - 180;
    };
    
    document.getElementById("elbow-y").oninput = 
    function(event) 
    {
        elbowtheta[1] = event.target.value - 180;
    };
    
    document.getElementById("elbow-z").oninput = 
    function(event) 
    {
        elbowtheta[2] = event.target.value - 180;
    };

    // Rotation
    document.getElementById("xr-button").onclick =
    function()
    {
        if(xthetaValue == 0)
        {
            xthetaValue = 1;
        }
    };

    document.getElementById("yr-button").onclick =
    function()
    {
        if(ythetaValue == 0)
        {
            ythetaValue = 1;
        }
    };

    document.getElementById("zr-button").onclick =
    function()
    {
        if(zthetaValue == 0)
        {
            zthetaValue = 1;
        }
    };

    // Front View
    document.getElementById("fv-button").onclick =
    function()
    {
        xe = 0;
        ye = 0;
        ze = 10;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 1;
        zu = 0;

        viewStatus = 0;
    };

    // Back View
    document.getElementById("bv-button").onclick =
    function()
    {
        xe = 0;
        ye = 0;
        ze = -10;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 1;
        zu = 0;

        viewStatus = 1;
    };

    // Left View
    document.getElementById("lv-button").onclick =
    function()
    {
        xe = -10;
        ye = 0;
        ze = 0;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 1;
        zu = 0;

        viewStatus = 2;
    };

    // Right View
    document.getElementById("rv-button").onclick =
    function()
    {
        xe = 10;
        ye = 0;
        ze = 0;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 1;
        zu = 0;

        viewStatus = 3;
    };

    // Top View
    document.getElementById("tv-button").onclick =
    function()
    {
        xe = 0;
        ye = 10;
        ze = 10;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 0;
        zu = -1;

        viewStatus = 4;
    };

    // Bottom View
    document.getElementById("btv-button").onclick =
    function()
    {
        xe = 0;
        ye = -10;
        ze = 0;

        xa = 0;
        ya = 0;
        za = 0;

        xu = 0;
        yu = 0;
        zu = 1;

        viewStatus = 5;
    };

    // Light Position
    document.getElementById("xl-slider").oninput =
    function(event)
    {
        xl = event.target.value;
    };

    document.getElementById("yl-slider").oninput =
    function(event)
    {
        yl = event.target.value;
    };

    document.getElementById("zl-slider").oninput =
    function(event)
    {
        if(event.target.value != 2.0)
            zl = event.target.value;
    };

    // Light Type
    document.getElementById("pl-button").onclick =
    function()
    {
        wl = 1.0;
        a = 1.0;
        b = 0.1;
        c = 0.01;
    };

    document.getElementById("dl-button").onclick =
    function()
    {
        wl = 0.0;
        a = 1.0;
        b = 0.0;
        c = 0.0;
    };

    // Reset translation
    document.getElementById("reset-t-button").onclick =
    function()
    {
        xt = 0;
        yt = 0;
        zt = 0;

        document.getElementById('xt-slider').value = 0.0;
        document.getElementById('yt-slider').value = 0.0;
        document.getElementById('zt-slider').value = 0.0;
    };

    // Reset Scaling
    document.getElementById("reset-s-button").onclick =
    function()
    {
        xs = 1;
        ys = 1;
        zs = 1;

        document.getElementById('xs-slider').value = 1.0;
        document.getElementById('ys-slider').value = 1.0;
        document.getElementById('zs-slider').value = 1.0;
    };

    // Reset Rotation
    document.getElementById("reset-r-button").onclick =
    function()
    {
        xthetaValue = 0;
        ythetaValue = 0;
        zthetaValue = 0;

        theta[xAxis] = 0;
        theta[yAxis] = 0;
        theta[zAxis] = 0;
    };

    // Reset Light Position
    document.getElementById("reset-l-button").onclick =
    function()
    {
        xl = 0.0;
        yl = 0.0;
        zl = 1.0;

        document.getElementById('xl-slider').value = 0.0;
        document.getElementById('yl-slider').value = 0.0;
        document.getElementById('zl-slider').value = 0.0;
    };

    // mouse location = camera location
    gl.canvas.addEventListener('mousemove', (e) => {
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        var h; // horizontal
        var v; // vertical
     
        if(viewStatus == 0) // Front View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            xe = (h / rect.width  *  2 - 1);
            ye = (v / rect.height * -2 + 1);
        }
        else if(viewStatus == 1) // Back View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            xe = -(h / rect.width  *  2 - 1);
            ye = (v / rect.height * -2 + 1);
        }

        else if(viewStatus == 2) // Left View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            ze = (h / rect.width  *  2 - 1);
            ye = (v / rect.height * -2 + 1);
        }
        else if(viewStatus == 3) // Right View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            ze = -(h / rect.width  *  2 - 1);
            ye = (v / rect.height * -2 + 1);
        }

        else if(viewStatus == 4) // Top View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            xe = (h / rect.width  *  2 - 1);
            ze = -(v / rect.height * -2 + 1);
        }
        else if(viewStatus == 5) // Bottom View
        {
            h = e.clientX - rect.left;
            v = e.clientY - rect.top;
            xe = (h / rect.width  *  2 - 1);
            ze = (v / rect.height * -2 + 1);
        }
    });
    
    render();
};

var ELBOW_WIDTH = 1.5;
var ELBOW_LENGTH = 3.0;
var ELBOW_HEIGHT = 1.0;
var LOWPALM_WIDTH = 2.2;
var LOWPALM_LENGTH = 0.8;
var LOWPALM_HEIGHT = 0.8;
var HIGHPALM_WIDTH = 2.2;
var HIGHPALM_LENGTH = 0.4;
var HIGHPALM_HEIGHT = 0.8;
var THUMB_WIDTH = 0.7;
var THUMB_LENGTH = 0.5;
var THUMB_HEIGHT = 0.7;
var THUMB1_WIDTH = 0.6;
var THUMB1_LENGTH = 0.5;
var THUMB1_HEIGHT = 0.7;
var IDXF_WIDTH = 0.45;
var IDXF_LENGTH = 0.48;
var IDXF_HEIGHT = 0.5;
var IDXF1_WIDTH = 0.45;
var IDXF1_LENGTH = 0.4;
var IDXF1_HEIGHT = 0.5;
var IDXF2_WIDTH = 0.45;
var IDXF2_LENGTH = 0.3;
var IDXF2_HEIGHT = 0.5;
var MDF_WIDTH = 0.45;
var MDF_LENGTH = 0.5;
var MDF_HEIGHT = 0.5;
var MDF1_WIDTH = 0.45;
var MDF1_LENGTH = 0.45;
var MDF1_HEIGHT = 0.5;
var MDF2_WIDTH = 0.45;
var MDF2_LENGTH = 0.3;
var MDF2_HEIGHT = 0.5;
var RIF_WIDTH = 0.45;
var RIF_LENGTH = 0.45;
var RIF_HEIGHT = 0.5;
var RIF1_WIDTH = 0.45;
var RIF1_LENGTH = 0.4;
var RIF1_HEIGHT = 0.5;
var RIF2_WIDTH = 0.45;
var RIF2_LENGTH = 0.3;
var RIF2_HEIGHT = 0.5;
var LIF_WIDTH = 0.4;
var LIF_LENGTH = 0.4;
var LIF_HEIGHT = 0.5;
var LIF1_WIDTH = 0.4;
var LIF1_LENGTH = 0.35;
var LIF1_HEIGHT = 0.5;
var LIF2_WIDTH = 0.4;
var LIF2_LENGTH = 0.3;
var LIF2_HEIGHT = 0.5;

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

function elbow() {
    var s = scale4(ELBOW_WIDTH, ELBOW_HEIGHT, ELBOW_LENGTH);
    var instanceMatrix = mult( translate( 0.0, 0.0, 0.5*ELBOW_LENGTH ), s);
    var t = mult(mvMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, 36);
}

function lowpalm() {
    var s = scale4(LOWPALM_WIDTH, LOWPALM_HEIGHT, LOWPALM_LENGTH);
    var instanceMatrix = mult( translate( 0.0, 0.0, 0.5*LOWPALM_LENGTH ), s);
    var t = mult(mvMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t));
    gl.drawArrays( gl.TRIANGLES, 0, 36);
}
function highpalm() {
    var s = scale4(HIGHPALM_WIDTH, HIGHPALM_HEIGHT, HIGHPALM_LENGTH);
    var instanceMatrix = mult( translate( 0.0, 0.0, -1.7*HIGHPALM_LENGTH ), s);
    var t = mult(mvMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t));
    gl.drawArrays( gl.TRIANGLES, 0, 36);
}

function thumb1(curMatrix){
    curMatrix = mult(curMatrix, translate(0.5*THUMB_WIDTH, 0.5*THUMB1_HEIGHT, 2*THUMB_LENGTH));
    curMatrix = mult(curMatrix, rotate(180,0,1,0));
    // curMatrix = mult(curMatrix, rotate(30,1,0,0));

    var s = scale4(THUMB1_WIDTH, THUMB1_HEIGHT, THUMB1_LENGTH);
    var instanceMatrix = mult(translate( 0.0, 0.0, -THUMB1_HEIGHT), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function thumb() {
    var tmpMatrix = mult(mvMatrix, translate(-0.9*LOWPALM_WIDTH, -0.25*THUMB_HEIGHT, 0.0)); // 축의 위치
    tmpMatrix = mult(tmpMatrix, rotate(-10,0,1,0));
    // tmpMatrix = mult(tmpMatrix, rotate(-10,0,0,1));

    var s = scale4(THUMB_WIDTH, THUMB_HEIGHT, THUMB_LENGTH);
    var instanceMatrix = mult(translate( 0.5*THUMB_WIDTH, 0.5*THUMB1_HEIGHT, THUMB_LENGTH), s); // 실제 모형의 위치
    var t = mult(tmpMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    thumb1(tmpMatrix);
}

function indexfinger2(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 2.3*IDXF1_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(10,1,0,0));

    var s = scale4(IDXF2_WIDTH, IDXF2_HEIGHT, IDXF2_LENGTH);
    var instanceMatrix = mult(translate( 0.6*IDXF2_WIDTH, 0.0, IDXF2_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function indexfinger1(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 3*IDXF_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,1,0));
    // curMatrix = mult(curMatrix, rotate(-10,1,0,0));

    var s = scale4(IDXF1_WIDTH, IDXF1_HEIGHT, IDXF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*IDXF1_WIDTH, 0.0, IDXF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    indexfinger2(curMatrix);
}

function indexfinger() {
    var tmpMatrix = mult(mvMatrix, translate(2.4*IDXF_WIDTH, 0.0, -LOWPALM_LENGTH));
    tmpMatrix = mult(tmpMatrix, rotate(180,0,1,0));
    // tmpMatrix = mult(tmpMatrix, rotate(-10,1,0,0));

    var s = scale4(IDXF_WIDTH, IDXF_HEIGHT, IDXF_LENGTH);
    var instanceMatrix = mult(translate( 0.6*IDXF_WIDTH, 0.0, 1.8*IDXF_LENGTH), s);
    var t = mult(tmpMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    indexfinger1(tmpMatrix);
}

function middlefinger2(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 2.3*MDF1_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(MDF1_WIDTH, MDF1_HEIGHT, MDF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*MDF1_WIDTH, 0.0, MDF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function middlefinger1(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 3*MDF_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(MDF1_WIDTH, MDF1_HEIGHT, MDF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*MDF1_WIDTH, 0.0, MDF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    middlefinger2(curMatrix)
}

function middlefinger() {
    var tmpMatrix = mult(mvMatrix, translate(1.1*MDF_WIDTH, 0.0, -LOWPALM_LENGTH));
    tmpMatrix = mult(tmpMatrix, rotate(180,0,1,0));
    // tmpMatrix = mult(tmpMatrix, rotate(-30,1,0,0));

    var s = scale4(MDF_WIDTH, MDF_HEIGHT, MDF_LENGTH);
    var instanceMatrix = mult(translate( 0.6*MDF_WIDTH, 0.0, 1.8*MDF_LENGTH), s);
    var t = mult(tmpMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    middlefinger1(tmpMatrix);
}

function ringfinger2(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 2.3*RIF1_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(RIF1_WIDTH, RIF1_HEIGHT, RIF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*RIF1_WIDTH, 0.0, RIF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function ringfinger1(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 3*RIF_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(RIF1_WIDTH, RIF1_HEIGHT, RIF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*RIF1_WIDTH, 0.0, RIF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    ringfinger2(curMatrix)
}

function ringfinger() {
    var tmpMatrix = mult(mvMatrix, translate(-0.2*RIF_WIDTH, 0.0, -LOWPALM_LENGTH));
    tmpMatrix = mult(tmpMatrix, rotate(180,0,1,0));
    // tmpMatrix = mult(tmpMatrix, rotate(-30,1,0,0));

    var s = scale4(RIF_WIDTH, RIF_HEIGHT, RIF_LENGTH);
    var instanceMatrix = mult(translate( 0.6*RIF_WIDTH, 0.0, 1.8*RIF_LENGTH), s);
    var t = mult(tmpMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    ringfinger1(tmpMatrix);
}

function littlefinger2(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 2.3*LIF1_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(LIF1_WIDTH, LIF1_HEIGHT, LIF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*LIF1_WIDTH, 0.0, LIF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function littlefinger1(curMatrix){
    curMatrix = mult(curMatrix, translate(0.0, 0.0, 3*LIF_LENGTH));
    curMatrix = mult(curMatrix, rotate(0,0,0,1));
    // curMatrix = mult(curMatrix, rotate(-30,1,0,0));

    var s = scale4(LIF1_WIDTH, LIF1_HEIGHT, LIF1_LENGTH);
    var instanceMatrix = mult(translate( 0.6*LIF1_WIDTH, 0.0, LIF1_LENGTH), s);
    var t = mult(curMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    littlefinger2(curMatrix)
}

function littlefinger() {
    var tmpMatrix = mult(mvMatrix, translate(-1.6*LIF_WIDTH, 0.0, -LOWPALM_LENGTH));
    tmpMatrix = mult(tmpMatrix, rotate(180,0,1,0));
    // tmpMatrix = mult(tmpMatrix, rotate(-30,1,0,0));

    var s = scale4(LIF_WIDTH, LIF_HEIGHT, LIF_LENGTH);
    var instanceMatrix = mult(translate( 0.6*LIF_WIDTH, 0.0, 1.8*LIF_LENGTH), s);
    var t = mult(tmpMatrix, instanceMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(t))
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    littlefinger1(tmpMatrix);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    eye = vec3(xe, ye, ze);
    at = vec3(xa, ya, za);
    up = vec3(xu, yu, zu);

    lightPosition = vec4(xl, yl, zl, wl);
    if(!(xl == xe && yl == ye && zl == ze))
    {
        gl.uniform4fv(lightPosLoc, flatten(lightPosition));
    }

    gl.uniform1f(aLoc, a);
    gl.uniform1f(bLoc, b);
    gl.uniform1f(cLoc, c);

    vMatrix = lookAt(eye, at, up);
    pMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(vMatrixLoc, false, flatten(vMatrix));
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));

    // Matrix Composition for H
    mvMatrix = vMatrix;
    mvMatrix = mult(mvMatrix,rotate(0,0,0,1));
    mvMatrix = mult(mvMatrix,rotate(elbowtheta[0],1,0,0));
    mvMatrix = mult(mvMatrix,rotate(elbowtheta[1],0,1,0));
    mvMatrix = mult(mvMatrix,rotate(elbowtheta[2],0,0,1));
    mvMatrix = mult(mvMatrix, translate(0.0, 0.0, -ELBOW_LENGTH));
    elbow();

    mvMatrix = mult(mvMatrix, translate(0.1, 0.0, -ELBOW_LENGTH + LOWPALM_LENGTH));
    mvMatrix = mult(mvMatrix, rotate(180, 0, 1, 0 ));
    mvMatrix = mult(mvMatrix, rotate(-30, 1, 0, 0 ));
    lowpalm();

    thumb();

    mvMatrix = mult(mvMatrix, translate(0.0, 0.0, LOWPALM_LENGTH + HIGHPALM_LENGTH));
    mvMatrix = mult(mvMatrix, rotate(180, 0, 1, 0 ));
    // mvMatrix = mult(mvMatrix, rotate(30, 1, 0, 0 ));
    highpalm();

    indexfinger();
    middlefinger();
    ringfinger();
    littlefinger();

    window.requestAnimationFrame(render);
}
