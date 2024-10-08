// src/Enums/EntityPaths.ts

export const EntityPaths = {
    f22: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb',
    f22_stdm: 'fighter/lockheed-martin-f-22-raptor/test/texturing.glb'
    // Add other entities as needed
} as const;

export type EntityName = keyof typeof EntityPaths;
