// src/Managers/InputManager.ts

export class InputManager {
    private keysPressed: Set<string>;

    constructor() {
        this.keysPressed = new Set<string>();

        // Add event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.keysPressed.add(event.code);
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keysPressed.delete(event.code);
    }

    private onMouseDown(event: MouseEvent): void {
        // Handle mouse down events if needed
    }

    private onMouseUp(event: MouseEvent): void {
        // Handle mouse up events if needed
    }

    private onTouchStart(event: TouchEvent): void {
        // Handle touch start events if needed
    }

    private onTouchEnd(event: TouchEvent): void {
        // Handle touch end events if needed
    }

    public isKeyPressed(keyCode: string): boolean {
        return this.keysPressed.has(keyCode);
    }

    public dispose(): void {
        // Remove event listeners when no longer needed
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
}
