class Lighting {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.position = vec4(0.0, 0.0, -2.0, 1.0);
        this.type = 'point';
        this.intensity = {
            ambient: 0.4,
            diffuse: 0.8,
            specular: 1.0,
        };
        this.material = {
            ambient: vec4(1.0, 1.0, 1.0, 1.0),
            diffuse: vec4(1.0, 1.0, 1.0, 1.0),
            specular: vec4(0.3, 0.3, 0.3, 1.0),
            shininess: 20.0,
        };
        this.attenuation = {
            constant: 1.0,
            linear: 0.01,
            quadratic: 0.001,
        };
        this.uniformLocations = this.getUniformLocations();
        this.update();
    }
    getUniformLocations() {
        return {
            lightPosition: this.gl.getUniformLocation(
                this.program,
                'uLightPosition'
            ),
            ambientProduct: this.gl.getUniformLocation(
                this.program,
                'uAmbientProduct'
            ),
            diffuseProduct: this.gl.getUniformLocation(
                this.program,
                'uDiffuseProduct'
            ),
            specularProduct: this.gl.getUniformLocation(
                this.program,
                'uSpecularProduct'
            ),
            shininess: this.gl.getUniformLocation(this.program, 'uShininess'),
            attenuationA: this.gl.getUniformLocation(
                this.program,
                'uAttenuationA'
            ),
            attenuationB: this.gl.getUniformLocation(
                this.program,
                'uAttenuationB'
            ),
            attenuationC: this.gl.getUniformLocation(
                this.program,
                'uAttenuationC'
            ),
        };
    }
    update() {
        const lightAmbient = scale(this.intensity.ambient, vec4(1, 1, 1, 1));
        const lightDiffuse = scale(this.intensity.diffuse, vec4(1, 1, 1, 1));
        const lightSpecular = scale(this.intensity.specular, vec4(1, 1, 1, 1));
        const ambientProduct = mult(lightAmbient, this.material.ambient);
        const diffuseProduct = mult(lightDiffuse, this.material.diffuse);
        const specularProduct = mult(lightSpecular, this.material.specular);
        if (this.uniformLocations.lightPosition) {
            this.gl.uniform4fv(
                this.uniformLocations.lightPosition,
                flatten(this.position)
            );
        }
        if (this.uniformLocations.ambientProduct) {
            this.gl.uniform4fv(
                this.uniformLocations.ambientProduct,
                flatten(ambientProduct)
            );
        }
        if (this.uniformLocations.diffuseProduct) {
            this.gl.uniform4fv(
                this.uniformLocations.diffuseProduct,
                flatten(diffuseProduct)
            );
        }
        if (this.uniformLocations.specularProduct) {
            this.gl.uniform4fv(
                this.uniformLocations.specularProduct,
                flatten(specularProduct)
            );
        }
        if (this.uniformLocations.shininess) {
            this.gl.uniform1f(
                this.uniformLocations.shininess,
                this.material.shininess
            );
        }
        if (this.uniformLocations.attenuationA) {
            this.gl.uniform1f(
                this.uniformLocations.attenuationA,
                this.attenuation.constant
            );
        }
        if (this.uniformLocations.attenuationB) {
            this.gl.uniform1f(
                this.uniformLocations.attenuationB,
                this.attenuation.linear
            );
        }
        if (this.uniformLocations.attenuationC) {
            this.gl.uniform1f(
                this.uniformLocations.attenuationC,
                this.attenuation.quadratic
            );
        }
    }
    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.update();
    }
    setType(type) {
        this.type = 'point';
        this.position[3] = 1.0;
        this.update();
    }
    setIntensity(component, value) {
        if (this.intensity.hasOwnProperty(component)) {
            this.intensity[component] = value;
            this.update();
        }
    }
    setShininess(value) {
        this.material.shininess = value;
        this.update();
    }
    setAttenuation(constant, linear, quadratic) {
        this.attenuation.constant = constant;
        this.attenuation.linear = linear;
        this.attenuation.quadratic = quadratic;
        this.update();
    }
    reset() {
        this.position = vec4(0.0, 0.0, -2.0, 1.0);
        this.type = 'point';
        this.intensity = {
            ambient: 0.4,
            diffuse: 0.8,
            specular: 1.0,
        };
        this.material.shininess = 20.0;
        this.update();
    }
    getState() {
        return {
            position: [...this.position],
            type: this.type,
            intensity: { ...this.intensity },
            shininess: this.material.shininess,
            attenuation: { ...this.attenuation },
        };
    }
    setState(state) {
        if (state.position) this.position = vec4(...state.position);
        if (state.type) this.setType(state.type);
        if (state.intensity) this.intensity = { ...state.intensity };
        if (state.shininess) this.material.shininess = state.shininess;
        if (state.attenuation) this.attenuation = { ...state.attenuation };
        this.update();
    }
}
