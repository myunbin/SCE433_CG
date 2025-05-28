var textureImageData = '';

let texture = null;
let gl, program, modelMatrix, viewMatrix, projectionMatrix;
let humanModel, camera, lighting, poseController, poseStorage, animation;
const BACKGROUND_COLOR = vec4(0.7, 0.7, 0.7, 1.0);

window.onload = function init() {
    const canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(
        BACKGROUND_COLOR[0],
        BACKGROUND_COLOR[1],
        BACKGROUND_COLOR[2],
        BACKGROUND_COLOR[3]
    );
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    if (program < 0) {
        return;
    }
    gl.useProgram(program);

    try {
        camera = new Camera(gl, program, canvas);
        projectionMatrix = window.projectionMatrix;
        lighting = new Lighting(gl, program);
        humanModel = new HumanModel(gl, program);
        poseController = new PoseController(humanModel);
        poseStorage = new PoseStorage(poseController);
        animation = new Animation(
            poseController,
            poseStorage,
            camera,
            lighting
        );
        initTexture();
    } catch (error) {
        return;
    }

    setupEventListeners();

    window.render = render;
    window.updateCameraUI = updateCameraUI;

    poseController.resetAllRotations();
    camera.reset();

    updateCameraUI();

    render();

    requestAnimationFrame(() => {
        render();

        setTimeout(() => {
            render();
        }, 100);
    });
};

function setupEventListeners() {
    setupAccordion();

    const poseButtons = {
        'apply-running-pose': () => poseController?.reapplyRunningPose(),
        'reset-all-pose': () => poseController?.resetAllRotations(),
        'reset-button': resetAll,
    };

    Object.entries(poseButtons).forEach(([id, handler]) => {
        document.getElementById(id)?.addEventListener('click', handler);
    });

    setupAttachmentControls();

    const cameraVectorControls = [
        { id: 'eye-x', vector: 'eye', axis: 0, valueId: 'eye-x-value' },
        { id: 'eye-y', vector: 'eye', axis: 1, valueId: 'eye-y-value' },
        { id: 'eye-z', vector: 'eye', axis: 2, valueId: 'eye-z-value' },
        { id: 'at-x', vector: 'at', axis: 0, valueId: 'at-x-value' },
        { id: 'at-y', vector: 'at', axis: 1, valueId: 'at-y-value' },
        { id: 'at-z', vector: 'at', axis: 2, valueId: 'at-z-value' },
        { id: 'up-x', vector: 'up', axis: 0, valueId: 'up-x-value' },
        { id: 'up-y', vector: 'up', axis: 1, valueId: 'up-y-value' },
        { id: 'up-z', vector: 'up', axis: 2, valueId: 'up-z-value' },
    ];

    cameraVectorControls.forEach(({ id, vector, axis, valueId }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function () {
                const value = parseFloat(this.value);
                camera[vector][axis] = value;

                if (vector === 'eye') {
                    camera.updateSphericalCoordinatesFromEye();
                }

                const precision = vector === 'up' ? 2 : 1;
                document.getElementById(valueId).textContent =
                    value.toFixed(precision);
                requestAnimationFrame(render);
            });

            if (id.startsWith('up-')) {
                element.addEventListener('change', function () {
                    const length = Math.sqrt(
                        camera.up[0] * camera.up[0] +
                            camera.up[1] * camera.up[1] +
                            camera.up[2] * camera.up[2]
                    );
                    if (length > 0.001) {
                        camera.up[0] /= length;
                        camera.up[1] /= length;
                        camera.up[2] /= length;

                        setTimeout(() => {
                            updateCameraUI();
                            requestAnimationFrame(render);
                        }, 100);
                    }
                });
            }
        }
    });

    const zoomElement = document.getElementById('zoom');
    if (zoomElement) {
        zoomElement.addEventListener('input', function () {
            const value = parseFloat(this.value);
            camera.setScale(value);
            document.getElementById('zoom-value').textContent =
                value.toFixed(1) + 'x';
            requestAnimationFrame(render);
        });
    }

    const viewButtons = {
        'view-front': () => camera.setViewFront(),
        'view-back': () => camera.setViewBack(),
        'reset-camera': () => {
            camera.reset();
            updateCameraUI();
            requestAnimationFrame(render);
        },
    };

    Object.entries(viewButtons).forEach(([id, handler]) => {
        document.getElementById(id)?.addEventListener('click', () => {
            handler();
            if (id !== 'reset-camera') {
                requestAnimationFrame(render);
            }
        });
    });

    setupLightingControls();
}

function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach((header) => {
        header.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            const content = document.getElementById(target);
            const section = this.parentElement;
            const arrow = this.querySelector('.accordion-arrow');

            const isActive = content.classList.contains('active');

            if (isActive) {
                content.classList.remove('active');
                this.classList.add('collapsed');
                section.classList.remove('expanded');
                arrow.style.transform = 'rotate(-90deg)';
            } else {
                content.classList.add('active');
                this.classList.remove('collapsed');
                section.classList.add('expanded');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });

    const defaultOpenSections = ['pose-control', 'joint-control'];
    defaultOpenSections.forEach((sectionId) => {
        const content = document.getElementById(sectionId);
        const header = document.querySelector(`[data-target="${sectionId}"]`);
        const section = header?.parentElement;

        if (content && header && section) {
            content.classList.add('active');
            header.classList.remove('collapsed');
            section.classList.add('expanded');
        }
    });
}

function updateCameraUI() {
    const eyeElements = ['eye-x', 'eye-y', 'eye-z'];
    eyeElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.eye[index];

        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(1);
    });

    const atElements = ['at-x', 'at-y', 'at-z'];
    atElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.at[index];

        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(1);
    });

    const upElements = ['up-x', 'up-y', 'up-z'];
    upElements.forEach((id, index) => {
        const element = document.getElementById(id);
        const valueElement = document.getElementById(id + '-value');
        const value = camera.up[index];

        if (element) element.value = value;
        if (valueElement) valueElement.textContent = value.toFixed(2);
    });

    const zoomElement = document.getElementById('zoom');
    const zoomValueElement = document.getElementById('zoom-value');

    if (zoomElement) zoomElement.value = camera.scale;
    if (zoomValueElement)
        zoomValueElement.textContent = camera.scale.toFixed(1) + 'x';
}

function resetAll() {
    camera.reset();

    updateCameraUI();

    const jointSelector = document.getElementById('joint-selector');
    const jointControls = document.getElementById('joint-rotation-controls');
    const jointName = document.getElementById('selected-joint-name');

    if (jointSelector) jointSelector.value = '';
    if (jointControls) jointControls.style.display = 'none';
    if (jointName) jointName.textContent = '관절을 선택하세요';

    poseController?.removeAllAttachments();
    updateAttachmentList();
    updateAttachmentParentList();
    selectAttachment('');

    poseController?.resetAllRotations();
    humanModel?.resetAllTransforms();
    animation?.stopAnimation();

    requestAnimationFrame(render);

    poseController?.showStatusMessage(
        '모든 설정이 초기화되었습니다.',
        'success'
    );
}

function render() {
    try {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        modelMatrix = mat4();

        window.viewMatrix = camera.getViewMatrix();
        window.camera = camera;

        bindTexture();

        if (humanModel && humanModel.rootNode) {
            humanModel.render();
        }
    } catch (error) {}
}

function setupLightingControls() {
    const lightPositionControls = [
        { id: 'light-x', axis: 0, valueId: 'light-x-value' },
        { id: 'light-y', axis: 1, valueId: 'light-y-value' },
        { id: 'light-z', axis: 2, valueId: 'light-z-value' },
    ];

    lightPositionControls.forEach(({ id, axis, valueId }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function () {
                const value = parseFloat(this.value);
                const pos = lighting.position;
                pos[axis] = value;
                lighting.setPosition(pos[0], pos[1], pos[2]);
                document.getElementById(valueId).textContent = value.toFixed(1);
                requestAnimationFrame(render);
            });
        }
    });

    document
        .getElementById('ambient-intensity')
        ?.addEventListener('input', function () {
            lighting.setIntensity('ambient', parseFloat(this.value));
            document.getElementById('ambient-value').textContent = this.value;
            requestAnimationFrame(render);
        });

    document
        .getElementById('diffuse-intensity')
        ?.addEventListener('input', function () {
            lighting.setIntensity('diffuse', parseFloat(this.value));
            document.getElementById('diffuse-value').textContent = this.value;
            requestAnimationFrame(render);
        });

    document
        .getElementById('specular-intensity')
        ?.addEventListener('input', function () {
            lighting.setIntensity('specular', parseFloat(this.value));
            document.getElementById('specular-value').textContent = this.value;
            requestAnimationFrame(render);
        });

    document
        .getElementById('shininess')
        ?.addEventListener('input', function () {
            lighting.setShininess(parseFloat(this.value));
            document.getElementById('shininess-value').textContent = this.value;
            requestAnimationFrame(render);
        });

    document
        .getElementById('reset-lighting')
        ?.addEventListener('click', function () {
            lighting.reset();

            document.getElementById('light-x').value = 0.0;
            document.getElementById('light-y').value = 0.0;
            document.getElementById('light-z').value = -2.0;
            document.getElementById('light-x-value').textContent = '0.0';
            document.getElementById('light-y-value').textContent = '0.0';
            document.getElementById('light-z-value').textContent = '-2.0';

            document.getElementById('ambient-intensity').value = 0.4;
            document.getElementById('diffuse-intensity').value = 0.8;
            document.getElementById('specular-intensity').value = 1.0;
            document.getElementById('shininess').value = 20;

            document.getElementById('ambient-value').textContent = '0.4';
            document.getElementById('diffuse-value').textContent = '0.8';
            document.getElementById('specular-value').textContent = '1.0';
            document.getElementById('shininess-value').textContent = '20';

            requestAnimationFrame(render);
        });
}

function initTexture() {
    if (!textureImageData || textureImageData.trim() === '') {
        console.warn('Texture data is empty. Using default white texture.');
        createDefaultTexture();
        return;
    }

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
    );

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        console.log('Texture loaded successfully');
        requestAnimationFrame(render);
    };

    image.onerror = function () {
        console.error('Failed to load texture image');
        createDefaultTexture();
    };

    image.src = textureImageData;
}

function createDefaultTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const pixels = new Uint8Array([
        255, 255, 255, 255, 200, 200, 200, 255, 200, 200, 200, 255, 255, 255,
        255, 255,
    ]);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        2,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    console.log('Default texture created');
}

function bindTexture() {
    if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const textureLocation = gl.getUniformLocation(program, 'texture');
        if (textureLocation) {
            gl.uniform1i(textureLocation, 0);
        }
    }
}

function setupAttachmentControls() {
    document
        .getElementById('add-ball-attachment')
        ?.addEventListener('click', function () {
            const parentSelector = document.getElementById(
                'attachment-parent-selector'
            );
            const parentNode = parentSelector.value;

            if (!parentNode) {
                alert('부착할 부위를 먼저 선택해주세요.');
                return;
            }

            const attachmentId = poseController.addAttachment(
                parentNode,
                'BALL'
            );
            if (attachmentId) {
                updateAttachmentList();
                updateAttachmentParentList();
            }
        });

    document
        .getElementById('add-stick-attachment')
        ?.addEventListener('click', function () {
            const parentSelector = document.getElementById(
                'attachment-parent-selector'
            );
            const parentNode = parentSelector.value;

            if (!parentNode) {
                alert('부착할 부위를 먼저 선택해주세요.');
                return;
            }

            const attachmentId = poseController.addAttachment(
                parentNode,
                'STICK'
            );
            if (attachmentId) {
                updateAttachmentList();
                updateAttachmentParentList();
            }
        });

    document
        .getElementById('attachment-selector')
        ?.addEventListener('change', function () {
            const attachmentId = this.value;
            selectAttachment(attachmentId);
        });

    document
        .getElementById('remove-attachment')
        ?.addEventListener('click', function () {
            const attachmentSelector = document.getElementById(
                'attachment-selector'
            );
            const attachmentId = attachmentSelector.value;

            if (!attachmentId) {
                alert('Select the attachment to remove.');
                return;
            }

            if (poseController.removeAttachment(attachmentId)) {
                updateAttachmentList();
                updateAttachmentParentList();
                selectAttachment('');
            }
        });

    document
        .getElementById('remove-all-attachments')
        ?.addEventListener('click', function () {
            if (confirm('Are you sure you want to remove all attachments?')) {
                poseController.removeAllAttachments();
                updateAttachmentList();
                updateAttachmentParentList();
                selectAttachment('');
            }
        });

    ['x', 'y', 'z'].forEach((axis) => {
        const slider = document.getElementById(`attachment-position-${axis}`);
        const valueDisplay = document.getElementById(
            `attachment-position-${axis}-value`
        );

        slider?.addEventListener('input', function () {
            const value = parseFloat(this.value);
            valueDisplay.textContent = value.toFixed(2);

            const attachmentSelector = document.getElementById(
                'attachment-selector'
            );
            const attachmentId = attachmentSelector.value;

            if (attachmentId) {
                poseController.setAttachmentPosition(attachmentId, axis, value);
            }
        });
    });

    ['x', 'y', 'z'].forEach((axis) => {
        const slider = document.getElementById(`attachment-rotate-${axis}`);
        const valueDisplay = document.getElementById(
            `attachment-rotate-${axis}-value`
        );

        slider?.addEventListener('input', function () {
            const value = parseInt(this.value);
            valueDisplay.textContent = value + '°';

            const attachmentSelector = document.getElementById(
                'attachment-selector'
            );
            const attachmentId = attachmentSelector.value;

            if (attachmentId) {
                poseController.setAttachmentRotation(attachmentId, axis, value);
            }
        });
    });

    document
        .getElementById('reset-attachment-transform')
        ?.addEventListener('click', function () {
            const attachmentSelector = document.getElementById(
                'attachment-selector'
            );
            const attachmentId = attachmentSelector.value;

            if (!attachmentId) {
                alert('Select the attachment to reset.');
                return;
            }

            ['x', 'y', 'z'].forEach((axis) => {
                const defaultPos = axis === 'y' ? -0.1 : 0.0;
                poseController.setAttachmentPosition(
                    attachmentId,
                    axis,
                    defaultPos
                );

                const posSlider = document.getElementById(
                    `attachment-position-${axis}`
                );
                const posValueDisplay = document.getElementById(
                    `attachment-position-${axis}-value`
                );

                if (posSlider) posSlider.value = defaultPos;
                if (posValueDisplay)
                    posValueDisplay.textContent = defaultPos.toFixed(2);
            });

            ['x', 'y', 'z'].forEach((axis) => {
                poseController.setAttachmentRotation(attachmentId, axis, 0);

                const rotSlider = document.getElementById(
                    `attachment-rotate-${axis}`
                );
                const rotValueDisplay = document.getElementById(
                    `attachment-rotate-${axis}-value`
                );

                if (rotSlider) rotSlider.value = 0;
                if (rotValueDisplay) rotValueDisplay.textContent = '0°';
            });

            poseController.showStatusMessage(
                'Attachment position/rotation has been reset.',
                'success'
            );
        });

    updateAttachmentParentList();
}

function updateAttachmentList() {
    const attachmentSelector = document.getElementById('attachment-selector');
    const removeButton = document.getElementById('remove-attachment');

    if (!attachmentSelector) return;

    attachmentSelector.innerHTML = '';

    const attachments = poseController.getAttachments();

    if (attachments.length === 0) {
        attachmentSelector.innerHTML =
            '<option value="">No attachments</option>';
        removeButton.disabled = true;
    } else {
        attachmentSelector.innerHTML =
            '<option value="">Select an attachment</option>';

        attachments.forEach((attachment) => {
            const option = document.createElement('option');
            option.value = attachment.id;

            const typeName = attachment.type === 'BALL' ? 'Ball' : 'Stick';
            const parentName = poseController.getNodeDisplayName(
                attachment.parentNodeName
            );
            option.textContent = `${typeName} (${parentName})`;

            attachmentSelector.appendChild(option);
        });

        removeButton.disabled = false;
    }
}

function updateAttachmentParentList() {
    const parentSelector = document.getElementById(
        'attachment-parent-selector'
    );

    if (!parentSelector) return;

    const currentValue = parentSelector.value;

    parentSelector.innerHTML =
        '<option value="">Select a part to attach</option>';

    const bodyParts = [
        { value: 'LEFT_HAND', text: 'Left Hand' },
        { value: 'RIGHT_HAND', text: 'Right Hand' },
        { value: 'LEFT_FOOT', text: 'Left Foot' },
        { value: 'RIGHT_FOOT', text: 'Right Foot' },
        { value: 'HEAD', text: 'Head' },
        { value: 'TORSO', text: 'Torso' },
    ];

    bodyParts.forEach((part) => {
        const option = document.createElement('option');
        option.value = part.value;
        option.textContent = part.text;
        parentSelector.appendChild(option);
    });

    const attachments = poseController.getAttachments();
    if (attachments.length > 0) {
        const separatorOption = document.createElement('option');
        separatorOption.disabled = true;
        separatorOption.textContent = '--- Existing Attachments ---';
        parentSelector.appendChild(separatorOption);

        attachments.forEach((attachment) => {
            const option = document.createElement('option');
            option.value = attachment.id;

            const typeName = attachment.type === 'BALL' ? 'Ball' : 'Stick';
            const parentName = poseController.getNodeDisplayName(
                attachment.parentNodeName
            );
            option.textContent = `${typeName} (${parentName} attached)`;

            parentSelector.appendChild(option);
        });
    }

    if (currentValue) {
        const optionExists = Array.from(parentSelector.options).some(
            (option) => option.value === currentValue
        );
        if (optionExists) {
            parentSelector.value = currentValue;
        }
    }
}

function selectAttachment(attachmentId) {
    const positionControlsDiv = document.getElementById(
        'attachment-position-controls'
    );
    const rotationControlsDiv = document.getElementById(
        'attachment-rotation-controls'
    );
    const attachmentNameSpan = document.getElementById(
        'selected-attachment-name'
    );

    if (attachmentId) {
        const attachments = poseController.getAttachments();
        const attachment = attachments.find((a) => a.id === attachmentId);

        if (attachment) {
            positionControlsDiv.style.display = 'block';
            rotationControlsDiv.style.display = 'block';

            const typeName = attachment.type === 'BALL' ? 'Ball' : 'Stick';
            const parentName = poseController.getNodeDisplayName(
                attachment.parentNodeName
            );
            attachmentNameSpan.textContent = `${typeName} (${parentName})`;

            const position = poseController.getAttachmentPosition(attachmentId);
            if (position) {
                ['x', 'y', 'z'].forEach((axis) => {
                    const slider = document.getElementById(
                        `attachment-position-${axis}`
                    );
                    const valueDisplay = document.getElementById(
                        `attachment-position-${axis}-value`
                    );

                    if (slider) slider.value = position[axis];
                    if (valueDisplay)
                        valueDisplay.textContent = position[axis].toFixed(2);
                });
            }

            const rotation = poseController.getAttachmentRotation(attachmentId);
            if (rotation) {
                ['x', 'y', 'z'].forEach((axis) => {
                    const slider = document.getElementById(
                        `attachment-rotate-${axis}`
                    );
                    const valueDisplay = document.getElementById(
                        `attachment-rotate-${axis}-value`
                    );

                    if (slider) slider.value = rotation[axis];
                    if (valueDisplay)
                        valueDisplay.textContent = rotation[axis] + '°';
                });
            }
        }
    } else {
        positionControlsDiv.style.display = 'none';
        rotationControlsDiv.style.display = 'none';
        attachmentNameSpan.textContent = 'Select an attachment';
    }
}
