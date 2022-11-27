import { G } from './../G.js';

export class SpeechRecognitionHarvester {

    constructor() {
        
        this.supported = false;
        
        this.startListening = this.startListening.bind( this );
        this.stopListening = this.stopListening.bind( this );
        this.processMouthShape = this.processMouthShape.bind( this );
        
        this.words = '';
        this.log = [];

        if( typeof( webkitSpeechRecognition ) != 'undefined' ) {
            this.supported = true;
            this.recognition = new webkitSpeechRecognition();

            this.recognition.lang = 'en-UK';
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.enabled = false;
        }
    
    }
    setGrammar( options ) {

        let grammar = [];
        options.map( option => {
            const words = option.replace( /[^a-zA-Z\ ]/g , '' ).split( ' ' );
            words.map( word => {
                if( ! grammar.includes( word ) ) {
                    grammar.push( word );
                }
            });
        });
        grammar = `#JSGF V1.0; grammar words; public <words> = ${grammar.join(" | ")} ;`;
  
        const speechRecognitionList = new webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        this.recognition.grammars = speechRecognitionList;
        
    }
    startListening( options ) {
        this.setGrammar( options );
        if( ! this.supported ) return;
        if( ! this.enabled ) {
            this.enabled = true;
            this.recognition.start();
            console.log('Ready to receive speech');
        }

        let self = this;
        this.recognition.onresult = (event) => {
            for( let index=0 ; index<event.results.length ; index++ ) {
               self.log[index] = event.results[index][0].transcript;
            }
            self.processMouthShape();
        }    
        
        this.recognition.onend = () => {
            this.log = [];
            this.enabled = false;
            this.recognition.stop();
            console.log( 'No longer listening' , this.log );
        }
    
    }
    stopListening() {
        this.recognition.stop();
    }
    processMouthShape() {
        this.words = this.log[ this.log.length - 1 ].replace( "\\w+$" , '' );            
        G.characters[0].setSpeech( this.words );
    }

}