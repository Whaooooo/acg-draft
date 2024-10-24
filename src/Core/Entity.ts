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
    public targets: Entity[];

    constructor(game: Game, entityId: number, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        this.entityId = entityId;
        this.assetsPath = Config.assetsPath;
        this.assetName = assetName;
        this.assetConfig = EntityConfigs[assetName];
        this.assetPath = this.assetConfig.path;
        this.loadingBar = game.loadingBar;

        this.game = game;
        this.scene = game.scene;

        this.tmpPos = pos ? pos : new THREE.Vector3();
        this.tmpQua = qua ? qua : new THREE.Quaternion();

        this.iFFNumber = iFFNumber ? iFFNumber : 0;
        this.targets = [];

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
            this.tmpPos = this._model.position;
        }
        return this.tmpPos;
    }

    public getQuaternion(): THREE.Quaternion {
        if (this._model) {
            this.tmpQua = this._model.quaternion;
        }
        return this.tmpQua;
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

    public dispose(): void {
        if (this.removed) return;
        this.game.entityIdSet.delete(this.entityId);
        this.scene.remove(this.model);
        this.removed = true;

        // Dispose of the mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model);
            this.mixer = undefined;
        }
    }

    public update(deltaTime: number): void {
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
}
