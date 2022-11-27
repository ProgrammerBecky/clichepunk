/* Shedmon - Phone model */
/* kimlaughton - Cornish Pasty model */
/* font - Mykhailo Matviichuk */
/* lewis dieselgun - Sobolev_Maxim */
import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    TextureLoader,
    CubeTextureLoader,
    PCFSoftShadowMap,
    Vector2,
    Vector3,
    Clock,
    AudioListener,  
    AudioLoader,

    CubeRefractionMapping,
    LinearFilter,
    LinearMipMapLinearFilter,
    sRGBEncoding,
    
    Color,
    Fog,
    LoadingManager,
} from 'three';
import { G } from './G.js';
//import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from '/node_modules/three/examples/jsm/postprocessing/FilmPass.js';
import { GlitchPass } from '/node_modules/three/examples/jsm/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from '/node_modules/three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from '/node_modules/three/examples/jsm/postprocessing/SMAAPass.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from '/node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { Player } from '/Character/Player.js';
                
//import { World } from './World/World.js';
import { City } from './City/City.js';
import Stats from '/node_modules/three/examples/jsm/libs/stats.module.js'
import { Character } from './Character/Character.js';
import { SpeechRecognitionHarvester } from './PipelineTools/SpeechRecognition.js';
import { Lighting } from './City/Lighting.js';
import { Crowd } from './Character/Crowd.js';
import { Music } from './Music.js';
import { Mobs } from './Mobs.js';
import { Corpses } from './Corpses.js';

import { Quest } from './Quests/Quest.js';

G.manager = new LoadingManager();
G.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    let loader = document.getElementById( 'LoadingMessage' );
    if( loader ) {
        loader.innerHTML = `${Math.floor( itemsLoaded * 100 / itemsTotal)}% Loading`;
    }
};
G.manager.onLoad = () => {
    let loader = document.getElementById( 'LoadingMessage' );
    if( loader ) {
        loader.innerHTML = `Compiling Shaders`;
    }    
};

G.fbx = new FBXLoader( G.manager );

/* N8's SSAO
https://github.com/N8python/randomPhysics
*/


let stats, renderPassEffects;
const init3d = () => {
    
    renderPassEffects = false;
    
    if( ! G.animations ) G.animations = {};
    if( ! G.masterMeshes ) G.masterMeshes = {};

    G.texture = new TextureLoader( G.manager );
    G.gltf = new GLTFLoader( G.manager );
    
    G.lighting = new Lighting();
    G.corpses = new Corpses();
    
    G.scene = new Scene();
    stats = Stats();
    document.body.appendChild( stats.dom );

    const cubeTextureLoader = new CubeTextureLoader();
    cubeTextureLoader.setPath( '3d/high/skybox/' );
    G.environmentMap = cubeTextureLoader.load([
        'posx.jpg',
        'negx.jpg',
        'posy.jpg',
        'negy.jpg',
        'posz.jpg',
        'negz.jpg'
    ]);
    
    G.environmentMapIntensity = 0.3;
    G.environmentMap.mapping = CubeRefractionMapping;
    G.environmentMap.magFilter = LinearFilter;
    G.environmentMap.minFilter = LinearMipMapLinearFilter;
    G.environmentMap.encoding = sRGBEncoding;

    G.renderer = new WebGLRenderer({
        logarithmicDepthBuffer: true,
    });
    G.renderer.outputEncoding = sRGBEncoding;
    G.renderer.shadowMap.enabled = true;
    G.renderer.shadowMap.type = PCFSoftShadowMap;    
    G.renderer.setPixelRatio( window.devicePixelRatio );
    G.renderer.setSize( window.innerWidth , window.innerHeight );
    document.body.appendChild( G.renderer.domElement );

    G.camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight , 1 , 1024*7 );
    G.scene.add( G.camera );

    G.listener = new AudioListener();
    G.listener.rotation.set( 0 , 0 , 0 );
    G.camera.add( G.listener );
    G.audio = new AudioLoader();
    G.music = new Music();
    
    G.scene.fog = new Fog( 0x081215 , 1024*5 , 1024*7 );
    G.scene.background = new Color( 0x081215 );
    
    
    G.controls = {
        target: new Vector3(0,0,0)
    };
    //G.controls = new OrbitControls( G.camera , G.renderer.domElement );
    //G.controls.minDistance = 1;
    //G.controls.maxDistance = 100;
    //G.controls.zoomSpeed = 25;
    //G.controls.panSpeed = 25;
    //G.controls.rotateSpeed = 2;
    //G.controls.maxPolarAngle = Math.PI / 2;

/*
    G.ambient = new AmbientLight( 0x222222 );
    G.scene.add( G.ambient );
*/

    G.sun = new DirectionalLight( 0xffffff , 2 );
    G.sun.castShadow = true;
    //G.sun.shadow.bias = 0.0002;
    G.sun.shadow.normalBias = 7;
    G.sun.shadow.mapSize.width = 4096;
    G.sun.shadow.mapSize.height = 4096;
    G.sun.shadow.camera.near = 1;
    G.sun.shadow.camera.far = 2048*50;
    G.sun.shadow.camera.left = -1024 * 7;
    G.sun.shadow.camera.right = 1024 * 7;
    G.sun.shadow.camera.top = 1024 * 7;
    G.sun.shadow.camera.bottom = -1024 * 7;
    
    G.scene.add( G.sun );
    G.scene.add( G.sun.target );

    window.addEventListener( 'resize' , () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        G.camera.aspect = width / height;
        G.camera.updateProjectionMatrix();
        
        G.renderer.setSize( width , height );
        G.composer.setSize( width , height );
        G.bloomPass.setSize( width , height );
        G.SSAOPass.setSize( width , height );
        G.SMAAPass.setSize( width * G.renderer.getPixelRatio() , height * G.renderer.getPixelRatio() );
    });
    
    //G.world = new World();
    G.world = new City();

    const renderPass = new RenderPass( G.scene, G.camera );
    G.bloomPass = new UnrealBloomPass( new Vector2( window.innerWidth , window.innerHeight ) , 1.0 , 0.5 , 0.3 );
    G.bloomPass.strength = 0.2;
    G.bloomPass.radius = 0.8;
    G.bloomPass.treshold = 0.5;    

    G.glitchPass = new GlitchPass();
    
    G.filmPass = new FilmPass( 0.5 , 0.1 , 240 , 0.5 );

    G.SSAOPass = new SSAOPass( G.scene , G.camera , window.innerWidth , window.innerHeight );
    G.SSAOPass.minDistance = 0;
    G.SSAOPass.maxDistance = 0.001;
    
    G.SMAAPass = new SMAAPass( window.innerWidth * G.renderer.getPixelRatio(), window.innerHeight * G.renderer.getPixelRatio() );
    
    G.viewDamage = 0;

    G.composer = new EffectComposer( G.renderer );
    G.composer.addPass( renderPass );    
    //G.composer.addPass( G.SSAOPass );
    G.composer.addPass( G.bloomPass );    
    G.composer.addPass( G.SMAAPass );

window.setDamage = (vl) => {
    G.viewDamage = vl;
    G.glitchPass.curF = 0;

    if( G.viewDamage > 0 ) {
        if( ! renderPassEffects ) {
            renderPassEffects = true;
            //G.composer.addPass( G.bloomPass );
            G.composer.addPass( G.glitchPass );
            G.composer.addPass( G.filmPass );
        }
    }
    else {
        if( renderPassEffects ) {
            renderPassEffects = false;
            //G.composer.removePass( G.bloomPass );
            G.composer.removePass( G.glitchPass );
            G.composer.removePass( G.filmPass );
        }        
    }

    if( G.viewDamage > 0.5 ) {
        G.glitchPass.enabled = true;
        G.glitchPass.minX = 120 + (1.0 - G.viewDamage) * 300;
        G.glitchPass.maxX = 300 + (1.0 - G.viewDamage) * 1200;        
    }
    else {
        G.glitchPass.enabled = false;        
    }
    
    if( G.viewDamage === 0 ) {
        G.filmPass.uniforms.nIntensity.value = 0;
        G.filmPass.uniforms.sIntensity.value = 0;
        G.filmPass.uniforms.sCount.value = 0;
        G.filmPass.uniforms.grayscale.value = 0;
        G.filmPass.uniforms.needsUpdate = true;
    }
    else {
        
        //G.bloomPass.strength = G.viewDamage;
        //G.bloomPass.radius = G.viewDamage / 3;
        //G.bloomPass.threshold = G.viewDamage / 4;

        G.filmPass.uniforms.nIntensity.value = G.viewDamage / 2;
        G.filmPass.uniforms.sIntensity.value = G.viewDamage / 3;
        G.filmPass.uniforms.sCount.value = Math.floor( G.viewDamage * 1024 );
        G.filmPass.uniforms.grayscale.value = ( G.viewDamage > 0.66 ) ? 1 : 0;
        G.filmPass.uniforms.needsUpdate = true;
    }
    
    G.glitchPass.generateTrigger();
}
    setDamage(0);

    G.characters = [
        new Character( 'TommySilverfoot' , false , { isPlayer: true } )
    ];
    G.characters[0].setMood( 'relaxed' );
    G.crowd = new Crowd();
    
    G.player = new Player( G.characters[0] );
    G.mobs = new Mobs();
    G.quests = new Quest();

    G.clock = new Clock();
    G.speech = new SpeechRecognitionHarvester();
    let sound;
    
    G.processCrowd = true;
    G.viewMode = 'thirdPerson';
    G.eyeBone = false;
    G.camera.rotation._order = 'ZYX';
    
    window.createPlayerEntity = () => {
        
        let newToon = new Character(
            'npc' , false , {
                ent: G.playerEnt, 
                gender: G.playerAnimations,
                hairLength: G.playerHairLength,
            }
        );
        G.characters.push( G.characters[0] );
        G.quests.characters.Johnny = G.characters[ G.characters.length - 1 ];
        G.characters[0] = newToon;
        G.player.character = newToon;

        G.music.fadeMusic();
    }
    
    const characterGenerated = (e) => {

        const charGen = document.getElementById( 'CharacterCreation' );
        if( charGen ) {
            charGen.style.display = 'none';
        }
    
        const url = e.data;
        setTimeout( () => {
            G.gltf.load( `${url}?textureAtlas=none` , result => {
                
                if( window.localStorage ) {
                    window.localStorage.setItem( 'characterUrl' , url );
                }
                
                G.playerEnt = result.scene;
                G.playerEnt.scale.set( 100,100,100 );

                G.playerEnt.position.set( 4428.831719689362, 2196.681884765625, -768.73599141624 );
                G.playerEnt.add( G.listener );
                G.playerEnt.rotation.set( 0,0,0 );
                G.playerEnt.traverse( child => {
                    if( child.isMesh ) {
                        child.material = G.lighting.applyLights( child.material );
                    }
                });
                
                G.viewMode = 'freeCam';
                G.camera.position.set( 4428.831719689362, 2396.68188476563, -468.89531947376025 );
                G.camera.lookAt( G.playerEnt.position.x , G.playerEnt.position.y + 150 , G.playerEnt.position.z );
                
                const loader = document.getElementById( 'Loading' );
                if( loader ) {
                    document.body.removeChild( loader );
                }
                
                G.scene.add( G.playerEnt );
                G.gameRunning = true;
                G.quests.quests.AnimationSet.entry = true;
            });
        },1);

    }
    
    const restartGameButton = document.getElementById( 'RestartGame' );
    if( ! window.localStorage || ! window.localStorage.getItem( 'characterUrl' ) ) {
        restartGameButton.style.display = 'none';
    }
    else {
        restartGameButton.addEventListener( 'click' , () => {

            const dialogue = document.getElementById( 'PreGameDialogue' );
            if( dialogue ) {
                dialogue.style.display = 'none';
            }

            characterGenerated({
                data: window.localStorage.getItem( 'characterUrl' )
            });
            
            G.music.play( 'theme' );
            
        });
    }
    const startGameButton = document.getElementById( 'StartGame' );
    startGameButton.addEventListener( 'click' , () => {
        
        const dialogue = document.getElementById( 'PreGameDialogue' );
        if( dialogue ) {
            dialogue.style.display = 'none';
        }
        
        const charGen = document.getElementById( 'CharacterCreation' );
        if( charGen ) {
            charGen.style.display = 'block';
            charGen.src = `https://corpgame.readyplayer.me/avatar`;
        }
        
        window.addEventListener('message', characterGenerated );
        document.addEventListener('message', characterGenerated );        
        
        G.music.play( 'theme' );

    });
    const dialogue = document.getElementById( 'PreGameDialogue' );
    if( dialogue ) {
        dialogue.style.display = 'block';    
    }
 
    G.gameRunning = false;
    G.unlockLoading = 0;
    monitor();
    animate();
 
}
const monitor = () => {
    
    if( G.unlockLoading >= 10 ) {
        const loading = document.getElementById( 'LoadingMessage' );
        if( loading ) {
            loading.style.display = 'none';
        }
        const buttonContainer = document.getElementsByClassName('buttonContainer');
        if( buttonContainer[0] ) {
            buttonContainer[0].style.display = 'flex';
        }
    }
    else {
        setTimeout( () => {
            monitor();
        } , 500 );
    }
}

const animate = () => {
 
let debugTime = {};
 
    stats.begin();
    requestAnimationFrame( animate );
    const delta = G.clock.getDelta();

    if( delta < 0.1 ) G.unlockLoading++;
    G.world.update( delta );

    if( G.sun ) {
        G.sun.position.set( G.camera.position.x-1024*10,  1024*25, G.camera.position.z-1024*5 );
        G.sun.target.position.set( G.camera.position.x, 0, G.camera.position.z );
    }
    
//    const lightX = Math.floor( G.camera.position.x / 50 ) * 50;
//    const lightZ = Math.floor( G.camera.position.z / 50 ) * 50;

//G.updateCam = false;
    if( delta > 0 && G.gameRunning ) {

        G.quests.update( delta );
        G.player.update( delta );
        G.mobs.update( delta );
        if( G.processCrowd ) {
            G.crowd.update( delta );
        }

        if( G.updateCam && G.player.character.ent ) {
            if( G.viewMode === 'firstPerson' ) {
                if( ! G.eyeBone ) {
                    G.characters[0].ent.traverse( child => {
                        if( child.isBone && child.name == 'HeadTop_End' ) {
                            G.eyeBone = child;
                        }
                    });
                }
                
                if( G.lewisGunInPlayerHand ) {

                    G.eyeBone.updateWorldMatrix( true,false );
                    const vector = new Vector3(0,0,0);
                    G.eyeBone.localToWorld( vector );
                    G.camera.position.set( vector.x , vector.y-2 , vector.z );

                    const f = Math.PI + G.characters[0].ent.rotation.y;
                    for( let i=1 ; i<delta*100 ; i++ ) {
                        G.camera.rotation.set(
                            G.camera.rotation.x * 0.99 +
                            - ( ( G.player.mouse.y * Math.PI/2 ) - Math.PI/4 ) * 0.01
                        , f , 0 );
                    }
                }
                else {
                    G.eyeBone.updateWorldMatrix( true,false );
                    const vector = new Vector3(0,0,0);
                    G.eyeBone.localToWorld( vector );
                    G.camera.position.set( vector.x , vector.y-2 , vector.z );

                    const f = Math.PI + G.characters[0].ent.rotation.y;
                    for( let i=1 ; i<delta*100 ; i++ ) {
                        G.camera.rotation.set(
                            G.camera.rotation.x * 0.99 +
                            - ( ( G.player.mouse.y * Math.PI/2 ) - Math.PI/4 ) * 0.01
                        , f , 0 );
                    }
                    G.camera.translateZ(0,0,2.5);

                }

            }
            else if( G.viewMode === 'thirdPerson' ) {

                G.player.character.ent.updateWorldMatrix(false,false);

                const dx = ( G.player.character.ent.position.x - Math.sin( G.player.character.ent.rotation.y ) * 300 ) * 0.02;
                const dy = ( G.player.character.ent.position.y +200 ) * 0.02;
                const dz = ( G.player.character.ent.position.z - Math.cos( G.player.character.ent.rotation.y ) * 300 ) * 0.02;
                
                const tx = G.player.character.ent.position.x * 0.02;
                const ty = ( G.player.character.ent.position.y +150 ) * 0.02;
                const tz = G.player.character.ent.position.z * 0.02;

                for( let i=0 ; i<delta*50 ; i++ ) {
                    G.camera.position.x = G.camera.position.x * 0.98 + dx;
                    G.camera.position.z = G.camera.position.z * 0.98 + dz;
                    G.camera.position.y = G.camera.position.y * 0.98 + dy;

                    G.controls.target.x = G.controls.target.x * 0.98 + tx;
                    G.controls.target.y = G.controls.target.y * 0.98 + ty;
                    G.controls.target.z = G.controls.target.z * 0.98 + tz;
                }

                G.world.source.set( G.player.character.ent.position.x , G.player.character.ent.position.y+200 , G.player.character.ent.position.z );
                
                const cx = G.camera.position.x - G.player.character.ent.position.x;
                const cy = G.camera.position.y - (G.player.character.ent.position.y+200);
                const cz = G.camera.position.z - G.player.character.ent.position.z;
                const dr = Math.sqrt( cx*cx + cy*cy + cz*cz );
                G.world.vector.set( cx, cy, cz ).normalize();
                G.world.raycaster.set( G.world.source , G.world.vector );
                G.world.raycaster.far = dr;
            
                const intersects = G.world.raycaster.intersectObjects( G.world.getColliders( G.camera.position.x , G.camera.position.z ) , true );
                if( intersects.length > 0 && intersects[0].distance < dr ) {
                    G.camera.position.set( intersects[0].point.x , intersects[0].point.y , intersects[0].point.z );
                }
                
                G.camera.lookAt( G.controls.target.x , G.controls.target.y , G.controls.target.z );
            }
        }
        else {
            //G.controls.update();   
        }
    }
    
    G.lighting.update( delta );
    G.composer.render( delta );
    G.corpses.update( delta );
    //G.renderer.render( G.scene , G.camera );
    /*
    setTimeout( () => {
        animate();
    } , 0 );
    */
    stats.end();
    
}

init3d();

