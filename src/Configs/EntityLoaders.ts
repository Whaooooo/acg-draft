// src/Configs/EntityLoaders.ts

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '../Core/Entity';

export type LoaderFunction = (
    entity: Entity,
    onLoad: () => void,
    onProgress: (xhr: ProgressEvent<EventTarget>) => void,
    onError: (error: ErrorEvent) => void
) => void;

export const EntityLoaders: { [key: string]: LoaderFunction } = {
    minimal: (
        entity: Entity,
        onLoad: () => void,
        onProgress: (xhr: ProgressEvent<EventTarget>) => void,
        onError: (error: ErrorEvent) => void
    ): void => {
        // Minimal load function: create a simple box geometry
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        entity._entity = new THREE.Group();
        entity._entity.add(mesh);
        entity._entity.position.copy(entity.tmpPos);
        entity._entity.quaternion.copy(entity.tmpQua);
        entity.scene.add(entity._entity);
        onLoad();
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

        // Load a glTF resource
        loader.load(
            // Resource URL
            fileName,
            // Called when the resource is loaded
            (gltf) => {
                entity._entity = gltf.scene;
                entity._entity.traverse((node) => {
                    if ((node as THREE.Mesh).isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        const mesh = node as THREE.Mesh;
                        mesh.geometry.computeBoundingBox();
                        mesh.geometry.computeBoundingSphere();
                    }
                });
                entity.scene.add(gltf.scene);

                gltf.animations.forEach((animation) => {
                    entity.animations.set(animation.name.toLowerCase(), animation);
                });

                entity._entity.position.copy(entity.tmpPos);
                entity._entity.quaternion.copy(entity.tmpQua);

                onLoad();
            },
            // Called while loading is progressing
            (xhr) => {
                onProgress(xhr);
            },
            // Called when loading has errors
            (err) => {
                // Handle different error types
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
