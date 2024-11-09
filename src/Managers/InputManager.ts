// src/Managers/InputManager.ts

import { InputAction } from "../Configs/KeyBound";

export class InputManager {
    private keysPressed: { [key: string]: boolean } = {};
    private keysDown: { [key: string]: boolean } = {};
    private mouseButtonsPressed: { [button: string]: boolean } = {};
    private mouseButtonsDown: { [button: string]: boolean } = {};
    public mouseDeltaX: number = 0;
    public mouseDeltaY: number = 0;
    public pointerLocked: boolean = false;
    private wheelDelta: number = 0;

    // Gamepad properties
    private gamepads: (Gamepad | null)[] = [];
    public joystickAxes: number[] = []; // To store axes values

    // Bound event handlers
    private boundPreventBrowserShortcuts: (event: KeyboardEvent) => void;
    private boundOnKeyDown: (event: KeyboardEvent) => void;
    private boundOnKeyUp: (event: KeyboardEvent) => void;
    private boundOnMouseDown: (event: MouseEvent) => void;
    private boundOnMouseUp: (event: MouseEvent) => void;
    private boundOnMouseMove: (event: MouseEvent) => void;
    private boundOnWheel: (event: WheelEvent) => void;
    private boundOnPointerLockChange: (event: Event) => void;
    private boundContextMenuHandler: (event: MouseEvent) => void;

    // Gamepad event handlers
    private boundOnGamepadConnected: (event: GamepadEvent) => void;
    private boundOnGamepadDisconnected: (event: GamepadEvent) => void;

    constructor() {
        // Bind event handlers
        this.boundPreventBrowserShortcuts = this.preventBrowserShortcuts.bind(this);
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        this.boundOnKeyUp = this.onKeyUp.bind(this);
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnWheel = this.onWheel.bind(this);
        this.boundOnPointerLockChange = this.onPointerLockChange.bind(this);
        this.boundContextMenuHandler = this.contextMenuHandler.bind(this);

        // Gamepad event handlers
        this.boundOnGamepadConnected = this.onGamepadConnected.bind(this);
        this.boundOnGamepadDisconnected = this.onGamepadDisconnected.bind(this);

        this.initEventListeners();
    }

    private initEventListeners(): void {
        // Use capture phase to prevent default browser shortcuts
        window.addEventListener('keydown', this.boundPreventBrowserShortcuts, true);
        window.addEventListener('keydown', this.boundOnKeyDown, false);
        window.addEventListener('keyup', this.boundOnKeyUp, false);
        window.addEventListener('mousedown', this.boundOnMouseDown, false);
        window.addEventListener('mouseup', this.boundOnMouseUp, false);
        window.addEventListener('mousemove', this.boundOnMouseMove, false);
        window.addEventListener('wheel', this.boundOnWheel, { passive: false });
        document.addEventListener('pointerlockchange', this.boundOnPointerLockChange, false);

        // Prevent right-click context menu
        window.addEventListener('contextmenu', this.boundContextMenuHandler, false);

        // Gamepad event listeners
        window.addEventListener('gamepadconnected', this.boundOnGamepadConnected, false);
        window.addEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected, false);
    }

    private contextMenuHandler(event: MouseEvent): void {
        if (this.pointerLocked) {
            event.preventDefault();
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        const key = event.code.toLowerCase();

        if (this.pointerLocked) {
            event.preventDefault();
        }

        if (!this.keysPressed[key]) {
            this.keysDown[key] = true;
        }
        this.keysPressed[key] = true;
    }

    private onKeyUp(event: KeyboardEvent): void {
        const key = event.code.toLowerCase();
        this.keysPressed[key] = false;
    }

    private onMouseDown(event: MouseEvent): void {
        const button = `mousebutton${event.button}`;
        if (!this.mouseButtonsPressed[button]) {
            this.mouseButtonsDown[button] = true;
        }
        this.mouseButtonsPressed[button] = true;

        // Request pointer lock
        const element = document.body;
        if (!this.pointerLocked) {
            element.requestPointerLock();
        }
    }

    private onMouseUp(event: MouseEvent): void {
        const button = `mousebutton${event.button}`;
        this.mouseButtonsPressed[button] = false;
    }

    private onPointerLockChange(): void {
        const element = document.body;
        this.pointerLocked = document.pointerLockElement === element;
    }

    private onMouseMove(event: MouseEvent): void {
        if (this.pointerLocked) {
            this.mouseDeltaX += event.movementX;
            this.mouseDeltaY += event.movementY;
        }
    }

    private onWheel(event: WheelEvent): void {
        if (event.deltaY < 0) {
            this.wheelDelta += 1; // Scrolled up
        } else if (event.deltaY > 0) {
            this.wheelDelta -= 1; // Scrolled down
        }
        if (this.pointerLocked) {
            event.preventDefault();
        }
    }

    private preventBrowserShortcuts(event: KeyboardEvent): void {
        if (this.pointerLocked) {
            if (event.key === 'Escape') {
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
                event.preventDefault();
                return;
            }
        }
    }

    // Gamepad event handlers
    private onGamepadConnected(event: GamepadEvent): void {
        const gamepad = event.gamepad;
        console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.',
            gamepad.index, gamepad.id,
            gamepad.buttons.length, gamepad.axes.length);
        this.gamepads[gamepad.index] = gamepad;
    }

    private onGamepadDisconnected(event: GamepadEvent): void {
        const gamepad = event.gamepad;
        console.log('Gamepad disconnected from index %d: %s',
            gamepad.index, gamepad.id);
        this.gamepads[gamepad.index] = null;
    }

    // Call this method each frame to update the gamepad state
    public updateGamepadState(): void {
        const connectedGamepads = navigator.getGamepads ? navigator.getGamepads() : [];

        // For simplicity, use the first connected gamepad
        const gamepad = connectedGamepads[0];

        if (gamepad) {
            this.joystickAxes = gamepad.axes.slice(); // Copy axes values

            // You can also handle gamepad buttons if needed
            // For example, to handle button presses
            // this.gamepadButtonsPressed = gamepad.buttons.map(button => button.pressed);
        } else {
            this.joystickAxes = []; // No gamepad connected
        }
    }

    // Method to get specific joystick axis value
    public getJoystickAxis(axisIndex: number): number {
        if (this.joystickAxes && axisIndex >= 0 && axisIndex < this.joystickAxes.length) {
            return this.joystickAxes[axisIndex];
        }
        return 0;
    }

    // Modify checkInput to handle gamepad buttons if needed
    public checkInput(action: InputAction): boolean {
        const keyType = action.keyType.toLowerCase();
        const keyName = action.keyName.toLowerCase();
        const triggerType = action.triggerType.toLowerCase();

        if (keyType === 'keyboard') {
            if (triggerType === 'pressed') {
                return this.keysPressed[keyName] || false;
            } else if (triggerType === 'down') {
                if (this.keysDown[keyName]) {
                    this.keysDown[keyName] = false;
                    return true;
                }
                return false;
            }
        } else if (keyType === 'mouse') {
            const button = `mousebutton${keyName}`;
            if (triggerType === 'pressed') {
                return this.mouseButtonsPressed[button] || false;
            } else if (triggerType === 'down') {
                if (this.mouseButtonsDown[button]) {
                    this.mouseButtonsDown[button] = false;
                    return true;
                }
                return false;
            }
        } else if (keyType === 'wheel') {
            if (triggerType === 'scrolled') {
                if (keyName === 'up' && this.wheelDelta > 0) {
                    this.wheelDelta = 0;
                    return true;
                } else if (keyName === 'down' && this.wheelDelta < 0) {
                    this.wheelDelta = 0;
                    return true;
                }
            }
        }
        // You can add gamepad button handling here if needed

        return false;
    }

    public getMouseMovement(): { deltaX: number; deltaY: number } {
        const delta = { deltaX: this.mouseDeltaX, deltaY: this.mouseDeltaY };
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        return delta;
    }

    public getWheelDelta(): number {
        const delta = this.wheelDelta;
        this.wheelDelta = 0;
        return delta;
    }

    public dispose(): void {
        // Remove event listeners
        window.removeEventListener('keydown', this.boundPreventBrowserShortcuts, true);
        window.removeEventListener('keydown', this.boundOnKeyDown, false);
        window.removeEventListener('keyup', this.boundOnKeyUp, false);
        window.removeEventListener('mousedown', this.boundOnMouseDown, false);
        window.removeEventListener('mouseup', this.boundOnMouseUp, false);
        window.removeEventListener('mousemove', this.boundOnMouseMove, false);
        window.removeEventListener('wheel', this.boundOnWheel, false);
        document.removeEventListener('pointerlockchange', this.boundOnPointerLockChange, false);
        window.removeEventListener('contextmenu', this.boundContextMenuHandler, false);

        // Gamepad event listeners
        window.removeEventListener('gamepadconnected', this.boundOnGamepadConnected, false);
        window.removeEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected, false);

        // Release pointer lock if it's still active
        if (this.pointerLocked) {
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
            this.pointerLocked = false;
        }

        // Reset internal state
        this.keysPressed = {};
        this.keysDown = {};
        this.mouseButtonsPressed = {};
        this.mouseButtonsDown = {};
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.wheelDelta = 0;
        this.joystickAxes = [];
        this.gamepads = [];
    }

    public releasePointerLock(): void {
        if (this.pointerLocked) {
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
            this.pointerLocked = false;
        }
    }
}
