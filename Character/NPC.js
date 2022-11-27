import { G } from './../G.js';

export class NPC {

    constructor( character ) {
        
        this.update = this.update.bind( this );
        this.converseWithNPC = this.converseWithNPC.bind( this );
        
        this.firstLoad = true;
        this.character = character;
        this.lastNodeHeight = -9999999;
        this.checkHeightTimer = 1;
        this.lastPathIndex = -99999999;
        this.checkCamRange = 0;
        this.htCheckFrame = 0;
        this.type = 'walking';
        this.pointTimer = 0;
    }
    
    update( delta ) {
        if( ! this.character.ent ) return;
        
        let anim = 'Idle';
        let doHeightCheck = false;

        if( this.type === 'faceQuest' ) {
            let nearest = false;
            let range = 9999;
            for( let i in G.quests.characters ) {
            
                const character = G.quests.characters[i];
            
                const dx = character.ent.position.x - this.character.ent.position.x;
                const dz = character.ent.position.z - this.character.ent.position.z;
                const dr = Math.sqrt( dx*dx + dz*dz );
                if( dr < range ) {
                    range = dr;
                    nearest = Math.atan2( dx , dz );
                }
                
            }
            
            anim = this.pointAt( nearest , delta , anim );
            
        }
        if( this.type === 'facePasty' ) {
            
            let nearest = false;
            let range = 9999;
            
            G.world.pastyEnts.map( pasty => {
                
                if( pasty.position.y > -999999 ) {
                    const dx = pasty.position.x - this.character.ent.position.x;
                    const dz = pasty.position.z - this.character.ent.position.z;
                    const dr = Math.sqrt( dx*dx + dz*dz );
                    if( dr < range ) {
                        range = dr;
                        nearest = Math.atan2( dx , dz );
                    }                
                }
            });
            
            anim = this.pointAt( nearest , delta , anim );
            
        }
        else if( this.type === 'walking' ) {
            if( ! this.nav ) {
                this.nav = this.findNearestPath();
                this.lastNodeHeight = this.nav.node.position.y;
                this.lastPathIndex = this.nav.pathIndex;
            }
            else {

                const dx = this.nav.node.position.x - this.character.ent.position.x;
                const dz = this.nav.node.position.z - this.character.ent.position.z;
                const dr = Math.sqrt( dx*dx + dz*dz );
                if( dr < 150 ) {
                    this.nav.nodeIndex += this.nav.direction;
                    if( G.paths[ this.nav.pathIndex ].nodes[ this.nav.nodeIndex ] ) {
                        this.lastNodeHeight = this.nav.node.position.y;
                        this.nav.node = G.paths[ this.nav.pathIndex ].nodes[ this.nav.nodeIndex ].clone();
                        this.nav.node.position.x += Math.random() * 200 - 100;
                        this.nav.node.position.z += Math.random() * 200 - 100;
                    }
                    else {
                        this.nav = false;                    
                    }
                }
                else {
                    let df = Math.atan2( dx , dz ) - this.character.ent.rotation.y;
                    if( df > Math.PI ) df -= Math.PI * 2;
                    if( df < -Math.PI ) df += Math.PI * 2;
                    if( df > 0.05 ) {
                        this.character.turn( delta , Math.min( 2 , df ) );
                    }
                    else if( df < -0.05 ) {
                        this.character.turn( delta , Math.max( -2 , df ) );
                    }
                    
                    if( df > -0.7 && df < 0.7 ) {
                        this.character.move( 130 , delta );
                        anim = 'Walk';
                    }
                }
                
            }

            const checkHeight = ( this.nav ) ? this.nav.node.position.y !== this.lastNodeHeight : false;
            if( checkHeight ) {
                this.checkHeightTimer = 5;
            }
            else {
                this.checkHeightTimer -= delta;
            }

            if( this.checkHeightTimer > 0 ) {
                this.htCheckFrame++;
                if( this.htCheckFrame > 0 ) {
                    this.htCheckFrame -= 0.1;
                    doHeightCheck = true;
                }
            }
        }
        
        this.character.setAnimation( anim , true , 'fast' );
        this.character.update( delta , doHeightCheck );
        
        this.checkCamRange += delta;
        if( this.checkCamRange > 0 ) {
            this.checkCamRange = -0.1;
            const dx = G.characters[0].ent.position.x - this.character.ent.position.x;
            const dz = G.characters[0].ent.position.z - this.character.ent.position.z;
            const dr = Math.sqrt( dx*dx + dz*dz );
            if( dr > 1024 * 8 ) {
                const bearing = Math.random() * Math.PI * 2;
                const cx = G.camera.position.x + Math.sin( bearing ) * 1024 * 7;
                const cz = G.camera.position.z + Math.cos( bearing ) * 1024 * 7;
                this.nav = false;
                this.character.ent.position.set( cx , G.camera.position.y , cz );
                this.firstLoad = true;
            }
            
            if( dr < 250 && ! G.hailedNPC ) {
                const opt = document.getElementById( 'Options' );
                if( opt.innerHTML.trim() === '' ) {
                    this.buildHailNPCOptions( opt );
                }
            }
            else if( G.hailedNPC === this && dr > 500 ) {
                this.type = 'walking';
                const opt = document.getElementById( 'Options' );
                opt.innerHTML = ''
                G.hailedNPC = false;
                G.quests.quests.talkWithNPC.entry = false;
                G.quests.quests.talkWithNPC.active = false;
            }

        }
        
    }
    
    pointAt( nearest , delta , anim ) {
        
        let left = ( nearest - this.character.ent.rotation.y ) % ( Math.PI * 2 );
        while( left < 0 ) left += Math.PI*2;
        let right = ( this.character.ent.rotation.y - nearest ) % ( Math.PI * 2 );
        while( right < 0 ) right += Math.PI*2;

        if( left < right ) {
            if( left > 0.1 ) {
                this.character.ent.rotation.y += delta
            }
            else {
                anim = 'Pointing';
            }
        }
        else if( right < left ) {
            if( right > 0.1 ) {
                this.character.ent.rotation.y -= delta;
            }
            else {
                anim = 'Pointing';
            }
        }

        this.pointTimer -= delta;
        if( this.pointerTimer < 0 ) this.type = 'walking';        

        return anim;

    }
    
    buildHailNPCOptions( opt ) {
        G.hailedNPC = this;
        opt.innerHTML = '[F] Hail NPC';
    }
    
    converseWithNPC() {
        
        console.log( 'Converse with NPC' );
        G.hailActive = false;
        this.type = 'converse';
        
        G.quests.quests.talkWithNPC.npc = this;
        G.quests.quests.talkWithNPC.entry = true;
        
    }
    
    faceNearestQuest() {
        this.type = 'faceQuest';
        this.pointTimer = 5;
        G.hailedNPC = false;
        G.quests.quests.talkWithNPC.entry = false;
        G.quests.quests.talkWithNPC.active = false;
        const opt = document.getElementById( 'Options' );
        opt.innerHTML = ''
    }
    faceNearestPasty() {
        this.type = 'facePasty';
        this.pointTimer = 5;
        G.hailedNPC = false;
        G.quests.quests.talkWithNPC.entry = false;
        G.quests.quests.talkWithNPC.active = false;
        const opt = document.getElementById( 'Options' );
        opt.innerHTML = ''
    }
    
    findNearestPath() {
        const cx = this.character.ent.position.x;
        const cy = this.character.ent.position.y;
        const cz = this.character.ent.position.z;
        
        let node;
        let pathIndex;
        let nodeIndex;
        let direction;
        
        let results = [];
        
        G.paths.map( (path,index) => {
            let cr;
            if( index !== this.lastPathIndex ) {
                path.ends.map( (end,endIndex) => {
                    cr = this.distanceToNode( cx,cz , end );
                    if( cr < 500 ) {
                        if( Math.abs( cy - end.position.y ) < 50 || this.firstLoad ) {
                            results.push({
                                node: end,
                                pathIndex: index,
                                direction: end.direction,
                                nodeIndex: endIndex === 0 ? 0 : path.nodes.length - 1,
                            });
                        }
                    }
                });
            }
        });
        
        let checkDistance = 500;
        while( results.length === 0 ) {
            checkDistance += 500;
            G.paths.map( (path,index) => {
                let cr;
                path.nodes.map( (end,endIndex) => {
                    cr = this.distanceToNode( cx,cz , end );
                    if( cr < checkDistance ) {
                        if( Math.abs( cy - end.position.y ) < 50 + ( checkDistance/20 )|| this.firstLoad ) {
                            results.push({
                                node: end,
                                pathIndex: index,
                                direction: Math.random() < 0.5 ? -1 : 1,
                                nodeIndex: endIndex,
                            });
                        }
                    }
                });
            });
        }
        
        const result = results[ Math.floor( Math.random() * results.length ) ];
        
        if( this.firstLoad ) {
            this.character.ent.position.x = result.node.position.x + Math.random() * 300 - 150;
            this.character.ent.position.y = result.node.position.y;
            this.character.ent.position.z = result.node.position.z + Math.random() * 300 - 150;
            this.firstLoad = false;
        }
        
        result.node.position.x += Math.random() * 150 - 75;        
        result.node.position.z += Math.random() * 150 - 75;        
        
        return {
            node: result.node,
            pathIndex: result.pathIndex,
            nodeIndex: result.nodeIndex,
            direction: result.direction,
        };
        
    }
    
    distanceToNode( x,z, node ) {
        const dx = x - node.position.x;
        const dz = z - node.position.z;
        return Math.sqrt( dx*dx + dz*dz );
    }

}