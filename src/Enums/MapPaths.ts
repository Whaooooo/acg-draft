// src/Enums/MapPaths.ts

export const MapPaths = {
    paintedsky: 'plane/paintedsky', // Folder containing skybox images
    // You can add more maps or skyboxes here
} as const;

export type MapName = keyof typeof MapPaths;
