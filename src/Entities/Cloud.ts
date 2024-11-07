import * as THREE from 'three';
import { BufferGeometry, Mesh, NormalBufferAttributes, UniformsUtils } from "three";
import { ImprovedNoise } from "../Utils/ImprovedNoise";
import noiseShader from '../Utils/NoiseShader';

interface CloudOptions {
    size?: [number, number, number];
    base?: THREE.Color;
    threshold?: number;
    opacity?: number;
    range?: number;
    steps?: number;
    frame?: number;
    boxBound?: THREE.Vector3;
}

const shadowVertexShader = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const shadowFragmentShader = /* glsl */`
varying vec2 vUv;

uniform sampler3D map;
uniform float steps;
uniform vec3 sunLight;
uniform vec3 base;
uniform vec3 boxBound;
uniform float threshold;
uniform float range;
uniform float opacity;

float sample1( vec3 p ) {
    return texture( map, vec3(p.x, p.z, p.y) ).r;
}

float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
}

vec2 hitBox( vec3 orig, vec3 dir ) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
}

vec4 linearToSRGB( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

void main() {
    vec3 origProj = vec3(vUv.x - 0.5, -0.5, vUv.y - 0.5);

    vec3 rayDir = normalize(sunLight / boxBound);
    vec2 bounds = hitBox(origProj, rayDir);

    vec3 p = origProj + bounds.x * rayDir;
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= steps;

    vec4 ac = vec4( base, 0.0 );

    for ( float t = bounds.x; t < bounds.y; t += delta ) {
            float d = sample1(p + 0.5);
            d = smoothstep(threshold - range, threshold + range, d) * opacity;
            float col = shading(p + 0.5) * 3.0 + ((p.x + p.y) * 0.25) + 0.2;
            col = clamp(col, -0.1, 2.0); // avoid black hole
            ac.rgb += (1.0 - ac.a) * d * col;
            ac.a += ( 1.0 - ac.a ) * d;
            if ( ac.a >= 0.95 ) break;
            p += rayDir * delta;
    }

    ac.a = smoothstep( 0.1, 0.95, ac.a );

    gl_FragColor = linearToSRGB(ac);
}`;

const renderVertexShader = /* glsl */`
uniform vec3 cameraPos;
uniform vec3 boxBound;

varying vec3 vOrigin;
varying vec3 vDirection;
varying vec4 worldPosition;

#include <common>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>

varying vec4 vShadowDirection[ NUM_DIR_LIGHT_SHADOWS ];
varying vec4 vOriginShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
    vDirection = position - vOrigin;
    worldPosition = modelMatrix * vec4( position, 1.0 );

    gl_Position = projectionMatrix * mvPosition;

    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <logdepthbuf_vertex>
    #include <fog_vertex>
    #include <shadowmap_vertex>

    #if NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

            shadowWorldPosition = modelMatrix * vec4(vOrigin, 1.0) + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vOriginShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
			vShadowDirection[ i ] = directionalShadowMatrix[ i ] * (modelMatrix *  vec4(vDirection, 0.0));

		}
		#pragma unroll_loop_end

	#endif
}`;

const renderFragmentShader = /* glsl */`
precision highp float;
precision highp sampler3D;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vOrigin;
varying vec3 vDirection;
varying vec4 worldPosition;

uniform vec3 base;
uniform sampler3D map;
uniform vec3 boxBound;

uniform float threshold;
uniform float range;
uniform float opacity;
uniform float steps;
uniform float frame;

uint wang_hash(uint seed)
{
    seed = (seed ^ 61u) ^ (seed >> 16u);
    seed *= 9u;
    seed = seed ^ (seed >> 4u);
    seed *= 0x27d4eb2du;
    seed = seed ^ (seed >> 15u);
    return seed;
}

float randomFloat(inout uint seed)
{
        return float(wang_hash(seed)) / 4294967296.;
}

vec2 hitBox( vec3 orig, vec3 dir ) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
}

float sample1( vec3 p ) {
    return texture( map, vec3(p.x, p.z, p.y) ).r;
}

float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
}

vec4 linearToSRGB( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

#include <common>
#include <packing>
#include <bsdfs>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

varying vec4 vShadowDirection[ NUM_DIR_LIGHT_SHADOWS ];
varying vec4 vOriginShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

float getCloudShadowMask(float offset) {

	float shadow = 1.0;

	#if NUM_DIR_LIGHT_SHADOWS > 0

	DirectionalLightShadow directionalLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

		directionalLight = directionalLightShadows[ i ];
		shadow *= getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vOriginShadowCoord[ i ] + offset * vShadowDirection[ i ]);

	}
	#pragma unroll_loop_end

	#endif

	return shadow;

}

void main() {

    #include <logdepthbuf_fragment>
    vec3 rayDir = normalize( vDirection / boxBound );
    vec3 origProj = vOrigin / boxBound;
    vec2 bounds = hitBox( origProj, rayDir );

    if ( bounds.x > bounds.y ) discard;

    bounds.x = max( bounds.x, 0.0 );

    vec3 p = origProj + bounds.x * rayDir;
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= steps;

    // Jitter

    // Nice little seed from
    // https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
    uint seed = uint( gl_FragCoord.x * 137.0 ) * uint( 1973 ) + uint( gl_FragCoord.y * 101.0 ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
    vec3 size = vec3( textureSize( map, 0 ) );
    float randNum = randomFloat( seed ) * 2.0 - 1.0;
    p += rayDir * randNum * ( 1.0 / size );

    //

    float shadow_intensity = 0.0;
    float prop = 1.0;
    vec4 ac = vec4( base, 0.0 );
    for ( float t = bounds.x; t < bounds.y; t += delta ) {
        float d = sample1( p + 0.5 );
        d = smoothstep( threshold - range, threshold + range, d ) * opacity;
        float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;
        col = clamp( col, -0.1, 2.0 ); // avoid black hole
        ac.rgb += ( 1.0 - ac.a ) * d * col;
        ac.a += ( 1.0 - ac.a ) * d;
        if ( ac.a >= 0.95 ) break;
        if ( prop > 0.01 ) {
            float acc = clamp(10.0 * d, 0.0, 1.0);
            if ( acc > 0.001 ) {
                shadow_intensity += (1.0-getCloudShadowMask(t / length(vDirection / boxBound))) * acc * prop;
                prop *= (1.0 - acc);
            }
        }
        p += rayDir * delta;
    }

    ac.a = smoothstep( 0.1, 0.95, ac.a );
    ac = vec4( ac.rgb * (1.0-shadow_intensity), ac.a );

    gl_FragColor = linearToSRGB( ac );

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>	
}`;

class Cloud extends THREE.Group {
    isCloud: boolean;
    cloud?: Mesh;

    constructor(options: CloudOptions, renderer: THREE.WebGLRenderer) {
        super();

        const boxBound = options.boxBound !== undefined ? options.boxBound : new THREE.Vector3(1.0, 1.0, 1.0);
        const geometry = new THREE.BoxGeometry(boxBound.x, boxBound.y * 0.9, boxBound.z);
        const height = 3500;

        const scope = this;
        this.isCloud = true;

        const size = options.size !== undefined ? options.size : [128, 128, 128];
        const base = options.base !== undefined ? options.base : new THREE.Color(0x808487);
        const threshold = options.threshold !== undefined ? options.threshold : 0.25;
        const opacity = options.opacity !== undefined ? options.opacity : 0.25;
        const range = options.range !== undefined ? options.range : 0.1;
        const steps = options.steps !== undefined ? options.steps : 100;
        const frame = options.frame !== undefined ? options.frame : 0;
        const eye = new THREE.Vector3(0, 0, 0);

        // const texture = this.generateMixedTexture(size[0], size[2], size[1], renderer);
        const texture = this.generatePerlinTexture(size[0], size[2], size[1]);

        const shadowmaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                steps: { value: steps },
                sunLight: { value: new THREE.Vector3(1, 1, 1) },
                base: { value: base },
                boxBound: { value: boxBound },
                threshold: { value: threshold },
                range: { value: range },
                opacity: { value: opacity },
            },
            vertexShader: shadowVertexShader,
            fragmentShader: shadowFragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
        });

        const ShadowTarget = new THREE.WebGLRenderTarget(4096, 4096, { format: THREE.RGBAFormat });
        const textureCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100);
        const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shadowmaterial);
        const currentTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(ShadowTarget);
        renderer.render(screenQuad, textureCamera);
        renderer.setRenderTarget(currentTarget);

        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: ShadowTarget.texture,
            alphaMap: ShadowTarget.texture,
            transparent: true,
            opacity: 0.0,
            alphaTest: 0.3,
            side: THREE.FrontSide,
        });
        const cloudShadowGeometry = new THREE.PlaneGeometry(boxBound.x, boxBound.z);
        cloudShadowGeometry.rotateX(Math.PI / 2);
        const cloudShadow = new THREE.Mesh(cloudShadowGeometry, shadowMaterial);
        cloudShadow.position.set(0, height - boxBound.y * 0.45 - 1, 0);
        cloudShadow.castShadow = true;
        this.add(cloudShadow);



        const material = new THREE.ShaderMaterial({
            uniforms: UniformsUtils.merge([
                THREE.UniformsLib.fog,
                THREE.UniformsLib.lights,
                {
                    base: { value: base },
                    map: { value: texture },
                    cameraPos: { value: eye },
                    threshold: { value: threshold },
                    opacity: { value: opacity },
                    range: { value: range },
                    steps: { value: steps },
                    frame: { value: frame },
                    boxBound: { value: boxBound },
                }
            ]),
            vertexShader: renderVertexShader,
            fragmentShader: renderFragmentShader,
            lights: true,
            side: THREE.BackSide,
            transparent: true,
            depthTest: true,
            depthWrite: false,
        });

        const cloud = new Mesh(geometry, material);
        cloud.frustumCulled = false;
        cloud.receiveShadow = true;

        cloud.position.set(0, height, 0);
        this.add(cloud);
        this.cloud = cloud;

        // const debugMaterial = new THREE.ShaderMaterial({
        //     uniforms: {
        //         map: { value: texture },
        //     },
        //     vertexShader: shadowVertexShader,
        //     fragmentShader: /* glsl */`
        //     uniform sampler3D map;

        //     varying vec2 vUv;

        //     void main() {
        //         gl_FragColor = vec4(texture(map, vec3(vUv.x, vUv.y, 0.2)).r);
        //         gl_FragColor.a = 1.0;
        //     }
        //     `,
        //     side: THREE.DoubleSide,
        //     transparent: true,
        //     depthTest: true,
        // });
        // const debugGeometry = new THREE.PlaneGeometry(boxBound.x, boxBound.z);
        // debugGeometry.rotateX(Math.PI / 2);

        // const mesh = new Mesh(debugGeometry, debugMaterial);
        // mesh.position.set(0, height, 0);

        cloud.onBeforeRender = function (renderer, scene, camera) {
            material.uniforms.cameraPos.value.copy(camera.position);
        };
    }

    private generateMixedTexture(width: number, height: number, depth: number, renderer: THREE.WebGLRenderer) {
        const target = new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
        const currentTarget = renderer.getRenderTarget();
        const noiseMaterial = new THREE.ShaderMaterial({
            uniforms: {
                z: { value: 0.5 },
            },
            vertexShader: shadowVertexShader,
            fragmentShader: /* glsl */`
            uniform float z;

            varying vec2 vUv;

            ${noiseShader}

            float mixed_noise(vec3 st) {
                float perlin = fbm_perlin(st, 4, 11);
                perlin = (perlin - 0.5) * 3.0 + 0.5;
                perlin += 1.2 - 1.0;

                float worley = fbm_worley(st, 5, 10);
                worley = (worley - 0.5) * 3.0 + 0.5;
                worley += 1.0 - 1.0;

                return worley - perlin * (1.0 - worley);
            }

            void main() {
                vec3 st = vec3(vUv, z);
                
                vec3 color = vec3(mixed_noise(st));

                gl_FragColor = vec4(color, 1.0);
            }
            `,
            side: THREE.DoubleSide,
            depthTest: true,
        });

        const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), noiseMaterial);
        const textureCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100);

        const u8 = new Uint8Array(width * height * depth);

        for (let i = 0; i < depth; i++) {
            noiseMaterial.uniforms.z.value = (i + Math.random() * 256) / 1024;
            renderer.setRenderTarget(target);
            renderer.render(screenQuad, textureCamera);
            const pixels = new Uint8Array(width * height * 4);
            renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
            const offset = i * width * height;
            for (let j = 0; j < width * height; j++) {
                u8[j + offset] = pixels[j * 4];
            }
        }

        renderer.setRenderTarget(currentTarget);

        const texture = new THREE.Data3DTexture(u8, width, height, depth);
        texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        return texture;
    }

    private generatePerlinTexture(width: number, height: number, depth: number) {
        const data = new Uint8Array(width * depth * height);

        let i = 0;
        const scale = 0.05;
        const perlin = new ImprovedNoise();
        const vector = new THREE.Vector3();
        const sizeVec = new THREE.Vector3(width, depth, height);
        const halfSize = sizeVec.clone().multiplyScalar(0.5);

        for (let y = 0; y < depth; y++) {
            for (let z = 0; z < height; z++) {
                for (let x = 0; x < width; x++) {
                    const d = 1.0 - vector.set(x, y, z).sub(halfSize).divide(sizeVec).length();
                    data[i] = (128 + 128 * perlin.noise(x * scale / 1.5, y * scale, z * scale / 1.5)) * d * d;
                    i++;
                }
            }
        }

        const texture = new THREE.Data3DTexture(data, width, height, depth);
        texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        return texture;
    }

    public update(deltaTime: number): void {
        if (this.cloud) {
            (this.cloud.material as any).uniforms['frame'].value += deltaTime * 120;
        }
    }
}

export { Cloud, CloudOptions };