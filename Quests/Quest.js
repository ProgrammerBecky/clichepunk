import { G } from './../G.js';
import { ActI } from './ActI.js';
import { Character } from './../Character/Character.js';

export class Quest {

    constructor() {
        
        this.questCheckTimer = 0;
        this.questActivationTimer = 0;
        this.characters = {};
        this.quests = {};
        this.delta = 0;
        this.lastLog = [];
        this.autoSelectionDelay = 0;
        
        this.loadAct( ActI );
    }
    
    loadAct( quests ) {
        this.quests = quests;
    }
    
    activateQuest( id, quest ) {
        
        this.questActivationTimer = 0;
        
        if( quest.character && ! this.characters[ quest.character ] ) {
            this.characters[ quest.character ] = new Character( quest.character );
            G.characters.push( this.characters[ quest.character ] );
        }
        else {
            if( ! quest.character || this.characters[ quest.character ].ent ) {
                if( quest.type === 'playSpeechSequence' ) {
                    this.characters[ quest.character ].playSpeechSequence( quest.speech );
                }
                if( quest.position ) {
                    this.characters[ quest.character ].ent.position.set(
                        quest.position.x , quest.position.y , quest.position.z
                    );
                }
            }
        }

        if( quest.spaceInvaders ) {
            G.mobs.spawnSpaceInvaders( quest.spaceInvaders );
        }

        if( quest.type === 'spawnRats' ) {
            G.mobs.spawnRats();
        }

        if( quest.character ) {
            if( this.characters[ quest.character ].ent ) {
                
                if( quest.animation ) {
                    this.characters[ quest.character ].setAnimation(
                        quest.animation , quest.animationLoop , 'fast'
                    );
                }
                
                quest.entry = false;
                quest.active = true;                
            }
        }
        else {
            quest.entry = false;
            quest.active = true;
        }
        
        if( quest.visualOptions ) {
            this.drawOptions( quest.visualOptions , id );
        }
        if( quest.options ) {
            this.drawOptions( quest.options , id );
            G.speech.startListening( quest.options ); 
        }
        
        if( quest.achievement ) {
            quest.achievement();
        }

    }
    
    drawOptions( options , id ) {
        
        const opt = document.getElementById( 'Options' );
        let html = '';

        this.options = [];
        options.map( option => {
            let words = option.toLowerCase().replace(/[^a-z\ ]/g,'').split( ' ' );
            if( words.length > 0 ) {
                this.options.push({
                    option,
                    words,
                    spoken: [],
                });
            }
        });
        this.optionsQuestId = id;

        options.map( option => {
           html += option + '<br>'; 
        });
        opt.innerHTML = html;
        
    }
    
    update( delta ) {

        this.delta = delta;
        this.questCheckTimer += delta;
        this.questActivationTimer += delta;
        
        if( this.questCheckTimer > 0 ) {
            this.questCheckTimer = -1;

            for( let id in this.quests ) {
                if( this.quests[id].entry ) {
                    this.activateQuest( id , this.quests[id] );
                }
                else if( this.quests[id].active ) {
                    if( this.quests[id].onEnd ) {
                        const newQuest = this.quests[id].onEnd();
                        if( newQuest ) {
                            this.quests[id].active = false;
                            if( this.optionsQuestId === id ) this.clearOptions();
                            if( newQuest !== true ) {
                                this.quests[ newQuest ].entry = true;
                            }
                        }
                    }
                }
                else if( this.quests[id].onTrigger ) {
                    if( this.quests[id].onTrigger() ) {
                        this.quests[id].entry = true;
                    }
                }
            }      
        }
        
        for( let id in this.quests ) {
            if( this.quests[id].active ) {
                if( this.quests[id].whileActive ) {
                    const newQuest = this.quests[id].whileActive( delta );                    
                    if( newQuest ) {
                        this.quests[id].active = false;
                        if( this.optionsQuestId === id ) this.clearOptions();
                        if( newQuest !== true ) {
                            this.quests[ newQuest ].entry = true;
                        }
                    }
                }
            }
        }
        
        for( let i in this.characters ) {
            this.characters[i].update( delta );
        }
        
        if( this.options ) {
            this.processSpeechOptions();

            if( this.autoSelectionDelay > 0 ) {
                this.autoSelectionDelay -= delta;
                if( this.autoSelectionDelay <= 0 ) {
                    this.selectOption( this.autoSelection );
                }
            }            
        }
        
    }
    
    facePlayer( character ) {
        
        if( character && character.ent && G.characters[0].ent ) {
            const dx = G.characters[0].ent.position.x - character.ent.position.x;
            const dz = G.characters[0].ent.position.z - character.ent.position.z;
            let df = Math.atan2( dx , dz ) - character.ent.rotation.y;
            while( df > Math.PI ) df -= Math.PI*2;
            while( df < -Math.PI ) df += Math.PI*2;
            
            character.turn( this.delta , df );
        }
    }
    
    characterRange( character ) {

        if( character && character.ent && G.characters[0].ent ) {
            if( Math.abs( G.characters[0].ent.position.y - character.ent.position.y ) < 100 ) {
                const dx = G.characters[0].ent.position.x - character.ent.position.x;
                const dz = G.characters[0].ent.position.z - character.ent.position.z;
                return Math.sqrt( dx*dx + dz*dz );
            }
        }
        return 99999999;
        
    }
    
    clearOptions() {
        G.speech.stopListening();
        const opt = document.getElementById( 'Options' );
        opt.innerHTML = '';
        this.options = false;
        this.optionsQuestId = false;
    }
    
    processSpeechOptions() {
        
        let processLog = false;
        G.speech.log.map( (log,index) => {
            
            if( ! this.lastLog[ index ]
            ||  this.lastLog[ index ] !== log
            ) {
                this.lastLog[ index ] = log;
                processLog = true;            
            
                const words = log.toLowerCase().replace(/[^a-z]/g,'').split( ' ' );
                words.map( word => {
                    this.options.map( option => {
                        option.words.map( (list,i) => {
                            if( list === word ) {
                                option.spoken.push( word );
                                option.words.splice(i,1);
                            }
                        });
                    });
                    
                });
            }
        });
        
        let chance = 0.5;
        let selected = false;
        let validOptions = 0;
        
        if( processLog ) {
            const opt = document.getElementById( 'Options' );
            let html = '';

            let allSpokenWords = [];

            this.options.map( option => {
                option.spoken.map( spoken => {
                    const word = spoken.toLowerCase();
                    if( ! allSpokenWords.includes( word ) ) {
                        allSpokenWords.push( word );
                    }
                });
                let opts = option.option.split( ' ' );
                option.spoken.map( spoken => {
                    opts.map( (opt,index) => {
                        if( opt.toLowerCase().replace(/[^a-z]/g,'') === spoken.toLowerCase() ) {
                            opts[index] = `<span>${opt}</span>`;
                        }
                    });
                });
                
                html += opts.join( ' ' ) + '<br>';
                let thisChance = option.spoken.length / ( option.spoken.length + option.words.length );
                if( thisChance > chance ) {
                    selected = option.option;
                }
                else {
                    chance = Math.max( chance , thisChance + 0.25 );
                }

            });
            opt.innerHTML = html;

            if( allSpokenWords.length > 0 ) {
                let validOptions = 0;
                let validChosen = false;
                this.options.map( (option,index) => {
                    let opts = option.option.toLowerCase().replace(/[^a-z\ ]/g,'').split( ' ' );
                    let gotWords = 0;
                    allSpokenWords.map( spoken => {
                        if( opts.includes( spoken ) ) {
                            gotWords++;
                        }
                    });
                    if( gotWords === allSpokenWords.length ) {
                        validOptions++;
                        validChosen = option.option;
                    }
                });
                if( validOptions === 1 ) {
                    this.autoSelectionDelay = 1.2;
                    this.autoSelection = validChosen;
                }
            }
            
            if( selected ) {
                this.selectOption( selected );
            }
            
        }
        
    }
    selectOption( selected ) {

        this.autoSelectionDelay = 0;
        this.autoSelection = false;        

        G.speech.stopListening();
        
        const opt = document.getElementById( 'Options' );
        opt.innerHTML = '';
        
        const newQuest = this.quests[ this.optionsQuestId ].choose( selected );
        if( newQuest ) {
            this.quests[ this.optionsQuestId ].active = false;
            if( newQuest !== true ) {
                this.quests[ newQuest ].entry = true;
            }
            this.clearOptions();
        }                
    }

}