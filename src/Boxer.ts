import * as BabylonViewer from '@babylonjs/viewer';
import { Engine, Tools, KeyboardEventTypes, Space, AnimationGroup, int, AbstractMesh, float, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { Player } from "./Player";

export class Boxer {
    public name: string; // Nom du boxeur
    public camera: FreeCamera; // Caméra associée au boxeur
    public scene: Scene; // Scène dans laquelle évolue le boxeur
    public _canvas: HTMLCanvasElement; // Canvas HTML pour le rendu
    public isInvulnerable: boolean; // Indique si le boxeur est invulnérable
    public health: float; // Santé du boxeur
    public previousState: string; // État précédent du boxeur

    public attackCooldown: float; // Temps de recharge des attaques
    public cooldownTimeAttack: float = 1; // Temps de recharge des attaques en secondes
    public isAttacking: Boolean; // Indique si le boxeur est en train d'attaquer
    public velocity: float = 10; // Vitesse de déplacement du boxeur
    public cooldownTimeStun: float; // Temps de recharge après une étourdissement
    private player: Player; // Référence au joueur
    private _damageCooldown: boolean = false; // Ajout du cooldown pour les dégâts
    public _isKO: boolean = false; // Variable pour suivre l'état KO
    public _boxerMesh: AbstractMesh;


    // Définition des différents états possibles du boxeur
    public static State = {
        IDLE: "idle",
        WALKING: "walking",
        BLOCK: "block",
        DYING: "dying",
        GETTING_UP_BACK: "gettingUpBack",
        GETTING_UP_FRONT: "gettingUpFront",
        HIT_REACTION_STOMACH: "hitReactionStomach",
        HOOK_PUNCH: "hookPunch",
        KNOCKED_OUT_BACK: "knockedOutBack",
        KNOCKED_OUT_FRONT: "knockedOutFront",
        PUNCH_LEFT: "punchLeft",
        PUNCH_RIGHT: "punchRight",
        RECEIVE_HEAD_PUNCH: "receiveHeadPunch",
        RECEIVE_STOMACH_UPPERCUT: "receiveStomachUppercut",
        STUNNED: "stunned",
        WARMING_UP: "warmingUp",
        ENTRY: "entry",
        LEFT_JAB: "leftJab",
        LOW_RIGHT_PUNCH: "lowRightPunch",
        RIGHT_BODY_PUNCH: "rightBodyPunch",
        RIGHT_JAB: "rightJab",
        RECEIVE_BIG_HEAD: "receivebighead",
        RECEIVE_STOMACH_LEFT: "receive_stomach_left",
        RECEIVE_STOMACH_RIGHT: "receive_stomach_right"
    };

    public currentState: string; // État actuel du boxeur
    public animations: { [key: string]: AnimationGroup }; // Animations associées aux états

    constructor(scene: Scene, canvas: HTMLCanvasElement, velocity: int, name: string, player: Player) {
        this.scene = scene;
        this._canvas = canvas;
        this.velocity = velocity;
        this.name = name;
        this.player = player;
        this.health = 100;
        this.isInvulnerable = false;
        this.initializeBoxer().then(() => {
            this.loadAnimations();
            this.changeState(Boxer.State.ENTRY); // Commence avec l'animation d'entrée
        });
        this.cooldownTimeAttack = 0; // Temps de recharge initial des attaques
        this.attackCooldown = 3; // Initialisation du temps de recharge des attaques
    }

    // Méthode pour initialiser le boxeur en chargeant son modèle
    public async initializeBoxer(): Promise<void> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "boxer.glb", this.scene);
        this._boxerMesh = result.meshes[0];
        this._boxerMesh.name = this.name;
        this._boxerMesh.checkCollisions = true;
        this._boxerMesh.position = new Vector3(4.8, 0.74, 35.1);
        this._boxerMesh.scaling = new Vector3(1.5, 1.5, 1.5);
        this._boxerMesh.name = this.name;
    }

    // Méthode pour charger les animations associées aux états du boxeur
    private loadAnimations() {
        // Associe les groupes d'animations existants aux états en les trouvant par leur nom dans la scène
        this.animations = {
            [Boxer.State.ENTRY]: this.scene.getAnimationGroupByName("Entry"),
            [Boxer.State.IDLE]: this.scene.getAnimationGroupByName("Boxing (1)"),
            [Boxer.State.BLOCK]: this.scene.getAnimationGroupByName("Block"),
            [Boxer.State.DYING]: this.scene.getAnimationGroupByName("Dying"),
            [Boxer.State.GETTING_UP_BACK]: this.scene.getAnimationGroupByName("Getting Up"),
            [Boxer.State.GETTING_UP_FRONT]: this.scene.getAnimationGroupByName("Getting Up (1)"),
            [Boxer.State.HIT_REACTION_STOMACH]: this.scene.getAnimationGroupByName("Hit Reaction"),
            [Boxer.State.HOOK_PUNCH]: this.scene.getAnimationGroupByName("Hook Punch"),
            [Boxer.State.KNOCKED_OUT_BACK]: this.scene.getAnimationGroupByName("Knocked Out (3)"),
            [Boxer.State.KNOCKED_OUT_FRONT]: this.scene.getAnimationGroupByName("Knocked Out (4)"),
            [Boxer.State.PUNCH_LEFT]: this.scene.getAnimationGroupByName("Punching"),
            [Boxer.State.PUNCH_RIGHT]: this.scene.getAnimationGroupByName("Punching (1)"),
            [Boxer.State.RECEIVE_HEAD_PUNCH]: this.scene.getAnimationGroupByName("Receive Punch To The Face"),
            [Boxer.State.RECEIVE_STOMACH_UPPERCUT]: this.scene.getAnimationGroupByName("Receive Stomach Uppercut"),
            [Boxer.State.STUNNED]: this.scene.getAnimationGroupByName("Stunned"),
            [Boxer.State.WALKING]: this.scene.getAnimationGroupByName("Walking"),
            [Boxer.State.WARMING_UP]: this.scene.getAnimationGroupByName("Warming Up"),
            [Boxer.State.LEFT_JAB]: this.scene.getAnimationGroupByName("Boxing"),
            [Boxer.State.LOW_RIGHT_PUNCH]: this.scene.getAnimationGroupByName("Boxing (3)"), // non fonctionnel
            [Boxer.State.RIGHT_BODY_PUNCH]: this.scene.getAnimationGroupByName("Boxing (4)"),
            [Boxer.State.RIGHT_JAB]: this.scene.getAnimationGroupByName("Boxing (5)"),
            [Boxer.State.RECEIVE_BIG_HEAD]: this.scene.getAnimationGroupByName("Big Hit To Head"),
            [Boxer.State.RECEIVE_STOMACH_RIGHT]: this.scene.getAnimationGroupByName("Reaction"),
            [Boxer.State.RECEIVE_STOMACH_LEFT]: this.scene.getAnimationGroupByName("Reaction (1)")
        };

        // Définit le comportement par défaut des boucles d'animation et gère les animations manquantes
        Object.keys(this.animations).forEach(key => {
            if (this.animations[key]) {
                // Détermine si l'animation doit boucler
                this.animations[key].loopAnimation = [Boxer.State.IDLE, Boxer.State.WALKING, Boxer.State.ENTRY, Boxer.State.WARMING_UP].includes(key);

                // Configure une observable de fin pour revenir à l'état IDLE si l'animation ne boucle pas
                if (!this.animations[key].loopAnimation) {
                    this.animations[key].onAnimationEndObservable.addOnce(() => {
                        if (this.currentState === key) { // Vérifie si l'état n'a pas changé entre-temps
                            this.changeState(Boxer.State.IDLE);
                        }
                    });
                }
            } else {
                console.error(`Animation for state ${key} not found.`);
            }
        });
    }

    // Méthode pour changer l'état du boxeur
    public changeState(newState: string, damage: number = 0, hand: string = '') {
        console.log(`Attempting to change state from ${this.currentState} to ${newState}, currently invulnerable: ${this.isInvulnerable}`);

        if (!this.isValidTransition(this.currentState, newState)) {
            console.log("State change blocked due to ongoing recovery process.");
            return;
        }

        if (this.currentState === newState) {
            console.log("Already in the state.");
            return;
        }

        const anim = this.animations[newState];
        if (!anim) {
            console.error(`No animation found for state ${newState}`);
            return;
        }

        if (this.animations[this.currentState] && this.currentState !== newState) {
            this.animations[this.currentState].stop();
        }

        if (damage > 0) {
            this.receiveDamage(damage);
        }

        this.currentState = newState;
        anim.loopAnimation = this.shouldLoop(newState);
        anim.onAnimationEndObservable.clear();

        anim.start(anim.loopAnimation);
        anim.onAnimationGroupPlayObservable.addOnce(() => {
            this.isInvulnerable = this.determineInvulnerability(newState);
            console.log(`State changed to ${newState}, invulnerability set to ${this.isInvulnerable}.`);
            if (newState.includes("Punch") || newState.includes("Jab")) {
                this.player.isInvulnerable = false;
                console.log("Player should be vulnerable now!");
            }
        });

        anim.onAnimationEndObservable.addOnce(() => {
            if (this.health > 0) {
                if (newState === Boxer.State.KNOCKED_OUT_BACK) {
                    console.log(`Animation for knockedOutBack completed, transitioning to gettingUpBack.`);
                    this.changeState(Boxer.State.GETTING_UP_BACK);
                } else if (newState === Boxer.State.KNOCKED_OUT_FRONT) {
                    console.log(`Animation for knockedOutFront completed, transitioning to gettingUpFront.`);
                    this.changeState(Boxer.State.GETTING_UP_FRONT);
                } else if ([Boxer.State.GETTING_UP_BACK, Boxer.State.GETTING_UP_FRONT].includes(newState)) {
                    console.log(`Animation for gettingUp completed, transitioning to IDLE and becoming vulnerable.`);
                    this.isInvulnerable = false;
                    this.changeState(Boxer.State.IDLE);
                } else {
                    this.player.isInvulnerable = true;
                    this.isInvulnerable = false;
                    console.log(`Animation ${newState} completed, transitioning to IDLE.`);
                    this.changeState(Boxer.State.IDLE);
                }
            }
        });
    }

    // Méthode pour vérifier la validité de la transition d'état
    private isValidTransition(currentState: string, newState: string): boolean {
        if (currentState === Boxer.State.KNOCKED_OUT_BACK && newState !== Boxer.State.GETTING_UP_BACK) {
            return false;
        }
        if (currentState === Boxer.State.GETTING_UP_BACK && newState !== Boxer.State.IDLE) {
            return false;
        }
        return true;
    }

    // Méthode pour déterminer si le boxeur doit être invulnérable dans l'état donné
    private determineInvulnerability(state: string): boolean {
        switch (state) {
            case Boxer.State.BLOCK:
            case Boxer.State.DYING:
            case Boxer.State.KNOCKED_OUT_BACK:
            case Boxer.State.KNOCKED_OUT_FRONT:
            case Boxer.State.GETTING_UP_BACK:
            case Boxer.State.GETTING_UP_FRONT:
            case Boxer.State.HIT_REACTION_STOMACH:
            case Boxer.State.RECEIVE_STOMACH_LEFT:
            case Boxer.State.RECEIVE_STOMACH_RIGHT:
            case Boxer.State.RECEIVE_BIG_HEAD:
            case Boxer.State.RECEIVE_HEAD_PUNCH:
                return true;
            default:
                return this.shouldLoop(state);
        }
    }

    // Méthode pour arrêter le mouvement et le regard du boxeur
    public stopMovementAndLookAt() {
        if (this.health > 0) {
            this._isKO = true;
            this.isInvulnerable = true;
            this.velocity = 0;
            setTimeout(() => {
                this.resumeMovement();
                this._isKO = false;
            }, 12000); // Cooldown de 12 secondes
        }
        else {
            this._isKO = true;
            this.isInvulnerable = true;
            this.velocity = 0;
        }
    }

    // Méthode pour reprendre le mouvement du boxeur
    public resumeMovement() {
        this.velocity = 0.03;
    }

    // Méthode pour gérer les dégâts reçus par le boxeur
    public receiveDamage(damage: number) {
        if (this._damageCooldown) {
            return; // Si en cooldown, ne pas appliquer de dégâts
        }

        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.changeState(Boxer.State.KNOCKED_OUT_BACK);
            this.velocity = 0; // Arrêter le mouvement du boxeur
        } else {
            this._damageCooldown = true;
            setTimeout(() => {
                this._damageCooldown = false;
            }, 1000); // Cooldown de 1 seconde
        }
    }

    public dispose(): void {
        // Dispose the mesh
        if (this._boxerMesh) {
            this._boxerMesh.dispose();
        }

        // Dispose all animations
        for (const key in this.animations) {
            if (this.animations[key]) {
                this.animations[key].dispose();
            }
        }

        console.log(`Boxer ${this.name} has been disposed.`);
    }

    // Méthode pour déterminer si une animation doit boucler en fonction de l'état
    private shouldLoop(state: string): boolean {
        return [Boxer.State.IDLE, Boxer.State.WALKING, Boxer.State.ENTRY, Boxer.State.WARMING_UP].includes(state);
    }
}
