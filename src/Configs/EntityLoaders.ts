// src/Configs/EntityLoaders.ts

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '../Core/Entity';
import {TextureLoader} from "three";
import {texture} from "three/src/nodes/accessors/TextureNode";

export type LoaderFunction = (
    entity: Entity,
    onLoad: () => void,
    onProgress: (xhr: ProgressEvent<EventTarget>) => void,
    onError: (error: ErrorEvent) => void
) => void;

function applyMaterialSettings(material: THREE.Material | THREE.Material[]) {
    if (Array.isArray(material)) {
        material.forEach((mat) => applySettingsToMaterial(mat));
    } else {
        applySettingsToMaterial(material);
    }
}

function applySettingsToMaterial(mat: THREE.Material) {
    const materialWithDepth = mat as THREE.Material & {
        depthTest?: boolean;
        depthWrite?: boolean;
        polygonOffset?: boolean;
        polygonOffsetFactor?: number;
        polygonOffsetUnits?: number;
    };

    if (materialWithDepth.depthTest !== undefined) {
        materialWithDepth.depthTest = true;
    }

    if (materialWithDepth.depthWrite !== undefined) {
        materialWithDepth.depthWrite = true;
    }

    if (materialWithDepth.polygonOffset !== undefined) {
        materialWithDepth.polygonOffset = true;
        materialWithDepth.polygonOffsetFactor = 1;
        materialWithDepth.polygonOffsetUnits = 1;
    }
}

export const EntityLoaders: { [key: string]: LoaderFunction } = {
    minimal: (
        entity: Entity,
        onLoad: () => void,
        onProgress: (xhr: ProgressEvent<EventTarget>) => void,
        onError: (error: ErrorEvent) => void
    ): void => {
        onLoad();
    },

    texture: (
        entity: Entity,
        onLoad: () => void,
        onProgress: (xhr: ProgressEvent<EventTarget>) => void,
        onError: (error: ErrorEvent) => void
    ): void => {
        const pathParts = entity.assetPath.split('/');
        const fileName = pathParts.pop();
        if (!fileName) {
            console.error(`Undefined fileName in ${entity.assetPath}`);
            return;
        }
        const dir = pathParts.join('/');

        const loader = new TextureLoader().setPath(`${entity.assetsPath}${dir}/`);

        loader.load(
            fileName,
            (texture) => {
                // @ts-ignore
                entity.texture = texture;
                onLoad();
            },
            (xhr) => {
                onProgress(xhr);
            },
            (err) => {
                if (err instanceof ErrorEvent) {
                    onError(err);
                } else if (typeof err === 'string') {
                    onError(new ErrorEvent(err));
                } else {
                    onError(new ErrorEvent('An unknown error occurred during loading.'));
                }
            }
        );
    },

    gltf: (
        entity: Entity,
        onLoad: () => void,
        onProgress: (xhr: ProgressEvent<EventTarget>) => void,
        onError: (error: ErrorEvent) => void
    ): void => {
        const pathParts = entity.assetPath.split('/');
        const fileName = pathParts.pop();
        if (!fileName) {
            console.error(`Undefined fileName in ${entity.assetPath}`);
            return;
        }
        const dir = pathParts.join('/');

        const loader = new GLTFLoader().setPath(`${entity.assetsPath}${dir}/`);

        loader.load(
            fileName,
            (gltf) => {
                const model = gltf.scene;

                model.traverse((node) => {
                    if ((node as THREE.Mesh).isMesh) {
                        const mesh = node as THREE.Mesh;
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        mesh.geometry.computeBoundingBox();
                        mesh.geometry.computeBoundingSphere();

                        applyMaterialSettings(mesh.material);
                    }
                    if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
                        const skinnedMesh = node as THREE.SkinnedMesh;
                    }
                });

                entity._model = model;
                entity.scene.add(model);

                const armature = model.getObjectByName('Armature');
                if (armature) {
                    entity.mixer = new THREE.AnimationMixer(armature);
                } else {
                    entity.mixer = new THREE.AnimationMixer(model);
                }

                // Store animations
                gltf.animations.forEach((animation) => {
                    entity.actions.set(animation.name.toLowerCase(), entity.mixer!.clipAction(animation));
                });

                // Set position and orientation
                model.position.copy(entity.tmpPos);
                model.quaternion.copy(entity.tmpQua);

                onLoad();
            },
            (xhr) => {
                onProgress(xhr);
            },
            (err) => {
                if (err instanceof ErrorEvent) {
                    onError(err);
                } else if (typeof err === 'string') {
                    onError(new ErrorEvent(err));
                } else {
                    onError(new ErrorEvent('An unknown error occurred during loading.'));
                }
            }
        );
    },
};
