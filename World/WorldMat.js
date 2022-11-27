import {
    Color,
    RepeatWrapping,
    LinearFilter,
    FrontSide,
    Vector2,
    MeshStandardMaterial,
} from 'three';
import { G } from './../G.js';

export const worldMat = ( lightMap ) => {

    let albedo = G.texture.load( '3d/high/ground/groundTiles.png' );
    albedo.wrapS = albedo.wrapT = RepeatWrapping;
    albedo.generateMipmaps = false;
    
    let normal = G.texture.load( '3d/high/ground/groundTilesNormals.png' );
    normal.wrapS = normal.wrapT = RepeatWrapping;
    normal.generateMipmaps = false;
    
    let mat = new MeshStandardMaterial({
        map: albedo,
        normalMap: normal,       
        envMap: G.environmentMap,
        metalness: 0.45,
        roughness: 0.55,
        color: new Color(1,1,1),
        side: FrontSide,
    });
    
    mat.onBeforeCompile = ( shader , renderer ) => {

      shader.uniforms.lightMap = { type: 't', value: lightMap };
      shader.uniforms.needsUpdate = true;

      /* Tri-Planar Mapping */
      shader.vertexShader = shader.vertexShader.replace( 'varying vec3 vViewPosition;' , `
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 worldNormal;
`);
      shader.vertexShader = shader.vertexShader.replace( '#include <fog_vertex>' , `
#include <fog_vertex>
vWorldPosition = position.xyz;
worldNormal = normalize( normal ); 
`);

      shader.fragmentShader = shader.fragmentShader.replace( 'varying vec3 vViewPosition;' , `
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 worldNormal;
uniform sampler2D lightMap;

vec3 blendWeights;

vec2 yUv;
vec2 xUv;
vec2 zUv;

vec3 mapN;

vec4 blendedDiffuseColor;
float totalBlend = 0.0;
`);
      shader.fragmentShader = shader.fragmentShader.replace( 'void main() {' , `
vec3 rebalanceBlendWeights( vec3 wt ) {
  
  if( wt.x < 0.4 ) {
    wt.x = ( wt.x - 0.2 ) * 2.0;
  }
  if( wt.y < 0.4 ) {
  wt.y = ( wt.y - 0.2 ) * 2.0;
  }
  if( wt.z < 0.4 ) {
    wt.z = ( wt.z - 0.2 ) * 2.0;
  }

  wt = normalize( wt );
  return wt;
  
}
void addBlend( float blended, float offX , float offY ) {
  
  if( blended + totalBlend > 1.0 ) {
    blended = 1.0 - totalBlend;
  }
  totalBlend += blended;
 
  vec2 uvcy = vec2( yUv.x + offX , yUv.y + offY );
  vec2 uvcx = vec2( xUv.x + offX , xUv.y + offY );
  vec2 uvcz = vec2( zUv.x + offX , zUv.y + offY );

  if( blendWeights.x > 0.05 ) {
    vec3 xDiff = texture2D(map, uvcx).xyz;
    blendedDiffuseColor += blended * vec4(xDiff * blendWeights.x, 1.0);  
    
    vec3 xNormal =  texture2D(normalMap, uvcx).xyz;
    mapN += blended * (xNormal * blendWeights.x);
  }

  if( blendWeights.y > 0.05 ) {
    vec3 yDiff = texture2D(map, uvcy).xyz;
    blendedDiffuseColor += blended * vec4( yDiff * blendWeights.y, 1.0);  
    
    vec3 yNormal =  texture2D(normalMap, uvcy).xyz;
    mapN += blended * (yNormal * blendWeights.y);
  }
  
  if( blendWeights.z > 0.05 ) {
    vec3 zDiff = texture2D(map, uvcz).xyz;     
    blendedDiffuseColor += blended * vec4(zDiff * blendWeights.z, 1.0);  
  
    vec3 zNormal =  texture2D(normalMap, uvcz).xyz;    
    mapN += blended * (zNormal * blendWeights.z);
  }
  
}
void main() {
`);

      shader.fragmentShader = shader.fragmentShader.replace( '#include <map_fragment>' , `
vec4 lightness = vec4( texture2D( lightMap , vUv ).rgb , 1.0 );

blendWeights = abs((inverse(viewMatrix) * vec4(vNormal, 0.0)).xyz);
blendWeights = rebalanceBlendWeights( blendWeights / (blendWeights.x + blendWeights.y + blendWeights.z) );

yUv = mod( vWorldPosition.xz * 0.004 , 0.25 );
xUv = mod( vWorldPosition.zy * 0.004 , 0.25 );
zUv = mod( vWorldPosition.xy * 0.004 , 0.25 );

float blendAmt = 0.0;
float maxBlend = 1.0;

float cliff = ( 0.95 - worldNormal.y ) * 35.0;
if( cliff > 0.0 ) {
  blendAmt = min( 1.0 , cliff );
  maxBlend -= blendAmt;
  if( blendAmt > 0.0 ) {
    addBlend( blendAmt, 0.75, 0.5 );
  }
}

if( maxBlend > 0.0 ) {
    if( vWorldPosition.y < 50.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt, 0.25 , 0.5 );
    }
    else if( vWorldPosition.y < 80.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 50.0 ) / 30.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.5 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.5 );
    }
    else if( vWorldPosition.y < 120.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.5 );
    }
    else if( vWorldPosition.y < 150.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 120.0 ) / 30.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.5 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.5 );
    }
    else if( vWorldPosition.y < 200.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 150.0 ) / 50.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.5 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.75 );
    }
    else if( vWorldPosition.y < 300.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.75 );
    }
    else if( vWorldPosition.y < 350.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 300.0 ) / 50.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.75 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.75 );
    }
    else if( vWorldPosition.y < 500.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.75 );    
    }
    else if( vWorldPosition.y < 600.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 500.0 ) / 100.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.75 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.75 , 0.75 );
    }
    else if( vWorldPosition.y < 700.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.75 , 0.75 );    
    }
    else if( vWorldPosition.y < 800.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 700.0 ) / 100.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.75 , 0.75 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.75 );
    }
    else if( vWorldPosition.y < 900.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.75 );    
    }
    else if( vWorldPosition.y < 1000.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 900.0 ) / 100.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.75 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.25 );
    }
    else if( vWorldPosition.y < 1100.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 1000.0 ) / 100.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.0 , 0.25 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.25 );
    }
    else if( vWorldPosition.y < 1200.0 ) {
        blendAmt = 1.0 * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.25 );    
    }
    else if( vWorldPosition.y < 1250.0 ) {
        blendAmt = ( 1.0 - ( ( vWorldPosition.y - 1200.0 ) / 50.0 ) ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.25 , 0.25 );
        
        blendAmt = ( 1.0 - blendAmt ) * maxBlend;
        maxBlend -= blendAmt;
        addBlend( blendAmt , 0.5 , 0.25 );
    }

    blendAmt = maxBlend;
    if( blendAmt > 0.0 ) {
        addBlend( blendAmt , 0.5 , 0.25 );
    }
}

#ifdef DECODE_VIDEO_TEXTURE
  blendedDiffuseColor = vec4( mix( pow( blendedDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), blendedDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( blendedDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), blendedDiffuseColor.w );
#endif

diffuseColor *= blendedDiffuseColor * lightness;

`);

      shader.fragmentShader = shader.fragmentShader.replace( '#include <normal_fragment_maps>', `
mapN.xy *= normalScale;
#ifdef USE_TANGENT
  normal = normalize( vTBN * mapN );
#else
  normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
#endif
`);
      
    }
    
    return mat;      

}