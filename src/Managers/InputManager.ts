// src/Managers/InputManager.ts

export class InputManager {
    private keysPressed: { [key: string]: boolean } = {};
    private keysDown: { [key: string]: boolean } = {};
    public mouseDeltaX: number = 0;
    public mouseDeltaY: number = 0;
    public pointerLocked: boolean = false;
    private wheelDelta: number = 0;

    constructor() {
        this.initEventListeners();
    }

    private initEventListeners(): void {
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
    }

    private onKeyDown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        if (!this.keysPressed[key]) {
            // Key was not pressed before, so it's a key down event
            this.keysDown[key] = true;
        }
        this.keysPressed[key] = true;
    }

    private onKeyUp(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        this.keysPressed[key] = false;
    }

    private onMouseDown(event: MouseEvent): void {
        // Request pointer lock
        const element = document.body;
        if (!this.pointerLocked) {
            element.requestPointerLock();
        }
    }

    private onPointerLockChange(): void {
        const element = document.body;
        if (document.pointerLockElement === element) {
            this.pointerLocked = true;
        } else {
            this.pointerLocked = false;
        }
    }

    private onMouseMove(event: MouseEvent): void {
        if (this.pointerLocked) {
            this.mouseDeltaX += event.movementX;
            this.mouseDeltaY += event.movementY;
        }
    }

    private onWheel(event: WheelEvent): void {
        // Normalize the wheel delta to -1, 0, or 1
        if (event.deltaY < 0) {
            this.wheelDelta += 1; // Scrolled up
        } else if (event.deltaY > 0) {
            this.wheelDelta -= 1; // Scrolled down
        }
        // Prevent the default scrolling behavior
        event.preventDefault();
    }

    public isKeyPressed(key: string): boolean {
        return this.keysPressed[key.toLowerCase()] || false;
    }

    public isKeyDown(key: string): boolean {
        key = key.toLowerCase();
        if (this.keysDown[key]) {
            this.keysDown[key] = false; // Reset the flag after reading
            return true;
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
