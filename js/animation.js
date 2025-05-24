/**
 * @fileoverview 애니메이션 모듈 - 키프레임 애니메이션 관리
 * @description 저장된 포즈들을 키프레임으로 하여 부드러운 애니메이션을 생성하고 재생하는 모듈
 * @author SCE433 Computer Graphics Team
 * @version 2.1.0 - 포즈와 카메라 통합 키프레임
 */

/**
 * 키프레임 애니메이션을 관리하는 클래스
 * @class Animation
 * @description 포즈와 카메라 상태를 함께 관리하는 통합 애니메이션 제어
 */
class Animation {
    /**
     * Animation 생성자
     * @param {PoseController} poseController - 포즈 컨트롤러 인스턴스
     * @param {PoseStorage} poseStorage - 포즈 저장소 인스턴스
     * @param {Camera} camera - 카메라 인스턴스 (선택사항)
     */
    constructor(poseController, poseStorage, camera = null) {
        this.poseController = poseController;
        this.poseStorage = poseStorage;
        this.camera = camera;
        
        // 애니메이션 상태
        this.keyframes = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalDuration = 0;
        this.playbackSpeed = 1.0;
        this.animationFrameId = null;
        
        // 타이밍 설정
        this.defaultFrameDuration = 1500; // 기본 키프레임 간격 (ms) - 좀 더 긴 시간으로
        this.interpolationSteps = 60; // 초당 프레임 수
        
        // UI 이벤트 리스너 설정
        this.setupEventListeners();
        
        // UI 초기화
        this.updateUI();
    }
    
    /**
     * UI 이벤트 리스너 설정
     * @method setupEventListeners
     */
    setupEventListeners() {
        // 현재 상태를 키프레임으로 추가
        document.getElementById('add-to-animation').addEventListener('click', () => {
            this.addCurrentStateAsKeyframe();
        });
        
        // 애니메이션 클리어
        document.getElementById('clear-animation').addEventListener('click', () => {
            this.clearAnimation();
        });
        
        // 애니메이션 재생
        document.getElementById('play-animation').addEventListener('click', () => {
            this.playAnimation();
        });
        
        // 애니메이션 정지
        document.getElementById('stop-animation').addEventListener('click', () => {
            this.stopAnimation();
        });
        
        // 재생 속도 조절
        const speedSlider = document.getElementById('animation-speed');
        const speedDisplay = document.getElementById('animation-speed-value');
        
        speedSlider.addEventListener('input', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
            speedDisplay.textContent = this.playbackSpeed.toFixed(1) + 'x';
        });
        
        // 타임라인 클릭 이벤트
        document.getElementById('timeline-container').addEventListener('click', (e) => {
            this.seekToPosition(e);
        });
    }
    
    /**
     * 현재 포즈와 카메라 상태를 키프레임으로 추가
     * @method addCurrentStateAsKeyframe
     */
    addCurrentStateAsKeyframe() {
        const currentPose = this.poseController.getCurrentPose();
        const currentCamera = this.camera ? this.camera.getCameraState() : null;
        
        // 첫 번째 키프레임은 항상 기본 스탠딩 포즈로 설정
        if (this.keyframes.length === 0) {
            const standingPose = this.getStandingPose();
            const defaultCamera = this.camera ? this.camera.getDefaultState() : null;
            const standingKeyframe = {
                id: Date.now(),
                time: 0,
                pose: standingPose,
                camera: defaultCamera,
                name: '기본 스탠딩',
                isStanding: true
            };
            this.keyframes.push(standingKeyframe);
            
            // 현재 포즈가 스탠딩 포즈와 같고 카메라도 기본 상태라면 추가하지 않음
            if (this.isPoseSame(currentPose, standingPose) && 
                this.isCameraSame(currentCamera, defaultCamera)) {
                this.showStatusMessage('첫 번째 키프레임으로 기본 스탠딩 포즈가 추가되었습니다.', 'info');
                this.updateTotalDuration();
                this.updateUI();
                return;
            }
        }
        
        // 빈 포즈인지 확인
        const isEmptyPose = Object.values(currentPose).every(rotation => 
            rotation.x === 0 && rotation.y === 0 && rotation.z === 0
        );
        
        // 첫 번째 키프레임이 있을 때, 빈 포즈면서 카메라도 변화가 없다면 추가하지 않음
        if (isEmptyPose && this.keyframes.length > 0) {
            const lastCamera = this.keyframes[this.keyframes.length - 1].camera;
            if (this.isCameraSame(currentCamera, lastCamera)) {
                this.showStatusMessage('변경된 포즈나 카메라 시점이 없습니다.', 'error');
                return;
            }
        }
        
        // 키프레임 생성
        const keyframe = {
            id: Date.now(),
            time: this.keyframes.length * this.defaultFrameDuration,
            pose: { ...currentPose },
            camera: currentCamera ? { ...currentCamera } : null,
            name: `키프레임 ${this.keyframes.length + 1}`
        };
        
        this.keyframes.push(keyframe);
        this.updateTotalDuration();
        this.updateUI();
        
        this.showStatusMessage(`키프레임 ${this.keyframes.length}이 추가되었습니다.`, 'success');
    }
    
    /**
     * 두 카메라 상태가 같은지 비교
     * @method isCameraSame
     * @param {Object} camera1 - 첫 번째 카메라 상태
     * @param {Object} camera2 - 두 번째 카메라 상태
     * @returns {boolean} 같으면 true
     */
    isCameraSame(camera1, camera2) {
        if (!camera1 && !camera2) return true;
        if (!camera1 || !camera2) return false;
        
        const threshold = 0.1; // 허용 오차
        return Math.abs(camera1.rotationX - camera2.rotationX) < threshold &&
               Math.abs(camera1.rotationY - camera2.rotationY) < threshold &&
               Math.abs(camera1.rotationZ - camera2.rotationZ) < threshold &&
               Math.abs(camera1.scale - camera2.scale) < threshold;
    }
    
    /**
     * 기본 스탠딩 포즈 반환
     * @method getStandingPose
     * @returns {Object} 기본 스탠딩 포즈
     */
    getStandingPose() {
        const standingPose = {};
        const bodyParts = [
            'HEAD', 'LEFT_UPPER_ARM', 'LEFT_LOWER_ARM', 'LEFT_HAND',
            'RIGHT_UPPER_ARM', 'RIGHT_LOWER_ARM', 'RIGHT_HAND',
            'LEFT_UPPER_LEG', 'LEFT_LOWER_LEG', 'LEFT_FOOT',
            'RIGHT_UPPER_LEG', 'RIGHT_LOWER_LEG', 'RIGHT_FOOT'
        ];
        
        bodyParts.forEach(part => {
            standingPose[part] = { x: 0, y: 0, z: 0 };
        });
        
        return standingPose;
    }
    
    /**
     * 두 포즈가 같은지 비교
     * @method isPoseSame
     * @param {Object} pose1 - 첫 번째 포즈
     * @param {Object} pose2 - 두 번째 포즈
     * @returns {boolean} 같으면 true
     */
    isPoseSame(pose1, pose2) {
        for (const part in pose1) {
            if (!pose2[part]) return false;
            if (pose1[part].x !== pose2[part].x ||
                pose1[part].y !== pose2[part].y ||
                pose1[part].z !== pose2[part].z) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 애니메이션 클리어
     * @method clearAnimation
     */
    clearAnimation() {
        if (this.keyframes.length === 0) {
            this.showStatusMessage('클리어할 애니메이션이 없습니다.', 'info');
            return;
        }
        
        const confirmClear = confirm('모든 키프레임을 삭제하시겠습니까?');
        if (!confirmClear) {
            return;
        }
        
        this.stopAnimation();
        this.keyframes = [];
        this.currentTime = 0;
        this.totalDuration = 0;
        this.updateUI();
        
        // 기본 스탠딩 포즈로 복귀
        this.poseController.resetAllRotations();
        if (this.camera) {
            this.camera.reset();
        }
        
        this.showStatusMessage('애니메이션이 클리어되었습니다.', 'success');
    }
    
    /**
     * 애니메이션 재생
     * @method playAnimation
     */
    playAnimation() {
        if (this.keyframes.length < 2) {
            this.showStatusMessage('애니메이션을 위해서는 최소 2개의 키프레임이 필요합니다.', 'error');
            return;
        }
        
        if (this.isPlaying) {
            this.pauseAnimation();
            return;
        }
        
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.updatePlaybackButtons();
        
        // 애니메이션 루프 시작
        this.animationLoop();
        
        this.showStatusMessage('애니메이션을 재생합니다.', 'info');
    }
    
    /**
     * 애니메이션 일시정지
     * @method pauseAnimation
     */
    pauseAnimation() {
        this.isPlaying = false;
        this.updatePlaybackButtons();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.showStatusMessage('애니메이션이 일시정지되었습니다.', 'info');
    }
    
    /**
     * 애니메이션 정지
     * @method stopAnimation
     */
    stopAnimation() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updatePlaybackButtons();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 기본 스탠딩 포즈로 되돌리기
        this.poseController.resetAllRotations();
        if (this.camera) {
            this.camera.reset();
        }
        
        this.updateTimelinePosition();
        this.showStatusMessage('애니메이션이 정지되었습니다.', 'info');
    }
    
    /**
     * 애니메이션 루프
     * @method animationLoop
     */
    animationLoop() {
        if (!this.isPlaying) return;
        
        const currentFrameTime = performance.now();
        const deltaTime = (currentFrameTime - this.lastFrameTime) * this.playbackSpeed;
        this.lastFrameTime = currentFrameTime;
        
        this.currentTime += deltaTime;
        
        // 애니메이션 끝에 도달하면 루프
        if (this.currentTime >= this.totalDuration) {
            this.currentTime = 0;
        }
        
        // 현재 시간에 해당하는 상태 계산 및 적용
        this.interpolateAndApplyState(this.currentTime);
        
        // 타임라인 UI 업데이트
        this.updateTimelinePosition();
        
        // 다음 프레임 예약
        this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
    }
    
    /**
     * 지정된 시간의 포즈와 카메라 상태를 보간하여 적용
     * @method interpolateAndApplyState
     * @param {number} time - 애니메이션 시간 (ms)
     */
    interpolateAndApplyState(time) {
        if (this.keyframes.length < 2) return;
        
        // 현재 시간에 해당하는 키프레임 구간 찾기
        let currentKeyframe = null;
        let nextKeyframe = null;
        
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (time >= this.keyframes[i].time && time < this.keyframes[i + 1].time) {
                currentKeyframe = this.keyframes[i];
                nextKeyframe = this.keyframes[i + 1];
                break;
            }
        }
        
        // 마지막 구간 처리
        if (!currentKeyframe) {
            currentKeyframe = this.keyframes[this.keyframes.length - 1];
            nextKeyframe = this.keyframes[0]; // 루프를 위해 첫 번째 키프레임으로
        }
        
        // 보간 비율 계산
        const timeDiff = nextKeyframe.time - currentKeyframe.time;
        const progress = timeDiff > 0 ? (time - currentKeyframe.time) / timeDiff : 0;
        
        // 포즈 보간 및 적용
        const interpolatedPose = this.interpolatePoses(
            currentKeyframe.pose, 
            nextKeyframe.pose, 
            progress
        );
        this.poseController.setPose(interpolatedPose);
        
        // 카메라 보간 및 적용
        if (this.camera && currentKeyframe.camera && nextKeyframe.camera) {
            const interpolatedCamera = this.camera.interpolateState(
                currentKeyframe.camera,
                nextKeyframe.camera,
                progress
            );
            this.camera.setCameraState(interpolatedCamera);
        }
    }
    
    /**
     * 두 포즈 사이를 보간
     * @method interpolatePoses
     * @param {Object} pose1 - 시작 포즈
     * @param {Object} pose2 - 끝 포즈
     * @param {number} t - 보간 비율 (0-1)
     * @returns {Object} 보간된 포즈
     */
    interpolatePoses(pose1, pose2, t) {
        // 부드러운 보간을 위한 이징 함수 (ease-in-out cubic)
        const easedT = t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        const interpolatedPose = {};
        
        Object.keys(pose1).forEach(partName => {
            if (pose2[partName]) {
                interpolatedPose[partName] = {
                    x: this.lerpAngle(pose1[partName].x, pose2[partName].x, easedT),
                    y: this.lerpAngle(pose1[partName].y, pose2[partName].y, easedT),
                    z: this.lerpAngle(pose1[partName].z, pose2[partName].z, easedT)
                };
            } else {
                interpolatedPose[partName] = { ...pose1[partName] };
            }
        });
        
        return interpolatedPose;
    }
    
    /**
     * 각도 보간 함수 (최단 경로)
     * @method lerpAngle
     * @param {number} a - 시작 각도
     * @param {number} b - 끝 각도
     * @param {number} t - 보간 비율 (0-1)
     * @returns {number} 보간된 각도
     */
    lerpAngle(a, b, t) {
        // 각도를 -180 ~ 180 범위로 정규화
        const normalizeAngle = (angle) => {
            while (angle > 180) angle -= 360;
            while (angle < -180) angle += 360;
            return angle;
        };
        
        a = normalizeAngle(a);
        b = normalizeAngle(b);
        
        // 최단 경로 계산
        let diff = b - a;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        return normalizeAngle(a + diff * t);
    }
    
    /**
     * 타임라인에서 특정 위치로 이동
     * @method seekToPosition
     * @param {Event} event - 클릭 이벤트
     */
    seekToPosition(event) {
        if (this.totalDuration === 0) return;
        
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;
        
        this.currentTime = progress * this.totalDuration;
        this.interpolateAndApplyState(this.currentTime);
        this.updateTimelinePosition();
    }
    
    /**
     * 총 애니메이션 지속시간 업데이트
     * @method updateTotalDuration
     */
    updateTotalDuration() {
        if (this.keyframes.length === 0) {
            this.totalDuration = 0;
        } else {
            this.totalDuration = this.keyframes[this.keyframes.length - 1].time + this.defaultFrameDuration;
        }
    }
    
    /**
     * UI 업데이트
     * @method updateUI
     */
    updateUI() {
        this.updateKeyframeCount();
        this.updateTimelineMarkers();
        this.updatePlaybackButtons();
    }
    
    /**
     * 키프레임 개수 표시 업데이트
     * @method updateKeyframeCount
     */
    updateKeyframeCount() {
        document.getElementById('keyframe-count').textContent = this.keyframes.length;
    }
    
    /**
     * 타임라인 마커 업데이트
     * @method updateTimelineMarkers
     */
    updateTimelineMarkers() {
        const timelineBar = document.getElementById('timeline-bar');
        
        // 기존 마커 제거
        const existingMarkers = timelineBar.querySelectorAll('.keyframe-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        if (this.totalDuration === 0) return;
        
        // 키프레임 마커 추가
        this.keyframes.forEach((keyframe, index) => {
            const marker = document.createElement('div');
            marker.className = 'keyframe-marker';
            marker.style.left = (keyframe.time / this.totalDuration * 100) + '%';
            marker.title = keyframe.name;
            
            // 마커 클릭 이벤트
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentTime = keyframe.time;
                this.poseController.setPose(keyframe.pose);
                if (this.camera && keyframe.camera) {
                    this.camera.setCameraState(keyframe.camera);
                }
                this.updateTimelinePosition();
                this.showStatusMessage(`${keyframe.name}으로 이동했습니다.`, 'info');
            });
            
            timelineBar.appendChild(marker);
        });
    }
    
    /**
     * 타임라인 현재 위치 표시 업데이트
     * @method updateTimelinePosition
     */
    updateTimelinePosition() {
        const timelineBar = document.getElementById('timeline-bar');
        const progress = this.totalDuration > 0 ? (this.currentTime / this.totalDuration) : 0;
        
        // 현재 위치 표시를 위한 그라디언트 스타일 적용
        timelineBar.style.background = `linear-gradient(to right, 
            #ff6b35 0%, 
            #ff6b35 ${progress * 100}%, 
            #007acc ${progress * 100}%, 
            #007acc 100%)`;
    }
    
    /**
     * 재생 버튼 상태 업데이트
     * @method updatePlaybackButtons
     */
    updatePlaybackButtons() {
        const playBtn = document.getElementById('play-animation');
        const stopBtn = document.getElementById('stop-animation');
        const addBtn = document.getElementById('add-to-animation');
        
        const hasKeyframes = this.keyframes.length >= 2;
        
        playBtn.disabled = !hasKeyframes;
        stopBtn.disabled = !hasKeyframes || (!this.isPlaying && this.currentTime === 0);
        
        playBtn.textContent = this.isPlaying ? '일시정지' : '재생';
        
        // 키프레임 추가 버튼은 항상 활성화
        if (addBtn) addBtn.disabled = false;
    }
    
    /**
     * 키프레임 개별 삭제
     * @method removeKeyframe
     * @param {number} index - 삭제할 키프레임 인덱스
     */
    removeKeyframe(index) {
        if (index < 0 || index >= this.keyframes.length) return;
        
        this.keyframes.splice(index, 1);
        
        // 시간 재계산
        this.keyframes.forEach((keyframe, i) => {
            keyframe.time = i * this.defaultFrameDuration;
            keyframe.name = `키프레임 ${i + 1}`;
        });
        
        this.updateTotalDuration();
        this.updateUI();
        
        // 재생 중이면 정지
        if (this.isPlaying) {
            this.stopAnimation();
        }
    }
    
    /**
     * 애니메이션 데이터 내보내기
     * @method exportAnimation
     * @returns {Object} 애니메이션 데이터
     */
    exportAnimation() {
        return {
            keyframes: this.keyframes,
            totalDuration: this.totalDuration,
            defaultFrameDuration: this.defaultFrameDuration,
            version: '2.1.0'
        };
    }
    
    /**
     * 애니메이션 데이터 가져오기
     * @method importAnimation
     * @param {Object} animationData - 가져올 애니메이션 데이터
     */
    importAnimation(animationData) {
        if (!animationData || !animationData.keyframes) {
            this.showStatusMessage('유효하지 않은 애니메이션 데이터입니다.', 'error');
            return;
        }
        
        this.stopAnimation();
        this.keyframes = animationData.keyframes;
        this.totalDuration = animationData.totalDuration || 0;
        this.defaultFrameDuration = animationData.defaultFrameDuration || 1500;
        
        this.updateUI();
        this.showStatusMessage('애니메이션을 가져왔습니다.', 'success');
    }
    
    /**
     * 상태 메시지 표시
     * @method showStatusMessage
     * @param {string} message - 표시할 메시지
     * @param {string} type - 메시지 타입 ('success', 'error', 'info')
     */
    showStatusMessage(message, type = 'info') {
        if (this.poseController && this.poseController.showStatusMessage) {
            this.poseController.showStatusMessage(message, type);
        }
    }
} 