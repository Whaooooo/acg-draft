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

    constructor() {
        this.initEventListeners();
    }

    private initEventListeners(): void {
        // Use capture phase to prevent default browser shortcuts
        window.addEventListener('keydown', (event) => this.preventBrowserShortcuts(event), true);
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);

        // Prevent right-click context menu
        window.addEventListener('contextmenu', (event) => {
            if (this.pointerLocked) {
                event.preventDefault();
            }
        }, false);
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
}


