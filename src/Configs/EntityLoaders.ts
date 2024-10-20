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

function applyMaterialSettings(material: THREE.Material | THREE.Material[]) {
    if (Array.isArray(material)) {
        material.forEach((mat) => applySettingsToMaterial(mat));
    } else {
        applySettingsToMaterial(material);
    }
}

/**
 * Applies individual settings to a THREE.Material.
 * @param mat - A single THREE.Material.
 */
function applySettingsToMaterial(mat: THREE.Material) {
    // Ensure the material supports these properties
    // Most standard materials like MeshStandardMaterial, MeshBasicMaterial, etc., support these properties
    // If you're using custom materials, ensure they have these properties or handle accordingly

    // Type assertion to extend THREE.Material with possible properties
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
        materialWithDepth.polygonOffsetFactor = 1; // Adjust as needed
        materialWithDepth.polygonOffsetUnits = 1;  // Adjust as needed
    }

    // If you need to handle other properties, add them here similarly
}

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
                const model = gltf.scene;

                model.traverse((node) => {
                    if ((node as THREE.Mesh).isMesh) {
                        const mesh = node as THREE.Mesh;
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        // Compute bounding volumes
                        mesh.geometry.computeBoundingBox();
                        mesh.geometry.computeBoundingSphere();

                        // Apply material settings using the helper function
                        applyMaterialSettings(mesh.material);
                    }
                });

                entity._entity = model;
                entity.scene.add(model);

                // Store animations
                gltf.animations.forEach((animation) => {
                    entity.animations.set(animation.name.toLowerCase(), animation);
                });

                // Set position and orientation
                model.position.copy(entity.tmpPos);
                model.quaternion.copy(entity.tmpQua);

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
