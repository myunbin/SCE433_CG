
class PoseStorage {
    constructor(poseController) {
        this.poseController = poseController;
        this.storageKey = 'athletics_saved_poses';
        this.savedPoses = {};
        this.loadPoses();
        this.setupEventListeners();
        this.updatePoseList();
    }
    
    setupEventListeners() {
        document.getElementById('save-pose').addEventListener('click', () => {
            this.savePose();
        });
        document.getElementById('load-pose').addEventListener('click', () => {
            this.loadPose();
        });
        document.getElementById('delete-pose').addEventListener('click', () => {
            this.deletePose();
        });
        document.getElementById('saved-poses').addEventListener('change', () => {
            this.updatePoseButtons();
        });
        document.getElementById('pose-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.savePose();
            }
        });
        this.setupFileEventListeners();
    }
    
    savePose() {
        const poseNameInput = document.getElementById('pose-name');
        const poseName = poseNameInput.value.trim();
        const currentPose = this.poseController.getCurrentPose();
    
        const isEmptyPose = Object.values(currentPose).every(rotation => 
            rotation.x === 0 && rotation.y === 0 && rotation.z === 0
        );
        
        if (!confirmOverwrite) {
            return;
        }
        this.savedPoses[poseName] = {
            name: poseName,
            data: currentPose,
            timestamp: Date.now(),
            description: this.generatePoseDescription(currentPose)
        };
        
        this.saveToStorage();
        this.updatePoseList();
        poseNameInput.value = '';

        document.getElementById('saved-poses').value = poseName;
        this.updatePoseButtons();
        
        this.showStatusMessage(`Pose "${poseName}" has been saved.`, 'success');
    }
    
    loadPose() {
        const selectedPose = document.getElementById('saved-poses').value;
        
        if (!selectedPose || !this.savedPoses[selectedPose]) {
            this.showStatusMessage('Select a pose to load.', 'error');
            return;
        }
        const poseData = this.savedPoses[selectedPose].data;
        this.poseController.setPose(poseData);
    }
    
    deletePose() {
        const selectedPose = document.getElementById('saved-poses').value;
        
        if (!selectedPose || !this.savedPoses[selectedPose]) {
            this.showStatusMessage('Select a pose to delete.', 'error');
            return;
        }
        
        const confirmDelete = confirm(`Delete pose "${selectedPose}"?`);
        if (!confirmDelete) {
            return;
        }
        
        delete this.savedPoses[selectedPose];
        this.saveToStorage();
        this.updatePoseList();
        this.showStatusMessage(`Pose "${selectedPose}" has been deleted.`, 'success');
    }
    
    updatePoseList() {
        const select = document.getElementById('saved-poses');
    
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const poseCount = Object.keys(this.savedPoses).length;
        select.firstElementChild.textContent = poseCount > 0 ? 
            `Saved poses (${poseCount} saved)` : 'No saved poses';
        
        Object.keys(this.savedPoses)
            .sort() 
            .forEach(poseName => {
                const option = document.createElement('option');
                option.value = poseName;
                option.textContent = poseName;
                select.appendChild(option);
            });
        select.value = '';
        this.updatePoseButtons();
    }
    
    updatePoseButtons() {
        const selectedPose = document.getElementById('saved-poses').value;
        const loadBtn = document.getElementById('load-pose');
        const deleteBtn = document.getElementById('delete-pose');
        
        const hasSelection = selectedPose && this.savedPoses[selectedPose];
        loadBtn.disabled = !hasSelection;
        deleteBtn.disabled = !hasSelection;
    }
    
    loadPoses() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.savedPoses = saved ? JSON.parse(saved) : {};
            this.updatePoseList();
        } catch (error) {
            this.savedPoses = {};
            this.updatePoseList();
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.savedPoses));
        } catch (error) {
            
        }
    }
    
    generatePoseDescription(poseData) {
        const modifiedParts = [];
        
        Object.keys(poseData).forEach(partName => {
            const rotation = poseData[partName];
            if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
                const partDisplayNames = {
                    'HEAD': 'Head',
                    'LEFT_UPPER_ARM': 'Left Upper Arm',
                    'LEFT_LOWER_ARM': 'Left Lower Arm',
                    'LEFT_HAND': 'Left Hand',
                    'RIGHT_UPPER_ARM': 'Right Upper Arm',
                    'RIGHT_LOWER_ARM': 'Right Lower Arm',
                    'RIGHT_HAND': 'Right Hand',
                    'LEFT_UPPER_LEG': 'Left Upper Leg',
                    'LEFT_LOWER_LEG': 'Left Lower Leg',
                    'LEFT_FOOT': 'Left Foot',
                    'RIGHT_UPPER_LEG': 'Right Upper Leg',
                    'RIGHT_LOWER_LEG': 'Right Lower Leg',
                    'RIGHT_FOOT': 'Right Foot'
                };
                
                modifiedParts.push(partDisplayNames[partName] || partName);
            }
        });
        
        if (modifiedParts.length === 0) {
            return 'Default Pose';
        } else if (modifiedParts.length <= 3) {
            return `${modifiedParts.join(', ')} modified`;
        } else {
            return `${modifiedParts.length} parts modified`;
        }
    }
    
    getAllPoses() {
        return { ...this.savedPoses };
    }
    
    getPose(poseName) {
        return this.savedPoses[poseName] || null;
    }
    
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
    
    getPoseCount() {
        return Object.keys(this.savedPoses).length;
    }
    
    showStatusMessage(message, type = 'info') {
        
        if (this.poseController && this.poseController.showStatusMessage) {
            this.poseController.showStatusMessage(message, type);
        }
    }
    
    exportPose(poseName = null) {
        let dataToExport;
        let filename;
        
        if (poseName && this.savedPoses[poseName]) {
            
            dataToExport = {
                version: '1.0',
                type: 'single',
                pose: this.savedPoses[poseName]
            };
            filename = `pose_${poseName.replace(/\s+/g, '_')}.json`;
        } else {
            
            dataToExport = {
                version: '1.0',
                type: 'collection',
                poses: this.savedPoses,
                exportDate: new Date().toISOString()
            };
            filename = `poses_collection_${new Date().getTime()}.json`;
        }
        
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatusMessage(`Pose has been exported to ${filename}.`, 'success');
    }
    
    async importPose(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            
            if (!data.version || data.version !== '1.0') {
                throw new Error('Error');
            }
            
            let importedCount = 0;
            
            if (data.type === 'single' && data.pose) {
                const poseName = data.pose.name || `Imported_${Date.now()}`;
                if (!this.validatePoseData(data.pose.data)) {
                    throw new Error('Invalid pose data.');
                }
                let finalName = poseName;
                let counter = 1;
                while (this.savedPoses[finalName]) {
                    finalName = `${poseName}_${counter}`;
                    counter++;
                }
                
                this.savedPoses[finalName] = {
                    ...data.pose,
                    name: finalName,
                    timestamp: Date.now()
                };
                importedCount = 1;
                
            } else if (data.type === 'collection' && data.poses) {
                
                for (const [name, pose] of Object.entries(data.poses)) {
                    if (this.validatePoseData(pose.data)) {
                        
                        let finalName = name;
                        let counter = 1;
                        while (this.savedPoses[finalName]) {
                            finalName = `${name}_imported_${counter}`;
                            counter++;
                        }
                        
                        this.savedPoses[finalName] = {
                            ...pose,
                            name: finalName,
                            timestamp: Date.now()
                        };
                        importedCount++;
                    }
                }
            } else {
                throw new Error('Error');
            }
            
            if (importedCount > 0) {                
                this.saveToStorage();
                this.updatePoseList();
                this.showStatusMessage(`${importedCount} poses have been imported.`, 'success');
            } 
        } catch (error) {
            this.showStatusMessage(`Error: ${error.message}`, 'error');
        }
    }
    
    setupFileEventListeners() {
        
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-poses';
        exportBtn.textContent = 'Export';
        exportBtn.addEventListener('click', () => {
            const selectedPose = document.getElementById('saved-poses').value;
            if (selectedPose && selectedPose !== '') {
                
                const confirmSingle = confirm(`Export "${selectedPose}" pose only?\nCancel to export all poses.`);
                this.exportPose(confirmSingle ? selectedPose : null);
            } else {
                
                this.exportPose();
            }
        });
        
        
        const importBtn = document.createElement('button');
        importBtn.id = 'import-poses';
        importBtn.textContent = 'Import from file';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importPose(e.target.files[0]);
                e.target.value = ''; 
            }
        });
        
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        const poseButtons = document.querySelector('.pose-buttons');
        if (poseButtons) {
            poseButtons.appendChild(exportBtn);
            poseButtons.appendChild(importBtn);
            poseButtons.appendChild(fileInput);
        }
    }
} 