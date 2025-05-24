/**
 * @fileoverview 2020 도쿄 올림픽 픽토그램 - Athletics (육상) 메인 애플리케이션
 * @description 모듈화된 구조의 3D 인체 모델 시뮬레이션 애플리케이션입니다.
 *              인터랙티브 카메라 제어, 관절별 포즈 조정, 포즈 저장/애니메이션 기능을 제공합니다.
 * @author SCE433 Computer Graphics Team
 * @version 3.0.0 - 리팩토링 및 코드 최적화
 */

// WebGL 관련 전역 변수
let gl, program, modelViewMatrix, projectionMatrix;

// 모듈 인스턴스들
let humanModel, camera, poseController, poseStorage, animation, lighting;

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
    camera = new Camera(gl, program, canvas);
    projectionMatrix = window.projectionMatrix; // 카메라에서 설정된 투영 행렬 참조
    
    humanModel = new HumanModel(gl, program);
    lighting = humanModel.lighting; // 조명 시스템 참조
    
    poseController = new PoseController(humanModel);
    poseStorage = new PoseStorage(poseController);
    animation = new Animation(poseController, poseStorage, camera);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // render 함수를 전역으로 노출
    window.render = render;
    
    // 초기 상태를 명시적으로 스탠딩 포즈로 설정
    poseController.resetAllRotations();
    camera.reset();
    
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
    
    // 블린-퐁 조명 컨트롤 설정
    setupLightingControls();
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
    
    // 초기 상태에서 포즈 전환, 관절 제어, 블린-퐁 조명을 열어둠
    const defaultOpenSections = ['pose-control', 'joint-control', 'lighting-control'];
    defaultOpenSections.forEach(sectionId => {
        const content = document.getElementById(sectionId);
        const header = document.querySelector(`[data-target="${sectionId}"]`);
        const section = header?.parentElement;
        
        if (content && header && section) {
            content.classList.add('active');
            header.classList.remove('collapsed');
            section.classList.add('expanded');
        }
    });
}

/**
 * 블린-퐁 조명 컨트롤 설정
 * @function setupLightingControls
 * @description 조명과 재질 속성을 조작하는 슬라이더들을 설정합니다
 */
function setupLightingControls() {
    // 조명 위치 컨트롤
    const lightPositionControls = [
        { id: 'light-x', valueId: 'light-x-value', axis: 0 },
        { id: 'light-y', valueId: 'light-y-value', axis: 1 },
        { id: 'light-z', valueId: 'light-z-value', axis: 2 }
    ];
    
    lightPositionControls.forEach(({ id, valueId, axis }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const value = parseFloat(this.value);
                const currentPos = lighting.lightPosition;
                currentPos[axis] = value;
                lighting.setLightPosition(currentPos[0], currentPos[1], currentPos[2]);
                document.getElementById(valueId).textContent = value.toFixed(1);
                render();
            });
        }
    });
    
    // 조명 강도 컨트롤
    const lightIntensityControls = [
        { id: 'ambient-intensity', valueId: 'ambient-value', property: 'ambient' },
        { id: 'diffuse-intensity', valueId: 'diffuse-value', property: 'diffuse' },
        { id: 'specular-intensity', valueId: 'specular-value', property: 'specular' }
    ];
    
    lightIntensityControls.forEach(({ id, valueId, property }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const value = parseFloat(this.value);
                const ambient = lighting.lightAmbient[0];
                const diffuse = lighting.lightDiffuse[0];
                const specular = lighting.lightSpecular[0];
                
                if (property === 'ambient') {
                    lighting.setLightIntensity(value, diffuse, specular);
                } else if (property === 'diffuse') {
                    lighting.setLightIntensity(ambient, value, specular);
                } else if (property === 'specular') {
                    lighting.setLightIntensity(ambient, diffuse, value);
                }
                
                document.getElementById(valueId).textContent = value.toFixed(2);
                render();
            });
        }
    });
    
    // 재질 속성 컨트롤
    const materialControls = [
        { id: 'material-ambient', valueId: 'material-ambient-value', property: 'ambient' },
        { id: 'material-diffuse', valueId: 'material-diffuse-value', property: 'diffuse' },
        { id: 'material-specular', valueId: 'material-specular-value', property: 'specular' },
        { id: 'shininess', valueId: 'shininess-value', property: 'shininess' }
    ];
    
    materialControls.forEach(({ id, valueId, property }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const value = property === 'shininess' ? parseInt(this.value) : parseFloat(this.value);
                const ambient = lighting.materialAmbient[0];
                const diffuse = lighting.materialDiffuse[0];
                const specular = lighting.materialSpecular[0];
                const shininess = lighting.materialShininess;
                
                if (property === 'ambient') {
                    lighting.setMaterialProperties(value, diffuse, specular, shininess);
                } else if (property === 'diffuse') {
                    lighting.setMaterialProperties(ambient, value, specular, shininess);
                } else if (property === 'specular') {
                    lighting.setMaterialProperties(ambient, diffuse, value, shininess);
                } else if (property === 'shininess') {
                    lighting.setMaterialProperties(ambient, diffuse, specular, value);
                }
                
                const displayValue = property === 'shininess' ? value : value.toFixed(2);
                document.getElementById(valueId).textContent = displayValue;
                render();
            });
        }
    });
    
    // 조명 초기화 버튼
    document.getElementById('reset-lighting')?.addEventListener('click', () => {
        lighting.reset();
        resetLightingUI();
        render();
    });
}

/**
 * 조명 UI를 기본값으로 초기화
 * @function resetLightingUI
 */
function resetLightingUI() {
    const lightingDefaults = {
        'light-x': { value: 5.0, display: '5.0' },
        'light-y': { value: 5.0, display: '5.0' },
        'light-z': { value: 5.0, display: '5.0' },
        'ambient-intensity': { value: 0.3, display: '0.30' },
        'diffuse-intensity': { value: 0.7, display: '0.70' },
        'specular-intensity': { value: 0.8, display: '0.80' },
        'material-ambient': { value: 0.4, display: '0.40' },
        'material-diffuse': { value: 0.8, display: '0.80' },
        'material-specular': { value: 0.5, display: '0.50' },
        'shininess': { value: 32, display: '32' }
    };
    
    Object.entries(lightingDefaults).forEach(([id, { value, display }]) => {
        const element = document.getElementById(id);
        const displayElement = document.getElementById(id.replace(/(-intensity|-ambient|-diffuse|-specular)$/, '') + (id.includes('light') ? '-value' : id.includes('material') ? '-value' : '-value'));
        
        if (element) element.value = value;
        if (displayElement) displayElement.textContent = display;
    });
    
    // 특별히 처리해야 하는 디스플레이 요소들
    document.getElementById('light-x-value').textContent = '5.0';
    document.getElementById('light-y-value').textContent = '5.0';
    document.getElementById('light-z-value').textContent = '5.0';
    document.getElementById('ambient-value').textContent = '0.30';
    document.getElementById('diffuse-value').textContent = '0.70';
    document.getElementById('specular-value').textContent = '0.80';
    document.getElementById('material-ambient-value').textContent = '0.40';
    document.getElementById('material-diffuse-value').textContent = '0.80';
    document.getElementById('material-specular-value').textContent = '0.50';
    document.getElementById('shininess-value').textContent = '32';
}

/**
 * 전체 초기화 함수
 * @function resetAll
 * @description 모든 설정을 초기 상태로 되돌림
 */
function resetAll() {
    // 카메라 상태 초기화
    camera.reset();
    
    // 조명 상태 초기화
    lighting.reset();
    resetLightingUI();
    
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
    humanModel.render();
} 