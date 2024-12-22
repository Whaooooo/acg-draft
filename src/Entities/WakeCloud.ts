// src/Entities/WakeCloud.ts

import { ShaderEntity } from "../Core/ShaderEntity";
import { Game } from "../Game";
import * as THREE from "three";
import { CylinderGeometry, ShaderMaterial, UniformsUtils } from "three";

export class WakeCloud extends ShaderEntity {
    public mesh: THREE.Mesh;
    public lifeTime: number;
    public initialHeight: number;
    public initialRadius: number;
    public heightIncreaseSpeed: number;
    public radiusIncreaseSpeed: number;
    public opacity: number;
    public opacityDecreaseSpeed: number;
    public opacityDecreaseStartTime: number;

    constructor(
        game: Game,
        startPoint: THREE.Vector3,
        endPoint: THREE.Vector3,
        lifeTime: number = 2.0,
        initialHeight: number = 1.0,
        initialRadius: number = 0.5,
        heightIncreaseSpeed: number = 0.5,
        radiusIncreaseSpeed: number = 0.3,
        opacity: number = 0.8,
        opacityDecreaseSpeed: number = 0.4
    ) {
        // 调用父类构造函数，使用'minimal'加载器
        super(game, 'wakecloud', startPoint, new THREE.Quaternion(), -1);

        this.lifeTime = lifeTime;
        this.initialHeight = initialHeight;
        this.initialRadius = initialRadius;
        this.heightIncreaseSpeed = heightIncreaseSpeed;
        this.radiusIncreaseSpeed = radiusIncreaseSpeed;
        this.opacity = opacity;
        this.opacityDecreaseSpeed = opacityDecreaseSpeed;
        this.opacityDecreaseStartTime = Math.max(0, this.lifeTime - this.opacity / this.opacityDecreaseSpeed);

        // 定义顶点和片段着色器
        this.vShader = /* glsl */`
#include <common>
#include <logdepthbuf_pars_vertex>
uniform float u_time;
uniform float u_height;
uniform float u_radius;

varying float vNoise;

// Simple noise function
float noise(vec3 pos) {
    return fract(sin(dot(pos, vec3(12.9898,78.233, 45.164))) * 43758.5453);
}

void main() {
    float displacement = noise(position * 10.0 + u_time) * 0.5;
    vNoise = displacement;

    // Scale the geometry based on time
    vec3 scaledPosition = position;
    scaledPosition.y *= u_height;
    scaledPosition.x *= u_radius;
    scaledPosition.z *= u_radius;

    // Apply displacement
    scaledPosition += normal * displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
    #include <logdepthbuf_vertex>
}
        `;

        this.fShader = /* glsl */`
uniform float u_opacity;

varying float vNoise;
#include <common>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>
void main() {
    #include <logdepthbuf_fragment>
    // 简单的白色颜色，透明度根据噪声变化
    float alpha = u_opacity * (1.0 - vNoise);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    #include <colorspace_fragment>
}
        `;

        // 定义uniforms
        this.uniforms = UniformsUtils.merge([
            THREE.UniformsLib.lights,
            {
                u_time: { value: 0.0 },
                u_height: { value: this.initialHeight },
                u_radius: { value: this.initialRadius },
                u_opacity: { value: this.opacity },
            }
        ]);

        // 创建几何体和材质
        const geometry = new CylinderGeometry(1, 1, 1, 32, 1, true);
        const material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vShader,
            fragmentShader: this.fShader,
            transparent: true,
            opacity: this.opacity,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false,
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // 初始缩放
        this.mesh.scale.set(this.initialRadius, this.initialHeight, this.initialRadius);

        const group = new THREE.Group();
        group.add(this.mesh);

        this._model = group;

        // 设置位置，从startPoint到endPoint的中点
        const midpoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
        this.setPosition(midpoint);

        // 设置朝向，从startPoint指向endPoint
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        this.setQuaternion(quaternion);

        // 添加到场景
        this.game.scene.add(this._model);
    }

    update(deltaTime: number) {
        if (!this.ready || this.removed) return;

        this.uniforms.u_time.value += deltaTime;

        // 动态调整高度和半径
        this.uniforms.u_height.value += this.heightIncreaseSpeed * deltaTime;
        this.uniforms.u_radius.value += this.radiusIncreaseSpeed * deltaTime;

        // 动态调整不透明度
        if (this.uniforms.u_time.value > this.opacityDecreaseStartTime) {
            this.uniforms.u_opacity.value = this.opacity - this.opacityDecreaseSpeed * (this.uniforms.u_time.value - this.opacityDecreaseStartTime);
            this.uniforms.u_opacity.value = Math.max(this.uniforms.u_opacity.value, 0.0); // 防止负值
        }

        // 检查生命周期
        if (this.uniforms.u_time.value > this.lifeTime) {
            this.dispose();
            return;
        }

        super.update(deltaTime);
    }

    dispose(): void {
        super.dispose();
        this.mesh.geometry.dispose();
        if (this.mesh.material instanceof THREE.Material) {
            this.mesh.material.dispose();
        } else if (this.mesh.material) {
            this.mesh.material.forEach(material => material.dispose());
        }
    }
}
