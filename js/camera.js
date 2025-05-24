/**
 * @fileoverview 3D 카메라 제어 모듈
 * @description 뷰 변환과 투영을 관리하며, 마우스 드래그를 통한 3축 회전을 지원합니다.
 * @author SCE433 Computer Graphics Team
 * @version 3.0.0 - 리팩토링 및 코드 최적화
 */

/**
 * 3D 카메라 클래스
 * @class Camera
 * @description WebGL 3D 장면의 카메라 제어를 담당하는 클래스
 */
class Camera {
    /**
     * Camera 생성자
     * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
     * @param {WebGLProgram} program - 셰이더 프로그램
     * @param {HTMLCanvasElement} canvas - 캔버스 요소 (드래그 이벤트용)
     */
    constructor(gl, program, canvas) {
        this.gl = gl;
        this.program = program;
        this.canvas = canvas;
        
        // 카메라 변환 상태
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.scale = 1.0;
        this.position = vec3(0, 0, -3);
        
        // 드래그 상태 
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragMode = 'rotate';
        
        this.setupProjection();
        this.setupDragEvents();
    }
    
    /**
     * 투영 행렬 설정
     * @method setupProjection
     */
    setupProjection() {
        const aspect = this.canvas.width / this.canvas.height;
        // 전역 변수로 설정하여 다른 곳에서 접근 가능하도록 함
        window.projectionMatrix = perspective(45, aspect, 0.1, 10.0);
        
        const uProjectionMatrix = this.gl.getUniformLocation(this.program, "uProjectionMatrix");
        this.gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(window.projectionMatrix));
    }
    
    /**
     * 드래그 이벤트 설정
     * @method setupDragEvents
     */
    setupDragEvents() {
        // 마우스 다운: 드래그 시작
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.dragMode = e.shiftKey ? 'scale' : 'rotate';
            this.canvas.style.cursor = this.dragMode === 'scale' ? 'ns-resize' : 'move';
            
            e.preventDefault();
        });
        
        // 마우스 이동: 회전/스케일 처리
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.handleMouseDrag(e, deltaX, deltaY);
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.triggerRender();
            e.preventDefault();
        });
        
        // 마우스 업: 드래그 종료
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        
        // 마우스 휠: 스케일 조정
        this.canvas.addEventListener('wheel', (e) => {
            const scaleDelta = e.deltaY * -0.001;
            this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
            
            this.updateScaleUI();
            this.triggerRender();
            e.preventDefault();
        });
    }
    
    /**
     * 마우스 드래그 처리
     * @method handleMouseDrag
     * @param {MouseEvent} e - 마우스 이벤트
     * @param {number} deltaX - X축 이동량
     * @param {number} deltaY - Y축 이동량
     */
    handleMouseDrag(e, deltaX, deltaY) {
        if (this.dragMode === 'rotate') {
            if (e.ctrlKey) {
                // Ctrl + 드래그: 카메라 롤링 (Z축 회전)
                this.rotationZ += deltaX * 0.5;
            } else if (e.altKey) {
                // Alt + 드래그: X축만 회전
                this.rotationX += deltaY * 0.5;
            } else {
                // 일반 드래그: X, Y축 회전
                this.rotationY += deltaX * 0.5;
                this.rotationX += deltaY * 0.5;
            }
            
            // 각도 제한 및 정규화
            this.rotationX = Math.max(-90, Math.min(90, this.rotationX));
            this.rotationY = this.rotationY % 360;
            this.rotationZ = this.rotationZ % 360;
            
            this.updateUI();
        } else if (this.dragMode === 'scale') {
            // 스케일 모드
            const scaleDelta = -deltaY * 0.01;
            this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
            this.updateScaleUI();
        }
    }
    
    /**
     * 렌더링 트리거
     * @method triggerRender
     */
    triggerRender() {
        if (window.render) {
            window.render();
        }
    }
    
    /**
     * UI 업데이트 (회전값)
     * @method updateUI
     */
    updateUI() {
        const elements = {
            x: { slider: 'rotate-x', display: 'rotate-x-value' },
            y: { slider: 'rotate-y', display: 'rotate-y-value' },
            z: { slider: 'rotate-z', display: 'rotate-z-value' }
        };
        
        const rotations = { x: this.rotationX, y: this.rotationY, z: this.rotationZ };
        
        Object.entries(elements).forEach(([axis, ids]) => {
            const slider = document.getElementById(ids.slider);
            const display = document.getElementById(ids.display);
            const value = Math.round(rotations[axis]);
            
            if (slider) slider.value = value;
            if (display) display.textContent = value + "°";
        });
    }
    
    /**
     * UI 업데이트 (스케일값)
     * @method updateScaleUI
     */
    updateScaleUI() {
        const scaleSlider = document.getElementById("scale");
        const scaleValue = document.getElementById("scale-value");
        
        if (scaleSlider) scaleSlider.value = this.scale;
        if (scaleValue) scaleValue.textContent = this.scale.toFixed(1) + "x";
    }
    
    /**
     * 뷰 행렬 계산 및 반환
     * @method getViewMatrix
     * @returns {mat4} 변환이 적용된 뷰 행렬
     */
    getViewMatrix() {
        let viewMatrix = mat4();
        viewMatrix = mult(viewMatrix, translate(this.position[0], this.position[1], this.position[2]));
        viewMatrix = mult(viewMatrix, rotateZ(this.rotationZ));
        viewMatrix = mult(viewMatrix, rotateX(this.rotationX));
        viewMatrix = mult(viewMatrix, rotateY(this.rotationY));
        viewMatrix = mult(viewMatrix, scalem(this.scale, this.scale, this.scale));
        return viewMatrix;
    }
    
    /**
     * X축 회전각 설정
     * @method setRotationX
     * @param {number} angle - 회전각 (도 단위)
     */
    setRotationX(angle) {
        this.rotationX = angle;
    }
    
    /**
     * Y축 회전각 설정
     * @method setRotationY
     * @param {number} angle - 회전각 (도 단위)
     */
    setRotationY(angle) {
        this.rotationY = angle;
    }
    
    /**
     * Z축 회전각 설정
     * @method setRotationZ
     * @param {number} angle - 회전각 (도 단위)
     */
    setRotationZ(angle) {
        this.rotationZ = angle;
    }
    
    /**
     * 스케일 설정
     * @method setScale
     * @param {number} scale - 스케일 값
     */
    setScale(scale) {
        this.scale = scale;
    }
    
    /**
     * 카메라 상태 초기화
     * @method reset
     */
    reset() {
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.scale = 1.0;
        this.updateUI();
        this.updateScaleUI();
    }
    
    /**
     * 현재 카메라 상태 반환
     * @method getCameraState
     * @returns {Object} 카메라 상태 객체
     */
    getCameraState() {
        return {
            rotationX: this.rotationX,
            rotationY: this.rotationY,
            rotationZ: this.rotationZ,
            scale: this.scale,
            position: [...this.position]
        };
    }
    
    /**
     * 카메라 상태 설정
     * @method setCameraState
     * @param {Object} state - 카메라 상태 객체
     */
    setCameraState(state) {
        if (state.rotationX !== undefined) this.rotationX = state.rotationX;
        if (state.rotationY !== undefined) this.rotationY = state.rotationY;
        if (state.rotationZ !== undefined) this.rotationZ = state.rotationZ;
        if (state.scale !== undefined) this.scale = state.scale;
        if (state.position !== undefined) this.position = vec3(...state.position);
        
        this.updateUI();
        this.updateScaleUI();
        this.triggerRender();
    }
    
    /**
     * 기본 카메라 상태 반환
     * @method getDefaultState
     * @returns {Object} 기본 카메라 상태
     */
    getDefaultState() {
        return {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1.0,
            position: [0, 0, -3]
        };
    }
    
    /**
     * 두 카메라 상태 사이를 보간
     * @method interpolateState
     * @param {Object} state1 - 시작 상태
     * @param {Object} state2 - 끝 상태
     * @param {number} t - 보간 비율 (0-1)
     * @returns {Object} 보간된 카메라 상태
     */
    interpolateState(state1, state2, t) {
        // 부드러운 보간을 위한 이징 함수
        const easedT = t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        return {
            rotationX: this.lerp(state1.rotationX, state2.rotationX, easedT),
            rotationY: this.lerpAngle(state1.rotationY, state2.rotationY, easedT),
            rotationZ: this.lerpAngle(state1.rotationZ, state2.rotationZ, easedT),
            scale: this.lerp(state1.scale, state2.scale, easedT),
            position: [
                this.lerp(state1.position[0], state2.position[0], easedT),
                this.lerp(state1.position[1], state2.position[1], easedT),
                this.lerp(state1.position[2], state2.position[2], easedT)
            ]
        };
    }
    
    /**
     * 선형 보간 함수
     * @method lerp
     * @param {number} a - 시작값
     * @param {number} b - 끝값
     * @param {number} t - 보간 비율 (0-1)
     * @returns {number} 보간된 값
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * 각도 보간 함수 (최단 경로)
     * @method lerpAngle
     * @param {number} a - 시작 각도
     * @param {number} b - 끝 각도
     * @param {number} t - 보간 비율 (0-1)
     * @returns {number} 보간된 각도
     */
    lerpAngle(a, b, t) {
        // 각도를 -180 ~ 180 범위로 정규화
        const normalizeAngle = (angle) => {
            while (angle > 180) angle -= 360;
            while (angle < -180) angle += 360;
            return angle;
        };
        
        a = normalizeAngle(a);
        b = normalizeAngle(b);
        
        // 최단 경로 계산
        let diff = b - a;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        return normalizeAngle(a + diff * t);
    }
} 