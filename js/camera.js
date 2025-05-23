/**
 * @fileoverview 3D 카메라 제어 모듈
 * @description 뷰 변환과 투영을 관리하며, 마우스 드래그를 통한 3축 회전을 지원합니다.
 * @author SCE433 Computer Graphics Team
 * @version 2.0.0
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
        
        // 카메라 변환 값
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;  // Z축 회전 추가
        this.scale = 1.0;
        this.position = vec3(0, 0, -3);
        
        // 투영 행렬
        this.projectionMatrix = null;
        this.setupProjection();
        
        // 드래그 상태
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragMode = 'rotate'; // 'rotate' 또는 'scale'
        
        // 드래그 이벤트 설정
        this.setupDragEvents();
    }
    
    /**
     * 투영 행렬 설정
     * @method setupProjection
     */
    setupProjection() {
        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix = perspective(45, aspect, 0.1, 10.0);
        
        const uProjectionMatrix = this.gl.getUniformLocation(this.program, "uProjectionMatrix");
        this.gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(this.projectionMatrix));
    }
    
    /**
     * 드래그 이벤트 설정
     * @method setupDragEvents
     */
    setupDragEvents() {
        // 마우스 다운 이벤트
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            // Shift 키를 누르면 스케일 모드
            this.dragMode = e.shiftKey ? 'scale' : 'rotate';
            
            // 마우스 커서 변경
            this.canvas.style.cursor = this.dragMode === 'scale' ? 'ns-resize' : 'move';
            
            e.preventDefault();
        });
        
        // 마우스 이동 이벤트
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            if (this.dragMode === 'rotate') {
                // 회전 모드
                if (e.ctrlKey) {
                    // Ctrl + 드래그: Z축 회전
                    this.rotationZ += deltaX * 0.5;
                } else if (e.altKey) {
                    // Alt + 드래그: X축만 회전
                    this.rotationX += deltaY * 0.5;
                } else {
                    // 일반 드래그: X, Y축 회전
                    this.rotationY += deltaX * 0.5;
                    this.rotationX += deltaY * 0.5;
                }
                
                // 각도 제한
                this.rotationX = Math.max(-90, Math.min(90, this.rotationX));
                this.rotationY = this.rotationY % 360;
                this.rotationZ = this.rotationZ % 360;
                
                // UI 업데이트
                this.updateUI();
            } else if (this.dragMode === 'scale') {
                // 스케일 모드
                const scaleDelta = -deltaY * 0.01;
                this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
                
                // UI 업데이트
                this.updateScaleUI();
            }
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            // 렌더링 트리거
            if (window.render) {
                window.render();
            }
            
            e.preventDefault();
        });
        
        // 마우스 업 이벤트
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        
        // 마우스 휠 이벤트 (스케일)
        this.canvas.addEventListener('wheel', (e) => {
            const scaleDelta = e.deltaY * -0.001;
            this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
            
            this.updateScaleUI();
            
            if (window.render) {
                window.render();
            }
            
            e.preventDefault();
        });
    }
    
    /**
     * UI 업데이트 (회전값)
     * @method updateUI
     */
    updateUI() {
        const rotateXSlider = document.getElementById("rotate-x");
        const rotateYSlider = document.getElementById("rotate-y");
        const rotateXValue = document.getElementById("rotate-x-value");
        const rotateYValue = document.getElementById("rotate-y-value");
        
        if (rotateXSlider) {
            rotateXSlider.value = Math.round(this.rotationX);
            rotateXValue.textContent = Math.round(this.rotationX) + "°";
        }
        if (rotateYSlider) {
            rotateYSlider.value = Math.round(this.rotationY);
            rotateYValue.textContent = Math.round(this.rotationY) + "°";
        }
    }
    
    /**
     * UI 업데이트 (스케일값)
     * @method updateScaleUI
     */
    updateScaleUI() {
        const scaleSlider = document.getElementById("scale");
        const scaleValue = document.getElementById("scale-value");
        
        if (scaleSlider) {
            scaleSlider.value = this.scale;
            scaleValue.textContent = this.scale.toFixed(1) + "x";
        }
    }
    
    /**
     * 뷰 행렬 계산 및 반환
     * @method getViewMatrix
     * @returns {mat4} 변환이 적용된 뷰 행렬
     */
    getViewMatrix() {
        let viewMatrix = mat4();
        viewMatrix = mult(viewMatrix, translate(this.position[0], this.position[1], this.position[2]));
        viewMatrix = mult(viewMatrix, rotateX(this.rotationX));
        viewMatrix = mult(viewMatrix, rotateY(this.rotationY));
        viewMatrix = mult(viewMatrix, rotateZ(this.rotationZ));
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
} 