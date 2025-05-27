/**
 * @fileoverview 애니메이션 모듈 - 키프레임 애니메이션 관리
 * @description 저장된 포즈들을 키프레임으로 하여 부드러운 애니메이션을 생성하고 재생하는 모듈
 * @author SCE433 Computer Graphics Team
 * @version 2.3.0 - 조명 애니메이션 기능 추가
 */

/**
 * 키프레임 애니메이션을 관리하는 클래스
 * @class Animation
 * @description 포즈, 카메라, 조명 상태를 함께 관리하는 통합 애니메이션 제어
 */
class Animation {
    /**
     * Animation 생성자
     * @param {PoseController} poseController - 포즈 컨트롤러 인스턴스
     * @param {PoseStorage} poseStorage - 포즈 저장소 인스턴스
     * @param {Camera} camera - 카메라 인스턴스 (선택사항)
     * @param {Lighting} lighting - 조명 인스턴스 (선택사항)
     */
    constructor(poseController, poseStorage, camera = null, lighting = null) {
        this.poseController = poseController;
        this.poseStorage = poseStorage;
        this.camera = camera;
        this.lighting = lighting;
        
        // 애니메이션 상태
        this.keyframes = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalDuration = 0;
        this.playbackSpeed = 1.0;
        this.animationFrameId = null;
        
        // 타이밍 설정
        this.defaultFrameDuration = 1500; // 기본 키프레임 간격 (ms)
        this.minAnimationDuration = 500; // 최소 애니메이션 길이 (ms)
        this.maxAnimationDuration = 15000; // 최대 애니메이션 길이 (ms)
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
        const currentLighting = this.lighting ? this.lighting.getState() : null;
        
        // 첫 번째 키프레임은 항상 기본 스탠딩 포즈로 설정
        if (this.keyframes.length === 0) {
            const standingPose = this.getStandingPose();
            const defaultCamera = this.camera ? this.camera.getDefaultState() : null;
            const defaultLighting = this.lighting ? this.getDefaultLightingState() : null;
            
            // 시작 키프레임 (시간 0)
            const startKeyframe = {
                id: Date.now(),
                time: 0,
                pose: standingPose,
                camera: defaultCamera,
                lighting: defaultLighting,
                name: '시작 (스탠딩)',
                isStanding: true,
                isStart: true
            };
            
            // 끝 키프레임 (기본 애니메이션 길이)
            const endKeyframe = {
                id: Date.now() + 1,
                time: this.defaultFrameDuration * 2, // 기본 길이
                pose: standingPose,
                camera: defaultCamera,
                lighting: defaultLighting,
                name: '끝 (스탠딩)',
                isStanding: true,
                isEnd: true
            };
            
            this.keyframes.push(startKeyframe, endKeyframe);
            
            // 현재 포즈가 스탠딩 포즈와 같고 카메라도 기본 상태라면 추가하지 않음
            if (this.isPoseSame(currentPose, standingPose) && 
                this.isCameraSame(currentCamera, defaultCamera) &&
                this.isLightingSame(currentLighting, defaultLighting)) {
                this.showStatusMessage('시작과 끝 키프레임이 추가되었습니다. 포즈를 변경한 후 키프레임을 추가하세요.', 'info');
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
        if (isEmptyPose && this.keyframes.length >= 2) {
            const startCamera = this.keyframes[0].camera;
            const startLighting = this.keyframes[0].lighting;
            if (this.isCameraSame(currentCamera, startCamera) &&
                this.isLightingSame(currentLighting, startLighting)) {
                this.showStatusMessage('변경된 포즈나 카메라 시점, 조명이 없습니다.', 'error');
                return;
            }
        }
        
        // 중간 키프레임 추가 (끝 키프레임 바로 앞에 삽입)
        const endKeyframe = this.keyframes[this.keyframes.length - 1];
        const middleKeyframeCount = this.keyframes.length - 1; // 시작 제외한 중간 키프레임 개수
        const newTime = (endKeyframe.time / (middleKeyframeCount + 1)) * middleKeyframeCount;
        
        const newKeyframe = {
            id: Date.now(),
            time: newTime,
            pose: { ...currentPose },
            camera: currentCamera ? { ...currentCamera } : null,
            lighting: currentLighting ? { ...currentLighting } : null,
            name: `키프레임 ${middleKeyframeCount}`
        };
        
        // 끝 키프레임 앞에 삽입
        this.keyframes.splice(-1, 0, newKeyframe);
        
        // 중간 키프레임들의 시간 재조정
        this.redistributeMiddleKeyframes();
        
        this.updateTotalDuration();
        this.updateUI();
        
        this.showStatusMessage(`키프레임 ${middleKeyframeCount}이 추가되었습니다.`, 'success');
    }
    
    /**
     * 중간 키프레임들의 시간을 균등하게 재분배
     * @method redistributeMiddleKeyframes
     */
    redistributeMiddleKeyframes() {
        if (this.keyframes.length <= 2) return;
        
        const startTime = this.keyframes[0].time; // 항상 0
        const endTime = this.keyframes[this.keyframes.length - 1].time;
        const middleCount = this.keyframes.length - 2;
        
        for (let i = 1; i < this.keyframes.length - 1; i++) {
            const progress = i / (middleCount + 1);
            this.keyframes[i].time = startTime + (endTime - startTime) * progress;
            this.keyframes[i].name = `키프레임 ${i}`;
        }
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
        if (this.lighting) {
            this.lighting.reset();
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
        if (this.lighting) {
            this.lighting.reset();
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
        
        // 마지막 키프레임 시간에 도달하면 루프 (마진 제외)
        const lastKeyframeTime = this.keyframes.length > 0 ? 
            this.keyframes[this.keyframes.length - 1].time : 0;
        
        if (this.currentTime >= lastKeyframeTime) {
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
        
        const lastKeyframeTime = this.keyframes[this.keyframes.length - 1].time;
        
        // 마지막 키프레임 시간에 도달했을 경우
        if (time >= lastKeyframeTime) {
            const lastKeyframe = this.keyframes[this.keyframes.length - 1];
            this.poseController.setPose(lastKeyframe.pose);
            if (this.camera && lastKeyframe.camera) {
                this.camera.setCameraState(lastKeyframe.camera);
            }
            if (this.lighting && lastKeyframe.lighting) {
                this.lighting.setState(lastKeyframe.lighting);
            }
            return;
        }
        
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
        
        // 마지막 구간이나 정확한 키프레임 시간인 경우
        if (!currentKeyframe) {
            // 가장 가까운 키프레임 찾기
            let closestKeyframe = this.keyframes[0];
            let minDistance = Math.abs(time - closestKeyframe.time);
            
            for (const keyframe of this.keyframes) {
                const distance = Math.abs(time - keyframe.time);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestKeyframe = keyframe;
                }
            }
            
            this.poseController.setPose(closestKeyframe.pose);
            if (this.camera && closestKeyframe.camera) {
                this.camera.setCameraState(closestKeyframe.camera);
            }
            if (this.lighting && closestKeyframe.lighting) {
                this.lighting.setState(closestKeyframe.lighting);
            }
            return;
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
        
        // 조명 보간 및 적용
        if (this.lighting && currentKeyframe.lighting && nextKeyframe.lighting) {
            const interpolatedLighting = this.interpolateLighting(
                currentKeyframe.lighting,
                nextKeyframe.lighting,
                progress
            );
            this.lighting.setState(interpolatedLighting);
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
            // 마지막 키프레임 시간 + 300ms 마진 (드래그 편의성)
            this.totalDuration = this.keyframes[this.keyframes.length - 1].time + 300;
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
            marker.dataset.keyframeIndex = index;
            
            // 키프레임 타입에 따른 스타일링
            if (keyframe.isStart) {
                marker.classList.add('start');
                marker.title = `${keyframe.name}\n(시작 키프레임 - 이동 불가)`;
            } else if (keyframe.isEnd) {
                marker.classList.add('end');
                marker.title = `${keyframe.name}\n드래그하여 전체 애니메이션 길이 조절`;
            } else {
                marker.title = `${keyframe.name}\n좌클릭: 이동, 우클릭: 삭제, 드래그: 시간 조절`;
            }
            
            // 마커 좌클릭 이벤트 (키프레임으로 이동)
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentTime = keyframe.time;
                this.poseController.setPose(keyframe.pose);
                if (this.camera && keyframe.camera) {
                    this.camera.setCameraState(keyframe.camera);
                }
                if (this.lighting && keyframe.lighting) {
                    this.lighting.setState(keyframe.lighting);
                }
                this.updateTimelinePosition();
                this.showStatusMessage(`${keyframe.name}으로 이동했습니다.`, 'info');
            });
            
            // 마커 우클릭 이벤트 (중간 키프레임만 삭제 가능)
            marker.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (keyframe.isStart || keyframe.isEnd) {
                    this.showStatusMessage('시작과 끝 키프레임은 삭제할 수 없습니다.', 'error');
                    return;
                }
                
                const confirmDelete = confirm(`"${keyframe.name}"을 삭제하시겠습니까?`);
                if (confirmDelete) {
                    this.removeKeyframe(index);
                    this.showStatusMessage(`${keyframe.name}이 삭제되었습니다.`, 'success');
                }
            });
            
            // 마커 드래그 이벤트
            this.setupMarkerDrag(marker, index);
            
            timelineBar.appendChild(marker);
        });
    }
    
    /**
     * 마커 드래그 기능 설정
     * @method setupMarkerDrag
     * @param {HTMLElement} marker - 마커 요소
     * @param {number} keyframeIndex - 키프레임 인덱스
     */
    setupMarkerDrag(marker, keyframeIndex) {
        let isDragging = false;
        let startX = 0;
        let startTime = 0;
        let originalEndTime = 0; // 드래그 시작 시점의 끝 키프레임 시간
        let originalKeyframeTimes = []; // 드래그 시작 시점의 모든 키프레임 시간
        
        const keyframe = this.keyframes[keyframeIndex];
        
        marker.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 좌클릭만
            
            isDragging = true;
            startX = e.clientX;
            startTime = keyframe.time;
            
            // 끝 키프레임 드래그 시 원래 시간들 저장
            if (keyframe.isEnd) {
                originalEndTime = keyframe.time;
                originalKeyframeTimes = this.keyframes.map(kf => kf.time);
            }
            
            marker.style.cursor = 'grabbing';
            marker.style.zIndex = '1000';
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const timelineContainer = document.getElementById('timeline-container');
            const rect = timelineContainer.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaPercent = deltaX / rect.width;
            
            if (keyframe.isStart) {
                // 시작 키프레임은 이동 불가
                return;
            } else if (keyframe.isEnd) {
                // 끝 키프레임 드래그 시 전체 타임라인 스케일링
                const currentTotalDuration = this.totalDuration;
                const deltaTime = deltaPercent * currentTotalDuration;
                let newEndTime = Math.max(this.minAnimationDuration, 
                                        Math.min(this.maxAnimationDuration, originalEndTime + deltaTime));
                
                // 모든 키프레임 시간을 비례적으로 조정 (저장된 원래 시간 기준)
                this.keyframes.forEach((kf, index) => {
                    if (kf.isStart) {
                        // 시작 키프레임은 항상 0
                        kf.time = 0;
                    } else if (kf.isEnd) {
                        // 끝 키프레임은 새로운 시간
                        kf.time = newEndTime;
                    } else {
                        // 중간 키프레임들은 원래 시간 비율을 유지
                        const originalRatio = originalKeyframeTimes[index] / originalEndTime;
                        kf.time = newEndTime * originalRatio;
                    }
                });
                
                this.updateTotalDuration();
                
                // 끝 키프레임을 타임라인 끝에 고정 (시각적으로 움직이지 않게)
                marker.style.left = '100%';
                
                // 다른 마커들 위치 업데이트
                this.updateOtherMarkersPosition();
                
            } else {
                // 중간 키프레임 드래그 시 개별 시간 조절
                const deltaTime = deltaPercent * this.totalDuration;
                let newTime = startTime + deltaTime;
                const minGap = 200;
                
                // 이전 키프레임과의 간격 체크
                if (keyframeIndex > 0) {
                    const prevTime = this.keyframes[keyframeIndex - 1].time;
                    newTime = Math.max(newTime, prevTime + minGap);
                }
                
                // 다음 키프레임과의 간격 체크
                if (keyframeIndex < this.keyframes.length - 1) {
                    const nextTime = this.keyframes[keyframeIndex + 1].time;
                    newTime = Math.min(newTime, nextTime - minGap);
                }
                
                keyframe.time = newTime;
                marker.style.left = (newTime / this.totalDuration * 100) + '%';
            }
            
            // 실시간 프리뷰 (선택사항)
            if (e.ctrlKey) {
                this.currentTime = keyframe.isEnd ? keyframe.time : newTime;
                this.interpolateAndApplyState(this.currentTime);
                this.updateTimelinePosition();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            marker.style.cursor = keyframe.isEnd ? 'ew-resize' : 'pointer';
            marker.style.zIndex = '';
            
            if (keyframe.isEnd) {
                const duration = (keyframe.time / 1000).toFixed(1);
                this.showStatusMessage(`전체 애니메이션 길이가 ${duration}초로 조정되었습니다.`, 'success');
                
                // 모든 마커 위치 최종 업데이트
                this.updateTimelineMarkers();
            } else {
                this.showStatusMessage('키프레임 시간이 조정되었습니다.', 'success');
            }
        });
    }
    
    /**
     * 끝 키프레임 드래그 중 다른 마커들의 위치만 업데이트
     * @method updateOtherMarkersPosition
     */
    updateOtherMarkersPosition() {
        const timelineBar = document.getElementById('timeline-bar');
        const markers = timelineBar.querySelectorAll('.keyframe-marker');
        
        markers.forEach((marker, index) => {
            const keyframe = this.keyframes[index];
            if (!keyframe.isEnd) {
                marker.style.left = (keyframe.time / this.totalDuration * 100) + '%';
            }
        });
    }
    
    /**
     * 키프레임을 시간 순서대로 정렬
     * @method sortKeyframes
     */
    sortKeyframes() {
        this.keyframes.sort((a, b) => a.time - b.time);
        
        // 중간 키프레임 이름 재설정
        let counter = 1;
        this.keyframes.forEach(keyframe => {
            if (!keyframe.isStart && !keyframe.isEnd) {
                keyframe.name = `키프레임 ${counter}`;
                counter++;
            }
        });
    }
    
    /**
     * 키프레임 개별 삭제
     * @method removeKeyframe
     * @param {number} index - 삭제할 키프레임 인덱스
     */
    removeKeyframe(index) {
        if (index < 0 || index >= this.keyframes.length) return;
        
        const keyframe = this.keyframes[index];
        
        // 시작/끝 키프레임은 삭제 불가
        if (keyframe.isStart || keyframe.isEnd) {
            this.showStatusMessage('시작과 끝 키프레임은 삭제할 수 없습니다.', 'error');
            return;
        }
        
        this.keyframes.splice(index, 1);
        
        // 중간 키프레임들의 시간 재분배
        this.redistributeMiddleKeyframes();
        
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
            version: '2.3.0'
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
    
    /**
     * 기본 조명 상태 반환
     * @method getDefaultLightingState
     * @returns {Object} 기본 조명 상태
     */
    getDefaultLightingState() {
        return {
            position: [0.0, 0.0, -2.0, 1.0],
            type: 'point',
            intensity: {
                ambient: 0.2,
                diffuse: 0.8,
                specular: 1.0
            },
            shininess: 20.0,
            attenuation: {
                constant: 1.0,
                linear: 0.01,
                quadratic: 0.001
            }
        };
    }
    
    /**
     * 두 조명 상태가 같은지 비교
     * @method isLightingSame
     * @param {Object} lighting1 - 첫 번째 조명 상태
     * @param {Object} lighting2 - 두 번째 조명 상태
     * @returns {boolean} 같으면 true
     */
    isLightingSame(lighting1, lighting2) {
        if (!lighting1 && !lighting2) return true;
        if (!lighting1 || !lighting2) return false;
        
        const threshold = 0.01; // 허용 오차
        
        // 위치 비교
        for (let i = 0; i < 4; i++) {
            if (Math.abs(lighting1.position[i] - lighting2.position[i]) > threshold) {
                return false;
            }
        }
        
        // 타입 비교
        if (lighting1.type !== lighting2.type) return false;
        
        // 강도 비교
        if (Math.abs(lighting1.intensity.ambient - lighting2.intensity.ambient) > threshold ||
            Math.abs(lighting1.intensity.diffuse - lighting2.intensity.diffuse) > threshold ||
            Math.abs(lighting1.intensity.specular - lighting2.intensity.specular) > threshold) {
            return false;
        }
        
        // 반짝임 비교
        if (Math.abs(lighting1.shininess - lighting2.shininess) > threshold) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 두 조명 상태 사이를 보간
     * @method interpolateLighting
     * @param {Object} lighting1 - 시작 조명 상태
     * @param {Object} lighting2 - 끝 조명 상태
     * @param {number} t - 보간 비율 (0-1)
     * @returns {Object} 보간된 조명 상태
     */
    interpolateLighting(lighting1, lighting2, t) {
        // 부드러운 보간을 위한 이징 함수
        const easedT = t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        const interpolated = {
            position: [],
            type: lighting1.type, // 타입은 첫 번째 키프레임 따르기
            intensity: {},
            shininess: 0,
            attenuation: {}
        };
        
        // 위치 보간
        for (let i = 0; i < 4; i++) {
            interpolated.position[i] = lighting1.position[i] + 
                (lighting2.position[i] - lighting1.position[i]) * easedT;
        }
        
        // 타입이 다른 경우 처리
        if (lighting1.type !== lighting2.type) {
            // 보간 중간점에서 타입 전환
            interpolated.type = t < 0.5 ? lighting1.type : lighting2.type;
            interpolated.position[3] = interpolated.type === 'point' ? 1.0 : 0.0;
        }
        
        // 강도 보간
        interpolated.intensity.ambient = lighting1.intensity.ambient + 
            (lighting2.intensity.ambient - lighting1.intensity.ambient) * easedT;
        interpolated.intensity.diffuse = lighting1.intensity.diffuse + 
            (lighting2.intensity.diffuse - lighting1.intensity.diffuse) * easedT;
        interpolated.intensity.specular = lighting1.intensity.specular + 
            (lighting2.intensity.specular - lighting1.intensity.specular) * easedT;
        
        // 반짝임 보간
        interpolated.shininess = lighting1.shininess + 
            (lighting2.shininess - lighting1.shininess) * easedT;
        
        // 감쇠 계수 보간 (점 광원일 때만 의미 있음)
        if (lighting1.attenuation && lighting2.attenuation) {
            interpolated.attenuation.constant = lighting1.attenuation.constant + 
                (lighting2.attenuation.constant - lighting1.attenuation.constant) * easedT;
            interpolated.attenuation.linear = lighting1.attenuation.linear + 
                (lighting2.attenuation.linear - lighting1.attenuation.linear) * easedT;
            interpolated.attenuation.quadratic = lighting1.attenuation.quadratic + 
                (lighting2.attenuation.quadratic - lighting1.attenuation.quadratic) * easedT;
        } else {
            interpolated.attenuation = lighting1.attenuation || lighting2.attenuation || 
                { constant: 1.0, linear: 0.01, quadratic: 0.001 };
        }
        
        return interpolated;
    }
} 