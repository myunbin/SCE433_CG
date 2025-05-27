/**
 * @fileoverview 3D 조명 시스템 모듈
 * @description Blinn-Phong 조명 모델을 구현하고 조명 파라미터를 관리합니다.
 * @author SCE433 Computer Graphics Team
 * @version 1.0.0
 */

/**
 * 조명 시스템 클래스
 * @class Lighting
 * @description WebGL 3D 장면의 조명을 관리하는 클래스
 */
class Lighting {
    /**
     * Lighting 생성자
     * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
     * @param {WebGLProgram} program - 셰이더 프로그램
     */
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        
        // 조명 파라미터
        this.position = vec4(2.0, 2.0, 2.0, 1.0); // w=1: point light, w=0: directional
        this.type = 'point'; // 'point' or 'directional'
        
        // 조명 강도
        this.intensity = {
            ambient: 0.2,
            diffuse: 0.8,
            specular: 1.0
        };
        
        // 재질 속성
        this.material = {
            ambient: vec4(1.0, 1.0, 1.0, 1.0),
            diffuse: vec4(1.0, 1.0, 1.0, 1.0),
            specular: vec4(0.3, 0.3, 0.3, 1.0),
            shininess: 20.0
        };
        
        // 감쇠 계수 (점 광원용)
        this.attenuation = {
            constant: 1.0,
            linear: 0.01,
            quadratic: 0.001
        };
        
        // Uniform 위치 캐싱
        this.uniformLocations = this.getUniformLocations();
        
        // 초기 조명 설정
        this.update();
    }
    
    /**
     * Uniform 위치 가져오기
     * @method getUniformLocations
     * @returns {Object} Uniform 위치 객체
     */
    getUniformLocations() {
        return {
            lightPosition: this.gl.getUniformLocation(this.program, "uLightPosition"),
            ambientProduct: this.gl.getUniformLocation(this.program, "uAmbientProduct"),
            diffuseProduct: this.gl.getUniformLocation(this.program, "uDiffuseProduct"),
            specularProduct: this.gl.getUniformLocation(this.program, "uSpecularProduct"),
            shininess: this.gl.getUniformLocation(this.program, "uShininess"),
            attenuationA: this.gl.getUniformLocation(this.program, "uAttenuationA"),
            attenuationB: this.gl.getUniformLocation(this.program, "uAttenuationB"),
            attenuationC: this.gl.getUniformLocation(this.program, "uAttenuationC")
        };
    }
    
    /**
     * 조명 업데이트
     * @method update
     * @description 현재 조명 파라미터를 셰이더에 전달
     */
    update() {
        // 조명 색상 계산
        const lightAmbient = scale(this.intensity.ambient, vec4(1, 1, 1, 1));
        const lightDiffuse = scale(this.intensity.diffuse, vec4(1, 1, 1, 1));
        const lightSpecular = scale(this.intensity.specular, vec4(1, 1, 1, 1));
        
        // 조명과 재질의 곱
        const ambientProduct = mult(lightAmbient, this.material.ambient);
        const diffuseProduct = mult(lightDiffuse, this.material.diffuse);
        const specularProduct = mult(lightSpecular, this.material.specular);
        
        // Uniform 변수에 값 전달
        if (this.uniformLocations.lightPosition) {
            this.gl.uniform4fv(this.uniformLocations.lightPosition, flatten(this.position));
        }
        if (this.uniformLocations.ambientProduct) {
            this.gl.uniform4fv(this.uniformLocations.ambientProduct, flatten(ambientProduct));
        }
        if (this.uniformLocations.diffuseProduct) {
            this.gl.uniform4fv(this.uniformLocations.diffuseProduct, flatten(diffuseProduct));
        }
        if (this.uniformLocations.specularProduct) {
            this.gl.uniform4fv(this.uniformLocations.specularProduct, flatten(specularProduct));
        }
        if (this.uniformLocations.shininess) {
            this.gl.uniform1f(this.uniformLocations.shininess, this.material.shininess);
        }
        if (this.uniformLocations.attenuationA) {
            this.gl.uniform1f(this.uniformLocations.attenuationA, this.attenuation.constant);
        }
        if (this.uniformLocations.attenuationB) {
            this.gl.uniform1f(this.uniformLocations.attenuationB, this.attenuation.linear);
        }
        if (this.uniformLocations.attenuationC) {
            this.gl.uniform1f(this.uniformLocations.attenuationC, this.attenuation.quadratic);
        }
    }
    
    /**
     * 조명 위치 설정
     * @method setPosition
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     * @param {number} z - Z 좌표
     */
    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.update();
    }
    
    /**
     * 조명 타입 설정
     * @method setType
     * @param {string} type - 'point' 또는 'directional'
     */
    setType(type) {
        this.type = type;
        this.position[3] = (type === 'point') ? 1.0 : 0.0;
        this.update();
    }
    
    /**
     * 조명 강도 설정
     * @method setIntensity
     * @param {string} component - 'ambient', 'diffuse', 또는 'specular'
     * @param {number} value - 강도 값 (0.0 ~ 1.0)
     */
    setIntensity(component, value) {
        if (this.intensity.hasOwnProperty(component)) {
            this.intensity[component] = value;
            this.update();
        }
    }
    
    /**
     * 재질 반짝임 설정
     * @method setShininess
     * @param {number} value - 반짝임 값 (1 ~ 100)
     */
    setShininess(value) {
        this.material.shininess = value;
        this.update();
    }
    
    /**
     * 감쇠 계수 설정
     * @method setAttenuation
     * @param {number} constant - 상수 감쇠
     * @param {number} linear - 선형 감쇠
     * @param {number} quadratic - 이차 감쇠
     */
    setAttenuation(constant, linear, quadratic) {
        this.attenuation.constant = constant;
        this.attenuation.linear = linear;
        this.attenuation.quadratic = quadratic;
        this.update();
    }
    
    /**
     * 기본값으로 초기화
     * @method reset
     */
    reset() {
        this.position = vec4(2.0, 2.0, 2.0, 1.0);
        this.type = 'point';
        this.intensity = {
            ambient: 0.2,
            diffuse: 0.8,
            specular: 1.0
        };
        this.material.shininess = 20.0;
        this.update();
    }
    
    /**
     * 현재 조명 상태 반환
     * @method getState
     * @returns {Object} 조명 상태 객체
     */
    getState() {
        return {
            position: [...this.position],
            type: this.type,
            intensity: { ...this.intensity },
            shininess: this.material.shininess,
            attenuation: { ...this.attenuation }
        };
    }
    
    /**
     * 조명 상태 설정
     * @method setState
     * @param {Object} state - 조명 상태 객체
     */
    setState(state) {
        if (state.position) this.position = vec4(...state.position);
        if (state.type) this.setType(state.type);
        if (state.intensity) this.intensity = { ...state.intensity };
        if (state.shininess) this.material.shininess = state.shininess;
        if (state.attenuation) this.attenuation = { ...state.attenuation };
        this.update();
    }
} 