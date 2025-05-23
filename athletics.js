/**
 * @fileoverview 2020 도쿄 올림픽 픽토그램 - Athletics (육상) 메인 애플리케이션
 * @description 모듈화된 구조로 리팩토링된 메인 애플리케이션.
 *              3D 인체 모델과 인터랙티브 카메라 제어를 포함합니다.
 * @author SCE433 Computer Graphics Team
 * @version 2.0.0
 */

// WebGL 관련 전역 변수
let gl;
let program;
let modelViewMatrix;

// 모듈 인스턴스
let humanModel;
let camera;

// 상태 변수
let isRunning = false;

/**
 * 배경색 상수 (검은색 고정)
 * @constant {vec4} BACKGROUND_COLOR
 */
const BACKGROUND_COLOR = vec4(0.0, 0.0, 0.0, 1.0);

/**
 * 애플리케이션 초기화 함수
 * @function init
 * @description WebGL 컨텍스트 초기화 및 모듈 설정
 */
window.onload = function init() {
    const canvas = document.getElementById("gl-canvas");
    
    // WebGL 컨텍스트 초기화
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL을 사용할 수 없습니다."); 
        return;
    }
    
    // 뷰포트 및 배경색 설정
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
    gl.enable(gl.DEPTH_TEST);
    
    // 셰이더 프로그램 초기화
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    if (program < 0) {
        console.error("셰이더 초기화 실패");
        return;
    }
    gl.useProgram(program);
    
    // 모듈 초기화 (캔버스를 카메라에 전달)
    humanModel = new HumanModel(gl, program);
    camera = new Camera(gl, program, canvas);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // render 함수를 전역으로 노출
    window.render = render;
    
    // 초기 렌더링
    render();
};

/**
 * 이벤트 리스너 설정
 * @function setupEventListeners
 * @description UI 컨트롤과 관련된 이벤트 리스너를 설정합니다
 */
function setupEventListeners() {
    // 포즈 토글
    document.getElementById("pose-toggle").addEventListener("click", function() {
        isRunning = !isRunning;
        this.textContent = isRunning ? "서 있는 포즈로 전환" : "달리기 포즈로 전환";
        render();
    });
    
    // 회전 X (슬라이더로도 제어 가능)
    document.getElementById("rotate-x").addEventListener("input", function() {
        const angle = parseInt(this.value);
        camera.setRotationX(angle);
        document.getElementById("rotate-x-value").textContent = angle + "°";
        render();
    });
    
    // 회전 Y (슬라이더로도 제어 가능)
    document.getElementById("rotate-y").addEventListener("input", function() {
        const angle = parseInt(this.value);
        camera.setRotationY(angle);
        document.getElementById("rotate-y-value").textContent = angle + "°";
        render();
    });
    
    // 크기 (슬라이더로도 제어 가능)
    document.getElementById("scale").addEventListener("input", function() {
        const scale = parseFloat(this.value);
        camera.setScale(scale);
        document.getElementById("scale-value").textContent = scale.toFixed(1) + "x";
        render();
    });
    
    // 초기화
    document.getElementById("reset-button").addEventListener("click", function() {
        // 카메라 초기화
        camera.reset();
        
        // UI 초기화
        document.getElementById("rotate-x").value = 0;
        document.getElementById("rotate-y").value = 0;
        document.getElementById("scale").value = 1;
        document.getElementById("rotate-x-value").textContent = "0°";
        document.getElementById("rotate-y-value").textContent = "0°";
        document.getElementById("scale-value").textContent = "1.0x";
        
        // 포즈 초기화
        isRunning = false;
        document.getElementById("pose-toggle").textContent = "달리기 포즈로 전환";
        
        render();
    });
}

/**
 * 렌더링 함수
 * @function render
 * @description 3D 장면을 렌더링합니다
 */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // 카메라 뷰 행렬 적용
    modelViewMatrix = camera.getViewMatrix();
    
    // 포즈에 따라 그리기
    if (isRunning) {
        humanModel.drawRunning();
    } else {
        humanModel.drawStanding();
    }
} 