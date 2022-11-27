import { Audio } from 'three';
import { G } from './G.js';

export class Music {
    
    constructor() {
        
        this.lastSong = false;
        this.volume = 0.3;
        
        this.musicLib = {};
        
    }
    play( song ) {
        
        if( ! this.musicLib[ song ] ) {
            G.audio.load( `mfx/${song}.ogg` , buffer => {
                this.musicLib[ song ] = new Audio( G.listener );
                this.musicLib[ song ].setBuffer( buffer );
                this.musicLib[ song ].setLoop( true );
                this.activate( song );
            });
        }
        else {
            this.activate( song );
        }
        
        this.fadeMusic();
        this.lastSong = song;
    }
    
    activate( song ) {
        
        this.musicLib[ song ].setVolume( this.volume );
        this.musicLib[ song ].play();
        
    }
    
    fadeOutLastSong( song , volume ) {
        
        volume -= 0.03;
        if( volume > 0 ) {
            song.setVolume( volume );
            setTimeout( (o,song,volume) => {
                o.fadeOutLastSong(song,volume);
            } , 100 , this , song, volume );
        }
        else {
            song.stop();
        }
        
    }
    
    fadeMusic() {
        if( this.lastSong ) {
            this.fadeOutLastSong( this.musicLib[ this.lastSong ] , this.volume );
        }        
    }
    
}