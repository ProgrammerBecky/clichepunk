import {
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    CanvasTexture,
    Raycaster,
    Vector3,
} from 'three';
import { ImprovedNoise } from '/node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { G } from './../G.js';

import { worldMat } from './WorldMat.js';

export class World {

    constructor() {
        this.width = 2048;
        this.height = 2048;

        this.raycaster = new Raycaster();
        this.source = new Vector3(0,0,0);
        this.vector = new Vector3(0,-1,0);
        
        this.generateGeometry();
        
    }
    
    generateLightmap() {
        
        this.worker = new Worker( './World/WorldLightmap.js' );
        this.worker.onmessage = (e) => {
            if( e.data.type === 'update' ) {
                this.lightMapTexture.needsUpdate = true;
            }
        }
        this.canvas = document.createElement( 'canvas' );
        this.canvas.width = 2048;
        this.canvas.height = 2048;
        
        const offscreen = this.canvas.transferControlToOffscreen();
        this.worker.postMessage({
            type: 'init',
            canvas: offscreen,
            heightMap: this.data,
            width: this.width,
            height: this.height,
        }, [offscreen] );

        this.lightMapTexture = new CanvasTexture( this.canvas );
        return this.lightMapTexture;

    }

    generateGeometry() {
        
        const geo = new PlaneGeometry( this.width*50 , this.height*50 , this.width-1 , this.height-1 );
        geo.rotateX( - Math.PI/2 );
        
        let vertices = geo.attributes.position.array;
        
        this.data = this.generateData();
        for( let i=0, j=0; i<vertices.length; i++, j+=3 ) {
            vertices[ j+1 ] = this.data[i] * 10;
        }
        
        geo.computeVertexNormals();
        
        const mat = worldMat( this.generateLightmap() );
        
        this.terrain = new Mesh( geo , mat );
        this.terrain.traverse( child => {
            if( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        G.scene.add( this.terrain );
        
    }
    
    getHeight(x,z) {
        this.source.set(x,5000,z);
        this.raycaster.set( this.source , this.vector );
        
        const intersects = this.raycaster.intersectObject( this.terrain );
        if( intersects[0] ) {
            return intersects[0].point.y;
        }
        return 0;
    }

    generateData() {
    
        //Settings
        let quality = 1;
        const z = 1;
        
        //Internals
        const size = this.width * this.height;
        let data = new Uint8Array( size );
        const perlin = new ImprovedNoise();
        
        for( let j=0 ; j<4 ; j++ ) {
            for( let i=0 ; i<size ; i++ ) {

                const x = i % this.width;
                const y = ~ ~ ( i / this.width );
                data[i] += Math.abs( perlin.noise( x/quality  , y/quality , z ) * quality );
             
            }
            quality *= 6;
        }
        
        return data;
        
    }

}