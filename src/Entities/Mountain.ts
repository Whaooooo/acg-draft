import * as THREE from 'three';
import { ImprovedNoise } from '../Utils/ImprovedNoise';

class Mountain extends THREE.Group {
    isMountain = true;
    chunkList: THREE.Mesh[][][] = [];

    constructor(worldWidth = 2048, worldDepth = 2048) {
        super();

        const data = this.generateHeight(worldWidth + 1, worldDepth + 1);
        const geometry = new THREE.PlaneGeometry(35000, 35000, worldWidth, worldDepth);
        geometry.rotateX(- Math.PI / 2);

        const vertices = geometry.attributes.position.array;

        for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
            vertices[j + 1] = data[i] * 20 - 2000;
        }

        const texture = new THREE.CanvasTexture(this.generateTexture(data, worldWidth, worldDepth));
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ map: texture }));
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.add(mesh);
    }

    generateTexture(data: any, width: number, height: number) {

        // bake lighting into texture

        let context: any, image, imageData;

        const vector3 = new THREE.Vector3(0, 0, 0);

        const sun = new THREE.Vector3(1, 1, 1);
        sun.normalize();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);

        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
            imageData[i] = 192 * (0.5 + data[j] * 0.007);
            imageData[i + 1] = 104 * (0.5 + data[j] * 0.007);
            imageData[i + 2] = 72 * (0.5 + data[j] * 0.007);

        }

        context.putImageData(image, 0, 0);

        // Scaled 4x

        const canvasScaled = document.createElement('canvas');
        canvasScaled.width = width * 4;
        canvasScaled.height = height * 4;

        context = canvasScaled.getContext('2d');
        context.scale(4, 4);
        context.drawImage(canvas, 0, 0);

        image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
        context.putImageData(image, 0, 0);

        return canvasScaled;

    }

    generateHeight(width: number, height: number) {

        const size = width * height, data = new Uint8Array(size),
            perlin = new ImprovedNoise(), z = Math.random() * 256;

        let quality = 1;

        for (let j = 0; j < 4; j++) {

            for (let i = 0; i < size; i++) {

                const x = i % width, y = ~ ~(i / width);
                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

            }

            quality *= 5;

        }

        return data;
    }

    getChunkQuality(camera_position: THREE.Vector3, chunk_center: THREE.Vector3) {

    }

    updatePrecision(camera_position: THREE.Vector3) {

    }

}

export { Mountain };