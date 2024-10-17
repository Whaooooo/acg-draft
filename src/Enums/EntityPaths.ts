// src/Enums/EntityPaths.ts

export interface EntityConfig {
    path: string;
    loaderType: 'gltf' | 'minimal' | string;
    // Add other configuration options as needed
}

export const EntityConfigs = {
    f22: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb',
        loaderType: 'gltf',
    },
    f22_stdm: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb',
        loaderType: 'gltf',
    },
    plane: {
        path: 'plane/microplane.glb',
        loaderType: 'gltf',
    },
    plane_stdm: {
        path: 'plane/microplane.glb',
        loaderType: 'gltf',
    },
    // Add other entities as needed
} as const;

export type EntityName = keyof typeof EntityConfigs;
