// src/Utils/AnimationUtils.ts

import { Plane } from '../Entities/Plane';
import { Animation } from '../Configs/AnimationBound';
import * as THREE from 'three';

export function updatePlaneAnimations(plane: Plane, deltaTime: number): void {
    // Define thresholds
    const yawThreshold = 0.01;
    const pitchThreshold = 0.01;
    const rollThreshold = 0.01;
    const pulsionThreshold = 0.1;

    // Keep track of which animation types are active
    const newAnimationStates = new Map<string, boolean>();

    // Determine if each animation type is active
    const increaseThrustActive = plane.pulsion > plane.property.defaultPulsion + pulsionThreshold;
    const decreaseThrustActive = plane.pulsion < plane.property.defaultPulsion - pulsionThreshold;
    const yawLeftActive = plane.yawSpeed > yawThreshold;
    const yawRightActive = plane.yawSpeed < -yawThreshold;
    const pitchUpActive = plane.pitchSpeed > pitchThreshold;
    const pitchDownActive = plane.pitchSpeed < -pitchThreshold;
    const rollLeftActive = plane.rollSpeed > rollThreshold;
    const rollRightActive = plane.rollSpeed < -rollThreshold;

    // Update newAnimationStates
    newAnimationStates.set('increaseThrust', increaseThrustActive);
    newAnimationStates.set('decreaseThrust', decreaseThrustActive);
    newAnimationStates.set('yawLeft', yawLeftActive);
    newAnimationStates.set('yawRight', yawRightActive);
    newAnimationStates.set('pitchUp', pitchUpActive);
    newAnimationStates.set('pitchDown', pitchDownActive);
    newAnimationStates.set('rollLeft', rollLeftActive);
    newAnimationStates.set('rollRight', rollRightActive);

    // For each animation type
    for (const [animationType, isActive] of newAnimationStates.entries()) {
        const wasActive = plane.animationStates.get(animationType) || false;
        if (isActive && !wasActive) {
            // Animation became active
            playAnimations(plane, animationType);
        } else if (!isActive && wasActive) {
            // Animation became inactive
            stopAnimations(plane, animationType);
        }
        // Update the animation state
        plane.animationStates.set(animationType, isActive);
    }
}

function playAnimations(plane: Plane, animationType: string): void {
    const animations = plane.animationConfig[animationType as keyof typeof plane.animationConfig];
    if (!animations || animations.length === 0) return;


    for (const anim of animations) {
        // Check if the animation is already active
        if (plane.activeAnimations.has(anim.name)) {
            console.log(`Animation '${anim.name}' is already active.`);
            continue; // Already playing
        }


        // Find the corresponding AnimationClip in plane.animations
        const clip = plane.animations.get(anim.name.toLowerCase());
        if (!clip) {
            console.warn(`Animation clip '${anim.name}' not found in plane '${plane.name}'`);
            console.log('Available animations:', Array.from(plane.animations.keys()));
            continue;
        }

        // Create an AnimationAction
        const action = plane.mixer!.clipAction(clip);

        action.loop = anim.loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = true; // Keep the last frame after finish
        action.reset();
        action.play();

        console.log(`Action '${anim.name}' details: isRunning=${action.isRunning()}, enabled=${action.enabled}, weight=${action.getEffectiveWeight()}`);
        console.log('Action details:', action);

        // ... rest of your code ...
    }
}


function stopAnimations(plane: Plane, animationType: string): void {
    const animations = plane.animationConfig[animationType as keyof typeof plane.animationConfig];
    if (!animations || animations.length === 0) return;

    for (const anim of animations) {
        // Get the action from activeAnimations
        const action = plane.activeAnimations.get(anim.name);
        if (!action) continue;

        // Stop the action
        action.stop();

        // Remove from activeAnimations
        plane.activeAnimations.delete(anim.name);

        // Handle recoverAfterActiveEnd
        if (anim.recoverAfterActiveEnd) {
            // Reset the action to initial state
            action.reset();
        }
    }
}
