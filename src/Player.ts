import * as BabylonViewer from '@babylonjs/viewer';
import {Boxer} from "./Boxer";
import { WebXRCamera,Scene, Vector3, Animation,float } from "@babylonjs/core";
import { AdvancedDynamicTexture, StackPanel, Ellipse, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";


export class Player {
    public playerHealth: number;
    public isInvulnerable: boolean;
    public healthText: TextBlock;

    constructor(health: number) {
        this.playerHealth = health;
        this.isInvulnerable = false;
    }

    public updateHealth(damage: number) {
        this.playerHealth -= damage;
        if (this.playerHealth < 0) this.playerHealth = 0;
        if (this.healthText) {
            this.healthText.text = `Health: ${this.playerHealth}`;
        }
    }
}

