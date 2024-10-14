// src/Core/Entity.ts

import * as THREE from 'three';
import { Game } from "../Game";
import { LoadingBar } from "../Utils/LoadingBar";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EntityPaths, EntityName } from '../Enums/EntityPaths';

export class Entity {
    public assetsPath: string;
    public assetName: EntityName;
    public assetPath: string;
    public loadingBar: LoadingBar;
    public game: Game;
    public scene: THREE.Scene;

    public entity?: THREE.Group;
    public animations: Map<string, THREE.AnimationClip>;

    public ready: boolean = false;
    public removed: boolean = false;

    protected tmpPos: THREE.Vector3;
    protected tmpQua: THREE.Quaternion;

    public iFFNumber: number;
    public targets: Entity[];

    constructor(game: Game, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        this.assetsPath = game.assetsPath;
        this.assetName = assetName;
        this.assetPath = EntityPaths[assetName];
        this.loadingBar = game.loadingBar;

        this.game = game;
        this.scene = game.sceneManager.scene;

        this.animations = new Map<string, THREE.AnimationClip>();

        this.tmpPos = pos ? pos : new THREE.Vector3();
        this.tmpQua = qua ? qua : new THREE.Quaternion();

        this.iFFNumber = iFFNumber ? iFFNumber : 0;
        this.targets = [];

        this.load();
    }

    private load(): void {
        const pathParts = this.assetPath.split('/');
        const fileName = pathParts.pop();
        if (!fileName) {
            console.error(`Undefined fileName in ${this.assetPath}`);
            return;
        }
        const dir = pathParts.join('/');

        const loader = new GLTFLoader().setPath(`${this.assetsPath}${dir}/`);
        this.ready = false;

        // Load a glTF resource
        loader.load(
            // resource URL
            fileName,
            // called when the resource is loaded
            gltf => {
                this.entity = gltf.scene;
                this.entity.traverse(node => {
                    if (node.isObject3D) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                this.scene.add(gltf.scene);

                gltf.animations.forEach(animation => {
                    this.animations.set(animation.name.toLowerCase(), animation);
                });

                this.animations.forEach(pair => {
                    console.log(pair.name.toLowerCase());
                });

                this.entity.position.copy(this.tmpPos);
                this.entity.quaternion.copy(this.tmpQua);

                this.ready = true;
            },
            // called while loading is progressing
            xhr => {
                this.loadingBar.update(`${this.assetsPath}${this.assetPath}`, xhr.loaded, xhr.total);
            },
            // called when loading has errors
            err => {
                console.error(err);
            }
        );
    }

    public getPosition(): THREE.Vector3 {
        if (this.entity) {
            this.tmpPos = this.entity.position;
        }
        return this.tmpPos;
    }

    public getQuaternion(): THREE.Quaternion {
        if (this.entity) {
            this.tmpQua = this.entity.quaternion;
        }
        return this.tmpQua;
    }

    public setPosition(position: THREE.Vector3): void {
        if (this.entity) {
            this.entity.position.copy(position);
        }
        this.tmpPos.copy(position);
    }

    public setQuaternion(quaternion: THREE.Quaternion): void {
        if (this.entity) {
            this.entity.quaternion.copy(quaternion);
        }
        this.tmpQua.copy(quaternion);
    }

    public addToScene(scene?: THREE.Scene): void {
        if (!this.entity) return;
        if (!scene) {
            this.scene.add(this.entity);
        } else scene.add(this.entity);
    }

    public removeFromScene(scene?: THREE.Scene): void {
        this.removed = true;
        if (this.entity && scene) {
            scene.remove(this.entity);
            return;
        }
        if (this.entity && this.scene) {
            this.scene.remove(this.entity);
        }
    }

    public update(deltaTime: number): void {
        // Override in subclasses
    }
}
