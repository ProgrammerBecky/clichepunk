import {
    Vector2,
    Raycaster,
    Vector3,
    PositionalAudio,
} from 'three';
import { G } from './../G.js';

export class Player {
    constructor( character ) {
        
        this.raycaster = new Raycaster();
        this.raycaster.near = 1;
        this.raycaster.far = 25000;
        this.source = new Vector3();
        
        this.mouse = new Vector2();
        this.lookVector = new Vector2();
        this.character = character;
        
        this.keydown = this.keydown.bind( this );
        this.keyup = this.keyup.bind( this );
        this.mousemove = this.mousemove.bind( this );
        this.mousedown = this.mousedown.bind( this );
        this.mouseup = this.mouseup.bind( this );

        this.keys = {};
        
        window.addEventListener( 'keydown' , this.keydown );
        window.addEventListener( 'keyup' , this.keyup );
        window.addEventListener( 'mousemove' , this.mousemove );
        window.addEventListener( 'mousedown' , this.mousedown );
        window.addEventListener( 'mouseup' , this.mouseup );
        
        this.fireTimer = 0;
        this.pasties = 0;
        this.invadersKilled = 0;
        G.updateCam = true;
    }
    
    mousemove( e ) {
        this.mouse.set( e.clientX / window.innerWidth , e.clientY / window.innerHeight );
        this.lookVector.set( this.mouse.x * 2 - 1 , - ( this.mouse.y * 2 - 1 ) );
    }
    mousedown( e ) {
        if( e.buttons === 1 ) {
            this.keys[ 'fire' ] = true;
        }
    }
    mouseup( e ) {
        this.keys[ 'fire' ] = false;
    }
    
    keydown( e ) {
        this.keys[ e.key ] = true;
        if( G.hailedNPC && e.key === 'f' ) {
            console.log( 'EKEY===F' );
            G.hailedNPC.converseWithNPC();
        }
        if( G.ComputerEnabled ) {
            if( G.ComputerEnabled === 'start' && e.key === 'f' ) {
                G.ComputerEnabled = false;
                G.quests.quests.InitialiseComputer.active = false;
                G.quests.quests.ComputerCorruption1.entry = true;
            }
            else if( G.ComputerEnabled === 'corrupted' && e.key === 'f' ) {
                G.ComputerEnabled = false;
                G.quests.quests.ComputerCorruption1.active = false;
                G.quests.quests.ComputerCorruption2.entry = true;
            }
            else if( G.ComputerEnabled === 'voice' && e.key === 'f' ) {
                G.quests.quests.ComputerCorruption2.active = false;
                G.quests.quests.ComputerCorruption3.entry = true;                
            }
        }
        if( G.charGen ) {
            if( G.charGen === 'animations' ) {
                if( e.key === 'f' ) {
                    G.playerAnimations = 'Female';
                    G.charGen = 'hairLength';
                    G.quests.quests.AnimationSet.active = false;
                    G.quests.quests.HairLength.entry = true;
                }
                else if( e.key === 'm' ) {
                    G.playerAnimations = 'Male';
                    G.charGen = 'hairLength';
                    G.quests.quests.AnimationSet.active = false;
                    G.quests.quests.HairLength.entry = true;
                }
            }
            else if( G.charGen = 'hairLength' ) {
                if( ['1','2','3','4','0'].includes( e.key ) ) {
                    if( e.key === '1' ) {
                        G.playerHairLength = 5;
                    }
                    else if( e.key === '2' ) {
                        G.playerHairLength = 10;
                    }
                    else if( e.key === '3' ) {
                        G.playerHairLength = 20;
                    }
                    else if( e.key === '4' ) {
                        G.playerHairLength = 35;
                    }
                    
                    G.charGen = false;
                    G.quests.quests.HairLength.active = false;
                    G.quests.quests.InvestigateHologram.entry = true;
                    G.viewMode = 'thirdPerson';
                    
                    window.createPlayerEntity();
                }
            }
        }
    }
    keyup( e ) {
        this.keys[ e.key ] = false;
    }
    triggerMobSound( mob ) {
        if( mob.sound ) {
            mob.sound.setVolume( 0.4 );
            mob.sound.play();
        }
        else {
            setTimeout( (o,mob) => {
                o.triggerMobSound(mob);
            } , 250 , this , mob );
        }
    }
    
    update( delta ) {

        if( ! this.character.actionLocked ) {
            if( G.viewMode === 'firstPerson' && this.character.ent ) {
                
                this.character.ent.rotation._order = 'ZYX';
                this.character.ent.rotation.y -= this.lookVector.x * delta;
                //this.character.ent.rotation.x -= this.lookVector.y * delta;
 
                if( this.keys[ 'fire' ] ) {
                    this.character.setAnimation( 'Firing Rifle' , true , 'fast' );
                }
                else {
                    this.character.setAnimation( 'Rifle Aiming Idle' , true , 'fast' );
                }

                this.fireTimer += delta;                
                if( this.keys['fire'] ) {
                    if( this.fireTimer > 0 ) {
                        
                        let mobList = [];
                        G.mobs.list.map( (mob,index) => {
                            if( mob.type === 'SpaceInvader' ) {
                                mob.ent._mobListIndex = index;
                                mobList.push( mob.ent );
                            }
                        });
                        
                        this.source.set( 0,0,0 );
                        this.raycaster.setFromCamera( this.source , G.camera );
                        const intersection = this.raycaster.intersectObjects( mobList , true );
                        if( intersection.length > 0 ) {
                            G.mobs.checkInvaderDeath( intersection[0].object );
                        }
                        
                        this.fireTimer -= 1;
                        if( this.lewisGunSound ) {
                            this.lewisGunSound.play();
                        }
                        //G.lighting.fireGun( G.characters[0].ent.position.clone() );
                    }
                }

            }
            else if( G.viewMode === 'thirdPerson' ) {
                if( this.keys['w'] === true && this.character.falling < 5 ) {
                    if( this.keys[' '] === true ) {
                        this.character.traverse( delta , 500 );
                        this.character.setAnimation( 'Run' , true , 'fast' );
                    }
                    else {
                        this.character.traverse( delta , 130 );
                        this.character.setAnimation( 'Walk' , true , 'fast' );
                    }
                }
                else if( this.keys['s'] === true && this.character.falling < 5 ) {
                    this.character.traverse( delta , - 74 );
                    this.character.setAnimation( 'WalkBack' , true , 'fast' );
                }    
                else {
                    if( this.character.gravity ) {
                        this.character.setAnimation( 'Falling' , true , 'fast' );
                    }
                    else {
                        this.character.setAnimation( 'Idle' , true , 'fast' );
                    }
                }
                if( this.keys['d'] === true ) {
                    this.character.turn( delta , -2 );
                }
                if( this.keys['a'] === true ) {
                    this.character.turn( delta , 2 );
                }
            }
            
            if( this.keys['f'] === true ) {
                if( G.exitSimPrompt ) {
                    document.body.removeChild( G.exitSimPrompt );
                    G.exitSimPrompt = false;
                    
                    G.processCrowd = true;

                    G.camera.remove( G.lewisGunInPlayerHand );
                    G.lewisGunInPlayerHand = false;
                    
                    G.quests.characters.StudentSally.ent.visible = true;
                    G.npc.map( npc => {
                        if( npc.character.ent ) {
                            npc.character.ent.visible = true;
                        }
                    });
                    G.mobs.list.map( mob => {
                        if( mob.type === 'SpaceInvaderDead' ) {
                            mob.ent.scale.set(1,1,1);
                            G.scene.remove( mob.ent );
                        }
                    });
                    G.mobs.list = G.mobs.list.filter( search => search.type !== 'SpaceInvaderDead' );
                    
                    setDamage(0);
                    
                    G.characters[0].ent.traverse( child => {
                        if( child.isMesh ) {
                            if( ['Wolf3D_Head','EyeLeft','EyeRight','Wolf3D_Teeth','Wolf3D_Hair'].includes( child.name ) ) {
                                child.visible = true;
                            }
                            if( child.name.substr(0,9) === 'HairLayer' ) {
                                child.visible = true;
                            }
                        }
                    });                    
                    
                    G.mobs.spawnDeathScene();
                    G.viewMode = 'thirdPerson';
                }
                else if( G.spaceInvaderPrompt ) {
                    setDamage(0.5);
                    G.quests.characters.StudentSally.ent.visible = false;
                    
                    G.npc.map( npc => {
                        if( npc.character.ent ) {
                            npc.character.ent.visible = false;
                        }
                    });
                    
                    G.mobs.list.map( mob => {
                        if( mob.type === 'SpaceInvader' ) {
                            this.triggerMobSound( mob );
                            mob.ent.visible = true;
                        }
                    });
                    
                    //G.characters[0].addPropRightHand( 'LewisGun' );
                    G.gltf.load( '3d/high/props/LewisGunInHand.glb' , result => {
                        G.lewisGunInPlayerHand = result.scene;
                        G.lewisGunInPlayerHand.traverse( child => {
                           if( child.isMesh ) {
                                child.material = G.lighting.applyLights( child.material );
                           }                               
                        });
                        G.lewisGunInPlayerHand.scale.set(100,100,100);
                        G.lewisGunInPlayerHand.position.set(0,0,-50);
                        G.lewisGunInPlayerHand.rotation.set(-0.04,-0.01,0);
                        G.camera.add( G.lewisGunInPlayerHand );
                        
                        this.lewisGunSound = new PositionalAudio( G.listener );
                        let self = this;
                        G.audio.load( 'Speech/LewisGun.ogg' , buffer => {
                           self.lewisGunSound.setBuffer( buffer );
                           self.lewisGunSound.setRefDistance( 100 );
                           self.lewisGunSound.setVolume( 1 );
                           G.lewisGunInPlayerHand.add( self.lewisGunSound );
                        });                    
                        
                    });
                    
                    G.characters[0].ent.traverse( child => {
                        if( child.isMesh ) {
                            if( child.name === 'StaticMesh' ) {
                                G.lewisGunInPlayerHand = child;
                                child.rotation.set(-Math.PI/6,0,0);
                            }
                            if( ['Wolf3D_Head','EyeLeft','EyeRight','Wolf3D_Teeth','Wolf3D_Hair'].includes( child.name ) ) {
                                child.visible = false;
                            }
                            if( child.name.substr(0,9) === 'HairLayer' ) {
                                child.visible = false;
                            }
                        }
                    });
                    this.character.setAnimation( 'Rifle Aiming Idle' , true , 'in' );
                    G.viewMode = 'firstPerson';

                    document.body.removeChild( G.spaceInvaderPrompt );
                    G.spaceInvaderPrompt = false;

                    G.lewisGunPrompt = document.createElement( 'div' );
                    G.lewisGunPrompt.classList.add( 'options' );
                    G.lewisGunPrompt.innerHTML = '[LMB] Fire Lewis Gun';
                    document.body.appendChild( G.lewisGunPrompt );
                    
                    G.processCrowd = false;
                }
                else if( G.world.pickupPasty() ) {
                    this.pasties++;
                    this.character.pickupObject();
                }
                else if( G.mobs.showRatPrompt ) {
                    this.character.doStomp();
                }
            }
        }
        
        this.character.update( delta );

    }
    
}