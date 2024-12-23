// src/Configs/EntityPaths.ts

export interface EntityConfig {
    path: string;
    loaderType: 'gltf' | 'minimal' | 'texture';
    children: readonly string[];
    // Add other configuration options as needed
}

export const EntityConfigs = {
    f22: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb',
        loaderType: 'gltf',
        children: ['stdm', '6aam', 'laam', 'qaam'],
    },
    npc_f22: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb',
        loaderType: 'gltf',
        children: ['stdm'],
    },
    f22_stdm: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    npc_f22_stdm: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    f22_6aam: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    f22_laam: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    f22_qaam: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    npc_plane: {
        path: 'plane/plane.glb',
        loaderType: 'gltf',
        children: ['stdm',],
    },
    npc_plane_stdm: {
        path: 'fighter/lockheed-martin-f-22-raptor/test/stdm.glb',
        loaderType: 'gltf',
        children: [],
    },
    explosion: {
        path: 'plane/explosion.png',
        loaderType: 'texture',
        children: [],
    },
    wakecloud: {
        path: 'plane/explosion.png',
        loaderType: 'minimal',
        children: [],
    }
    // Add other entities as needed
} as const;

export type EntityName = keyof typeof EntityConfigs;

/**
 * Generates an EntityName by combining the plane name and weapon name.
 * @param planeName - The base name of the plane (e.g., 'xyz').
 * @param weaponName - The weapon name to append (e.g., 'abc').
 * @returns The combined EntityName if it exists in EntityConfigs, otherwise undefined.
 */
export function getEntityName(planeName: string, weaponName?: string): EntityName | undefined {
    const baseName = planeName.toLowerCase();
    let entityName: string;

    if (weaponName) {
        const weaponSuffix = weaponName.toLowerCase();
        entityName = `${baseName}_${weaponSuffix}`;
    } else {
        entityName = baseName;
    }

    if (entityName in EntityConfigs) {
        return entityName as EntityName;
    } else {
        console.warn(`EntityName "${entityName}" not found in EntityConfigs.`);
        return undefined;
    }
}
