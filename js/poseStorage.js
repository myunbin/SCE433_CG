/**
 * @fileoverview 포즈 저장소 모듈
 * @description 사용자가 만든 포즈를 로컬스토리지에 저장하고 관리하는 모듈입니다.
 *              포즈 데이터의 검증과 UI 연동을 담당합니다.
 * @author SCE433 Computer Graphics Team
 * @version 3.0.0 - 리팩토링 및 코드 최적화
 */

/**
 * 포즈 저장 및 관리 클래스
 * @class PoseStorage
 * @description 포즈 데이터를 로컬스토리지에 저장하고 UI와 연동
 */
class PoseStorage {
    /**
     * PoseStorage 생성자
     * @param {PoseController} poseController - 포즈 컨트롤러 인스턴스
     */
    constructor(poseController) {
        this.poseController = poseController;
        this.storageKey = 'athletics_saved_poses';
        this.savedPoses = {};
        
        // 저장된 포즈 로드
        this.loadFromStorage();
        
        // UI 이벤트 리스너 설정
        this.setupEventListeners();
        
        // UI 업데이트
        this.updatePoseList();
    }
    
    /**
     * UI 이벤트 리스너 설정
     * @method setupEventListeners
     */
    setupEventListeners() {
        // 포즈 저장 버튼
        document.getElementById('save-pose').addEventListener('click', () => {
            this.savePose();
        });
        
        // 포즈 불러오기 버튼
        document.getElementById('load-pose').addEventListener('click', () => {
            this.loadPose();
        });
        
        // 포즈 삭제 버튼
        document.getElementById('delete-pose').addEventListener('click', () => {
            this.deletePose();
        });
        
        // 저장된 포즈 선택
        document.getElementById('saved-poses').addEventListener('change', () => {
            this.updatePoseButtons();
        });
        
        // 포즈 이름 입력에서 엔터키 처리
        document.getElementById('pose-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.savePose();
            }
        });
    }
    
    /**
     * 현재 포즈 저장
     * @method savePose
     */
    savePose() {
        const poseNameInput = document.getElementById('pose-name');
        const poseName = poseNameInput.value.trim();
        
        // 입력 검증
        if (!poseName) {
            this.showStatusMessage('포즈 이름을 입력해주세요.', 'error');
            return;
        }
        
        if (poseName.length > 20) {
            this.showStatusMessage('포즈 이름은 20자 이하로 입력해주세요.', 'error');
            return;
        }
        
        // 현재 포즈 데이터 가져오기
        const currentPose = this.poseController.getCurrentPose();
        
        // 포즈 데이터 검증 (모든 부위가 기본값인지 확인)
        const isEmptyPose = Object.values(currentPose).every(rotation => 
            rotation.x === 0 && rotation.y === 0 && rotation.z === 0
        );
        
        if (isEmptyPose) {
            this.showStatusMessage('변경된 포즈가 없습니다. 부위를 조작한 후 저장해주세요.', 'error');
            return;
        }
        
        // 중복 이름 확인
        const confirmOverwrite = this.savedPoses[poseName] ? 
            confirm(`"${poseName}" 포즈가 이미 존재합니다. 덮어쓰시겠습니까?`) : true;
        
        if (!confirmOverwrite) {
            return;
        }
        
        // 포즈 저장
        this.savedPoses[poseName] = {
            name: poseName,
            data: currentPose,
            timestamp: Date.now(),
            description: this.generatePoseDescription(currentPose)
        };
        
        // 로컬스토리지에 저장
        this.saveToStorage();
        
        // UI 업데이트
        this.updatePoseList();
        poseNameInput.value = '';
        
        // 방금 저장한 포즈 선택
        document.getElementById('saved-poses').value = poseName;
        this.updatePoseButtons();
        
        this.showStatusMessage(`포즈 "${poseName}"이 저장되었습니다.`, 'success');
    }
    
    /**
     * 선택된 포즈 불러오기
     * @method loadPose
     */
    loadPose() {
        const selectedPose = document.getElementById('saved-poses').value;
        
        if (!selectedPose || !this.savedPoses[selectedPose]) {
            this.showStatusMessage('불러올 포즈를 선택해주세요.', 'error');
            return;
        }
        
        const poseData = this.savedPoses[selectedPose].data;
        
        // 포즈 컨트롤러에 포즈 적용
        this.poseController.setPose(poseData);
        
        this.showStatusMessage(`포즈 "${selectedPose}"을 불러왔습니다.`, 'success');
    }
    
    /**
     * 선택된 포즈 삭제
     * @method deletePose
     */
    deletePose() {
        const selectedPose = document.getElementById('saved-poses').value;
        
        if (!selectedPose || !this.savedPoses[selectedPose]) {
            this.showStatusMessage('삭제할 포즈를 선택해주세요.', 'error');
            return;
        }
        
        const confirmDelete = confirm(`포즈 "${selectedPose}"을 삭제하시겠습니까?`);
        if (!confirmDelete) {
            return;
        }
        
        // 포즈 삭제
        delete this.savedPoses[selectedPose];
        
        // 로컬스토리지 업데이트
        this.saveToStorage();
        
        // UI 업데이트
        this.updatePoseList();
        
        this.showStatusMessage(`포즈 "${selectedPose}"이 삭제되었습니다.`, 'success');
    }
    
    /**
     * 포즈 목록 UI 업데이트
     * @method updatePoseList
     */
    updatePoseList() {
        const select = document.getElementById('saved-poses');
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // 첫 번째 옵션 텍스트 업데이트
        const poseCount = Object.keys(this.savedPoses).length;
        select.firstElementChild.textContent = poseCount > 0 ? 
            `저장된 포즈 (${poseCount}개)` : '저장된 포즈 없음';
        
        // 저장된 포즈들 추가
        Object.keys(this.savedPoses)
            .sort() // 알파벳 순 정렬
            .forEach(poseName => {
                const option = document.createElement('option');
                option.value = poseName;
                option.textContent = poseName;
                select.appendChild(option);
            });
        
        // 선택 초기화
        select.value = '';
        this.updatePoseButtons();
    }
    
    /**
     * 포즈 관련 버튼 상태 업데이트
     * @method updatePoseButtons
     */
    updatePoseButtons() {
        const selectedPose = document.getElementById('saved-poses').value;
        const loadBtn = document.getElementById('load-pose');
        const deleteBtn = document.getElementById('delete-pose');
        
        const hasSelection = selectedPose && this.savedPoses[selectedPose];
        loadBtn.disabled = !hasSelection;
        deleteBtn.disabled = !hasSelection;
    }
    
    /**
     * 로컬스토리지에서 포즈 데이터 로드
     * @method loadFromStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.savedPoses = JSON.parse(stored);
            }
        } catch (error) {
            console.error('포즈 데이터 로드 실패:', error);
            this.savedPoses = {};
        }
    }
    
    /**
     * 로컬스토리지에 포즈 데이터 저장
     * @method saveToStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.savedPoses));
        } catch (error) {
            console.error('포즈 데이터 저장 실패:', error);
            this.showStatusMessage('포즈 저장 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 포즈 설명 자동 생성
     * @method generatePoseDescription
     * @param {Object} poseData - 포즈 데이터
     * @returns {string} 포즈 설명
     */
    generatePoseDescription(poseData) {
        const modifiedParts = [];
        
        Object.keys(poseData).forEach(partName => {
            const rotation = poseData[partName];
            if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
                const partDisplayNames = {
                    'HEAD': '머리',
                    'LEFT_UPPER_ARM': '왼쪽 위팔',
                    'LEFT_LOWER_ARM': '왼쪽 아래팔',
                    'LEFT_HAND': '왼쪽 손',
                    'RIGHT_UPPER_ARM': '오른쪽 위팔',
                    'RIGHT_LOWER_ARM': '오른쪽 아래팔',
                    'RIGHT_HAND': '오른쪽 손',
                    'LEFT_UPPER_LEG': '왼쪽 허벅지',
                    'LEFT_LOWER_LEG': '왼쪽 종아리',
                    'LEFT_FOOT': '왼쪽 발',
                    'RIGHT_UPPER_LEG': '오른쪽 허벅지',
                    'RIGHT_LOWER_LEG': '오른쪽 종아리',
                    'RIGHT_FOOT': '오른쪽 발'
                };
                
                modifiedParts.push(partDisplayNames[partName] || partName);
            }
        });
        
        if (modifiedParts.length === 0) {
            return '기본 포즈';
        } else if (modifiedParts.length <= 3) {
            return `${modifiedParts.join(', ')} 조정됨`;
        } else {
            return `${modifiedParts.length}개 부위 조정됨`;
        }
    }
    
    /**
     * 모든 저장된 포즈 반환 (애니메이션용)
     * @method getAllPoses
     * @returns {Object} 모든 저장된 포즈 데이터
     */
    getAllPoses() {
        return { ...this.savedPoses };
    }
    
    /**
     * 특정 포즈 데이터 반환
     * @method getPose
     * @param {string} poseName - 포즈 이름
     * @returns {Object|null} 포즈 데이터 또는 null
     */
    getPose(poseName) {
        return this.savedPoses[poseName] || null;
    }
    
    /**
     * 포즈 데이터 검증
     * @method validatePoseData
     * @param {Object} poseData - 검증할 포즈 데이터
     * @returns {boolean} 유효성 검사 결과
     */
    validatePoseData(poseData) {
        if (!poseData || typeof poseData !== 'object') {
            return false;
        }
        
        const requiredParts = [
            'HEAD', 'LEFT_UPPER_ARM', 'LEFT_LOWER_ARM', 'LEFT_HAND',
            'RIGHT_UPPER_ARM', 'RIGHT_LOWER_ARM', 'RIGHT_HAND',
            'LEFT_UPPER_LEG', 'LEFT_LOWER_LEG', 'LEFT_FOOT',
            'RIGHT_UPPER_LEG', 'RIGHT_LOWER_LEG', 'RIGHT_FOOT'
        ];
        
        for (const part of requiredParts) {
            if (!poseData[part] || 
                typeof poseData[part].x !== 'number' ||
                typeof poseData[part].y !== 'number' ||
                typeof poseData[part].z !== 'number') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 저장된 포즈 개수 반환
     * @method getPoseCount
     * @returns {number} 저장된 포즈 개수
     */
    getPoseCount() {
        return Object.keys(this.savedPoses).length;
    }
    
    /**
     * 상태 메시지 표시
     * @method showStatusMessage
     * @param {string} message - 표시할 메시지
     * @param {string} type - 메시지 타입 ('success', 'error', 'info')
     */
    showStatusMessage(message, type = 'info') {
        // PoseController의 메시지 표시 메서드 재사용
        if (this.poseController && this.poseController.showStatusMessage) {
            this.poseController.showStatusMessage(message, type);
        }
    }
} 