import {
    Vector3,
    AnimationMixer,
    AnimationClip,
    MeshStandardMaterial,
    PlaneGeometry,
    Mesh,
    PositionalAudio,
    LoopOnce,
} from 'three';
import { G } from './G.js';
import {
    clone,
} from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';

export class Mobs {

    constructor() {
    
        this.deadRats = 0;
    
        this.list = [];
        this.masterMeshes = {};
        this.animations = {};
        this.paths = {};
        
        G.fbx.load( '3d/high/city/RatPath.fbx' , result => {
           this.paths.Rat = result;
        });
        
        G.fbx.load( '3d/high/city/SpaceInvaderPath.fbx' , result => {
           this.paths.SpaceInvader = result; 
        });
        
        G.gltf.load( '3d/high/rat/Rat.glb' , result => {
            this.masterMeshes.Rat = result.scene;
            this.animations.Rat = result.animations;
        });
        
        this.bloodMaterial = G.lighting.applyLights( new MeshStandardMaterial({
            map: G.texture.load( '3d/high/bloodSplat.png' ),
            alphaMap: G.texture.load( '3d/high/bloodSplatAlpha.png' ),
            metalness: 0.4,
            roughness: 0,
            transparent: true,
        }) );

        G.audio.load( `Speech/Squelch.ogg` , buffer => {
            this.squelchSound = buffer;
        });
        
    }
    spawnRats() {
        G.music.play( 'radio (2)' );
        for( let i=0 ; i<10 ; i++ ) {
            this.spawn({
                type: 'Rat',
                position: new Vector3( -2814.339945071612 - Math.random() * 2500 , 25.340579197273314, -20888.42820164742 ),
            });
        }
        this.ratPrompt = false;
    }
    spawnDeathScene() {

        G.music.fadeMusic();

        const geo = new PlaneGeometry( 350,350, 5,5 );
        const obj = new Mesh( geo , this.bloodMaterial );
        obj.position.set( G.quests.characters.StudentSally.ent.position.x , G.quests.characters.StudentSally.ent.position.y + 1 , G.quests.characters.StudentSally.ent.position.z );
        obj.rotation.set( - Math.PI/2 , 0 , 0 );        
        G.scene.add( obj );
        G.corpses.add( obj );
        
        for( let g in G.crowd.crowdMeshes ) {
            for( let i=1 ; i<G.crowd.crowdMeshes[g].length/2 ; i++ ) {
                
                const ent = clone( G.crowd.crowdMeshes[g][i] );
                ent.name = `Corpse NPC ${g} ${i}`;
                ent.scale.set( 100 , 100 , 100 );
                G.corpses.add( ent );
                
                const vector = new Vector3( 
                    G.characters[0].ent.position.x + Math.random() * 2000 - 1000,
                    G.characters[0].ent.position.y,
                    G.characters[0].ent.position.z + Math.random() * 2000 - 1000
                );
                const { floorHeight } = G.world.getHeight( vector , true );
                vector.y = floorHeight;
                
                ent.position.set( vector.x , vector.y , vector.z );
                ent.rotation.set( 0 , Math.PI*2 * Math.random() , 0 );
                
                let anim = Math.floor( Math.random() * 2 ) + 1;
                const mixer = new AnimationMixer( ent );

                const clip = AnimationClip.findByName( G.animations[ (g==='m') ? 'Male' : 'Female' ] , `Die${anim}` );
                let action = mixer.clipAction( clip );
                action.setLoop( LoopOnce );
                action.clampWhenFinished = true;
                action.play();
                mixer.update( 100000 );
                
                ent.traverse( child => {
                    if( child.morphTargetInfluences &&  child.morphTargetInfluences.length > 0 ) {
                        let morphs = [];
                        for ( const [ key, value ] of Object.entries( child.morphTargetDictionary ) ) {
                            morphs[key] = value;
                        }
                        
                        morphs.map( (morph,index) => {
                            if( ['eyeWideLeft','eyeWideRight','browInnerUp','browOuterUpLeft','browOuterUpRight'].includes( morph ) ) {
                                child.morphTargetInfluences[ index ] = 1;
                            }
                            if( ['noseSneerLeft','noseSneerRight'].includes( morph ) ) {
                                child.morphTargetInfluences[ index ] = 0.2;
                            }
                            if( ['jawOpen'].includes( morph ) ) {
                                child.morphTargetInfluences[ index ] = 0.4;
                            }
                        });
                    }                        
                });
                
                const geo = new PlaneGeometry( 500,500, 5,5 );
                const obj = new Mesh( geo , this.bloodMaterial );
                obj.position.set( vector.x , vector.y + 1 + Math.random(), vector.z );
                obj.rotation.set( - Math.PI/2 , 0 , 0 );
                
                G.corpses.add( ent );
                G.corpses.add( obj );
                G.scene.add( ent );
                G.scene.add( obj );
                
            }
        }
        
        if( G.quests.characters.StudentSally ) {
            G.quests.characters.StudentSally.mixer._actions.map( (action,index) => {
                action.setEffectiveWeight( 0 );
            });
            G.quests.characters.StudentSally.mixer.update(1);
            G.corpses.add( G.quests.characters.StudentSally.ent );
            
            let mixer = new AnimationMixer( G.quests.characters.StudentSally.ent );
            const clip = AnimationClip.findByName( G.animations['Female' ] , 'Die1' );
            let action = mixer.clipAction( clip );
            action.setLoop( LoopOnce );
            action.clampWhenFinished = true;
            action.play();
            mixer.update( 100000 );
            
            delete G.quests.characters.StudentSally;
            for( var i in G.quests.quests ) {
                if( i.substr( 0,10 ) === 'Schoolwork' ) {
                    delete G.quests.quests[i];
                }
            }
        }
                
    }
    checkInvaderDeath( ent ) {
        let index = false;

        while( ent !== G.scene && ! index ) {
            if( typeof( ent._spaceInvaderIndex ) !== 'undefined' ) {
                index = ent._spaceInvaderIndex;
            }
            ent = ent.parent;
        }

        if( index !== false ) {
            let mob = this.list[ index ];
            if( mob ) {
                mob.sound.stop();
                mob.sound = new PositionalAudio( G.listener );
                mob.sound.setBuffer( this.InvaderDeathAudioBuffer );
                mob.sound.setRefDistance( 500 );
                mob.ent.add( mob.sound );
                mob.sound.play();
                mob.type = 'SpaceInvaderDead';
                G.player.invadersKilled++;
                
                if( G.player.invadersKilled >= 10 ) {
                    document.body.removeChild( G.lewisGunPrompt );
                    G.lewisGunPrompt = false;
                    
                    G.exitSimPrompt = document.createElement( 'div' );
                    G.exitSimPrompt.classList.add( 'options' );
                    G.exitSimPrompt.innerHTML = '[F] Exit Combat Sim';
                    document.body.appendChild( G.exitSimPrompt );
                    
                }
            }
        }
    }
    spawnSpaceInvaders( type ) {
        
        G.music.play( 'radio (1)' );
        let self = this;
        
        G.audio.load( 'Speech/SpaceInvaderDeath.ogg' , buffer => {
           self.InvaderDeathAudioBuffer = buffer; 
        });
        
        G.gltf.load( `3d/high/spaceInvaders/${type}.glb` , result => {

            result.scene.traverse( child => {
               if( child.isMesh ) {
                    if( child.material.name === 'FitGrandma_Brows_MAT1' ) {
                        child.material.transparent = true;
                    }
                    if( child.material.name === 'Lens_MAT' ) {
                        child.material.transparent = true;
                        child.material.opacity = 0.2;
                    }
               }                   
            });
            this.masterMeshes.SpaceInvader = result.scene;
            this.animations.SpaceInvader = result.animations;
            for( let i=0 ; i<10 ; i++ ) {
                this.spawn({
                    type: 'SpaceInvader',
                    position: new Vector3( 15527.497863769531 , 486.9999885559082 , -723.6602783203125 ),
                });
                G.mobs.list[ G.mobs.list.length - 1 ].ent.traverse( child => {
                   child._spaceInvaderIndex =  G.mobs.list.length - 1;
                });
                G.mobs.list[ G.mobs.list.length - 1 ].delay = i * Math.random() * 2;
                G.mobs.list[ G.mobs.list.length - 1 ].speed = 300 + i * 40;
                G.mobs.list[ G.mobs.list.length - 1 ].ent.visible = false;
            }
            
            G.audio.load( 'Speech/SpaceInvader.ogg' , buffer => {
                for( let i=1 ; i<=10 ; i++ ) {
                    G.mobs.list[ G.mobs.list.length - i ].sound = new PositionalAudio( G.listener );
                    G.mobs.list[ G.mobs.list.length - i ].sound.setBuffer( buffer );
                    G.mobs.list[ G.mobs.list.length - i ].sound.setRefDistance( 250 );
                    G.mobs.list[ G.mobs.list.length - i ].sound.setLoop( true );
                    G.mobs.list[ G.mobs.list.length - i ].ent.add( G.mobs.list[ G.mobs.list.length - i ].sound );
                }
            });
            
        });
    }
    spawn({ type , position }) {
    
        const newMob = {
            ent: clone( this.masterMeshes[type] ),
            type: type,
            target: false,
            animMode: 'Walk',
        };
        
        newMob.mixer = new AnimationMixer( newMob.ent );
        if( type === 'SpaceInvader' ) {
            newMob.animMode = 'SpaceInvader';
            const clipInvade = AnimationClip.findByName( this.animations.SpaceInvader , 'SpaceInvader' );
                    
            const actionInvade = newMob.mixer.clipAction( clipInvade );
            actionInvade.setLoop( true );
            actionInvade.setEffectiveWeight( 1 );
            actionInvade.play();
        }
        else if( type === 'Rat' ) {
            const clipWalk = AnimationClip.findByName( this.animations.Rat , 'Walk' );
            const clipIdle = AnimationClip.findByName( this.animations.Rat , 'Idle' );
        
            const actionWalk = newMob.mixer.clipAction( clipWalk );
            actionWalk.setLoop( true );
            actionWalk.setEffectiveWeight( 1 );
            actionWalk.play();
            
            const actionIdle = newMob.mixer.clipAction( clipIdle );
            actionIdle.setLoop( true );
            actionIdle.setEffectiveWeight( 0 );
            actionIdle.play();
            
            newMob.ent.scale.set( 3,3,3 );
        }
        
        newMob.ent.position.set( position.x , position.y , position.z );
        newMob.ent.traverse( child => {
            if( child.isMesh ) {
                child.material = G.lighting.applyLights( child.material );
            }               
        });
        G.scene.add( newMob.ent );
        
        this.list.push( newMob );
    
    }
    update( delta ) {
        
        this.showRatPrompt = false;
        this.list.map( mob => {
           if( mob.type === 'Rat' ) this.doRat( mob , delta );
           else if( mob.type === 'SpaceInvader' ) this.doSpaceInvader( mob , delta );
           else if( mob.type === 'SpaceInvaderDead' ) this.doDeadSpaceInvader( mob , delta );
        });
        
        if( this.showRatPrompt && ! this.ratPrompt ) {
            this.ratPrompt = document.createElement( 'div' );
            this.ratPrompt.classList.add( 'options' );
            this.ratPrompt.innerHTML = '[F] Stomp Nazi Rat';
            document.body.appendChild( this.ratPrompt );
        }
        else if( ! this.showRatPrompt && this.ratPrompt ) {
            document.body.removeChild( this.ratPrompt );
            this.ratPrompt = false;
        }
    }
    doDeadSpaceInvader( mob , delta ) {
        if( ! mob.speed ) {
            mob.speed = 800;
        }

        mob.ent.position.y += mob.speed * delta;
        mob.speed -= delta * 10;
        
        let scale = 1;
        for( let i=1 ; i<delta * 100 ; i++ ) {
            scale *= 0.99;
        }
        
        mob.ent.traverse( child => {
            if( child.isBone ) {
                child.scale.set( child.scale.x *= scale , child.scale.y *= scale , child.scale.z *= scale );
            }               
        });
    }
    splatRats() {
        this.list.map( (mob,index) => {
           if( mob.type === 'Rat' ) {
                const cx = G.characters[0].ent.position.x + Math.sin( G.characters[0].ent.rotation.y ) * 75;
                const cz = G.characters[0].ent.position.z + Math.cos( G.characters[0].ent.rotation.y ) * 75;
                const dx = cx - mob.ent.position.x;
                const dz = cz - mob.ent.position.z;
                const dr = Math.sqrt( dx*dx + dz*dz );
                if( dr < 85 ) {
                    this.deadRats++;
                    mob.type = 'DeadRat';
                    mob.ent.scale.set( 3,0.01,3 );
                    G.corpses.add( mob.ent );
                    
                    const geo = new PlaneGeometry( 100,100, 1,1 );
                    const obj = new Mesh( geo , this.bloodMaterial );
                    obj.position.set( mob.ent.position.x , mob.ent.position.y+0.03 * Math.random() , mob.ent.position.z );
                    obj.rotation.set( - Math.PI/2 , 0 , 0 );
                    G.scene.add( obj );
                    G.corpses.add( obj );

                    const soundElement = new PositionalAudio( G.listener );
                    soundElement.setRefDistance( 100 );
                    mob.ent.add( soundElement ); 
                    soundElement.setBuffer( this.squelchSound );
                    soundElement.play();
         
                    return this.list.splice( index , 1 );
                }
           }               
        });
    }
    doSpaceInvader( mob , delta ) {
        mob.mixer.update( delta );
        if( mob.delay > 0 ) {
            mob.delay -= delta;
        }
        else {
        
            if( ! mob.path ) {
                mob.path = Object.assign( {} , this.paths[ mob.type ].children[0] );
                mob.node = 0;
                mob.target = new Vector3( mob.path.children[ mob.node ].position.x , mob.path.children[ mob.node ].position.y , mob.path.children[ mob.node ].position.z );
            }
            
            if( mob.target ) {
                const dx = mob.target.x - mob.ent.position.x;
                const dy = mob.target.y - mob.ent.position.y;
                const dz = mob.target.z - mob.ent.position.z;
                const df = Math.atan2( dx , dz );
                const dr = Math.sqrt( dx*dx + dz*dz );
                
                if( dr >= 25 ) {
                    mob.ent.position.x += Math.sin( df ) * delta * mob.speed;
                    mob.ent.position.z += Math.cos( df ) * delta * mob.speed;
                }
                if( Math.abs( dy ) > 5 ) {
                    if( dy > 0 ) {
                        mob.ent.position.y += delta * mob.speed / 2;
                    }
                    else {
                        mob.ent.position.y -= delta * mob.speed / 2;
                    }
                }
                mob.ent.lookAt( G.characters[0].ent.position.x , G.characters[0].ent.position.y , G.characters[0].ent.position.z );
                
                if( dr < 25 && Math.abs( dy ) < 25 ) {
                    mob.node++;
                    if( mob.path.children[ mob.node ] ) {
                        mob.target = new Vector3( mob.path.children[ mob.node ].position.x , mob.path.children[ mob.node ].position.y , mob.path.children[ mob.node ].position.z );
                    }
                    else {
                        mob.path = false;
                    }
                }
                
            }
        }
        
    }
    doRat( mob , delta ) {
        
        if( ! this.showRatPrompt && G.characters[0].ent ) {
            const cx = G.characters[0].ent.position.x + Math.sin( G.characters[0].ent.rotation.y ) * 100;
            const cz = G.characters[0].ent.position.z + Math.cos( G.characters[0].ent.rotation.y ) * 100;
            const dx = cx - mob.ent.position.x;
            const dz = cz - mob.ent.position.z;
            const dr = Math.sqrt( dx*dx + dz*dz );
            if( dr < 110 ) {
                this.showRatPrompt = true;
            }
        }

        mob.mixer.update( delta*2 );
        
        if( ! mob.path ) {
            mob.path = Object.assign( {} , this.paths[mob.type].children[ Math.floor( this.paths[mob.type].children.length * Math.random() ) ] );
            mob.direction = Math.random() < 0.5 ? 1 : -1;
            if( mob.direction === 1 ) {
                mob.node = 0;
            }
            else {
                mob.node = mob.path.children.length - 1;
            }
            mob.target = new Vector3( mob.path.children[ mob.node ].position.x , mob.path.children[ mob.node ].position.y , mob.path.children[ mob.node ].position.z );
        }
        
        if( mob.target ) {
            const dx = mob.target.x - mob.ent.position.x;
            const dz = mob.target.z - mob.ent.position.z;
            const df = Math.atan2( dx , dz );
            const dr = Math.sqrt( dx*dx + dz*dz );
            
            let facing = df - mob.ent.rotation.y;
            while( facing > Math.PI ) facing -= Math.PI*2;
            while( facing <-Math.PI ) facing += Math.PI*2;
            
            if( facing > 0.05 && facing > delta ) {
                mob.ent.rotation.y += delta;
            }
            else if( facing < -0.05 && facing < - delta ) {
                mob.ent.rotation.y -= delta;
            }
            else {
                mob.ent.rotation.y += facing;
            }
            
            if( Math.abs( facing ) < 0.4 ) {
                mob.ent.position.x += Math.sin( mob.ent.rotation.y ) * delta * 150;
                mob.ent.position.z += Math.cos( mob.ent.rotation.y ) * delta * 150;
                if( mob.animMode !== 'Walk' ) {
                    mob.mixer._actions[0].setEffectiveWeight(1);
                    mob.mixer._actions[1].setEffectiveWeight(0);
                    mob.animMode = 'Walk';
                }
            }
            else if( mob.animMode !== 'Idle' ) {
                mob.mixer._actions[0].setEffectiveWeight(0);
                mob.mixer._actions[1].setEffectiveWeight(1);
                mob.animMode = 'Idle';
            }
            
            if( dr < 25 ) {
                mob.node += mob.direction;
                //const { floorHeight } = G.world.getHeight( mob.ent.position.clone() );
                //mob.ent.position.y = floorHeight;
                
                if( mob.path.children[ mob.node ] ) {
                    mob.target = new Vector3( mob.path.children[ mob.node ].position.x , mob.path.children[ mob.node ].position.y , mob.path.children[ mob.node ].position.z );
                }
                else {
                    mob.path = false;
                }
            }
        }
        
    }

}