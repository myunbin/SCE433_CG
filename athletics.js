/**
 * @fileoverview 2020 도쿄 올림픽 픽토그램 - Athletics (육상) 메인 애플리케이션
 * @description 모듈화된 구조의 3D 인체 모델 시뮬레이션 애플리케이션입니다.
 *              인터랙티브 카메라 제어, 관절별 포즈 조정, 포즈 저장/애니메이션 기능을 제공합니다.
 * @author SCE433 Computer Graphics Team
 * @version 3.0.0 - 리팩토링 및 코드 최적화
 */

// WebGL 관련 전역 변수
let gl, program, modelViewMatrix;

// 모듈 인스턴스들
let humanModel, camera, poseController, poseStorage, animation;

// 상태 변수
let isRunning = false;

/**
 * 배경색 상수 (검은색)
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
    
    // 모듈 초기화 (순서 중요!)
    humanModel = new HumanModel(gl, program);
    camera = new Camera(gl, program, canvas);
    poseController = new PoseController(humanModel);
    poseStorage = new PoseStorage(poseController);
    animation = new Animation(poseController, poseStorage);
    
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
    setupAccordion();
    
    // 포즈 컨트롤 버튼들
    const poseButtons = {
        'apply-running-pose': () => poseController?.reapplyRunningPose(),
        'reset-all-pose': () => poseController?.resetAllRotations(),
        'reset-button': resetAll
    };
    
    Object.entries(poseButtons).forEach(([id, handler]) => {
        document.getElementById(id)?.addEventListener('click', handler);
    });
    
    // 카메라 회전/스케일 슬라이더들
    const cameraControls = [
        { id: 'rotate-x', setter: 'setRotationX', valueId: 'rotate-x-value', unit: '°' },
        { id: 'rotate-y', setter: 'setRotationY', valueId: 'rotate-y-value', unit: '°' },
        { id: 'rotate-z', setter: 'setRotationZ', valueId: 'rotate-z-value', unit: '°' },
        { id: 'scale', setter: 'setScale', valueId: 'scale-value', unit: 'x', format: v => v.toFixed(1) }
    ];
    
    cameraControls.forEach(({ id, setter, valueId, unit, format }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const value = id === 'scale' ? parseFloat(this.value) : parseInt(this.value);
                camera[setter](value);
                const displayValue = format ? format(value) : value;
                document.getElementById(valueId).textContent = displayValue + unit;
                render();
            });
        }
    });
}

/**
 * 아코디언 기능 설정
 * @function setupAccordion
 * @description 아코디언 헤더 클릭 이벤트와 애니메이션을 설정합니다
 */
function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const content = document.getElementById(target);
            const section = this.parentElement;
            const arrow = this.querySelector('.accordion-arrow');
            
            // 현재 섹션이 열려있는지 확인
            const isActive = content.classList.contains('active');
            
            if (isActive) {
                // 섹션 닫기
                content.classList.remove('active');
                this.classList.add('collapsed');
                section.classList.remove('expanded');
                arrow.style.transform = 'rotate(-90deg)';
            } else {
                // 섹션 열기
                content.classList.add('active');
                this.classList.remove('collapsed');
                section.classList.add('expanded');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });
    
    // 초기 상태에서 포즈 전환과 관절 제어만 열어둠
    const defaultOpenSections = ['pose-control', 'joint-control'];
    defaultOpenSections.forEach(sectionId => {
        const content = document.getElementById(sectionId);
        const header = document.querySelector(`[data-target="${sectionId}"]`);
        const section = header.parentElement;
        
        if (content && header) {
            content.classList.add('active');
            header.classList.remove('collapsed');
            section.classList.add('expanded');
        }
    });
}

/**
 * 전체 초기화 함수
 * @function resetAll
 * @description 모든 설정을 초기 상태로 되돌림
 */
function resetAll() {
    // 카메라 상태 초기화
    camera.reset();
    
    // UI 슬라이더 초기화
    const initialValues = {
        'rotate-x': { value: 0, display: '0°' },
        'rotate-y': { value: 0, display: '0°' },
        'rotate-z': { value: 0, display: '0°' },
        'scale': { value: 1, display: '1.0x' }
    };
    
    Object.entries(initialValues).forEach(([id, { value, display }]) => {
        const element = document.getElementById(id);
        const displayElement = document.getElementById(id + '-value');
        if (element) element.value = value;
        if (displayElement) displayElement.textContent = display;
    });
    
    // 포즈 상태 초기화
    isRunning = false;
    document.getElementById("pose-toggle").textContent = "달리기 포즈로 전환";
    
    // 관절 선택 초기화
    const jointSelector = document.getElementById("joint-selector");
    const jointControls = document.getElementById("joint-rotation-controls");
    const jointName = document.getElementById("selected-joint-name");
    
    if (jointSelector) jointSelector.value = "";
    if (jointControls) jointControls.style.display = "none";
    if (jointName) jointName.textContent = "관절을 선택하세요";
    
    // 모듈 상태 초기화
    poseController?.resetAllRotations();
    humanModel?.resetAllTransforms();
    animation?.stopAnimation();
    
    render();
    
    // 완료 메시지
    poseController?.showStatusMessage('모든 설정이 초기화되었습니다.', 'success');
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
    
    // 통합된 렌더링 메서드 사용
    humanModel.render(isRunning);
} 