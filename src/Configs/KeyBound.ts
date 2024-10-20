// src/Configs/KeyBound.ts

export interface KeyBoundConfig {
    increaseThrust: string;
    decreaseThrust: string;
    yawLeft: string;
    yawRight: string;
    pitchUp: string;
    pitchDown: string;
    rollLeft: string;
    rollRight: string;
    fireWeapon: string;
    toggleViewMode: string;
    reTarget: string;
    useNumpadForWeaponSelection: boolean;
}

export const KeyBoundConfigs: KeyBoundConfig[] = [
    {
        increaseThrust: 'capslock',
        decreaseThrust: 'shiftleft',
        yawLeft: 'keyq',
        yawRight: 'keye',
        pitchUp: 'keys',
        pitchDown: 'keyw',
        rollLeft: 'keya',
        rollRight: 'keyd',
        fireWeapon: 'space',
        toggleViewMode: 'keyv',
        reTarget: 'tab',
        useNumpadForWeaponSelection: false,
    },
    {
        increaseThrust: 'backslash',                 // 加速键为 Enter
        decreaseThrust: 'enter',             // 减速键为 '\'
        yawLeft: 'insert',                       // 偏航左：Insert 键
        yawRight: 'pageup',                      // 偏航右：Delete 键
        pitchUp: 'end',                         // 俯仰上：Home 键
        pitchDown: 'home',                        // 俯仰下：End 键
        rollLeft: 'delete',                      // 滚转左：Page Up 键
        rollRight: 'pagedown',                   // 滚转右：Page Down 键
        fireWeapon: 'numpad0',                   // 开火：小键盘 0
        toggleViewMode: 'numpaddecimal',         // 视角切换：小键盘 .
        reTarget: 'tab',                         // 重选目标键为 Tab
        useNumpadForWeaponSelection: true,       // 使用小键盘切换武器
    },
];
