import {
    AnimationMixer,
    AnimationClip,    
    PositionalAudio,  
    Vector3,
} from 'three';
import {
    clone,
} from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import { G } from './../G.js';
import { applyHairShader } from './HairShader.js';
import { phoneme } from './phoneme.js';
import { stripScale } from './stripScale.js';
import { applyHologram } from './Hologram.js';

export class Character {
    constructor( name , pregnant = false , objectData ) {
        
        this.lipSync = this.lipSync.bind( this );
        this.addPropRightHand = this.addPropRightHand.bind( this );
        this.addPropLeftHand = this.addPropLeftHand.bind( this );
        
        this.words = '';
        this.propRightHand = false;
        
        this.morphs = {};
        this.morphSet = [];
        this.mixer = false;
        
        this.lastPosition = new Vector3(0,0,0);
        this.falling = 0;
        
        this.moodMouthStrength = 1;
        
        this.blinkTimer = 0;
        this.blinkRate = 10;
        this.blinkTarget = 10;
        this.blinkAction = 0;
        this.pregnant = pregnant;
        this.hairLength = false;
        
        this.speechSequence = [];
        this.soundElement = false;
        this.speechHeldForLoading = false;

        this.currentAnim = false;
        this.setMood( 'relaxed' );
    
        if( 'npc' === name ) {
            this.gender = objectData.gender;
            this.ent = objectData.ent;
            this.hairLength = objectData.hairLength;
            this.checkAnimations( name , objectData );
        }
        else {
            if( ['Cee','BlueSpoon','Evelyn','HomelessHenrietta','StudentSally','Computer'].includes( name ) ) {
                this.gender = 'Female';
                this.checkAnimations( name , objectData );
            }
            else {
                this.gender = 'Male';
                this.checkAnimations( name , objectData );
            }
        }
    
    }
    
    addPropRightHand( propRightHand ) {
        this.propRightHand = G.props[ propRightHand ].clone();
        
        const position = this.ent.position.clone();
        const rotation = this.ent.rotation.clone();
        
        this.ent.position.set( 0,0,0 );
        this.ent.rotation.set( 0,0,0 );
        
        this.ent.traverse( child => {
           if( child.isBone && child.name === 'RightHand' ) {
               child.add( this.propRightHand );
           }
        });
        
        this.ent.position.copy( position );
        this.ent.rotation.copy( rotation );
    }
    addPropLeftHand( propLeftHand ) {
        this.propLeftHand = clone( G.props[ propLeftHand ] );
        this.ent.traverse( child => {
           if( child.isBone && child.name === 'LeftHand' ) {
               child.add( this.propLeftHand );
           }
        });
    }
    playSpeechSequence( speechSequence ) {
        this.speechSequence = Object.assign( [] , speechSequence );
        this.playSpeech( this.speechSequence.shift() );
    }
    playSpeech({ words, pace, mouthSpeed, sfx, emotion, animation, animationLoop, propRightHand, propLeftHand, position, rotation }) {

        if( position ) {
            this.ent.position.set( position.x , position.y , position.z );
        }
        if( rotation ) {
            this.ent.rotation.set( 0 , rotation , 0 );
        }

        if( propLeftHand ) {
            if( ! G.props ) {
                G.props = [];
            }
            if( ! G.props[ propLeftHand ] ) {
                G.gltf.load( `3d/high/props/${propLeftHand}.glb` , result => {
                   G.props[ propLeftHand ] = result.scene;
                   this.addPropLeftHand( propLeftHand );
                });
            }
            else {
                this.addPropLeftHand( propLeftHand );
            }
        }
        else {
            if( this.propLeftHand ) {
                this.propLeftHand.parent.remove( this.propLeftHand );
                this.propLeftHand = false;
            }
        }
        
        if( propRightHand ) {
            if( ! G.props ) {
                G.props = [];
            }
            if( ! G.props[ propRightHand ] ) {
                G.gltf.load( `3d/high/props/${propRightHand}.glb` , result => {
                   G.props[ propRightHand ] = result.scene;
                   this.addPropRightHand( propRightHand );
                });
            }
            else {
                this.addPropRightHand( propRightHand );
            }
        }
        else {
            if( this.propRightHand ) {
                this.propRightHand.parent.remove( this.propRightHand );
                this.propRightHand = false;
            }
        }
        
        if( animation ) {
            this.setAnimation( animation , animationLoop , 'in' );
        }        
        
        if( ! this.soundElement ) {
            this.soundElement = new PositionalAudio( G.listener );
            this.soundElement.isAudio = true;
            this.soundElement.setRefDistance( 100 );
            this.ent.add( this.soundElement );         
        }
        
        this.setMood( emotion );
        
        if( sfx ) {
            if( this.soundElement.isPlaying ) {
                this.soundElement.stop();
            }
            this.words = '';
            if( this.soundElement.name !== words ) {
                this.speechHeldForLoading = true;
                G.audio.load( `Speech/${sfx}.ogg` , buffer => {
                    this.soundElement.name = words;
                    this.soundElement.setBuffer( buffer );
                    this.soundElement.play();
                    this.words = words;
                    this.wordTimer = 0;
                    this.wordPace = pace;
                    this.mouthSpeed = mouthSpeed;
                });
            }
            else {
                this.speechHeldForLoading = false;
                this.soundElement.play();
                this.words = words;
                this.wordTimer = 0;
                this.wordPace = pace;
                this.mouthSpeed = mouthSpeed;
            }
        }
    }
    
    lipSync( mouthSpeed ) {

        this.speechHeldForLoading = false;
        this.setSpeech( mouthSpeed );
        if( this.words.length === 0 ) {
            setTimeout( () => { this.setSpeech('') } , this.wordPace );
        }

    }
    
    setSpeech( mouthSpeed = 3 ) {
        
        if( this.moodMouthStrength !== 0.1 ) {
            this.moodMouthStrength = 0.1;
            this.setMood( this.mood );
        }
        
        this.setInfluence( 'viseme_CH' , 0 );
        this.setInfluence( 'viseme_DD' , 0 );
        this.setInfluence( 'viseme_E' , 0 );
        this.setInfluence( 'viseme_FF' , 0 );
        this.setInfluence( 'viseme_I' , 0 );
        this.setInfluence( 'viseme_O' , 0 );
        this.setInfluence( 'viseme_PP' , 0 );
        this.setInfluence( 'viseme_RR' , 0 );
        this.setInfluence( 'viseme_SS' , 0 );
        this.setInfluence( 'viseme_TH' , 0 );
        this.setInfluence( 'viseme_U' , 0 );
        this.setInfluence( 'viseme_aa' , 0 );
        this.setInfluence( 'viseme_kk' , 0 );
        this.setInfluence( 'viseme_nn' , 0 );
        this.setInfluence( 'viseme_sil' , 0 );
        
        let activeViseme = [];
        let cullLetters = 0;
        phoneme.map( phone => {
           phone.letters.map( letter => {
                if( this.words.substr( 0 , letter.length ) === letter ) {
                    cullLetters = Math.max( cullLetters , letter.length );
                    activeViseme.push( phone.viseme );
                }
           });               
        });
        
        if( cullLetters === 0 ) {
            if( this.words.length > 0 ) cullLetters = 1;
            this.moodMouthStrength = 1.0;            
            this.setMood( this.mood );
        }
        activeViseme.map( viseme => {
            this.setInfluence( `viseme_${viseme}` , 1 , mouthSpeed );
        });
        
        this.words = this.words.substr( cullLetters );
    }
    
    setMood( mood ) {
        
        this.mood = mood;
        
        this.setInfluence( 'eyesClosed' , 0 );
        this.setInfluence( 'eyeWideLeft' , 0 );
        this.setInfluence( 'eyeWideRight' , 0 );
        this.setInfluence( 'eyesLookDown' , 0 );
        this.setInfluence( 'cheekSquintLeft' , 0 );
        this.setInfluence( 'cheekSquintRight' , 0 );
        this.setInfluence( 'cheekPuff' , 0 );
        this.setInfluence( 'browInnerUp' , 0 );
        this.setInfluence( 'browDownLeft' , 0 );
        this.setInfluence( 'browDownRight' , 0 );
        this.setInfluence( 'browOuterUpLeft' , 0 );
        this.setInfluence( 'browOuterUpRight' , 0 );
        this.setInfluence( 'mouthFunnel' , 0 );
        this.setInfluence( 'mouthDimpleLeft' , 0 );
        this.setInfluence( 'mouthDimpleRight' , 0 );
        this.setInfluence( 'mouthPressLeft' , 0 );            
        this.setInfluence( 'mouthSmile' , 0 );  
        this.setInfluence( 'mouthShrugLower' , 0 );
        this.setInfluence( 'mouthShrugUpper' , 0 );
        this.setInfluence( 'noseSneerLeft' , 0 );
        this.setInfluence( 'noseSneerRight' , 0 );            
        this.setInfluence( 'jawOpen' , 0 );         
    
        if( this.mood === 'relaxed' ) {
            this.blinkRate = 3;
            this.setInfluence( 'eyesClosed' , 0.2 );
        }
        else if( this.mood === 'happy' ) {
            this.blinkRate = 15;
            this.setInfluence( 'browInnerUp' , 0.3 );
            this.setInfluence( 'mouthDimpleLeft' , 1 );
            this.setInfluence( 'mouthDimpleRight' , 1 );
            this.setInfluence( 'mouthSmile' , 0.15 );     
        }
        else if( this.mood === 'happy-smile' ) {
            this.blinkRate = 15;
            this.setInfluence( 'browDownLeft' , 0.2 );
            this.setInfluence( 'browDownRight' , 0.2 );
            this.setInfluence( 'browInnerUp' , 0.3 );
            this.setInfluence( 'mouthDimpleLeft' , 1 );
            this.setInfluence( 'mouthDimpleRight' , 1 );    
            this.setInfluence( 'mouthSmile' , 1 );            
        }
        else if( this.mood === 'happy-laugh' ) {
            this.blinkRate = 15;
            this.setInfluence( 'eyeWideLeft' , 0.3 );
            this.setInfluence( 'eyeWideRight' , 0.3 );
            this.setInfluence( 'browInnerUp' , 0.5 );
            this.setInfluence( 'browOuterUpLeft' , 0.5 );
            this.setInfluence( 'browOuterUpRight' , 0.5 );
            this.setInfluence( 'mouthSmile' , 1 );            
            this.setInfluence( 'jawOpen' , 0.5 );
        }
        else if( this.mood === 'pain' ) {
            this.blinkRate = 5;
            this.setInfluence( 'mouthFunnel' , 1 );
            this.setInfluence( 'cheekSquintLeft' , 1 );
            this.setInfluence( 'cheekSquintRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 0.2 );
            this.setInfluence( 'noseSneerRight' , 0.2 );            
        }
        else if( this.mood === 'shock' ) {
            this.blinkRate = 8;
            this.setInfluence( 'eyeWideLeft' , 1 );
            this.setInfluence( 'eyeWideRight' , 1 );
            this.setInfluence( 'browInnerUp' , 1 );
            this.setInfluence( 'jawOpen' , 0.3 ); 
        }
        else if( this.mood === 'anger' ) {
            this.blinkRate = 10;
            this.setInfluence( 'eyeWideLeft' , 0.6 );
            this.setInfluence( 'eyeWideRight' , 0.6 );
            this.setInfluence( 'browDownLeft' , 1 );
            this.setInfluence( 'browDownRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 1 );
            this.setInfluence( 'noseSneerRight' , 1 );
            this.setInfluence( 'jawOpen' , 0.15 ); 
        }
        else if( this.mood === 'contempt' ) {
            this.blinkRate = 8;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'mouthPressLeft' , 0.5 );            
            this.setInfluence( 'noseSneerLeft' , 1 );
            this.setInfluence( 'noseSneerRight' , 1 );
        }
        else if( this.mood === 'contempt-pout' ) {
            this.blinkRate = 5;
            this.setInfluence( 'eyesClosed' , 0.4 );
            this.setInfluence( 'eyesLookDown' , 0.6 );
            this.setInfluence( 'browDownLeft' , 0.3 );
            this.setInfluence( 'browDownRight' , 0.3 );
            this.setInfluence( 'cheekPuff' , 1 );
            this.setInfluence( 'mouthShrugLower' , 1 );
            this.setInfluence( 'mouthShrugUpper' , 1 );
        }
        else if( this.mood === 'confused' ) {
            this.blinkRate = 3;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'eyeWideLeft' , 0.2 );
            this.setInfluence( 'browDownLeft' , 1 );
            this.setInfluence( 'browOuterUpRight' , 1 );
            this.setInfluence( 'mouthPressLeft' , 0.3 );            
            this.setInfluence( 'jawOpen' , 0.2 ); 
        }
        else if( this.mood === 'fear' ) {
            this.blinkRate = 20;
            this.setInfluence( 'eyeWideLeft' , 1 );
            this.setInfluence( 'eyeWideRight' , 1 );
            this.setInfluence( 'browInnerUp' , 1 );
            this.setInfluence( 'browOuterUpLeft' , 1 );
            this.setInfluence( 'browOuterUpRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 0.2 );
            this.setInfluence( 'noseSneerRight' , 0.2 );            
            this.setInfluence( 'jawOpen' , 0.4 );  
        }
        else if( this.mood === 'sad' ) {
            this.blinkRate = 5;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'eyesLookDown' , 0.6 );
            this.setInfluence( 'noseSnearLeft' , 0.6 );
            this.setInfluence( 'noseSnearRight' , 0.6 );
            this.setInfluence( 'mouthShrugLower' , 0.5 );
            this.setInfluence( 'mouthShrugUpper' , 0.5 );
        }
        
    }
    
    setBlink() {
        this.blinkTimer = 0;
        this.blinkTarget = this.blinkRate * 0.8 + this.blinkRate * 0.4 * Math.random();
        this.blinkAction = 1;
    }
    
    doBlink() {

        if( this.blinkAction < 1.120 ) {
            const blinkCurve = Math.sin( (this.blinkAction-1)*Math.PI/0.120 )
            this.setInfluence( 'eyeBlinkLeft' , blinkCurve , 10.0 );
            this.setInfluence( 'eyeBlinkRight' , blinkCurve , 10.0 );
        }
        else {
            this.blinkAction = 0;
            this.setInfluence( 'eyeBlinkLeft' , 0 );
            this.setInfluence( 'eyeBlinkRight' , 0 );
        }
        
    }
    
    setInfluence( morph , strength , speed = 3.0 ) {
        
        if( ! this.morphs[ morph ] ) return;
        
        if( morph.indexOf( 'viseme' ) === -1 && ( morph.includes( 'mouth' ) > -1 || morph.includes( 'jaw' ) > -1 ) ) {
            strength *= this.moodMouthStrength;
        }
        
        const morphIndex = this.morphs[ morph ];
        
        if( this.morphSet[ morphIndex ] ) {
            this.morphSet[ morphIndex ].target = strength;
        }
        else {
            this.morphSet[ morphIndex ] = {
                target: strength,
                value: 0
            };
        }
        this.morphSet[ morphIndex ].speed = speed;
    }
    
    checkAnimations( name , objectData ) {
        if( ! G.animations[this.gender] ) {
            G.gltf.load( `3d/${this.gender}Animations.glb` , result => {
                G.animations[this.gender] = stripScale( result.animations );
                this.checkMesh( name , objectData );
            });
        }
        else {
            this.checkMesh( name , objectData );
        }
    }
    
    checkMesh( name , objectData ) {
        
        if( ! G.masterMeshes[ name ] && name !== 'npc' ) {
            G.gltf.load( `3d/high/${name}.glb` , result => {
                if( this.pregnant ) {
                    result.scene.traverse( child => {
                        if( child.isMesh && child.material.name === 'Wolf3D_Body' ) {
                            child.material.displacementMap = G.texture.load( '/3d/displacementBody.png' );
                            child.material.displacementMap.flipY = false;
                            child.material.displacementScale = 0.04;
                        }
                       if( child.isMesh && child.material.name === 'Wolf3D_Outfit_Top' ) {
                            child.material.displacementMap = G.texture.load( '/3d/displacementTop.png' );
                            child.material.displacementMap.flipY = false
                            child.material.displacementScale = 0.02;
                       }                       
                    });
                }
                G.masterMeshes[ name ] = result.scene;
                this.prepMesh( name , objectData );
                
            });
        }
        else {
            this.prepMesh( name , objectData  );
        }
        
    }
    
    prepMesh( name , objectData ) {
        
        let hairLength;
        if( this.hairLength ) {
            hairLength = this.hairLength;
        }
        else {
            if( name === 'Cee' ) hairLength = 25;
            else if( name === 'Computer' ) hairLength = 0;
            else if( name === 'Evelyn' ) hairLength = 5;
            else if( name === 'Scotty' ) hairLength = 50;
            else if( name === 'BlueSpoon' ) hairLength = 5;
            else if( name === 'Taki' ) hairLength = 30;
            else if( name === 'TommySilverfoot' ) hairLength = 10;
            else if( name === 'CornishKevin' ) hairLength = 15;
            else if( name === 'HomelessHenrietta' ) hairLength = 0;
            else if( name === 'StudentSally' ) hairLength = 35;
            else if( name === 'npc' ) hairLength = objectData.hairLength;
        }
        
        if( name !== 'npc' ) {
            this.ent = clone( G.masterMeshes[ name ] );
        }
        if( objectData && objectData.isPlayer ) {
            G.camera.remove( G.listener );
            G.listener.position.set( 0,0,0 );
            G.listener.rotation.set( 0,-Math.PI/2,0 );
            this.ent.add( G.listener );

            G.camera.position.set( this.ent.position.x , this.ent.position.y +150 , this.ent.position.z +200 );
            G.controls.target.set( this.ent.position.x , this.ent.position.y +150 , this.ent.position.z );
        }
        if( name !== 'npc' ) {
            const { y } = G.world.getHeight( this.ent.position.clone() , true );
            this.ent.position.set( this.ent.position.x , y , this.ent.position.z );
            G.scene.add( this.ent );
        }        
        
        if( name === 'StudentSally' ) {
            this.ent.scale.set( 78,78,78 );
        }
        else {
            this.ent.scale.set( 100,100,100 );
        }    
        
        if( name === 'Computer' ) {
            this.ent.traverse( child => {
                if( child.isMesh ) {
                    if( ['Wolf3D_Head','Wolf3D_Teeth','EyeLeft','EyeRight'].includes( child.name ) ) {
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.2;
                    }
                    else {
                        child.visible = false;
                    }
                }
            });
            this.ent.scale.set( 120,120,120 );
        }
        
        this.ent.traverse( child => {
            if( child.isMesh ) {
                if( child.material.name === 'Wolf3D_Hair' && hairLength > 0 ) {
                    applyHairShader( child , hairLength );
                }
                else {
                    child.material = G.lighting.applyLights( child.material );
                }

                if( child.morphTargetInfluences && child.morphTargetInfluences.length > 0 ) {
                    for ( const [ key, value ] of Object.entries( child.morphTargetDictionary ) ) {
                        this.morphs[key] = value;
                    }
                }
                
                child.material.envMap = G.environmentMap;
                child.material.envMapIntensity = G.environmentMapIntensity;
                child.material.depthTest = true;
                child.material.depthWrite = true;
                child.castShadow = true;
                child.receiveShadow = true;
                
            }

        });
    
        if( name === 'TommySilverfoot' ) {
            this.ent.position.set( 3288.223590874795, 2196.681884765625, -325.25253262501093 );
            this.ent.traverse( child => {
                if( child.isMesh ) {
                    child.material = applyHologram( child.material );
                }
            });
        }

        this.setAnimation( 'Idle' , true , 'in' );
        this.setMood( this.mood );

    }
    
    setAnimation( mode , loop , direction ) {

        if( ! this.ent ) return;
        if( ! G.animations[ this.gender ] ) return;
        if( this.currentAnim === mode ) return;
        
        this.currentAnim = mode;

        if( ! this.mixer ) {
            this.mixer = new AnimationMixer( this.ent );
        }

        this.mixer._actions.map( action => {
            if( action.name === mode ) {
                action.setLoop( loop );
                action.clampWhenFinished = ! loop;
                action.direction = direction;
                this.actionLocked = ( ! loop ) ? action._clip.duration : 0;
                action.play();
                return;
            }
            else {
                action.direction = 'out' + direction;
            }
        });

        let clip = AnimationClip.findByName( G.animations[this.gender] , mode );

        if( clip ) {
            let action = this.mixer.clipAction( clip );
            action.direction = direction;
            action.name = mode;
            action.setLoop( loop );
            action.clampWhenFinished = ! loop;
            action.setEffectiveWeight( 0 );
            this.actionLocked = ( ! loop ) ? action._clip.duration : 0;
            action.play();
        }
        else {
            console.error( `No ${this.gender} Animation Clip:` , mode );
        }
        
    }
    
    doStomp() {
        this.setAnimation( 'Stomp' , false , 'in' );
    }
    pickupObject() {
        this.setAnimation( 'Picking Up Object' , false , 'in' );
    }
    
    update( delta , doHeightCheck = true ) {

        if( this.words.length > 0 ) {
            this.wordTimer += delta;
            while( this.wordTimer > 0 ) {
                this.wordTimer -= this.wordPace;
                this.lipSync( this.mouthSpeed );            
            }
        }
        
        if( this.ent
        &&  (
                this.ent.position.x != this.lastPosition.x
            ||  this.ent.position.z != this.lastPosition.z
            ||  this.gravity
            )
        &&  doHeightCheck
        ) {
            this.lastPosition.set( this.ent.position.x , this.ent.position.y , this.ent.position.z );
            let { y, gravity } = G.world.getHeight( new Vector3( this.ent.position.x , this.ent.position.y , this.ent.position.z ) );
            this.gravity = gravity;
            if( gravity ) {
                this.falling += delta * 10;
                y -= this.falling;
            }
            else {
                this.falling = 0;
            }
            this.ent.position.y = y;
        }
        
        
        if( this.mixer ) {
            if( this.actionLocked !== false ) {
                this.actionLocked -= delta;
                if( this.actionLocked <= 0 ) this.actionLocked = false;
            }
            
            this.mixer._actions.map( (action,index) => {
                if( action.direction === 'fast' ) {
                    action.setEffectiveWeight( Math.min( 1 , action.weight + delta * 3 ) );
                }
                else if( action.direction === 'in' ) {
                    action.setEffectiveWeight( Math.min( 1 , action.weight + delta ) );
                    if( action._clip.name === 'Stomp' ) {
                        if( action.time >= 0.75 ) {
                            if( ! action.triggerEffect ) {
                                G.mobs.splatRats();
                                action.triggerEffect = true;
                            }
                        }
                        else {
                            action.triggerEffect = false;
                        }
                    }
                }
                else {
                    const speed = action.direction === 'outfast' ? delta * 3 : delta;
                    action.setEffectiveWeight( Math.max( 0 , action.weight - speed ) );
                    if( action.weight === 0 ) {
                        action.stop();
                    }
                }
            });

            this.mixer.update( delta )
            
            this.morphSet.map( (morph,morphIndex) => {
                if( morph.value < morph.target ) {
                    morph.value = Math.min( morph.value + delta*morph.speed , morph.target );
                }
                else {
                    morph.value = Math.max( morph.value - delta*morph.speed , morph.target );
                }
                this.ent.traverse( child => {
                    if( child.morphTargetInfluences &&  child.morphTargetInfluences.length > morphIndex ) {
                        child.morphTargetInfluences[ morphIndex ] = morph.value;
                    }
                });
            });
        }
        
        this.blinkTimer += delta;
        if( this.blinkTimer > this.blinkRate*2 || this.blinkTimer > this.blinkTarget ) {
            this.setBlink();
        }
        else if( this.blinkAction > 0 ) {
            this.blinkAction += delta;            
            this.doBlink();
        }
        
        if( this.speechSequence.length > 0
        && ! this.soundElement.isPlaying
        && ! this.speechHeldForLoading
        ) {
            this.playSpeech( this.speechSequence.shift() );
        }
    }
    
    traverse( delta , distance ) {
        
        const { dx , dz } = G.world.slide({
            start: new Vector3( this.ent.position.x, this.ent.position.y+100, this.ent.position.z ),
            bearing: this.ent.rotation.y,
            distance: delta * distance,
        });
        
        this.ent.position.x = dx;
        this.ent.position.z = dz;
        
    }
    move( delta , distance ) {
        const movement = delta * distance;
        this.ent.position.x += Math.sin( this.ent.rotation.y ) * movement;
        this.ent.position.z += Math.cos( this.ent.rotation.y ) * movement;
    }
    turn( delta , distance ) {
        this.ent.rotation.y += delta * distance;
    }
    
}