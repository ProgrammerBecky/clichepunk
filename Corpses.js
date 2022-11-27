import { G } from './G.js';

export class Corpses {
    
    constructor() {
        this.list = [];
        this.corpseCheck = 0;
    }
    
    add( ent ) {
        this.list.push( ent );
    }
    
    update( delta ) {
        
        let cull = [];
        
        this.corpseCheck += delta;
        if( this.corpseCheck > 0 ) {
            this.corpseCheck--;
            
            for( let i=0 ; i<this.list.length ; i++ ) {
                
                const dx = G.camera.position.x - this.list[i].position.x;
                const dy = G.camera.position.y - this.list[i].position.y;
                const dz = G.camera.position.z - this.list[i].position.z;
                const dr = Math.sqrt( dx*dx + dy*dy + dz*dz );
                
                if( dr > 4000 ) {
                    G.scene.remove( this.list[i] );
                    this.list.splice( i,1 );
                    i--;
                }
                
            }
            
        }
    }
    
}