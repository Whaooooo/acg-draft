// src/Configs/AnimationBound.ts
import { EntityName } from "./EntityPaths";
import * as THREE from "three";

export const FADE_DURATION_IN = 0.1;
export const FADE_DURATION_OUT = 0.1;

export interface Animation {
    name: string;
    loop: boolean;
    recoverAfterAnimationEnd: boolean;
    recoverAfterActiveEnd: boolean;
    fadeInDuration: number;
    fadeOutDuration: number;
}

export interface _Animation {
    name: string;
    loop?: boolean;
    recoverAfterAnimationEnd?: boolean;
    recoverAfterActiveEnd?: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
}

export function createAnimation(props: _Animation): Animation {
    return {
        loop: false,
        recoverAfterAnimationEnd: false,
        recoverAfterActiveEnd: true,
        fadeInDuration: FADE_DURATION_IN,
        fadeOutDuration: FADE_DURATION_OUT,
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
            createAnimation({ name: "rightvtcstabilizerright"}),
            createAnimation({ name: "leftvtcstabilizerright"})
        ],
        yawRight: [ // Right equivalent to yawSpeed is negative
            createAnimation({ name: "rightvtcstabilizerleft"}),
            createAnimation({ name: "leftvtcstabilizerleft"})
        ],
        pitchUp: [ // Up equivalent to pitchSpeed is positive
            createAnimation({ name: "righthrztstabilizerdown"}),
            createAnimation({ name: "lefthrztstabilizerdown"}),
            createAnimation({ name: "rightthrustpaddledown"}),
            createAnimation({ name: "leftthrustpaddledown"}),
            createAnimation({ name: "leftinelevonup"}),
            createAnimation({ name: "rightinelevonup"})
        ],
        pitchDown: [ // Down equivalent to pitchSpeed is negative
            createAnimation({ name: "righthrztstabilizerup"}),
            createAnimation({ name: "lefthrztstabilizerup"}),
            createAnimation({ name: "rightthrustpaddleup"}),
            createAnimation({ name: "leftthrustpaddleup"})
        ],
        rollLeft: [ // Left equivalent to rollSpeed is positive
            createAnimation({ name: "rightoutelevonup"}),
            createAnimation({ name: "leftoutelevondown"})
        ],
        rollRight: [ // Right equivalent to rollSpeed is negative
            createAnimation({ name: "leftoutelevonup"}),
            createAnimation({ name: "rightoutelevondown"})
        ],
        fireWeapon: [],
        openMagazine: [
            createAnimation({ name: "rightmagazineopen"}),
            createAnimation({ name: "leftmagazineopen"})
        ]

    }
};
