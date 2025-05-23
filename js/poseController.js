/**
 * @fileoverview 관절 기반 포즈 컨트롤러 모듈 - 계층적 관절 회전 관리
 * @description 인체 모델의 관절별 회전값을 해부학적 자유도에 따라 관리하고 UI와 연동하는 모듈
 * @author SCE433 Computer Graphics Team
 * @version 2.0.0 - 계층적 관절 모델
 */

/**
 * 인체 관절별 설정 및 회전 범위 정의
 * @constant {Object} JOINT_CONFIG - 각 관절의 회전 설정과 표시명
 * @description 모든 관절에 완전한 3DOF 자유도 제공 (창의적 포즈 제작을 위해)
 */
const JOINT_CONFIG = {
    // 머리/목 관절: 3DOF (완전 자유)
    HEAD: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'Pitch (끄덕이기)', Y: 'Yaw (좌우돌리기)', Z: 'Roll (기울이기)' },
        displayName: '머리/목'
    },
    
    // 왼쪽 어깨 관절: 3DOF (완전 자유)
    LEFT_UPPER_ARM: {
        axes: ['X', 'Y', 'Z'], 
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 어깨'
    },
    
    // 오른쪽 어깨 관절: 3DOF (완전 자유)
    RIGHT_UPPER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 어깨'
    },
    
    // 왼쪽 팔꿈치 관절: 3DOF (완전 자유)
    LEFT_LOWER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 팔꿈치'
    },
    
    // 오른쪽 팔꿈치 관절: 3DOF (완전 자유)
    RIGHT_LOWER_ARM: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 팔꿈치'
    },
    
    // 왼쪽 손목 관절: 3DOF (완전 자유)
    LEFT_HAND: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 손목'
    },
    
    // 오른쪽 손목 관절: 3DOF (완전 자유)
    RIGHT_HAND: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 손목'
    },
    
    // 왼쪽 엉덩이 관절: 3DOF (완전 자유)
    LEFT_UPPER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 엉덩이'
    },
    
    // 오른쪽 엉덩이 관절: 3DOF (완전 자유)
    RIGHT_UPPER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 엉덩이'
    },
    
    // 왼쪽 무릎 관절: 3DOF (완전 자유)
    LEFT_LOWER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 무릎'
    },
    
    // 오른쪽 무릎 관절: 3DOF (완전 자유)
    RIGHT_LOWER_LEG: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 무릎'
    },
    
    // 왼쪽 발목 관절: 3DOF (완전 자유)
    LEFT_FOOT: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '왼쪽 발목'
    },
    
    // 오른쪽 발목 관절: 3DOF (완전 자유)
    RIGHT_FOOT: {
        axes: ['X', 'Y', 'Z'],
        ranges: { X: [-180, 180], Y: [-180, 180], Z: [-180, 180] },
        names: { X: 'X-axis Rotation', Y: 'Y-axis Rotation', Z: 'Z-axis Rotation' },
        displayName: '오른쪽 발목'
    }
};

/**
 * 계층적 관절 구조 정의 (부모-자식 관계)
 * @constant {Object} JOINT_HIERARCHY - 각 관절의 부모-자식 관계
 */
const JOINT_HIERARCHY = {
    ROOT: ['TORSO'],
    TORSO: ['HEAD', 'LEFT_UPPER_ARM', 'RIGHT_UPPER_ARM', 'LEFT_UPPER_LEG', 'RIGHT_UPPER_LEG'],
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
    RIGHT_FOOT: []
};

/**
 * 미리 정의된 달리기 포즈
 * @constant {Object} RUNNING_POSE - 역동적인 달리기 자세
 * @description 픽토그램과 동일한 실제 달리기 포즈 (사용자 조정 완료)
 */
const RUNNING_POSE = {
    HEAD: { x: 0, y: 0, z: 0 },                       // 머리 기본 위치
    LEFT_UPPER_ARM: { x: -76, y: 0, z: 0 },           // 왼팔 뒤로
    RIGHT_UPPER_ARM: { x: 66, y: 0, z: 0 },           // 오른팔 앞으로
    LEFT_LOWER_ARM: { x: 56, y: 0, z: 0 },            // 왼팔꿈치 굽혀서 앞으로
    RIGHT_LOWER_ARM: { x: 83, y: 0, z: 0 },           // 오른팔꿈치 굽혀서 뒤로
    LEFT_HAND: { x: -1, y: 11, z: 0 },                // 왼손 위치 조정
    RIGHT_HAND: { x: 34, y: 8, z: 0 },                // 오른손 위치 조정
    LEFT_UPPER_LEG: { x: 91, y: 0, z: 0 },            // 왼다리 높이 올림
    RIGHT_UPPER_LEG: { x: 0, y: 0, z: 0 },            // 오른다리 기본 위치
    LEFT_LOWER_LEG: { x: -151, y: 0, z: 0 },          // 왼종아리 완전히 접어올림
    RIGHT_LOWER_LEG: { x: 0, y: 0, z: 0 },            // 오른종아리 기본 위치
    LEFT_FOOT: { x: 0, y: 0, z: 0 },                  // 왼발 기본 위치
    RIGHT_FOOT: { x: 0, y: 0, z: 0 }                  // 오른발 기본 위치
};

/**
 * 관절 중심의 계층적 포즈 제어를 담당하는 클래스
 * @class PoseController
 * @description 해부학적 자유도에 따른 관절별 회전값 관리 및 계층적 적용
 */
class PoseController {
    /**
     * PoseController 생성자
     * @param {HumanModel} humanModel - 인체 모델 인스턴스
     */
    constructor(humanModel) {
        this.humanModel = humanModel;
        this.selectedJoint = '';
        this.jointRotations = {};
        
        // 기본 회전값 초기화
        this.initializeJointRotations();
        
        // 달리기 포즈 적용
        this.applyRunningPose();
        
        // UI 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    /**
     * 각 관절별 기본 회전값 초기화
     * @method initializeJointRotations
     */
    initializeJointRotations() {
        Object.keys(JOINT_CONFIG).forEach(jointName => {
            this.jointRotations[jointName] = {
                x: 0,
                y: 0,
                z: 0
            };
        });
    }
    
    /**
     * 미리 정의된 달리기 포즈 적용
     * @method applyRunningPose
     */
    applyRunningPose() {
        // 달리기 포즈 데이터를 현재 관절 회전값에 적용
        Object.keys(RUNNING_POSE).forEach(jointName => {
            if (this.jointRotations[jointName]) {
                this.jointRotations[jointName] = { ...RUNNING_POSE[jointName] };
            }
        });
        
        // 계층적으로 모델에 적용
        this.applyHierarchicalRotations();
        
        console.log('달리기 포즈가 적용되었습니다.');
    }
    
    /**
     * UI 이벤트 리스너 설정
     * @method setupEventListeners
     */
    setupEventListeners() {
        // 관절 선택 드롭다운
        const selector = document.getElementById('joint-selector');
        selector.addEventListener('change', (e) => {
            this.selectJoint(e.target.value);
        });
        
        // 관절별 회전 슬라이더들
        ['x', 'y', 'z'].forEach(axis => {
            const slider = document.getElementById(`joint-rotate-${axis}`);
            const valueDisplay = document.getElementById(`joint-rotate-${axis}-value`);
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                valueDisplay.textContent = value + '°';
                this.setJointRotation(this.selectedJoint, axis, value);
            });
        });
        
        // 관절 회전 초기화 버튼
        document.getElementById('reset-joint-rotation').addEventListener('click', () => {
            this.resetJointRotation(this.selectedJoint);
        });
    }
    
    /**
     * 특정 관절 선택 및 UI 업데이트
     * @method selectJoint
     * @param {string} jointName - 선택할 관절 이름
     */
    selectJoint(jointName) {
        this.selectedJoint = jointName;
        
        const controlsDiv = document.getElementById('joint-rotation-controls');
        const jointNameSpan = document.getElementById('selected-joint-name');
        
        if (jointName && JOINT_CONFIG[jointName]) {
            const jointInfo = JOINT_CONFIG[jointName];
            
            // 컨트롤 표시
            controlsDiv.style.display = 'block';
            jointNameSpan.textContent = jointInfo.displayName;
            
            // 사용 가능한 축만 표시
            ['x', 'y', 'z'].forEach(axis => {
                const axisContainer = document.getElementById(`joint-axis-${axis}`);
                const axisLabel = document.getElementById(`joint-axis-${axis}-label`);
                const slider = document.getElementById(`joint-rotate-${axis}`);
                
                if (jointInfo.axes.includes(axis.toUpperCase())) {
                    // 축 표시 및 설정
                    axisContainer.style.display = 'block';
                    axisLabel.textContent = jointInfo.names[axis.toUpperCase()];
                    
                    // 해부학적 범위로 슬라이더 제한
                    const range = jointInfo.ranges[axis.toUpperCase()];
                    slider.min = range[0];
                    slider.max = range[1];
                    
                    // 중간값으로 초기화 (0도 또는 범위 중간)
                    const defaultValue = range[0] <= 0 && range[1] >= 0 ? 0 : Math.floor((range[0] + range[1]) / 2);
                    slider.value = this.jointRotations[jointName][axis] || defaultValue;
                } else {
                    // 축 숨기기
                    axisContainer.style.display = 'none';
                }
            });
            
            // 현재 회전값으로 슬라이더 업데이트
            this.updateSliders();
            
            // 포즈 저장 버튼 활성화
            this.updatePoseButtons();
        } else {
            // 컨트롤 숨기기
            controlsDiv.style.display = 'none';
            jointNameSpan.textContent = '관절을 선택하세요';
        }
    }
    
    /**
     * 특정 관절의 회전값 설정 (계층적 적용)
     * @method setJointRotation
     * @param {string} jointName - 관절 이름
     * @param {string} axis - 회전축 ('x', 'y', 'z')
     * @param {number} angle - 회전 각도 (도 단위)
     */
    setJointRotation(jointName, axis, angle) {
        if (!jointName || !this.jointRotations[jointName]) return;
        
        // 해부학적 범위 검증
        const jointInfo = JOINT_CONFIG[jointName];
        if (!jointInfo || !jointInfo.axes.includes(axis.toUpperCase())) return;
        
        const range = jointInfo.ranges[axis.toUpperCase()];
        angle = Math.max(range[0], Math.min(range[1], angle));
        
        this.jointRotations[jointName][axis] = angle;
        
        // 계층적으로 모델에 회전값 적용
        this.applyHierarchicalRotations();
        
        // 렌더링 업데이트
        if (window.render) {
            window.render();
        }
    }
    
    /**
     * 계층적으로 모든 관절 회전값을 모델에 적용
     * @method applyHierarchicalRotations
     */
    applyHierarchicalRotations() {
        // 각 관절의 회전값을 직접 모델에 적용
        Object.keys(this.jointRotations).forEach(jointName => {
            const rotation = this.jointRotations[jointName];
            
            // 모델의 nodeTransforms에 회전값 적용
            if (this.humanModel.nodeTransforms[jointName]) {
                this.humanModel.nodeTransforms[jointName].rotation = vec3(
                    rotation.x, rotation.y, rotation.z
                );
            }
        });
    }
    
    /**
     * 재귀적으로 관절 계층구조를 순회하며 변환 적용 (향후 확장용)
     * @method applyJointHierarchy
     * @param {string} parentJoint - 부모 관절
     * @param {mat4} parentTransform - 부모로부터의 누적 변환
     */
    applyJointHierarchy(parentJoint, parentTransform) {
        // 향후 더 복잡한 계층적 변환이 필요할 때 사용
        const children = JOINT_HIERARCHY[parentJoint];
        if (!children) return;
        
        children.forEach(childJoint => {
            // 자식 관절들로 재귀 호출
            this.applyJointHierarchy(childJoint, parentTransform);
        });
    }
    
    /**
     * 특정 관절의 회전 초기화
     * @method resetJointRotation
     * @param {string} jointName - 초기화할 관절 이름
     */
    resetJointRotation(jointName) {
        if (!jointName || !this.jointRotations[jointName]) return;
        
        this.jointRotations[jointName] = { x: 0, y: 0, z: 0 };
        
        // 슬라이더 업데이트
        this.updateSliders();
        
        // 모델에 적용
        this.applyHierarchicalRotations();
        
        // 렌더링 업데이트
        if (window.render) {
            window.render();
        }
        
        this.showStatusMessage(`${JOINT_CONFIG[jointName]?.displayName || jointName} 관절이 초기화되었습니다.`, 'success');
    }
    
    /**
     * 현재 선택된 관절의 회전값으로 슬라이더 업데이트
     * @method updateSliders
     */
    updateSliders() {
        if (!this.selectedJoint || !this.jointRotations[this.selectedJoint]) return;
        
        const rotation = this.jointRotations[this.selectedJoint];
        
        ['x', 'y', 'z'].forEach(axis => {
            const slider = document.getElementById(`joint-rotate-${axis}`);
            const valueDisplay = document.getElementById(`joint-rotate-${axis}-value`);
            
            if (slider.parentElement.style.display !== 'none') {
                slider.value = rotation[axis];
                valueDisplay.textContent = rotation[axis] + '°';
            }
        });
    }
    
    /**
     * 현재 포즈의 모든 관절 회전값 반환
     * @method getCurrentPose
     * @returns {Object} 모든 관절의 회전값
     */
    getCurrentPose() {
        const pose = {};
        Object.keys(this.jointRotations).forEach(jointName => {
            pose[jointName] = { ...this.jointRotations[jointName] };
        });
        return pose;
    }
    
    /**
     * 포즈 데이터로부터 관절 회전값 설정
     * @method setPose
     * @param {Object} poseData - 포즈 데이터
     */
    setPose(poseData) {
        if (!poseData) return;
        
        Object.keys(poseData).forEach(jointName => {
            if (this.jointRotations[jointName]) {
                this.jointRotations[jointName] = { ...poseData[jointName] };
            }
        });
        
        // 현재 선택된 관절이 있다면 슬라이더 업데이트
        this.updateSliders();
        
        // 계층적으로 모델에 적용
        this.applyHierarchicalRotations();
        
        // 렌더링 업데이트
        if (window.render) {
            window.render();
        }
    }
    
    /**
     * 모든 관절 회전 초기화
     * @method resetAllRotations
     */
    resetAllRotations() {
        this.initializeJointRotations();
        this.updateSliders();
        this.applyHierarchicalRotations();
        
        if (window.render) {
            window.render();
        }
        
        this.showStatusMessage('모든 관절 회전이 초기화되었습니다.', 'success');
    }
    
    /**
     * 달리기 포즈 재적용 (UI에서 호출용)
     * @method reapplyRunningPose
     */
    reapplyRunningPose() {
        this.applyRunningPose();
        this.updateSliders();
        
        if (window.render) {
            window.render();
        }
        
        this.showStatusMessage('달리기 포즈가 적용되었습니다.', 'success');
    }
    
    /**
     * 포즈 관련 버튼 상태 업데이트
     * @method updatePoseButtons
     */
    updatePoseButtons() {
        const addToAnimationBtn = document.getElementById('add-to-animation');
        
        // 관절이 선택되어 있으면 애니메이션 추가 버튼 활성화
        if (this.selectedJoint) {
            addToAnimationBtn.disabled = false;
        }
    }
    
    /**
     * 상태 메시지 표시
     * @method showStatusMessage
     * @param {string} message - 표시할 메시지
     * @param {string} type - 메시지 타입 ('success', 'error', 'info')
     */
    showStatusMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type}`;
        messageDiv.textContent = message;
        
        // 컨트롤 패널에 추가
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.appendChild(messageDiv);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
} 