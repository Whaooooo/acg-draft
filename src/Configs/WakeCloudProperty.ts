// src/Configs/WakeCloudProperty.ts

import * as THREE from "three";

/**
 * 可选的 WakeCloud 属性，用于在创建时传递部分或全部属性。
 */
export interface _WakeCloudProperty {
    transformation?: [[number, number], [number, number]];
    lifeTime?: number;
    initialRadius?: number;
    heightIncreaseSpeed?: number;
    radiusIncreaseSpeed?: number;
    opacity?: number;
    opacityDecreaseSpeed?: number;
    color?: THREE.Color;
    displacement?: THREE.Vector3 | [number, number, number];
}

/**
 * 完整的 WakeCloud 属性，所有属性均为必填。
 */
export interface WakeCloudProperty {
    transformation: [[number, number], [number, number]];
    lifeTime: number;
    initialRadius: number;
    heightIncreaseSpeed: number;
    radiusIncreaseSpeed: number;
    opacity: number;
    opacityDecreaseSpeed: number;
    color: THREE.Color;
    displacement: THREE.Vector3;
}

export function createWakeCloudProperty(props: _WakeCloudProperty): WakeCloudProperty {
    // 解构 displacement 和其他属性
    const { displacement, ...rest } = props;

    // 处理 displacement，如果是数组，则转换为 Vector3；否则保持不变
    const processedDisplacement = displacement
        ? Array.isArray(displacement)
            ? new THREE.Vector3(...displacement)
            : displacement
        : new THREE.Vector3(0.0, 0.0, 0.0);

    return {
        transformation: [[1.05, -0.05], [0.0, 1.0]],
        lifeTime: 2.0, // 默认生命周期为2秒
        initialRadius: 0.5, // 默认初始半径
        heightIncreaseSpeed: 0.5, // 默认高度增长速度
        radiusIncreaseSpeed: 0.3, // 默认半径增长速度
        opacity: 0.8, // 默认不透明度
        opacityDecreaseSpeed: 0.4, // 默认不透明度减少速度
        color: new THREE.Color(1.0, 1.0, 1.0), // 默认颜色为白色
        displacement: processedDisplacement, // 处理后的 displacement
        ...rest, // 使用传入的属性覆盖默认值
    };
}

export const missileWakeCloudProperty: WakeCloudProperty = createWakeCloudProperty({
    lifeTime: 2.0,
    initialRadius: 0.0,
    heightIncreaseSpeed: 0.5,
    radiusIncreaseSpeed: 0.1,
    opacity: 0.8,
    opacityDecreaseSpeed: 0.4,
    });

export const wingWakeCloudProperty: WakeCloudProperty = createWakeCloudProperty({
    transformation: [[1.05, -0.05], [0.0, 1.0]],
    lifeTime: 5.0,
    initialRadius: 0.01,
    heightIncreaseSpeed: 0.15,
    radiusIncreaseSpeed: 0.01,
    opacity: 0.8,
    opacityDecreaseSpeed: 0.16,
    });

export const fireYellowDecreaseWakeCloudProperty: WakeCloudProperty = createWakeCloudProperty({
    transformation: [[0.1, 0.9], [0.0, 1.0]],
    lifeTime: 0.25,
    initialRadius: 0.4,
    heightIncreaseSpeed: -0.8,
    radiusIncreaseSpeed: -0.8,
    opacity: 0.7,
    opacityDecreaseSpeed: 2.8,
    color: new THREE.Color(0.9, 0.3, 0.05),
});

export const fireBlueDecreaseWakeCloudProperty: WakeCloudProperty = createWakeCloudProperty({
    transformation: [[0.07, 0.93], [0.0, 1.0]],
    lifeTime: 0.25,
    initialRadius: 0.5,
    heightIncreaseSpeed: -1.0,
    radiusIncreaseSpeed: -1.0,
    opacity: 0.8,
    opacityDecreaseSpeed: 3.2,
    color: new THREE.Color(0.05, 0.6, 0.9),
});

export const f22WingWakeCloudProperties: WakeCloudProperty[] = [
    createWakeCloudProperty({
    ...wingWakeCloudProperty,
    displacement: [10.78, -1.7, 12.4]
}),
    createWakeCloudProperty({
    ...wingWakeCloudProperty,
    displacement: [-10.78, -1.7, 12.4]
}),
]

export const f22EngineWakeCloudProperties: WakeCloudProperty[] = [
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        heightIncreaseSpeed: 0.5,
        displacement: [1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        heightIncreaseSpeed: 0.5,
        displacement: [-1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        heightIncreaseSpeed: 0.4,
        displacement: [1.03, -1.56, 19.3]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        heightIncreaseSpeed: 0.4,
        displacement: [-1.03, -1.56, 19.3]
    }),
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        initialRadius: 0.48,
        displacement: [1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        initialRadius: 0.48,
        displacement: [-1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        initialRadius: 0.38,
        displacement: [1.03, -1.56, 19.3]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        initialRadius: 0.38,
        displacement: [-1.03, -1.56, 19.3]
    }),
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        initialRadius: 0.46,
        displacement: [1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireBlueDecreaseWakeCloudProperty,
        initialRadius: 0.46,
        displacement: [-1.03, -1.56, 18.12]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        initialRadius: 0.36,
        displacement: [1.03, -1.56, 19.3]
    }),
    createWakeCloudProperty({
        ...fireYellowDecreaseWakeCloudProperty,
        initialRadius: 0.36,
        displacement: [-1.03, -1.56, 19.3]
    }),
]