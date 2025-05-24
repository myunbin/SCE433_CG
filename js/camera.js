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
        
        // 표준 카메라 파라미터 (eye, at, up)
        this.eye = vec3(0, 0, 3);      // 카메라 위치
        this.at = vec3(0, 0, 0);       // 바라보는 점
        this.up = vec3(0, 1, 0);       // 업 벡터
        this.distance = 3.0;           // 타겟으로부터의 거리
        
        // 구 좌표계 카메라 파라미터
        this.radius = 3.0;             // 중심점으로부터의 거리
        this.theta = 0;                // 수평각 (Y축 기준 회전)
        this.phi = Math.PI / 2;        // 수직각 (X축 기준 회전, 0=위쪽, π=아래쪽)
        
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
     * 마우스 드래그 이벤트 설정 (Assignment3 방식)
     * @method setupDragEvents
     */
    setupDragEvents() {
        // 마우스 다운: 드래그 시작
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.canvas.style.cursor = 'move';
            
            // 초기 마우스 위치 저장
            const rect = this.canvas.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left;
            this.lastMouseY = e.clientY - rect.top;
            
            e.preventDefault();
        });
        
        // 마우스 이동: 드래그 중일 때만 카메라 뷰 변경
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 마우스 이동량 계산
            const deltaX = x - this.lastMouseX;
            const deltaY = y - this.lastMouseY;
            
            // 감도 조절 (마우스 이동량을 각도로 변환)
            const sensitivity = 0.01;
            
            // 수평 회전 (Y축 기준) - 마우스 X 이동
            this.theta += deltaX * sensitivity;
            
            // 수직 회전 (X축 기준) - 마우스 Y 이동 (반전)
            this.phi -= deltaY * sensitivity;
            
            // 수직각을 0.1 ~ π-0.1 범위로 제한 (완전히 위/아래로 가지 않도록)
            this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
            
            // 구 좌표계를 데카르트 좌표계로 변환하여 카메라 위치 계산
            this.updateCameraPosition();
            
            // 현재 마우스 위치 저장
            this.lastMouseX = x;
            this.lastMouseY = y;
            
            this.updateUI();
            this.triggerRender();
            e.preventDefault();
        });
        
        // 마우스 업: 드래그 종료
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        
        // 마우스가 캔버스를 벗어날 때도 드래그 종료
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        
        // 마우스 휠: 줌 조정
        this.canvas.addEventListener('wheel', (e) => {
            const scaleDelta = e.deltaY * -0.001;
            this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
            
            // 스케일 변경에 따라 radius도 자동 조정
            this.radius = 3.0 / this.scale;
            this.distance = this.radius; // 호환성을 위해 distance도 업데이트
            
            // 카메라 위치 재계산
            this.updateCameraPosition();
            
            this.updateScaleUI();
            this.triggerRender();
            e.preventDefault();
        });
        
        // 키보드 이벤트: 미리 정의된 뷰
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case '1': // 정면 뷰
                    this.setViewFront();
                    break;
                case '2': // 측면 뷰
                    this.setViewSide();
                    break;
                case '3': // 위쪽 뷰
                    this.setViewTop();
                    break;
            }
        });
    }
    

    
    /**
     * 구 좌표계를 데카르트 좌표계로 변환하여 카메라 위치 업데이트
     * @method updateCameraPosition
     */
    updateCameraPosition() {
        // 구 좌표계를 데카르트 좌표계로 변환
        const x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.radius * Math.cos(this.phi);
        const z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        
        // 카메라 위치 업데이트 (at 지점을 중심으로)
        this.eye = vec3(
            this.at[0] + x,
            this.at[1] + y,
            this.at[2] + z
        );
        
        // 회전값도 UI 표시를 위해 업데이트
        this.rotationX = (this.phi - Math.PI / 2) * (180 / Math.PI);
        this.rotationY = this.theta * (180 / Math.PI);
    }
    
    /**
     * 카메라 위치(eye)로부터 구 좌표계 파라미터 역계산
     * @method updateSphericalCoordinatesFromEye
     */
    updateSphericalCoordinatesFromEye() {
        // at 지점을 기준으로 상대 벡터 계산
        const dx = this.eye[0] - this.at[0];
        const dy = this.eye[1] - this.at[1];
        const dz = this.eye[2] - this.at[2];
        
        // 거리(radius) 계산
        this.radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.distance = this.radius;
        this.scale = 3.0 / this.radius;
        
        // 구 좌표계 각도 계산
        this.phi = Math.acos(dy / this.radius);        // 수직각 (0 ~ π)
        this.theta = Math.atan2(dz, dx);               // 수평각 (-π ~ π)
        
        // 회전값도 UI 표시를 위해 업데이트
        this.rotationX = (this.phi - Math.PI / 2) * (180 / Math.PI);
        this.rotationY = this.theta * (180 / Math.PI);
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
     * 카메라 벡터 UI 업데이트
     * @method updateUI
     */
    updateUI() {
        // athletics.js의 전역 updateCameraUI 함수 호출
        if (window.updateCameraUI) {
            window.updateCameraUI();
        }
    }
    
    /**
     * 스케일 UI 업데이트
     * @method updateScaleUI
     */
    updateScaleUI() {
        const zoomSlider = document.getElementById("zoom");
        const zoomValue = document.getElementById("zoom-value");
        
        if (zoomSlider) zoomSlider.value = this.scale;
        if (zoomValue) zoomValue.textContent = this.scale.toFixed(1) + "x";
    }
    
    /**
     * 뷰 행렬 계산 및 반환 (Assignment3 방식 - 마우스 위치 기반)
     * @method getViewMatrix
     * @returns {mat4} 변환이 적용된 뷰 행렬
     */
    getViewMatrix() {
        // Assignment3와 동일한 방식: 직접 설정된 eye, at, up으로 lookAt 생성
        // eye는 마우스 이벤트에서 이미 설정됨
        
        // Z축 회전이 있다면 업 벡터에 적용
        if (this.rotationZ !== 0) {
            const radZ = radians(this.rotationZ);
            const cosZ = Math.cos(radZ);
            const sinZ = Math.sin(radZ);
            this.up = vec3(-sinZ, cosZ, 0);
        } else {
            this.up = vec3(0, 1, 0); // 기본 업 벡터
        }
        
        // Assignment3와 동일한 방식: lookAt을 사용한 뷰 행렬 생성
        const viewMatrix = lookAt(this.eye, this.at, this.up);
        
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
     * 스케일 설정 (줌 효과)
     * @method setScale
     * @param {number} scale - 스케일 값 (1.0 = 기본, > 1.0 = 줌 인, < 1.0 = 줌 아웃)
     */
    setScale(scale) {
        this.scale = scale;
        // 스케일이 클수록 카메라가 가까워짐 (줌 인 효과)
        this.radius = 3.0 / scale;
        this.distance = this.radius; // 호환성을 위해 distance도 업데이트
        
        // 카메라 위치 재계산
        this.updateCameraPosition();
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
        
        // 표준 카메라 파라미터 초기화
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.distance = 3.0;
        
        // 구 좌표계 파라미터 초기화
        this.radius = 3.0;
        this.theta = 0;                // 정면
        this.phi = Math.PI / 2;        // 수평선
        
        // 카메라 위치 재계산
        this.updateCameraPosition();
        
        this.updateUI();
        this.updateScaleUI();
    }
    
    /**
     * 정면 뷰 설정 (구 좌표계 방식)
     * @method setViewFront
     */
    setViewFront() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = 0;                // 정면
        this.phi = Math.PI / 2;        // 수평선
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * 측면 뷰 설정 (구 좌표계 방식)
     * @method setViewSide
     */
    setViewSide() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = Math.PI / 2;      // 오른쪽 측면
        this.phi = Math.PI / 2;        // 수평선
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * 위쪽 뷰 설정 (구 좌표계 방식)
     * @method setViewTop
     */
    setViewTop() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 0, -1);      // 위에서 볼 때의 업 벡터
        this.theta = 0;                // 정면 방향
        this.phi = 0.1;                // 거의 위쪽 (완전히 위쪽은 gimbal lock 방지)
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
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
            position: [...this.position],
            eye: [...this.eye],
            at: [...this.at],
            up: [...this.up],
            distance: this.distance
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
        
        // 새로운 카메라 파라미터들 설정
        if (state.eye !== undefined) this.eye = vec3(...state.eye);
        if (state.at !== undefined) this.at = vec3(...state.at);
        if (state.up !== undefined) this.up = vec3(...state.up);
        if (state.distance !== undefined) this.distance = state.distance;
        
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
            position: [0, 0, -3],
            eye: [0, 0, 3],
            at: [0, 0, 0],
            up: [0, 1, 0],
            distance: 3.0
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
            ],
            eye: [
                this.lerp(state1.eye[0], state2.eye[0], easedT),
                this.lerp(state1.eye[1], state2.eye[1], easedT),
                this.lerp(state1.eye[2], state2.eye[2], easedT)
            ],
            at: [
                this.lerp(state1.at[0], state2.at[0], easedT),
                this.lerp(state1.at[1], state2.at[1], easedT),
                this.lerp(state1.at[2], state2.at[2], easedT)
            ],
            up: [
                this.lerp(state1.up[0], state2.up[0], easedT),
                this.lerp(state1.up[1], state2.up[1], easedT),
                this.lerp(state1.up[2], state2.up[2], easedT)
            ],
            distance: this.lerp(state1.distance, state2.distance, easedT)
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