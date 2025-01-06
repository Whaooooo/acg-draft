import * as THREE from "three";
import {NPCPlane} from "../Entities/NPCPlane";
import {Game} from "../Game";

export function ensureNPCs(game: Game): void {
    console.log("Ensure NPCs");
    if (game.isGameOnline()) {return;}
    // 计算 iFFNumber 为 0 的 NPC 数量
    const npcIFF0 = Array.from(game.npcPlaneMap.values()).filter(npc => npc.iFFNumber === 0);
    const requiredNPCs = Math.ceil(1 + (game.clock.elapsedTime - 1) / (Math.log2(1.01 + game.clock.elapsedTime * 20)));

    if (npcIFF0.length < requiredNPCs) {
        const needed = requiredNPCs - npcIFF0.length;

        // 从 playerMap 中筛选出 iFFNumber 为 1 的玩家
        const playersIFF1 = Array.from(game.playerMap.values()).filter(player => player.iFFNumber === 1);

        if (playersIFF1.length === 0) {
            console.warn('没有找到 iFFNumber 为 1 的玩家。');
            return;
        }

        for (let i = 0; i < needed; i++) {
            // 随机选择一个玩家
            const randomPlayer = playersIFF1[Math.floor(Math.random() * playersIFF1.length)];

            // 获取玩家的位置
            const playerPosition = randomPlayer.getPosition().clone();

            // 在 y 轴上增加 1000
            const newPosition = playerPosition.add(new THREE.Vector3(500 * Math.random(), 500 + 500 * Math.random(), 500 * Math.random()));

            // 创建新的 NPCPlane
            new NPCPlane(game, 'npc_plane', newPosition, randomPlayer.getQuaternion(), undefined, 0);

            console.log(`创建了一个新的 NPCPlane，位置: ${newPosition.toArray()}, iFFNumber: 0`);
        }
    }
}
