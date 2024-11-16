// src/Core/Entity.ts

import * as THREE from 'three';
import { Game } from "../Game";
import { LoadingBar } from "../Utils/LoadingBar";
import { EntityConfigs, EntityName, EntityConfig } from '../Configs/EntityPaths';
import { EntityLoaders } from '../Configs/EntityLoaders';
import { Config } from '../Configs/Config';
import { Player } from "../Entities/Player";

export class Entity {
    public entityId: number;
    public assetsPath: string;
    public assetName: EntityName;
    public assetPath: string;
    public assetConfig: EntityConfig;
    public loadingBar: LoadingBar;
    public game: Game;
    public scene: THREE.Scene;

    public _model?: THREE.Group;
    public actions: Map<string, THREE.AnimationAction> = new Map();
    public mixer?: THREE.AnimationMixer;

    public ready: boolean = false;
    public removed: boolean = false;

    public tmpPos: THREE.Vector3;
    public tmpQua: THREE.Quaternion;

    public iFFNumber: number;

    constructor(game: Game, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        this.entityId = game.requestNewEntityId(this);
        this.assetsPath = Config.assetsPath;
        this.assetName = assetName;
        this.assetConfig = EntityConfigs[assetName];
        this.assetPath = this.assetConfig.path;
        this.loadingBar = game.loadingBar;

        this.game = game;
        this.scene = game.scene;

        this.tmpPos = pos ?? new THREE.Vector3();
        this.tmpQua = qua ?? new THREE.Quaternion();

        this.iFFNumber = iFFNumber ?? 0;

        this.load();
    }

    private load(): void {
        const loaderType = this.assetConfig.loaderType;
        const loaderFunction = EntityLoaders[loaderType];

        if (!loaderFunction) {
            console.error(`No loader function defined for loaderType: ${loaderType}`);
            return;
        }

        loaderFunction(
            this,
            () => {
                // onLoad callback
                this.ready = true;
                this.onLoad();
            },
            (xhr) => {
                // onProgress callback
                this.loadingBar.update(
                    `${this.assetsPath}${this.assetPath}`,
                    xhr.loaded,
                    xhr.total
                );
            },
            (err) => {
                // onError callback
                console.error(err);
            }
        );
    }

    protected onLoad(): void {
        // Can be overridden in subclasses for additional initialization
    }

    public getPosition(): THREE.Vector3 {
        if (this._model) {
            this.tmpPos = this._model.position.clone();
        }
        return this.tmpPos.clone();
    }

    public getQuaternion(): THREE.Quaternion {
        if (this._model) {
            this.tmpQua = this._model.quaternion.clone();
        }
        return this.tmpQua.clone();
    }

    public setPosition(position: THREE.Vector3): void {
        if (this._model) {
            this._model.position.copy(position);
        }
        this.tmpPos.copy(position);
    }

    public setQuaternion(quaternion: THREE.Quaternion): void {
        if (this._model) {
            this._model.quaternion.copy(quaternion);
        }
        this.tmpQua.copy(quaternion);
    }

    public addToScene(scene?: THREE.Scene): void {
        this.scene.add(this.model);
    }

    public update(deltaTime: number): void {
        if (!this.ready) return;
        // Update animations if mixer exists
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        // Override in subclasses for additional updates
    }

    public initializeSound(): void {
        // Placeholder
    }

    public getOwnerPlayer(): Player[] {
        // Override in subclasses if needed
        return [];
    }

    get model(): THREE.Group {
        if (!this._model) { throw Error('Entity not loaded'); }
        return this._model;
    }

    public dispose(): void {
        if (this.removed) return;
        this.game.entityMap.delete(this.entityId);
        if (this._model) {
            this.scene.remove(this._model);
        }

        // Dispose of the mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model);
            this.mixer = undefined;
        }

        this.removed = true;
        this.ready = false;
    }

    public getForwardDirection(from_camera: boolean = false): THREE.Vector3 {
        if (this instanceof Player && this.game.cameraManager && from_camera) {
            const camera = this.game.cameraManager.cameras.get(this as Player);
            if (camera) {
                return new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
            }
        }
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.getQuaternion()).normalize();
    }
}
