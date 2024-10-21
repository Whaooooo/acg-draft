// src/Configs/AnimationBound.ts
import { EntityName } from "./EntityPaths";

export interface Animation {
    name: string;
    loop: boolean;
    recover: boolean;
}

export interface PlaneAnimation {
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

export const AnimationBoundConfigs: {
    [key in EntityName]?: PlaneAnimation;
} = {
    f22: {
        increaseThrust: [],
        decreaseThrust: [],
        yawLeft: [
            { name: "RightVtcStabilizerRight", loop: false, recover: false },
            { name: "LeftVtcStabilizerRight", loop: false, recover: false }
        ],
        yawRight: [
            { name: "RightVtcStabilizerLeft", loop: false, recover: false },
            { name: "LeftVtcStabilizerLeft", loop: false, recover: false }
        ],
        pitchUp: [
            { name: "RightHrztStabilizerDown", loop: false, recover: false },
            { name: "LeftHrztStabilizerDown", loop: false, recover: false },
            { name: "RightThrustPaddleDown", loop: false, recover: false },
            { name: "LeftThrustPaddleDown", loop: false, recover: false }
        ],
        pitchDown: [
            { name: "RightHrztStabilizerUp", loop: false, recover: false },
            { name: "LeftHrztStabilizerUp", loop: false, recover: false },
            { name: "RightThrustPaddleUp", loop: false, recover: false },
            { name: "LeftThrustPaddleUp", loop: false, recover: false }
        ],
        rollLeft: [
            { name: "RightOutElevonUp", loop: false, recover: false },
            { name: "RightInElevonUp", loop: false, recover: false },
            { name: "LeftOutElevonDown", loop: false, recover: false },
            { name: "LeftInElevonDown", loop: false, recover: false }
        ],
        rollRight: [
            { name: "LeftOutElevonUp", loop: false, recover: false },
            { name: "LeftInElevonUp", loop: false, recover: false },
            { name: "RightOutElevonDown", loop: false, recover: false },
            { name: "RightInElevonDown", loop: false, recover: false }
        ],
        fireWeapon: [],
        openMagazine: [
            { name: "RightMagazineOpen", loop: false, recover: false },
            { name: "LeftMagazineOpen", loop: false, recover: false }
        ]
    }
};
