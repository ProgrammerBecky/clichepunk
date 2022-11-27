import {
    MeshStandardMaterial,
    MeshBasicMaterial,
    Vector3,
    Quaternion,
    Color,
    VideoTexture,
    Object3D,
    
    DoubleSide,
    Raycaster,
    
    BufferGeometry,
    PointsMaterial,
    Points,
} from 'three';
import {
    clone,
} from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import { G } from './../G.js';

//import { triplanar } from './triplanar.js';
import {
    prefabs,
    glossyColour,
    standardColour,
    standardTexture,
    halfAlphaTest,
    quarterAlphaTest,
    emissiveColour,
} from './CityStandardMats.js';
import {
    pipelineExport,
} from './PipelineExport.js';
import {
    rebuildSingleSurface,
} from './RebuildSingleSurface.js';

const EXPORT_MODE = false;
if( EXPORT_MODE ) {
    pipelineExport();
}

export class City {
    
    constructor() {

        this.colliderSet = {};
        
        this.raycaster = new Raycaster();
        this.raycaster.firstHitOnly = true;
        this.source = new Vector3();
        this.vector = new Vector3();
        
        this.meshes = {};
        this.advertTimer = 0;
        this.alternator = 'A';
        this.loadMaterials();
        
        this.rotatingElements = [];
        this.reverseRotatingElements = [];
        
        const model = ['RevisedCity'];//'World'; //FullWorld
        this.city = new Object3D();
        
        let loadedMeshes = 0;
        this.lightList = [];
        
        this.loadPasties();
        
        model.map( file => {
        //['FullWorld'].map( file => {
            console.log( file );
            G.fbx.load( `3d/high/city/Imports/${file}.fbx` , result => {
            //G.gltf.load( '3d/high/city/City.gltf' , result => {
                //result = result.scene;
                
                loadedMeshes++;
                
                let lightList = [];
                
                let removeList = [];
                result.traverse( child => {
                   
                    if( child.name.substr(0,11) === 'Street_Lamp' && child.name.indexOf( '_LOD' ) === -1 ) {
                        let vector = new Vector3(0,0,0);
                        child.localToWorld( vector );

                        lightList.push({
                           position: vector.clone(),
                           name: 'Street Light',
                           color: {r:1.0,g:0.95,b:0.9},
                        });
                    }
                   
                    if( child.isLight ) {
                        let vector = new Vector3(0,0,0);
                        child.localToWorld( vector );
                    
                        if( vector.y > 0 ) {
                            lightList.push({
                               position: vector.clone(),
                               name: child.name,
                               color: child.color,
                            });
                        }
                        removeList.push( child );
                   }  
                   if( child.name.toLowerCase().substr(0,4) === 'line' ) {
                       removeList.push( child );
                   }
                   
                   if( child.isMesh ) {
                       child.geometry.deleteAttribute( 'uv2' );
                   }
                   
                    if( ['SpinA'].includes( child.name.substr(0,5) ) ) {
                        this.rotatingElements.push( child );
                    }
                    if( ['SpinB'].includes( child.name.substr(0,5) ) ) {
                        this.reverseRotatingElements.push( child );
                    }    
                });
                while( removeList.length > 0 ) {
                    const killIt = removeList.shift();
                    killIt.parent.remove( killIt );
                }
                
                this.paint( result );
                
                this.city.add( result );
                if( loadedMeshes === model.length ) {
                    this.ent = rebuildSingleSurface( this.city , this.rotatingElements , this.reverseRotatingElements );
                    delete this.city;
                    G.scene.add( this.ent );                 
                }
                G.lighting.addLights( lightList );
                
            });    
        });
        
    }
    
    loadPasties() {
        
        this.pastyEnts = [];
        const locations = [
            {x: 2618.1628600604085, y: 2338.3330078125, z: -990.5152212127008},
            {x: 10535.137406384629, y: 1012.3040771484375, z: -8597.02647849197},
            {x: -3816.1840013544265, y: -331.15545061163516, z: -6368.87222594827},
            {x: 16855.30947965208, y: 530.0804387174406, z: 3445.3883406388354},
            {x: 7946.685667946499, y: 71.30361994890329, z: 7498.47392138222},
            {x: 10753.511242505541, y: 169.70327076028644, z: 6541.830173191738},
            {x: 8176.779637838315, y: 115.42318797422189, z: 1690.4665540933054},
            {x: 3039.5173913630774, y: 532.3486938476562, z: 6728.759456993783},
            {x: -1052.6860074082786, y: 2720.636962890625, z: -7627.93958011943},
            {x: -7143.514729016183, y: 532.5167236328125, z: -16756.719970987393}
        ];
        
        G.gltf.load( '3d/high/pasty/Pasty.glb' , result => {
           locations.map( loc => {
               const pasty = clone( result.scene );
               pasty.position.set( loc.x , loc.y , loc.z );
               G.scene.add( pasty );
               this.pastyEnts.push( pasty );
           });
        });
        
    }
    
    getColliders( x , z , wideArea ) {
        
        let colliders = [];
        let matches = [];
        const matchMode = ( wideArea ) ? 'slim' : 'fat';
        const sx = 8+Math.floor( x/5000 );
        const sz = 8+Math.floor( z/5000 );
        
        if( this.ent ) {        
        
            if( wideArea ) {
                
                for( let x=sx-2 ; x<=sx+2 ; x++ ) {
                    for( let z=sz-2 ; z<=sz+2 ; z++ ) {
                        matches.push( `World${x}x${z}` );
                    }
                }
            }
            else {
            
                let ex,ez;
                const dx = x - sx;
                if( dx < 0.1 ) ex = sx - 1;
                if( dx > 0.9 ) ex = sx + 1;
                const dz = z - sz;
                if( dz < 0.1 ) ez = sz - 1;
                if( dz > 0.9 ) ez = sz + 1;
                
                matches = [`World${sx}x${sz}`];
                if( ex ) {
                    matches.push( `World${ex}x${sz}` );
                }
                if( ez ) {
                    matches.push( `World${sx}x${ez}` );
                    if( ex ) {
                        matches.push( `World${ex}x${ez}` );
                    }
                }
                
            }

            matches.map( match => {
                if( this.colliderSet[ match ] ) {
                   colliders = colliders.concat( this.colliderSet[ match ] );
                }
                else {
                   this.colliderSet[ match ] = [];
                   this.ent.children.map( child => {
                        let namePart = child.name.substr( 0 , child.name.indexOf( '|' ) );
                        if( match.includes( namePart ) ) {
                            this.colliderSet[ match ].push( child );
                            colliders.push( child );
                        }
                   });                   
                }
            });
            
            return colliders;
            
        }
        
        return [];
        
    }
    
    getHeight( vector , extended = false ) {
        
        const colliders = this.getColliders( vector.x , vector.z , true );
        
        const heightAbove = ( extended ) ? 5000 : 100;
        this.source.set( vector.x , vector.y + heightAbove , vector.z );
        this.vector.set( 0 , -1 , 0 );
        this.raycaster.far = ( extended ) ? 10000 : 200;
        this.raycaster.set( this.source , this.vector );
        
        const intersects = this.raycaster.intersectObjects( colliders , true );
        if( intersects.length > 0 ) {
            if( intersects[0].point.y < vector.y ) {
                return {
                    y: vector.y,
                    gravity: true,
                    floorHeight: intersects[0].point.y,
                };
            }
            else {
                return {
                    y: intersects[0].point.y,
                    gravity: false,
                    floorHeight: intersects[0].point.y,
                };
            }
        }
        else {
            return {
                y: vector.y,
                gravity: true,
                floorHeight: vector.y,
            };
        }
        
    }
    slide({ start, bearing, distance }) {

        const colliders = this.getColliders( start.x , start.z , false );

        this.source.set( start.x , start.y , start.z );
        this.vector.set( Math.sin( bearing ) , 0 , Math.cos( bearing ) );
        this.raycaster.set( this.source , this.vector );
        this.raycaster.far = distance;
     
        let intersects = this.raycaster.intersectObjects( colliders , true );

        if( intersects.length === 0 || intersects[0].distance > distance ) {
            return {
                dx: start.x + Math.sin( bearing ) * distance,
                dz: start.z + Math.cos( bearing ) * distance,
            };            
        }
        else {
            
            for( let dir=0.25 ; dir<Math.PI/2 ; dir += 0.5 ) {
                this.vector.set( Math.sin( bearing + dir ) , 0 , Math.cos( bearing + dir ) );
                this.raycaster.set( start , this.vector );
                intersects = this.raycaster.intersectObjects( colliders , true );
                if( intersects.length === 0 || intersects[0].distance > distance ) {               
                    return {
                        dx: start.x + Math.sin( bearing+dir ) * distance,
                        dz: start.z + Math.cos( bearing+dir ) * distance,
                    };
                }
                else {
                    this.vector.set( Math.sin( bearing - dir ) , 0 , Math.cos( bearing - dir ) )
                    this.raycaster.set( start , this.vector );
                    intersects = this.raycaster.intersectObjects( colliders , true );
                    if( intersects.length === 0 || intersects[0].distance > distance ) {
                        return {
                            dx: start.x + Math.sin( bearing-dir ) * distance,
                            dz: start.z + Math.cos( bearing-dir ) * distance,
                        };
                    }
                }
                
            }
            
            return {
                dx: start.x,
                dz: start.z,
            };
            
        }
    }

    update( delta ) {
        this.advertTimer += delta;
        if( this.advertTimer > 5 ) {
            this.advertTimer = 0;
            this.changeAdvert();
        }
        
        this.rotatingElements.map( rotator => {
           rotator.rotation.y += delta * 0.15; 
        });
        this.reverseRotatingElements.map( rotator => {
            rotator.rotation.y -= delta * 0.15; 
        });
        
        if( G.characters[0].ent ) {
            const px = G.characters[0].ent.position.x + Math.sin( G.characters[0].ent.rotation.y ) * 100;
            const pz = G.characters[0].ent.position.z + Math.cos( G.characters[0].ent.rotation.y ) * 100;
            this.pastyEnts.map( pasty => {
                
                const dy = Math.abs( pasty.position.y - G.characters[0].ent.position.y );
                let dx = Math.abs( pasty.position.x - px );
                let dz = Math.abs( pasty.position.z - pz );
                const dr = ( dx > dz ) ? dx + dz * 0.33 : dz + dx * 0.33;
                if( dr < 100 && dy < 200 ) {
                    this.showPastyPrompt( pasty );
                }
                else if( pasty == this.shownPastyPrompt ) {
                    this.hidePastyPrompt();
                }
            });
        }
    }
    
    pickupPasty() {
        if( this.shownPastyPrompt ) {
            this.shownPastyPrompt.position.set( 0 , -999999 , 0 );
            G.scene.remove( this.shownPastyPrompt );
            this.hidePastyPrompt();
            return true;
        }
        return false;
    }
    
    hidePastyPrompt() {
        document.body.removeChild( this.pastyPrompt );
        this.pastyPrompt = false;
        this.shownPastyPrompt = false;
    }
    showPastyPrompt( pasty ) {
        if( pasty !== this.shownPastyPrompt ) {
            this.shownPastyPrompt = pasty;
            if( ! this.pastyPrompt ) {
                this.pastyPrompt = document.createElement( 'div' );
                this.pastyPrompt.classList.add( 'options' );
                this.pastyPrompt.innerHTML = '[F] Pickup Pasty';
                document.body.appendChild( this.pastyPrompt );
            }
        }
    }

    paint( mesh ) {
        
        mesh.traverse( child => {
           if( child.isMesh ) {
               if( child.name.substr(0,4) === 'line' ) child.material = this.mat.line;
               if( Array.isArray( child.material) ) {
                    child.material.map( (mat,index) => {
                       child.material[index] = this.checkMatName( mat ); 
                    });
                }
                else {
                    child.material = this.checkMatName( child.material );
                }
           }
            else if( child.isLight ) {
                console.log( 'LIGHT', child.name );
            }    
        });
        
    }

    checkMatName( material ) {

        if( this.mat[ material.name ] ) {
            material.dispose();
            material = this.mat[ material.name ];
        }
        else if( material.name.indexOf( 'Video' ) > -1 ) {
            material.dispose();
            material = this.mat.Video;
        }
        else {
            if( material.name.indexOf( '3840x1080' ) > -1 ) {
                material.dispose();
                if( this.alternator === 'A' ) {
                    this.alternator = 'B';
                    material = this.advertLandscapeA;
                }
                else {
                    this.alternator = 'A';
                    material = this.advertLandscapeB;                    
                }
            }
            else if( material.name.indexOf( '1080x3840' ) > -1 ) {
                material.dispose();
                if( this.alternator === 'A' ) {
                    this.alternator = 'B';
                    material = this.advertPortraitA;
                }
                else {
                    this.alternator = 'A';
                    material = this.advertPortraitB;                    
                }                
            }
            else if( material.name.indexOf( '1920x1080' ) > -1 ) {
                material.dispose();
                material = this.mat.Video;
            }
            else if( material.name === 'Material_1' ) {
                material.dispose();
                material = this.mat.materialA;
            }
            else if( ['Emission_02','Emission_03'].includes( material.name ) ) {
                material.dispose();
                material = this.mat.Emission;
            }
            else {
                material.dispose();
                material = this.mat.Video;
                //console.log( 'Unknown Material' , material );
            }
        }
        
        return material;
    }

    loadMaterials() {
        
        let video = document.createElement( 'video' );
        video.setAttribute( 'autoplay' , true );
        video.setAttribute( 'loop' , true );
        video.src = '3d/high/city/AdVideoRollLandscape.mp4';
        
        const textureA = G.texture.load( '3d/high/city/Imports/Texture_A.png' );
        const logoTexture = G.texture.load( '3d/high/city/Imports/Texture_Logo_01.png' );
        const logo01Material = {
           map: logoTexture,
           envMap: G.environmentMap,
           metalness: 0.8,
           roughness: 0.8,
           transparent: true,
           depthTest: true,
           depthWrite: false,
           alphaTest: 0.5,
        };
        const logo01MattMaterial = {
           map: logoTexture,
           envMap: G.environmentMap,
           metalness: 0.2,
           roughness: 0.8,
           transparent: true,
           depthTest: true,
           depthWrite: false,
           alphaTest: 0.5,            
        };
        const matGlassTransparent = {
            transparent: true,
            opacity: 0.4,
            depthTest: true,
            depthWrite: true,
            roughness: 0,
            metalness: 0.8,
            envMap: G.environmentMap,  
        };
        
        this.advertLandscapeA = new MeshBasicMaterial({name:'advertLandscapeA'});
        this.advertLandscapeB = new MeshBasicMaterial({name:'advertLandscapeB'});
        this.advertPortraitA = new MeshBasicMaterial({name:'advertPortraitA'});
        this.advertPortraitB = new MeshBasicMaterial({name:'advertPortraitB'});
        
        this.mat = {
            Video: new MeshBasicMaterial({
                map: new VideoTexture( video ),
            }),
            Material_A: new MeshStandardMaterial({
               envMap: G.environmentMap,
               metalness: 0.35,
               roughness: 0.8,
               map: textureA,
            }),
            Material_A_Glossy_Grey: new MeshStandardMaterial({
               color: '#DDDDDD',
               envMap: G.environmentMap,
               metalness: 0.8,
               roughness: 0.2,
               map: textureA,
            }),
            Material__Emission_Off: new MeshStandardMaterial({
               envMap: G.environmentMap,
               metalness: 0.5,
               roughness: 1.0,
               map: textureA,
            }),
            Material__Emission_On: new MeshStandardMaterial({
               envMap: G.environmentMap,
               metalness: 0.2,
               roughness: 1.0,
               map: textureA,
               emissiveMap: textureA,
            }),
            Material_A_Glass: new MeshStandardMaterial({
               envMap: G.environmentMap,
               metalness: 0.8,
               roughness: 0.2,
               map: textureA,               
            }),
            Emission: emissiveColour( '#00ff00' ),
            Material_A_Glass_Emission_Dark: emissiveColour('#3E474F'),
            Material_A_Glass_Emission_Light: emissiveColour('#C0BAAD'),
            Material_A_Glass_Transparent: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#4D5867',
            }),
            Material_A_Glass_Transparent_Blue: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#4D7FA1',
            }),
            Material_A_Glass_Transparent_Blue_Dark_01: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#40616F',
            }),
            Material_A_Glass_Transparent_Blue_Dark_02: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#122433',
            }),
            Material_A_Glass_Transparent_Brown: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#462F26',
            }),
            Material_A_Glass_Transparent_Green: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#618752',
            }),
            Material_A_Glass_Transparent_Orange: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#936443',
            }),
            Material_A_Glass_Transparent_Red: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#994741',
            }),
            Material_A_Glass_Transparent_Turquoise: new MeshStandardMaterial({
                ...matGlassTransparent,
               color: '#234246',
            }),
            Alpha_01: new MeshStandardMaterial({
                envMap: G.environmentMap,
                metalness: 0.8,
                roughness: 0.6,
                map: G.texture.load( '3d/high/city/Imports/Texture_Alpha_01.png' ),
                alphaMap: G.texture.load( '3d/high/city/Imports/Texture_Alpha_01_Alpha Map.png' ),
                transparent: true,
            }),
            Floor_01_A: standardTexture( 'Floor_01_A.png' ),
            Floor_01_A_02: standardTexture( 'Floor_01_A_02.png' ),
            Floor_01_B: standardTexture( 'Floor_01_B.png' ),
            Floor_01_C: standardTexture( 'Floor_01_C.png' ),
            Floor_01_D: standardTexture( 'Floor_01_D.png' ),
            Floor_01_E: standardColour( '#ffffff' ),
            Floor_01_F: standardTexture( 'Floor_01_F.png' ),
            Floor_01_G: standardTexture( 'Floor_01_G.png' ),
            Floor_01_H: standardTexture( 'Floor_01_H.png' ),
            Floor_01_I: standardTexture( 'Floor_01_I.png' ),
            Graffiti_01: halfAlphaTest( 'Texture_Graffiti_01.png' ),
            Graffiti_02: halfAlphaTest( 'Texture_Graffiti_02.png' ),
            Graffiti_03: halfAlphaTest( 'Texture_Graffiti_03.png' ),
            Graffiti_04: halfAlphaTest( 'Texture_Graffiti_04.png' ),
            Logo_01_Glossy_Black: new MeshStandardMaterial({
                ...logo01Material,
                color: '#303030',            
            }),
            Logo_01_Glossy_Blue: new MeshStandardMaterial({
                ...logo01Material,
                color: '#354967',            
            }),
            Logo_01_Glossy_Green: new MeshStandardMaterial({
                ...logo01Material,
                color: '#3A5738',
            }),
            Logo_01_Glossy_Orange: new MeshStandardMaterial({
                ...logo01Material,
                color: '#BE7637',
            }),
            Logo_01_Glossy_Purple: new MeshStandardMaterial({
               ...logo01Material,
               color: '#694678',
            }),
            Logo_01_Glossy_Red:  new MeshStandardMaterial({
                ...logo01Material,
                color: '#B3362D',
            }),
            Logo_01_Glossy_White:  new MeshStandardMaterial({
                ...logo01Material,
                color: '#FFFFFF',
            }),
            Logo_01_Glossy_Yellow:  new MeshStandardMaterial({
                ...logo01Material,
                color: '#CC942B',
            }),
            Logo_01_Matt_Black: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#303030',
            }),
            Logo_01_Matt_Blue: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#354967',
            }),
            Logo_01_Matt_Green: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#3A5738',
            }),
            Logo_01_Matt_Orange: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#BE7637',
            }),
            Logo_01_Matt_Purple: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#694678',
            }),
            Logo_01_Matt_Red: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#B2362D',
            }),
            Logo_01_Matt_White: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#FFFFFF',
            }),
            Logo_01_Matt_Yellow: new MeshStandardMaterial({
                ...logo01MattMaterial,
                color: '#CC942B',
            }),
            Colour_Beige: standardColour( '#ADA69E' ),
            Colour_Beige_Dark: standardColour( '#7B7466' ),
            Colour_Black: standardColour( '#242424' ),
            Colour_Blue: standardColour( '#516589' ),
            Colour_Blue_Dark: standardColour( '#282A2E' ),
            Colour_Blue_Light: standardColour( '#747D8C' ),
            Colour_Blue_Medium: standardColour( '#424851' ),
            Colour_Brown: standardColour( '#514B42' ),
            Colour_Brown_Light: standardColour( '#6C655F' ),
            Colour_Glossy_Black: glossyColour( '#282A2E' ),
            Colour_Glossy_Blue_Light: glossyColour( '#41506F' ),
            Colour_Glossy_Blue_Medium: glossyColour( '#424851' ),
            Colour_Glossy_Blue_Dark: glossyColour( '#282A2E' ),
            Colour_Glossy_Grey_Dark: glossyColour( '#3F3F3F' ),
            Colour_Glossy_Grey_Light: glossyColour( '#999999' ),
            Colour_Glossy_Grey_Medium: glossyColour( '#636363' ),
            Colour_Green: standardColour( '#466743' ),
            Colour_Green_Light: standardColour( '#7AB820' ),
            Colour_Grey_Dark: standardColour( '#3F3F3F' ),
            Colour_Grey_Light: standardColour( '#999999' ),
            Colour_Grey_Light_02: standardColour( '#8E8E8E' ),
            Colour_Grey_Medium: standardColour( '#636363' ),
            Colour_Orange: standardColour( '#C3692D' ),
            Colour_Orange_Light: standardColour( '#B4927B' ),
            Colour_Purple: standardColour( '#763A62' ),
            Colour_Red: standardColour( '#994741' ),
            Colour_Red_Light: standardColour( '#C45454' ),
            Colour_Red_Medium: standardColour( '#904E4A' ),
            Colour_Turquoise: standardColour( '#3B5B5E' ),
            Colour_White: standardColour( '#DDDDDD' ),
            Colour_Yellow: standardColour( '#CC9429' ),
            Colour: standardColour( '#aaaaaa' ),
            Material: standardColour( '#333333' ),
            Emission_Apricot: emissiveColour( '#E2A35D' ),
            Emission_Apricot_None_GI: emissiveColour( '#EC944D' ),
            Emission_Blue: emissiveColour( '#2E68D1' ),
            Emission_Blue_None_GI: emissiveColour( '#0086FF' ),
            Emission_Green: emissiveColour( '#7EFF00' ),
            Emission_Green_None_GI: emissiveColour( '#7FFF00' ),
            Emission_Orange: emissiveColour( '#C3602F' ),
            Emission_Orange_None_GI: emissiveColour( '#FF6900' ),
            Emission_Purple: emissiveColour( '#AD32C0' ),
            Emission_Purple_None_GI: emissiveColour( '#C721C8' ),
            Emission_Red: emissiveColour( '#B01F1F' ),
            Emission_Red_None_GI: emissiveColour( '#90282C' ),
            Emission_White: emissiveColour( '#FFFFFF' ),
            Emission_White_None_GI: emissiveColour( '#FFFFFF' ),
            Emission_Yellow: emissiveColour( '#FFAD00' ),
            Emission_Yellow_None_GI: emissiveColour( '#F8A500' ),
            Papers_Abandoned: halfAlphaTest( 'Texture_Papers_Abandoned.png' ),
            Pattern_01_A: standardTexture( 'Pattern_01_A.png' ),
            Pattern_01_B: standardTexture( 'Pattern_01_B.png' ),
            Pattern_01_C: standardTexture( 'Pattern_01_C.png' ),
            Pattern_01_D: standardTexture( 'Pattern_01_D.png' ),
            Pattern_01_E: standardTexture( 'Pattern_01_E.png' ),
            Pattern_01_F: standardTexture( 'Pattern_01_F.png' ),
            Pattern_01_G: standardTexture( 'Pattern_01_G.png' ),
            Pattern_01_H: standardTexture( 'Pattern_01_H.png' ),
            Pattern_01_I: standardTexture( 'Pattern_01_I.png' ),
            Road_Green: quarterAlphaTest( 'Texture_Road_Green.png' ),
            Road_Red: quarterAlphaTest( 'Texture_Road_Red.png' ),
            Road_White: quarterAlphaTest( 'Texture_Road_White.png' ),
            Road_Yellow: quarterAlphaTest( 'Texture_Road_Yellow.png' ),
            Line: standardColour( '#000000' ),
            
            Signboard_Poster_3840x1080_新しい細胞を入れて_01: this.advertLandscapeA,
            Signboard_Poster_3840x1080_新しい細胞を入れて_02: this.advertLandscapeA,
            Signboard_Poster_3840x1080_New_World_01: this.advertLandscapeA,
            Signboard_Poster_3840x1080_이주계획_01: this.advertLandscapeA,
            Signboard_Poster_3840x1080_Atomic_Tron_01: this.advertLandscapeB,
            Signboard_Poster_3840x1080_Atomic_Tron_02: this.advertLandscapeB,
            Signboard_Poster_3840x1080_統治と権力のための協議_01: this.advertLandscapeB,
            Signboard_Poster_3840x1080_삶을_창작하다_01: this.advertLandscapeB,

            Signboard_Poster_1080x3840_Dream_More_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Dream_More_02: this.advertPortraitB,
            Signboard_Poster_1080x3840_診断誤診率_0_00001__01: this.advertPortraitA,
            Signboard_Poster_1080x3840_화성갈끄니까A_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_화성갈끄니까A_02: this.advertPortraitA,
            Signboard_Poster_1080x3840_놀이창고_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_Metropolis_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Tab_It_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_Cyber_Wear_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Cyber_Wear_02: this.advertPortraitB,
            Signboard_Poster_1080x3840_Neuromod_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Net_is_a_waste_of_time_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_Net_is_a_waste_of_time_02: this.advertPortraitA,
            Signboard_Poster_1080x3840_그냥_그러고_싶어서_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_真の変化_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_脳波調整_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_サムライ精神_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Know_Your_Worth_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_新たなスタート_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_Vivid_Rock_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_Magenta_01: this.advertPortraitA,
            Signboard_Poster_1080x3840_주모여기국밥_01: this.advertPortraitB,
            Signboard_Poster_1080x3840_새로운_세포_01: this.advertPortraitA,
            
            advertLandscapeA: this.advertLandscapeA,
            advertLandscapeB: this.advertLandscapeB,
            advertPortraitA: this.advertPortraitA,
            advertPortraitB: this.advertPortraitB,
            
        }

        for( let i in this.mat ) {
            this.mat[i].name = i;
            this.mat[i].side = DoubleSide;
            if( this.mat[i].envMap ) {
                this.mat[i].envMapIntensity = G.environmentMapIntensity;
            }
            if( ! this.mat[i].color ) this.mat[i].color = new Color(1,1,1);
            this.mat[i] = G.lighting.applyLights( this.mat[i] );
        }
        
        this.changeAdvert();
        
    }
    
    changeAdvert() {

        if( EXPORT_MODE ) return;

        this.alternator = ( this.alternator === 'A' ) ? 'B' : 'A';
        
        if( this.nextLandscapeMap ) {
            this[`advertLandscape${this.alternator}`].map = this.nextLandscapeMap;
            this[`advertLandscape${this.alternator}`].needsUpdate = true;
        }
        if( this.nextPortraitMap ) {
            this[`advertPortrait${this.alternator}`].map = this.nextPortraitMap;
            this[`advertPortrait${this.alternator}`].needsUpdate = true;
        }
        
        let landscapes = [
            'New World_01.png',
            'New World_02.png',
            'Paranoid AI_01.png',
            'Paranoid AI_02.png',
            'We Riot_01.png',
            'We Riot_02.png',
            'NewRomance_01.png',
            'NewRomance_02.png',
            'CreateLife1.png', //create life
            'CreateLife2.png', //create life
            'Relocation Plan 01.png',
            'Relocation Plan 02.png',
            'Atomic Tron_01.png',
            'Atomic Tron_02.png',
            'In Step_01.png',
            'In Step_02.png',
            'CouncilForGovernanceAndPower01.png', //council for governance and power
            'CouncilForGovernanceAndPower02.png', //council for governance and power
            'AddNewCells1.png', //Add New Cells
            'AddNewCells2.png', //Add New Cells
        ];
        for( let i=1; i<=17 ; i++ ) {
            landscapes.push( `Landscape Ads (${i}).mp4` );
        }  
        const landscapeIndex = Math.floor( Math.random() * landscapes.length );
        const landscapeAd = landscapes[ landscapeIndex ];
        
        if( landscapeAd.indexOf( '.mp4' ) > -1 ) {
            let video = document.createElement( 'video' );
            video.setAttribute( 'autoplay' , true );
            video.setAttribute( 'loop' , true );
            video.src = `3d/high/city/LandscapeAds/${landscapeAd}`;
        
            this.nextLandscapeMap = new VideoTexture( video );        
        }
        else {
            this.nextLandscapeMap = G.texture.load( `3d/high/city/StaticLandscapeAds/${landscapeAd}` );
        }
        
        let portraits = [
            'Anonymous_01.png',
            'Anonymous_02.png',
            'Cyber Wear_01.png',
            'Cyber Wear_02.png',
            'Dream More_01.png',
            'Dream More_01.png',
            'Know Your Worth_01.png',
            'Know Your Worth_02.png',
            'Magenta_01.png',
            'Magenta_02.png',
            'Metropolis_01.png',
            'Metropolis_02.png',
            'Net is a waste of time_01.png',
            'Net is a waste of time_02.png',
            'Neuromod_01.png',
            'Neuromod_02.png',
            'new_cell_01.png',
            'Tab It_01.png',
            'Tab It_02.png',
            'Vivid Rock_01.png',
            'Vivid Rock_02.png',
            'Samurai Spirit_01.png',
            'Samurai Spirit_02.png',
            'Misdiagnosis Rate_01.png',
            'Misdiagnosis Rate_02.png',
            'ImGoingToMars01.png',
            'ImGoingToMars02.png',
            'Playhouse1.png',
            'Playhouse2.png',
            'IJustWantTo1.png',
            'IJustWantTo2.png',
            'RealChange1.png',
            'RealChange2.png',
            'EEG Adjustment1.png',
            'EEG Adjustment2.png',
            'NewStart1.png',
            'NewStart2.png',
            'JumboSoupRice1.png', //jumo here soup rice     
            'JumboSoupRice2.png', //jumo here soup rice     
        ];
        for( let i=1; i<=17 ; i++ ) {
            portraits.push( `PortraitAdVideo (${i}).mp4` );
        }
        const portraitIndex = Math.floor( Math.random() * portraits.length );
        const portraitAd = portraits[ portraitIndex ];
        
        if( portraitAd.indexOf( '.mp4' ) > -1 ) {
            let video = document.createElement( 'video' );
            video.setAttribute( 'autoplay' , true );
            video.setAttribute( 'loop' , true );
            video.src = `3d/high/city/PortraitAds/${portraitAd}`;
        
            this.nextPortraitMap = new VideoTexture( video );        
        }
        else {
            this.nextPortraitMap = G.texture.load( `3d/high/city/StaticPortraitAds/${portraitAd}` );
        }
        
    }
    
    setCyberspace( bool ) {
        if( bool ) {
            if( ! this.cyberspace ) {
                this.enterCyberspace();
            }
            else {
                G.scene.add( this.cyberspace );
                G.scene.remove( this.ent );
            }
            G.bloomPass.strength = 0.8;
            G.bloomPass.radius = 2;
            G.bloomPass.treshold = 0.25;  
            G.composer.removePass( G.SSAOPass );
        }
        else {
            G.scene.remove( this.cyberspace );
            G.scene.add( this.ent );
            G.bloomPass.strength = 0.2;
            G.bloomPass.radius = 0.8;
            G.bloomPass.treshold = 0.5; 
            G.composer.removePass( G.bloomPass );    
            G.composer.removePass( G.SMAAPass );

            G.composer.addPass( G.SSAOPass );
            G.composer.addPass( G.bloomPass );    
            G.composer.addPass( G.SMAAPass );
        }
            
    }
    
    enterCyberspace() {
        
        this.cyberspace = new Object3D();
        
        let pointMat = {};
        
        this.ent.traverse( child => {
           if( child.isMesh ) {
                
                const geometry = new BufferGeometry();
                geometry.setAttribute( 'position' , child.geometry.getAttribute( 'position' ) );
                
                let colour = child.material.color;
                if( ! colour ) colour = { r:1, g:1, b:1 };
                let v = new Vector3( colour.r , colour.g , colour.b );
                const longest = Math.max( Math.max( v.x , v.y ) , v.z );
                v.x /= longest;
                v.y /= longest;
                v.z /= longest;
                
                const colourIndex = Math.floor( v.x * 255 + v.y * 255 * 255 + v.z * 255 * 255 * 255 );
                
                if( ! pointMat[ colourIndex ] ) {
                    pointMat[ colourIndex ] = new PointsMaterial({
                        size: 25,
                        color: new Color( v.x * 0.9 + 0.1 , v.y * 0.6 + 0.4 , v.z * 0.3 + 0.7 ),
                    });
                }
                
                const mesh = new Points(
                    geometry,
                    pointMat[ colourIndex ],
                );
                mesh.position.set( child.position.x , child.position.y , child.position.z );
                mesh.rotation.set( child.rotation.x , child.rotation.y , child.rotation.z );
                this.cyberspace.add( mesh );
           }               
        });
        
        G.scene.remove( this.ent );
        G.scene.add( this.cyberspace );
        console.log( this.cyberspace );
    }
    
}