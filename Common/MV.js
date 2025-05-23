/**
 * @fileoverview WebGL에서 사용되는 벡터와 행렬 연산을 위한 유틸리티 함수들을 제공합니다.
 * 
 * @description
 * 이 파일은 WebGL 프로그래밍에 필요한 기본적인 수학 연산 함수들을 제공합니다:
 * - 벡터 생성 및 연산 (vec2, vec3, vec4)
 * - 행렬 생성 및 연산 (mat2, mat3, mat4)
 * - 변환 행렬 생성 (translate, rotate, scale)
 * - 투영 행렬 생성 (ortho, perspective)
 * - 기타 수학 연산 (dot product, cross product 등)
 */

//////////////////////////////////////////////////////////////////////////////
//
//  Angel.js
//
//////////////////////////////////////////////////////////////////////////////

//----------------------------------------------------------------------------
//
//  Helper functions
//

function _argumentsToArray( args )
{
    return [].concat.apply( [], Array.prototype.slice.apply(args) );
}

//----------------------------------------------------------------------------

/**
 * 각도(도)를 라디안으로 변환합니다.
 * 
 * @param {number} degrees - 도 단위의 각도
 * @return {number} 라디안 단위의 각도
 * 
 * @example
 * const rad = radians(45); // 45도를 라디안으로 변환
 */
function radians( degrees ) {
    return degrees * Math.PI / 180.0;
}

//----------------------------------------------------------------------------
//
//  Vector Constructors
//

/**
 * 2차원 벡터를 생성합니다.
 * 
 * @param {...number} args - 벡터의 성분들 (0-2개)
 * @return {Array<number>} 2차원 벡터 [x, y]
 * 
 * @description
 * 인자가 없으면 [0, 0]을 반환합니다.
 * 인자가 1개면 [x, 0]을 반환합니다.
 * 인자가 2개면 [x, y]를 반환합니다.
 * 
 * @example
 * const v1 = vec2();        // [0, 0]
 * const v2 = vec2(1);       // [1, 0]
 * const v3 = vec2(1, 2);    // [1, 2]
 */
function vec2()
{
    var result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    }

    return result.splice( 0, 2 );
}

/**
 * 3차원 벡터를 생성합니다.
 * 
 * @param {...number} args - 벡터의 성분들 (0-3개)
 * @return {Array<number>} 3차원 벡터 [x, y, z]
 * 
 * @description
 * 인자가 없으면 [0, 0, 0]을 반환합니다.
 * 인자가 1개면 [x, 0, 0]을 반환합니다.
 * 인자가 2개면 [x, y, 0]을 반환합니다.
 * 인자가 3개면 [x, y, z]를 반환합니다.
 * 
 * @example
 * const v1 = vec3();           // [0, 0, 0]
 * const v2 = vec3(1);          // [1, 0, 0]
 * const v3 = vec3(1, 2);       // [1, 2, 0]
 * const v4 = vec3(1, 2, 3);    // [1, 2, 3]
 */
function vec3()
{
    var result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    case 2: result.push( 0.0 );
    }

    return result.splice( 0, 3 );
}

/**
 * 4차원 벡터를 생성합니다.
 * 
 * @param {...number} args - 벡터의 성분들 (0-4개)
 * @return {Array<number>} 4차원 벡터 [x, y, z, w]
 * 
 * @description
 * 인자가 없으면 [0, 0, 0, 1]을 반환합니다.
 * 인자가 1개면 [x, 0, 0, 1]을 반환합니다.
 * 인자가 2개면 [x, y, 0, 1]을 반환합니다.
 * 인자가 3개면 [x, y, z, 1]을 반환합니다.
 * 인자가 4개면 [x, y, z, w]를 반환합니다.
 * 
 * @example
 * const v1 = vec4();              // [0, 0, 0, 1]
 * const v2 = vec4(1);             // [1, 0, 0, 1]
 * const v3 = vec4(1, 2);          // [1, 2, 0, 1]
 * const v4 = vec4(1, 2, 3);       // [1, 2, 3, 1]
 * const v5 = vec4(1, 2, 3, 4);    // [1, 2, 3, 4]
 */
function vec4()
{
    var result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    case 2: result.push( 0.0 );
    case 3: result.push( 1.0 );
    }

    return result.splice( 0, 4 );
}

//----------------------------------------------------------------------------
//
//  Matrix Constructors
//

/**
 * 2x2 행렬을 생성합니다.
 * 
 * @param {...number} args - 행렬의 성분들 (0-4개)
 * @return {Array<Array<number>>} 2x2 행렬
 * 
 * @description
 * 인자가 없으면 단위 행렬을 반환합니다.
 * 인자가 1개면 스케일 행렬을 반환합니다.
 * 인자가 4개면 주어진 성분으로 행렬을 생성합니다.
 * 
 * @example
 * const m1 = mat2();           // 단위 행렬
 * const m2 = mat2(2);          // 스케일 행렬 [[2,0], [0,2]]
 * const m3 = mat2(1,2,3,4);    // [[1,2], [3,4]]
 */
function mat2()
{
    var v = _argumentsToArray( arguments );

    var m = [];
    switch ( v.length ) {
    case 0:
        v[0] = 1;
    case 1:
        m = [
            vec2( v[0],  0.0 ),
            vec2(  0.0, v[0] )
        ];
        break;

    default:
        m.push( vec2(v) );  v.splice( 0, 2 );
        m.push( vec2(v) );
        break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------

/**
 * 3x3 행렬을 생성합니다.
 * 
 * @param {...number} args - 행렬의 성분들 (0-9개)
 * @return {Array<Array<number>>} 3x3 행렬
 * 
 * @description
 * 인자가 없으면 단위 행렬을 반환합니다.
 * 인자가 1개면 스케일 행렬을 반환합니다.
 * 인자가 9개면 주어진 성분으로 행렬을 생성합니다.
 * 
 * @example
 * const m1 = mat3();                    // 단위 행렬
 * const m2 = mat3(2);                   // 스케일 행렬
 * const m3 = mat3(1,2,3,4,5,6,7,8,9);  // 3x3 행렬
 */
function mat3()
{
    var v = _argumentsToArray( arguments );

    var m = [];
    switch ( v.length ) {
    case 0:
        v[0] = 1;
    case 1:
        m = [
            vec3( v[0],  0.0,  0.0 ),
            vec3(  0.0, v[0],  0.0 ),
            vec3(  0.0,  0.0, v[0] )
        ];
        break;

    default:
        m.push( vec3(v) );  v.splice( 0, 3 );
        m.push( vec3(v) );  v.splice( 0, 3 );
        m.push( vec3(v) );
        break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------

/**
 * 4x4 행렬을 생성합니다.
 * 
 * @param {...number} args - 행렬의 성분들 (0-16개)
 * @return {Array<Array<number>>} 4x4 행렬
 * 
 * @description
 * 인자가 없으면 단위 행렬을 반환합니다.
 * 인자가 1개면 스케일 행렬을 반환합니다.
 * 인자가 16개면 주어진 성분으로 행렬을 생성합니다.
 * 
 * @example
 * const m1 = mat4();                    // 단위 행렬
 * const m2 = mat4(2);                   // 스케일 행렬
 * const m3 = mat4(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16);  // 4x4 행렬
 */
function mat4()
{
    var v = _argumentsToArray( arguments );

    var m = [];
    switch ( v.length ) {
    case 0:
        v[0] = 1;
    case 1:
        m = [
            vec4( v[0], 0.0,  0.0,   0.0 ),
            vec4( 0.0,  v[0], 0.0,   0.0 ),
            vec4( 0.0,  0.0,  v[0],  0.0 ),
            vec4( 0.0,  0.0,  0.0,  v[0] )
        ];
        break;

    default:
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );
        break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------
//
//  Generic Mathematical Operations for Vectors and Matrices
//

/**
 * 두 벡터 또는 행렬가 같은지 비교합니다.
 * 
 * @param {Array<number>|Array<Array<number>>} u - 첫 번째 벡터 또는 행렬
 * @param {Array<number>|Array<Array<number>>} v - 두 번째 벡터 또는 행렬
 * @return {boolean} 두 값이 같으면 true, 다르면 false
 * 
 * @description
 * 벡터의 경우 모든 성분이 같아야 합니다.
 * 행렬의 경우 모든 성분이 같아야 합니다.
 * 벡터와 행렬은 비교할 수 없습니다.
 * 
 * @example
 * const v1 = vec3(1,2,3);
 * const v2 = vec3(1,2,3);
 * const v3 = vec3(1,2,4);
 * console.log(equal(v1, v2));  // true
 * console.log(equal(v1, v3));  // false
 */
function equal( u, v )
{
    if ( u.length != v.length ) { return false; }

    if ( u.matrix && v.matrix ) {
        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i].length != v[i].length ) { return false; }
            for ( var j = 0; j < u[i].length; ++j ) {
                if ( u[i][j] !== v[i][j] ) { return false; }
            }
        }
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        return false;
    }
    else {
        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i] !== v[i] ) { return false; }
        }
    }

    return true;
}

//----------------------------------------------------------------------------

/**
 * 두 벡터 또는 행렬를 더합니다.
 * 
 * @param {Array<number>|Array<Array<number>>} u - 첫 번째 벡터 또는 행렬
 * @param {Array<number>|Array<Array<number>>} v - 두 번째 벡터 또는 행렬
 * @return {Array<number>|Array<Array<number>>} 덧셈 결과
 * 
 * @throws {string} 차원이 다른 경우 에러를 발생시킵니다.
 * 
 * @description
 * 벡터의 경우 각 성분을 더합니다.
 * 행렬의 경우 각 성분을 더합니다.
 * 벡터와 행렬은 더할 수 없습니다.
 * 
 * @example
 * const v1 = vec3(1,2,3);
 * const v2 = vec3(4,5,6);
 * const v3 = add(v1, v2);  // [5,7,9]
 */
function add( u, v )
{
    var result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length != v.length ) {
            throw "add(): trying to add matrices of different dimensions";
        }

        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i].length != v[i].length ) {
                throw "add(): trying to add matrices of different dimensions";
            }
            result.push( [] );
            for ( var j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] + v[i][j] );
            }
        }

        result.matrix = true;

        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw "add(): trying to add matrix and non-matrix variables";
    }
    else {
        if ( u.length != v.length ) {
            throw "add(): vectors are not the same dimension";
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( u[i] + v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------

/**
 * 두 벡터 또는 행렬를 뺍니다.
 * 
 * @param {Array<number>|Array<Array<number>>} u - 첫 번째 벡터 또는 행렬
 * @param {Array<number>|Array<Array<number>>} v - 두 번째 벡터 또는 행렬
 * @return {Array<number>|Array<Array<number>>} 뺄셈 결과
 * 
 * @throws {string} 차원이 다른 경우 에러를 발생시킵니다.
 * 
 * @description
 * 벡터의 경우 각 성분을 뺍니다.
 * 행렬의 경우 각 성분을 뺍니다.
 * 벡터와 행렬은 뺄 수 없습니다.
 * 
 * @example
 * const v1 = vec3(4,5,6);
 * const v2 = vec3(1,2,3);
 * const v3 = subtract(v1, v2);  // [3,3,3]
 */
function subtract( u, v )
{
    var result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length != v.length ) {
            throw "subtract(): trying to subtract matrices" +
                " of different dimensions";
        }

        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i].length != v[i].length ) {
                throw "subtract(): trying to subtact matrices" +
                    " of different dimensions";
            }
            result.push( [] );
            for ( var j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] - v[i][j] );
            }
        }

        result.matrix = true;

        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw "subtact(): trying to subtact  matrix and non-matrix variables";
    }
    else {
        if ( u.length != v.length ) {
            throw "subtract(): vectors are not the same length";
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( u[i] - v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------

/**
 * 두 벡터 또는 행렬를 곱합니다.
 * 
 * @param {Array<number>|Array<Array<number>>} u - 첫 번째 벡터 또는 행렬
 * @param {Array<number>|Array<Array<number>>} v - 두 번째 벡터 또는 행렬
 * @return {Array<number>|Array<Array<number>>} 곱셈 결과
 * 
 * @throws {string} 차원이 다른 경우 에러를 발생시킵니다.
 * 
 * @description
 * 벡터의 경우 각 성분을 곱합니다.
 * 행렬의 경우 행렬 곱셈을 수행합니다.
 * 
 * @example
 * const v1 = vec3(1,2,3);
 * const v2 = vec3(4,5,6);
 * const v3 = mult(v1, v2);  // [4,10,18]
 */
function mult( u, v )
{
    var result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length != v.length ) {
            throw "mult(): trying to add matrices of different dimensions";
        }

        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i].length != v[i].length ) {
                throw "mult(): trying to add matrices of different dimensions";
            }
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( [] );

            for ( var j = 0; j < v.length; ++j ) {
                var sum = 0.0;
                for ( var k = 0; k < u.length; ++k ) {
                    sum += u[i][k] * v[k][j];
                }
                result[i].push( sum );
            }
        }

        result.matrix = true;

        return result;
    }

      if(u.matrix&& (u.length == v.length)) {
        for(var i = 0; i<v.length; i++) {
          var sum = 0.0;
          for(var j=0; j<v.length; j++) {
            sum += u[i][j]*v[j];
          }
          result.push(sum);
        }
      return result;
      }



    else {
        if ( u.length != v.length ) {
            throw "mult(): vectors are not the same dimension";
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( u[i] * v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------
//
//  Basic Transformation Matrix Generators
//

/**
 * 이동 변환 행렬을 생성합니다.
 * 
 * @param {number|Array<number>} x - x축 이동 거리 또는 [x,y,z] 배열
 * @param {number} [y] - y축 이동 거리
 * @param {number} [z] - z축 이동 거리
 * @return {Array<Array<number>>} 4x4 이동 변환 행렬
 * 
 * @description
 * 3개의 숫자를 인자로 받거나 3차원 벡터를 인자로 받을 수 있습니다.
 * 
 * @example
 * const m1 = translate(1, 2, 3);     // 개별 좌표
 * const m2 = translate([1, 2, 3]);   // 벡터
 */
function translate( x, y, z )
{
    if ( Array.isArray(x) && x.length == 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][3] = x;
    result[1][3] = y;
    result[2][3] = z;

    return result;
}

//----------------------------------------------------------------------------

/**
 * 회전 변환 행렬을 생성합니다.
 * 
 * @param {number} angle - 회전 각도 (도)
 * @param {Array<number>|number} axis - 회전축 벡터 또는 x,y,z 좌표
 * @param {number} [y] - 회전축 y좌표
 * @param {number} [z] - 회전축 z좌표
 * @return {Array<Array<number>>} 4x4 회전 변환 행렬
 * 
 * @description
 * 회전축은 정규화된 벡터여야 합니다.
 * 
 * @example
 * const m1 = rotate(45, [1, 0, 0]);  // x축 기준 45도 회전
 * const m2 = rotate(45, 1, 0, 0);    // 위와 동일
 */
function rotate( angle, axis )
{
    if ( !Array.isArray(axis) ) {
        axis = [ arguments[1], arguments[2], arguments[3] ];
    }

    var v = normalize( axis );

    var x = v[0];
    var y = v[1];
    var z = v[2];

    var c = Math.cos( radians(angle) );
    var omc = 1.0 - c;
    var s = Math.sin( radians(angle) );

    var result = mat4(
        vec4( x*x*omc + c,   x*y*omc - z*s, x*z*omc + y*s, 0.0 ),
        vec4( x*y*omc + z*s, y*y*omc + c,   y*z*omc - x*s, 0.0 ),
        vec4( x*z*omc - y*s, y*z*omc + x*s, z*z*omc + c,   0.0 ),
        vec4()
    );

    return result;
}

/**
 * X축 기준 회전 변환 행렬을 생성합니다.
 * 
 * @param {number} theta - 회전 각도 (도)
 * @return {Array<Array<number>>} 4x4 X축 회전 변환 행렬
 * 
 * @example
 * const m = rotateX(45);  // X축 기준 45도 회전
 */
function rotateX(theta) {
  var c = Math.cos( radians(theta) );
  var s = Math.sin( radians(theta) );
  var rx = mat4( 1.0,  0.0,  0.0, 0.0,
      0.0,  c,  -s, 0.0,
      0.0, s,  c, 0.0,
      0.0,  0.0,  0.0, 1.0 );
  return rx;
}
/**
 * Y축 기준 회전 변환 행렬을 생성합니다.
 * 
 * @param {number} theta - 회전 각도 (도)
 * @return {Array<Array<number>>} 4x4 Y축 회전 변환 행렬
 * 
 * @example
 * const m = rotateY(45);  // Y축 기준 45도 회전
 */
function rotateY(theta) {
  var c = Math.cos( radians(theta) );
  var s = Math.sin( radians(theta) );
  var ry = mat4( c, 0.0, s, 0.0,
      0.0, 1.0,  0.0, 0.0,
      -s, 0.0,  c, 0.0,
      0.0, 0.0,  0.0, 1.0 );
  return ry;
}
/**
 * Z축 기준 회전 변환 행렬을 생성합니다.
 * 
 * @param {number} theta - 회전 각도 (도)
 * @return {Array<Array<number>>} 4x4 Z축 회전 변환 행렬
 * 
 * @example
 * const m = rotateZ(45);  // Z축 기준 45도 회전
 */
function rotateZ(theta) {
  var c = Math.cos( radians(theta) );
  var s = Math.sin( radians(theta) );
  var rz = mat4( c, -s, 0.0, 0.0,
      s,  c, 0.0, 0.0,
      0.0,  0.0, 1.0, 0.0,
      0.0,  0.0, 0.0, 1.0 );
  return rz;
}


//----------------------------------------------------------------------------

/**
 * 크기 변환 행렬을 생성합니다.
 * 
 * @param {number|Array<number>} x - x축 크기 또는 [x,y,z] 배열
 * @param {number} [y] - y축 크기
 * @param {number} [z] - z축 크기
 * @return {Array<Array<number>>} 4x4 크기 변환 행렬
 * 
 * @description
 * 3개의 숫자를 인자로 받거나 3차원 벡터를 인자로 받을 수 있습니다.
 * 
 * @example
 * const m1 = scalem(2, 3, 4);     // 개별 크기
 * const m2 = scalem([2, 3, 4]);   // 벡터
 */
function scalem( x, y, z )
{
    if ( Array.isArray(x) && x.length == 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
}

//----------------------------------------------------------------------------
//
//  ModelView Matrix Generators
//

/**
 * 카메라 뷰 행렬을 생성합니다.
 * 
 * @param {Array<number>} eye - 카메라 위치
 * @param {Array<number>} at - 바라보는 점
 * @param {Array<number>} up - 카메라의 위쪽 방향
 * @return {Array<Array<number>>} 4x4 뷰 행렬
 * 
 * @throws {string} 입력 벡터가 3차원이 아닌 경우 에러를 발생시킵니다.
 * 
 * @description
 * eye, at, up은 모두 3차원 벡터여야 합니다.
 * eye와 at이 같은 경우 단위 행렬을 반환합니다.
 * 
 * @example
 * const eye = vec3(0, 0, 5);    // 카메라 위치
 * const at = vec3(0, 0, 0);     // 바라보는 점
 * const up = vec3(0, 1, 0);     // 위쪽 방향
 * const view = lookAt(eye, at, up);
 */
function lookAt( eye, at, up )
{
    if ( !Array.isArray(eye) || eye.length != 3) {
        throw "lookAt(): first parameter [eye] must be an a vec3";
    }

    if ( !Array.isArray(at) || at.length != 3) {
        throw "lookAt(): first parameter [at] must be an a vec3";
    }

    if ( !Array.isArray(up) || up.length != 3) {
        throw "lookAt(): first parameter [up] must be an a vec3";
    }

    if ( equal(eye, at) ) {
        return mat4();
    }

    var v = normalize( subtract(at, eye) );  // view direction vector
    var n = normalize( cross(v, up) );       // perpendicular vector
    var u = normalize( cross(n, v) );        // "new" up vector

    v = negate( v );

    var result = mat4(
        vec4( n, -dot(n, eye) ),
        vec4( u, -dot(u, eye) ),
        vec4( v, -dot(v, eye) ),
        vec4()
    );

    return result;
}

//----------------------------------------------------------------------------
//
//  Projection Matrix Generators
//

/**
 * 정사영 행렬을 생성합니다.
 * 
 * @param {number} left - 왼쪽 평면
 * @param {number} right - 오른쪽 평면
 * @param {number} bottom - 아래 평면
 * @param {number} top - 위 평면
 * @param {number} near - 가까운 평면
 * @param {number} far - 먼 평면
 * @return {Array<Array<number>>} 4x4 정사영 행렬
 * 
 * @throws {string} 평면이 같은 경우 에러를 발생시킵니다.
 * 
 * @description
 * 모든 평면은 서로 달라야 합니다.
 * 
 * @example
 * const m = ortho(-1, 1, -1, 1, -1, 1);  // 정규화된 디바이스 좌표계
 */
function ortho( left, right, bottom, top, near, far )
{
    if ( left == right ) { throw "ortho(): left and right are equal"; }
    if ( bottom == top ) { throw "ortho(): bottom and top are equal"; }
    if ( near == far )   { throw "ortho(): near and far are equal"; }

    var w = right - left;
    var h = top - bottom;
    var d = far - near;

    var result = mat4();
    result[0][0] = 2.0 / w;
    result[1][1] = 2.0 / h;
    result[2][2] = -2.0 / d;
    result[0][3] = -(left + right) / w;
    result[1][3] = -(top + bottom) / h;
    result[2][3] = -(near + far) / d;

    return result;
}

//----------------------------------------------------------------------------

/**
 * 원근 투영 행렬을 생성합니다.
 * 
 * @param {number} fovy - 시야각 (도)
 * @param {number} aspect - 종횡비
 * @param {number} near - 가까운 평면
 * @param {number} far - 먼 평면
 * @return {Array<Array<number>>} 4x4 원근 투영 행렬
 * 
 * @description
 * fovy는 수직 시야각을 도 단위로 지정합니다.
 * aspect는 width/height 비율입니다.
 * 
 * @example
 * const m = perspective(45, 1, 0.1, 100);  // 45도 시야각, 정사각형 뷰포트
 */
function perspective( fovy, aspect, near, far )
{
    var f = 1.0 / Math.tan( radians(fovy) / 2 );
    var d = far - near;

    var result = mat4();
    result[0][0] = f / aspect;
    result[1][1] = f;
    result[2][2] = -(near + far) / d;
    result[2][3] = -2 * near * far / d;
    result[3][2] = -1;
    result[3][3] = 0.0;

    return result;
}

//----------------------------------------------------------------------------
//
//  Matrix Functions
//

/**
 * 행렬의 전치 행렬을 계산합니다.
 * 
 * @param {Array<Array<number>>} m - 입력 행렬
 * @return {Array<Array<number>>} 전치 행렬
 * 
 * @throws {string} 입력이 행렬이 아닌 경우 에러를 발생시킵니다.
 * 
 * @example
 * const m = mat2(1,2,3,4);
 * const t = transpose(m);  // [[1,3], [2,4]]
 */
function transpose( m )
{
    if ( !m.matrix ) {
        return "transpose(): trying to transpose a non-matrix";
    }

    var result = [];
    for ( var i = 0; i < m.length; ++i ) {
        result.push( [] );
        for ( var j = 0; j < m[i].length; ++j ) {
            result[i].push( m[j][i] );
        }
    }

    result.matrix = true;

    return result;
}

//----------------------------------------------------------------------------
//
//  Vector Functions
//

/**
 * 두 벡터의 내적을 계산합니다.
 * 
 * @param {Array<number>} u - 첫 번째 벡터
 * @param {Array<number>} v - 두 번째 벡터
 * @return {number} 내적 결과
 * 
 * @throws {string} 벡터의 차원이 다른 경우 에러를 발생시킵니다.
 * 
 * @example
 * const v1 = vec3(1,2,3);
 * const v2 = vec3(4,5,6);
 * const d = dot(v1, v2);  // 32
 */
function dot( u, v )
{
    if ( u.length != v.length ) {
        throw "dot(): vectors are not the same dimension";
    }

    var sum = 0.0;
    for ( var i = 0; i < u.length; ++i ) {
        sum += u[i] * v[i];
    }

    return sum;
}

//----------------------------------------------------------------------------

/**
 * 벡터의 부호를 바꿉니다.
 * 
 * @param {Array<number>} u - 입력 벡터
 * @return {Array<number>} 부호가 바뀐 벡터
 * 
 * @example
 * const v = vec3(1,2,3);
 * const n = negate(v);  // [-1,-2,-3]
 */
function negate( u )
{
    var result = [];
    for ( var i = 0; i < u.length; ++i ) {
        result.push( -u[i] );
    }

    return result;
}

//----------------------------------------------------------------------------

/**
 * 두 3차원 벡터의 외적을 계산합니다.
 * 
 * @param {Array<number>} u - 첫 번째 벡터
 * @param {Array<number>} v - 두 번째 벡터
 * @return {Array<number>} 외적 결과
 * 
 * @throws {string} 입력 벡터가 3차원이 아닌 경우 에러를 발생시킵니다.
 * 
 * @example
 * const v1 = vec3(1,0,0);
 * const v2 = vec3(0,1,0);
 * const c = cross(v1, v2);  // [0,0,1]
 */
function cross( u, v )
{
    if ( !Array.isArray(u) || u.length < 3 ) {
        throw "cross(): first argument is not a vector of at least 3";
    }

    if ( !Array.isArray(v) || v.length < 3 ) {
        throw "cross(): second argument is not a vector of at least 3";
    }

    var result = [
        u[1]*v[2] - u[2]*v[1],
        u[2]*v[0] - u[0]*v[2],
        u[0]*v[1] - u[1]*v[0]
    ];

    return result;
}

//----------------------------------------------------------------------------

/**
 * 벡터의 길이를 계산합니다.
 * 
 * @param {Array<number>} u - 입력 벡터
 * @return {number} 벡터의 길이
 * 
 * @example
 * const v = vec3(3,4,0);
 * const l = length(v);  // 5
 */
function length( u )
{
    return Math.sqrt( dot(u, u) );
}

//----------------------------------------------------------------------------

/**
 * 벡터를 정규화합니다.
 * 
 * @param {Array<number>} u - 입력 벡터
 * @param {boolean} [excludeLastComponent] - 마지막 성분을 제외할지 여부
 * @return {Array<number>} 정규화된 벡터
 * 
 * @throws {string} 벡터의 길이가 0인 경우 에러를 발생시킵니다.
 * 
 * @example
 * const v = vec3(3,4,0);
 * const n = normalize(v);  // [0.6, 0.8, 0]
 */
function normalize( u, excludeLastComponent )
{
    if ( excludeLastComponent ) {
        var last = u.pop();
    }

    var len = length( u );

    if ( !isFinite(len) ) {
        throw "normalize: vector " + u + " has zero length";
    }

    for ( var i = 0; i < u.length; ++i ) {
        u[i] /= len;
    }

    if ( excludeLastComponent ) {
        u.push( last );
    }

    return u;
}

//----------------------------------------------------------------------------

/**
 * 두 벡터를 선형 보간합니다.
 * 
 * @param {Array<number>} u - 첫 번째 벡터
 * @param {Array<number>} v - 두 번째 벡터
 * @param {number} s - 보간 계수 (0~1)
 * @return {Array<number>} 보간된 벡터
 * 
 * @throws {string} 벡터의 차원이 다른 경우 에러를 발생시킵니다.
 * 
 * @example
 * const v1 = vec3(0,0,0);
 * const v2 = vec3(1,1,1);
 * const v3 = mix(v1, v2, 0.5);  // [0.5, 0.5, 0.5]
 */
function mix( u, v, s )
{
    if ( typeof s !== "number" ) {
        throw "mix: the last paramter " + s + " must be a number";
    }

    if ( u.length != v.length ) {
        throw "vector dimension mismatch";
    }

    var result = [];
    for ( var i = 0; i < u.length; ++i ) {
        result.push( (1.0 - s) * u[i] + s * v[i] );
    }

    return result;
}

//----------------------------------------------------------------------------
//
// Vector and Matrix functions
//

/**
 * 벡터에 스칼라를 곱합니다.
 * 
 * @param {number} s - 스칼라 값
 * @param {Array<number>} u - 입력 벡터
 * @return {Array<number>} 스케일된 벡터
 * 
 * @throws {string} 입력이 벡터가 아닌 경우 에러를 발생시킵니다.
 * 
 * @example
 * const v = vec3(1,2,3);
 * const s = scale(2, v);  // [2,4,6]
 */
function scale( s, u )
{
    if ( !Array.isArray(u) ) {
        throw "scale: second parameter " + u + " is not a vector";
    }

    var result = [];
    for ( var i = 0; i < u.length; ++i ) {
        result.push( s * u[i] );
    }

    return result;
}

//----------------------------------------------------------------------------
//
//
//

/**
 * 벡터나 행렬을 1차원 배열로 변환합니다.
 * 
 * @param {Array<number>|Array<Array<number>>} v - 입력 벡터 또는 행렬
 * @return {Float32Array} 1차원 배열
 * 
 * @description
 * 행렬의 경우 전치 행렬로 변환 후 1차원 배열로 만듭니다.
 * 
 * @example
 * const v = vec3(1,2,3);
 * const f = flatten(v);  // Float32Array [1,2,3]
 */
function flatten( v )
{
    if ( v.matrix === true ) {
        v = transpose( v );
    }

    var n = v.length;
    var elemsAreArrays = false;

    if ( Array.isArray(v[0]) ) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array( n );

    if ( elemsAreArrays ) {
        var idx = 0;
        for ( var i = 0; i < v.length; ++i ) {
            for ( var j = 0; j < v[i].length; ++j ) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for ( var i = 0; i < v.length; ++i ) {
            floats[i] = v[i];
        }
    }

    return floats;
}

//----------------------------------------------------------------------------

var sizeof = {
    'vec2' : new Float32Array( flatten(vec2()) ).byteLength,
    'vec3' : new Float32Array( flatten(vec3()) ).byteLength,
    'vec4' : new Float32Array( flatten(vec4()) ).byteLength,
    'mat2' : new Float32Array( flatten(mat2()) ).byteLength,
    'mat3' : new Float32Array( flatten(mat3()) ).byteLength,
    'mat4' : new Float32Array( flatten(mat4()) ).byteLength
};

// new functions 5/2/2015

// printing

function printm(m)
{
    if(m.length == 2)
    for(var i=0; i<m.length; i++)
       console.log(m[i][0], m[i][1]);
    else if(m.length == 3)
    for(var i=0; i<m.length; i++)
       console.log(m[i][0], m[i][1], m[i][2]);
    else if(m.length == 4)
    for(var i=0; i<m.length; i++)
       console.log(m[i][0], m[i][1], m[i][2], m[i][3]);
}
// determinants

function det2(m)
{

     return m[0][0]*m[1][1]-m[0][1]*m[1][0];

}

function det3(m)
{
     var d = m[0][0]*m[1][1]*m[2][2]
           + m[0][1]*m[1][2]*m[2][0]
           + m[0][2]*m[2][1]*m[1][0]
           - m[2][0]*m[1][1]*m[0][2]
           - m[1][0]*m[0][1]*m[2][2]
           - m[0][0]*m[1][2]*m[2][1]
           ;
     return d;
}

function det4(m)
{
     var m0 = [
         vec3(m[1][1], m[1][2], m[1][3]),
         vec3(m[2][1], m[2][2], m[2][3]),
         vec3(m[3][1], m[3][2], m[3][3])
     ];
     var m1 = [
         vec3(m[1][0], m[1][2], m[1][3]),
         vec3(m[2][0], m[2][2], m[2][3]),
         vec3(m[3][0], m[3][2], m[3][3])
     ];
     var m2 = [
         vec3(m[1][0], m[1][1], m[1][3]),
         vec3(m[2][0], m[2][1], m[2][3]),
         vec3(m[3][0], m[3][1], m[3][3])
     ];
     var m3 = [
         vec3(m[1][0], m[1][1], m[1][2]),
         vec3(m[2][0], m[2][1], m[2][2]),
         vec3(m[3][0], m[3][1], m[3][2])
     ];
     return m[0][0]*det3(m0) - m[0][1]*det3(m1)
         + m[0][2]*det3(m2) - m[0][3]*det3(m3);

}

function det(m)
{
     if(m.matrix != true) console.log("not a matrix");
     if(m.length == 2) return det2(m);
     if(m.length == 3) return det3(m);
     if(m.length == 4) return det4(m);
}

//---------------------------------------------------------

// inverses

function inverse2(m)
{
     var a = mat2();
     var d = det2(m);
     a[0][0] = m[1][1]/d;
     a[0][1] = -m[0][1]/d;
     a[1][0] = -m[1][0]/d;
     a[1][1] = m[0][0]/d;
     a.matrix = true;
     return a;
}

function inverse3(m)
{
    var a = mat3();
    var d = det3(m);

    var a00 = [
       vec2(m[1][1], m[1][2]),
       vec2(m[2][1], m[2][2])
    ];
    var a01 = [
       vec2(m[1][0], m[1][2]),
       vec2(m[2][0], m[2][2])
    ];
    var a02 = [
       vec2(m[1][0], m[1][1]),
       vec2(m[2][0], m[2][1])
    ];
    var a10 = [
       vec2(m[0][1], m[0][2]),
       vec2(m[2][1], m[2][2])
    ];
    var a11 = [
       vec2(m[0][0], m[0][2]),
       vec2(m[2][0], m[2][2])
    ];
    var a12 = [
       vec2(m[0][0], m[0][1]),
       vec2(m[2][0], m[2][1])
    ];
    var a20 = [
       vec2(m[0][1], m[0][2]),
       vec2(m[1][1], m[1][2])
    ];
    var a21 = [
       vec2(m[0][0], m[0][2]),
       vec2(m[1][0], m[1][2])
    ];
    var a22 = [
       vec2(m[0][0], m[0][1]),
       vec2(m[1][0], m[1][1])
    ];

   a[0][0] = det2(a00)/d;
   a[0][1] = -det2(a10)/d;
   a[0][2] = det2(a20)/d;
   a[1][0] = -det2(a01)/d;
   a[1][1] = det2(a11)/d;
   a[1][2] = -det2(a21)/d;
   a[2][0] = det2(a02)/d;
   a[2][1] = -det2(a12)/d;
   a[2][2] = det2(a22)/d;

   return a;

}

function inverse4(m)
{
    var a = mat4();
    var d = det4(m);

    var a00 = [
       vec3(m[1][1], m[1][2], m[1][3]),
       vec3(m[2][1], m[2][2], m[2][3]),
       vec3(m[3][1], m[3][2], m[3][3])
    ];
    var a01 = [
       vec3(m[1][0], m[1][2], m[1][3]),
       vec3(m[2][0], m[2][2], m[2][3]),
       vec3(m[3][0], m[3][2], m[3][3])
    ];
    var a02 = [
       vec3(m[1][0], m[1][1], m[1][3]),
       vec3(m[2][0], m[2][1], m[2][3]),
       vec3(m[3][0], m[3][1], m[3][3])
    ];
    var a03 = [
       vec3(m[1][0], m[1][1], m[1][2]),
       vec3(m[2][0], m[2][1], m[2][2]),
       vec3(m[3][0], m[3][1], m[3][2])
    ];
    var a10 = [
       vec3(m[0][1], m[0][2], m[0][3]),
       vec3(m[2][1], m[2][2], m[2][3]),
       vec3(m[3][1], m[3][2], m[3][3])
    ];
    var a11 = [
       vec3(m[0][0], m[0][2], m[0][3]),
       vec3(m[2][0], m[2][2], m[2][3]),
       vec3(m[3][0], m[3][2], m[3][3])
    ];
    var a12 = [
       vec3(m[0][0], m[0][1], m[0][3]),
       vec3(m[2][0], m[2][1], m[2][3]),
       vec3(m[3][0], m[3][1], m[3][3])
    ];
    var a13 = [
       vec3(m[0][0], m[0][1], m[0][2]),
       vec3(m[2][0], m[2][1], m[2][2]),
       vec3(m[3][0], m[3][1], m[3][2])
    ];
    var a20 = [
       vec3(m[0][1], m[0][2], m[0][3]),
       vec3(m[1][1], m[1][2], m[1][3]),
       vec3(m[3][1], m[3][2], m[3][3])
    ];
    var a21 = [
       vec3(m[0][0], m[0][2], m[0][3]),
       vec3(m[1][0], m[1][2], m[1][3]),
       vec3(m[3][0], m[3][2], m[3][3])
    ];
    var a22 = [
       vec3(m[0][0], m[0][1], m[0][3]),
       vec3(m[1][0], m[1][1], m[1][3]),
       vec3(m[3][0], m[3][1], m[3][3])
    ];
    var a23 = [
       vec3(m[0][0], m[0][1], m[0][2]),
       vec3(m[1][0], m[1][1], m[1][2]),
       vec3(m[3][0], m[3][1], m[3][2])
    ];

    var a30 = [
       vec3(m[0][1], m[0][2], m[0][3]),
       vec3(m[1][1], m[1][2], m[1][3]),
       vec3(m[2][1], m[2][2], m[2][3])
    ];
    var a31 = [
       vec3(m[0][0], m[0][2], m[0][3]),
       vec3(m[1][0], m[1][2], m[1][3]),
       vec3(m[2][0], m[2][2], m[2][3])
    ];
    var a32 = [
       vec3(m[0][0], m[0][1], m[0][3]),
       vec3(m[1][0], m[1][1], m[1][3]),
       vec3(m[2][0], m[2][1], m[2][3])
    ];
    var a33 = [
       vec3(m[0][0], m[0][1], m[0][2]),
       vec3(m[1][0], m[1][1], m[1][2]),
       vec3(m[2][0], m[2][1], m[2][2])
    ];



   a[0][0] = det3(a00)/d;
   a[0][1] = -det3(a10)/d;
   a[0][2] = det3(a20)/d;
   a[0][3] = -det3(a30)/d;
   a[1][0] = -det3(a01)/d;
   a[1][1] = det3(a11)/d;
   a[1][2] = -det3(a21)/d;
   a[1][3] = det3(a31)/d;
   a[2][0] = det3(a02)/d;
   a[2][1] = -det3(a12)/d;
   a[2][2] = det3(a22)/d;
   a[2][3] = -det3(a32)/d;
   a[3][0] = -det3(a03)/d;
   a[3][1] = det3(a13)/d;
   a[3][2] = -det3(a23)/d;
   a[3][3] = det3(a33)/d;

   return a;
}
function inverse(m)
{
   if(m.matrix != true) console.log("not a matrix");
   if(m.length == 2) return inverse2(m);
   if(m.length == 3) return inverse3(m);
   if(m.length == 4) return inverse4(m);
}

function normalMatrix(m, flag)
{
    var a = mat4();
    a = inverse(transpose(m));
    if(flag != true) return a;
    else {
    var b = mat3();
    for(var i=0;i<3;i++) for(var j=0; j<3; j++) b[i][j] = a[i][j];
    return b;
    }

}
