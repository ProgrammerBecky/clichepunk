import {
    Object3D,
} from 'three';
import { G } from './../G.js';

const size = 2048;
const lightScale = 25;

export const applyHologram = ( material ) => {

    material.onBeforeCompile = function ( shader ) {

        shader.fragmentShader = shader.fragmentShader.replace( 'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;' , `
float hologram = min( 1.0 , mod( vViewPosition.y , 10.0 ) / 5.0 ) / 4.0;
vec3 holoLight = vec3( 0.0 , hologram * 0.5 , hologram );
vec3 outgoingLight = vec3(
    min( 1.0 , ( totalDiffuse.r + totalSpecular.r + totalEmissiveRadiance.r ) * 2.0 ),
    min( 1.0 , max( holoLight.g , ( totalDiffuse.g + totalSpecular.g + totalEmissiveRadiance.g ) * 3.0 ) ),
    min( 1.0 , max( holoLight.b , ( totalDiffuse.b + totalSpecular.b + totalEmissiveRadiance.b ) * 4.0 ) )
);
`);
        material.userData.shader = shader;

    };				
        
    return material;     
    
}
