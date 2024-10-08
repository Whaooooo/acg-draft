export abstract class Weapon {
    protected damage: number;
    protected range: number;

    constructor(damage: number, range: number) {
        this.damage = damage;
        this.range = range;
    }

    public abstract fire(): void;
}
