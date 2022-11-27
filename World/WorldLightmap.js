this.addEventListener( 'message' , e => {
   
    if( e.data.type === 'init' ) {
        init( e.data );
    }
   
});

let ht, width, height;

const init = ( data ) => {
    
    ht = data.heightMap;
    width = data.width;
    height = data.height;
    
    const shadowWidth = Math.min( 2048 , width );
    const shadowHeight = Math.min( 2048 , height );
    
    const context = data.canvas.getContext( '2d' );
    
    context.beginPath();
    context.fillStyle = 'white';
    context.fillRect( 0,0, width,height );
    context.fill();
    
    const pixels = context.getImageData( 0,0, shadowWidth,shadowHeight );
    
    for( let x=0 ; x<width ; x++ ) {
        for( let z=0 ; z<height ; z++ ) {
         
            let shadow = 0;
         
            let gHeight = getHeight( x,z );
            for( let nx=0 ; nx<120; nx++ ) {
                const px = x + nx;
                if( px<width ) {
                    let shadeHeight = getHeight( px,z ) + nx/4;
                    shadow = Math.max( shadow , ( shadeHeight - gHeight ) * 1.5 );
                }
            }
            
            if( shadow > 0 ) {
                shadow = Math.floor( shadow );
                
                const wPixel = Math.floor( x * shadowWidth / width );
                const hPixel = Math.floor( z * shadowHeight / height );
                const pIndex = ( ( hPixel * width ) + wPixel ) * 4;
                
                const shade = Math.max( pixels.data[ pIndex ] - shadow , 0 );
                pixels.data[ pIndex ] = shade;
                pixels.data[ pIndex+1 ] = shade;
                pixels.data[ pIndex+2 ] = shade;
                
            }

        }
    }
    
    context.putImageData( pixels , 0 , 0 );
    self.postMessage({ type: 'update' });
    
}

const getHeight = ( x,z ) => {
    const i = ( z * width ) + x;
    return ht[i];
}