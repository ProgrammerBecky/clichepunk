import {
    Vector3,
    Quaternion,
    
    Float32BufferAttribute,
    Object3D,
    Mesh,
    DoubleSide,
    
    BoxGeometry,
    MeshBasicMaterial,
} from 'three';
import { MeshBVH, acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh';
Mesh.prototype.raycast = acceleratedRaycast;

const tileSize = 5000;

let box = {
    min: {x:9999,z:9999},
    max: {x:-9999,z:-9999}
};
const region = ( pos ) => {
    const vert = new Vector3( pos.x , pos.y , pos.z );
    const x = 8 + Math.floor( vert.x / tileSize );
    const z = 8 + Math.floor( vert.z / tileSize );
    
    if( ! isNaN( x ) && ! isNaN( z ) ) {
        box = {
            min: {
                x: Math.min( x , box.min.x ),
                z: Math.min( z , box.min.z )
            },
            max: {
                x: Math.max( x , box.max.x ),
                z: Math.max( z , box.max.z )
            }
        };
       
        return { x,z };
    }
}
export const rebuildSingleSurface = ( mesh , rotatingElements , reverseRotatingElements ) => {
    
    let colliderPos = [];
    let colliderNorm = [];
    
    let matMeshes = [];
    for( let rx=0 ; rx<25 ; rx++ ) {
        matMeshes[rx] = [];
        for( let rz=0 ; rz<25 ; rz++ ) {
            matMeshes[rx][rz] = {};
        }
    }

    //mesh.updateWorldMatrix( true, true );

    let masterMesh = new Object3D();

    mesh.traverse( child => {
        if( rotatingElements.includes( child )
        ||  reverseRotatingElements.includes( child )
        ) {
            child.updateWorldMatrix( true, true );
            let vector = new Vector3(0,0,0);
            child.localToWorld( vector );
            child.position.set( vector.x , vector.y , vector.z );
            
            child.traverse( subchild => {
               if( subchild.isMesh ) {
                    subchild.castShadow = true;
                    subchild.receiveShadow = true;
               }                       
            });
            
            masterMesh.add( child );
        }
    });

    mesh.traverse( child => {

        const vector = new Vector3(0,0,0);
        child.localToWorld( vector );
        const r = region( vector );   
        if( ! r ) console.log( 'REMOVED MESH' , child );
        
        if( ! rotatingElements.includes( child )
        &&  ! reverseRotatingElements.includes( child )
        &&  r
        ) {
            
            if( child.isMesh && child.material ) {
        
                child.geometry.computeVertexNormals();
                const normal = child.geometry.getAttribute( 'normal' );
                const position = child.geometry.getAttribute( 'position' );
                const uv = child.geometry.getAttribute( 'uv' );
                
                const posArr = new Array( position.array.length ).fill(0);
                const newPosition = new Float32BufferAttribute( posArr , 3 , false );
                
                const norArr = new Array( normal.array.length ).fill(0);
                const newNormal = new Float32BufferAttribute( norArr , 3 , false );

                for( let i=0 ; i<position.count ; i++ ) {
                   let vector = new Vector3(position.array[i*3],position.array[i*3+1],position.array[i*3+2]);
                
                   if( child.scale.x < 0 ) vector.x = - vector.x;
                   if( child.scale.y < 0 ) vector.y = - vector.y;
                   if( child.scale.z < 0 ) vector.z = - vector.z;
                 
                   colliderPos.push( vector.x );
                   colliderPos.push( vector.y );
                   colliderPos.push( vector.z );
                   child.localToWorld( vector );
                   newPosition.array[i*3] = vector.x - r.x * tileSize;
                   newPosition.array[i*3+1] = vector.y;
                   newPosition.array[i*3+2] = vector.z - r.z * tileSize;

                   vector.set(
                        normal.array[i*3],
                        normal.array[i*3+1],
                        normal.array[i*3+2]
                    );
                   colliderNorm.push( vector.x );
                   colliderNorm.push( vector.y );
                   colliderNorm.push( vector.z );
                   newNormal.array[i*3] = vector.x;
                   newNormal.array[i*3+1] = vector.y;
                   newNormal.array[i*3+2] = vector.z;
                }
                
                if( Array.isArray( child.material ) ) {
                    
                    child.geometry.groups.map( (group,index) => {
                       
                       const material = child.material[ group.materialIndex ];
                       if( material ) {
                           
                           if( ! matMeshes[r.x][r.z][ material.name ] ) {
                               matMeshes[r.x][r.z][ material.name ] = [{
                                   normal: [],
                                   position: [],
                                   uv: [],
                                   material: material,
                                   count: 0,
                               }];
                           }
                           
                           let mindex = matMeshes[r.x][r.z][ material.name ].length-1;
                            if( matMeshes[r.x][r.z][ material.name ][mindex].count + position.count > 65536 ) {
                                matMeshes[r.x][r.z][ material.name ].push({
                                   normal: [],
                                   position: [],
                                   uv: [],     
                                    count: 0,                               
                                });
                                mindex++;
                            }
                             

                           for( let i=group.start ; i<group.start+group.count ; i++ ) {

                               for( let j=0 ; j<3 ; j++ ) {
                                    if( isNaN( newPosition.array[i*3+j] ) ) {
                                        console.log( 'ERROR isNaN (in group)' , index , child );
                                    }
                                    else {
                                        matMeshes[r.x][r.z][ material.name ][mindex].count++;
                                        matMeshes[r.x][r.z][ material.name ][mindex].normal.push( newNormal.array[i*3+j] );
                                        matMeshes[r.x][r.z][ material.name ][mindex].position.push( newPosition.array[i*3+j] );
                                    }
                                    
                               }
                               for( let j=0 ; j<2 ; j++ ) {
                                    matMeshes[r.x][r.z][ material.name ][mindex].uv.push( uv.array[i*2+j] );
                               }
                           }

                       }
                    });
                    
                }
                else {
                    
                    if( ! matMeshes[r.x][r.z][ child.material.name ] ) {
                        matMeshes[r.x][r.z][ child.material.name ] = [{
                           normal: [],
                           position: [],
                           uv: [],
                           material: child.material,      
                            count: 0,                               
                        }];
                    }
                    
                    let mindex = matMeshes[r.x][r.z][ child.material.name ].length-1;
                    if( matMeshes[r.x][r.z][ child.material.name ][mindex].count + position.count > 4294960000 ) {
                        matMeshes[r.x][r.z][ child.material.name ].push({
                           normal: [],
                           position: [],
                           uv: [],    
                            count: 0,                               
                        });
                        mindex++;
                    }
                    
                    for( let i=0 ; i<normal.array.length ; i++ ) {
                       if( isNaN( newPosition.array[i] ) ) {
                           console.log( 'ERROR isNaN' , child );
                       }
                       else {
                           matMeshes[r.x][r.z][ child.material.name ][mindex].count++;
                           matMeshes[r.x][r.z][ child.material.name ][mindex].normal.push( newNormal.array[i] );
                           matMeshes[r.x][r.z][ child.material.name ][mindex].position.push( newPosition.array[i] );
                       }
                    }
                    for( let i=0 ; i<uv.array.length ; i++ ) {
                        matMeshes[r.x][r.z][ child.material.name ][mindex].uv.push( uv.array[i] );                            
                    }
                }
            }
            
        }
    });
    
    console.log( box );
    
    masterMesh.name = 'City';
    for( let rx=0; rx<matMeshes.length ; rx++ ) {
        for( let rz=0 ; rz<matMeshes[rx].length ; rz++ ) {
            for( let i in matMeshes[rx][rz] ) {
                for( let j=0 ; j<matMeshes[rx][rz][i].length ; j++ ) {
                    const obj = new Mesh();
                    obj.position.set( rx*tileSize , 0 , rz*tileSize );
                    obj.name = `World${rx}x${rz}|${i}_${j}`;
                    
                    obj.geometry.setAttribute( 'normal' , new Float32BufferAttribute( matMeshes[rx][rz][i][j].normal , 3 , false ) );
                    obj.geometry.setAttribute( 'position' , new Float32BufferAttribute( matMeshes[rx][rz][i][j].position , 3 , false ) );
                    obj.geometry.setAttribute( 'uv' , new Float32BufferAttribute( matMeshes[rx][rz][i][j].uv , 2 , false ) );
                    //obj.geometry.computeVertexNormals();
                    obj.geometry.computeBoundingSphere();
                    obj.material = matMeshes[rx][rz][i][0].material;

                    if( ! obj.material.transparent ) {
                        obj.castShadow = true;
                    }
                    obj.receiveShadow = true;

                    obj.boundsTree = new MeshBVH( obj.geometry );
                    masterMesh.add( obj );
                }
            }
        }
    }
    
    return masterMesh;

}
