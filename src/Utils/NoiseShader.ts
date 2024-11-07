const mathLib = /* glsl */ `
vec3 mod289(vec3 x) {
    return x - floor(x / 289.0) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x / 289.0) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return vec4(1.79284291400159) - r * 0.85373472095314;
}

vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
`;

const perlinNoiseLib = /* glsl */ `
float pnoise(vec3 P, vec3 rep) {
    P *= rep;
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); 
    vec3 Pf1 = Pf0 - vec3(1.0); 
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
    vec4 iz0 = vec4(Pi0.z);
    vec4 iz1 = vec4(Pi1.z);

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
    gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
    gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.y, Pf0.z));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.x, Pf1.y, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.x, Pf0.y, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.y, Pf1.z));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}
`;

const worleyNoiseLib = /* glsl */ `
// Worley noise implementation for GLSL shaders.
vec3 dist(vec3 x, vec3 y, vec3 z, bool manhattanDistance) {
    return manhattanDistance ? abs(x) + abs(y) + abs(z) : (x * x + y * y + z * z);
}

// Worley noise, periodic variant
vec2 worley(vec3 P, float jitter, bool manhattanDistance, float rep) {
    P *= rep;

    float K = 0.142857142857; // 1/7
    float Ko = 0.428571428571; // 1/2 - K/2
    float K2 = 0.020408163265306; // 1/(7*7)
    float Kz = 0.166666666667; // 1/6
    float Kzo = 0.416666666667; // 1/2 - 1/6*2

    vec3 Pi = mod(floor(P), 289.0);
    vec3 Pf = fract(P) - 0.5;

    vec3 oi = vec3(-1.0, 0.0, 1.0);
    vec3 io = vec3(1.0, 0.0, -1.0);

    vec3 Pfx = Pf.x + io;
    vec3 Pfy = Pf.y + io;
    vec3 Pfz = Pf.z + io;

    vec3 p = permute(mod(Pi.x + oi, rep));
    vec3 p1 = permute(mod(p + Pi.y - 1.0, rep));
    vec3 p2 = permute(mod(p + Pi.y, rep));
    vec3 p3 = permute(mod(p + Pi.y + 1.0, rep));

    vec3 p11 = permute(mod(p1 + Pi.z - 1.0, rep));
    vec3 p12 = permute(mod(p1 + Pi.z, rep));
    vec3 p13 = permute(mod(p1 + Pi.z + 1.0, rep));

    vec3 p21 = permute(mod(p2 + Pi.z - 1.0, rep));
    vec3 p22 = permute(mod(p2 + Pi.z, rep));
    vec3 p23 = permute(mod(p2 + Pi.z + 1.0, rep));

    vec3 p31 = permute(mod(p3 + Pi.z - 1.0, rep));
    vec3 p32 = permute(mod(p3 + Pi.z, rep));
    vec3 p33 = permute(mod(p3 + Pi.z + 1.0, rep));

    vec3 ox11 = fract(p11 * K) - Ko;
    vec3 oy11 = mod(floor(p11 * K), 7.0) * K - Ko;
    vec3 oz11 = floor(p11 * K2) * Kz - Kzo;

    vec3 ox12 = fract(p12 * K) - Ko;
    vec3 oy12 = mod(floor(p12 * K), 7.0) * K - Ko;
    vec3 oz12 = floor(p12 * K2) * Kz - Kzo;

    vec3 ox13 = fract(p13 * K) - Ko;
    vec3 oy13 = mod(floor(p13 * K), 7.0) * K - Ko;
    vec3 oz13 = floor(p13 * K2) * Kz - Kzo;

    vec3 ox21 = fract(p21 * K) - Ko;
    vec3 oy21 = mod(floor(p21 * K), 7.0) * K - Ko;
    vec3 oz21 = floor(p21 * K2) * Kz - Kzo;

    vec3 ox22 = fract(p22 * K) - Ko;
    vec3 oy22 = mod(floor(p22 * K), 7.0) * K - Ko;
    vec3 oz22 = floor(p22 * K2) * Kz - Kzo;

    vec3 ox23 = fract(p23 * K) - Ko;
    vec3 oy23 = mod(floor(p23 * K), 7.0) * K - Ko;
    vec3 oz23 = floor(p23 * K2) * Kz - Kzo;

    vec3 ox31 = fract(p31 * K) - Ko;
    vec3 oy31 = mod(floor(p31 * K), 7.0) * K - Ko;
    vec3 oz31 = floor(p31 * K2) * Kz - Kzo;

    vec3 ox32 = fract(p32 * K) - Ko;
    vec3 oy32 = mod(floor(p32 * K), 7.0) * K - Ko;
    vec3 oz32 = floor(p32 * K2) * Kz - Kzo;

    vec3 ox33 = fract(p33 * K) - Ko;
    vec3 oy33 = mod(floor(p33 * K), 7.0) * K - Ko;
    vec3 oz33 = floor(p33 * K2) * Kz - Kzo;

    vec3 dx11 = Pfx + jitter * ox11;
    vec3 dy11 = Pfy.x + jitter * oy11;
    vec3 dz11 = Pfz.x + jitter * oz11;

    vec3 dx12 = Pfx + jitter * ox12;
    vec3 dy12 = Pfy.x + jitter * oy12;
    vec3 dz12 = Pfz.y + jitter * oz12;

    vec3 dx13 = Pfx + jitter * ox13;
    vec3 dy13 = Pfy.x + jitter * oy13;
    vec3 dz13 = Pfz.z + jitter * oz13;

    vec3 dx21 = Pfx + jitter * ox21;
    vec3 dy21 = Pfy.y + jitter * oy21;
    vec3 dz21 = Pfz.x + jitter * oz21;

    vec3 dx22 = Pfx + jitter * ox22;
    vec3 dy22 = Pfy.y + jitter * oy22;
    vec3 dz22 = Pfz.y + jitter * oz22;

    vec3 dx23 = Pfx + jitter * ox23;
    vec3 dy23 = Pfy.y + jitter * oy23;
    vec3 dz23 = Pfz.z + jitter * oz23;

    vec3 dx31 = Pfx + jitter * ox31;
    vec3 dy31 = Pfy.z + jitter * oy31;
    vec3 dz31 = Pfz.x + jitter * oz31;

    vec3 dx32 = Pfx + jitter * ox32;
    vec3 dy32 = Pfy.z + jitter * oy32;
    vec3 dz32 = Pfz.y + jitter * oz32;

    vec3 dx33 = Pfx + jitter * ox33;
    vec3 dy33 = Pfy.z + jitter * oy33;
    vec3 dz33 = Pfz.z + jitter * oz33;

    vec3 d11 = dist(dx11, dy11, dz11, manhattanDistance);
    vec3 d12 = dist(dx12, dy12, dz12, manhattanDistance);
    vec3 d13 = dist(dx13, dy13, dz13, manhattanDistance);
    vec3 d21 = dist(dx21, dy21, dz21, manhattanDistance);
    vec3 d22 = dist(dx22, dy22, dz22, manhattanDistance);
    vec3 d23 = dist(dx23, dy23, dz23, manhattanDistance);
    vec3 d31 = dist(dx31, dy31, dz31, manhattanDistance);
    vec3 d32 = dist(dx32, dy32, dz32, manhattanDistance);
    vec3 d33 = dist(dx33, dy33, dz33, manhattanDistance);

    vec3 d1a = min(d11, d12);
    d12 = max(d11, d12);
    d11 = min(d1a, d13);
    d13 = max(d1a, d13);
    d12 = min(d12, d13);

    vec3 d2a = min(d21, d22);
    d22 = max(d21, d22);
    d21 = min(d2a, d23);
    d23 = max(d2a, d23);
    d22 = min(d22, d23);

    vec3 d3a = min(d31, d32);
    d32 = max(d31, d32);
    d31 = min(d3a, d33);
    d33 = max(d3a, d33);
    d32 = min(d32, d33);

    vec3 da = min(d11, d21);
    d21 = max(d11, d21);
    d11 = min(da, d31);
    d31 = max(da, d31);
    d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
    d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx;

    d12 = min(d12, d21);
    d12 = min(d12, d22);
    d12 = min(d12, d31);
    d12 = min(d12, d32);
    d11.yz = min(d11.yz, d12.xy);
    d11.y = min(d11.y, d12.z);
    d11.y = min(d11.y, d11.z);
    return sqrt(d11.xy); // F1, F2
}
`;

const noiseShader = /* glsl */ `
${mathLib}
${perlinNoiseLib}
${worleyNoiseLib}

float fbm_perlin(vec3 st, int octaves, int rep) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < octaves; i++) {
        value += amplitude * pnoise(st, vec3(rep));
        rep *= 2; // Modify the repetition instead of the texture coordinates
        amplitude *= 0.5;
    }
    return value * 0.5 + 0.5; // Scale to [0, 1]
}

float fbm_worley(vec3 st, int octaves, int rep) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < octaves; i++) {
        value += amplitude * (1.0 - worley(st, 1.0, false, float(rep)).x);
        rep *= 2; // Modify the repetition instead of the texture coordinates
        amplitude *= 0.5;
    }
    return value;
}

float remap(float value, float original_min, float original_max, float new_min, float new_max) {
    return new_min + ((value - original_min) / (original_max - original_min)) * (new_max - new_min);
}
`;

export default noiseShader;
