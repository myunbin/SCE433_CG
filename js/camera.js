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
            
            // Ctrl + 드래그: Z축 회전 (카메라 롤링)
            if (e.ctrlKey) {
                // Z축 회전을 위해 up 벡터를 회전시킴
                const rotationAngle = deltaX * 0.01; // 라디안 단위로 변환
                
                // 현재 카메라의 전방 벡터 계산 (eye에서 at을 향하는 벡터)
                const forward = vec3(
                    this.at[0] - this.eye[0],
                    this.at[1] - this.eye[1],
                    this.at[2] - this.eye[2]
                );
                
                // 전방 벡터 정규화
                const fLength = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
                forward[0] /= fLength;
                forward[1] /= fLength;
                forward[2] /= fLength;
                
                // 로드리게스 회전 공식을 사용하여 up 벡터를 전방 벡터 중심으로 회전
                const cos_angle = Math.cos(rotationAngle);
                const sin_angle = Math.sin(rotationAngle);
                
                // v_rot = v * cos(θ) + (k × v) * sin(θ) + k * (k · v) * (1 - cos(θ))
                // 여기서 k는 회전축(forward), v는 회전할 벡터(up)
                
                // k · v (내적)
                const dot = forward[0] * this.up[0] + forward[1] * this.up[1] + forward[2] * this.up[2];
                
                // k × v (외적)
                const cross = vec3(
                    forward[1] * this.up[2] - forward[2] * this.up[1],
                    forward[2] * this.up[0] - forward[0] * this.up[2],
                    forward[0] * this.up[1] - forward[1] * this.up[0]
                );
                
                // 새로운 up 벡터 계산
                const newUp = vec3(
                    this.up[0] * cos_angle + cross[0] * sin_angle + forward[0] * dot * (1 - cos_angle),
                    this.up[1] * cos_angle + cross[1] * sin_angle + forward[1] * dot * (1 - cos_angle),
                    this.up[2] * cos_angle + cross[2] * sin_angle + forward[2] * dot * (1 - cos_angle)
                );
                
                // up 벡터 정규화
                const upLength = Math.sqrt(newUp[0] * newUp[0] + newUp[1] * newUp[1] + newUp[2] * newUp[2]);
                this.up[0] = newUp[0] / upLength;
                this.up[1] = newUp[1] / upLength;
                this.up[2] = newUp[2] / upLength;
                
                this.canvas.style.cursor = 'crosshair';
            } else {
                // 일반 드래그: 구 좌표계 방식
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
                
                this.canvas.style.cursor = 'move';
            }
            
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
                case '2': // 후면 뷰
                    this.setViewBack();
                    break;
                case '3': // 왼쪽 뷰
                    this.setViewLeft();
                    break;
                case '4': // 오른쪽 뷰
                    this.setViewRight();
                    break;
                case '5': // 위쪽 뷰
                    this.setViewTop();
                    break;
                case '6': // 아래쪽 뷰
                    this.setViewBottom();
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
     * Eye 벡터 직접 설정
     * @method setEye
     * @param {Array} eye - 3D 위치 벡터 [x, y, z]
     */
    setEye(eye) {
        this.eye = vec3(eye[0], eye[1], eye[2]);
        this.updateSphericalCoordinatesFromEye();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * At 벡터 직접 설정
     * @method setAt
     * @param {Array} at - 3D 위치 벡터 [x, y, z]
     */
    setAt(at) {
        this.at = vec3(at[0], at[1], at[2]);
        this.updateSphericalCoordinatesFromEye();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * Up 벡터 직접 설정
     * @method setUp
     * @param {Array} up - 3D 방향 벡터 [x, y, z]
     */
    setUp(up) {
        // Up 벡터 정규화
        const length = Math.sqrt(up[0] * up[0] + up[1] * up[1] + up[2] * up[2]);
        if (length > 0.001) {
            this.up = vec3(up[0] / length, up[1] / length, up[2] / length);
        } else {
            this.up = vec3(0, 1, 0); // 기본값
        }
        this.updateUI();
        this.triggerRender();
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
     * 뷰 행렬 계산 및 반환
     * @method getViewMatrix
     * @returns {mat4} 뷰 행렬
     */
    getViewMatrix() {
        // 기본 lookAt 뷰 행렬 생성
        return lookAt(this.eye, this.at, this.up);
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
     * 후면 뷰 설정 (구 좌표계 방식)
     * @method setViewBack
     */
    setViewBack() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = Math.PI;          // 뒤쪽
        this.phi = Math.PI / 2;        // 수평선
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * 왼쪽 뷰 설정 (구 좌표계 방식)
     * @method setViewLeft
     */
    setViewLeft() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = -Math.PI / 2;     // 왼쪽
        this.phi = Math.PI / 2;        // 수평선
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * 오른쪽 뷰 설정 (구 좌표계 방식)
     * @method setViewRight
     */
    setViewRight() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = Math.PI / 2;      // 오른쪽
        this.phi = Math.PI / 2;        // 수평선
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    
    /**
     * 아래쪽 뷰 설정 (구 좌표계 방식)
     * @method setViewBottom
     */
    setViewBottom() {
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 0, 1);       // 아래에서 볼 때의 업 벡터
        this.theta = 0;                // 정면 방향
        this.phi = Math.PI - 0.1;      // 거의 아래쪽 (완전히 아래쪽은 gimbal lock 방지)
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