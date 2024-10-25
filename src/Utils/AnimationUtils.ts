import { Plane } from '../Entities/Plane';
import * as THREE from 'three';
import { FADE_DURATION_IN, FADE_DURATION_OUT } from "../Configs/AnimationBound";

export function updatePlaneAnimations(plane: Plane, deltaTime: number): void {
    for (const [animationType, isActive] of plane.animationStates.entries()) {
        const wasActive = plane.previousAnimationStates.get(animationType) || false;
        if (!isActive && wasActive) {
            // Animation became inactive
            stopAnimations(plane, animationType);
        }
    }

    // Then, play animations that became active
    for (const [animationType, isActive] of plane.animationStates.entries()) {
        const wasActive = plane.previousAnimationStates.get(animationType) || false;
        if (isActive && !wasActive) {
            // Animation became active
            playAnimations(plane, animationType);
        }
    }
}

function playAnimations(plane: Plane, animationType: string): void {
    const animations = plane.animationConfig[animationType as keyof typeof plane.animationConfig];
    if (!animations || animations.length === 0) return;

    for (const anim of animations) {
        const animNameLower = anim.name.toLowerCase();

        // Check if the animation is already active
        if (plane.activeAnimations.has(animNameLower)) {
            continue; // Already playing
        }

        // Get the AnimationAction from plane.actions
        const action = plane.actions.get(animNameLower);
        if (!action) {
            continue;
        }

        // Remove any existing 'finished' event listener for this action
        const previousListener = plane.actionEventListeners.get(animNameLower);
        if (previousListener) {
            plane.mixer!.removeEventListener('finished', previousListener);
            plane.actionEventListeners.delete(animNameLower);
        }

        // Ensure the action is enabled
        action.enabled = true;

        action.loop = anim.loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = true; // Keep the last frame after finish
        action.reset();

        // Apply fade-in
        const fadeInDuration = anim.fadeInDuration ?? FADE_DURATION_IN;
        action.fadeIn(fadeInDuration);
        action.play();

        // If not looping, listen for finished event using the mixer's event system
        if (!anim.loop) {
            const onFinished = (event: THREE.AnimationMixerEventMap['finished']) => {
                if (event.action === action) {
                    // Handle recoverAfterAnimationEnd
                    if (anim.recoverAfterAnimationEnd) {
                        action.reset();
                    }
                    // Remove from activeAnimations
                    plane.activeAnimations.delete(animNameLower);
                    // Cleanup listener
                    plane.mixer!.removeEventListener('finished', onFinished);
                    plane.actionEventListeners.delete(animNameLower);
                }
            };
            plane.mixer!.addEventListener('finished', onFinished);
            // Store the listener so we can remove it later
            plane.actionEventListeners.set(animNameLower, onFinished);
        } else {
            // For looping animations, ensure they are removed from activeAnimations when stopped
            plane.actionEventListeners.delete(animNameLower);
        }

        // Store the action in activeAnimations
        plane.activeAnimations.set(animNameLower, action);
    }
}


function stopAnimations(plane: Plane, animationType: string): void {
    const animations = plane.animationConfig[animationType as keyof typeof plane.animationConfig];
    if (!animations || animations.length === 0) return;

    for (const anim of animations) {
        const animNameLower = anim.name.toLowerCase();

        // Get the action from plane.actions
        const action = plane.actions.get(animNameLower);
        if (!action) continue;

        // Remove any existing 'finished' event listener for this action
        const previousListener = plane.actionEventListeners.get(animNameLower);
        if (previousListener) {
            plane.mixer!.removeEventListener('finished', previousListener);
            plane.actionEventListeners.delete(animNameLower);
        }

        // Remove from activeAnimations immediately
        plane.activeAnimations.delete(animNameLower);

        // Stop the action
        action.stop();
        action.reset();
        action.enabled = false;

        // No need to add a new 'finished' event listener
    }
}