import {
    CanvasTexture
} from 'three';
import { G } from './../G.js';
const DEBUG = false;

const size = 2048;
const lightScale = 25;
const lightSize = 32;

export class Lighting {

    constructor() {
        this.lights = [];
        
        this.lastDrawHeight = -99999999;
        
        this.canvas = document.createElement( 'canvas' );
        this.canvas.width = size;
        this.canvas.height = size;
        this.context = this.canvas.getContext( '2d' );
    
        if( DEBUG ) {
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = 0;
            this.canvas.style.left = 0;
            this.canvas.style.zIndex = 99;
            document.body.appendChild( this.canvas );
        }
        
        this.context.clearRect(0,0,size,size);
        this.texture = new CanvasTexture( this.canvas );
        this.texture.flipY = false;
        
    }
    addLights( lights ) {
        lights.map( light => {
           this.lights.push( light ); 
        });
    }
    update( delta ) {
        
        if( Math.abs( G.camera.position.y - this.lastDrawHeight ) > 32
        ||  G.camera.position.x/500 !== this.lastDrawX
        ||  G.camera.position.z/500 !== this.lastDrawZ
        ) {
            
            this.lastDrawX = G.camera.position.x / 500;
            this.lastDrawZ = G.camera.position.z / 500;
            
            this.lastDrawHeight = G.camera.position.y
            
            this.pixels = new ImageData( size , size );
            const rescale = size * lightScale;
            let gx,gz;
        
            this.lights.map( light => {

                let lx = ( light.position.x ) / rescale + 0.5;
                lx = Math.floor( lx * size );
                
                const cx = Math.abs( light.position.x - G.camera.position.x );
                const cz = Math.abs( light.position.z - G.camera.position.z );
                if( cx < 4000 || cz < 4000 ) {

                    if( lx > -lightSize && lx<size+lightSize ) {
                        
                        let lz = ( light.position.z ) / rescale + 0.5;
                        lz = Math.floor( lz * size );
                        

                        if( lz >= -lightSize && lz<size+lightSize ) {
                            
                            let height = Math.abs( light.position.y - G.camera.position.y );
                            if( height < 450 ) {

                                this.drawLight(
                                    Math.floor( lx ),
                                    Math.floor( lz ),
                                    lightSize,
                                    light.color,
                                    height < 128 ? 1 : height < 256 ? 0.75 : height < 350 ? 0.5 : 0.25,
                                );
                                
                            }
                        }
                    }
                }
               
            });

            this.context.putImageData( this.pixels, 0,0 );
            this.texture.needsUpdate = true;

        }
        
    }
    drawLight( x , z , sz , color , brightness ) {
        
        for( let px=x-sz ; px<x+sz ; px++ ) {
            if( px>=0 && px<size ) {
                for( let pz=z-sz ; pz<z+sz ; pz++ ) {
                    if( pz>=0 && pz<size ) {
                        
                        const dx = px-x;
                        const dz = pz-z;
                        const pr = Math.sqrt( dx*dx + dz*dz );
                        if( pr <= sz ) {
                            
                            const index = ( pz*size + px ) * 4;
                            
                            const strength = Math.min( 255 , brightness * ( ( 120 * (sz-pr) ) / sz ) );
                            
                            this.pixels.data[ index+0 ] = Math.min( 255 , this.pixels.data[ index+0 ] + Math.floor( strength * color.r ) );
                            this.pixels.data[ index+1 ] = Math.min( 255 , this.pixels.data[ index+1 ] + Math.floor( strength * color.g ) );
                            this.pixels.data[ index+2 ] = Math.min( 255 , this.pixels.data[ index+2 ] + Math.floor( strength * color.b ) );
                            this.pixels.data[ index+3 ] = 255;
                        
                        }
                        
                    }
                }
            }
        }
        
    }
    fireGun( vector ) {
        this.gunFireLight = {
            vector,
            intensity: 1
        };
        this.lastDrawHeight = -99999999;
    }
    
    applyLights( material ) {

        if( typeof( material.hasLightMap ) == 'undefined' ) {
            
            if( typeof( material.metalness ) !== 'number' ) return material;
            
            material.hasLightMap = true;
            material.lightMap = this.texture;
            material.lightMapIntensity = 1.0;

            material.onBeforeCompile = function ( shader ) {

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
                lightMapTexel = vec4( lightMapTexel1.r*0.5 , lightMapTexel1.g*0.5 , lightMapTexel1.b*0.5 , 1.0 );
            } else {
                lightMapTexel = vec4( lightMapTexel2.r*1.0 , lightMapTexel2.g*1.0 , lightMapTexel2.b*1.0 , 1.0 );
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
                
                material.userData.shader = shader;

            };				
            
        }    

        return material;        
    }

}