import * as THREE from "three";
import { Entity} from "../Core/Entity";

export class SceneManager {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public addEntity(entity: Entity): void {
        entity.addToScene(this.scene);
    }

    public removeEntity(entity: Entity): void {
        entity.removeFromScene(this.scene);
    }
}
