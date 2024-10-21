import * as THREE from 'three';
import { BufferGeometry, Mesh, NormalBufferAttributes, UniformsUtils } from "three";
import { ImprovedNoise } from "../Utils/ImprovedNoise";

interface CloudOptions {
    size?: number;
    base?: THREE.Color;
    threshold?: number;
    opacity?: number;
    range?: number;
    steps?: number;
    frame?: number;
}

class Cloud extends Mesh {
    isCloud: boolean;

    constructor(geometry: BufferGeometry<NormalBufferAttributes> | undefined, options: CloudOptions) {
        super(geometry);

        const scope = this;
        this.isCloud = true;

        const size = options.size !== undefined ? options.size : 128;
        const base = options.base !== undefined ? options.base : new THREE.Color(0x798aa0);
        const threshold = options.threshold !== undefined ? options.threshold : 0.25;
        const opacity = options.opacity !== undefined ? options.opacity : 0.25;
        const range = options.range !== undefined ? options.range : 0.1;
        const steps = options.steps !== undefined ? options.steps : 100;
        const frame = options.frame !== undefined ? options.frame : 0;
        const eye = new THREE.Vector3(0, 0, 0);


        const data = new Uint8Array(size * size * size);

        let i = 0;
        const scale = 0.05;
        const perlin = new ImprovedNoise();
        const vector = new THREE.Vector3();

        for (let z = 0; z < size; z++) {

            for (let y = 0; y < size; y++) {

                for (let x = 0; x < size; x++) {

                    const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
                    data[i] = (128 + 128 * perlin.noise(x * scale / 1.5, y * scale, z * scale / 1.5)) * d * d;
                    i++;

                }

            }

        }

        const texture = new THREE.Data3DTexture(data, size, size, size);
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        // Material

        const vertexShader = /* glsl */`
        uniform vec3 cameraPos;

        varying vec3 vOrigin;
        varying vec3 vDirection;
        varying vec4 worldPosition;

        #include <common>
        #include <fog_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>

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
        }`;

        const fragmentShader = /* glsl */`
        precision highp float;
        precision highp sampler3D;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        varying vec3 vOrigin;
        varying vec3 vDirection;
        varying vec4 worldPosition;

        uniform vec3 base;
        uniform sampler3D map;

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
            const vec3 box_min = vec3( - 10.0 );
            const vec3 box_max = vec3( 10.0 );
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
            return texture( map, p ).r;
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

        void main() {
            vec3 rayDir = normalize( vDirection );
            vec2 bounds = hitBox( vOrigin, rayDir );

            if ( bounds.x > bounds.y ) discard;

            bounds.x = max( bounds.x, 0.0 );

            vec3 p = vOrigin + bounds.x * rayDir;
            vec3 inc = 1.0 / abs( rayDir );
            float delta = min( inc.x, min( inc.y, inc.z ) );
            delta /= steps;

            // Jitter

            // Nice little seed from
            // https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
            uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
            vec3 size = vec3( textureSize( map, 0 ) );
            float randNum = randomFloat( seed ) * 2.0 - 1.0;
            p += rayDir * randNum * ( 1.0 / size );

            //

            vec4 ac = vec4( base, 0.0 );

            for ( float t = bounds.x; t < bounds.y; t += delta ) {

                float d = sample1( p + 0.5 );

                d = smoothstep( threshold - range, threshold + range, d ) * opacity;

                float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;

                ac.rgb += ( 1.0 - ac.a ) * d * col;

                ac.a += ( 1.0 - ac.a ) * d;

                if ( ac.a >= 0.95 ) break;

                p += rayDir * delta;

            }

            gl_FragColor = linearToSRGB( ac );

            if ( gl_FragColor.a == 0.0 ) discard;

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>	
        }`;

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
                    frame: { value: frame }
                }
            ]),
            vertexShader,
            fragmentShader,
            lights: true,
            side: THREE.BackSide,
            transparent: true,
            depthTest: true,
            depthWrite: false,
        });

        scope.material = material;

        scope.onBeforeRender = function (renderer, scene, camera) {
            material.uniforms.cameraPos.value.copy(camera.position);
        }
    }
}

export { Cloud, CloudOptions };