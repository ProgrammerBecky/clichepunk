import {
    Object3D,
} from 'three';
import { G } from './../G.js';

const size = 2048;
const lightScale = 25;

export const applyHairShader = ( child , hairLength ) => {

    const noiseTexture = G.texture.load( '3d/high/hair/noise.png' );

    let materialList = [];
    
    child.material.envMap = G.environmentMap;
    
    for( let shell=0; shell<hairLength ; shell++ ) {
        
        const material = child.material.clone();
        material.envMap = G.environmentMap;
        material.envMapIntensity = G.environmentMapIntensity;
        
        material.hasLightMap = true;
        material.lightMap = G.lighting.texture;
        material.lightMapIntensity = 1.0;

        material.onBeforeCompile = ( shader , renderer ) => {

            const discardFactor = 1.5 * hairLength;

            shader.uniforms.shell = { value: shell + 1 };
            shader.uniforms.noiseMap = { type: 't', value: noiseTexture };
            shader.uniforms.needsUpdate = true;

/* Start Hair Shell Shader */       
            shader.vertexShader = shader.vertexShader.replace( 'varying vec3 vViewPosition;' , `
varying vec3 vViewPosition;
uniform float shell;
`);
            shader.vertexShader = shader.vertexShader.replace( '#include <begin_vertex>' , `#include <begin_vertex>
transformed += normal * 0.001 * shell;
`);

            shader.vertexShader = shader.vertexShader.replace( '#include <project_vertex>' , `
vec4 gravity = vec4( 0.0 , - 0.000008 * pow( shell , 1.5 ) , 0.0 , 1.0 ) * modelMatrix;
transformed = transformed.xyz + gravity.xyz;
#include <project_vertex>
`);

            shader.fragmentShader = shader.fragmentShader.replace( 'varying vec3 vViewPosition;' , `varying vec3 vViewPosition;
uniform float shell;
uniform sampler2D noiseMap;
`);
            shader.fragmentShader = shader.fragmentShader.replace( '#include <clipping_planes_fragment>' , `#include <clipping_planes_fragment>
float noise = texture2D( noiseMap , vUv ).r;
if( noise * ${discardFactor.toFixed(1)} < shell ) discard;
`);
/* end Hair Shell Shader */
        
/* start Light Shader  ..... */
                const rescale = size*lightScale;

                shader.vertexShader = shader.vertexShader.replace( '#define STANDARD' , `#define STANDARD
varying vec2 worldUV;
varying vec2 worldUV2;
varying float height;`
                );

                shader.vertexShader = shader.vertexShader.replace( '#include <fog_vertex>' , `#include <fog_vertex>
worldUV = vec2( (worldPosition.x ) / ${rescale.toFixed(1)} + 0.5 , (worldPosition.z ) / ${rescale.toFixed(1)} + 0.5 );
worldUV = vec2( floor( worldUV.x * ${size.toFixed(1)} ) / ${size.toFixed(1)} , floor( worldUV.y * ${size.toFixed(1)} ) / ${size.toFixed(1)} );
height = 1.0 - ( abs( worldPosition.y - cameraPosition.y )  / 512.0 );

vec3 worldNrm = inverseTransformDirection( transformedNormal, viewMatrix );
vec3 extrudePosition = (worldPosition.xyz) + worldNrm.xyz * vec3( 100.0 );
worldUV2 = vec2( extrudePosition.x / ${rescale.toFixed(1)} + 0.5 , extrudePosition.z / ${rescale.toFixed(1)} + 0.5 );
worldUV2 = vec2( floor( worldUV2.x * ${size.toFixed(1)} ) / ${size.toFixed(1)} , floor( worldUV2.y * ${size.toFixed(1)} ) / ${size.toFixed(1)} );`
                );
                
                if( shader.vertexShader.indexOf( '#define STANDARD' ) === -1 ) {
				
					shader.vertexShader = shader.vertexShader.replace( '#include <fog_vertex>' , `#include <fog_vertex>
vec4 worldPosition = modelViewMatrix * vec4( position.xyz , 1.0 );`
                    );		
                }
                
				shader.fragmentShader = shader.fragmentShader.replace( 'varying vec3 vViewPosition;' , `varying vec3 vViewPosition;
varying vec2 worldUV;
varying vec2 worldUV2;
varying float height;`
                );
											
				shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_maps>' , `
#if defined( RE_IndirectDiffuse )
    #ifdef USE_LIGHTMAP
        vec4 lightMapTexel;
        vec3 lightMapTexel1 = texture2D( lightMap, worldUV ).rgb * vec3( height , height , height );

        float texelA = ( lightMapTexel1.r + lightMapTexel1.g + lightMapTexel1.b );

        if( texelA > 0.0 && height > 0.0 ) {
            vec3 lightMapTexel2 = texture2D( lightMap, worldUV2 ).rgb * vec3( height , height , height );
            
            float texelB = ( lightMapTexel2.r + lightMapTexel2.g + lightMapTexel2.b );
                                                            
            if( texelA > texelB ) {
                lightMapTexel = vec4( lightMapTexel1.r*0.25 , lightMapTexel1.g*0.23 , lightMapTexel1.b*0.2 , 1.0 );
            } else {
                lightMapTexel = vec4( lightMapTexel2.r*1.1 , lightMapTexel2.g*1.0 , lightMapTexel2.b*0.8 , 1.0 );
            }
            
        }
        
        vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
        #ifndef PHYSICALLY_CORRECT_LIGHTS
            lightMapIrradiance *= PI; // factor of PI should not be present; included here to prevent breakage
        #endif
        irradiance += lightMapIrradiance;
    #endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`
                );   
/* end Light Shader */    
    
        }
    
        materialList.push( material );
    }
    
    for( let shell=0 ; shell<hairLength ; shell++ ) {
        let newMesh = child.clone();
        newMesh.skeleton = child.skeleton;
        newMesh.name = 'HairLayer' + (shell+1);
        newMesh.material = materialList[shell];
        newMesh.material.needsUpdate = true;
        newMesh.receiveShadow = true;
        child.parent.add( newMesh );
    }
    
}
