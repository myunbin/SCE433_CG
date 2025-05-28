const BODY_COLOR = vec4(1.0, 1.0, 1.0, 1.0);
const LIMB_COLOR = vec4(0.12, 0.25, 0.69, 1.0);
const ATTACHMENT_BALL_COLOR = vec4(0.8, 0.2, 0.2, 1.0);
const ATTACHMENT_STICK_COLOR = vec4(0.6, 0.4, 0.2, 1.0);
const BODY_PARTS = {
    HEAD: { width: 0.2, height: 0.18, depth: 0.18 },
    TORSO: { width: 0.25, height: 0.4, depth: 0.15 },
    UPPER_ARM: { topRadius: 0.055, bottomRadius: 0.045, height: 0.16 },
    LOWER_ARM: { topRadius: 0.045, bottomRadius: 0.035, height: 0.15 },
    HAND: { radius: 0.05, height: 0.09 },
    UPPER_LEG: { topRadius: 0.065, bottomRadius: 0.05, height: 0.28 },
    LOWER_LEG: { topRadius: 0.06, bottomRadius: 0.05, height: 0.24 },
    FOOT: { width: 0.16, height: 0.05, depth: 0.14 },
};
const ATTACHMENT_PARTS = {
    BALL: { radius: 0.06 },
    STICK: { radius: 0.015, length: 0.25 },
};
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
    RIGHT_FOOT: 13,
};
class Node {
    constructor(
        name,
        geometryCreator = null,
        color = LIMB_COLOR,
        localTranslation = vec3(0, 0, 0),
        localRotation = vec3(0, 0, 0),
        localScale = vec3(1, 1, 1)
    ) {
        this.name = name;
        this.geometryCreator = geometryCreator;
        this.color = color;
        this.localTranslation = localTranslation;
        this.localRotation = localRotation;
        this.localScale = localScale;
        this.children = [];
        this.parent = null;
        this.dynamicTranslation = vec3(0, 0, 0);
        this.dynamicRotation = vec3(0, 0, 0);
        this.dynamicScale = vec3(1, 1, 1);
    }
    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }
    getTransformMatrix() {
        let transform = mat4();
        const totalTranslation = add(
            this.localTranslation,
            this.dynamicTranslation
        );
        if (totalTranslation.some((v) => v !== 0))
            transform = mult(transform, translate(...totalTranslation));
        const totalRotation = add(this.localRotation, this.dynamicRotation);
        if (totalRotation[2])
            transform = mult(transform, rotateZ(totalRotation[2]));
        if (totalRotation[1])
            transform = mult(transform, rotateY(totalRotation[1]));
        if (totalRotation[0])
            transform = mult(transform, rotateX(totalRotation[0]));
        const totalScale = vec3(
            this.localScale[0] * this.dynamicScale[0],
            this.localScale[1] * this.dynamicScale[1],
            this.localScale[2] * this.dynamicScale[2]
        );
        if (totalScale.some((v) => v !== 1))
            transform = mult(transform, scale(...totalScale));
        return transform;
    }
    setDynamicTransform(
        translation = vec3(0, 0, 0),
        rotation = vec3(0, 0, 0),
        scale = vec3(1, 1, 1)
    ) {
        this.dynamicTranslation = translation;
        this.dynamicRotation = rotation;
        this.dynamicScale = scale;
    }
}
class HumanModel {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.positionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.rootNode = null;
        this.nodeMap = new Map();
        this.attachments = new Map();
        this.attachmentCounter = 0;
        this.buildHierarchy();
    }
    buildHierarchy() {
        this.rootNode = new Node(
            'TORSO',
            () =>
                this.createVest(
                    BODY_PARTS.TORSO.width,
                    BODY_PARTS.TORSO.height,
                    BODY_PARTS.TORSO.depth
                ),
            BODY_COLOR,
            vec3(0, 0, 0),
            vec3(0, 0, 0)
        );
        this.nodeMap.set('TORSO', this.rootNode);
        const headNode = new Node(
            'HEAD',
            () =>
                this.createEllipsoid(
                    BODY_PARTS.HEAD.width / 2,
                    BODY_PARTS.HEAD.height / 2,
                    BODY_PARTS.HEAD.depth / 2
                ),
            LIMB_COLOR,
            vec3(0, BODY_PARTS.TORSO.height / 2 + BODY_PARTS.HEAD.height / 2, 0)
        );
        this.rootNode.addChild(headNode);
        this.nodeMap.set('HEAD', headNode);
        this.buildArmHierarchy(
            'LEFT',
            -BODY_PARTS.TORSO.width / 2,
            BODY_PARTS.TORSO.height / 3
        );
        this.buildArmHierarchy(
            'RIGHT',
            BODY_PARTS.TORSO.width / 2,
            BODY_PARTS.TORSO.height / 3
        );
        this.buildLegHierarchy(
            'LEFT',
            -BODY_PARTS.TORSO.width / 4,
            -BODY_PARTS.TORSO.height / 2
        );
        this.buildLegHierarchy(
            'RIGHT',
            BODY_PARTS.TORSO.width / 4,
            -BODY_PARTS.TORSO.height / 2
        );
    }
    buildArmHierarchy(side, shoulderX, shoulderY) {
        const upperArmNode = new Node(
            `${side}_UPPER_ARM`,
            () =>
                this.createCapsule(
                    BODY_PARTS.UPPER_ARM.topRadius,
                    BODY_PARTS.UPPER_ARM.bottomRadius,
                    BODY_PARTS.UPPER_ARM.height,
                    16,
                    -BODY_PARTS.UPPER_ARM.height / 2
                ),
            LIMB_COLOR,
            vec3(shoulderX, shoulderY, 0)
        );
        this.rootNode.addChild(upperArmNode);
        this.nodeMap.set(`${side}_UPPER_ARM`, upperArmNode);
        const elbowJointNode = new Node(
            `${side}_ELBOW_JOINT`,
            () =>
                this.createSmoothJoint(
                    BODY_PARTS.UPPER_ARM.bottomRadius,
                    BODY_PARTS.LOWER_ARM.topRadius,
                    0.08
                ),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.UPPER_ARM.height, 0)
        );
        upperArmNode.addChild(elbowJointNode);
        const lowerArmNode = new Node(
            `${side}_LOWER_ARM`,
            () =>
                this.createCapsule(
                    BODY_PARTS.LOWER_ARM.topRadius,
                    BODY_PARTS.LOWER_ARM.bottomRadius,
                    BODY_PARTS.LOWER_ARM.height,
                    16,
                    -BODY_PARTS.LOWER_ARM.height / 2
                ),
            LIMB_COLOR,
            vec3(0, 0, 0)
        );
        elbowJointNode.addChild(lowerArmNode);
        this.nodeMap.set(`${side}_LOWER_ARM`, lowerArmNode);
        const wristJointNode = new Node(
            `${side}_WRIST_JOINT`,
            () =>
                this.createSmoothJoint(
                    BODY_PARTS.LOWER_ARM.bottomRadius,
                    BODY_PARTS.HAND.radius * 0.8,
                    0.05
                ),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.LOWER_ARM.height, 0)
        );
        lowerArmNode.addChild(wristJointNode);
        const handRadius = BODY_PARTS.HAND.radius * 0.7;
        const handNode = new Node(
            `${side}_HAND`,
            () => this.createEllipsoid(handRadius, handRadius, handRadius),
            LIMB_COLOR,
            vec3(0, -handRadius, 0)
        );
        wristJointNode.addChild(handNode);
        this.nodeMap.set(`${side}_HAND`, handNode);
    }
    buildLegHierarchy(side, hipX, hipY) {
        const upperLegNode = new Node(
            `${side}_UPPER_LEG`,
            () =>
                this.createCapsule(
                    BODY_PARTS.UPPER_LEG.topRadius,
                    BODY_PARTS.UPPER_LEG.bottomRadius,
                    BODY_PARTS.UPPER_LEG.height,
                    16,
                    -BODY_PARTS.UPPER_LEG.height / 2
                ),
            LIMB_COLOR,
            vec3(hipX, hipY, 0)
        );
        this.rootNode.addChild(upperLegNode);
        this.nodeMap.set(`${side}_UPPER_LEG`, upperLegNode);
        const kneeJointNode = new Node(
            `${side}_KNEE_JOINT`,
            () =>
                this.createSmoothJoint(
                    BODY_PARTS.UPPER_LEG.bottomRadius,
                    BODY_PARTS.LOWER_LEG.topRadius,
                    0.08
                ),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.UPPER_LEG.height, 0)
        );
        upperLegNode.addChild(kneeJointNode);
        const lowerLegNode = new Node(
            `${side}_LOWER_LEG`,
            () =>
                this.createCapsule(
                    BODY_PARTS.LOWER_LEG.topRadius,
                    BODY_PARTS.LOWER_LEG.bottomRadius,
                    BODY_PARTS.LOWER_LEG.height,
                    16,
                    -BODY_PARTS.LOWER_LEG.height / 2,
                    true
                ),
            LIMB_COLOR,
            vec3(0, 0, 0)
        );
        kneeJointNode.addChild(lowerLegNode);
        this.nodeMap.set(`${side}_LOWER_LEG`, lowerLegNode);
        const ankleJointNode = new Node(
            `${side}_ANKLE_JOINT`,
            () =>
                this.createSmoothJoint(
                    BODY_PARTS.LOWER_LEG.bottomRadius,
                    BODY_PARTS.FOOT.height / 2,
                    0.05
                ),
            LIMB_COLOR,
            vec3(0, -BODY_PARTS.LOWER_LEG.height, 0)
        );
        lowerLegNode.addChild(ankleJointNode);
        const footNode = new Node(
            `${side}_FOOT`,
            () =>
                this.createFoot(
                    BODY_PARTS.FOOT.width,
                    BODY_PARTS.FOOT.height,
                    BODY_PARTS.FOOT.depth,
                    -BODY_PARTS.FOOT.height / 2
                ),
            LIMB_COLOR,
            vec3(0, 0, 0)
        );
        ankleJointNode.addChild(footNode);
        this.nodeMap.set(`${side}_FOOT`, footNode);
    }
    renderDFS(node, parentTransform = mat4()) {
        if (!node) {
            return;
        }
        const currentTransform = mult(
            parentTransform,
            node.getTransformMatrix()
        );
        if (node.geometryCreator) {
            const savedModel = modelMatrix;
            modelMatrix = currentTransform;
            const geometry = node.geometryCreator();
            this.drawGeometry(geometry, node.color);
            modelMatrix = savedModel;
        }
        for (const child of node.children) {
            this.renderDFS(child, currentTransform);
        }
    }
    setNodeTransform(
        nodeName,
        translation = vec3(0, 0, 0),
        rotation = vec3(0, 0, 0),
        scale = vec3(1, 1, 1)
    ) {
        const node = this.nodeMap.get(nodeName);
        if (node) {
            node.setDynamicTransform(translation, rotation, scale);
        }
    }
    resetAllTransforms() {
        for (const [name, node] of this.nodeMap) {
            node.setDynamicTransform(
                vec3(0, 0, 0),
                vec3(0, 0, 0),
                vec3(1, 1, 1)
            );
        }
    }
    render() {
        this.renderDFS(this.rootNode, modelMatrix);
    }
    addAttachment(
        parentNodeName,
        attachmentType,
        localPosition = vec3(0, -0.1, 0),
        localRotation = vec3(0, 0, 0)
    ) {
        const parentNode = this.nodeMap.get(parentNodeName);
        if (!parentNode) {
            console.warn(`Parent node '${parentNodeName}' not found`);
            return null;
        }
        const attachmentId = `ATTACHMENT_${attachmentType}_${this.attachmentCounter++}`;
        let attachmentNode;
        if (attachmentType === 'BALL') {
            attachmentNode = new Node(
                attachmentId,
                () => this.createSphere(ATTACHMENT_PARTS.BALL.radius),
                ATTACHMENT_BALL_COLOR,
                localPosition,
                localRotation
            );
        } else if (attachmentType === 'STICK') {
            attachmentNode = new Node(
                attachmentId,
                () =>
                    this.createCylinder(
                        ATTACHMENT_PARTS.STICK.radius,
                        ATTACHMENT_PARTS.STICK.radius,
                        ATTACHMENT_PARTS.STICK.length
                    ),
                ATTACHMENT_STICK_COLOR,
                localPosition,
                localRotation
            );
        } else {
            console.warn(`Unknown attachment type: ${attachmentType}`);
            return null;
        }
        parentNode.addChild(attachmentNode);
        this.nodeMap.set(attachmentId, attachmentNode);
        this.attachments.set(attachmentId, {
            type: attachmentType,
            parentNodeName: parentNodeName,
            node: attachmentNode,
            isAttachment: true,
        });
        return attachmentId;
    }
    removeAttachment(attachmentId) {
        const attachmentInfo = this.attachments.get(attachmentId);
        if (!attachmentInfo) {
            console.warn(`Attachment '${attachmentId}' not found`);
            return false;
        }
        const childAttachments = this.getAttachmentsForNode(attachmentId);
        childAttachments.forEach((child) => {
            this.removeAttachment(child.id);
        });
        const parentNode = this.nodeMap.get(attachmentInfo.parentNodeName);
        if (parentNode) {
            parentNode.removeChild(attachmentInfo.node);
        }
        this.nodeMap.delete(attachmentId);
        this.attachments.delete(attachmentId);
        return true;
    }
    removeAllAttachments() {
        const attachmentIds = Array.from(this.attachments.keys());
        attachmentIds.forEach((id) => this.removeAttachment(id));
    }
    setAttachmentTransform(
        attachmentId,
        translation = vec3(0, 0, 0),
        rotation = vec3(0, 0, 0),
        scale = vec3(1, 1, 1)
    ) {
        const attachmentInfo = this.attachments.get(attachmentId);
        if (!attachmentInfo) {
            console.warn(`Attachment '${attachmentId}' not found`);
            return false;
        }
        attachmentInfo.node.setDynamicTransform(translation, rotation, scale);
        return true;
    }
    setAttachmentPosition(attachmentId, position) {
        const attachmentInfo = this.attachments.get(attachmentId);
        if (!attachmentInfo) {
            console.warn(`Attachment '${attachmentId}' not found`);
            return false;
        }
        const node = attachmentInfo.node;
        node.setDynamicTransform(
            position,
            node.dynamicRotation,
            node.dynamicScale
        );
        return true;
    }
    setAttachmentRotation(attachmentId, rotation) {
        const attachmentInfo = this.attachments.get(attachmentId);
        if (!attachmentInfo) {
            console.warn(`Attachment '${attachmentId}' not found`);
            return false;
        }
        const node = attachmentInfo.node;
        node.setDynamicTransform(
            node.dynamicTranslation,
            rotation,
            node.dynamicScale
        );
        return true;
    }
    getAttachments() {
        const attachmentList = [];
        for (const [id, info] of this.attachments) {
            attachmentList.push({
                id: id,
                type: info.type,
                parentNodeName: info.parentNodeName,
                isAttachment: info.isAttachment || false,
            });
        }
        return attachmentList;
    }
    getAttachmentsForNode(nodeName) {
        const attachmentList = [];
        for (const [id, info] of this.attachments) {
            if (info.parentNodeName === nodeName) {
                attachmentList.push({
                    id: id,
                    type: info.type,
                    parentNodeName: info.parentNodeName,
                    isAttachment: info.isAttachment || false,
                });
            }
        }
        return attachmentList;
    }
    getAllNodes() {
        const nodeList = [];
        const bodyParts = [
            'LEFT_HAND',
            'RIGHT_HAND',
            'LEFT_FOOT',
            'RIGHT_FOOT',
            'HEAD',
            'TORSO',
            'LEFT_UPPER_ARM',
            'RIGHT_UPPER_ARM',
            'LEFT_LOWER_ARM',
            'RIGHT_LOWER_ARM',
            'LEFT_UPPER_LEG',
            'RIGHT_UPPER_LEG',
            'LEFT_LOWER_LEG',
            'RIGHT_LOWER_LEG',
        ];
        bodyParts.forEach((nodeName) => {
            if (this.nodeMap.has(nodeName)) {
                nodeList.push({
                    id: nodeName,
                    name: nodeName,
                    isAttachment: false,
                });
            }
        });
        for (const [id, info] of this.attachments) {
            nodeList.push({
                id: id,
                name: `${info.type === 'BALL' ? '공' : '막대기'} (${info.parentNodeName})`,
                isAttachment: true,
                type: info.type,
                parentNodeName: info.parentNodeName,
            });
        }
        return nodeList;
    }
    createSphere(radius, segments = 16) {
        return this.createEllipsoid(radius, radius, radius, segments);
    }
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
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j;
                const second = first + segments + 1;
                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
            }
        }
        return { vertices, indices };
    }
    createCylinder(topRadius, bottomRadius, height, segments = 12) {
        const vertices = [];
        const indices = [];
        vertices.push(vec4(0, height / 2, 0, 1.0));
        vertices.push(vec4(0, -height / 2, 0, 1.0));
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            vertices.push(
                vec4(topRadius * cos, height / 2, topRadius * sin, 1.0)
            );
            vertices.push(
                vec4(bottomRadius * cos, -height / 2, bottomRadius * sin, 1.0)
            );
        }
        for (let i = 0; i < segments; i++) {
            const topCurrent = 2 + i * 2;
            const topNext = 2 + ((i + 1) % segments) * 2;
            const bottomCurrent = topCurrent + 1;
            const bottomNext = topNext + 1;
            indices.push(topCurrent, topNext, bottomCurrent);
            indices.push(bottomCurrent, topNext, bottomNext);
        }
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2;
            const next = 2 + ((i + 1) % segments) * 2;
            indices.push(0, next, current);
        }
        for (let i = 0; i < segments; i++) {
            const current = 2 + i * 2 + 1;
            const next = 2 + ((i + 1) % segments) * 2 + 1;
            indices.push(1, current, next);
        }
        return { vertices, indices };
    }
    createVest(width, height, depth) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        const topWidth = w * 0.7;
        const neckWidth = w * 0.3;
        const vertices = [
            vec4(-neckWidth, h, d, 1.0),
            vec4(neckWidth, h, d, 1.0),
            vec4(-topWidth, h * 0.7, d, 1.0),
            vec4(topWidth, h * 0.7, d, 1.0),
            vec4(-w, -h, d, 1.0),
            vec4(w, -h, d, 1.0),
            vec4(-neckWidth, h, -d, 1.0),
            vec4(neckWidth, h, -d, 1.0),
            vec4(-topWidth, h * 0.7, -d, 1.0),
            vec4(topWidth, h * 0.7, -d, 1.0),
            vec4(-w, -h, -d, 1.0),
            vec4(w, -h, -d, 1.0),
        ];
        const texCoords = [
            vec2(0.25, 0.0),
            vec2(0.75, 0.0),
            vec2(0.0, 0.3),
            vec2(1.0, 0.3),
            vec2(0.0, 1.0),
            vec2(1.0, 1.0),
            vec2(0.25, 0.0),
            vec2(0.75, 0.0),
            vec2(0.0, 0.3),
            vec2(1.0, 0.3),
            vec2(0.0, 1.0),
            vec2(1.0, 1.0),
        ];
        const indices = [
            0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 6, 7, 8, 7, 9, 8, 8, 9, 10, 9,
            11, 10, 0, 6, 2, 2, 6, 8, 2, 8, 4, 4, 8, 10, 1, 3, 7, 3, 9, 7, 3, 5,
            9, 5, 11, 9, 0, 1, 6, 1, 7, 6, 4, 10, 5, 5, 10, 11,
        ];
        return { vertices, indices, texCoords };
    }
    createFoot(width, height, depth, yOffset = 0) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        const vertices = [
            vec4(-w * 0.4, -h + yOffset, -d * 0.7, 1.0),
            vec4(w * 0.4, -h + yOffset, -d * 0.7, 1.0),
            vec4(-w * 0.4, h * 0.6 + yOffset, -d * 0.7, 1.0),
            vec4(w * 0.4, h * 0.6 + yOffset, -d * 0.7, 1.0),
            vec4(-w * 0.4, -h * 0.5 + yOffset, d, 1.0),
            vec4(w * 0.4, -h * 0.5 + yOffset, d, 1.0),
            vec4(-w * 0.4, h + yOffset, d * 0.8, 1.0),
            vec4(w * 0.4, h + yOffset, d * 0.8, 1.0),
        ];
        const indices = [
            0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 4, 6, 2, 1, 3, 5, 3, 7,
            5, 4, 5, 6, 5, 7, 6, 0, 2, 1, 2, 3, 1,
        ];
        return { vertices, indices };
    }
    drawGeometry(geometry, color) {
        const { vertices, indices, texCoords } = geometry;
        const positions = [];
        const colors = [];
        const normals = [];
        const textureCoords = [];
        for (let i = 0; i < indices.length; i += 3) {
            const v0 = vertices[indices[i]];
            const v1 = vertices[indices[i + 1]];
            const v2 = vertices[indices[i + 2]];
            const edge1 = vec3(v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]);
            const edge2 = vec3(v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]);
            const normal = normalize(cross(edge1, edge2));
            for (let j = 0; j < 3; j++) {
                const vertexIndex = indices[i + j];
                positions.push(vertices[vertexIndex]);
                colors.push(color);
                normals.push(normal);
                if (texCoords && texCoords[vertexIndex]) {
                    textureCoords.push(texCoords[vertexIndex]);
                } else {
                    textureCoords.push(vec2(0.0, 0.0));
                }
            }
        }
        const uModelMatrix = this.gl.getUniformLocation(
            this.program,
            'uModelMatrix'
        );
        if (uModelMatrix) {
            this.gl.uniformMatrix4fv(uModelMatrix, false, flatten(modelMatrix));
        }
        const uViewMatrix = this.gl.getUniformLocation(
            this.program,
            'uViewMatrix'
        );
        if (uViewMatrix && window.viewMatrix) {
            this.gl.uniformMatrix4fv(
                uViewMatrix,
                false,
                flatten(window.viewMatrix)
            );
        }
        const uProjectionMatrix = this.gl.getUniformLocation(
            this.program,
            'uProjectionMatrix'
        );
        if (uProjectionMatrix && window.projectionMatrix) {
            this.gl.uniformMatrix4fv(
                uProjectionMatrix,
                false,
                flatten(window.projectionMatrix)
            );
        }
        const normalMatrix = mat3();
        const modelMatrix3x3 = mat3();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                modelMatrix3x3[i][j] = modelMatrix[i][j];
            }
        }
        const det =
            modelMatrix3x3[0][0] *
                (modelMatrix3x3[1][1] * modelMatrix3x3[2][2] -
                    modelMatrix3x3[1][2] * modelMatrix3x3[2][1]) -
            modelMatrix3x3[0][1] *
                (modelMatrix3x3[1][0] * modelMatrix3x3[2][2] -
                    modelMatrix3x3[1][2] * modelMatrix3x3[2][0]) +
            modelMatrix3x3[0][2] *
                (modelMatrix3x3[1][0] * modelMatrix3x3[2][1] -
                    modelMatrix3x3[1][1] * modelMatrix3x3[2][0]);
        if (Math.abs(det) > 0.00001) {
            const invDet = 1.0 / det;
            const inv = mat3();
            inv[0][0] =
                invDet *
                (modelMatrix3x3[1][1] * modelMatrix3x3[2][2] -
                    modelMatrix3x3[1][2] * modelMatrix3x3[2][1]);
            inv[0][1] =
                invDet *
                (modelMatrix3x3[0][2] * modelMatrix3x3[2][1] -
                    modelMatrix3x3[0][1] * modelMatrix3x3[2][2]);
            inv[0][2] =
                invDet *
                (modelMatrix3x3[0][1] * modelMatrix3x3[1][2] -
                    modelMatrix3x3[0][2] * modelMatrix3x3[1][1]);
            inv[1][0] =
                invDet *
                (modelMatrix3x3[1][2] * modelMatrix3x3[2][0] -
                    modelMatrix3x3[1][0] * modelMatrix3x3[2][2]);
            inv[1][1] =
                invDet *
                (modelMatrix3x3[0][0] * modelMatrix3x3[2][2] -
                    modelMatrix3x3[0][2] * modelMatrix3x3[2][0]);
            inv[1][2] =
                invDet *
                (modelMatrix3x3[0][2] * modelMatrix3x3[1][0] -
                    modelMatrix3x3[0][0] * modelMatrix3x3[1][2]);
            inv[2][0] =
                invDet *
                (modelMatrix3x3[1][0] * modelMatrix3x3[2][1] -
                    modelMatrix3x3[1][1] * modelMatrix3x3[2][0]);
            inv[2][1] =
                invDet *
                (modelMatrix3x3[0][1] * modelMatrix3x3[2][0] -
                    modelMatrix3x3[0][0] * modelMatrix3x3[2][1]);
            inv[2][2] =
                invDet *
                (modelMatrix3x3[0][0] * modelMatrix3x3[1][1] -
                    modelMatrix3x3[0][1] * modelMatrix3x3[1][0]);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    normalMatrix[i][j] = inv[j][i];
                }
            }
        }
        const uNormalMatrix = this.gl.getUniformLocation(
            this.program,
            'uNormalMatrix'
        );
        if (uNormalMatrix) {
            this.gl.uniformMatrix3fv(
                uNormalMatrix,
                false,
                flatten(normalMatrix)
            );
        }
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            flatten(positions),
            this.gl.STATIC_DRAW
        );
        const vPosition = this.gl.getAttribLocation(this.program, 'vPosition');
        if (vPosition >= 0) {
            this.gl.vertexAttribPointer(
                vPosition,
                4,
                this.gl.FLOAT,
                false,
                0,
                0
            );
            this.gl.enableVertexAttribArray(vPosition);
        }
        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            flatten(colors),
            this.gl.STATIC_DRAW
        );
        const vColor = this.gl.getAttribLocation(this.program, 'vColor');
        if (vColor >= 0) {
            this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vColor);
        }
        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            flatten(normals),
            this.gl.STATIC_DRAW
        );
        const vNormal = this.gl.getAttribLocation(this.program, 'vNormal');
        if (vNormal >= 0) {
            this.gl.vertexAttribPointer(vNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vNormal);
        }
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            flatten(textureCoords),
            this.gl.STATIC_DRAW
        );
        const vTexCoord = this.gl.getAttribLocation(this.program, 'vTexCoord');
        if (vTexCoord >= 0) {
            this.gl.vertexAttribPointer(
                vTexCoord,
                2,
                this.gl.FLOAT,
                false,
                0,
                0
            );
            this.gl.enableVertexAttribArray(vTexCoord);
        }
        this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length);
        this.gl.deleteBuffer(positionBuffer);
        this.gl.deleteBuffer(colorBuffer);
        this.gl.deleteBuffer(normalBuffer);
        this.gl.deleteBuffer(texCoordBuffer);
    }
    createCapsule(topRadius, bottomRadius, height, segments = 16, yOffset = 0) {
        const vertices = [];
        const indices = [];
        for (let i = 0; i <= segments / 2; i++) {
            const theta = (i * Math.PI) / 2 / (segments / 2);
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = topRadius * sinTheta * cosPhi;
                const y = height / 2 + topRadius * cosTheta + yOffset;
                const z = topRadius * sinTheta * sinPhi;
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        const cylinderSteps = 8;
        for (let i = 0; i <= cylinderSteps; i++) {
            const t = i / cylinderSteps;
            const y = height / 2 - t * height + yOffset;
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
        const bottomHemisphereStartIndex = vertices.length;
        for (let i = 0; i <= segments / 2; i++) {
            const theta = (i * Math.PI) / 2 / (segments / 2);
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = bottomRadius * sinTheta * cosPhi;
                const y = -height / 2 - bottomRadius * cosTheta + yOffset;
                const z = bottomRadius * sinTheta * sinPhi;
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        const topHemisphereRings = segments / 2 + 1;
        const cylinderRings = cylinderSteps + 1;
        const bottomHemisphereRings = segments / 2 + 1;
        const totalRings =
            topHemisphereRings + cylinderRings + bottomHemisphereRings;
        const normalSectionRings = topHemisphereRings + cylinderRings - 1;
        for (let i = 0; i < normalSectionRings; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + segments + 1;
                indices.push(current, current + 1, next);
                indices.push(next, current + 1, next + 1);
            }
        }
        const bottomStartRing = topHemisphereRings + cylinderRings - 1;
        for (let i = 0; i < segments / 2; i++) {
            for (let j = 0; j < segments; j++) {
                const current = (bottomStartRing + i) * (segments + 1) + j;
                const next = current + segments + 1;
                indices.push(current, next, current + 1);
                indices.push(next, next + 1, current + 1);
            }
        }
        return { vertices, indices };
    }
    createSmoothJoint(radius1, radius2, blendLength, segments = 16) {
        const vertices = [];
        const indices = [];
        vertices.push(vec4(0, blendLength / 2, 0, 1.0));
        const steps = 12;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const smoothT = t * t * t * (t * (t * 6 - 15) + 10);
            const radius = radius1 + smoothT * (radius2 - radius1);
            const y = -blendLength / 2 + t * blendLength;
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = radius * cosPhi;
                const z = radius * sinPhi;
                vertices.push(vec4(x, y, z, 1.0));
            }
        }
        const bottomCenterIndex = vertices.length;
        vertices.push(vec4(0, -blendLength / 2, 0, 1.0));
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < segments; j++) {
                const current = 1 + i * (segments + 1) + j;
                const next = current + segments + 1;
                indices.push(current, next, current + 1);
                indices.push(next, next + 1, current + 1);
            }
        }
        for (let j = 0; j < segments; j++) {
            const current = 1 + j;
            const next = 1 + ((j + 1) % segments);
            indices.push(0, current, next);
        }
        const lastRingStart = 1 + steps * (segments + 1);
        for (let j = 0; j < segments; j++) {
            const current = lastRingStart + j;
            const next = lastRingStart + ((j + 1) % segments);
            indices.push(bottomCenterIndex, next, current);
        }
        return { vertices, indices };
    }
}
