export const stripScale = ( animations ) => {

  animations.map( animation => {
    
    for( let i=0 ; i<animation.tracks.length ; i++ ) {
      if( animation.tracks[i].name.indexOf( '.scale' ) > -1 ) {
        animation.tracks.splice( i , 1 );
        i--;
      }
    }

  });
  return animations;

}