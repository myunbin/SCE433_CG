/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 * 
 * @description
 * 이 파일은 모든 WebGL 프로그램에서 필요한 기본적인 유틸리티 함수들을 제공합니다.
 * 
 * WebGL 컨텍스트를 수동으로 설정하는 대신 이 유틸리티를 사용하는 것이 권장됩니다.
 * 이는 성공/실패 여부를 확인하고, 실패 시 사용자에게 적절한 메시지를 표시합니다.
 * 
 * @example
 * // WebGL 컨텍스트 설정
 * const canvas = document.getElementById('gl-canvas');
 * const gl = WebGLUtils.setupWebGL(canvas);
 * 
 * // 렌더링 루프 설정
 * function render() {
 *   window.requestAnimFrame(render, canvas);
 *   // 렌더링 코드
 * }
 * render();
 */

WebGLUtils = function() {

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 * 
 * @description
 * WebGL 초기화 실패 시 표시할 HTML 메시지를 생성합니다.
 * 
 * @example
 * const errorHTML = makeFailHTML("WebGL을 지원하지 않는 브라우저입니다.");
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 * 
 * @description
 * WebGL을 지원하지 않는 브라우저에 대한 안내 메시지입니다.
 * 사용자가 WebGL을 지원하는 브라우저로 업그레이드하도록 안내합니다.
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 * 
 * @description
 * WebGL을 지원하지 않는 하드웨어에 대한 안내 메시지입니다.
 * 사용자의 컴퓨터가 WebGL을 지원하지 않을 때 표시됩니다.
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @return {WebGLRenderingContext} The created context.
 * 
 * @description
 * WebGL 컨텍스트를 생성하고 초기화합니다.
 * 실패 시 canvas 컨테이너에 에러 메시지를 표시합니다.
 * 
 * @example
 * const canvas = document.getElementById('gl-canvas');
 * const gl = WebGLUtils.setupWebGL(canvas, {
 *   alpha: true,        // 투명도 지원
 *   depth: true,        // 깊이 버퍼 사용
 *   stencil: true      // 스텐실 버퍼 사용
 * });
 */
var setupWebGL = function(canvas, opt_attribs) {
  function showLink(str) {
    var container = canvas.parentNode;
    if (container) {
      container.innerHTML = makeFailHTML(str);
    }
  };

  if (!window.WebGLRenderingContext) {
    showLink(GET_A_WEBGL_BROWSER);
    return null;
  }

  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    showLink(OTHER_PROBLEM);
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 * 
 * @description
 * WebGL 컨텍스트를 생성합니다.
 * 다양한 브라우저 접두사를 시도하여 WebGL 컨텍스트를 생성합니다.
 * 
 * @example
 * const canvas = document.getElementById('gl-canvas');
 * const gl = WebGLUtils.create3DContext(canvas);
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();

/**
 * Provides requestAnimationFrame in a cross browser way.
 * 
 * @description
 * 브라우저 호환성을 위한 requestAnimationFrame 폴리필을 제공합니다.
 * 다양한 브라우저에서 일관된 애니메이션 프레임 요청을 가능하게 합니다.
 * 
 * @example
 * function animate() {
 *   window.requestAnimFrame(animate);
 *   // 애니메이션 코드
 * }
 * animate();
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();


