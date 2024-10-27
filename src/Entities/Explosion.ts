import {ShaderEntity} from "../Core/ShaderEntity";
import {Game} from "../Game";
import * as THREE from "three";
import {IcosahedronGeometry, Mesh, ShaderChunk, ShaderMaterial, TextureLoader, UniformsUtils} from "three";
import { noise } from "../Utils/Noise";

export class Explosion extends ShaderEntity {
    public texture?: THREE.Texture;
    public mesh: THREE.Mesh;
    public lifeTime: number;
    public radius: number;
    public initScale: number;
    public scaleIncreaseSpeed: number;
    public opacity: number;
    public opacityDecreaseSpeed: number;
    public opacityDecreaseStartTime: number;

    constructor(game: Game, pos?: THREE.Vector3, qua?: THREE.Quaternion, radius?: number, lifeTime?: number, initScale?: number, scaleIncreaseSpeed?: number, opacity?:number, opacityDecreaseSpeed?: number) {
        super(game, 'explosion', pos, qua, -1);
        this.radius = radius ?? 20;
        this.lifeTime = lifeTime ?? 1.5;
        this.initScale = initScale ?? 0.05;
        this.scaleIncreaseSpeed = scaleIncreaseSpeed ?? 0.7;
        this.opacity = opacity ?? 0.6;
        this.opacityDecreaseSpeed = opacityDecreaseSpeed ?? 0.4;
        this.opacityDecreaseStartTime = Math.max(0, this.lifeTime - this.opacity / this.opacityDecreaseSpeed);


        this.vShader = /* glsl */`
${noise}
#include <common>
#include <logdepthbuf_pars_vertex>

uniform float u_time;

varying float noise;

void main() {	
  float time = u_time;
  float displacement;
  float b;
  
  // add time to the noise parameters so it's animated
  noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
  b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
  displacement = - 10. * noise + b;

  // move the position along the normal and transform it
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  #include <logdepthbuf_vertex>
}`
        this.fShader = /* glsl */`

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_opacity;
uniform sampler2D u_tex;

varying float noise;

//	<https://www.shadertoy.com/view/4dS3Wd>
//	By Morgan McGuire @morgan3d, http://graphicscodex.com

//https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/

float random( vec3 scale, float seed ){
  return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
}

#include <common>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>

void main() {
  #include <logdepthbuf_fragment>
  // get a random offset
  float r = .01 * random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );
  // lookup vertically in the texture, using noise and offset
  // to get the right RGB colour
  vec2 t_pos = vec2( 0, 1.3 * noise + r );
  vec4 color = texture2D( u_tex, t_pos );

  gl_FragColor = vec4( color.rgb, u_opacity );
  #include <colorspace_fragment>
}`
        this.uniforms = UniformsUtils.merge([
            THREE.UniformsLib.lights,
            {
                u_time: { value: 0.0 },
                u_mouse: { value:{ x:0.0, y:0.0 }},
                u_opacity: { value: this.opacity },
                u_resolution: { value:{ x:0, y:0 }},
                u_tex: { value: new TextureLoader().load(`${this.assetsPath}${this.assetConfig.path}`)},
            }
        ])

        console.log(this.texture);

        const geometry = new IcosahedronGeometry( this.radius, 4 );

        const material = new ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: this.vShader,
            fragmentShader: this.fShader,
            transparent: true,
            opacity: this.opacity,
            lights: true,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false,
        } );

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(this.initScale, this.initScale, this.initScale);

        const group = new THREE.Group();
        group.add(this.mesh);

        this._model = group;

        this.setPosition(this.tmpPos);
        this.setQuaternion(this.tmpQua);

        this.game.scene.add(this._model);
    }

    update(deltaTime: number) {
        if (!this.ready || this.removed) return;

        this.uniforms.u_time.value += deltaTime;
         if (this.mesh.material instanceof THREE.Material) {
             this.uniforms.u_opacity.value = this.mesh.material.opacity;
         } else if (this.mesh.material) {
             this.uniforms.u_opacity.value = this.mesh.material[0].opacity;
        }

        // Gradually increase the scale over time
        const scaleIncrease = deltaTime * this.scaleIncreaseSpeed; // Adjust scaling speed if necessary
        this.mesh.scale.x += scaleIncrease;
        this.mesh.scale.y += scaleIncrease;
        this.mesh.scale.z += scaleIncrease;

        if ( this.uniforms.u_time.value > this.opacityDecreaseStartTime) {
            this.uniforms.u_opacity.value = this.opacity - this.opacityDecreaseSpeed * (this.uniforms.u_time.value - this.opacityDecreaseStartTime);
        }

        if ( this.uniforms.u_time.value > this.lifeTime) {
            this.dispose();
        }

        super.update(deltaTime);
    }

    dispose(): void{
        super.dispose();
        this.mesh.geometry.dispose();
        if (this.mesh.material instanceof THREE.Material) {
            this.mesh.material.dispose();
        } else if (this.mesh.material) {
            this.mesh.material.forEach(material => material.dispose());
        }
    }
}