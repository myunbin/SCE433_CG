class Animation {
    constructor(poseController, poseStorage, camera = null, lighting = null) {
        this.poseController = poseController;
        this.poseStorage = poseStorage;
        this.camera = camera;
        this.lighting = lighting;
        this.keyframes = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalDuration = 0;
        this.playbackSpeed = 1.0;
        this.animationFrameId = null;
        this.defaultFrameDuration = 1500;
        this.minAnimationDuration = 500;
        this.maxAnimationDuration = 15000;
        this.interpolationSteps = 60;
        this.setupEventListeners();
        this.updateUI();
    }
    setupEventListeners() {
        document
            .getElementById('add-to-animation')
            .addEventListener('click', () => {
                this.addCurrentStateAsKeyframe();
            });
        document
            .getElementById('clear-animation')
            .addEventListener('click', () => {
                this.clearAnimation();
            });
        document
            .getElementById('play-animation')
            .addEventListener('click', () => {
                this.playAnimation();
            });
        document
            .getElementById('stop-animation')
            .addEventListener('click', () => {
                this.stopAnimation();
            });
        const speedSlider = document.getElementById('animation-speed');
        const speedDisplay = document.getElementById('animation-speed-value');
        speedSlider.addEventListener('input', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
            speedDisplay.textContent = this.playbackSpeed.toFixed(1) + 'x';
        });
        document
            .getElementById('timeline-container')
            .addEventListener('click', (e) => {
                this.seekToPosition(e);
            });
    }
    addCurrentStateAsKeyframe() {
        const currentPose = this.poseController.getCurrentPose();
        const currentCamera = this.camera ? this.camera.getCameraState() : null;
        const currentLighting = this.lighting ? this.lighting.getState() : null;
        if (this.keyframes.length === 0) {
            const standingPose = this.getStandingPose();
            const defaultCamera = this.camera
                ? this.camera.getDefaultState()
                : null;
            const defaultLighting = this.lighting
                ? this.getDefaultLightingState()
                : null;
            const startKeyframe = {
                id: Date.now(),
                time: 0,
                pose: standingPose,
                camera: defaultCamera,
                lighting: defaultLighting,
                name: 'Start (Standing)',
                isStanding: true,
                isStart: true,
            };
            const endKeyframe = {
                id: Date.now() + 1,
                time: this.defaultFrameDuration * 2,
                pose: standingPose,
                camera: defaultCamera,
                lighting: defaultLighting,
                name: 'End (Standing)',
                isStanding: true,
                isEnd: true,
            };
            this.keyframes.push(startKeyframe, endKeyframe);

            const isPoseSame = this.isPoseSame(currentPose, standingPose);
            const isCameraSame = this.isCameraSame(currentCamera, defaultCamera);
            const isLightingSame = this.isLightingSame(currentLighting, defaultLighting);

            if (isPoseSame && isCameraSame && isLightingSame) {
                this.showStatusMessage(
                    'Start and end keyframes have been added. Please change the pose, camera, or lighting and add keyframes.',
                    'info'
                );
                this.updateTotalDuration();
                this.updateUI();
                return;
            }
        }

        const hasChanges = this.hasStateChanges(currentPose, currentCamera, currentLighting);
        
        if (!hasChanges && this.keyframes.length >= 2) {
            this.showStatusMessage(
                'No changes in pose, camera, or lighting.',
                'error'
            );
            return;
        }
        const endKeyframe = this.keyframes[this.keyframes.length - 1];
        const middleKeyframeCount = this.keyframes.length - 1;
        const newTime =
            (endKeyframe.time / (middleKeyframeCount + 1)) *
            middleKeyframeCount;
        const newKeyframe = {
            id: Date.now(),
            time: newTime,
            pose: { ...currentPose },
            camera: currentCamera ? { ...currentCamera } : null,
            lighting: currentLighting ? { ...currentLighting } : null,
            name: `Keyframe ${middleKeyframeCount}`,
        };
        this.keyframes.splice(-1, 0, newKeyframe);
        this.redistributeMiddleKeyframes();
        this.updateTotalDuration();
        this.updateUI();
        this.showStatusMessage(
            `Keyframe ${middleKeyframeCount} has been added.`,
            'success'
        );
    }
    redistributeMiddleKeyframes() {
        if (this.keyframes.length <= 2) return;
        const startTime = this.keyframes[0].time;
        const endTime = this.keyframes[this.keyframes.length - 1].time;
        const middleCount = this.keyframes.length - 2;
        for (let i = 1; i < this.keyframes.length - 1; i++) {
            const progress = i / (middleCount + 1);
            this.keyframes[i].time =
                startTime + (endTime - startTime) * progress;
            this.keyframes[i].name = `Keyframe ${i}`;
        }
    }
    getStandingPose() {
        const standingPose = {};
        const bodyParts = [
            'HEAD',
            'LEFT_UPPER_ARM',
            'LEFT_LOWER_ARM',
            'LEFT_HAND',
            'RIGHT_UPPER_ARM',
            'RIGHT_LOWER_ARM',
            'RIGHT_HAND',
            'LEFT_UPPER_LEG',
            'LEFT_LOWER_LEG',
            'LEFT_FOOT',
            'RIGHT_UPPER_LEG',
            'RIGHT_LOWER_LEG',
            'RIGHT_FOOT',
        ];
        bodyParts.forEach((part) => {
            standingPose[part] = { x: 0, y: 0, z: 0 };
        });
        return standingPose;
    }
    isPoseSame(pose1, pose2) {
        for (const part in pose1) {
            if (!pose2[part]) return false;
            if (
                pose1[part].x !== pose2[part].x ||
                pose1[part].y !== pose2[part].y ||
                pose1[part].z !== pose2[part].z
            ) {
                return false;
            }
        }
        return true;
    }
    isCameraSame(camera1, camera2) {
        if (!camera1 && !camera2) return true;
        if (!camera1 || !camera2) return false;
        const keys = ['eyeX', 'eyeY', 'eyeZ', 'atX', 'atY', 'atZ', 'upX', 'upY', 'upZ'];
        for (const key of keys) {
            if (Math.abs((camera1[key] || 0) - (camera2[key] || 0)) > 0.001) {
                return false;
            }
        }
        return true;
    }
    isLightingSame(lighting1, lighting2) {
        if (!lighting1 && !lighting2) return true;
        if (!lighting1 || !lighting2) return false;
        const keys = ['ambientIntensity', 'diffuseIntensity', 'specularIntensity', 'lightX', 'lightY', 'lightZ'];
        for (const key of keys) {
            if (Math.abs((lighting1[key] || 0) - (lighting2[key] || 0)) > 0.001) {
                return false;
            }
        }
        return true;
    }
    hasStateChanges(pose, camera, lighting) {
        if (this.keyframes.length < 2) return true;
        
        const lastMiddleKeyframe = this.keyframes[this.keyframes.length - 2];
        
        const poseChanged = !this.isPoseSame(pose, lastMiddleKeyframe.pose);
        
        const cameraChanged = !this.isCameraSame(camera, lastMiddleKeyframe.camera);
        
        const lightingChanged = !this.isLightingSame(lighting, lastMiddleKeyframe.lighting);
        
        return poseChanged || cameraChanged || lightingChanged;
    }
    clearAnimation() {
        if (this.keyframes.length === 0) {
            this.showStatusMessage('No animation to clear.', 'info');
            return;
        }
        const confirmClear = confirm('Delete all keyframes?');
        if (!confirmClear) {
            return;
        }
        this.stopAnimation();
        this.keyframes = [];
        this.currentTime = 0;
        this.totalDuration = 0;
        this.updateUI();
        this.poseController.resetAllRotations();
        if (this.camera) {
            this.camera.reset();
        }
        if (this.lighting) {
            this.lighting.reset();
        }
        this.showStatusMessage('Animation has been cleared.', 'success');
    }
    playAnimation() {
        if (this.keyframes.length < 2) {
            this.showStatusMessage(
                'At least 2 keyframes are required for animation.',
                'error'
            );
            return;
        }
        if (this.isPlaying) {
            this.pauseAnimation();
            return;
        }
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.updatePlaybackButtons();
        this.animationLoop();
        this.showStatusMessage('Animation is playing.', 'info');
    }
    pauseAnimation() {
        this.isPlaying = false;
        this.updatePlaybackButtons();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.showStatusMessage('Animation is paused.', 'info');
    }
    stopAnimation() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updatePlaybackButtons();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.poseController.resetAllRotations();
        if (this.camera) {
            this.camera.reset();
        }
        if (this.lighting) {
            this.lighting.reset();
        }
        this.updateTimelinePosition();
        this.showStatusMessage('Animation has been stopped.', 'info');
    }
    animationLoop() {
        if (!this.isPlaying) return;
        const currentFrameTime = performance.now();
        const deltaTime =
            (currentFrameTime - this.lastFrameTime) * this.playbackSpeed;
        this.lastFrameTime = currentFrameTime;
        this.currentTime += deltaTime;
        const lastKeyframeTime =
            this.keyframes.length > 0
                ? this.keyframes[this.keyframes.length - 1].time
                : 0;
        if (this.currentTime >= lastKeyframeTime) {
            this.currentTime = 0;
        }
        this.interpolateAndApplyState(this.currentTime);
        this.updateTimelinePosition();
        this.animationFrameId = requestAnimationFrame(() =>
            this.animationLoop()
        );
    }
    interpolateAndApplyState(time) {
        if (this.keyframes.length < 2) return;
        const lastKeyframeTime = this.keyframes[this.keyframes.length - 1].time;
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
        let currentKeyframe = null;
        let nextKeyframe = null;
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (
                time >= this.keyframes[i].time &&
                time < this.keyframes[i + 1].time
            ) {
                currentKeyframe = this.keyframes[i];
                nextKeyframe = this.keyframes[i + 1];
                break;
            }
        }
        if (!currentKeyframe) {
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
        const timeDiff = nextKeyframe.time - currentKeyframe.time;
        const progress =
            timeDiff > 0 ? (time - currentKeyframe.time) / timeDiff : 0;
        const interpolatedPose = this.interpolatePoses(
            currentKeyframe.pose,
            nextKeyframe.pose,
            progress
        );
        this.poseController.setPose(interpolatedPose);
        if (this.camera && currentKeyframe.camera && nextKeyframe.camera) {
            const interpolatedCamera = this.camera.interpolateState(
                currentKeyframe.camera,
                nextKeyframe.camera,
                progress
            );
            this.camera.setCameraState(interpolatedCamera);
        }
        if (
            this.lighting &&
            currentKeyframe.lighting &&
            nextKeyframe.lighting
        ) {
            this.lighting.setState(currentKeyframe.lighting);
        }
    }
    interpolatePoses(pose1, pose2, t) {
        const easedT =
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const interpolatedPose = {};
        Object.keys(pose1).forEach((partName) => {
            if (pose2[partName]) {
                interpolatedPose[partName] = {
                    x: this.lerpAngle(
                        pose1[partName].x,
                        pose2[partName].x,
                        easedT
                    ),
                    y: this.lerpAngle(
                        pose1[partName].y,
                        pose2[partName].y,
                        easedT
                    ),
                    z: this.lerpAngle(
                        pose1[partName].z,
                        pose2[partName].z,
                        easedT
                    ),
                };
            } else {
                interpolatedPose[partName] = { ...pose1[partName] };
            }
        });
        return interpolatedPose;
    }
    lerpAngle(a, b, t) {
        const normalizeAngle = (angle) => {
            while (angle > 180) angle -= 360;
            while (angle < -180) angle += 360;
            return angle;
        };
        a = normalizeAngle(a);
        b = normalizeAngle(b);
        let diff = b - a;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return normalizeAngle(a + diff * t);
    }
    seekToPosition(event) {
        if (this.totalDuration === 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;
        this.currentTime = progress * this.totalDuration;
        this.interpolateAndApplyState(this.currentTime);
        this.updateTimelinePosition();
    }
    updateTotalDuration() {
        if (this.keyframes.length === 0) {
            this.totalDuration = 0;
        } else {
            this.totalDuration =
                this.keyframes[this.keyframes.length - 1].time + 300;
        }
    }
    updateUI() {
        this.updateKeyframeCount();
        this.updateTimelineMarkers();
        this.updatePlaybackButtons();
    }
    updateKeyframeCount() {
        document.getElementById('keyframe-count').textContent =
            this.keyframes.length;
    }
    updateTimelineMarkers() {
        const timelineBar = document.getElementById('timeline-bar');
        const existingMarkers =
            timelineBar.querySelectorAll('.keyframe-marker');
        existingMarkers.forEach((marker) => marker.remove());
        if (this.totalDuration === 0) return;
        this.keyframes.forEach((keyframe, index) => {
            const marker = document.createElement('div');
            marker.className = 'keyframe-marker';
            marker.style.left =
                (keyframe.time / this.totalDuration) * 100 + '%';
            marker.dataset.keyframeIndex = index;
            if (keyframe.isStart) {
                marker.classList.add('start');
                marker.title = `${keyframe.name}\n(Start Keyframe - Cannot be moved)`;
            } else if (keyframe.isEnd) {
                marker.classList.add('end');
                marker.title = `${keyframe.name}\nDrag to adjust entire animation length`;
            } else {
                marker.title = `${keyframe.name}\nLeft-click: move, Right-click: delete, Drag: adjust time`;
            }
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
                this.showStatusMessage(`Moved to ${keyframe.name}.`, 'info');
            });
            marker.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (keyframe.isStart || keyframe.isEnd) {
                    this.showStatusMessage(
                        'Start and end keyframes cannot be deleted.',
                        'error'
                    );
                    return;
                }
                const confirmDelete = confirm(
                    `Are you sure you want to delete "${keyframe.name}"?`
                );
                if (confirmDelete) {
                    this.removeKeyframe(index);
                    this.showStatusMessage(
                        `${keyframe.name} has been deleted.`,
                        'success'
                    );
                }
            });
            this.setupMarkerDrag(marker, index);
            timelineBar.appendChild(marker);
        });
    }
    setupMarkerDrag(marker, keyframeIndex) {
        let isDragging = false;
        let startX = 0;
        let startTime = 0;
        let originalEndTime = 0;
        let originalKeyframeTimes = [];
        const keyframe = this.keyframes[keyframeIndex];
        marker.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            startX = e.clientX;
            startTime = keyframe.time;
            if (keyframe.isEnd) {
                originalEndTime = keyframe.time;
                originalKeyframeTimes = this.keyframes.map((kf) => kf.time);
            }
            marker.style.cursor = 'grabbing';
            marker.style.zIndex = '1000';
            e.preventDefault();
            e.stopPropagation();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const timelineContainer =
                document.getElementById('timeline-container');
            const rect = timelineContainer.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaPercent = deltaX / rect.width;
            if (keyframe.isStart) {
                return;
            } else if (keyframe.isEnd) {
                const currentTotalDuration = this.totalDuration;
                const deltaTime = deltaPercent * currentTotalDuration;
                let newEndTime = Math.max(
                    this.minAnimationDuration,
                    Math.min(
                        this.maxAnimationDuration,
                        originalEndTime + deltaTime
                    )
                );
                this.keyframes.forEach((kf, index) => {
                    if (kf.isStart) {
                        kf.time = 0;
                    } else if (kf.isEnd) {
                        kf.time = newEndTime;
                    } else {
                        const originalRatio =
                            originalKeyframeTimes[index] / originalEndTime;
                        kf.time = newEndTime * originalRatio;
                    }
                });
                this.updateTotalDuration();
                marker.style.left = '100%';
                this.updateOtherMarkersPosition();
            } else {
                const deltaTime = deltaPercent * this.totalDuration;
                let newTime = startTime + deltaTime;
                const minGap = 200;
                if (keyframeIndex > 0) {
                    const prevTime = this.keyframes[keyframeIndex - 1].time;
                    newTime = Math.max(newTime, prevTime + minGap);
                }
                if (keyframeIndex < this.keyframes.length - 1) {
                    const nextTime = this.keyframes[keyframeIndex + 1].time;
                    newTime = Math.min(newTime, nextTime - minGap);
                }
                keyframe.time = newTime;
                marker.style.left = (newTime / this.totalDuration) * 100 + '%';
            }
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
                this.showStatusMessage(
                    `The entire animation length has been adjusted to ${duration} seconds.`,
                    'success'
                );
                this.updateTimelineMarkers();
            } else {
                this.showStatusMessage(
                    'Keyframe time has been adjusted.',
                    'success'
                );
            }
        });
    }
    updateOtherMarkersPosition() {
        const timelineBar = document.getElementById('timeline-bar');
        const markers = timelineBar.querySelectorAll('.keyframe-marker');
        markers.forEach((marker, index) => {
            const keyframe = this.keyframes[index];
            if (!keyframe.isEnd) {
                marker.style.left =
                    (keyframe.time / this.totalDuration) * 100 + '%';
            }
        });
    }
    sortKeyframes() {
        this.keyframes.sort((a, b) => a.time - b.time);
        let counter = 1;
        this.keyframes.forEach((keyframe) => {
            if (!keyframe.isStart && !keyframe.isEnd) {
                keyframe.name = `Keyframe ${counter}`;
                counter++;
            }
        });
    }
    removeKeyframe(index) {
        if (index < 0 || index >= this.keyframes.length) return;
        const keyframe = this.keyframes[index];
        if (keyframe.isStart || keyframe.isEnd) {
            this.showStatusMessage(
                'Start and end keyframes cannot be deleted.',
                'error'
            );
            return;
        }
        this.keyframes.splice(index, 1);
        this.redistributeMiddleKeyframes();
        this.updateTotalDuration();
        this.updateUI();
        if (this.isPlaying) {
            this.stopAnimation();
        }
    }
    exportAnimation() {
        return {
            keyframes: this.keyframes,
            totalDuration: this.totalDuration,
            defaultFrameDuration: this.defaultFrameDuration,
            version: '2.3.0',
        };
    }
    importAnimation(animationData) {
        if (!animationData || !animationData.keyframes) {
            this.showStatusMessage('Invalid animation data.', 'error');
            return;
        }
        this.stopAnimation();
        this.keyframes = animationData.keyframes;
        this.totalDuration = animationData.totalDuration || 0;
        this.defaultFrameDuration = animationData.defaultFrameDuration || 1500;
        this.updateUI();
        this.showStatusMessage('Animation has been imported.', 'success');
    }
    updatePlaybackButtons() {
        const playBtn = document.getElementById('play-animation');
        const stopBtn = document.getElementById('stop-animation');
        const addBtn = document.getElementById('add-to-animation');
        const hasKeyframes = this.keyframes.length >= 2;
        playBtn.disabled = !hasKeyframes;
        stopBtn.disabled =
            !hasKeyframes || (!this.isPlaying && this.currentTime === 0);
        playBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        if (addBtn) addBtn.disabled = false;
    }
    updateTimelinePosition() {
        const timelineBar = document.getElementById('timeline-bar');
        const progress =
            this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0;
        timelineBar.style.background = `linear-gradient(to right,
        #ff6b35 0%,
        #ff6b35 ${progress * 100}%,
        #007acc ${progress * 100}%,
        #007acc 100%)`;
    }
    showStatusMessage(message, type = 'info') {
        if (this.poseController && this.poseController.showStatusMessage) {
            this.poseController.showStatusMessage(message, type);
        }
    }
    getDefaultLightingState() {
        return {
            position: [0.0, 0.0, -2.0, 1.0],
            type: 'point',
            intensity: {
                ambient: 0.2,
                diffuse: 0.8,
                specular: 1.0,
            },
            shininess: 20.0,
            attenuation: {
                constant: 1.0,
                linear: 0.01,
                quadratic: 0.001,
            },
        };
    }
}
