import {
    MeshStandardMaterial,
    MeshBasicMaterial,
    Vector3,
    Quaternion,
    Color,
    VideoTexture,
    Object3D,
    
    DoubleSide,
} from 'three';
import { G } from './../G.js';
import { GLTFExporter } from '/node_modules/three/examples/jsm/exporters/GLTFExporter.js';

export const pipelineExport = () => {
    document.getElementById('Save').addEventListener( 'click' , () => {

        G.world.advertTimer = -60000;

        for( let i in G.world.mat ) {
            G.world.mat[i] = new MeshBasicMaterial({
                name: i,
                color: new Color( Math.random() , Math.random() , Math.random() ),
            });
            G.world.mat[i].needsUpdate = true;
        }

        G.world.ent.traverse( child => {
            if( child.isMesh ) {
                if( child.name.toLowerCase().indexOf( 'stairs' ) > -1 ) {
                    if( Array.isArray( child.material ) ) {
                        console.log( child.material.length , child.name , child );
                    }
                    else {
                        console.log( '-' , child.name , child.material );
                    }
                    console.log( child.name ,  child );
                }
                if( Array.isArray( child.material ) ) {
                    child.material.map( mat => {
                        if( mat.isShaderMaterial ) console.log( '>>' , mat.name );
                        if( ! mat.name ) console.error( 'NO MAT NAME' , child , child.material );
                        mat = G.world.mat[ mat.name ];
                    });
                }              
                else {
                    if( child.material ) {
                        if( child.material.isShaderMaterial ) console.log( '>>' , mat.name );
                        if( ! child.material.name ) console.error( 'NO MAT NAME' , child , child.material );
                        child.material = G.world.mat[ child.material.name ];
                        child.material.needsUpdate = true;
                    }
                    else {
                        console.log( child );
                        console.error( 'MISSING MATERIAL?' );
                    }
                }
            }
        });

        setTimeout( () => {
            console.log( 'EXPORT START' );
                const exporter = new GLTFExporter();
                exporter.parse(
                    G.world.ent,
                    ( gltf ) => {
                        console.log( 'GLTF' );
                        console.log( gltf );

                        const blob = new Blob( [ JSON.stringify( gltf, null, 2 ) ], { type: 'text/plain' } );
                        
                        const link = document.createElement( 'a' );
                        link.style.display = 'none';
                        document.body.appendChild( link );
                        
                        link.href = URL.createObjectURL( blob );
                        link.download = 'City.gltf';
                        link.click();

                        document.body.removeChild( link );

                    },
                    {
                        onlyVisible: false,
                        binary: false,
                    }
                );
        } , 1000 );        
    });
}

