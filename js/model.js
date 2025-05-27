/**
 * @fileoverview 3D 인체 모델 정의 및 렌더링 모듈
 * @description 계층적 구조의 올림픽 픽토그램 스타일 인체 모델을 렌더링합니다.
 *              포즈 제어와 애니메이션을 지원하는 유기적 형태의 3D 모델입니다.
 * @author SCE433 Computer Graphics Team
 * @version 4.0.0 - DFS 기반 Hierarchical Model 리팩토링
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
 * Hierarchical Model Node 클래스
 * @class Node
 * @description 계층적 모델의 각 노드를 표현하는 클래스
 */
class Node {
    /**
     * Node 생성자
     * @param {string} name - 노드 이름
     * @param {Function} geometryCreator - 기하학적 형태 생성 함수
     * @param {vec4} color - 색상
     * @param {vec3} localTranslation - 로컬 이동 벡터
     * @param {vec3} localRotation - 로컬 회전 벡터 (도 단위)
     * @param {vec3} localScale - 로컬 스케일 벡터
     */
    constructor(name, geometryCreator = null, color = LIMB_COLOR, localTranslation = vec3(0, 0, 0), localRotation = vec3(0, 0, 0), localScale = vec3(1, 1, 1)) {
        this.name = name;
        this.geometryCreator = geometryCreator;
        this.color = color;
        this.localTranslation = localTranslation;
        this.localRotation = localRotation;
        this.localScale = localScale;
        this.children = [];
        this.parent = null;
        
        // 동적 변환 (애니메이션/포즈 제어용)
        this.dynamicTranslation = vec3(0, 0, 0);
        this.dynamicRotation = vec3(0, 0, 0);
        this.dynamicScale = vec3(1, 1, 1);
    }
    
    /**
     * 자식 노드 추가
     * @method addChild
     * @param {Node} child - 추가할 자식 노드
     */
    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
    
    /**
     * 자식 노드 제거
     * @method removeChild
     * @param {Node} child - 제거할 자식 노드
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }
    
    /**
     * 최종 변환 행렬 계산 (로컬 + 동적)
     * @method getTransformMatrix
     * @returns {mat4} 변환 행렬
     */
    getTransformMatrix() {
        let transform = mat4();
        
        // 이동 (로컬 + 동적)
        const totalTranslation = add(this.localTranslation, this.dynamicTranslation);
        if (totalTranslation.some(v => v !== 0)) {
            transform = mult(transform, translate(...totalTranslation));
        }
        
        // 회전 (로컬 + 동적) - Z -> Y -> X 순서
        const totalRotation = add(this.localRotation, this.dynamicRotation);
        if (totalRotation[2]) transform = mult(transform, rotateZ(totalRotation[2]));
        if (totalRotation[1]) transform = mult(transform, rotateY(totalRotation[1]));
        if (totalRotation[0]) transform = mult(transform, rotateX(totalRotation[0]));
        
        // 스케일 (로컬 * 동적)
        const totalScale = vec3(
            this.localScale[0] * this.dynamicScale[0],
            this.localScale[1] * this.dynamicScale[1],
            this.localScale[2] * this.dynamicScale[2]
        );
        if (totalScale.some(v => v !== 1)) {
            transform = mult(transform, scale(...totalScale));
        }
        
        return transform;
    }
    
    /**
     * 동적 변환 설정 (애니메이션/포즈 제어용)
     * @method setDynamicTransform
     * @param {vec3} translation - 동적 이동값
     * @param {vec3} rotation - 동적 회전값 (도 단위)
     * @param {vec3} scale - 동적 크기 조절값
     */
    setDynamicTransform(translation = vec3(0, 0, 0), rotation = vec3(0, 0, 0), scale = vec3(1, 1, 1)) {
        this.dynamicTranslation = translation;
        this.dynamicRotation = rotation;
        this.dynamicScale = scale;
    }
}

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
        
        // 버퍼 초기화
        this.positionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        
        // 노드 트리 루트
        this.rootNode = null;
        // 노드 이름으로 빠른 접근을 위한 맵
        this.nodeMap = new Map();
        
        // Hierarchical 구조 구성
        this.buildHierarchy();
    }
    
    /**
     * Hierarchical 노드 트리 구성
     * @method buildHierarchy
     */
    buildHierarchy() {
        // 루트 노드 (몸통)
        this.rootNode = new Node(
            'TORSO',
            () => this.createVest(BODY_PARTS.TORSO.width, BODY_PARTS.TORSO.height, BODY_PARTS.TORSO.depth),
            BODY_COLOR,
            vec3(0, 0, 0),
            vec3(0, 0, 0) // 회전 없음
        );
        this.nodeMap.set('TORSO', this.rootNode);
        
        // 머리 (몸통의 자식)
        const headNode = new Node(
            'HEAD',
            () => this.createEllipsoid(BODY_PARTS.HEAD.width/2, BODY_PARTS.HEAD.height/2, BODY_PARTS.HEAD.depth/2),
            LIMB_COLOR,
            vec3(0, BODY_PARTS.TORSO.height/2 + BODY_PARTS.HEAD.height/2, 0)
        );
        this.rootNode.addChild(headNode);
        this.nodeMap.set('HEAD', headNode);
        
        // 왼팔 시스템
        this.buildArmHierarchy('LEFT', -BODY_PARTS.TORSO.width/2, BODY_PARTS.TORSO.height/3);
        
        // 오른팔 시스템
        this.buildArmHierarchy('RIGHT', BODY_PARTS.TORSO.width/2, BODY_PARTS.TORSO.height/3);
        
        // 왼다리 시스템
        this.buildLegHierarchy('LEFT', -BODY_PARTS.TORSO.width/4, -BODY_PARTS.TORSO.height/2);
        
        // 오른다리 시스템
        this.buildLegHierarchy('RIGHT', BODY_PARTS.TORSO.width/4, -BODY_PARTS.TORSO.height/2);
    }
    
    /**
     * 팔 계층 구조 구성
     * @method buildArmHierarchy
     * @param {string} side - 'LEFT' 또는 'RIGHT'
     * @param {number} shoulderX - 어깨 X 위치
     * @param {number} shoulderY - 어깨 Y 위치
     */
    buildArmHierarchy(side, shoulderX, shoulderY) {
        // 위팔 (어깨 관절에서 회전)
        const upperArmNode = new Node(
            `${side}_UPPER_ARM`,
            () => this.createCapsule(
                BODY_PARTS.UPPER_ARM.topRadius, 
                BODY_PARTS.UPPER_ARM.bottomRadius, 
                BODY_PARTS.UPPER_ARM.height,
                16,
                -BODY_PARTS.UPPER_ARM.height/2 // 어깨 관절이 위팔의 위쪽 끝이 되도록
            ),
            LIMB_COLOR,
            vec3(shoulderX, shoulderY, 0) // 어깨 관절 위치
        );
        this.rootNode.addChild(upperArmNode);
        this.nodeMap.set(`${side}_UPPER_ARM`, upperArmNode);
        
        // 팔꿈치 관절 (위팔의 아래쪽 끝)
        const elbowJointNode = new Node(
            `${side}_ELBOW_JOINT`,
            () => this.createSmoothJoint(BODY_PARTS.UPPER_ARM.bottomRadius, BODY_PARTS.LOWER_ARM.topRadius, 0.08),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.UPPER_ARM.height, 0)
        );
        upperArmNode.addChild(elbowJointNode);
        
        // 아래팔 (팔꿈치 관절에서 회전)
        const lowerArmNode = new Node(
            `${side}_LOWER_ARM`,
            () => this.createCapsule(
                BODY_PARTS.LOWER_ARM.topRadius, 
                BODY_PARTS.LOWER_ARM.bottomRadius, 
                BODY_PARTS.LOWER_ARM.height,
                16,
                -BODY_PARTS.LOWER_ARM.height/2 // 팔꿈치 관절이 아래팔의 위쪽 끝이 되도록
            ),
            LIMB_COLOR,
            vec3(0, 0, 0) // 팔꿈치 관절 위치 (부모로부터 상대적)
        );
        elbowJointNode.addChild(lowerArmNode);
        this.nodeMap.set(`${side}_LOWER_ARM`, lowerArmNode);
        
        // 손목 관절 (아래팔의 아래쪽 끝)
        const wristJointNode = new Node(
            `${side}_WRIST_JOINT`,
            () => this.createSmoothJoint(BODY_PARTS.LOWER_ARM.bottomRadius, BODY_PARTS.HAND.radius * 0.8, 0.05),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.LOWER_ARM.height, 0)
        );
        lowerArmNode.addChild(wristJointNode);
        
        // 손 (손목 관절에서 회전)
        const handRadius = BODY_PARTS.HAND.radius * 0.7; // 30% 크기 감소
        const handNode = new Node(
            `${side}_HAND`,
            () => this.createEllipsoid(handRadius, handRadius, handRadius),
            LIMB_COLOR,
            vec3(0, -handRadius, 0) // 손목 관절에서 줄어든 구의 반지름만큼 아래로 이동
        );
        wristJointNode.addChild(handNode);
        this.nodeMap.set(`${side}_HAND`, handNode);
    }
    
    /**
     * 다리 계층 구조 구성
     * @method buildLegHierarchy
     * @param {string} side - 'LEFT' 또는 'RIGHT'
     * @param {number} hipX - 엉덩이 X 위치
     * @param {number} hipY - 엉덩이 Y 위치
     */
    buildLegHierarchy(side, hipX, hipY) {
        // 허벅지 (엉덩이 관절에서 회전)
        const upperLegNode = new Node(
            `${side}_UPPER_LEG`,
            () => this.createCapsule(
                BODY_PARTS.UPPER_LEG.topRadius, 
                BODY_PARTS.UPPER_LEG.bottomRadius, 
                BODY_PARTS.UPPER_LEG.height,
                16,
                -BODY_PARTS.UPPER_LEG.height/2 // 엉덩이 관절이 허벅지의 위쪽 끝이 되도록
            ),
            LIMB_COLOR,
            vec3(hipX, hipY, 0) // 엉덩이 관절 위치
        );
        this.rootNode.addChild(upperLegNode);
        this.nodeMap.set(`${side}_UPPER_LEG`, upperLegNode);
        
        // 무릎 관절 (허벅지의 아래쪽 끝)
        const kneeJointNode = new Node(
            `${side}_KNEE_JOINT`,
            () => this.createSmoothJoint(BODY_PARTS.UPPER_LEG.bottomRadius, BODY_PARTS.LOWER_LEG.topRadius, 0.08),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.UPPER_LEG.height, 0)
        );
        upperLegNode.addChild(kneeJointNode);
        
        // 종아리 (무릎 관절에서 회전)
        const lowerLegNode = new Node(
            `${side}_LOWER_LEG`,
            () => this.createCapsule(
                BODY_PARTS.LOWER_LEG.topRadius, 
                BODY_PARTS.LOWER_LEG.bottomRadius, 
                BODY_PARTS.LOWER_LEG.height,
                16,
                -BODY_PARTS.LOWER_LEG.height/2 // 무릎 관절이 종아리의 위쪽 끝이 되도록
            ),
            LIMB_COLOR,
            vec3(0, 0, 0) // 무릎 관절 위치 (부모로부터 상대적)
        );
        kneeJointNode.addChild(lowerLegNode);
        this.nodeMap.set(`${side}_LOWER_LEG`, lowerLegNode);
        
        // 발 (발목 관절에서 회전)
        const footNode = new Node(
            `${side}_FOOT`,
            () => this.createFoot(
                BODY_PARTS.FOOT.width, 
                BODY_PARTS.FOOT.height, 
                BODY_PARTS.FOOT.depth,
                -BODY_PARTS.FOOT.height/2 // 발목 관절이 발의 위쪽이 되도록
            ),
            BODY_COLOR,
            vec3(0, -BODY_PARTS.LOWER_LEG.height, 0) // 발목 관절 위치
        );
        lowerLegNode.addChild(footNode);
        this.nodeMap.set(`${side}_FOOT`, footNode);
    }
    
    /**
     * DFS를 통한 노드 트리 렌더링
     * @method renderDFS
     * @param {Node} node - 현재 노드
     * @param {mat4} parentTransform - 부모 변환 행렬
     */
    renderDFS(node, parentTransform = mat4()) {
        if (!node) {
            return;
        }
        
        // 현재 노드의 변환 계산
        const currentTransform = mult(parentTransform, node.getTransformMatrix());
        
        // 기하학적 형태가 있다면 렌더링
        if (node.geometryCreator) {
            // 변환 행렬을 modelMatrix에 설정
            const savedModel = modelMatrix;
            modelMatrix = currentTransform;
            
            // 기하학적 형태 생성 및 그리기
            const geometry = node.geometryCreator();
            this.drawGeometry(geometry, node.color);
            
            // modelMatrix 복원
            modelMatrix = savedModel;
        }
        
        // 자식 노드들을 DFS로 렌더링
        for (const child of node.children) {
            this.renderDFS(child, currentTransform);
        }
    }
    
    /**
     * 노드 변환 설정 (기존 API 호환성)
     * @method setNodeTransform
     * @param {string} nodeName - 노드 이름
     * @param {vec3} translation - 이동값
     * @param {vec3} rotation - 회전값 (도 단위)
     * @param {vec3} scale - 크기 조절값
     */
    setNodeTransform(nodeName, translation = vec3(0, 0, 0), rotation = vec3(0, 0, 0), scale = vec3(1, 1, 1)) {
        const node = this.nodeMap.get(nodeName);
        if (node) {
            node.setDynamicTransform(translation, rotation, scale);
        }
    }
    
    /**
     * 모든 노드 변환 초기화
     * @method resetAllTransforms
     */
    resetAllTransforms() {
        for (const [name, node] of this.nodeMap) {
            node.setDynamicTransform(vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
        }
    }
    
    /**
     * 렌더링 메인 메서드 (DFS 기반)
     * @method render
     */
    render() {
        // DFS를 통한 계층적 렌더링
        this.renderDFS(this.rootNode, modelMatrix);
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
        
        // 인덱스 생성 (바깥쪽을 향한 법선)
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j;
                const second = first + segments + 1;
                
                // 반시계방향으로 수정하여 바깥쪽 법선 보장
                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
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
        
        // 측면 인덱스 (바깥쪽을 향한 법선)
        for (let i = 0; i < segments; i++) {
            const topCurrent = 2 + i * 2;
            const topNext = 2 + ((i + 1) % segments) * 2;
            const bottomCurrent = topCurrent + 1;
            const bottomNext = topNext + 1;
            
            // 측면 사각형을 두 개의 삼각형으로 (반시계방향)
            indices.push(topCurrent, topNext, bottomCurrent);
            indices.push(bottomCurrent, topNext, bottomNext);
        }
        
        // 위쪽 면 인덱스 (위쪽을 향한 법선)
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2;
            const next = 2 + ((i + 1) % segments) * 2;
            indices.push(0, next, current);
        }
        
        // 아래쪽 면 인덱스 (아래쪽을 향한 법선)
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2 + 1;
            const next = 2 + ((i + 1) % segments) * 2 + 1;
            indices.push(1, current, next);
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
        
        // Texture coordinates for each vertex
        const texCoords = [
            // 앞면 vertices (0-5) - Y 좌표를 뒤집음 (1.0 - originalY)
            vec2(0.25, 0.0),   // 0: 목 왼쪽 (원래 1.0 -> 0.0)
            vec2(0.75, 0.0),   // 1: 목 오른쪽 (원래 1.0 -> 0.0)
            vec2(0.0, 0.3),    // 2: 어깨 왼쪽 (원래 0.7 -> 0.3)
            vec2(1.0, 0.3),    // 3: 어깨 오른쪽 (원래 0.7 -> 0.3)
            vec2(0.0, 1.0),    // 4: 허리 왼쪽 (원래 0.0 -> 1.0)
            vec2(1.0, 1.0),    // 5: 허리 오른쪽 (원래 0.0 -> 1.0)
            
            // 뒷면 vertices (6-11) - Y 좌표를 뒤집음
            vec2(0.25, 0.0),   // 6: 목 왼쪽 (원래 1.0 -> 0.0)
            vec2(0.75, 0.0),   // 7: 목 오른쪽 (원래 1.0 -> 0.0)
            vec2(0.0, 0.3),    // 8: 어깨 왼쪽 (원래 0.7 -> 0.3)
            vec2(1.0, 0.3),    // 9: 어깨 오른쪽 (원래 0.7 -> 0.3)
            vec2(0.0, 1.0),    // 10: 허리 왼쪽 (원래 0.0 -> 1.0)
            vec2(1.0, 1.0)     // 11: 허리 오른쪽 (원래 0.0 -> 1.0)
        ];
        
        const indices = [
            // 앞면 (Z+ 방향을 향한 법선, 시계방향으로 변경하여 법선 반전)
            0, 2, 1, 1, 2, 3,
            2, 4, 3, 3, 4, 5,
            
            // 뒷면 (Z- 방향을 향한 법선, 시계방향으로 변경하여 법선 반전) 
            6, 7, 8, 7, 9, 8,
            8, 9, 10, 9, 11, 10,
            
            // 왼쪽 측면 (X- 방향을 향한 법선, 시계방향으로 변경하여 법선 반전)
            0, 6, 2, 2, 6, 8,
            2, 8, 4, 4, 8, 10,
            
            // 오른쪽 측면 (X+ 방향을 향한 법선, 시계방향으로 변경하여 법선 반전)
            1, 3, 7, 3, 9, 7,
            3, 5, 9, 5, 11, 9,
            
            // 윗면 (Y+ 방향을 향한 법선, 반시계방향으로 변경하여 법선 반전)
            0, 1, 6, 1, 7, 6,
            
            // 아랫면 (Y- 방향을 향한 법선, 시계방향으로 변경하여 법선 반전)  
            4, 10, 5, 5, 10, 11
        ];
        
        return { vertices, indices, texCoords };
    }
    
    /**
     * 발 형태 생성 (픽토그램 스타일 - 앞뒤 경사)
     * @method createFoot
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @param {number} depth - 깊이
     * @param {number} yOffset - Y축 오프셋 (기본값: 0, 음수이면 아래쪽으로 이동)
     * @returns {Object} vertices와 indices 배열
     */
    createFoot(width, height, depth, yOffset = 0) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        
        // 신발 형태의 발 (좌우 옆면만 패임, 앞뒤는 경사)
        const vertices = [
            // 뒤꿈치 부분 (둥근 경사, 좌우만 좁음)
            vec4(-w * 0.4, -h + yOffset, -d * 0.7, 1.0),       // 0: 뒤꿈치 좌하
            vec4(w * 0.4, -h + yOffset, -d * 0.7, 1.0),        // 1: 뒤꿈치 우하
            vec4(-w * 0.4, h * 0.6 + yOffset, -d * 0.7, 1.0),  // 2: 뒤꿈치 좌상
            vec4(w * 0.4, h * 0.6 + yOffset, -d * 0.7, 1.0),   // 3: 뒤꿈치 우상
            // 발가락 부분 (올라가는 경사, 좌우만 좁음)
            vec4(-w * 0.4, -h * 0.5 + yOffset, d, 1.0),        // 4: 발가락 좌하
            vec4(w * 0.4, -h * 0.5 + yOffset, d, 1.0),         // 5: 발가락 우하
            vec4(-w * 0.4, h + yOffset, d * 0.8, 1.0),         // 6: 발가락 좌상
            vec4(w * 0.4, h + yOffset, d * 0.8, 1.0)           // 7: 발가락 우상
        ];
        
        const indices = [
            // 아래면 (Y- 방향을 향한 법선, 시계방향 - 아래에서 올려다볼 때)
            0, 1, 4, 1, 5, 4,
            
            // 위면 (Y+ 방향을 향한 법선, 반시계방향 - 위에서 내려다볼 때)
            2, 6, 3, 3, 6, 7,
            
            // 왼쪽 측면 (X- 방향을 향한 법선)
            0, 4, 2, 4, 6, 2,
            
            // 오른쪽 측면 (X+ 방향을 향한 법선)
            1, 3, 5, 3, 7, 5,
            
            // 앞면 (Z+ 방향을 향한 법선, 반시계방향)
            4, 5, 6, 5, 7, 6,
            
            // 뒷면 (Z- 방향을 향한 법선, 시계방향)
            0, 2, 1, 2, 3, 1
        ];
        
        return { vertices, indices };
    }
    
    /**
     * 기하학적 형태 그리기 (조명을 위한 법선 포함)
     * @method drawGeometry
     * @param {Object} geometry - 그릴 기하학적 형태
     * @param {vec4} color - 색상
     */
    drawGeometry(geometry, color) {
        const { vertices, indices, texCoords } = geometry;
        const positions = [];
        const colors = [];
        const normals = [];
        const textureCoords = [];
        
        // 삼각형별로 법선 계산
        for (let i = 0; i < indices.length; i += 3) {
            const v0 = vertices[indices[i]];
            const v1 = vertices[indices[i + 1]];
            const v2 = vertices[indices[i + 2]];
            
            // 두 변 벡터 계산
            const edge1 = vec3(
                v1[0] - v0[0],
                v1[1] - v0[1],
                v1[2] - v0[2]
            );
            const edge2 = vec3(
                v2[0] - v0[0],
                v2[1] - v0[1],
                v2[2] - v0[2]
            );
            
            // 외적으로 법선 계산
            const normal = normalize(cross(edge1, edge2));
            
            // 세 정점에 동일한 법선 할당
            for (let j = 0; j < 3; j++) {
                const vertexIndex = indices[i + j];
                positions.push(vertices[vertexIndex]);
                colors.push(color);
                normals.push(normal);
                
                // Texture coordinates 추가 (있는 경우)
                if (texCoords && texCoords[vertexIndex]) {
                    textureCoords.push(texCoords[vertexIndex]);
                } else {
                    // 기본 texture coordinate
                    textureCoords.push(vec2(0.0, 0.0));
                }
            }
        }
        
        // 현재 모델 행렬을 셰이더에 전송
        const uModelMatrix = this.gl.getUniformLocation(this.program, "uModelMatrix");
        if (uModelMatrix) {
            this.gl.uniformMatrix4fv(uModelMatrix, false, flatten(modelMatrix));
        }
        
        // 뷰 행렬 전송
        const uViewMatrix = this.gl.getUniformLocation(this.program, "uViewMatrix");
        if (uViewMatrix && window.viewMatrix) {
            this.gl.uniformMatrix4fv(uViewMatrix, false, flatten(window.viewMatrix));
        }
        
        // 투영 행렬 전송
        const uProjectionMatrix = this.gl.getUniformLocation(this.program, "uProjectionMatrix");
        if (uProjectionMatrix && window.projectionMatrix) {
            this.gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(window.projectionMatrix));
        }
        
        // Normal matrix 계산 및 전송 (모델 행렬의 3x3 부분의 역전치행렬)
        const normalMatrix = mat3();
        
        // 모델 행렬의 3x3 부분 추출
        const modelMatrix3x3 = mat3();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                modelMatrix3x3[i][j] = modelMatrix[i][j];
            }
        }
        
        // 역행렬 계산
        const det = modelMatrix3x3[0][0] * (modelMatrix3x3[1][1] * modelMatrix3x3[2][2] - modelMatrix3x3[1][2] * modelMatrix3x3[2][1]) -
                   modelMatrix3x3[0][1] * (modelMatrix3x3[1][0] * modelMatrix3x3[2][2] - modelMatrix3x3[1][2] * modelMatrix3x3[2][0]) +
                   modelMatrix3x3[0][2] * (modelMatrix3x3[1][0] * modelMatrix3x3[2][1] - modelMatrix3x3[1][1] * modelMatrix3x3[2][0]);
        
        if (Math.abs(det) > 0.00001) {
            const invDet = 1.0 / det;
            
            // 역행렬 계산
            const inv = mat3();
            inv[0][0] = invDet * (modelMatrix3x3[1][1] * modelMatrix3x3[2][2] - modelMatrix3x3[1][2] * modelMatrix3x3[2][1]);
            inv[0][1] = invDet * (modelMatrix3x3[0][2] * modelMatrix3x3[2][1] - modelMatrix3x3[0][1] * modelMatrix3x3[2][2]);
            inv[0][2] = invDet * (modelMatrix3x3[0][1] * modelMatrix3x3[1][2] - modelMatrix3x3[0][2] * modelMatrix3x3[1][1]);
            inv[1][0] = invDet * (modelMatrix3x3[1][2] * modelMatrix3x3[2][0] - modelMatrix3x3[1][0] * modelMatrix3x3[2][2]);
            inv[1][1] = invDet * (modelMatrix3x3[0][0] * modelMatrix3x3[2][2] - modelMatrix3x3[0][2] * modelMatrix3x3[2][0]);
            inv[1][2] = invDet * (modelMatrix3x3[0][2] * modelMatrix3x3[1][0] - modelMatrix3x3[0][0] * modelMatrix3x3[1][2]);
            inv[2][0] = invDet * (modelMatrix3x3[1][0] * modelMatrix3x3[2][1] - modelMatrix3x3[1][1] * modelMatrix3x3[2][0]);
            inv[2][1] = invDet * (modelMatrix3x3[0][1] * modelMatrix3x3[2][0] - modelMatrix3x3[0][0] * modelMatrix3x3[2][1]);
            inv[2][2] = invDet * (modelMatrix3x3[0][0] * modelMatrix3x3[1][1] - modelMatrix3x3[0][1] * modelMatrix3x3[1][0]);
            
            // 전치행렬 계산 (역행렬의 전치)
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    normalMatrix[i][j] = inv[j][i];
                }
            }
        }
        
        const uNormalMatrix = this.gl.getUniformLocation(this.program, "uNormalMatrix");
        if (uNormalMatrix) {
            this.gl.uniformMatrix3fv(uNormalMatrix, false, flatten(normalMatrix));
        }
        
        // 버퍼 생성 및 데이터 전송
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(positions), this.gl.STATIC_DRAW);
        
        const vPosition = this.gl.getAttribLocation(this.program, "vPosition");
        if (vPosition >= 0) {
            this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vPosition);
        }
        
        // 색상 버퍼
        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);
        
        const vColor = this.gl.getAttribLocation(this.program, "vColor");
        if (vColor >= 0) {
            this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vColor);
        }
        
        // 법선 버퍼
        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(normals), this.gl.STATIC_DRAW);
        
        const vNormal = this.gl.getAttribLocation(this.program, "vNormal");
        if (vNormal >= 0) {
            this.gl.vertexAttribPointer(vNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vNormal);
        }
        
        // Texture coordinate 버퍼
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(textureCoords), this.gl.STATIC_DRAW);
        
        const vTexCoord = this.gl.getAttribLocation(this.program, "vTexCoord");
        if (vTexCoord >= 0) {
            this.gl.vertexAttribPointer(vTexCoord, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vTexCoord);
        }
        
        // 그리기
        this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length);
        
        // 버퍼 정리
        this.gl.deleteBuffer(positionBuffer);
        this.gl.deleteBuffer(colorBuffer);
        this.gl.deleteBuffer(normalBuffer);
        this.gl.deleteBuffer(texCoordBuffer);
    }
    
    /**
     * 끝이 둥근 원기둥(capsule) 생성 - 유기적 신체 부위용
     * @method createCapsule
     * @param {number} topRadius - 위쪽 반지름
     * @param {number} bottomRadius - 아래쪽 반지름
     * @param {number} height - 높이 (hemisphere 제외)
     * @param {number} segments - 분할 수
     * @param {number} yOffset - Y축 오프셋 (기본값: 0, 음수이면 아래쪽으로 이동)
     * @returns {Object} vertices와 indices 배열
     */
    createCapsule(topRadius, bottomRadius, height, segments = 16, yOffset = 0) {
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
                const y = height/2 + topRadius * cosTheta + yOffset;
                const z = topRadius * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 원기둥 중간 부분
        const cylinderSteps = 8;
        for (let i = 0; i <= cylinderSteps; i++) {
            const t = i / cylinderSteps;
            const y = height/2 - t * height + yOffset;
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
        const bottomHemisphereStartIndex = vertices.length;
        for (let i = 0; i <= segments/2; i++) {
            const theta = (i * Math.PI/2) / (segments/2); // 0 to π/2
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = bottomRadius * sinTheta * cosPhi;
                const y = -height/2 - bottomRadius * cosTheta + yOffset;
                const z = bottomRadius * sinTheta * sinPhi;
                
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        
        // 인덱스 생성
        const topHemisphereRings = segments/2 + 1;
        const cylinderRings = cylinderSteps + 1;
        const bottomHemisphereRings = segments/2 + 1;
        const totalRings = topHemisphereRings + cylinderRings + bottomHemisphereRings;
        
        // 위쪽 hemisphere와 원기둥 부분 (기존 방향)
        const normalSectionRings = topHemisphereRings + cylinderRings - 1;
        for (let i = 0; i < normalSectionRings; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + segments + 1;
                
                // 기존 방향 (바깥쪽 법선)
                indices.push(current, current + 1, next);
                indices.push(next, current + 1, next + 1);
            }
        }
        
        // 아래쪽 hemisphere (법선 반대 방향)
        const bottomStartRing = topHemisphereRings + cylinderRings - 1;
        for (let i = 0; i < segments/2; i++) {
            for (let j = 0; j < segments; j++) {
                const current = (bottomStartRing + i) * (segments + 1) + j;
                const next = current + segments + 1;
                
                // 법선 반대 방향 (안쪽 법선)
                indices.push(current, next, current + 1);
                indices.push(next, next + 1, current + 1);
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
        
        // 위쪽 중심점 추가
        vertices.push(vec4(0, blendLength/2, 0, 1.0)); // 인덱스 0
        
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
        
        // 아래쪽 중심점 추가
        const bottomCenterIndex = vertices.length;
        vertices.push(vec4(0, -blendLength/2, 0, 1.0));
        
        // 측면 인덱스 생성 (법선 반전을 위해 시계방향으로 변경)
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < segments; j++) {
                const current = 1 + i * (segments + 1) + j; // 첫 번째 링부터 시작
                const next = current + segments + 1;
                
                // 시계방향으로 변경하여 법선 반전
                indices.push(current, next, current + 1);
                indices.push(next, next + 1, current + 1);
            }
        }
        
        // 위쪽 면 인덱스 (법선 반전을 위해 시계방향으로 변경)
        for (let j = 0; j < segments; j++) {
            const current = 1 + j; // 첫 번째 링의 정점들
            const next = 1 + (j + 1) % segments;
            indices.push(0, current, next); // 중심점에서 시계방향
        }
        
        // 아래쪽 면 인덱스 (법선 반전을 위해 반시계방향으로 변경)
        const lastRingStart = 1 + steps * (segments + 1);
        for (let j = 0; j < segments; j++) {
            const current = lastRingStart + j;
            const next = lastRingStart + (j + 1) % segments;
            indices.push(bottomCenterIndex, next, current); // 중심점에서 반시계방향
        }
        
        return { vertices, indices };
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
} 