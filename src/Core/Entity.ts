// src/Core/Entity.ts

import * as THREE from 'three';
import { Game } from "../Game";
import { LoadingBar } from "../Utils/LoadingBar";
import { EntityConfigs, EntityName, EntityConfig } from '../Configs/EntityPaths';
import { EntityLoaders } from '../Configs/EntityLoaders';

export class Entity {
    public assetsPath: string;
    public assetName: EntityName;
    public assetPath: string;
    public assetConfig: EntityConfig;
    public loadingBar: LoadingBar;
    public game: Game;
    public scene: THREE.Scene;

    public _entity?: THREE.Group;
    public animations: Map<string, THREE.AnimationClip>;

    public ready: boolean = false;
    public removed: boolean = false;

    public tmpPos: THREE.Vector3;
    public tmpQua: THREE.Quaternion;

    public iFFNumber: number;
    public targets: Entity[];

    constructor(game: Game, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        this.assetsPath = game.assetsPath;
        this.assetName = assetName;
        this.assetConfig = EntityConfigs[assetName];
        this.assetPath = this.assetConfig.path;
        this.loadingBar = game.loadingBar;

        this.game = game;
        this.scene = game.scene;

        this.animations = new Map<string, THREE.AnimationClip>();

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

    public getPosition(): THREE.Vector3 {
        if (this._entity) {
            this.tmpPos = this._entity.position;
        }
        return this.tmpPos;
    }

    public getQuaternion(): THREE.Quaternion {
        if (this._entity) {
            this.tmpQua = this._entity.quaternion;
        }
        return this.tmpQua;
    }

    public setPosition(position: THREE.Vector3): void {
        if (this._entity) {
            this._entity.position.copy(position);
        }
        this.tmpPos.copy(position);
    }

    public setQuaternion(quaternion: THREE.Quaternion): void {
        if (this._entity) {
            this._entity.quaternion.copy(quaternion);
        }
        this.tmpQua.copy(quaternion);
    }

    public addToScene(scene?: THREE.Scene): void {
        this.scene.add(this.entity);
    }

    public removeFromScene(): void {
        if (this.removed) return;
        this.removed = true;
        this.scene.remove(this.entity);
    }

    public update(deltaTime: number): void {
        // Override in subclasses
    }

    get entity(): THREE.Group {
        if (!this._entity) {throw Error()}
        return this._entity;
    }
}
