/**
 * @fileoverview 3D 인체 모델 정의 및 렌더링 모듈
 * @description 계층적 구조의 올림픽 픽토그램 스타일 인체 모델을 렌더링합니다.
 *              포즈 제어와 애니메이션을 지원하는 유기적 형태의 3D 모델입니다.
 * @author SCE433 Computer Graphics Team
 * @version 3.0.0 - 리팩토링 및 코드 최적화
 */

/**
 * 올림픽 픽토그램 색상 정의
 * @constant {vec4} BODY_COLOR - 몸통과 발의 색상 (흰색)
 * @constant {vec4} LIMB_COLOR - 머리, 팔, 다리의 색상 (올림픽 블루)
 */
const BODY_COLOR = vec4(1.0, 1.0, 1.0, 1.0);  // 흰색 (몸통, 발)
const LIMB_COLOR = vec4(0.12, 0.25, 0.69, 1.0);  // 올림픽 블루 (머리, 팔, 다리)

/**
 * 신체 부위 크기 정의 (유기적 형태용)
 * @constant {Object} BODY_PARTS - 각 신체 부위의 크기 정보
 */
const BODY_PARTS = {
    HEAD: { width: 0.2, height: 0.18, depth: 0.18 },    // 더 큰 타원형 머리
    TORSO: { width: 0.25, height: 0.4, depth: 0.15 },    // 더 넓고 두꺼운 몸통
    UPPER_ARM: { topRadius: 0.055, bottomRadius: 0.045, height: 0.16 },  // 더 짧고 두꺼운 위팔
    LOWER_ARM: { topRadius: 0.045, bottomRadius: 0.035, height: 0.15 }, // 더 짧고 두꺼운 아래팔
    HAND: { radius: 0.05, height: 0.09 },                // 더 큰 손
    UPPER_LEG: { topRadius: 0.065, bottomRadius: 0.05, height: 0.28 },   // 더 두꺼운 허벅지
    LOWER_LEG: { topRadius: 0.06, bottomRadius: 0.05, height: 0.24 },   // 수정: 두께 증가, 길이 약간 감소
    FOOT: { width: 0.16, height: 0.05, depth: 0.14 }     // 수정: 길이·깊이 증가
};

/**
 * 노드 ID 정의 (향후 인터랙션을 위해)
 * @constant {Object} NODE_IDS - 각 신체 부위의 고유 ID
 */
const NODE_IDS = {
    TORSO: 0,
    HEAD: 1,
    LEFT_UPPER_ARM: 2,
    LEFT_LOWER_ARM: 3,
    LEFT_HAND: 4,
    RIGHT_UPPER_ARM: 5,
    RIGHT_LOWER_ARM: 6,
    RIGHT_HAND: 7,
    LEFT_UPPER_LEG: 8,
    LEFT_LOWER_LEG: 9,
    LEFT_FOOT: 10,
    RIGHT_UPPER_LEG: 11,
    RIGHT_LOWER_LEG: 12,
    RIGHT_FOOT: 13
};

/**
 * 계층적 3D 인체 모델 클래스
 * @class HumanModel
 * @description WebGL을 사용하여 3D 인체 모델을 렌더링하는 클래스
 */
class HumanModel {
    /**
     * HumanModel 생성자
     * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
     * @param {WebGLProgram} program - 셰이더 프로그램
     */
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.matrixStack = [];
        
        // 버퍼 초기화
        this.positionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        
        // 블린-퐁 조명 시스템 초기화
        this.lighting = new BlinnPhongLighting(gl, program);
        
        // 각 노드의 변환 정보 저장 (향후 애니메이션/인터랙션용)
        this.nodeTransforms = {};
        this.initializeNodeTransforms();
    }
    
    /**
     * 각 노드의 기본 변환값 초기화
     * @method initializeNodeTransforms
     */
    initializeNodeTransforms() {
        Object.keys(NODE_IDS).forEach(nodeName => {
            this.nodeTransforms[nodeName] = {
                translation: vec3(0, 0, 0),
                rotation: vec3(0, 0, 0),
                scale: vec3(1, 1, 1)
            };
        });
    }
    
    /**
     * 행렬 스택에 현재 모델뷰 행렬 저장
     * @method pushMatrix
     */
    pushMatrix() {
        const m = mat4();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                m[i][j] = modelViewMatrix[i][j];
            }
        }
        this.matrixStack.push(m);
    }
    
    /**
     * 행렬 스택에서 모델뷰 행렬 복원
     * @method popMatrix
     */
    popMatrix() {
        modelViewMatrix = this.matrixStack.pop();
    }
    
    /**
     * 타원체(ellipsoid) 생성 - 머리용
     * @method createEllipsoid
     * @param {number} radiusX - X축 반지름
     * @param {number} radiusY - Y축 반지름  
     * @param {number} radiusZ - Z축 반지름
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createEllipsoid(radiusX, radiusY, radiusZ, segments = 16) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radiusX * sinTheta * cosPhi;
                const y = radiusY * cosTheta;
                const z = radiusZ * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 인덱스 생성
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j;
                const second = first + segments + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        
        return { vertices, indices };
    }
    
    /**
     * 원기둥(cylinder) 생성 - 팔다리용
     * @method createCylinder
     * @param {number} topRadius - 위쪽 반지름
     * @param {number} bottomRadius - 아래쪽 반지름
     * @param {number} height - 높이
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createCylinder(topRadius, bottomRadius, height, segments = 12) {
        const vertices = [];
        const indices = [];
        
        // 위아래 원의 중심점
        vertices.push(vec4(0, height/2, 0, 1.0));  // 위쪽 중심
        vertices.push(vec4(0, -height/2, 0, 1.0)); // 아래쪽 중심
        
        // 측면 버텍스
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            // 위쪽 원
            vertices.push(vec4(topRadius * cos, height/2, topRadius * sin, 1.0));
            // 아래쪽 원
            vertices.push(vec4(bottomRadius * cos, -height/2, bottomRadius * sin, 1.0));
        }
        
        // 측면 인덱스
        for (let i = 0; i < segments; i++) {
            const topCurrent = 2 + i * 2;
            const topNext = 2 + ((i + 1) % segments) * 2;
            const bottomCurrent = topCurrent + 1;
            const bottomNext = topNext + 1;
            
            // 측면 사각형을 두 개의 삼각형으로
            indices.push(topCurrent, bottomCurrent, topNext);
            indices.push(topNext, bottomCurrent, bottomNext);
        }
        
        // 위쪽 면 인덱스
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2;
            const next = 2 + ((i + 1) % segments) * 2;
            indices.push(0, current, next);
        }
        
        // 아래쪽 면 인덱스
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2 + 1;
            const next = 2 + ((i + 1) % segments) * 2 + 1;
            indices.push(1, next, current);
        }
        
        return { vertices, indices };
    }
    
    /**
     * 조끼 형태 몸통 생성
     * @method createVest
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @param {number} depth - 깊이
     * @returns {Object} vertices와 indices 배열
     */
    createVest(width, height, depth) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        
        // 조끼 형태로 상체 부분을 좁게
        const topWidth = w * 0.7;
        const neckWidth = w * 0.3;
        
        const vertices = [
            // 앞면 (V자 목선)
            vec4(-neckWidth, h, d, 1.0),      // 0: 목 왼쪽
            vec4(neckWidth, h, d, 1.0),       // 1: 목 오른쪽
            vec4(-topWidth, h * 0.7, d, 1.0), // 2: 어깨 왼쪽
            vec4(topWidth, h * 0.7, d, 1.0),  // 3: 어깨 오른쪽
            vec4(-w, -h, d, 1.0),             // 4: 허리 왼쪽
            vec4(w, -h, d, 1.0),              // 5: 허리 오른쪽
            
            // 뒷면
            vec4(-neckWidth, h, -d, 1.0),     // 6: 목 왼쪽
            vec4(neckWidth, h, -d, 1.0),      // 7: 목 오른쪽
            vec4(-topWidth, h * 0.7, -d, 1.0), // 8: 어깨 왼쪽
            vec4(topWidth, h * 0.7, -d, 1.0),  // 9: 어깨 오른쪽
            vec4(-w, -h, -d, 1.0),            // 10: 허리 왼쪽
            vec4(w, -h, -d, 1.0)              // 11: 허리 오른쪽
        ];
        
        const indices = [
            // 앞면
            0, 2, 1, 1, 2, 3,
            2, 4, 3, 3, 4, 5,
            // 뒷면
            7, 8, 6, 9, 8, 7,
            9, 10, 8, 11, 10, 9,
            // 측면들
            0, 6, 2, 2, 6, 8,
            1, 3, 7, 7, 3, 9,
            2, 8, 4, 4, 8, 10,
            3, 5, 9, 9, 5, 11,
            4, 10, 5, 5, 10, 11
        ];
        
        return { vertices, indices };
    }
    
    /**
     * 손바닥 형태 생성
     * @method createHand
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @param {number} depth - 깊이
     * @returns {Object} vertices와 indices 배열
     */
    createHand(width, height, depth) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        
        // 손가락을 모은 형태의 손바닥
        const vertices = [
            // 손바닥 부분 (둥근 형태)
            vec4(-w, -h, d, 1.0),
            vec4(w, -h, d, 1.0),
            vec4(w * 0.8, h, d * 0.6, 1.0),  // 손가락 끝
            vec4(-w * 0.8, h, d * 0.6, 1.0),
            vec4(-w, -h, -d, 1.0),
            vec4(w, -h, -d, 1.0),
            vec4(w * 0.8, h, -d * 0.6, 1.0),
            vec4(-w * 0.8, h, -d * 0.6, 1.0)
        ];
        
        const indices = [
            // 앞면
            0, 1, 2, 0, 2, 3,
            // 뒷면
            5, 4, 6, 6, 4, 7,
            // 측면들
            0, 4, 1, 1, 4, 5,
            1, 5, 2, 2, 5, 6,
            2, 6, 3, 3, 6, 7,
            3, 7, 0, 0, 7, 4
        ];
        
        return { vertices, indices };
    }
    
    /**
     * 발 형태 생성 (픽토그램 스타일 - 앞뒤 경사)
     * @method createFoot
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @param {number} depth - 깊이
     * @returns {Object} vertices와 indices 배열
     */
    createFoot(width, height, depth) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        
        // 신발 형태의 발 (좌우 옆면만 패임, 앞뒤는 경사)
        const vertices = [
            // 뒤꿈치 부분 (둥근 경사, 좌우만 좁음)
            vec4(-w * 0.4, -h, -d * 0.7, 1.0),       // 뒤꿈치 좌측 (짧게)
            vec4(w * 0.4, -h, -d * 0.7, 1.0),        // 뒤꿈치 우측 (짧게)
            vec4(-w * 0.4, h * 0.6, -d * 0.7, 1.0),  // 뒤꿈치 위 좌측 (낮게)
            vec4(w * 0.4, h * 0.6, -d * 0.7, 1.0),   // 뒤꿈치 위 우측 (낮게)
            // 발가락 부분 (올라가는 경사, 좌우만 좁음)
            vec4(-w * 0.4, -h * 0.5, d, 1.0),        // 발가락 좌측 (올라감)
            vec4(w * 0.4, -h * 0.5, d, 1.0),         // 발가락 우측 (올라감)
            vec4(-w * 0.4, h, d * 0.8, 1.0),         // 발가락 위 좌측 (높게)
            vec4(w * 0.4, h, d * 0.8, 1.0)           // 발가락 위 우측 (높게)
        ];
        
        const indices = [
            // 아래면 (경사)
            0, 4, 1, 1, 4, 5,
            // 위면 (경사)
            2, 3, 6, 6, 3, 7,
            // 측면들
            0, 2, 4, 4, 2, 6,
            1, 5, 3, 3, 5, 7,
            // 앞뒤면 (경사)
            4, 6, 5, 5, 6, 7,
            1, 3, 0, 0, 3, 2
        ];
        
        return { vertices, indices };
    }
    
    /**
     * 일반적인 geometry 렌더링
     * @method drawGeometry
     * @param {Object} geometry - vertices와 indices를 포함한 geometry 객체
     * @param {vec4} color - 색상
     */
    drawGeometry(geometry, color) {
        const { vertices, indices } = geometry;
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < indices.length; i++) {
            positions.push(vertices[indices[i]]);
            colors.push(color);
        }
        
        // 노멀 벡터 계산 (오류 처리 포함)
        let normalArray = [];
        try {
            const normals = BlinnPhongLighting.calculateNormals(vertices, indices);
            for (let i = 0; i < indices.length; i++) {
                if (normals[indices[i]]) {
                    normalArray.push(normals[indices[i]]);
                } else {
                    // 기본 노멀 벡터 (위쪽 방향)
                    normalArray.push(vec3(0, 1, 0));
                }
            }
        } catch (error) {
            console.warn("노멀 벡터 계산 실패, 기본값 사용:", error);
            // 기본 노멀 벡터로 채움
            for (let i = 0; i < positions.length; i++) {
                normalArray.push(vec3(0, 1, 0));
            }
        }
        
        // 위치 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(positions), this.gl.STATIC_DRAW);
        
        const vPosition = this.gl.getAttribLocation(this.program, "vPosition");
        if (vPosition >= 0) {
            this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vPosition);
        }
        
        // 색상 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);
        
        const vColor = this.gl.getAttribLocation(this.program, "vColor");
        if (vColor >= 0) {
            this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vColor);
        }
        
        // 노멀 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(normalArray), this.gl.STATIC_DRAW);
        
        const vNormal = this.gl.getAttribLocation(this.program, "vNormal");
        if (vNormal >= 0) {
            this.gl.vertexAttribPointer(vNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vNormal);
        }
        
        // 블린-퐁 조명 매트릭스 업데이트
        if (this.lighting && typeof projectionMatrix !== 'undefined') {
            this.lighting.updateMatrices(modelViewMatrix, projectionMatrix);
        }
        
        // 그리기
        this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length);
    }
    
    /**
     * 끝이 둥근 원기둥(capsule) 생성 - 유기적 신체 부위용
     * @method createCapsule
     * @param {number} topRadius - 위쪽 반지름
     * @param {number} bottomRadius - 아래쪽 반지름
     * @param {number} height - 높이 (hemisphere 제외)
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createCapsule(topRadius, bottomRadius, height, segments = 16) {
        const vertices = [];
        const indices = [];
        
        // 위쪽 hemisphere (반구)
        for (let i = 0; i <= segments/2; i++) {
            const theta = (i * Math.PI/2) / (segments/2); // 0 to π/2
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = topRadius * sinTheta * cosPhi;
                const y = height/2 + topRadius * cosTheta;
                const z = topRadius * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 원기둥 중간 부분
        const cylinderSteps = 8;
        for (let i = 0; i <= cylinderSteps; i++) {
            const t = i / cylinderSteps;
            const y = height/2 - t * height;
            const radius = topRadius + t * (bottomRadius - topRadius);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radius * cosPhi;
                const z = radius * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 아래쪽 hemisphere
        for (let i = 0; i <= segments/2; i++) {
            const theta = (i * Math.PI/2) / (segments/2); // 0 to π/2
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = bottomRadius * sinTheta * cosPhi;
                const y = -height/2 - bottomRadius * cosTheta;
                const z = bottomRadius * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 인덱스 생성 (복잡하므로 간단한 triangle strip 방식 사용)
        const totalRings = (segments/2 + 1) + cylinderSteps + 1 + (segments/2 + 1);
        for (let i = 0; i < totalRings - 1; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + segments + 1;
                
                // 삼각형 1
                indices.push(current, next, current + 1);
                // 삼각형 2
                indices.push(current + 1, next, next + 1);
            }
        }
        
        return { vertices, indices };
    }
    
    /**
     * 타원체 손 생성 (유기적 형태)
     * @method createOrganicHand
     * @param {number} radius - 기본 반지름
     * @param {number} height - 높이
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createOrganicHand(radius, height, segments = 12) {
        const vertices = [];
        const indices = [];
        
        // 손가락을 모은 형태의 타원체
        const radiusX = radius;
        const radiusY = height / 2;
        const radiusZ = radius * 0.6;
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radiusX * sinTheta * cosPhi;
                const y = radiusY * cosTheta;
                const z = radiusZ * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 인덱스 생성
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j;
                const second = first + segments + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        
        return { vertices, indices };
    }
    
    /**
     * 부드러운 관절 연결부 생성 (개선된 버전)
     * @method createSmoothJoint
     * @param {number} radius1 - 첫 번째 부위 반지름
     * @param {number} radius2 - 두 번째 부위 반지름
     * @param {number} blendLength - 블렌딩 길이
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createSmoothJoint(radius1, radius2, blendLength, segments = 16) {
        const vertices = [];
        const indices = [];
        
        const steps = 12; // 더 세밀한 블렌딩
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // 더 부드러운 곡선 보간 (smootherstep)
            const smoothT = t * t * t * (t * (t * 6 - 15) + 10);
            const radius = radius1 + smoothT * (radius2 - radius1);
            const y = -blendLength/2 + t * blendLength;
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radius * cosPhi;
                const z = radius * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 인덱스 생성
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + segments + 1;
                
                indices.push(current, next, current + 1);
                indices.push(current + 1, next, next + 1);
            }
        }
        
        return { vertices, indices };
    }
    
    /**
     * 특정 노드에 변환 적용 (간소화된 버전)
     * @method applyNodeTransform
     * @param {string} nodeName - 노드 이름
     */
    applyNodeTransform(nodeName) {
        const t = this.nodeTransforms[nodeName];
        if (!t) return;
        
        // 이동
        if (t.translation.some(v => v !== 0)) {
            modelViewMatrix = mult(modelViewMatrix, translate(...t.translation));
        }
        
        // 회전 (Z -> Y -> X 순서)
        if (t.rotation[2]) modelViewMatrix = mult(modelViewMatrix, rotateZ(t.rotation[2]));
        if (t.rotation[1]) modelViewMatrix = mult(modelViewMatrix, rotateY(t.rotation[1]));
        if (t.rotation[0]) modelViewMatrix = mult(modelViewMatrix, rotateX(t.rotation[0]));
        
        // 스케일
        if (t.scale.some(v => v !== 1)) {
            modelViewMatrix = mult(modelViewMatrix, scale(...t.scale));
        }
    }
    
    /**
     * 특정 노드의 변환값 설정
     * @method setNodeTransform
     * @param {string} nodeName - 노드 이름
     * @param {vec3} translation - 이동값
     * @param {vec3} rotation - 회전값 (도 단위)
     * @param {vec3} scale - 크기 조절값
     */
    setNodeTransform(nodeName, translation = vec3(0, 0, 0), rotation = vec3(0, 0, 0), scale = vec3(1, 1, 1)) {
        if (!this.nodeTransforms[nodeName]) return;
        
        this.nodeTransforms[nodeName] = {
            translation: translation,
            rotation: rotation,
            scale: scale
        };
    }
    
    /**
     * 부위별 회전을 적용한 서 있는 포즈 렌더링 (계층적 구조)
     * @method drawStandingWithTransforms
     */
    drawStandingWithTransforms() {
        // 몸통 (조끼 형태 - 흰색) - 루트 노드
        this.pushMatrix();
        this.applyNodeTransform('TORSO');
        const torsoGeometry = this.createVest(BODY_PARTS.TORSO.width, BODY_PARTS.TORSO.height, BODY_PARTS.TORSO.depth);
        this.drawGeometry(torsoGeometry, BODY_COLOR);
        
        // 몸통 뒷면 봉제선 그리기
        this.drawBackSeam(BODY_PARTS.TORSO.width, BODY_PARTS.TORSO.height, BODY_PARTS.TORSO.depth);
        
        // ========== 머리 (몸통의 자식) ==========
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, BODY_PARTS.TORSO.height/2 + BODY_PARTS.HEAD.height/2, 0));
        this.applyNodeTransform('HEAD'); // 머리 자체 회전
        const headGeometry = this.createEllipsoid(BODY_PARTS.HEAD.width/2, BODY_PARTS.HEAD.height/2, BODY_PARTS.HEAD.depth/2);
        this.drawGeometry(headGeometry, LIMB_COLOR);
        this.popMatrix(); // 머리 끝
        
        // ========== 왼팔 시스템 (몸통의 자식) ==========
        this.pushMatrix();
        const leftShoulderX = -BODY_PARTS.TORSO.width/2;
        const shoulderY = BODY_PARTS.TORSO.height/3;
        modelViewMatrix = mult(modelViewMatrix, translate(leftShoulderX, shoulderY, 0));
        this.applyNodeTransform('LEFT_UPPER_ARM'); // ⭐ 어깨 회전 - 팔 전체에 영향
        
        // 왼쪽 위팔 그리기
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const leftUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(leftUpperArmGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 팔꿈치 위치로 이동 (어깨 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height, 0));
        
        // 팔꿈치 연결부
        const elbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.08);
        this.drawGeometry(elbowJointGeometry, LIMB_COLOR);
        
        // 왼쪽 아래팔 (팔꿈치 관절) - 어깨 회전 + 팔꿈치 회전
        this.pushMatrix();
        this.applyNodeTransform('LEFT_LOWER_ARM'); // ⭐ 팔꿈치 회전 (어깨 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.04, 0));
        const leftLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(leftLowerArmGeometry, LIMB_COLOR);
        
        // 손목 위치로 이동 (어깨+팔꿈치 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        
        // 손목 연결부
        const wristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius * 0.8, 0.05);
        this.drawGeometry(wristJointGeometry, LIMB_COLOR);
        
        // 왼손 (손목 관절) - 어깨+팔꿈치+손목 회전
        this.pushMatrix();
        this.applyNodeTransform('LEFT_HAND'); // ⭐ 손목 회전 (어깨+팔꿈치 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.025, 0));
        const leftHandGeometry = this.createCapsule(BODY_PARTS.HAND.radius * 0.8, BODY_PARTS.HAND.radius * 0.6, BODY_PARTS.HAND.height);
        this.drawGeometry(leftHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 왼손 끝
        this.popMatrix(); // 왼쪽 아래팔 끝
        this.popMatrix(); // 왼팔 시스템 끝 (어깨 회전 범위 끝)
        
        // ========== 오른팔 시스템 (몸통의 자식) ==========
        this.pushMatrix();
        const rightShoulderX = BODY_PARTS.TORSO.width/2;
        modelViewMatrix = mult(modelViewMatrix, translate(rightShoulderX, shoulderY, 0));
        this.applyNodeTransform('RIGHT_UPPER_ARM'); // ⭐ 어깨 회전 - 팔 전체에 영향
        
        // 오른쪽 위팔 그리기
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const rightUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(rightUpperArmGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 팔꿈치 위치로 이동 (어깨 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height, 0));
        
        // 팔꿈치 연결부
        const rightElbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.08);
        this.drawGeometry(rightElbowJointGeometry, LIMB_COLOR);
        
        // 오른쪽 아래팔 (팔꿈치 관절) - 어깨 회전 + 팔꿈치 회전
        this.pushMatrix();
        this.applyNodeTransform('RIGHT_LOWER_ARM'); // ⭐ 팔꿈치 회전 (어깨 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.04, 0));
        const rightLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(rightLowerArmGeometry, LIMB_COLOR);
        
        // 손목 위치로 이동 (어깨+팔꿈치 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        
        // 손목 연결부
        const rightWristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius * 0.8, 0.05);
        this.drawGeometry(rightWristJointGeometry, LIMB_COLOR);
        
        // 오른손 (손목 관절) - 어깨+팔꿈치+손목 회전
        this.pushMatrix();
        this.applyNodeTransform('RIGHT_HAND'); // ⭐ 손목 회전 (어깨+팔꿈치 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.025, 0));
        const rightHandGeometry = this.createCapsule(BODY_PARTS.HAND.radius * 0.8, BODY_PARTS.HAND.radius * 0.6, BODY_PARTS.HAND.height);
        this.drawGeometry(rightHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 오른손 끝
        this.popMatrix(); // 오른쪽 아래팔 끝
        this.popMatrix(); // 오른팔 시스템 끝 (어깨 회전 범위 끝)
        
        // ========== 왼다리 시스템 (몸통의 자식) ==========
        this.pushMatrix();
        const leftHipX = -BODY_PARTS.TORSO.width/4;
        const hipY = -BODY_PARTS.TORSO.height/2;
        modelViewMatrix = mult(modelViewMatrix, translate(leftHipX, hipY, 0));
        this.applyNodeTransform('LEFT_UPPER_LEG'); // ⭐ 엉덩이 회전 - 다리 전체에 영향
        
        // 왼쪽 허벅지 그리기
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const leftUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(leftUpperLegGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 무릎 위치로 이동 (엉덩이 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height, 0));
        
        // 무릎 연결부
        const leftKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.08);
        this.drawGeometry(leftKneeJointGeometry, LIMB_COLOR);
        
        // 왼쪽 종아리 (무릎 관절) - 엉덩이 회전 + 무릎 회전
        this.pushMatrix();
        this.applyNodeTransform('LEFT_LOWER_LEG'); // ⭐ 무릎 회전 (엉덩이 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.04, 0));
        const leftLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(leftLowerLegGeometry, LIMB_COLOR);
        
        // 발목 위치로 이동 (엉덩이+무릎 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - BODY_PARTS.FOOT.height/2, 0));
        
        // 왼발 (발목 관절) - 엉덩이+무릎+발목 회전
        this.pushMatrix();
        this.applyNodeTransform('LEFT_FOOT'); // ⭐ 발목 회전 (엉덩이+무릎 회전에 추가)
        const leftFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(leftFootGeometry, BODY_COLOR);
        this.popMatrix(); // 왼발 끝
        this.popMatrix(); // 왼쪽 종아리 끝
        this.popMatrix(); // 왼다리 시스템 끝 (엉덩이 회전 범위 끝)
        
        // ========== 오른다리 시스템 (몸통의 자식) ==========
        this.pushMatrix();
        const rightHipX = BODY_PARTS.TORSO.width/4;
        modelViewMatrix = mult(modelViewMatrix, translate(rightHipX, hipY, 0));
        this.applyNodeTransform('RIGHT_UPPER_LEG'); // ⭐ 엉덩이 회전 - 다리 전체에 영향
        
        // 오른쪽 허벅지 그리기
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const rightUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(rightUpperLegGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 무릎 위치로 이동 (엉덩이 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height, 0));
        
        // 무릎 연결부
        const rightKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.08);
        this.drawGeometry(rightKneeJointGeometry, LIMB_COLOR);
        
        // 오른쪽 종아리 (무릎 관절) - 엉덩이 회전 + 무릎 회전
        this.pushMatrix();
        this.applyNodeTransform('RIGHT_LOWER_LEG'); // ⭐ 무릎 회전 (엉덩이 회전에 추가)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.04, 0));
        const rightLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(rightLowerLegGeometry, LIMB_COLOR);
        
        // 발목 위치로 이동 (엉덩이+무릎 회전 상속됨)
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - BODY_PARTS.FOOT.height/2, 0));
        
        // 오른발 (발목 관절) - 엉덩이+무릎+발목 회전
        this.pushMatrix();
        this.applyNodeTransform('RIGHT_FOOT'); // ⭐ 발목 회전 (엉덩이+무릎 회전에 추가)
        const rightFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(rightFootGeometry, BODY_COLOR);
        this.popMatrix(); // 오른발 끝
        this.popMatrix(); // 오른쪽 종아리 끝
        this.popMatrix(); // 오른다리 시스템 끝 (엉덩이 회전 범위 끝)
        
        this.popMatrix(); // 몸통 끝
    }
    
    /**
     * 몸통 뒷면 봉제선 그리기
     * @method drawBackSeam
     * @param {number} width - 몸통 너비
     * @param {number} height - 몸통 높이
     * @param {number} depth - 몸통 깊이
     */
    drawBackSeam(width, height, depth) {
        const h = height / 2;
        const d = depth / 2;
        
        // 조끼 형태의 뒷면 중앙선
        const topHeight = h * 0.7;  // 어깨 높이
        const neckHeight = h;       // 목 높이
        
        // 봉제선 vertices (뒷면 중앙, 목에서 허리까지) - 반대편으로 수정
        const seamVertices = [
            vec4(0, neckHeight, d, 1.0),    // 목 중앙 (반대편)
            vec4(0, topHeight, d, 1.0),     // 어깨선 중앙 (반대편)
            vec4(0, -h, d, 1.0)             // 허리 중앙 (반대편)
        ];
        
        // 봉제선 색상 (어두운 파란색)
        const seamColors = [
            vec4(0.05, 0.1, 0.3, 1.0),  // 더 어두운 파란색
            vec4(0.05, 0.1, 0.3, 1.0),
            vec4(0.05, 0.1, 0.3, 1.0)
        ];
        
        // 노멀 벡터 (선이므로 임시로 위쪽 방향)
        const seamNormals = [
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0)
        ];
        
        // 위치 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(seamVertices), this.gl.STATIC_DRAW);
        
        const vPosition = this.gl.getAttribLocation(this.program, "vPosition");
        if (vPosition >= 0) {
            this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vPosition);
        }
        
        // 색상 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(seamColors), this.gl.STATIC_DRAW);
        
        const vColor = this.gl.getAttribLocation(this.program, "vColor");
        if (vColor >= 0) {
            this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vColor);
        }
        
        // 노멀 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(seamNormals), this.gl.STATIC_DRAW);
        
        const vNormal = this.gl.getAttribLocation(this.program, "vNormal");
        if (vNormal >= 0) {
            this.gl.vertexAttribPointer(vNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vNormal);
        }
        
        // 조명 매트릭스 업데이트
        if (this.lighting && typeof projectionMatrix !== 'undefined') {
            this.lighting.updateMatrices(modelViewMatrix, projectionMatrix);
        }
        
        // 선 굵기 설정
        this.gl.lineWidth(3.0);
        
        // 봉제선 그리기 (선으로)
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, seamVertices.length);
        
        // 선 굵기 원래대로
        this.gl.lineWidth(1.0);
    }
    
    /**
     * 달리기 포즈의 기본 변환값 설정
     * @method setRunningPoseTransforms
     */
    setRunningPoseTransforms() {
        // 기본 자세
        this.setNodeTransform('TORSO', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('HEAD', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        
        // 팔 동작 (좌우 반대)
        this.setNodeTransform('LEFT_UPPER_ARM', vec3(0, 0, 0), vec3(-76, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('LEFT_LOWER_ARM', vec3(0, 0, 0), vec3(56, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('LEFT_HAND', vec3(0, 0, 0), vec3(-1, 11, 0), vec3(1, 1, 1));
        
        this.setNodeTransform('RIGHT_UPPER_ARM', vec3(0, 0, 0), vec3(66, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('RIGHT_LOWER_ARM', vec3(0, 0, 0), vec3(83, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('RIGHT_HAND', vec3(0, 0, 0), vec3(34, 8, 0), vec3(1, 1, 1));
        
        // 다리 동작 (왼다리 들어올림)
        this.setNodeTransform('LEFT_UPPER_LEG', vec3(0, 0, 0), vec3(91, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('LEFT_LOWER_LEG', vec3(0, 0, 0), vec3(-151, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('LEFT_FOOT', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        
        this.setNodeTransform('RIGHT_UPPER_LEG', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('RIGHT_LOWER_LEG', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        this.setNodeTransform('RIGHT_FOOT', vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
    }
    
    /**
     * 모든 노드 변환 초기화
     * @method resetAllTransforms
     */
    resetAllTransforms() {
        this.initializeNodeTransforms();
    }
    
    /**
     * 렌더링 메인 메서드 (포즈 상태에 따라)
     * @method render
     * @param {boolean} isRunning - 달리기 포즈 여부
     */
    render(isRunning = false) {
        if (isRunning) {
            this.setRunningPoseTransforms();
        }
        this.drawStandingWithTransforms();
    }
} 