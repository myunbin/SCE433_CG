class Camera {
    constructor(gl, program, canvas) {
        this.gl = gl;
        this.program = program;
        this.canvas = canvas;
        this.rotationX = 0;
        this.rotationY = 0;
        this.scale = 1.0;
        this.position = vec3(0, 0, -3);
        this.eye = vec3(0, 0, -3);
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.distance = 3.0;
        this.radius = 3.0;
        this.theta = Math.PI;
        this.phi = Math.PI / 2;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragMode = 'rotate';
        this.setupProjection();
        this.setupDragEvents();
    }
    setupProjection() {
        const aspect = this.canvas.width / this.canvas.height;
        window.projectionMatrix = perspective(45, aspect, 0.1, 10.0);
        const uProjectionMatrix = this.gl.getUniformLocation(
            this.program,
            'uProjectionMatrix'
        );
        this.gl.uniformMatrix4fv(
            uProjectionMatrix,
            false,
            flatten(window.projectionMatrix)
        );
    }
    setupDragEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.canvas.style.cursor = 'move';
            const rect = this.canvas.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left;
            this.lastMouseY = e.clientY - rect.top;
            e.preventDefault();
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const deltaX = x - this.lastMouseX;
            const deltaY = y - this.lastMouseY;
            if (e.ctrlKey) {
                const rotationAngle = deltaX * 0.01;
                const forward = vec3(
                    this.at[0] - this.eye[0],
                    this.at[1] - this.eye[1],
                    this.at[2] - this.eye[2]
                );
                const fLength = Math.sqrt(
                    forward[0] * forward[0] +
                        forward[1] * forward[1] +
                        forward[2] * forward[2]
                );
                forward[0] /= fLength;
                forward[1] /= fLength;
                forward[2] /= fLength;
                const cos_angle = Math.cos(rotationAngle);
                const sin_angle = Math.sin(rotationAngle);
                const dot =
                    forward[0] * this.up[0] +
                    forward[1] * this.up[1] +
                    forward[2] * this.up[2];
                const cross = vec3(
                    forward[1] * this.up[2] - forward[2] * this.up[1],
                    forward[2] * this.up[0] - forward[0] * this.up[2],
                    forward[0] * this.up[1] - forward[1] * this.up[0]
                );
                const newUp = vec3(
                    this.up[0] * cos_angle +
                        cross[0] * sin_angle +
                        forward[0] * dot * (1 - cos_angle),
                    this.up[1] * cos_angle +
                        cross[1] * sin_angle +
                        forward[1] * dot * (1 - cos_angle),
                    this.up[2] * cos_angle +
                        cross[2] * sin_angle +
                        forward[2] * dot * (1 - cos_angle)
                );
                const upLength = Math.sqrt(
                    newUp[0] * newUp[0] +
                        newUp[1] * newUp[1] +
                        newUp[2] * newUp[2]
                );
                this.up[0] = newUp[0] / upLength;
                this.up[1] = newUp[1] / upLength;
                this.up[2] = newUp[2] / upLength;
                this.canvas.style.cursor = 'crosshair';
            } else {
                const sensitivity = 0.01;
                this.theta -= deltaX * sensitivity;
                this.phi -= deltaY * sensitivity;
                this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
                this.updateCameraPosition();
                this.canvas.style.cursor = 'move';
            }
            this.lastMouseX = x;
            this.lastMouseY = y;
            this.updateUI();
            this.triggerRender();
            e.preventDefault();
        });
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        this.canvas.addEventListener('wheel', (e) => {
            const scaleDelta = e.deltaY * -0.001;
            this.scale = Math.max(0.1, Math.min(3.0, this.scale + scaleDelta));
            this.radius = 3.0 / this.scale;
            this.distance = this.radius;
            this.updateCameraPosition();
            this.updateScaleUI();
            this.triggerRender();
            e.preventDefault();
        });
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case '1':
                    this.setViewFront();
                    break;
                case '2':
                    this.setViewBack();
                    break;
            }
        });
    }
    updateCameraPosition() {
        const x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.radius * Math.cos(this.phi);
        const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.eye = vec3(this.at[0] + x, this.at[1] + y, this.at[2] + z);
        this.rotationX = (this.phi - Math.PI / 2) * (180 / Math.PI);
        this.rotationY = this.theta * (180 / Math.PI);
    }
    updateSphericalCoordinatesFromEye() {
        const dx = this.eye[0] - this.at[0];
        const dy = this.eye[1] - this.at[1];
        const dz = this.eye[2] - this.at[2];
        this.radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.distance = this.radius;
        this.scale = 3.0 / this.radius;
        this.phi = Math.acos(dy / this.radius);
        this.theta = Math.atan2(dx, dz);
        this.rotationX = (this.phi - Math.PI / 2) * (180 / Math.PI);
        this.rotationY = this.theta * (180 / Math.PI);
    }
    setEye(eye) {
        this.eye = vec3(eye[0], eye[1], eye[2]);
        this.updateSphericalCoordinatesFromEye();
        this.updateUI();
        this.triggerRender();
    }
    setAt(at) {
        this.at = vec3(at[0], at[1], at[2]);
        this.updateSphericalCoordinatesFromEye();
        this.updateUI();
        this.triggerRender();
    }
    setUp(up) {
        const length = Math.sqrt(up[0] * up[0] + up[1] * up[1] + up[2] * up[2]);
        if (length > 0.001) {
            this.up = vec3(up[0] / length, up[1] / length, up[2] / length);
        } else {
            this.up = vec3(0, 1, 0);
        }
        this.updateUI();
        this.triggerRender();
    }
    triggerRender() {
        if (window.render) {
            window.render();
        }
    }
    updateUI() {
        if (window.updateCameraUI) {
            window.updateCameraUI();
        }
    }
    updateScaleUI() {
        const zoomSlider = document.getElementById('zoom');
        const zoomValue = document.getElementById('zoom-value');
        if (zoomSlider) zoomSlider.value = this.scale;
        if (zoomValue) zoomValue.textContent = this.scale.toFixed(1) + 'x';
    }
    getViewMatrix() {
        return lookAt(this.eye, this.at, this.up);
    }
    setRotationX(angle) {
        this.rotationX = angle;
    }
    setRotationY(angle) {
        this.rotationY = angle;
    }
    setScale(scale) {
        this.scale = Math.max(0.1, Math.min(3.0, scale));
        this.radius = 3.0 / this.scale;
        this.distance = this.radius;
        this.updateCameraPosition();
    }
    reset() {
        this.eye = vec3(0, 0, -3);
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.scale = 1.0;
        this.distance = 3.0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.radius = 3.0;
        this.theta = Math.PI;
        this.phi = Math.PI / 2;
        this.updateCameraPosition();
    }
    setViewFront() {
        this.eye = vec3(0, 0, -3);
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = Math.PI;
        this.phi = Math.PI / 2;
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    setViewBack() {
        this.eye = vec3(0, 0, 3);
        this.at = vec3(0, 0, 0);
        this.up = vec3(0, 1, 0);
        this.theta = 0;
        this.phi = Math.PI / 2;
        this.updateCameraPosition();
        this.updateUI();
        this.triggerRender();
    }
    getCameraState() {
        return {
            eye: [...this.eye],
            at: [...this.at],
            up: [...this.up],
            scale: this.scale,
            theta: this.theta,
            phi: this.phi,
            radius: this.radius,
        };
    }
    setCameraState(state) {
        this.eye = vec3(...state.eye);
        this.at = vec3(...state.at);
        this.up = vec3(...state.up);
        this.scale = state.scale;
        this.theta = state.theta;
        this.phi = state.phi;
        this.radius = state.radius;
        this.distance = this.radius;
        this.updateUI();
        this.updateScaleUI();
        this.triggerRender();
    }
    getDefaultState() {
        return {
            eye: [0, 0, -3],
            at: [0, 0, 0],
            up: [0, 1, 0],
            scale: 1.0,
            theta: Math.PI,
            phi: Math.PI / 2,
            radius: 3.0,
        };
    }
    interpolateState(state1, state2, t) {
        const easedT = this.easeInOutCubic(t);
        return {
            eye: [
                this.lerp(state1.eye[0], state2.eye[0], easedT),
                this.lerp(state1.eye[1], state2.eye[1], easedT),
                this.lerp(state1.eye[2], state2.eye[2], easedT),
            ],
            at: [
                this.lerp(state1.at[0], state2.at[0], easedT),
                this.lerp(state1.at[1], state2.at[1], easedT),
                this.lerp(state1.at[2], state2.at[2], easedT),
            ],
            up: [
                this.lerp(state1.up[0], state2.up[0], easedT),
                this.lerp(state1.up[1], state2.up[1], easedT),
                this.lerp(state1.up[2], state2.up[2], easedT),
            ],
            scale: this.lerp(state1.scale, state2.scale, easedT),
            theta: this.lerpAngle(state1.theta, state2.theta, easedT),
            phi: this.lerp(state1.phi, state2.phi, easedT),
            radius: this.lerp(state1.radius, state2.radius, easedT),
        };
    }
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    lerpAngle(a, b, t) {
        const normalizeAngle = (angle) => {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
        };
        const diff = normalizeAngle(b - a);
        return a + diff * t;
    }
}
