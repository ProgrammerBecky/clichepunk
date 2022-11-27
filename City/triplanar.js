import {
    Color,
    RepeatWrapping,
    LinearFilter,
    FrontSide,
    Vector2,
    MeshStandardMaterial,
} from 'three';
import { G } from './../G.js';

export const triplanar = ( material ) => {

    material.onBeforeCompile = ( shader , renderer ) => {

      //shader.uniforms.lightMap = { type: 't', value: lightMap };
      //shader.uniforms.needsUpdate = true;

      /* Tri-Planar Mapping */
      shader.vertexShader = shader.vertexShader.replace( 'varying vec3 vViewPosition;' , `
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
`);
      shader.vertexShader = shader.vertexShader.replace( '#include <fog_vertex>' , `
#include <fog_vertex>
vWorldPosition = worldPosition.xyz;
`);

console.log( shader.vertexShader );
//uniform sampler2D lightMap;

      shader.fragmentShader = shader.fragmentShader.replace( 'varying vec3 vViewPosition;' , `
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

vec3 blendWeights;

vec3 mapN;

vec4 blendedDiffuseColor;
`);
      shader.fragmentShader = shader.fragmentShader.replace( 'void main() {' , `
vec3 rebalanceBlendWeights( vec3 wt ) {
  
  if( wt.x < 0.05 ) {
    wt.x = ( wt.x - 0.025 ) * 2.0;
  }
  if( wt.y < 0.5 ) {
  wt.y = ( wt.y - 0.025 ) * 2.0;
  }
  if( wt.z < 0.5 ) {
    wt.z = ( wt.z - 0.025 ) * 2.0;
  }

  wt = normalize( wt );
  return wt;
  
}
void main() {
`);



      shader.fragmentShader = shader.fragmentShader.replace( '#include <map_fragment>' , `
blendWeights = abs((inverse(viewMatrix) * vec4(vNormal, 0.0)).xyz);
//blendWeights = rebalanceBlendWeights( blendWeights / (blendWeights.x + blendWeights.y + blendWeights.z) );

vec2 uvcy = mod( vWorldPosition.xz * 0.01 , 1.0 );
vec2 uvcx = mod( vWorldPosition.zy * 0.01 , 1.0 );
vec2 uvcz = mod( vWorldPosition.xy * 0.01 , 1.0 );

if( blendWeights.x > 0.05 ) {
    vec3 xDiff = texture2D(map, uvcx).xyz;
    blendedDiffuseColor += vec4(xDiff * blendWeights.x, 1.0);  

    vec3 xNormal =  texture2D(normalMap, uvcx).xyz;
    mapN += (xNormal * blendWeights.x);
}

if( blendWeights.y > 0.05 ) {
    vec3 yDiff = texture2D(map, uvcy).xyz;
    blendedDiffuseColor += vec4( yDiff * blendWeights.y, 1.0);  

    vec3 yNormal =  texture2D(normalMap, uvcy).xyz;
    mapN += (yNormal * blendWeights.y);
}

if( blendWeights.z > 0.05 ) {
    vec3 zDiff = texture2D(map, uvcz).xyz;     
    blendedDiffuseColor += vec4(zDiff * blendWeights.z, 1.0);  

    vec3 zNormal =  texture2D(normalMap, uvcz).xyz;    
    mapN += (zNormal * blendWeights.z);
}


#ifdef DECODE_VIDEO_TEXTURE
  blendedDiffuseColor = vec4( mix( pow( blendedDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), blendedDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( blendedDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), blendedDiffuseColor.w );
#endif

diffuseColor *= blendedDiffuseColor;

`);

      shader.fragmentShader = shader.fragmentShader.replace( '#include <normal_fragment_maps>', `
mapN.xy *= normalScale;
#ifdef USE_TANGENT
  normal = normalize( vTBN * mapN );
#else
  normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
#endif
`);
      
    }
    
    return material;

}