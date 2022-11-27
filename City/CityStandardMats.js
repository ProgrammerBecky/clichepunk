import {
    MeshStandardMaterial,
    MeshBasicMaterial,
} from 'three';
import { G } from './../G.js';

export const prefabs = [
    'Tunnel_A',
    'Tunnel_B',
    'Llift_01_Guide Rail',
    'Llift_01',
];

export const glossyColour = ( hex ) => {
    return new MeshStandardMaterial({
       color: hex,
       envMap: G.environmentMap,
       metalness: 0.8,
       roughness: 0.8,                  
    });        
}
    
export const standardColour = ( hex ) => {
    return new MeshStandardMaterial({
       color: hex,
       envMap: G.environmentMap,
       metalness: 0.2,
       roughness: 0.8,                
    });
}

export const standardTexture = ( texture ) => {
    return new MeshStandardMaterial({
       map: G.texture.load( '3d/high/city/Imports/' + texture ),
       envMap: G.environmentMap,
       metalness: 0.2,
       roughness: 0.8,                        
    });
}
export const halfAlphaTest = ( texture ) => {
    return new MeshStandardMaterial({
       map: G.texture.load( '3d/high/city/Imports/' + texture ),
       envMap: G.environmentMap,
       metalness: 0.2,
       roughness: 0.8,
       transparent: true,
       depthTest: true,
       depthWrite: false,
       alphaTest: 0.5,
    });
}
export const quarterAlphaTest = ( texture ) => {
    return new MeshStandardMaterial({
       map: G.texture.load( '3d/high/city/Imports/' + texture ),
       envMap: G.environmentMap,
       metalness: 0.2,
       roughness: 0.8,
       transparent: true,
       depthTest: true,
       depthWrite: false,
       alphaTest: 0.2,
    });
}

export const emissiveColour = ( hex ) => {
    return new MeshStandardMaterial({
       color: hex,
       emissive: hex,
       metalness: 0.2,
       roughness: 0.8,
    });
}

    