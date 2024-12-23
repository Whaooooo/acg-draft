import * as THREE from 'three';
import { ImprovedNoise } from '../Utils/ImprovedNoise';
import { DDSLoader } from "../Utils/DDSLoader";

class Mountain extends THREE.Group {
    isMountain = true;
    chunkList: THREE.Mesh[][][] = [];
    worldWidth = 768;
    worldDepth = 768;
    totalWidth = 90000;
    totalDepth = 90000;
    slice = 16;
    chunkWidth: number;
    chunkHeight: number;
    blockWidth: number;
    blockHeight: number;
    data: any;

    constructor() {
        super();

        this.data = this.generateHeight(this.worldWidth + 1, this.worldDepth + 1);
        this.chunkWidth = this.totalWidth / this.slice;
        this.chunkHeight = this.totalDepth / this.slice;
        this.blockWidth = this.totalWidth / this.worldWidth;
        this.blockHeight = this.totalDepth / this.worldDepth;
        this.generateChunks(this.slice);
    }

    getData(x: number, z: number) {
        let ret = this.data[x + z * (this.worldWidth + 1)] * 30 - 900;
        if (ret > -2 && ret < 2) {
            if (ret > 0) {
                ret = 2;
            } else {
                ret = -2;
            }
        }
        if (ret > 2000) {
            ret = 2000 + (ret - 2000) * 0.5;
        }
        return ret;
    }

    getHeight(x: number, z: number) {
        if (x < -this.totalWidth / 2 || x > this.totalWidth / 2 || z < -this.totalDepth / 2 || z > this.totalDepth / 2) {
            return 0;
        }
        const rx = Math.floor((x + this.totalWidth / 2) / this.blockWidth);
        const rz = Math.floor((z + this.totalDepth / 2) / this.blockHeight);
        const s = (x + this.totalWidth / 2) / this.blockWidth - rx;
        const t = (z + this.totalDepth / 2) / this.blockHeight - rz;
        function lerp(a: number, b: number, t: number) {
            return a + (b - a) * t;
        }
        const h00 = this.getData(rx, rz);
        const h01 = this.getData(rx, rz + 1);
        const h10 = this.getData(rx + 1, rz);
        const h11 = this.getData(rx + 1, rz + 1);
        const h0 = lerp(h00, h01, t);
        const h1 = lerp(h10, h11, t);
        return lerp(h0, h1, s);
    }

    worldToResolution(x: number, z: number) {
        x += this.totalWidth / 2;
        z += this.totalDepth / 2;
        return [Math.floor(x / this.blockWidth), Math.floor(z / this.blockHeight)];
    }

    chunkToWorld(x: number, z: number) {
        return [(x + 0.5) * this.chunkWidth - this.totalWidth / 2, (z + 0.5) * this.chunkHeight - this.totalDepth / 2];
    }

    generateChunks(slice: number) {
        const dx = Math.floor(this.worldWidth / slice);
        const dz = Math.floor(this.worldDepth / slice);
        const chunkWidth = this.totalWidth / slice;
        const chunkHeight = this.totalDepth / slice;


        for (let i = 0; i < slice; i++) {
            let innnerArray = [];
            for (let j = 0; j < slice; j++) {
                innnerArray.push([]);
            }
            this.chunkList.push(innnerArray);
        }

        for (let i = 0; i < slice; i++) {
            for (let j = 0; j < slice; j++) {
                const offset1 = i * dx;
                const offset2 = j * dz;

                const loader = new DDSLoader();
                const texture = loader.load(`assets/LandTexturesSummer/land_39_${i - 58}_${j - 24}.png.dds`);

                texture.repeat.set(1, 1);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;

                const meterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });

                for (let k = 1; k <= 4; k *= 2) {
                    const geometry = new THREE.PlaneGeometry(chunkWidth, chunkHeight, Math.floor(dx / k), Math.floor(dz / k));
                    geometry.rotateX(- Math.PI / 2);
                    const vertices = geometry.attributes.position.array;
                    const normal = geometry.attributes.normal.array;
                    let offset_dx = 0;
                    let offset_dz = 0;
                    const l = (Math.floor(dx / k) + 1) * (Math.floor(dz / k) + 1);
                    for (let ii = 0, y_offset = 0; ii < l; ii++, y_offset += 3) {
                        vertices[y_offset + 1] = this.getData(offset1 + offset_dx, offset2 + offset_dz);
                        offset_dx += k;
                        if (offset_dx > dx) {
                            offset_dx = 0;
                            offset_dz += k;
                        }
                    }
                    geometry.computeVertexNormals();
                    const mesh = new THREE.Mesh(geometry, meterial);
                    mesh.position.set((i + 0.5) * chunkWidth - this.totalWidth / 2, 0, (j + 0.5) * chunkHeight - this.totalDepth / 2);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    this.chunkList[i][j].push(mesh);
                    this.add(mesh);
                    if (k != 4) {
                        mesh.visible = false;
                    }
                }
            }
        }


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
            perlin = new ImprovedNoise();
        // const z = Math.random() * 256;
        const z = 53.473368139245;

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
        const dx = Math.abs(camera_position.x - chunk_center.x);
        const dz = Math.abs(camera_position.z - chunk_center.z);
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 15000) {
            return 0;
        }
        if (d < 40000) {
            return 1;
        }
        return 2;
    }

    updatePrecision(camera_position: THREE.Vector3) {
        for (let i = 0; i < this.slice; i++) {
            for (let j = 0; j < this.slice; j++) {
                const chunk_center = this.chunkToWorld(i, j);
                const quality = this.getChunkQuality(camera_position, new THREE.Vector3(chunk_center[0], 0, chunk_center[1]));
                for (let k = 0; k < 3; k++) {
                    this.chunkList[i][j][k].visible = false;
                }
                this.chunkList[i][j][quality].visible = true;
            }
        }
    }

    dispose() {
        for (let i = 0; i < this.slice; i++) {
            for (let j = 0; j < this.slice; j++) {
                for (let k = 0; k < 3; k++) {
                    this.chunkList[i][j][k].geometry.dispose();
                    (this.chunkList[i][j][k].material as THREE.MeshPhongMaterial).map?.dispose();
                }
            }
        }
    }
}

export { Mountain };