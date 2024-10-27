import {Entity} from "./Entity";
import {IUniform} from "three";
import {Game} from "../Game";
import {EntityName} from "../Configs/EntityPaths";
import * as THREE from "three";

export class ShaderEntity extends Entity {
    public vShader: string = '';
    public fShader: string = '';
    public uniforms: { [p: string]: IUniform<any>; } = {};

    constructor(game: Game, assetName: EntityName, pos?: THREE.Vector3, qua?: THREE.Quaternion, iFFNumber?: number) {
        super(game, assetName, pos, qua, iFFNumber);
    }
}