/**
 * @fileoverview 블린-퐁 조명 모델 관리 클래스
 * @description 블린-퐁 셰이딩 기법을 적용한 조명 계산과 재질 속성 관리
 * @author SCE433 Computer Graphics Team
 * @version 1.0.0
 */

/**
 * 블린-퐁 조명 시스템 클래스
 * @class BlinnPhongLighting
 * @description WebGL에서 블린-퐁 셰이딩을 위한 조명과 재질 속성을 관리합니다.
 */
class BlinnPhongLighting {
    /**
     * BlinnPhongLighting 생성자
     * @param {WebGLRenderingContext} gl - WebGL 컨텍스트
     * @param {WebGLProgram} program - 셰이더 프로그램
     */
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        
        // 유니폼 위치 저장
        this.uniforms = this.getUniformLocations();
        
        // 기본 조명 속성
        this.lightPosition = vec3(5.0, 5.0, 5.0);
        this.lightAmbient = vec3(0.3, 0.3, 0.3);
        this.lightDiffuse = vec3(0.7, 0.7, 0.7);
        this.lightSpecular = vec3(0.8, 0.8, 0.8);
        
        // 기본 재질 속성
        this.materialAmbient = vec3(0.4, 0.4, 0.4);
        this.materialDiffuse = vec3(0.8, 0.8, 0.8);
        this.materialSpecular = vec3(0.5, 0.5, 0.5);
        this.materialShininess = 32.0;
        
        // 초기 유니폼 설정
        this.updateUniforms();
    }
    
    /**
     * 셰이더 유니폼 위치 가져오기
     * @method getUniformLocations
     * @returns {Object} 유니폼 위치 객체
     */
    getUniformLocations() {
        return {
            // 기본 변환 행렬
            uModelViewMatrix: this.gl.getUniformLocation(this.program, "uModelViewMatrix"),
            uProjectionMatrix: this.gl.getUniformLocation(this.program, "uProjectionMatrix"),
            uNormalMatrix: this.gl.getUniformLocation(this.program, "uNormalMatrix"),
            
            // 조명 속성
            uLightPosition: this.gl.getUniformLocation(this.program, "uLightPosition"),
            uLightAmbient: this.gl.getUniformLocation(this.program, "uLightAmbient"),
            uLightDiffuse: this.gl.getUniformLocation(this.program, "uLightDiffuse"),
            uLightSpecular: this.gl.getUniformLocation(this.program, "uLightSpecular"),
            
            // 재질 속성
            uMaterialAmbient: this.gl.getUniformLocation(this.program, "uMaterialAmbient"),
            uMaterialDiffuse: this.gl.getUniformLocation(this.program, "uMaterialDiffuse"),
            uMaterialSpecular: this.gl.getUniformLocation(this.program, "uMaterialSpecular"),
            uMaterialShininess: this.gl.getUniformLocation(this.program, "uMaterialShininess")
        };
    }
    
    /**
     * 모든 유니폼 값 업데이트
     * @method updateUniforms
     */
    updateUniforms() {
        if (this.uniforms.uLightPosition) {
            this.gl.uniform3fv(this.uniforms.uLightPosition, flatten(this.lightPosition));
        }
        if (this.uniforms.uLightAmbient) {
            this.gl.uniform3fv(this.uniforms.uLightAmbient, flatten(this.lightAmbient));
        }
        if (this.uniforms.uLightDiffuse) {
            this.gl.uniform3fv(this.uniforms.uLightDiffuse, flatten(this.lightDiffuse));
        }
        if (this.uniforms.uLightSpecular) {
            this.gl.uniform3fv(this.uniforms.uLightSpecular, flatten(this.lightSpecular));
        }
        if (this.uniforms.uMaterialAmbient) {
            this.gl.uniform3fv(this.uniforms.uMaterialAmbient, flatten(this.materialAmbient));
        }
        if (this.uniforms.uMaterialDiffuse) {
            this.gl.uniform3fv(this.uniforms.uMaterialDiffuse, flatten(this.materialDiffuse));
        }
        if (this.uniforms.uMaterialSpecular) {
            this.gl.uniform3fv(this.uniforms.uMaterialSpecular, flatten(this.materialSpecular));
        }
        if (this.uniforms.uMaterialShininess) {
            this.gl.uniform1f(this.uniforms.uMaterialShininess, this.materialShininess);
        }
    }
    
    /**
     * 조명 위치 설정
     * @method setLightPosition
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     * @param {number} z - Z 좌표
     */
    setLightPosition(x, y, z) {
        this.lightPosition = vec3(x, y, z);
        if (this.uniforms.uLightPosition) {
            this.gl.uniform3fv(this.uniforms.uLightPosition, flatten(this.lightPosition));
        }
    }
    
    /**
     * 조명 강도 설정
     * @method setLightIntensity
     * @param {number} ambient - Ambient 강도
     * @param {number} diffuse - Diffuse 강도
     * @param {number} specular - Specular 강도
     */
    setLightIntensity(ambient, diffuse, specular) {
        this.lightAmbient = vec3(ambient, ambient, ambient);
        this.lightDiffuse = vec3(diffuse, diffuse, diffuse);
        this.lightSpecular = vec3(specular, specular, specular);
        
        if (this.uniforms.uLightAmbient) {
            this.gl.uniform3fv(this.uniforms.uLightAmbient, flatten(this.lightAmbient));
        }
        if (this.uniforms.uLightDiffuse) {
            this.gl.uniform3fv(this.uniforms.uLightDiffuse, flatten(this.lightDiffuse));
        }
        if (this.uniforms.uLightSpecular) {
            this.gl.uniform3fv(this.uniforms.uLightSpecular, flatten(this.lightSpecular));
        }
    }
    
    /**
     * 재질 속성 설정
     * @method setMaterialProperties
     * @param {number} ambient - 재질 Ambient 반사율
     * @param {number} diffuse - 재질 Diffuse 반사율
     * @param {number} specular - 재질 Specular 반사율
     * @param {number} shininess - 광택도
     */
    setMaterialProperties(ambient, diffuse, specular, shininess) {
        this.materialAmbient = vec3(ambient, ambient, ambient);
        this.materialDiffuse = vec3(diffuse, diffuse, diffuse);
        this.materialSpecular = vec3(specular, specular, specular);
        this.materialShininess = shininess;
        
        if (this.uniforms.uMaterialAmbient) {
            this.gl.uniform3fv(this.uniforms.uMaterialAmbient, flatten(this.materialAmbient));
        }
        if (this.uniforms.uMaterialDiffuse) {
            this.gl.uniform3fv(this.uniforms.uMaterialDiffuse, flatten(this.materialDiffuse));
        }
        if (this.uniforms.uMaterialSpecular) {
            this.gl.uniform3fv(this.uniforms.uMaterialSpecular, flatten(this.materialSpecular));
        }
        if (this.uniforms.uMaterialShininess) {
            this.gl.uniform1f(this.uniforms.uMaterialShininess, this.materialShininess);
        }
    }
    
    /**
     * 모델뷰 행렬과 법선 행렬 업데이트
     * @method updateMatrices
     * @param {mat4} modelViewMatrix - 모델뷰 행렬
     * @param {mat4} projectionMatrix - 투영 행렬
     */
    updateMatrices(modelViewMatrix, projectionMatrix) {
        // 모델뷰 행렬 업데이트
        if (this.uniforms.uModelViewMatrix) {
            this.gl.uniformMatrix4fv(this.uniforms.uModelViewMatrix, false, flatten(modelViewMatrix));
        }
        
        // 투영 행렬 업데이트
        if (this.uniforms.uProjectionMatrix) {
            this.gl.uniformMatrix4fv(this.uniforms.uProjectionMatrix, false, flatten(projectionMatrix));
        }
        
        // 법선 행렬 계산 및 업데이트 (모델뷰 행렬의 역전치 행렬)
        if (this.uniforms.uNormalMatrix) {
            const normalMatrix = mat3();
            const mv = modelViewMatrix;
            
            // 3x3 부분만 추출
            normalMatrix[0][0] = mv[0][0]; normalMatrix[0][1] = mv[0][1]; normalMatrix[0][2] = mv[0][2];
            normalMatrix[1][0] = mv[1][0]; normalMatrix[1][1] = mv[1][1]; normalMatrix[1][2] = mv[1][2];
            normalMatrix[2][0] = mv[2][0]; normalMatrix[2][1] = mv[2][1]; normalMatrix[2][2] = mv[2][2];
            
            // 전치하고 역행렬 계산 (간단한 경우를 위해 전치만 사용)
            const transposedNormalMatrix = transpose(normalMatrix);
            this.gl.uniformMatrix3fv(this.uniforms.uNormalMatrix, false, flatten(transposedNormalMatrix));
        }
    }
    
    /**
     * 모든 설정을 기본값으로 초기화
     * @method reset
     */
    reset() {
        this.lightPosition = vec3(5.0, 5.0, 5.0);
        this.lightAmbient = vec3(0.3, 0.3, 0.3);
        this.lightDiffuse = vec3(0.7, 0.7, 0.7);
        this.lightSpecular = vec3(0.8, 0.8, 0.8);
        
        this.materialAmbient = vec3(0.4, 0.4, 0.4);
        this.materialDiffuse = vec3(0.8, 0.8, 0.8);
        this.materialSpecular = vec3(0.5, 0.5, 0.5);
        this.materialShininess = 32.0;
        
        this.updateUniforms();
    }
    
    /**
     * 노멀 벡터 계산 유틸리티
     * @method calculateNormals
     * @param {Array} vertices - 정점 배열
     * @param {Array} indices - 인덱스 배열
     * @returns {Array} 노멀 벡터 배열
     */
    static calculateNormals(vertices, indices) {
        if (!vertices || !indices || vertices.length === 0 || indices.length === 0) {
            console.warn("빈 vertices 또는 indices 배열");
            return [];
        }
        
        const normals = new Array(vertices.length);
        
        // 모든 노멀을 0으로 초기화
        for (let i = 0; i < vertices.length; i++) {
            normals[i] = vec3(0, 0, 0);
        }
        
        // 각 삼각형에 대해 면 법선 계산하고 정점 법선에 누적
        for (let i = 0; i < indices.length; i += 3) {
            if (i + 2 >= indices.length) break;
            
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];
            
            // 인덱스 범위 확인
            if (i0 >= vertices.length || i1 >= vertices.length || i2 >= vertices.length ||
                i0 < 0 || i1 < 0 || i2 < 0) {
                console.warn(`잘못된 인덱스: ${i0}, ${i1}, ${i2}`);
                continue;
            }
            
            try {
                const v0 = vec3(vertices[i0][0], vertices[i0][1], vertices[i0][2]);
                const v1 = vec3(vertices[i1][0], vertices[i1][1], vertices[i1][2]);
                const v2 = vec3(vertices[i2][0], vertices[i2][1], vertices[i2][2]);
                
                const edge1 = subtract(v1, v0);
                const edge2 = subtract(v2, v0);
                const faceNormal = normalize(cross(edge1, edge2));
                
                // NaN 확인
                if (isNaN(faceNormal[0]) || isNaN(faceNormal[1]) || isNaN(faceNormal[2])) {
                    // 기본 노멀 사용
                    const defaultNormal = vec3(0, 1, 0);
                    normals[i0] = add(normals[i0], defaultNormal);
                    normals[i1] = add(normals[i1], defaultNormal);
                    normals[i2] = add(normals[i2], defaultNormal);
                } else {
                    // 정점 법선에 면 법선 누적
                    normals[i0] = add(normals[i0], faceNormal);
                    normals[i1] = add(normals[i1], faceNormal);
                    normals[i2] = add(normals[i2], faceNormal);
                }
            } catch (error) {
                console.warn(`면 법선 계산 오류: ${error}`);
                // 기본 노멀 사용
                const defaultNormal = vec3(0, 1, 0);
                normals[i0] = add(normals[i0], defaultNormal);
                normals[i1] = add(normals[i1], defaultNormal);
                normals[i2] = add(normals[i2], defaultNormal);
            }
        }
        
        // 정점 법선 정규화
        for (let i = 0; i < normals.length; i++) {
            try {
                const length = Math.sqrt(normals[i][0] * normals[i][0] + 
                                       normals[i][1] * normals[i][1] + 
                                       normals[i][2] * normals[i][2]);
                if (length > 0) {
                    normals[i] = normalize(normals[i]);
                } else {
                    // 길이가 0인 경우 기본 노멀 사용
                    normals[i] = vec3(0, 1, 0);
                }
            } catch (error) {
                console.warn(`노멀 정규화 오류: ${error}`);
                normals[i] = vec3(0, 1, 0);
            }
        }
        
        return normals;
    }
} 