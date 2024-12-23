// src/Configs/KeyBound.ts

export interface InputAction {
    keyType: 'keyboard' | 'mouse' | 'wheel' | 'gamepad';
    keyName: string;
    triggerType: 'pressed' | 'down' | 'up' | 'scrolled';
}

export const KeyNames = [
    "increaseThrust",
    "decreaseThrust",
    "yawLeft",
    "yawRight",
    "pitchUp",
    "pitchDown",
    "rollLeft",
    "rollRight",
    "fireWeapon",
    "toggleViewMode",
    "reTarget",
    "selectWeapon1",
    "selectWeapon2",
    "selectWeapon3",
    "selectWeapon4",
] as const;

export type KeyBoundConfig = {
    [key in typeof KeyNames[number]]: InputAction;
};

export type OnlineInputState = {
    [key in typeof KeyNames[number]]: boolean;
};


export const KeyBoundConfigs: KeyBoundConfig[] = [
    {
        increaseThrust: { keyType: 'keyboard', keyName: 'capslock', triggerType: 'pressed' },
        decreaseThrust: { keyType: 'keyboard', keyName: 'shiftleft', triggerType: 'pressed' },
        yawLeft: { keyType: 'keyboard', keyName: 'keyq', triggerType: 'pressed' },
        yawRight: { keyType: 'keyboard', keyName: 'keye', triggerType: 'pressed' },
        pitchUp: { keyType: 'keyboard', keyName: 'keys', triggerType: 'pressed' },
        pitchDown: { keyType: 'keyboard', keyName: 'keyw', triggerType: 'pressed' },
        rollLeft: { keyType: 'keyboard', keyName: 'keya', triggerType: 'pressed' },
        rollRight: { keyType: 'keyboard', keyName: 'keyd', triggerType: 'pressed' },
        fireWeapon: { keyType: 'keyboard', keyName: 'space', triggerType: 'down' },
        toggleViewMode: { keyType: 'keyboard', keyName: 'keyv', triggerType: 'down' },
        reTarget: { keyType: 'keyboard', keyName: 'tab', triggerType: 'down' },
        // New weapon selection keys
        selectWeapon1: { keyType: 'keyboard', keyName: 'digit1', triggerType: 'down' },
        selectWeapon2: { keyType: 'keyboard', keyName: 'digit2', triggerType: 'down' },
        selectWeapon3: { keyType: 'keyboard', keyName: 'digit3', triggerType: 'down' },
        selectWeapon4: { keyType: 'keyboard', keyName: 'digit4', triggerType: 'down' },
    },
    {
        increaseThrust: { keyType: 'keyboard', keyName: 'backslash', triggerType: 'pressed' },
        decreaseThrust: { keyType: 'keyboard', keyName: 'enter', triggerType: 'pressed' },
        yawLeft: { keyType: 'keyboard', keyName: 'insert', triggerType: 'pressed' },
        yawRight: { keyType: 'keyboard', keyName: 'pageup', triggerType: 'pressed' },
        pitchUp: { keyType: 'keyboard', keyName: 'end', triggerType: 'pressed' },
        pitchDown: { keyType: 'keyboard', keyName: 'home', triggerType: 'pressed' },
        rollLeft: { keyType: 'keyboard', keyName: 'delete', triggerType: 'pressed' },
        rollRight: { keyType: 'keyboard', keyName: 'pagedown', triggerType: 'pressed' },
        fireWeapon: { keyType: 'keyboard', keyName: 'numpad0', triggerType: 'down' },
        toggleViewMode: { keyType: 'keyboard', keyName: 'numpaddecimal', triggerType: 'down' },
        reTarget: { keyType: 'keyboard', keyName: 'tab', triggerType: 'down' },
        // New weapon selection keys
        selectWeapon1: { keyType: 'keyboard', keyName: 'numpad1', triggerType: 'down' },
        selectWeapon2: { keyType: 'keyboard', keyName: 'numpad2', triggerType: 'down' },
        selectWeapon3: { keyType: 'keyboard', keyName: 'numpad3', triggerType: 'down' },
        selectWeapon4: { keyType: 'keyboard', keyName: 'numpad4', triggerType: 'down' },
    },
];


