const JOINT_CONFIG = {
    TORSO: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Torso/Waist',
    },
    HEAD: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'Pitch (Nodding)',
            Y: 'Yaw (Turning)',
            Z: 'Roll (Tilting)',
        },
        displayName: 'Head/Neck',
    },
    LEFT_UPPER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Shoulder',
    },
    RIGHT_UPPER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Shoulder',
    },
    LEFT_LOWER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Elbow',
    },
    RIGHT_LOWER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Elbow',
    },
    LEFT_HAND: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Wrist',
    },
    RIGHT_HAND: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Wrist',
    },
    LEFT_UPPER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Hip',
    },
    RIGHT_UPPER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Hip',
    },
    LEFT_LOWER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Knee',
    },
    RIGHT_LOWER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Knee',
    },
    LEFT_FOOT: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Left Ankle',
    },
    RIGHT_FOOT: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: {
            X: 'X-axis Rotation',
            Y: 'Y-axis Rotation',
            Z: 'Z-axis Rotation',
        },
        displayName: 'Right Ankle',
    },
};
const JOINT_HIERARCHY = {
    ROOT: ['TORSO'],
    TORSO: [
        'HEAD',
        'LEFT_UPPER_ARM',
        'RIGHT_UPPER_ARM',
        'LEFT_UPPER_LEG',
        'RIGHT_UPPER_LEG',
    ],
    HEAD: [],
    LEFT_UPPER_ARM: ['LEFT_LOWER_ARM'],
    LEFT_LOWER_ARM: ['LEFT_HAND'],
    LEFT_HAND: [],
    RIGHT_UPPER_ARM: ['RIGHT_LOWER_ARM'],
    RIGHT_LOWER_ARM: ['RIGHT_HAND'],
    RIGHT_HAND: [],
    LEFT_UPPER_LEG: ['LEFT_LOWER_LEG'],
    LEFT_LOWER_LEG: ['LEFT_FOOT'],
    LEFT_FOOT: [],
    RIGHT_UPPER_LEG: ['RIGHT_LOWER_LEG'],
    RIGHT_LOWER_LEG: ['RIGHT_FOOT'],
    RIGHT_FOOT: [],
};
const RUNNING_POSE = {
    TORSO: { x: 0, y: 0, z: 0 },
    HEAD: { x: 0, y: 0, z: 0 },
    LEFT_UPPER_ARM: { x: -76, y: 0, z: 0 },
    RIGHT_UPPER_ARM: { x: 66, y: 0, z: 0 },
    LEFT_LOWER_ARM: { x: 56, y: 0, z: 0 },
    RIGHT_LOWER_ARM: { x: 83, y: 0, z: 0 },
    LEFT_HAND: { x: -1, y: 11, z: 0 },
    RIGHT_HAND: { x: 34, y: 8, z: 0 },
    LEFT_UPPER_LEG: { x: 91, y: 0, z: 0 },
    RIGHT_UPPER_LEG: { x: 0, y: 0, z: 0 },
    LEFT_LOWER_LEG: { x: -151, y: 0, z: 0 },
    RIGHT_LOWER_LEG: { x: 0, y: 0, z: 0 },
    LEFT_FOOT: { x: 0, y: 0, z: 0 },
    RIGHT_FOOT: { x: 0, y: 0, z: 0 },
};
class PoseController {
    constructor(humanModel) {
        this.humanModel = humanModel;
        this.selectedJoint = '';
        this.jointRotations = {};
        this.selectedAttachment = '';
        this.attachmentRotations = new Map();
        this.attachmentPositions = new Map();
        this.initializeJointRotations();
        this.applyHierarchicalRotations();
        this.setupEventListeners();
    }
    initializeJointRotations() {
        Object.keys(JOINT_CONFIG).forEach((jointName) => {
            this.jointRotations[jointName] = {
                x: 0,
                y: 0,
                z: 0,
            };
        });
    }
    applyRunningPose() {
        Object.keys(RUNNING_POSE).forEach((jointName) => {
            if (this.jointRotations[jointName]) {
                this.jointRotations[jointName] = { ...RUNNING_POSE[jointName] };
            }
        });
        this.applyHierarchicalRotations();
    }
    setupEventListeners() {
        const selector = document.getElementById('joint-selector');
        selector.addEventListener('change', (e) => {
            this.selectJoint(e.target.value);
        });
        ['x', 'y', 'z'].forEach((axis) => {
            const slider = document.getElementById(`joint-rotate-${axis}`);
            const valueDisplay = document.getElementById(
                `joint-rotate-${axis}-value`
            );
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                valueDisplay.textContent = value + '°';
                this.setJointRotation(this.selectedJoint, axis, value);
            });
        });
        document
            .getElementById('reset-joint-rotation')
            .addEventListener('click', () => {
                this.resetJointRotation(this.selectedJoint);
            });
    }
    selectJoint(jointName) {
        this.selectedJoint = jointName;
        const controlsDiv = document.getElementById('joint-rotation-controls');
        const jointNameSpan = document.getElementById('selected-joint-name');
        if (jointName && JOINT_CONFIG[jointName]) {
            const jointInfo = JOINT_CONFIG[jointName];
            controlsDiv.style.display = 'block';
            jointNameSpan.textContent = jointInfo.displayName;
            ['x', 'y', 'z'].forEach((axis) => {
                const axisContainer = document.getElementById(
                    `joint-axis-${axis}`
                );
                const axisLabel = document.getElementById(
                    `joint-axis-${axis}-label`
                );
                const slider = document.getElementById(`joint-rotate-${axis}`);
                if (jointInfo.axes.includes(axis.toUpperCase())) {
                    axisContainer.style.display = 'block';
                    axisLabel.textContent = jointInfo.names[axis.toUpperCase()];
                    const range = jointInfo.ranges[axis.toUpperCase()];
                    slider.min = range[0];
                    slider.max = range[1];
                    const defaultValue =
                        range[0] <= 0 && range[1] >= 0
                            ? 0
                            : Math.floor((range[0] + range[1]) / 2);
                    slider.value =
                        this.jointRotations[jointName][axis] || defaultValue;
                } else {
                    axisContainer.style.display = 'none';
                }
            });
            this.updateSliders();
            this.updatePoseButtons();
        } else {
            controlsDiv.style.display = 'none';
            jointNameSpan.textContent = 'Select a joint';
        }
    }
    setJointRotation(jointName, axis, angle) {
        if (!jointName || !this.jointRotations[jointName]) return;
        const jointInfo = JOINT_CONFIG[jointName];
        if (!jointInfo || !jointInfo.axes.includes(axis.toUpperCase())) return;
        const range = jointInfo.ranges[axis.toUpperCase()];
        angle = Math.max(range[0], Math.min(range[1], angle));
        this.jointRotations[jointName][axis] = angle;
        this.applyHierarchicalRotations();
        if (window.render) {
            window.render();
        }
    }
    applyHierarchicalRotations() {
        Object.keys(this.jointRotations).forEach((jointName) => {
            const rotation = this.jointRotations[jointName];
            if (this.humanModel.setNodeTransform) {
                this.humanModel.setNodeTransform(
                    jointName,
                    vec3(0, 0, 0),
                    vec3(rotation.x, rotation.y, rotation.z),
                    vec3(1, 1, 1)
                );
            }
        });
    }
    applyJointHierarchy(parentJoint, parentTransform) {
        const children = JOINT_HIERARCHY[parentJoint];
        if (!children) return;
        children.forEach((childJoint) => {
            this.applyJointHierarchy(childJoint, parentTransform);
        });
    }
    resetJointRotation(jointName) {
        if (!jointName || !this.jointRotations[jointName]) return;
        this.jointRotations[jointName] = { x: 0, y: 0, z: 0 };
        this.updateSliders();
        this.applyHierarchicalRotations();
        if (window.render) {
            window.render();
        }
        this.showStatusMessage(
            `${JOINT_CONFIG[jointName]?.displayName || jointName} joint has been reset.`,
            'success'
        );
    }
    updateSliders() {
        if (!this.selectedJoint || !this.jointRotations[this.selectedJoint])
            return;
        const rotation = this.jointRotations[this.selectedJoint];
        ['x', 'y', 'z'].forEach((axis) => {
            const slider = document.getElementById(`joint-rotate-${axis}`);
            const valueDisplay = document.getElementById(
                `joint-rotate-${axis}-value`
            );
            if (slider.parentElement.style.display !== 'none') {
                slider.value = rotation[axis];
                valueDisplay.textContent = rotation[axis] + '°';
            }
        });
    }
    getCurrentPose() {
        const pose = {};
        Object.keys(this.jointRotations).forEach((jointName) => {
            pose[jointName] = { ...this.jointRotations[jointName] };
        });
        return pose;
    }
    setPose(poseData) {
        if (!poseData) return;
        Object.keys(poseData).forEach((jointName) => {
            if (this.jointRotations[jointName]) {
                this.jointRotations[jointName] = { ...poseData[jointName] };
            }
        });
        this.updateSliders();
        this.applyHierarchicalRotations();
        if (window.render) {
            window.render();
        }
    }
    resetAllRotations() {
        this.initializeJointRotations();
        this.updateSliders();
        this.applyHierarchicalRotations();
        if (window.render) {
            window.render();
        }
        this.showStatusMessage(
            'All joint rotations have been reset.',
            'success'
        );
    }
    reapplyRunningPose() {
        this.applyRunningPose();
        this.updateSliders();
        this.showStatusMessage('Running pose has been applied.', 'success');
        if (window.render) {
            window.render();
        }
    }
    updatePoseButtons() {
        const addToAnimationBtn = document.getElementById('add-to-animation');
        if (this.selectedJoint) {
            addToAnimationBtn.disabled = false;
        }
    }
    showStatusMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type}`;
        messageDiv.textContent = message;
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.appendChild(messageDiv);
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
    addAttachment(
        parentNodeName,
        attachmentType,
        localPosition = vec3(0, -0.1, 0),
        localRotation = vec3(0, 0, 0)
    ) {
        const attachmentId = this.humanModel.addAttachment(
            parentNodeName,
            attachmentType,
            localPosition,
            localRotation
        );
        if (attachmentId) {
            this.attachmentRotations.set(attachmentId, {
                x: localRotation[0],
                y: localRotation[1],
                z: localRotation[2],
            });
            this.attachmentPositions.set(attachmentId, {
                x: localPosition[0],
                y: localPosition[1],
                z: localPosition[2],
            });
            this.showStatusMessage(
                `${attachmentType === 'BALL' ? 'Ball' : 'Stick'} has been added to ${this.getNodeDisplayName(parentNodeName)}.`,
                'success'
            );
            if (window.render) {
                window.render();
            }
        }
        return attachmentId;
    }
    removeAttachment(attachmentId) {
        const success = this.humanModel.removeAttachment(attachmentId);
        if (success) {
            this.attachmentRotations.delete(attachmentId);
            this.attachmentPositions.delete(attachmentId);
            if (this.selectedAttachment === attachmentId) {
                this.selectedAttachment = '';
            }
            this.showStatusMessage('Attachment has been removed.', 'success');
            if (window.render) {
                window.render();
            }
        }
        return success;
    }
    removeAllAttachments() {
        this.humanModel.removeAllAttachments();
        this.attachmentRotations.clear();
        this.attachmentPositions.clear();
        this.selectedAttachment = '';
        this.showStatusMessage('All attachments have been removed.', 'success');
        if (window.render) {
            window.render();
        }
    }
    setAttachmentRotation(attachmentId, axis, angle) {
        if (!this.attachmentRotations.has(attachmentId)) return;
        const rotation = this.attachmentRotations.get(attachmentId);
        rotation[axis] = angle;
        this.humanModel.setAttachmentRotation(
            attachmentId,
            vec3(rotation.x, rotation.y, rotation.z)
        );
        if (window.render) {
            window.render();
        }
    }
    setAttachmentPosition(attachmentId, axis, value) {
        if (!this.attachmentPositions.has(attachmentId)) return;
        const position = this.attachmentPositions.get(attachmentId);
        position[axis] = value;
        this.humanModel.setAttachmentPosition(
            attachmentId,
            vec3(position.x, position.y, position.z)
        );
        if (window.render) {
            window.render();
        }
    }
    getAttachmentPosition(attachmentId) {
        return (
            this.attachmentPositions.get(attachmentId) || { x: 0, y: 0, z: 0 }
        );
    }
    getAttachmentRotation(attachmentId) {
        return (
            this.attachmentRotations.get(attachmentId) || { x: 0, y: 0, z: 0 }
        );
    }
    getAttachments() {
        return this.humanModel.getAttachments();
    }
    getAttachmentsForNode(nodeName) {
        return this.humanModel.getAttachmentsForNode(nodeName);
    }
    getNodeDisplayName(nodeName) {
        if (this.attachmentRotations.has(nodeName)) {
            const attachments = this.getAttachments();
            const attachment = attachments.find((a) => a.id === nodeName);
            if (attachment) {
                const typeName = attachment.type === 'BALL' ? 'Ball' : 'Stick';
                const parentDisplayName = this.getNodeDisplayName(
                    attachment.parentNodeName
                );
                return `${typeName} (${parentDisplayName})`;
            }
        }
        const displayNames = {
            LEFT_HAND: 'Left Hand',
            RIGHT_HAND: 'Right Hand',
            LEFT_FOOT: 'Left Foot',
            RIGHT_FOOT: 'Right Foot',
            HEAD: 'Head',
            TORSO: 'Torso',
            LEFT_UPPER_ARM: 'Left Shoulder',
            RIGHT_UPPER_ARM: 'Right Shoulder',
            LEFT_LOWER_ARM: 'Left Elbow',
            RIGHT_LOWER_ARM: 'Right Elbow',
            LEFT_UPPER_LEG: 'Left Hip',
            RIGHT_UPPER_LEG: 'Right Hip',
            LEFT_LOWER_LEG: 'Left Knee',
            RIGHT_LOWER_LEG: 'Right Knee',
        };
        return displayNames[nodeName] || nodeName;
    }
}
