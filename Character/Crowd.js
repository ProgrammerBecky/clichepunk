import { 
    Group,
} from 'three';
import { G } from './../G.js';
import {
    clone,
} from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import { Character } from './Character.js';
import { NPC } from './NPC.js';

const CROWD_DIVERSITY = 5;

export class Crowd {
    constructor() {
    
        this.crowdMeshes = {
            m: [],
            f: [],
        };
        G.paths = [];
        G.npc = [];
        
        this.loadPath();
    }
    loadPath() {
    
        G.fbx.load( '3d/high/city/PedestrianPath.fbx' , result => {
            result.traverse( child => {
                if( child.name.indexOf( 'Path' ) === 0 ) {
                    G.paths.push({
                        nodes: child.children,
                        ends: [
                            {
                                ...child.children[0],
                                direction: 1,
                            },
                            {
                                ...child.children[ child.children.length - 1 ],
                                direction: -1,
                            }
                        ]
                    });
                }
            });
            this.loadCrowdModels();
        });
    
    }
    
    loadCrowdModels() {
        
        this.crowdIds = [];
        while( this.crowdIds.length < 1 + CROWD_DIVERSITY ) {
            const meshId = 1 + Math.floor( Math.random() * 15 );
            if( ! this.crowdIds.includes( meshId ) ) {
                this.crowdIds.push( meshId );
            }
        }
        
        let loaded = 0;
        for( let i=1 ; i<=CROWD_DIVERSITY ; i++ ) {
            loaded++;
            G.gltf.load( `3d/high/crowd/fnpc (${this.crowdIds[i-1]}).glb` , result => {
                this.crowdMeshes.f[i] = result.scene;
                loaded--;
                if( loaded === 0 ) {
                    this.spawnCrowd();
                }
            });
        }
        for( let i=1 ; i<=CROWD_DIVERSITY ; i++ ) {
            loaded++;
            G.gltf.load( `3d/high/crowd/mnpc (${this.crowdIds[i-1]}).glb` , result => {
                this.crowdMeshes.m[i] = result.scene;
                loaded--;
                if( loaded === 0 ) {
                    this.spawnCrowd();
                }
            });
        }        
    }
    
    spawnCrowd() {
        
        const moods = ['relaxed','happy','happy-smile','shock','anger','contempt','contempt-pout','confused','fear','sad'];
        
        for( let g in this.crowdMeshes ) {
            for( let i=1 ; i<=CROWD_DIVERSITY ; i++ ) {
                if( this.crowdMeshes[g][i] ) {
                    for( let n=1 ; n<=1 ; n++ ) {
                        const ent = clone( this.crowdMeshes[g][i] );
                        ent.name = `Character NPC ${g} ${i}`;
                        G.characters.push(
                            new Character(
                                'npc' , false , {
                                    ent: ent, 
                                    gender: g === 'f' ? 'Female' : 'Male',
                                    hairLength: 20,
                                }
                            )
                        );
                        ent.scale.set( 100 , 100 , 100 );
                        ent.position.set( Math.random() * 15000 - 12500 , 28 , Math.random() * 15000 - 12500 );
                        ent.rotation.set( 0 , Math.PI*2 * Math.random() , 0 );
                        G.scene.add( ent );
                        
                        const mood = moods[ Math.floor( Math.random() * moods.length ) ];
                        G.characters[ G.characters.length -1 ].setMood( mood );
                        
                        G.npc.push( new NPC( G.characters[ G.characters.length -1 ] ) );
                    }
                }
            }
        }
    }
    
    update( delta ) {
        G.npc.map( npc => {
            npc.update( delta );
        });
    }
    
}