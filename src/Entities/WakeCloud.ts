// src/Entities/WakeCloud.ts

import { ShaderEntity } from "../Core/ShaderEntity";
import { Game } from "../Game";
import * as THREE from "three";
import { CylinderGeometry, ShaderMaterial, UniformsUtils } from "three";
import {WakeCloudProperty} from "../Configs/WakeCloudProperty";
import {Entity} from "../Core/Entity";

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
        initialRadius: number = 0.5,
        heightIncreaseSpeed: number = 0.5,
        radiusIncreaseSpeed: number = 0.3,
        opacity: number = 0.8,
        opacityDecreaseSpeed: number = 0.4,
        /**
         * 新增的可选颜色参数，默认为白色。
         * 你也可以用字符串、数值等形式来传递颜色，然后在此进行转换。
         **/
        color: THREE.Color = new THREE.Color(1.0, 1.0, 1.0),
    ) {
        super(game, 'wakecloud', startPoint.clone().add(endPoint).multiplyScalar(0.5), new THREE.Quaternion(), -1);

        // 计算起点和终点之间的距离作为初始高度
        this.initialHeight = startPoint.distanceTo(endPoint);

        this.lifeTime = lifeTime;
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

    // Scale the geometry based on uniforms
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
uniform vec3 u_color; // 新增颜色 Uniform

varying float vNoise;
#include <common>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>

void main() {
    #include <logdepthbuf_fragment>
    // 根据噪声生成的 alpha
    float alpha = u_opacity * (1.0 - vNoise);
    // 将 u_color 作为输出颜色
    gl_FragColor = vec4(u_color, alpha);
    #include <colorspace_fragment>
}
        `;

        // 定义 uniforms 并将 color 加入其中
        this.uniforms = UniformsUtils.merge([
            THREE.UniformsLib.lights,
            {
                u_time: { value: 0.0 },
                u_height: { value: this.initialHeight },
                u_radius: { value: this.initialRadius },
                u_opacity: { value: this.opacity },
                u_color: { value: color }, // 传入颜色
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

        // 保持默认缩放，由着色器控制大小
        this.mesh.scale.set(1, 1, 1);

        const group = new THREE.Group();
        group.add(this.mesh);

        this._model = group;

        // 设置朝向，从 startPoint 指向 endPoint
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        this.setQuaternion(quaternion);

        // 设置位置为起点
        this.setPosition(startPoint.clone());

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
            this.uniforms.u_opacity.value = this.opacity - this.opacityDecreaseSpeed * (
                this.uniforms.u_time.value - this.opacityDecreaseStartTime
            );
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
            (this.mesh.material as THREE.Material[]).forEach(material => material.dispose());
        }
    }
}

export function wakeCloudPropertyToWakeCloud(entity: Entity, startPosition: THREE.Vector3, endPosition: THREE.Vector3, property: WakeCloudProperty) {
    const displacement = property.displacement.clone().applyQuaternion(entity.getQuaternion());
    new WakeCloud(
        entity.game,
        startPosition.clone().multiplyScalar(property.transformation[0][0]).add(endPosition.clone().multiplyScalar(property.transformation[0][1])).add(displacement),
        startPosition.clone().multiplyScalar(property.transformation[1][0]).add(endPosition.clone().multiplyScalar(property.transformation[1][1])).add(displacement),
        property.lifeTime,
        property.initialRadius,
        property.heightIncreaseSpeed,
        property.radiusIncreaseSpeed,
        property.opacity,
        property.opacityDecreaseSpeed,
        property.color,
    );
}