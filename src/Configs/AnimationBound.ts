// src/Configs/AnimationBound.ts
import { EntityName } from "./EntityPaths";
import * as THREE from "three";

export interface Animation {
    name: string;
    loop: boolean;
    recoverAfterAnimationEnd: boolean;
    recoverAfterActiveEnd: boolean;
}

export interface _Animation {
    name: string;
    loop?: boolean;
    recoverAfterAnimationEnd?: boolean;
    recoverAfterActiveEnd?: boolean;
}

export function createAnimation(props: _Animation): Animation {
    return {
        loop: false,
        recoverAfterAnimationEnd: false,
        recoverAfterActiveEnd: true,
        ...props, // Overwrite defaults with provided values
    };
}

export interface PlaneAnimationBoundConfig {
    increaseThrust: Animation[];
    decreaseThrust: Animation[];
    yawLeft: Animation[];
    yawRight: Animation[];
    pitchUp: Animation[];
    pitchDown: Animation[];
    rollLeft: Animation[];
    rollRight: Animation[];
    fireWeapon: Animation[];
    openMagazine: Animation[];
}

export function initializeEmptyPlaneAnimationBoundConfig(): PlaneAnimationBoundConfig {
    return {
        increaseThrust: [],
        decreaseThrust: [],
        yawLeft: [],
        yawRight: [],
        pitchUp: [],
        pitchDown: [],
        rollLeft: [],
        rollRight: [],
        fireWeapon: [],
        openMagazine: [],
    };
}

export const PlaneAnimationBoundConfigs: {
    [key in EntityName]?: PlaneAnimationBoundConfig;
} = {
    f22: {
        increaseThrust: [],
        decreaseThrust: [],
        yawLeft: [ // Left equivalent to yawSpeed is positive
            createAnimation({ name: "RightVtcStabilizerRight"}),
            createAnimation({ name: "LeftVtcStabilizerRight"})
        ],
        yawRight: [ // Right equivalent to yawSpeed is negative
            createAnimation({ name: "RightVtcStabilizerLeft"}),
            createAnimation({ name: "LeftVtcStabilizerLeft"})
        ],
        pitchUp: [ // Up equivalent to pitchSpeed is positive
            createAnimation({ name: "RightHrztStabilizerDown"}),
            createAnimation({ name: "LeftHrztStabilizerDown"}),
            createAnimation({ name: "RightThrustPaddleDown"}),
            createAnimation({ name: "LeftThrustPaddleDown"})
        ],
        pitchDown: [ // Down equivalent to pitchSpeed is negative
            createAnimation({  name: "RightHrztStabilizerUp"}),
            createAnimation({ name: "LeftHrztStabilizerUp"}),
            createAnimation({ name: "RightThrustPaddleUp"}),
            createAnimation({ name: "LeftThrustPaddleUp"})
        ],
        rollLeft: [ // Left equivalent to rollSpeed is positive
            createAnimation({ name: "RightOutElevonUp"}),
            createAnimation({ name: "LeftOutElevonDown"}),
        ],
        rollRight: [ // Right equivalent to rollSpeed is negative
            createAnimation({ name: "LeftOutElevonUp"}),
            createAnimation({ name: "RightOutElevonDown"}),
        ],
        fireWeapon: [],
        openMagazine: [
            createAnimation({ name: "RightMagazineOpen"}),
            createAnimation({ name: "LeftMagazineOpen"})
        ]
    }
};
