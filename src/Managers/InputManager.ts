// src/Managers/InputManager.ts

import { InputAction } from "../Configs/KeyBound";
import { Player } from "../Entities/Player";

export class InputState {
    private keysPressed: { [key: string]: boolean } = {};
    private keysDown: { [key: string]: boolean } = {};
    private mouseButtonsPressed: { [button: string]: boolean } = {};
    private mouseButtonsDown: { [button: string]: boolean } = {};
    public mouseDeltaX: number = 0;
    public mouseDeltaY: number = 0;
    public wheelDelta: number = 0;

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

        return false;
    }

    public resetMouseMovement(): void {
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
    }

    public resetWheelDelta(): void {
        this.wheelDelta = 0;
    }

    // Expose methods to update the input state
    public setKeyPressed(key: string, pressed: boolean): void {
        if (pressed) {
            if (!this.keysPressed[key]) {
                this.keysDown[key] = true;
            }
            this.keysPressed[key] = true;
        } else {
            this.keysPressed[key] = false;
        }
    }

    public setMouseButtonPressed(button: string, pressed: boolean): void {
        if (pressed) {
            if (!this.mouseButtonsPressed[button]) {
                this.mouseButtonsDown[button] = true;
            }
            this.mouseButtonsPressed[button] = true;
        } else {
            this.mouseButtonsPressed[button] = false;
        }
    }

    public addMouseMovement(deltaX: number, deltaY: number): void {
        this.mouseDeltaX += deltaX;
        this.mouseDeltaY += deltaY;
    }

    public addWheelDelta(delta: number): void {
        this.wheelDelta += delta;
    }

    public serialize(): any {
        return {
            keysPressed: this.keysPressed,
            keysDown: this.keysDown,
            mouseButtonsPressed: this.mouseButtonsPressed,
            mouseButtonsDown: this.mouseButtonsDown,
            mouseDeltaX: this.mouseDeltaX,
            mouseDeltaY: this.mouseDeltaY,
            wheelDelta: this.wheelDelta,
        };
    }

    public deserialize(data: any): void {
        this.keysPressed = data.keysPressed;
        this.keysDown = data.keysDown;
        this.mouseButtonsPressed = data.mouseButtonsPressed;
        this.mouseButtonsDown = data.mouseButtonsDown;
        this.mouseDeltaX = data.mouseDeltaX;
        this.mouseDeltaY = data.mouseDeltaY;
        this.wheelDelta = data.wheelDelta;
    }

    public resetState(): void {
        this.keysDown = {};
        this.mouseButtonsDown = {};
        this.resetMouseMovement();
        this.resetWheelDelta();
    }
}

export class InputManager {
    private players: Set<Player> = new Set();
    private pointerLocked: boolean = false;

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
    }

    public registerPlayer(player: Player): void {
        this.players.add(player);
        if (this.players.size === 1) {
            // First local player added, initialize event listeners
            this.initEventListeners();
        }
    }

    public unregisterPlayer(player: Player): void {
        this.players.delete(player);
        if (this.players.size === 0) {
            // No more local players, remove event listeners
            this.removeEventListeners();
        }
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
    }

    private removeEventListeners(): void {
        window.removeEventListener('keydown', this.boundPreventBrowserShortcuts, true);
        window.removeEventListener('keydown', this.boundOnKeyDown, false);
        window.removeEventListener('keyup', this.boundOnKeyUp, false);
        window.removeEventListener('mousedown', this.boundOnMouseDown, false);
        window.removeEventListener('mouseup', this.boundOnMouseUp, false);
        window.removeEventListener('mousemove', this.boundOnMouseMove, false);
        window.removeEventListener('wheel', this.boundOnWheel, false);
        document.removeEventListener('pointerlockchange', this.boundOnPointerLockChange, false);
        window.removeEventListener('contextmenu', this.boundContextMenuHandler, false);
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

        this.players.forEach(player => {
            const inputState = player.getInputState();
            inputState.setKeyPressed(key, true);
        });
    }

    private onKeyUp(event: KeyboardEvent): void {
        const key = event.code.toLowerCase();

        this.players.forEach(player => {
            const inputState = player.getInputState();
            inputState.setKeyPressed(key, false);
        });
    }

    private onMouseDown(event: MouseEvent): void {
        const button = `mousebutton${event.button}`;

        this.players.forEach(player => {
            const inputState = player.getInputState();
            inputState.setMouseButtonPressed(button, true);
        });

        // Request pointer lock
        const element = document.body;
        if (!this.pointerLocked) {
            element.requestPointerLock();
        }
    }

    private onMouseUp(event: MouseEvent): void {
        const button = `mousebutton${event.button}`;

        this.players.forEach(player => {
            const inputState = player.getInputState();
            inputState.setMouseButtonPressed(button, false);
        });
    }

    private onPointerLockChange(): void {
        const element = document.body;
        this.pointerLocked = document.pointerLockElement === element;
    }

    private onMouseMove(event: MouseEvent): void {
        if (true) {
            this.players.forEach(player => {
                console.log('update mouse move')
                const inputState = player.getInputState();
                inputState.addMouseMovement(event.movementX, event.movementY);
            });
        }
    }

    private onWheel(event: WheelEvent): void {
        const delta = event.deltaY < 0 ? 1 : -1;

        this.players.forEach(player => {
            const inputState = player.getInputState();
            inputState.addWheelDelta(delta);
        });

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

    public releasePointerLock(): void {
        if (this.pointerLocked) {
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
            this.pointerLocked = false;
        }
    }

    public dispose(): void {
        this.removeEventListeners();
        this.players.clear();
    }
}
