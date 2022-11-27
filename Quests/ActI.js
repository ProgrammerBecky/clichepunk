import { G } from './../G.js';

export const ActI = {
    talkWithNPC: {
        entry: false,
        active: false,
        whileActive: () => {
            if( G.quests.quests.talkWithNPC.npc ) {
                G.quests.facePlayer( G.quests.quests.talkWithNPC.npc.character );
            }
        },
        options: [
            "Where is the nearest quest?",
            "Have you seen a Cornish Pasty?"
        ],
        choose: (words) => {
            if( words === 'Where is the nearest quest?' ) {
                G.quests.quests.talkWithNPC.npc.faceNearestQuest();
            }
            else {
                G.quests.quests.talkWithNPC.npc.faceNearestPasty();
            }
        }
    },
    AnimationSet: {
        entry: false,
        active: false,
        onEnd: () => {
            G.charGen = 'animations';
        },
        visualOptions: [
            '[F] Female Animations',
            '[M] Male Animations',
        ],
    },
    HairLength: {
        entry: false,
        active: false,
        onEnd: () => {
            G.charGen = 'hairLength';
        },
        visualOptions: [
            '[1] Short Hair Frizz',
            '[2] Medium Hair Frizz',
            '[3] Long Hair Frizz',
            '[4] Extreme Hair Frizz',
            '[0] No Hair Frizz',
        ],
    },
    InvestigateHologram: {
        entry: false,
        active: false,
        whileActive: () => {
            if( G.quests.characters.Johnny ) {
                if( G.quests.characterRange( G.quests.characters.Johnny ) < 100 ) {
                    return 'InvestigateComputer';
                }
            }
        },
        visualOptions: [
            'Investigate Hologram in Lounge'
        ],
    },
    InvestigateComputer: {
        entry: false,
        active: false,
        whileActive: () => {
            const dx = G.characters[0].ent.position.x - 4025;
            const dy = G.characters[0].ent.position.y - 2196;
            const dz = G.characters[0].ent.position.z - 221;
            const dr = Math.sqrt( dx*dx + dy*dy + dz*dz );
            if( dr < 250 ) {
                return 'InitialiseComputer';
            }
        },
        visualOptions: [
            'Check Hologram Logs on your Computer'
        ],
    },
    InitialiseComputer: {
        entry: false,
        active: false,
        character: 'Computer',
        position: {x: 4059.93269630669, y: 2196.681640625, z: 230.63044965268054},
        rotation: -Math.PI/1.5,
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            G.ComputerEnabled = 'start';
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Welcome to the Arasaka Hal 9000 Computer System. Please state the nature of your enquiry.",
               pace: 0.11,
               mouthSpeed: 8,
               sfx: "Computer1",
            },  
        ],  
        visualOptions: [
            "[F] Check Hologram Logs"
        ]
    },
    ComputerCorruption1: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = 'corrupted';
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Corrupted File. Guru Meditation Error. Interface Locked.",
               pace: 0.11,
               emotion: 'anger',
               mouthSpeed: 8,
               sfx: "Computer2",
            },  
        ],  
        visualOptions: [
            '[F] Try Again'
        ],
    },
    ComputerCorruption2: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = 'voice';
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Corrupted File. Guru Meditation Error. Interface Locked.",
               pace: 0.11,
               emotion: 'anger',
               mouthSpeed: 8,
               sfx: "Computer2",
            },  
        ],  
        visualOptions: [
            '[F] Enable Voice Interface'
        ],        
    },
    ComputerCorruption3: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.characterRange( G.quests.characters.Computer ) > 500 ) {
                    return 'InvestigateComputer';
                }                
                if( G.quests.questActivationTimer > 1 && G.quests.characters.Computer.words === '' ) {
                    return 'ComputerCorruption4';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "To enable voice interface please grant permission to access your microphone in your browser.",
               pace: 0.11,
               emotion: 'anger',
               mouthSpeed: 6,
               sfx: "Computer3",
            },  
        ],  
    },
    ComputerCorruption4: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.characterRange( G.quests.characters.Computer ) > 500 ) {
                    return 'InvestigateComputer';
                }                
            }
        },
        options: [
            'Hello Computer',
            'Computer, what is with the hologram in the lounge?'
        ],        
        choose: (words) => {
            if( words === 'Hello Computer' ) {
                return 'ComputerHello1';
            }
            else {
                return 'ComputerHologram1';
            }
        }
    },
    ComputerHello1: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.characterRange( G.quests.characters.Computer ) > 500 ) {
                    return 'ComputerCorruption3';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Startup Chime",
               pace: 0.11,
               emotion: 'happy-smile',
               mouthSpeed: 6,
               sfx: "Computer4",
            },  
        ],  
        onEnd: () => {
            if( G.quests.questActivationTimer > 2 ) {
                return 'ComputerCorruption4';
            }
        }
    },
    ComputerHologram1: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.Computer.words === '' ) {
                    return 'ComputerHologram2';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "The hologram is an uploaded memory from the previous occupant of this appartment. The file is missing it's E.O.F. pointer and requires repair before I can remove the hologram.",
               pace: 0.085,
               emotion: 'happy',
               mouthSpeed: 6,
               sfx: "Computer5",
            },  
        ],  
    },
    ComputerHologram2: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.characterRange( G.quests.characters.Computer ) > 500 ) {
                    return 'ComputerHologram1';
                }
            }
        },
        options: [
            "Computer, delete the file",
            "Computer, can you repair the file?",
            'Computer, play as much of the file as you can',
            "Computer, what is this pointer you are talking about?"
        ],
        choose: (words) => {
            console.log( words );
            if( words === 'Computer, delete the file' ) {
                return 'ComputerFileDelete';
            }
            else if( words === "Computer, what is this pointer you are talking about?" ) {
                return 'ComputerEOFFile';
            }
            else if( words === "Computer, can you repair the file?" ) {
                return "ComputerRecoverFile";
            }
            else if( words === 'Computer, play as much of the file as you can' ) {
                return "ComputerPlayFile";
            }
        }
    }, 
    ComputerRecoverFile: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            console.log( 'Recover File' );
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.Computer.words === '' ) {
                    return 'ComputerPlayFile';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "I require Biological intervention to mark the end of the file.  I will play the file so that you can tell me where it ends.",
               pace: 0.11,
               emotion: 'contempt',
               mouthSpeed: 6,
               sfx: "Computer8",
            },  
        ],           
    },
    ComputerEOFFile: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.Computer.words === '' ) {
                    return 'ComputerHologram2';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "E.O.F. is an acronym for End of File. it is a marker used by the drive allocation table to denote where a file ends.  When this pointer is missing I do not know where the file ends.",
               pace: 0.11,
               emotion: 'happy-smile',
               mouthSpeed: 6,
               sfx: "Computer7",
            },  
        ],          
    },
    ComputerFileDelete: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.Computer.words === '' ) {
                    return 'ComputerHologram2';
                }
            }
        },
        type: 'playSpeechSequence',
        speech: [
            {
               words: "The file cannot be deleted whilst the E.O.F. pointer is missing.",
               pace: 0.11,
               emotion: 'anger',
               mouthSpeed: 6,
               sfx: "Computer6",
            },  
        ],  
    },   
    ComputerPlayFile: {
        entry: false,
        active: false,
        character: 'Computer',
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Please observe the memory playback in the lounge.",
                pace: 0.083,
                emotion: 'relaxed',
                mouthSpeed: 6,
                sfx: "Computer9",
            }
        ],
        whileActive: (delta) => {
            G.ComputerEnabled = false;
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
            }
        },
        onEnd: () => {
            if( G.quests.characterRange( G.quests.characters.Johnny ) < 500 ) {
                setDamage( 1 );
                G.characters[0].ent.visible = false;
                G.viewMode = 'lockedCam';
                G.characters[0].ent.position.set( 3420.7003475870074, 2366.6818847656305, -259.23773033841036);
                G.camera.position.set( 3420.7003475870074, 2366.6818847656305, -259.23773033841036);
                G.camera.rotation.set( 2.976443963034424, 1.4695438860093186, 3.141592653589793 );
                return 'Intro1';
            }
        }
    },
    Intro1: {
        entry: false,
        active: false,
        character: 'Cee',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Who the hell are you?",
               pace: 0.083,
               mouthSpeed: 3.5,
               sfx: "Intro1",
               emotion: 'shock',
               animation: 'Shrugging',
               animationLoop: true,
               position: {x: 3284.4356119042723, y: 2196.681884765625, z: -193.09441102788017},
               rotation: -3.2028000006675668,
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                emotion: 'shock',
            }
        ],
        onEnd: () => {
            if( G.quests.characters.Cee.currentAnim === 'Idle' ) {
                return 'Intro2';
            } 
        }
    },
    Intro2: {
        entry: false,
        active: false,
        character: 'Johnny',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "My name is Johnny Silverhand played by Keanu Reeves. I'm a dead terrorist from 50 years ago. Before I died my consciousness was downloaded and installed in to the curry you just ate, and now I am in your head.",
               pace: 0.094,
               mouthSpeed: 3.5,
               sfx: "Intro2",
               emotion: 'anger',
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                emotion: 'contempt',
            }
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Johnny.words === '' ) {
                return 'Intro3';
            }     
        }
    },    
    Intro3: {
        entry: false,
        active: false,
        character: 'Cee',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "I suspect I'm about to embark on a long interpersonal journey through your past during which our relationship develops into one of mutual respect, and maybe even friendship.",
               pace: 0.09,
               mouthSpeed: 3.5,
               sfx: "Intro3",
               emotion: 'shock',
               animation: 'Bashful',
               animationLoop: true,
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                emotion: 'neutral',
            }
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Cee.words === '' ) {
                return 'Intro4';
            } 
        }        
    }, 
    Intro4: {
        entry: false,
        active: false,
        character: 'Johnny',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "I'm a rocker boy who cares for no-one but himself, but over the course of our adventure will learn how to respect others before I can finaly accomplish my goal of bringing an end to the system that exploits the workers through outdated imperialist dogma that perpetuates the economic and social differences in our society.",
               pace: 0.08,
               mouthSpeed: 3.5,
               sfx: "Intro4",
               emotion: 'anger',
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                emotion: 'contempt',
            }
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Johnny.words === '' ) {
                return 'Intro5';
            }     
        }
    },  
    Intro5: {
        entry: false,
        active: false,
        character: 'Cee',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Oh we'll get on just fine.",
               pace: 0.083,
               mouthSpeed: 3.5,
               sfx: "Intro5",
               emotion: 'happy-laugh',
               animation: 'Bashful',
               animationLoop: true,
            },  
            {
                animation: 'Idle',
                animationLoop: true,
            }
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Cee.words === '' ) {
                return 'Intro6';
            } 
        }        
    }, 
    Intro6: {
        entry: false,
        active: false,
        character: 'Johnny',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "No V! We have to start from a position of antogonism so that our relationship mirrors the storyline!",
               pace: 0.083,
               mouthSpeed: 3.5,
               sfx: "Intro6",
               emotion: 'anger',
               animation: 'Yelling',
               animationLoop: true,
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                emotion: 'anger',
            }
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Johnny.words === '' ) {
                return 'Intro7';
            }     
        }
    },      
    Intro7: {
        entry: false,
        active: false,
        character: 'Cee',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Dammit Johnny! Get out of my head!",
               pace: 0.083,
               mouthSpeed: 3.5,
               sfx: "Intro7",
               emotion: 'anger',
               animation: 'Angry Point',
               animationLoop: true,
            },  
        ],
        onEnd: () => {
            if( G.quests.questActivationTimer > 1 && G.quests.characters.Cee.words === '' ) {
                setDamage( 0 );
                G.characters[0].ent.visible = true;
                G.viewMode = 'thirdPerson';                
                G.quests.characters.Cee.ent.visible = false;
                G.quests.characters.Johnny.ent.visible = false;
                return 'Intro8';
            } 
        } 
    },
    Intro8: {
        entry: false,
        active: false,
        character: 'Computer',
        whileActive: () => {
            if( G.quests.characters.Computer ) {
                if( G.quests.characterRange( G.quests.characters.Computer ) < 250 ) {
                    return 'Intro9';
                }
            }        
        }
    },
    Intro9: {
        entry: false,
        active: false,
        character: 'Computer',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Hello chosen one. My logs indicate that you have not completed any quests yet. Have you tried leaving the flat and exploring the city?",
               pace: 0.11,
               emotion: 'neutral',
               mouthSpeed: 8,
               sfx: "ActII",
            },  
        ],          
        whileActive: () => {
            if( G.quests.characters.Computer ) {
                G.quests.facePlayer( G.quests.characters.Computer );
                if( G.quests.characterRange( G.quests.characters.Computer ) > 500 ) {
                    return 'Intro8';
                }
            }        
        }        
    },
    Schoolwork1: {
        entry: true,
        active: false,
        character: 'StudentSally',
        position: {x: 17209.911254210172, y: 25.39927569677343, z: 551.2438006499284},
        rotation: 1.4651999988555926,
        animation: 'Bashful',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                if( G.quests.characterRange( G.quests.characters.StudentSally ) < 250 ) {
                    return 'Schoolwork2';
                }
            }
            return false;
        }
    },
    Schoolwork2: {
        entry: true,
        active: false,
        character: 'StudentSally',
        animationLoop: true,
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Hey there! Could you help with my school project please?  We had to make a tool and show it being used, but I can't use my tool and film it being used at the same time. Would you help by using my tool for me please?",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "Schoolwork1",
               emotion: 'contempt',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characterRange( G.quests.characters.StudentSally ) > 500 ) {
                    return 'Schoolwork1';
                }
            }
            return false;
        },
        onEnd: () => {
            if( G.quests.characters.StudentSally.currentAnim === 'Cheering' ) {
                return 'Schoolwork3';
            }                
        }
    },
    Schoolwork3: {
        entry: false,
        active: false,
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characterRange( G.quests.characters.StudentSally ) > 500 ) {
                    return 'Schoolwork1';
                }
            }
            return false;
        },        
        options: [
            'What is this tool you speek of?',
            "Nice tool! You can count on me",
        ],
        choose: (word) => {
            if( word === "Nice tool! You can count on me" ) {
                return 'Schoolwork5';
            }
            else {
                return 'Schoolwork4';
            }
        }
    },
    Schoolwork4: {
        entry: false,
        active: false,      
        character: 'StudentSally',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "They're my combat sim stims.  You place one on your temple and it renders space aliens directly into your cerebral cortex. It's linked to the gun controller with 6G.  All you have to do is kill 10 aliens",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "Schoolwork2",
               emotion: 'anger',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ], 
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characterRange( G.quests.characters.StudentSally ) > 500 ) {
                    return 'Schoolwork1';
                }
            }
            return false;
        },
        onEnd: () => {
            if( G.quests.characters.StudentSally.currentAnim === 'Cheering' ) {
                return 'Schoolwork4b';
            }                
        }       
    },
    Schoolwork4b: {
        entry: false,
        active: false,
        options: [
            "Alright, I'll do it.",
        ],
        choose: (word) => {
            return 'Schoolwork5';
        }        
    },
    Schoolwork5: {
        entry: false,
        active: false,
        character: 'StudentSally',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Awesome! Now the space aliens can be configured with different visual queues, so I just gotta ask how old are you?",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "Schoolwork3",
               emotion: 'anger',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],                
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characterRange( G.quests.characters.StudentSally ) > 500 ) {
                    return 'Schoolwork1';
                }
            }
            return false;
        },
        onEnd: () => {
            if( G.quests.characters.StudentSally.currentAnim === 'Cheering' ) {
                return 'Schoolwork6';
            }                
        }          
    }, 
    Schoolwork6: {
        entry: false,
        active: false,
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characterRange( G.quests.characters.StudentSally ) > 500 ) {
                    return 'Schoolwork1';
                }
            }
            return false;
        },        
        options: [
            "Boomer",
            "Generation X",
            "Not that old"
        ],
        choose: (word) => {
            if( word === 'Boomer' ) return 'SchoolworkRussians';
            if( word === 'Generation X' ) return 'SchoolworkEstablishment';
            return 'SchoolworkBoomer';
        }        
    },    
    SchoolworkRussians: {
        entry: false,
        active: false,
        character: 'StudentSally',
        type: 'playSpeechSequence',
        spaceInvaders: 'Russian',
        speech: [
            {
               words: "Alright, I'll set the visual config to Russians, or Ruskies as you call them.",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "SchoolworkRuskies",
               emotion: 'contempt',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],                
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.StudentSally.words === '' ) {
                    return 'SchoolworkStartGame';
                }
            }
            return false;
        },
    },
    SchoolworkEstablishment: {
        entry: false,
        active: false,
        character: 'StudentSally',
        type: 'playSpeechSequence',
        spaceInvaders: 'Police',
        speech: [
            {
               words: "Sweet, I'll set the visual config to the Establishment, or Pigs as you call them.",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "SchoolworkPigs",
               emotion: 'confused',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],                
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characters.StudentSally.words === '' ) {
                    return 'SchoolworkStartGame';
                }
            }
            return false;
        },
    },
    SchoolworkBoomer: {
        entry: false,
        active: false,
        character: 'StudentSally',
        type: 'playSpeechSequence',
        spaceInvaders: 'Boomer',
        speech: [
            {
               words: "Oh I know what to set the visual config to, here, I've set it to Boomers!",
               pace: 0.083,
               mouthSpeed: 6,
               sfx: "SchoolworkBoomers",
               emotion: 'happy',
               animation: 'Idle',
               animationLoop: true,
               propRightHand: 'LewisGun',
            },  
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],                
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characters.StudentSally.words === '' ) {
                    return 'SchoolworkStartGame';
                }
            }
            return false;
        },
    },    
    SchoolworkStartGame: {
        entry: false,
        active: false,
        character: 'StudentSally',
        type: 'playSpeechSequence',
        speech: [
            {
                animation: 'Picking Up Object',
                animationLoop: false,
                propRightHand: 'LewisGun',
                words: '. . . . . . . . . .',
                pace: 0.083,
                mouthSpeed: 6,
            },
            {
               emotion: 'happy',
               animation: 'Idle',
               animationLoop: true,
            },
        ],
        whileActive: (delta) => {
            if( G.quests.characters.StudentSally ) {
                G.quests.facePlayer( G.quests.characters.StudentSally );
                if( G.quests.characters.StudentSally.words === '' ) {
                    
                    G.spaceInvaderPrompt = document.createElement( 'div' );
                    G.spaceInvaderPrompt.classList.add( 'options' );
                    G.spaceInvaderPrompt.innerHTML = '[F] Play Combat Sim';
                    document.body.appendChild( G.spaceInvaderPrompt );                    
                    
                    return 'SchoolworkInGame';
                }
            }
            return false;
        },  
    },
    SchoolworkInGame: {
        entry: false,
        active: false, 
        onEnd: () => {
            G.quests.quests.SchoolworkInGame.active = false;
        }
    },
    Homeless1: {
        entry: true,
        active: false,
        character: 'HomelessHenrietta',
        position: {x: -2643.155894973612, y: 25.340565830277285, z: -20851.605256470215},
        rotation: 1.4823999981880214,
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) < 250 ) {
                    return 'Homeless2';
                }
            }
            return false;
        }
    },
    Homeless2: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) > 500 ) {
                    return 'Homeless1';
                }
                else if( G.quests.characters.HomelessHenrietta.currentAnim === 'Bashful' ) {
                    return 'Homeless3';
                }                    
            }
            return false;
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "hey. I don't suppose you are the chosen one are you? I could use some help.",
                pace: 0.08,
                mouthSpeed: 5,
                sfx: 'Homeless1',
                emotion: 'sad',
                animation: 'Idle',
                animationLoop: true,
            },
            {
                animation: 'Bashful',
                animationLoop: true,
            }
        ],
    },
    Homeless3: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Bashful',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) > 500 ) {
                    return 'Homeless1';
                }
            }
            return false;
        },
        type: 'wait',
        options: [
            "No, I'm an orphan.",
            "Maybe, my backstory is tragic enough."
        ],
        choose: (words) => {
            if( words === "I'm just an orphan" ) {
                return 'Homeless4';
            }
            else {
                return 'Homeless5';
            }
        }
            
    },
    Homeless4: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) > 500 ) {
                    return 'Homeless1';
                }
                else if( G.quests.characters.HomelessHenrietta.currentAnim === 'Bashful' ) {
                    return 'Homeless6';
                }                    
            }
            return false;
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Are you sure you aren't the dragon born?",
                pace: 0.08,
                mouthSpeed: 5,
                sfx: 'Homeless2',
                emotion: 'sad',
                animation: 'Idle',
                animationLoop: true,
            },
            {
                animation: 'Bashful',
                animationLoop: true,
            }
        ],        
    },
    Homeless5: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) > 500 ) {
                    return 'Homeless1';
                }
                else if( G.quests.characters.HomelessHenrietta.currentAnim === 'Bashful' ) {
                    return 'Homeless6';
                }                    
            }
            return false;
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "I knew you were a wizard Harry.",
                pace: 0.08,
                mouthSpeed: 5,
                sfx: 'Homeless3',
                emotion: 'sad',
                animation: 'Idle',
                animationLoop: true,
            },
            {
                animation: 'Bashful',
                animationLoop: true,
            }
        ],        
    },    
    Homeless6: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.HomelessHenrietta ) {
                G.quests.facePlayer( G.quests.characters.HomelessHenrietta );
                if( G.quests.questActivationTimer > 1 && G.quests.characters.HomelessHenrietta.words === '' ) {
                    return 'Homeless7';
                }                    
            }
            return false;
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "I'm an NPC in another computer game and I can't afford the medical bills from all the times I get killed.  So I live here in this dumpster and now it's infested by nazi rats.  If you could kill 10 Nazi rats for me I'll be very grateful.",
                pace: 0.10,
                mouthSpeed: 5,
                sfx: 'Homeless4',
                emotion: 'sad',
                animation: 'Idle',
                animationLoop: true,
            },
            {
                animation: 'Bashful',
                animationLoop: true,
            }
        ],        
    },    
    Homeless7: {
        entry: false,
        active: false,
        character: 'HomelessHenrietta',        
        animation: 'Idle',
        animationLoop: true,
        type: 'spawnRats',
        onEnd: () => {
            if( G.mobs.deadRats >= 10 ) {
                if( G.quests.characterRange( G.quests.characters.HomelessHenrietta ) < 250 ) {
                    G.music.fadeMusic();
                    return 'Homeless8';
                }
            }
            return false;
        }
    },
    Homeless8: {
      entry: false,
      active: false,      
      character: 'HomelessHenrietta',
      animation: 'Cheering',
      animationLoop: true,
      type: 'playSpeechSequence',
      speech: [
        {
            words: "Heyum, thanks yeah.",
            pace: 0.10,
            mouthSpeed: 5,
            sfx: 'Homeless5',
            emotion: 'happy-smile',
            animation: 'Bashful',
            animationLoop: true,
        },
        {
            animation: 'Cheering',
            animationLoop: true,
        }      
      ] 
    },
    Pasty1: {
        entry: true,
        active: false,
        character: 'CornishKevin',
        position: {x: 11527.740642244404, y: 940.4746704101562, z: -9779.992330005236},
        rotation: 4.680307275100393,
        animation: 'Idle',
        animationLoop: true,
        whileActive: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) < 250 ) {
                    return 'Pasty2';
                }
            }
            return false;
        }
    },
    Pasty2: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'playSpeechSequence',
        speech: [
            {
                words: 'ello there. Can you help me?',
                pace: 0.08,
                mouthSpeed: 10,
                sfx: 'Cornish1',
                emotion: 'happy',
                animation: 'Idle',
                animationLoop: true,
            }
        ],
        whileActive: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) > 500 ) {
                    return 'Pasty1';
                }
            }
            return false;
        },
        options: [
            "Maybe"
        ],
        choose: (words) => {
            return 'Pasty3';
        }
    },
    Pasty3: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'playSpeechSequence',
        speech: [
            {
                words: "I'm from the Cornish National Pasty Eating team, and we're having a spot of bother right now with our supplies.  I had ten Cornish Pasties but I appear to have lost them somewhere in the city. Could you be a hero and find them for me.",
                pace: 0.08,
                mouthSpeed: 10,
                sfx: 'Cornish2',
                emotion: 'happy',
                animation: 'Idle',
                animationLoop: true,
            }
        ],
        whileActive: (delta) => {
            G.quests.CornishKevinTimer += delta;
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) > 500 ) {
                    return 'Pasty1';
                }
                else if( G.quests.questActivationTimer > 9 && G.quests.characters.CornishKevin.words === '' ) {
                    return 'Pasty3b';
                }
            }
            return false;
        }, 
    },
    Pasty3b: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'wait',
        whileActive: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) > 500 ) {
                    return 'Pasty1';
                }
            }
            return false;
        },        
        options: [
            "Cornwall is not a country.",
            "Yes, I will take on this burden."
        ],
        choose: (words) => {
            if( words === "Yes, I will take on this burden." ) {
                return 'Pasty4';
            }
            else if( words === "Cornwall is not a country." ) {
                return 'Pasty5';
            }
        }
        
    },
    Pasty4: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'playSpeechSequence',
        onEnd: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                if( G.player.pasties >= 10 ) {
                    if( G.quests.characterRange( G.quests.characters.CornishKevin ) < 250 ) {
                        return 'Pasty6';
                    }
                }
            }
            return false;
        },          
        speech: [
            {
                words: "Thank you so much, I'll wait here until you return.",
                pace: 0.08,
                mouthSpeed: 10,
                sfx: 'Cornish3',
                emotion: 'happy',
                animation: 'Idle',
                animationLoop: true,
            }
        ],         
    },  
    Pasty5: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Well to be honest, I just really like Pasties. I justify my pasty purchases to suppliers by pretending i'm in a sports team. Otherwise I would feel embarassed given the quantity of Pasties that I purchase.  Anyway, can you help me, please? or Pretty please with a pasty on top?",
                pace: 0.1,
                mouthSpeed: 10,
                sfx: 'Cornish4',
                emotion: 'anger',
                animation: 'Idle',
                animationLoop: true,
            }
        ], 
        whileActive: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) > 500 ) {
                    return 'Pasty1';
                }
                else if( G.quests.questActivationTimer > 9 && G.quests.characters.CornishKevin.words === '' ) {
                    return 'Pasty5b';
                }
            }
            return false;
        },        
    },
    Pasty5b: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'wait',
        whileActive: (delta) => {
            if( G.quests.characters.CornishKevin ) {
                G.quests.facePlayer( G.quests.characters.CornishKevin );
                if( G.quests.characterRange( G.quests.characters.CornishKevin ) > 500 ) {
                    return 'Pasty1';
                }
            }
            return false;
        },  
        options: [
            "Yes. I am the hero your Pasties need",
        ],    
        choose: (words) => {
            return 'Pasty4';
        }   
    },
    Pasty6: {
        entry: false,
        active: false,
        character: 'CornishKevin',
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Oo I say this has to be the best day ever, I think I'll have to have a cold shower now! Could it be that you are the chosen one?",
                pace: 0.08,
                mouthSpeed: 10,
                sfx: 'Cornish5',
                emotion: 'happy-smile',
                animation: 'Cheering',
                animationLoop: true,
            },
            {
                animation: 'Cheering',
                animationLoop: true,
            }
        ],            
    },
    Natterbox: {
        entry: true, //set to true to start quest
        active: false, //once character is loaded goes true, or if no character when quest has started
        character: 'BlueSpoon',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "I meen seriously Norra you should have heard him last week like we was talking for a good 30 to 40 minutes and in that whole time not one peep from him and barely even a murmour. I tried for so long to get just anything from him, anything at all, but you know what he's like he just stands there looking like he's on the cusp of saying a thing and nothing at all like he's prepared to talk but does he talk? he does not. He's just stood there like a lemon so I tried calling him again last night on the dog and bone thought we'd have a conversation you know but I don't know why I bother that man doesnt have a single word in him. And it's not like he's that hot either, I'd say he is a 6, 7 if you're horny before you look at him. Anyway 90 minutes on the phone with him last night and do you know how many words he said? Nada, not a one. Zero. Nothing. I don't know how much more I can flog that dead horse for you Norra it's like trying to hit a brick wall or have a conversation with one or something like that anyway. So how are you anyway anything going on for you lately is it because I mean you are being really quiet and anyway I think I'll get me one of those chip things you know the ones where you can interact with the door doobrie wotsit thing and have you seen the new braindance deck they're peddling at the mall its not its like got emotion relay so you can recall emotions you felt when you watched it and oh I forgot to say although I feel a bit bad for letting the cat out the bag on this one but ",
               pace: 0.05,
               mouthSpeed: 8,
               sfx: "I mean seriously Norra",
               emotion: 'anger',
               animation: 'Phone Talking Animated',
               animationLoop: true,
               propLeftHand: 'phone',
               position: {x: -3079.5541049515614, y: -431.8095721456862, z: -978.1341783664316},
               rotation: -1.357000000238421,
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                propLeftHand: false,
            },                
        ],
        onEnd: () => {
            if( G.quests.characters.BlueSpoon ) {
                if( G.quests.characters['BlueSpoon'].currentAnim === 'Idle' ) return 'Natterbox';
                if( G.quests.characterRange( G.quests.characters.BlueSpoon ) < 250 ) {
                    G.quests.quests.Natterbox.entry = false;
                    G.quests.quests.Natterbox.active = false;
                    return 'Natterbox2';
                }
            }
            return false;            
        }
    },
    Natterbox2: {
        entry: false, //set to true to start quest
        active: false, //once character is loaded goes true, or if no character when quest has started
        character: 'BlueSpoon',
        type: 'Unknown',
        onEnd: () => {
            if( G.quests.characters.BlueSpoon ) {
                if( G.quests.characters.BlueSpoon.currentAnim === 'Idle' ) {
                    G.quests.characters.BlueSpoon.playSpeechSequence(
                        G.quests.quests.Natterbox.speech
                    );
                }     
                if( G.quests.characterRange( G.quests.characters.BlueSpoon ) > 500 ) {
                    G.quests.clearOptions();
                    return 'Natterbox';
                }
            }
            return false;
        },
        options: [
            "Do you ever stop talking?",
        ],
        choose: (words) => {
            return 'HangOnNorra';
        }
    },
    HangOnNorra: {
        entry: false,
        active: false,
        character: 'BlueSpoon',
        type: 'playSpeechSequence',
        speech: [
            {
               words: "Urgh some people are so rude theres a homeless looking person here trying to talk to me. Go away you filthy animal and learn some manners. Seriously what is the matter with some people. Anyway as I was saying.",
               pace: 0.065,
               mouthSpeed: 8,
               sfx: "NorraInterrupted",
               emotion: 'contempt',
               animation: 'Yelling',
               animationLoop: true,
               propLeftHand: 'phone',
               position: {x: -3079.5541049515614, y: -431.8095721456862, z: -978.1341783664316},
            },  
            {
                animation: 'Idle',
                animationLoop: true,
                propLeftHand: false,
            },                
        ],
        onEnd: (delta) => {
            if( G.quests.characters.BlueSpoon ) {
                G.quests.facePlayer( G.quests.characters.BlueSpoon );
                if( G.quests.characterRange( G.quests.characters.BlueSpoon ) > 500 ) return 'Natterbox';
                if( G.quests.characters.BlueSpoon.currentAnim === 'Idle' ) return 'Natterbox';
            }
            return false;
        }
    },
    Scotty1: {
        entry: true,
        active: false,
        character: 'Scotty',
        animation: 'Drunk Idle',
        animationLoop: true,
        position: {x: 3151.772554861673, y: 1291.3637945715418, z: -1349.0868135355586},
        whileActive: (delta) => {
            if( G.quests.characters.Scotty ) {
                G.quests.facePlayer( G.quests.characters.Scotty );
                if( G.quests.characterRange( G.quests.characters.Scotty ) < 250 ) {
                    return 'Scotty2';
                }
            }
            return false;
        }
    },
    Scotty2: {
        entry: false,
        active: false,
        character: 'Scotty',
        whileActive: (delta) => {
            if( G.quests.characters.Scotty ) {
                G.quests.facePlayer( G.quests.characters.Scotty );
                if( G.quests.characterRange( G.quests.characters.Scotty ) > 500 ) {
                    G.quests.clearOptions();
                    return 'Scotty1';
                }
            }
            return false;
        },
        onEnd: () => {
            return false;  
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Alright, how are you?",
                pace: 0.08,
                mouthSpeed: 8,
                sfx: "ScottyAlrightHowAreYou",
                emotion: 'anger',
                animation: 'Drunk Idle',
                animationLoop: true,
            },
            {
                animation: 'Drunk Idle',
                animationLoop: true,
            }
        ],
        options: [
            'I love Scotland',
            'Pardon'
        ],
        choose: (words) => {
            if( words === 'Pardon' ) {
                G.quests.quests.Scotty2.entry = true;
                G.quests.quests.Scotty2.active = false;
            }
            else if( words === 'I love Scotland' ) {
                G.quests.clearOptions();
                G.quests.quests.Scotty2.active = false;
                G.quests.quests.Scotty3.entry = true;               
            }
        }
    },
    Scotty3: {
        entry: false,
        active: false,
        character: 'Scotty',
        whileActive: (delta) => {
            if( G.quests.characters.Scotty ) {
                G.quests.facePlayer( G.quests.characters.Scotty );
                if( G.quests.characterRange( G.quests.characters.Scotty ) > 500 ) {
                    G.quests.clearOptions();
                    return 'Scotty1';
                }
            }
            return false;
        },
        onEnd: () => {
            return false;  
        },
        type: 'playSpeechSequence',
        speech: [
            {
                words: "Thats right laddie that I am",
                pace: 0.08,
                mouthSpeed: 8,
                sfx: "ScottyThatsRightLaddieThatIAm",
                emotion: 'anger',
                animation: 'Drunk Idle',
                animationLoop: true,
            },
            {
                animation: 'Drunk Idle',
                animationLoop: true,
            }
        ],
        achievement: () => {
            let img = new Image();
            img.src = '3d/high/ScottyAchievement.png';
            
            const opt = document.getElementById( 'Options' );
            opt.appendChild( img );
        }
    },
    
};