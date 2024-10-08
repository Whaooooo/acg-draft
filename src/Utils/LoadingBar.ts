// src/Utils/LoadingBar.ts

export class LoadingBar {
    private itemsLoaded: number = 0;
    private itemsTotal: number = 0;
    private onLoadCompleteCallback: (() => void) | null = null;

    public update(item: string, loaded: number, total: number): void {
        this.itemsLoaded += loaded;
        this.itemsTotal += total;

        const progress = (this.itemsLoaded / this.itemsTotal) * 100;
        console.log(`Loading ${item}: ${progress.toFixed(2)}%`);

        if (this.itemsLoaded === this.itemsTotal && this.onLoadCompleteCallback) {
            this.onLoadCompleteCallback();
        }
    }

    public onLoadComplete(callback: () => void): void {
        this.onLoadCompleteCallback = callback;
    }
}
