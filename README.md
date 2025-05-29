# SCE433_CG
'25 Spring, Computer Graphics(SCE433) team project

## Pictogram

A 3D human model simulation application inspired by the **2020 Tokyo Olympic Pictogram** style. Built with WebGL for real-time 3D rendering, featuring comprehensive joint-based pose control and keyframe animation systems.

## 🎯 Key Features

### 🎨 3D Human Model
- **Olympic Pictogram Style**: Organic-shaped 3D model with smooth curves
- **Hierarchical Joint Structure**: Parent-child joint relationships
- **Real-time Rendering**: Smooth 60FPS 3D rendering pipeline

### 🎮 Interactive Camera Control
- **Multi-Mode Interaction**:
  - Standard Drag: X/Y axis rotation
  - Ctrl + Drag: Z-axis rolling (camera tilt)
  - Alt + Drag: X-axis only rotation
  - Shift + Drag: Scale adjustment
  - Mouse Wheel: Scale control

### 🦴 Joint-Based Pose Control
- **13 Joint Control**: Head, arms, legs with full articulation
- **3DOF Freedom**: Complete X, Y, Z axis control per joint
- **Real-time Preview**: Instant visual feedback
- **Selective Reset**: Individual and global reset options

### 🧩 Attachment System
- **Multi-Type Attachments**: Ball and Stick attachments
- **Flexible Positioning**: 3D position and rotation control
- **Parent-Child Hierarchy**: Attach to any body part
- **Dynamic Management**: Add, remove, and modify attachments

### 💾 Pose Storage System
- **LocalStorage Persistence**: Browser-based pose saving
- **Pose Validation**: Empty pose prevention
- **Auto Description**: Intelligent pose description generation
- **Complete Management**: Save/Load/Delete operations

### 🎬 Keyframe Animation
- **Timeline Editor**: Visual keyframe management interface
- **Smooth Interpolation**: Ease-in-out natural motion
- **Multi-State Support**: Pose, camera, and lighting keyframes
- **Playback Control**: Play/Pause/Stop/Speed adjustment
- **Loop Support**: Automatic repeat playback

### 💡 Advanced Lighting System
- **Phong Lighting Model**: Ambient, diffuse, and specular lighting
- **Dynamic Light Control**: Real-time position and intensity adjustment
- **Material Properties**: Adjustable shininess and reflectance
- **Attenuation Support**: Distance-based light falloff

## 🚀 Usage Guide

### Basic Controls
1. **Camera Navigation**
   ```
   Mouse Drag          → X/Y axis rotation
   Ctrl + Drag         → Z-axis rolling (tilt)
   Alt + Drag          → X-axis only rotation
   Shift + Drag        → Scale adjustment
   Mouse Wheel         → Scale control
   ```

2. **Pose Editing**
   - Select joint → Adjust X/Y/Z sliders → Real-time feedback

3. **Attachment Management**
   - Select body part → Add Ball/Stick → Adjust position/rotation

4. **Pose Management**
   - Create pose → Enter name → Save
   - Select saved pose → Load

5. **Animation Creation**
   - Create Pose 1 → Add to animation
   - Create Pose 2 → Add to animation
   - Play to preview

## 🛠 Technical Specifications

### Technology Stack
```
Frontend:    WebGL, JavaScript ES6+, HTML5, CSS3
Storage:     LocalStorage API
Graphics:    WebGL 1.0, 3D Matrix Transformations
Animation:   RequestAnimationFrame, Easing Functions
```

### Architecture (v3.0.0)
```
📁 SCE433_CG/
├── 📄 pictogram.html         # Main application page
├── 📄 pictogram.js          # Main application (refactored)
├── 📄 style.css              # UI styling
├── 📄 README.md              # Project documentation
├── 📁 js/                    # Module directory
│   ├── 📄 model.js          # 3D human model (HumanModel)
│   ├── 📄 camera.js         # Camera control (Camera)
│   ├── 📄 lighting.js       # Lighting system (Lighting)
│   ├── 📄 poseController.js # Joint pose control (PoseController)
│   ├── 📄 poseStorage.js    # Pose storage (PoseStorage)
│   └── 📄 animation.js      # Animation system (Animation)
└── 📁 Common/               # WebGL utilities
    ├── 📄 webgl-utils.js
    ├── 📄 initShaders.js
    └── 📄 MV.js
```

### Core Classes (Refactored)
- **`HumanModel`**: Unified rendering method (`render()`)
- **`Camera`**: Enhanced drag handling (`handleMouseDrag()`)
- **`Lighting`**: Complete lighting control system
- **`PoseController`**: Joint-centric hierarchical control with attachment support
- **`PoseStorage`**: Enhanced pose validation and management
- **`Animation`**: Multi-state keyframe-based animation system

## ✨ v3.0.0 Refactoring Improvements

### 🧹 Code Cleanup
- **Removed Duplicate Methods**: `drawStanding()`, `drawRunning()` → `render()`
- **Function Compression**: Logically cohesive code integration
- **Comment Localization**: Korean comments for maintainability
- **ES6+ Syntax**: Optional chaining, destructuring assignment

### 🏗 Structural Enhancements
- **Event Handler Unification**: Eliminated redundant code
- **UI Initialization Logic**: Data-driven initialization
- **Enhanced Error Handling**: Safe DOM access patterns
- **Modular Architecture**: Independent functional modules

### 🚀 Performance Optimization
- **Method Call Optimization**: Reduced unnecessary method chains
- **Memory Efficiency**: Optimized object creation patterns
- **Rendering Pipeline**: Unified rendering logic
- **State Management**: Improved camera and lighting state handling

## 🌟 Technical Highlights

### User Experience
- **Intuitive Interface**: Korean language UI for accessibility
- **Real-time Feedback**: Instant visual updates
- **Status Messaging**: Success/error notifications
- **Accordion UI**: Organized feature grouping
- **Responsive Design**: Adaptive layout for different screen sizes

### Engineering Features
- **Modular Design**: Independent functional modules
- **JSDoc Documentation**: Complete API documentation
- **Type Safety**: Parameter validation
- **Exception Handling**: Robust error management
- **State Persistence**: LocalStorage integration

### Animation Technology
- **Smooth Interpolation**: Natural motion curves with easing
- **60FPS Rendering**: Fluid animation playback
- **Memory Management**: Optimized frame handling
- **Multi-State Keyframes**: Pose, camera, and lighting synchronization

## 🌐 Browser Compatibility
```
✅ Chrome 60+     ✅ Firefox 55+
✅ Safari 11+     ✅ Edge 79+
```

## 🔧 Development Setup

### Prerequisites
- Modern web browser with WebGL support
- Local web server (for file access)

### Quick Start
1. Clone the repository
2. Start a local web server in the project directory
3. Open `pictogram.html` in your browser
4. Start creating poses and animations!

## 📚 API Reference

### HumanModel Class
```javascript
// Render the model with current state
humanModel.render()

// Set joint transformation
humanModel.setNodeTransform(nodeName, translation, rotation, scale)

// Reset all transformations
humanModel.resetAllTransforms()

// Attachment management
humanModel.addAttachment(parentNodeName, type, position, rotation)
humanModel.removeAttachment(attachmentId)
```

### Camera Class
```javascript
// Set camera rotation
camera.setRotationX/Y/Z(angle: number)

// Set camera scale
camera.setScale(scale: number)

// Get camera state for animation
camera.getCameraState()

// Reset camera state
camera.reset()
```

### Animation Class
```javascript
// Add current state as keyframe
animation.addCurrentStateAsKeyframe()

// Playback control
animation.playAnimation()
animation.pauseAnimation()
animation.stopAnimation()

// Export/Import
animation.exportAnimation()
animation.importAnimation(data)
```

## 🎨 Features Overview

### Main Interface Sections
1. **Switch Pose**: Quick pose presets (Running, Initial)
2. **Joint Control**: Individual joint manipulation
3. **Attachment Management**: Add/remove/modify attachments
4. **Pose Management**: Save/load custom poses
5. **Animation**: Keyframe-based animation creation
6. **Camera View Control**: Camera positioning and orientation
7. **Lighting Control**: Light position and intensity

### Advanced Features
- **Pose Interpolation**: Smooth transitions between keyframes
- **Attachment System**: Dynamic object attachment to body parts
- **State Validation**: Prevents invalid poses and animations
- **Visual Timeline**: Interactive animation timeline with markers
- **Export/Import**: Save and share animations

## 👥 Development Team
- **Team**: SCE433 Computer Graphics Team
- **Version**: 3.0.0 (Refactoring Complete)
- **Languages**: JavaScript ES6+, WebGL, HTML5, CSS3
- **Documentation**: JSDoc 3.6+

## 📄 License
This project is developed for educational purposes as part of the Computer Graphics course.

---
*Spring 2025 Semester, Computer Graphics Course Project* 