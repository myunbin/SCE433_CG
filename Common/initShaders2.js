/**
 * @fileoverview 외부 쉐이더 파일을 로드하고 초기화하는 유틸리티 함수를 제공합니다.
 * 
 * @description
 * 이 파일은 별도의 .glsl 파일에 정의된 쉐이더 코드를 로드하여
 * WebGL 쉐이더 프로그램을 생성하는 함수를 제공합니다.
 * 
 * @example
 * // 쉐이더 파일 구조
 * // shaders/vertex.glsl
 * attribute vec4 vPosition;
 * void main() {
 *   gl_Position = vPosition;
 * }
 * 
 * // shaders/fragment.glsl
 * void main() {
 *   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
 * }
 * 
 * // JavaScript에서 쉐이더 초기화
 * const program = initShaders(gl, "shaders/vertex.glsl", "shaders/fragment.glsl");
 * if (!program) {
 *   console.error("쉐이더 초기화 실패");
 *   return;
 * }
 * gl.useProgram(program);
 */

/**
 * AJAX를 사용하여 파일을 문자열로 로드합니다.
 * 
 * @param {string} name - 로드할 파일의 경로
 * @return {string|null} 파일 내용 또는 로드 실패 시 null
 * 
 * @description
 * 이 함수는 동기식 AJAX 요청을 사용하여 파일을 로드합니다.
 * 로컬 파일 시스템과 웹 서버 모두에서 작동합니다.
 * 
 * @example
 * const shaderSource = loadFileAJAX("shaders/vertex.glsl");
 * if (!shaderSource) {
 *   console.error("쉐이더 파일 로드 실패");
 * }
 */
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};

/**
 * 외부 쉐이더 파일을 로드하고 컴파일하여 WebGL 쉐이더 프로그램을 생성합니다.
 * 
 * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
 * @param {string} vShaderName - 버텍스 쉐이더 파일 경로
 * @param {string} fShaderName - 프래그먼트 쉐이더 파일 경로
 * @return {WebGLProgram|null} 성공 시 생성된 쉐이더 프로그램, 실패 시 null
 * 
 * @description
 * 이 함수는 다음과 같은 작업을 수행합니다:
 * 1. 외부 파일에서 쉐이더 코드를 로드
 * 2. 쉐이더 컴파일
 * 3. 쉐이더 프로그램 생성 및 링크
 * 4. 오류 발생 시 적절한 에러 메시지 표시
 * 
 * @example
 * const program = initShaders(gl, "shaders/vertex.glsl", "shaders/fragment.glsl");
 * if (!program) {
 *   console.error("쉐이더 초기화 실패");
 *   return;
 * }
 * gl.useProgram(program);
 */
function initShaders(gl, vShaderName, fShaderName) {
    /**
     * 쉐이더 파일을 로드하고 컴파일합니다.
     * 
     * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
     * @param {string} shaderName - 쉐이더 파일 경로
     * @param {number} type - 쉐이더 타입 (gl.VERTEX_SHADER 또는 gl.FRAGMENT_SHADER)
     * @return {WebGLShader|null} 컴파일된 쉐이더 또는 실패 시 null
     * 
     * @description
     * 이 내부 함수는 개별 쉐이더 파일을 로드하고 컴파일합니다.
     * 컴파일 실패 시 에러 로그를 표시합니다.
     */
    function getShader(gl, shaderName, type) {
        var shader = gl.createShader(type),
            shaderScript = loadFileAJAX(shaderName);
        if (!shaderScript) {
            alert("Could not find shader source: "+shaderName);
        }
        gl.shaderSource(shader, shaderScript);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    var vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER),
        fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }

    
    return program;
};

