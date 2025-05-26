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
let humanModel, camera, poseController, poseStorage, animation;

/**
 * 배경색 상수 (회색)
 * @constant {vec4} BACKGROUND_COLOR
 */
const BACKGROUND_COLOR = vec4(0.7, 0.7, 0.7, 1.0);

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
        return;
    }
    gl.useProgram(program);
    
    // 모듈 초기화 (순서 중요!)
    try {
        camera = new Camera(gl, program, canvas);
        
        projectionMatrix = window.projectionMatrix; // 카메라에서 설정된 투영 행렬 참조
        
        humanModel = new HumanModel(gl, program);
        
        poseController = new PoseController(humanModel);
        
        poseStorage = new PoseStorage(poseController);
        
        animation = new Animation(poseController, poseStorage, camera);
    } catch (error) {
        return;
    }
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // render 함수와 updateCameraUI 함수를 전역으로 노출
    window.render = render;
    window.updateCameraUI = updateCameraUI;
    
    // 초기 상태를 명시적으로 스탠딩 포즈로 설정
    poseController.resetAllRotations();
    camera.reset();
    
    // 초기 카메라 UI 설정
    updateCameraUI();
    
    // 초기 렌더링 - 여러 번 시도하여 확실히 실행
    // 즉시 한 번 렌더링
    render();
    
    // requestAnimationFrame으로 한 번 더
    requestAnimationFrame(() => {
        render();
        
        // 추가로 한 번 더 확인
        setTimeout(() => {
            render();
        }, 100);
    });
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
    
    // Assignment3 방식 카메라 벡터 슬라이더들
    const cameraVectorControls = [
        // Eye 위치
        { id: 'eye-x', vector: 'eye', axis: 0, valueId: 'eye-x-value' },
        { id: 'eye-y', vector: 'eye', axis: 1, valueId: 'eye-y-value' },
        { id: 'eye-z', vector: 'eye', axis: 2, valueId: 'eye-z-value' },
        // At 위치
        { id: 'at-x', vector: 'at', axis: 0, valueId: 'at-x-value' },
        { id: 'at-y', vector: 'at', axis: 1, valueId: 'at-y-value' },
        { id: 'at-z', vector: 'at', axis: 2, valueId: 'at-z-value' },
        // Up 벡터
        { id: 'up-x', vector: 'up', axis: 0, valueId: 'up-x-value' },
        { id: 'up-y', vector: 'up', axis: 1, valueId: 'up-y-value' },
        { id: 'up-z', vector: 'up', axis: 2, valueId: 'up-z-value' }
    ];
    
    cameraVectorControls.forEach(({ id, vector, axis, valueId }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const value = parseFloat(this.value);
                camera[vector][axis] = value;
                
                // eye 벡터가 변경되면 구 좌표계 파라미터도 업데이트
                if (vector === 'eye') {
                    camera.updateSphericalCoordinatesFromEye();
                }
                
                // up 벡터의 경우 더 정밀한 표시 (소수점 2자리)
                const precision = vector === 'up' ? 2 : 1;
                document.getElementById(valueId).textContent = value.toFixed(precision);
                requestAnimationFrame(render);
            });
            
            // up 벡터의 경우 사용자가 슬라이더 조정을 완료했을 때만 정규화 적용
            if (id.startsWith('up-')) {
                element.addEventListener('change', function() {
                    // 정규화 적용
                    const length = Math.sqrt(camera.up[0] * camera.up[0] + 
                                           camera.up[1] * camera.up[1] + 
                                           camera.up[2] * camera.up[2]);
                    if (length > 0.001) { // 0에 가까운 값 방지
                        camera.up[0] /= length;
                        camera.up[1] /= length;
                        camera.up[2] /= length;
                        
                        // 정규화 후 UI 업데이트 (부드럽게)
                        setTimeout(() => {
                            updateCameraUI();
                            requestAnimationFrame(render);
                        }, 100);
                    }
                });
            }
        }
    });
    
    // 줌 슬라이더
    const zoomElement = document.getElementById('zoom');
    if (zoomElement) {
        zoomElement.addEventListener('input', function() {
            const value = parseFloat(this.value);
            camera.setScale(value);
            document.getElementById('zoom-value').textContent = value.toFixed(1) + 'x';
            requestAnimationFrame(render);
        });
    }
    
    // 미리 정의된 뷰 버튼들
    const viewButtons = {
        'view-front': () => camera.setViewFront(),
        'view-side': () => camera.setViewSide(),
        'view-top': () => camera.setViewTop(),
        'reset-camera': () => {
            camera.reset();
            updateCameraUI();
            requestAnimationFrame(render);
        }
    };
    
    Object.entries(viewButtons).forEach(([id, handler]) => {
        document.getElementById(id)?.addEventListener('click', () => {
            handler();
            if (id !== 'reset-camera') {
                requestAnimationFrame(render);
            }
        });
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
    
    // 초기 상태에서 포즈 전환, 관절 제어를 열어둠
    const defaultOpenSections = ['pose-control', 'joint-control'];
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
 * 카메라 UI를 현재 상태로 업데이트
 * @function updateCameraUI
 */
function updateCameraUI() {
    // Eye 벡터 UI 업데이트
    const eyeElements = ['eye-x', 'eye-y', 'eye-z'];
    eyeElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.eye[index];
        
        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(1);
    });
    
    // At 벡터 UI 업데이트
    const atElements = ['at-x', 'at-y', 'at-z'];
    atElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.at[index];
        
        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(1);
    });
    
    // Up 벡터 UI 업데이트
    const upElements = ['up-x', 'up-y', 'up-z'];
    upElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.up[index];
        
        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(2);
    });
    
    // 줌 UI 업데이트
    const zoomElement = document.getElementById('zoom');
    const zoomValueElement = document.getElementById('zoom-value');
    
    if (zoomElement) zoomElement.value = camera.scale;
    if (zoomValueElement) zoomValueElement.textContent = camera.scale.toFixed(1) + 'x';
}

/**
 * 전체 초기화 함수
 * @function resetAll
 * @description 모든 설정을 초기 상태로 되돌림
 */
function resetAll() {
    // 카메라 상태 초기화
    camera.reset();
    
    // 카메라 UI 업데이트
    updateCameraUI();
    
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
    
    requestAnimationFrame(render);
    
    // 완료 메시지
    poseController?.showStatusMessage('모든 설정이 초기화되었습니다.', 'success');
}

/**
 * 렌더링 함수
 * @function render
 * @description 3D 장면을 렌더링합니다
 */
function render() {
    try {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // modelViewMatrix를 단위 행렬로 초기화
        modelViewMatrix = mat4();
        
        // 카메라 뷰 행렬 적용
        modelViewMatrix = mult(modelViewMatrix, camera.getViewMatrix());
        
        // 투영 행렬만 업데이트 (모델뷰 행렬은 각 객체에서 개별 설정)
        const uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
        
        if (uProjectionMatrix && projectionMatrix) {
            gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));
        }
        
        // DFS 기반 렌더링 시작 확인
        if (humanModel && humanModel.rootNode) {
            humanModel.render();
        }
        
    } catch (error) {
        // 렌더링 오류 발생시 무시
    }
} 