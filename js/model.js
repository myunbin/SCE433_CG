/**
 * @fileoverview 3D 인체 모델 정의 및 렌더링 모듈
 * @description 계층적 모델 구조와 각 포즈를 관리하며, 유기적 형태의 
 *              올림픽 픽토그램 스타일 인체 모델을 렌더링합니다.
 * @author SCE433 Computer Graphics Team
 * @version 2.2.0 - 유기적 형태 개선 (평면 픽토그램 부풀린 효과)
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
    HEAD: { width: 0.18, height: 0.15, depth: 0.15 },    // 타원형 머리
    TORSO: { width: 0.2, height: 0.35, depth: 0.12 },    // 조끼 형태 몸통
    UPPER_ARM: { topRadius: 0.04, bottomRadius: 0.035, height: 0.22 },  // 끝이 둥근 위팔
    LOWER_ARM: { topRadius: 0.035, bottomRadius: 0.025, height: 0.22 }, // 끝이 둥근 아래팔
    HAND: { radius: 0.04, height: 0.08 },                // 타원체 손
    UPPER_LEG: { topRadius: 0.05, bottomRadius: 0.04, height: 0.27 },   // 끝이 둥근 허벅지
    LOWER_LEG: { topRadius: 0.04, bottomRadius: 0.03, height: 0.27 },   // 끝이 둥근 종아리
    FOOT: { width: 0.12, height: 0.05, depth: 0.08 }     // 발 형태
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
     * 발 형태 생성
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
        
        // 신발 형태의 발
        const vertices = [
            // 뒤꿈치 부분
            vec4(-w * 0.6, -h, -d * 0.3, 1.0),
            vec4(w * 0.6, -h, -d * 0.3, 1.0),
            vec4(-w * 0.6, h, -d * 0.3, 1.0),
            vec4(w * 0.6, h, -d * 0.3, 1.0),
            // 발가락 부분 (더 넓고 앞으로)
            vec4(-w, -h, d, 1.0),
            vec4(w, -h, d, 1.0),
            vec4(-w, h, d, 1.0),
            vec4(w, h, d, 1.0)
        ];
        
        const indices = [
            // 아래면
            0, 4, 1, 1, 4, 5,
            // 위면
            2, 3, 6, 6, 3, 7,
            // 측면들
            0, 2, 4, 4, 2, 6,
            1, 5, 3, 3, 5, 7,
            // 앞뒤면
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
        
        // 위치 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(positions), this.gl.STATIC_DRAW);
        
        const vPosition = this.gl.getAttribLocation(this.program, "vPosition");
        this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPosition);
        
        // 색상 데이터 업로드
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);
        
        const vColor = this.gl.getAttribLocation(this.program, "vColor");
        this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vColor);
        
        // 모델-뷰 행렬 업로드
        const uModelViewMatrix = this.gl.getUniformLocation(this.program, "uModelViewMatrix");
        this.gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
        
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
     * 부드러운 관절 연결부 생성
     * @method createSmoothJoint
     * @param {number} radius1 - 첫 번째 부위 반지름
     * @param {number} radius2 - 두 번째 부위 반지름
     * @param {number} blendLength - 블렌딩 길이
     * @param {number} segments - 분할 수
     * @returns {Object} vertices와 indices 배열
     */
    createSmoothJoint(radius1, radius2, blendLength, segments = 12) {
        const vertices = [];
        const indices = [];
        
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // 부드러운 곡선 보간 (ease-in-out)
            const smoothT = t * t * (3.0 - 2.0 * t);
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
     * 서 있는 포즈 렌더링 (유기적 형태)
     * @method drawStanding
     */
    drawStanding() {
        // 몸통 (조끼 형태 - 흰색)
        this.pushMatrix();
        const torsoGeometry = this.createVest(BODY_PARTS.TORSO.width, BODY_PARTS.TORSO.height, BODY_PARTS.TORSO.depth);
        this.drawGeometry(torsoGeometry, BODY_COLOR);
        
        // 머리 (타원형 - 파란색)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, BODY_PARTS.TORSO.height/2 + BODY_PARTS.HEAD.height/2, 0));
        const headGeometry = this.createEllipsoid(BODY_PARTS.HEAD.width/2, BODY_PARTS.HEAD.height/2, BODY_PARTS.HEAD.depth/2);
        this.drawGeometry(headGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 왼쪽 어깨 영역 (부드러운 연결)
        this.pushMatrix();
        const leftShoulderX = -BODY_PARTS.TORSO.width/2;
        const shoulderY = BODY_PARTS.TORSO.height/3;
        modelViewMatrix = mult(modelViewMatrix, translate(leftShoulderX, shoulderY, 0));
        
        // 왼쪽 위팔 (캡슐 형태)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const leftUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(leftUpperArmGeometry, LIMB_COLOR);
        
        // 팔꿈치 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const elbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.05);
        this.drawGeometry(elbowJointGeometry, LIMB_COLOR);
        
        // 왼쪽 아래팔
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.025, 0));
        const leftLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(leftLowerArmGeometry, LIMB_COLOR);
        
        // 손목 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        const wristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius, 0.03);
        this.drawGeometry(wristJointGeometry, LIMB_COLOR);
        
        // 왼손 (유기적 형태)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.015, 0));
        const leftHandGeometry = this.createOrganicHand(BODY_PARTS.HAND.radius, BODY_PARTS.HAND.height);
        this.drawGeometry(leftHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 손
        this.popMatrix(); // 손목
        this.popMatrix(); // 아래팔
        this.popMatrix(); // 팔꿈치
        this.popMatrix(); // 위팔
        this.popMatrix(); // 어깨
        
        // 오른쪽 어깨 영역 (부드러운 연결)
        this.pushMatrix();
        const rightShoulderX = BODY_PARTS.TORSO.width/2;
        modelViewMatrix = mult(modelViewMatrix, translate(rightShoulderX, shoulderY, 0));
        
        // 오른쪽 위팔 (캡슐 형태)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const rightUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(rightUpperArmGeometry, LIMB_COLOR);
        
        // 팔꿈치 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const rightElbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.05);
        this.drawGeometry(rightElbowJointGeometry, LIMB_COLOR);
        
        // 오른쪽 아래팔
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.025, 0));
        const rightLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(rightLowerArmGeometry, LIMB_COLOR);
        
        // 손목 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        const rightWristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius, 0.03);
        this.drawGeometry(rightWristJointGeometry, LIMB_COLOR);
        
        // 오른손 (유기적 형태)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.015, 0));
        const rightHandGeometry = this.createOrganicHand(BODY_PARTS.HAND.radius, BODY_PARTS.HAND.height);
        this.drawGeometry(rightHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 손
        this.popMatrix(); // 손목
        this.popMatrix(); // 아래팔
        this.popMatrix(); // 팔꿈치
        this.popMatrix(); // 위팔
        this.popMatrix(); // 어깨
        
        // 왼쪽 다리 시스템 (유기적 연결)
        this.pushMatrix();
        const leftHipX = -BODY_PARTS.TORSO.width/4;
        const hipY = -BODY_PARTS.TORSO.height/2;
        modelViewMatrix = mult(modelViewMatrix, translate(leftHipX, hipY, 0));
        
        // 왼쪽 허벅지
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const leftUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(leftUpperLegGeometry, LIMB_COLOR);
        
        // 무릎 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const leftKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.06);
        this.drawGeometry(leftKneeJointGeometry, LIMB_COLOR);
        
        // 왼쪽 종아리
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.03, 0));
        const leftLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(leftLowerLegGeometry, LIMB_COLOR);
        
        // 발목 연결부 및 발
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - BODY_PARTS.FOOT.height/2, 0));
        const leftFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(leftFootGeometry, BODY_COLOR);
        this.popMatrix(); // 발
        this.popMatrix(); // 종아리
        this.popMatrix(); // 무릎
        this.popMatrix(); // 허벅지
        this.popMatrix(); // 허리
        
        // 오른쪽 다리 시스템 (유기적 연결)
        this.pushMatrix();
        const rightHipX = BODY_PARTS.TORSO.width/4;
        modelViewMatrix = mult(modelViewMatrix, translate(rightHipX, hipY, 0));
        
        // 오른쪽 허벅지
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const rightUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(rightUpperLegGeometry, LIMB_COLOR);
        
        // 무릎 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const rightKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.06);
        this.drawGeometry(rightKneeJointGeometry, LIMB_COLOR);
        
        // 오른쪽 종아리
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.03, 0));
        const rightLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(rightLowerLegGeometry, LIMB_COLOR);
        
        // 발목 연결부 및 발
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - BODY_PARTS.FOOT.height/2, 0));
        const rightFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(rightFootGeometry, BODY_COLOR);
        this.popMatrix(); // 발
        this.popMatrix(); // 종아리
        this.popMatrix(); // 무릎
        this.popMatrix(); // 허벅지
        this.popMatrix(); // 허리
        
        this.popMatrix(); // 몸통
    }
    
    /**
     * 달리는 포즈 렌더링 (유기적 형태)
     * @method drawRunning
     */
    drawRunning() {
        // 몸통 (조끼 형태 - 흰색) - 앞으로 기울임
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-25));
        const torsoGeometry = this.createVest(BODY_PARTS.TORSO.width, BODY_PARTS.TORSO.height, BODY_PARTS.TORSO.depth);
        this.drawGeometry(torsoGeometry, BODY_COLOR);
        
        // 머리 (타원형 - 파란색)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, BODY_PARTS.TORSO.height/2 + BODY_PARTS.HEAD.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(15));
        const headGeometry = this.createEllipsoid(BODY_PARTS.HEAD.width/2, BODY_PARTS.HEAD.height/2, BODY_PARTS.HEAD.depth/2);
        this.drawGeometry(headGeometry, LIMB_COLOR);
        this.popMatrix();
        
        // 왼쪽 어깨 (앞으로 뻗는 팔 - 유기적)
        this.pushMatrix();
        const leftShoulderX = -BODY_PARTS.TORSO.width/2;
        const shoulderY = BODY_PARTS.TORSO.height/2 - BODY_PARTS.UPPER_ARM.height/3;
        modelViewMatrix = mult(modelViewMatrix, translate(leftShoulderX, shoulderY, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(75));
        
        // 왼쪽 위팔 (캡슐)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const leftUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(leftUpperArmGeometry, LIMB_COLOR);
        
        // 팔꿈치 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-90));
        const leftElbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.05);
        this.drawGeometry(leftElbowJointGeometry, LIMB_COLOR);
        
        // 왼쪽 아래팔
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.025, 0));
        const leftLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(leftLowerArmGeometry, LIMB_COLOR);
        
        // 손목 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        const leftWristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius, 0.03);
        this.drawGeometry(leftWristJointGeometry, LIMB_COLOR);
        
        // 왼손
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.015, 0));
        const leftHandGeometry = this.createOrganicHand(BODY_PARTS.HAND.radius, BODY_PARTS.HAND.height);
        this.drawGeometry(leftHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 손
        this.popMatrix(); // 손목
        this.popMatrix(); // 아래팔
        this.popMatrix(); // 팔꿈치
        this.popMatrix(); // 위팔
        this.popMatrix(); // 어깨
        
        // 오른쪽 어깨 (뒤로 뻗는 팔 - 유기적)
        this.pushMatrix();
        const rightShoulderX = BODY_PARTS.TORSO.width/2;
        modelViewMatrix = mult(modelViewMatrix, translate(rightShoulderX, shoulderY, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-75));
        
        // 오른쪽 위팔 (캡슐)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        const rightUpperArmGeometry = this.createCapsule(BODY_PARTS.UPPER_ARM.topRadius, BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.UPPER_ARM.height);
        this.drawGeometry(rightUpperArmGeometry, LIMB_COLOR);
        
        // 팔꿈치 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_ARM.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(90));
        const rightElbowJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.05);
        this.drawGeometry(rightElbowJointGeometry, LIMB_COLOR);
        
        // 오른쪽 아래팔
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2 - 0.025, 0));
        const rightLowerArmGeometry = this.createCapsule(BODY_PARTS.LOWER_ARM.topRadius, BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.height);
        this.drawGeometry(rightLowerArmGeometry, LIMB_COLOR);
        
        // 손목 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_ARM.height/2, 0));
        const rightWristJointGeometry = this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius, 0.03);
        this.drawGeometry(rightWristJointGeometry, LIMB_COLOR);
        
        // 오른손
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.HAND.height/2 - 0.015, 0));
        const rightHandGeometry = this.createOrganicHand(BODY_PARTS.HAND.radius, BODY_PARTS.HAND.height);
        this.drawGeometry(rightHandGeometry, LIMB_COLOR);
        this.popMatrix(); // 손
        this.popMatrix(); // 손목
        this.popMatrix(); // 아래팔
        this.popMatrix(); // 팔꿈치
        this.popMatrix(); // 위팔
        this.popMatrix(); // 어깨
        
        // 왼쪽 다리 (뒤로 - 유기적)
        this.pushMatrix();
        const leftHipX = -BODY_PARTS.TORSO.width/4;
        const hipY = -BODY_PARTS.TORSO.height/2;
        modelViewMatrix = mult(modelViewMatrix, translate(leftHipX, hipY, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(50));
        
        // 왼쪽 허벅지 (캡슐)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const leftUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(leftUpperLegGeometry, LIMB_COLOR);
        
        // 무릎 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-70));
        const leftKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.06);
        this.drawGeometry(leftKneeJointGeometry, LIMB_COLOR);
        
        // 왼쪽 종아리
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.03, 0));
        const leftLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(leftLowerLegGeometry, LIMB_COLOR);
        
        // 발목 및 발
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(20));
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.FOOT.height/2, 0));
        const leftFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(leftFootGeometry, BODY_COLOR);
        this.popMatrix(); // 발
        this.popMatrix(); // 종아리
        this.popMatrix(); // 무릎
        this.popMatrix(); // 허벅지
        this.popMatrix(); // 허리
        
        // 오른쪽 다리 (앞으로 - 유기적)
        this.pushMatrix();
        const rightHipX = BODY_PARTS.TORSO.width/4;
        modelViewMatrix = mult(modelViewMatrix, translate(rightHipX, hipY, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-70));
        
        // 오른쪽 허벅지 (캡슐)
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        const rightUpperLegGeometry = this.createCapsule(BODY_PARTS.UPPER_LEG.topRadius, BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.UPPER_LEG.height);
        this.drawGeometry(rightUpperLegGeometry, LIMB_COLOR);
        
        // 무릎 연결부
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.UPPER_LEG.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(110));
        const rightKneeJointGeometry = this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.06);
        this.drawGeometry(rightKneeJointGeometry, LIMB_COLOR);
        
        // 오른쪽 종아리
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2 - 0.03, 0));
        const rightLowerLegGeometry = this.createCapsule(BODY_PARTS.LOWER_LEG.topRadius, BODY_PARTS.LOWER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.height);
        this.drawGeometry(rightLowerLegGeometry, LIMB_COLOR);
        
        // 발목 및 발
        this.pushMatrix();
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.LOWER_LEG.height/2, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(-40));
        modelViewMatrix = mult(modelViewMatrix, translate(0, -BODY_PARTS.FOOT.height/2, 0));
        const rightFootGeometry = this.createFoot(BODY_PARTS.FOOT.width, BODY_PARTS.FOOT.height, BODY_PARTS.FOOT.depth);
        this.drawGeometry(rightFootGeometry, BODY_COLOR);
        this.popMatrix(); // 발
        this.popMatrix(); // 종아리
        this.popMatrix(); // 무릎
        this.popMatrix(); // 허벅지
        this.popMatrix(); // 허리
        
        this.popMatrix(); // 몸통
    }
} 