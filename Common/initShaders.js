//
//  initShaders.js
//

/**
 * @fileoverview HTML 문서에서 쉐이더 코드를 로드하고 초기화하는 유틸리티 함수를 제공합니다.
 * 
 * @description
 * 이 파일은 HTML 문서에 정의된 버텍스 쉐이더와 프래그먼트 쉐이더를 로드하여
 * WebGL 쉐이더 프로그램을 생성하는 함수를 제공합니다.
 * 
 * @example
 * // HTML에서 쉐이더 코드 정의
 * <script id="vertex-shader" type="x-shader/x-vertex">
 *   attribute vec4 vPosition;
 *   void main() {
 *     gl_Position = vPosition;
 *   }
 * </script>
 * 
 * <script id="fragment-shader" type="x-shader/x-fragment">
 *   void main() {
 *     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
 *   }
 * </script>
 * 
 * // JavaScript에서 쉐이더 초기화
 * const program = initShaders(gl, "vertex-shader", "fragment-shader");
 * if (program < 0) {
 *   console.error("쉐이더 초기화 실패");
 *   return;
 * }
 * gl.useProgram(program);
 */

/**
 * HTML 문서에서 쉐이더 코드를 로드하고 컴파일하여 WebGL 쉐이더 프로그램을 생성합니다.
 * 
 * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
 * @param {string} vertexShaderId - HTML에서 버텍스 쉐이더 코드를 가진 요소의 ID
 * @param {string} fragmentShaderId - HTML에서 프래그먼트 쉐이더 코드를 가진 요소의 ID
 * @return {WebGLProgram|number} 성공 시 생성된 쉐이더 프로그램, 실패 시 -1
 * 
 * @description
 * 이 함수는 다음과 같은 작업을 수행합니다:
 * 1. HTML에서 쉐이더 코드를 로드
 * 2. 쉐이더 컴파일
 * 3. 쉐이더 프로그램 생성 및 링크
 * 4. 오류 발생 시 적절한 에러 메시지 표시
 */
function initShaders( gl, vertexShaderId, fragmentShaderId )
{
    var vertShdr;
    var fragShdr;

    var vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) { 
        alert( "Unable to load vertex shader " + vertexShaderId );
        return -1;
    }
    else {
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertElem.text );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var fragElem = document.getElementById( fragmentShaderId );
    if ( !fragElem ) { 
        alert( "Unable to load vertex shader " + fragmentShaderId );
        return -1;
    }
    else {
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragElem.text );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    
    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}
