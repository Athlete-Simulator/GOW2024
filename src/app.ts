import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRCamera, WebXRSessionManager, WebXRInputSource } from '@babylonjs/core/XR';

import { Animation } from "@babylonjs/core/Animations/animation";

import * as CANNON from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';

import { SkyMaterial } from '@babylonjs/materials';
import { AdvancedDynamicTexture, StackPanel, Ellipse, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";
import { Boxer } from "./Boxer";
import { UtilityLayerRenderer, PhysicsImpostor, UniversalCamera, Engine, Space, ExecuteCodeAction, ActionManager, TransformNode, WebXRAbstractMotionController, int, KeyboardEventTypes, SceneOptimizer, SceneOptimizerOptions, Tools, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, AnimationGroup, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material, float, Light, AbstractMesh } from "@babylonjs/core";
import { Round } from "./Round";
import { Boxing } from "./Boxing";
import { Player } from "./Player";
import { Gun } from "./gun";
import { ShootingRange } from "./ShootingRange";
import { Kayak } from "./Kayak";
import { Canoe } from "./Canoe";
import { Paddle } from './Paddle';
import { Rower } from './Rower';
import { EiffelTower } from './EiffelTower';

// Import des modules nécessaires pour Babylon.js et les fonctionnalités de VR et de physique

// Déclaration des différents états possibles du jeu
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
    // Déclaration des variables globales pour l'application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _Boxervelocity: float;
    private _skyboxMaterial: SkyMaterial;
    private _round: Round;
    public cpt2: number = 9999;

    // Variables pour le boxeur
    private _boxer: Boxer;

    // Variables pour la VR
    public _xr: WebXRDefaultExperience;
    private _leftController: WebXRAbstractMotionController;
    private _rightController: WebXRAbstractMotionController;
    private _camera: WebXRCamera;
    private _rightControllerMesh: AbstractMesh;
    private _leftControllerMesh: AbstractMesh;
    private canRotate = true; // Pour contrôler si la rotation est permise
    private neutralPositionAnimationR: AnimationGroup;
    private indicatingPositionAnimationR: AnimationGroup;
    private swordHoldingPositionAnimationR: AnimationGroup;
    private neutralPositionAnimationL: AnimationGroup;
    private indicatingPositionAnimationL: AnimationGroup;
    private swordHoldingPositionAnimationL: AnimationGroup;
    private indicatingPoseLAnimation: AnimationGroup;
    private indicatingPoseRAnimation: AnimationGroup;
    private homeSound: Sound;
    private kayakSound: Sound;
    private boxerSound: Sound;
    private walkSound: Sound;
    private isWalking: boolean = false;
    private animationState: string = "neutral"; // état initial
    private map: AbstractMesh[];
    private teleportableShootingRange = true;
    private teleportableBoxing = true;
    private teleportableSpawn = true;
    private teleportableRing = true;
    private teleportCooldown = false;
    private rightSqueezePressed: boolean = false;
    private leftSqueezePressed: boolean = false;
    private boxerMesh: AbstractMesh;
    private rightHandNode: TransformNode;
    private leftHandNode: TransformNode;
    private rightHandMesh: AbstractMesh;
    private leftHandMesh: AbstractMesh;
    private rightGlove: AbstractMesh;
    private leftGlove: AbstractMesh;
    private previousGlovePositions: { left: Vector3, right: Vector3 };
    private lastUpdateTime: number;
    private startFight: Boolean = false;
    private player: Player;
    private bodyMesh: AbstractMesh;
    private _aButtonPressed: Boolean = false;
    private _homeButtonMesh: AbstractMesh;
    private _wristUIPlane: AbstractMesh;
    private _wristKayakUIPlane: AbstractMesh;
    private _homeButtonPressed: boolean = false; // Flag to track if the button is pressed
    private _homeButtonCooldown: boolean = false; // Flag for cooldown
    private _homeButtonVisual: Button;
    private inKayak: boolean = false;
    private inArena: boolean = false;
    private canMove: boolean = true;
    private _homeButtonPressTimeout: any;
    private _yButtonPressed: boolean = false;

    // Variables pour le boxeur
    private _boxing: Boxing;
    private boxerHead: AbstractMesh;
    private boxerBody: AbstractMesh;
    private boxerLegs: AbstractMesh;
    private boxerRightGlove: AbstractMesh;
    private boxerLeftGlove: AbstractMesh;
    private currentState: string;
    private attackStates = [
        Boxer.State.HOOK_PUNCH,
        Boxer.State.PUNCH_LEFT,
        Boxer.State.PUNCH_RIGHT,
        Boxer.State.LEFT_JAB,
        //Boxer.State.LOW_RIGHT_PUNCH,
        Boxer.State.RIGHT_BODY_PUNCH,
        //Boxer.State.RIGHT_JAB
    ];

    // Variables pour le pistolet
    private _gun: Gun;
    private gunAvailable: boolean = false;
    private magazineAvailable: boolean = false;
    private magazineTaken: boolean = false;
    private magazineInserted: boolean = false;
    private _extraShotPoints: Ellipse[];
    private teleportableToHome: boolean = false;
    private inShootingRange: boolean = false;

    // Variables pour le stand de tir
    private _shootingRange: ShootingRange;

    // Variables pour le son VR
    private soundHit: Sound;
    private soundBlock: Sound;

    // Variables liées à la scène
    private _state: number = 0;
    private _fallbackUI: AdvancedDynamicTexture;

    // Variables pour le kayak
    private _kayak: Kayak;
    private teleportableKayak: boolean = true;
    private _canoe: Canoe;
    private _paddle: Paddle;
    private _canoeVelocity: Vector3 = Vector3.Zero();
    private _rower: Rower;
    private _rower2: Rower;
    private _rower3: Rower;
    private rankText: TextBlock = new TextBlock("rankText", "4th");
    private rowingSound: Sound;
    private eiffelTower: EiffelTower;

    // Constructeur de la classe App
    constructor() {
        // Assigne le canvas et l'engin de jeu
        this._canvas = this._createCanvas();
        this.initializeEngine();
    }

    // Initialisation de l'engin Babylon.js
    private async initializeEngine(): Promise<void> {
        this._engine = new Engine(this._canvas, true, { preserveDrawingBuffer: true, stencil: true });
        if (!this._engine) {
            console.error("Engine initialization failed.");
            return;
        }
        this.setupScene();
        this.update();
    }

    // Gestion des entrées du contrôleur VR
    private handleControllerInput() {
        this._xr.input.controllers.forEach(controller => {
            if (!controller.inputSource.gamepad) {
                console.warn("Gamepad not available for this controller.");
                return;
            }

            let axes = controller.inputSource.gamepad.axes;
            if (controller.inputSource.handedness === "right") {
                this.processCameraRotation(axes[2]);
            } else if (controller.inputSource.handedness === "left") {
                let x = axes[2];
                let y = -axes[3];

                if ((Math.abs(x) > 0.1 || Math.abs(y) > 0.1) && this.canMove) {
                    this.movePlayer(x, y);
                } else {
                    if (this.isWalking) {
                        this.walkSound.stop();
                        this.isWalking = false;
                    }
                }
            }

            this.setupRightControllerEvents(controller);
            this.setupLeftControllerEvents(controller);

            const buttons = controller.inputSource.gamepad.buttons;
            const motionController = controller.motionController;

            if (controller.inputSource.handedness === 'right') {
                const aButton = motionController.getComponent("a-button");
                if (aButton.pressed && !this._aButtonPressed) {
                    console.log("Boutton A pressed");
                    this._aButtonPressed = true;
                    this.toggleWristUI();
                } else if (!aButton.pressed) {
                    this._aButtonPressed = false;
                }
            }
        });
    }

    // Méthode pour afficher ou masquer l'interface utilisateur au poignet
    private toggleWristUI() {
        const plane = this.inKayak ? this._wristKayakUIPlane : this._wristUIPlane;
        if (plane) {
            plane.setEnabled(!plane.isEnabled());
        }
    }

    // Méthode pour déplacer le joueur en fonction des entrées du contrôleur
    private movePlayer(x: number, y: number) {
        const speed = 0.1; // Vitesse de déplacement ajustable
        let forward = this._camera.getForwardRay().direction;
        forward.y = 0; // Ignorer le mouvement vertical
        forward.normalize(); // Normaliser pour obtenir une direction unitaire

        let right = Vector3.Cross(Vector3.Up(), forward).normalize(); // Obtenir le vecteur de droite basé sur la direction de la caméra

        let direction = forward.scale(y).add(right.scale(x)).normalize(); // Calculer la direction de déplacement combinée

        // Si la direction n'est pas nulle, le joueur marche
        if (direction.length() > 0.01) {
            if (!this.isWalking) {
                this.walkSound.play();
                this.isWalking = true;
            }
        } else {
            if (this.isWalking) {
                this.walkSound.stop();
                this.isWalking = false;
            }
        }

        // Appliquer le déplacement
        this._camera.position.addInPlace(direction.scale(speed));
    }

    // Méthode pour traiter la rotation de la caméra en fonction des entrées du contrôleur
    private processCameraRotation(rotationInput: number) {
        const deadZone = 0.1; // Zone morte pour revenir au centre

        if (Math.abs(rotationInput) < deadZone) {
            this.canRotate = true;
        } else if (this.canRotate && Math.abs(rotationInput) > deadZone) {
            this.rotateCameraTarget(rotationInput);
            this.canRotate = false; // Bloquer de nouvelles rotations jusqu'au retour au centre
        }
    }

    // Méthode pour faire tourner la cible de la caméra
    private rotateCameraTarget(rotationInput: number) {
        const rotationStep = Math.PI / 6; // 30 degrés en radians

        if (Math.abs(rotationInput) > 0.1) { // Seuil pour détecter un mouvement significatif
            let newYaw = rotationInput > 0 ? rotationStep : -rotationStep;
            let rotationMatrix = Matrix.RotationY(newYaw);
            let currentDirection = this._camera.target.subtract(this._camera.position);
            let newDirection = Vector3.TransformCoordinates(currentDirection, rotationMatrix);

            this._camera.setTarget(this._camera.position.add(newDirection));
            console.log("Camera target updated to:", this._camera.target);
        }
    }

    // Méthode pour configurer la scène de base
    private setupScene(): void {
        if (!this._canvas) {
            console.error("Canvas is not initialized.");
            return;
        }
        this._scene = new Scene(this._engine);
        this._scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON));

        // Appeler setupWebXR et si cela échoue, créer une caméra statique
        this.setupWebXR().catch(() => {
            this.createFallbackCamera();
        });

        this.main();
    }

    // Méthode principale pour démarrer le jeu
    private async main(): Promise<void> {
        this.goToGame();
        // Boucle de rendu pour afficher la scène en continu
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
        });
    }

    // Configuration de l'expérience WebXR
    private async setupWebXR() {
        const platform = this._scene.getMeshByName('Floor_Roof_01');
        if (!platform) {
            console.error("Platform mesh not found. Cannot initialize WebXR.");
            this.createFallbackCamera();
            return;
        }

        try {
            this._xr = await this._scene.createDefaultXRExperienceAsync({
                floorMeshes: [platform],
                optionalFeatures: false,
                disableTeleportation: true
            });

            this._xr.baseExperience.sessionManager.onXRSessionInit.add(() => {
                console.log("WebXR session initialized!");
                if (this._fallbackUI) {
                    this._fallbackUI.rootContainer.dispose(); // Masquer ou supprimer l'UI fallback
                    this._fallbackUI = null;
                }
            });

            // Assurez-vous que la caméra WebXR est utilisée comme caméra active
            this._camera = this._xr.baseExperience.camera;
            this._scene.activeCamera = this._camera;

            // Configurez les propriétés de la caméra WebXR
            this._camera.checkCollisions = true;
            this._camera.applyGravity = true;
            this._camera.ellipsoid = new Vector3(1, 1, 1);
            this._camera.position = new Vector3(-10, 0.5, 52.5);
            this._camera.target = new Vector3(-10, 1.75, 51.5);

            // Désactivez l'UniversalCamera si elle existe
            const fallbackCamera = this._scene.getCameraByName("fallbackCamera");
            if (fallbackCamera) {
                fallbackCamera.dispose();
            }

            this._xr.pointerSelection.displayLaserPointer = false;
            this._xr.pointerSelection.displaySelectionMesh = false;
            this.setupPlayerBodyMesh();
            this.loadHandModels();

        } catch (error) {
            console.error("Error initializing WebXR:", error);
            this.createFallbackCamera();
        }
    }



    // Méthode pour créer une caméra statique en cas d'échec de WebXR
    private async createFallbackCamera(): Promise<void> {
        const fallbackCamera = new UniversalCamera("fallbackCamera", new Vector3(0, 1.6, -10), this._scene);
        fallbackCamera.setTarget(new Vector3(0, 180, 0));
        this._scene.activeCamera = fallbackCamera;

        // Désactiver toutes les interactions
        fallbackCamera.inputs.clear();

        // Créer un texte UI pour afficher le message
        this._fallbackUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const message = new TextBlock();

        let vrSupported = false;

        if (navigator.xr) {
            vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        }

        if (vrSupported) {
            message.text = "Activez le son en haut à gauche\nCliquez sur le bouton \nen bas à droite \npour entrer dans le \nLab Zone.";
        } else {
            message.text = "Athlete simulator est un jeu VR\n veuillez visiter ce site depuis votre casque VR.\nMerci !";
        }

        message.color = "black";
        message.fontSize = 75;
        message.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        message.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._fallbackUI.addControl(message);
    }


    // Configuration du maillage de corps du joueur
    private setupPlayerBodyMesh() {
        this.bodyMesh = MeshBuilder.CreateCylinder("playerBody", {
            diameter: 1,  // Diameter of the cylinder (human body width)
            height: 1.8,    // Height of the cylinder (approximate height of a human)
            tessellation: 16
        }, this._scene);

        // Position the mesh so that it aligns with the camera's position
        this.bodyMesh.position = new Vector3(0, 0, 0.1); // Adjust Y to make the cylinder's base at the camera's position
        this.bodyMesh.isVisible = false;  // Make the mesh invisible if not needed visually

        // Attach the mesh to the camera
        this.bodyMesh.parent = this._camera;

        // Enable collision detection on the mesh
        this.bodyMesh.checkCollisions = true;

        return this.bodyMesh;
    }

    // Chargement du modèle de gants
    private async loadGloveModel() {
        // Charger les modèles de gants
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "boxeglove.glb", this._scene);
        this.rightHandNode.setEnabled(false);
        this.leftHandNode.setEnabled(false);
        this.leftGlove = meshes[0];

        // Création des transform nodes pour attacher les gants
        const leftHand = new TransformNode("leftHand", this._scene);
        const rightHand = new TransformNode("rightHand", this._scene);

        leftHand.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(0),
            Tools.ToRadians(0),
            Tools.ToRadians(70)
        );
        rightHand.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(0),
            Tools.ToRadians(0),
            Tools.ToRadians(-70)
        );

        this.leftGlove.parent = leftHand;

        // Cloner le gant gauche pour créer le gant droit et appliquer l'effet miroir
        this.rightGlove = this.leftGlove.clone("rightGlove", rightHand, false);
        this.rightGlove.scaling.x *= -1;
        this.rightGlove.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(-90),
            Tools.ToRadians(180),
            Tools.ToRadians(0)
        );

        // Rotation pour que la paume du gant gauche soit tournée vers la droite
        this.leftGlove.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(-90),
            Tools.ToRadians(180),
            Tools.ToRadians(0)
        );

        // Redimensionner les modèles pour les adapter à la taille souhaitée
        this.leftGlove.scaling.scaleInPlace(0.6);
        this.rightGlove.scaling.scaleInPlace(0.6);

        // Vérifier si les contrôleurs sont déjà disponibles
        this.attachGlovesToControllers(leftHand, rightHand);

        this.rightGlove.checkCollisions = true;
        this.leftGlove.checkCollisions = true;
    }

    // Chargement des maillages du boxeur
    private loadMeshes() {
        this.boxerHead = this._scene.getMeshByName("Ch08_Body");
        this.boxerBody = this._scene.getMeshByName("Ch08_Hoodie");
        this.boxerRightGlove = this._scene.getMeshByName("RightGlove");
        this.boxerLeftGlove = this._scene.getMeshByName("LeftGlove");
    }

    // Initialisation des composants de jeu
    private async initializeGameComponents() {
        try {
            await this.loadGloveModel(); // This must successfully complete
            this.setupCollisionDetection(); // Only call this after gloves are confirmed loaded
            this.setupCollisionDetectionForBoxer();
        } catch (error) {
            console.error("Error during game component initialization:", error);
        }
    }

    // Configuration de la détection de collision pour les gants et le boxeur
    private setupCollisionDetection() {
        this.loadMeshes();

        const targets = [this.boxerHead, this.boxerBody, this.boxerRightGlove, this.boxerLeftGlove];
        targets.forEach(target => {
            this.setupGloveCollision(this.rightGlove, target, "right");
            this.setupGloveCollision(this.leftGlove, target, "left");
        });
    }

    // Configuration de la détection de collision pour le boxeur
    private setupCollisionDetectionForBoxer() {
        const targets = [this.bodyMesh, this.rightGlove, this.leftGlove];
        targets.forEach(target => {
            this.setupGloveCollision(this.boxerRightGlove || this.boxerLeftGlove, target, "glove");
        });
    }

    // Méthode pour configurer la détection de collision pour les gants
    private setupGloveCollision(glove, target, hand) {
        if (!glove.actionManager) {
            glove.actionManager = new ActionManager(this._scene);
        }

        glove.actionManager.registerAction(new ExecuteCodeAction({
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: { mesh: target, usePreciseIntersection: true }
        }, () => {
            if (this.isGloveStriking(glove.parent)) {
                console.log(`${hand} glove hit detected on ${target.name}!`);
                this.processHit(target.name, hand);
            }
        }));
    }

    // Méthode pour vérifier si le gant est en train de frapper
    private isGloveStriking(gloveNode) {
        const glovePosition = gloveNode.getAbsolutePosition();
        const cameraPosition = this._camera.position;
        const gloveToCamera = glovePosition.subtract(cameraPosition);
        const distanceToCamera = gloveToCamera.length();

        const minStrikeDistance = 0.5;
        const maxStrikeDistance = 2.0;
        const gloveDirection = gloveToCamera.normalize();
        const cameraDirection = this._camera.getForwardRay().direction;
        const dotProduct = Vector3.Dot(gloveDirection, cameraDirection);

        return distanceToCamera >= minStrikeDistance && distanceToCamera <= maxStrikeDistance && dotProduct > 0.5;
    }

    // Méthode pour traiter un coup porté à une cible
    private processHit(targetPart, hand) {
        console.log(`Hit on ${targetPart} by ${hand} hand`);
        let newState;
        let damage = 10;  // Assume some fixed damage for simplicity

        switch (targetPart) {
            case "RightGlove":
            case "LeftGlove":
                newState = Boxer.State.BLOCK;
                damage = 0;  // No damage should be applied for a block
                this.soundBlock.play();
                break;
            case "Ch08_Body":
                if (this._boxer.health > 20) {
                    newState = hand === "right" ? Boxer.State.RECEIVE_HEAD_PUNCH : Boxer.State.RECEIVE_BIG_HEAD;
                }
                else {
                    newState = hand === "right" ? Boxer.State.KNOCKED_OUT_BACK : Boxer.State.KNOCKED_OUT_FRONT;
                    this._boxer.stopMovementAndLookAt();
                }
                this.soundHit.play();
                break;
            case "Ch08_Hoodie":
                if (this._boxer.health > 20) {
                    newState = hand === "right" ? Boxer.State.RECEIVE_STOMACH_RIGHT : Boxer.State.RECEIVE_STOMACH_LEFT;
                }
                else {
                    newState = hand === "right" ? Boxer.State.KNOCKED_OUT_BACK : Boxer.State.KNOCKED_OUT_FRONT;
                    this._boxer.stopMovementAndLookAt();
                }
                this.soundHit.play();
                break;
            case "playerBody":
                if (!this.player.isInvulnerable) {
                    this.soundHit.play();
                    console.log("!!!!! BODY HIT !!!!!");
                }
                else {
                    console.log("INVULNERABLE");
                }
                break;
            case "__Root__":
                this.soundBlock.play();
                console.log("!!!!! BLOCKED  !!!!!");
            default:
                newState = Boxer.State.IDLE;  // Ensure there's always a valid state
                break;
        }
        // Log the state change and damage application attempt
        console.log(`Calling changeState with newState: ${newState}, damage: ${damage}, hand: ${hand}`);
        this._boxer.changeState(newState, damage, hand);
    }

    // Méthode pour mettre à jour le comportement du boxeur
    private updateBoxerBehavior() {
        let playerPosition = this._camera.position.clone();
        let boxerPosition = this.boxerMesh.position.clone();
        let distanceToPlayer = Vector3.Distance(playerPosition, boxerPosition);

        let directionToPlayer = playerPosition.subtract(boxerPosition);
        let targetVecNorm = Vector3.Normalize(directionToPlayer);

        // vérification pour empêcher le mouvement si le boxeur est KO ou étourdi
        if (this._boxer._isKO || this.currentState === Boxer.State.KNOCKED_OUT_BACK || this.currentState === Boxer.State.KNOCKED_OUT_FRONT || this.currentState === Boxer.State.STUNNED) {
            this._boxer.velocity = 0;
            return; // Ne rien faire d'autre si le boxeur est KO ou étourdi
        }

        if (distanceToPlayer <= 2.8) {
            this._boxer.velocity = 0;
            if (this._boxer.attackCooldown <= this._boxer.cooldownTimeAttack / 60) {
                this.player.isInvulnerable = false; // Player becomes vulnerable when the boxer starts an attack
                let randomIndex = Math.floor(Math.random() * this.attackStates.length);
                let attackState = this.attackStates[randomIndex];
                this._boxer.isAttacking = true;
                this._boxer.changeState(attackState);
                this._boxer.cooldownTimeAttack = 0;
            } else {
                if (this.currentState !== Boxer.State.IDLE) {
                    console.log("JE CHANGE STATE");
                    this._boxer.changeState(Boxer.State.IDLE);
                    this.currentState = Boxer.State.IDLE;
                    this.player.isInvulnerable = true; // Player becomes invulnerable when the boxer is idle
                }
            }
        } else {
            this._boxer.velocity = 0.03; // Vitesse de marche
            this.boxerMesh.translate(new Vector3(targetVecNorm._x, 0, targetVecNorm._z), this._boxer.velocity, Space.WORLD);
            this.boxerMesh.rotationQuaternion.x = 0;
            this.player.isInvulnerable = true;
            if (this.currentState !== Boxer.State.WALKING) {
                this._boxer.changeState(Boxer.State.WALKING);
                this.currentState = Boxer.State.WALKING;
            }
        }
        if (!this._boxer._isKO) {
            // Direction toujours vers le joueur
            let lookPosition = new Vector3(this._camera.position.x, boxerPosition.y, this._camera.position.z);
            this.boxerMesh.lookAt(lookPosition);
            if (this._boxer.velocity != 0) {
                distanceToPlayer = -this._boxer.velocity;
            }
        }
        console.log("K.O : ", this._boxer._isKO);
    }

    // Méthode pour gérer les attaques reçues par le joueur
    public GetAttacked() {
        if (this.player.playerHealth > 0) {
            this.player.playerHealth -= 10;  // Réduire la santé du joueur
            if (this.player.playerHealth <= 0) {
            }
        }
    }

    // Méthode pour attacher les gants aux contrôleurs
    private attachGlovesToControllers(leftHand: TransformNode, rightHand: TransformNode) {
        this._xr.input.onControllerAddedObservable.add(controller => {
            if (controller.inputSource.handedness === 'left') {
                leftHand.parent = controller.grip || controller.pointer;
            } else if (controller.inputSource.handedness === 'right') {
                rightHand.parent = controller.grip || controller.pointer;
            }
        });

        // Vérifier et attacher immédiatement si les contrôleurs sont déjà présents
        this._xr.input.controllers.forEach(controller => {
            if (controller.inputSource.handedness === 'left') {
                leftHand.parent = controller.grip || controller.pointer;
            } else if (controller.inputSource.handedness === 'right') {
                rightHand.parent = controller.grip || controller.pointer;
            }
        });
    }

    // Méthode pour charger les modèles de mains
    private async loadHandModels() {
        const { meshes: rightHandMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "handR.glb", this._scene);
        const { meshes: leftHandMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "handL.glb", this._scene);

        this.rightHandMesh = rightHandMeshes[0]; // Storing the first mesh as right hand
        this.leftHandMesh = leftHandMeshes[0]; // Storing the first mesh as left hand

        // Création des transform nodes pour attacher les mains
        this.rightHandNode = new TransformNode("rightHandNode", this._scene);
        this.leftHandNode = new TransformNode("leftHandNode", this._scene);

        this.rightHandMesh.parent = this.rightHandNode;
        this.leftHandMesh.parent = this.leftHandNode;

        // Activer la détection des collisions pour tous les maillages enfants de rightHandNode
        this.rightHandNode.getChildMeshes().forEach(mesh => {
            mesh.checkCollisions = true;
        });

        // Activer la détection des collisions pour tous les maillages enfants de leftHandNode
        this.leftHandNode.getChildMeshes().forEach(mesh => {
            mesh.checkCollisions = true;
        });

        // Redimensionner les modèles pour les adapter à la taille souhaitée
        this.rightHandNode.scaling.scaleInPlace(0.6);
        this.leftHandNode.scaling.scaleInPlace(0.6);

        this.rightHandMesh.position = new Vector3(0, 0, 0);
        this.rightHandMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 1);

        this.leftHandMesh.position = new Vector3(0, 0, 0);
        this.leftHandMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, -1);

        this.neutralPositionAnimationR = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_neutral_pose");
        this.swordHoldingPositionAnimationR = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_sword_holding_pose");
        this.indicatingPoseRAnimation = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_indicating_pose");

        this.neutralPositionAnimationL = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_neutral_poseL");
        this.swordHoldingPositionAnimationL = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_sword_holding_poseL");
        this.indicatingPoseLAnimation = this._scene.getAnimationGroupByName("vr_hand_male_armature|vr_indicating_poseL");

        // Setup initial animations
        this.neutralPositionAnimationR.start(true);
        this.neutralPositionAnimationL.start(true);

        // Attacher les TransformNode aux contrôleurs une fois ajoutés
        this._xr.input.onControllerAddedObservable.add(controller => {
            if (controller.inputSource.handedness === 'left') {
                this.leftHandNode.parent = controller.grip || controller.pointer;
            } else if (controller.inputSource.handedness === 'right') {
                this.rightHandNode.parent = controller.grip || controller.pointer;
            }
            controller.onMotionControllerInitObservable.add(motionController => {
                // Cacher le mesh du contrôleur pour ne voir que les mains
                if (motionController.rootMesh) {
                    motionController.rootMesh.isVisible = false;
                }
                this._leftControllerMesh = this._scene.getMeshById("oculus-touch-v3-left");
                this._rightControllerMesh = this._scene.getMeshById("oculus-touch-v3-right");
                this._leftControllerMesh.setEnabled(false);
                this._xr.pointerSelection.displayLaserPointer = false;
                this._xr.pointerSelection.displaySelectionMesh = false;
            });
        });

        this._createWristUI(); // Initialiser l'UI sur le poignet
    }

    // Méthode pour configurer les événements du contrôleur droit
    private setupRightControllerEvents(controller: WebXRInputSource) {
        const squeezeRightComponent = controller.motionController.getComponent("xr-standard-squeeze");
        const triggerComponent = controller.motionController.getComponent("xr-standard-trigger");

        squeezeRightComponent.onButtonStateChangedObservable.add(() => {
            if (controller.inputSource.handedness === 'right') {
                if (squeezeRightComponent.pressed) {
                    if (triggerComponent.pressed) {
                        this.swordHoldingPositionAnimationR.start(true, 1.0, this.swordHoldingPositionAnimationR.from, this.swordHoldingPositionAnimationR.to, false);
                    } else {
                        this.indicatingPoseRAnimation.start(true, 1.0, this.indicatingPoseRAnimation.from, this.indicatingPoseRAnimation.to, false);
                    }
                } else {
                    this.indicatingPoseRAnimation.stop();
                    this.swordHoldingPositionAnimationR.stop();
                    this.neutralPositionAnimationR.start(true, 1.0, this.neutralPositionAnimationR.from, this.neutralPositionAnimationR.to, false);
                }
            }
        });

        triggerComponent.onButtonStateChangedObservable.add(() => {
            if (controller.inputSource.handedness === 'right' && triggerComponent.pressed) {
                if (this._gun && this._gun._gunTaken) {
                    this._gun.shoot(); // Appeler la méthode shoot() de la classe Gun
                }
                if (squeezeRightComponent.pressed) {
                    this.swordHoldingPositionAnimationR.start(true, 1.0, this.swordHoldingPositionAnimationR.from, this.swordHoldingPositionAnimationR.to, false);
                }
            } else if (!triggerComponent.pressed && !squeezeRightComponent.pressed) {
                this.swordHoldingPositionAnimationR.stop();
                this.neutralPositionAnimationR.start(true, 1.0, this.neutralPositionAnimationR.from, this.neutralPositionAnimationR.to, false);
            }
        });

        if (this.gunAvailable && !this._gun._gunTaken) {
            const gunMesh = this._gun.getGunMesh();
            gunMesh.getChildMeshes().forEach(mesh => {
                if (!mesh.actionManager) {
                    mesh.actionManager = new ActionManager(this._scene);
                }

                this.rightHandNode.getChildMeshes().forEach(rightHandMesh => {
                    mesh.actionManager.registerAction(new ExecuteCodeAction({
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: { mesh: rightHandMesh, usePreciseIntersection: true }
                    }, () => {
                        if (!this._gun._gunTaken) {
                            console.log("ARME PRISE !");
                            this.grabGunWithRightHand();
                            this._gun._gunTaken = true;
                        }
                    }));
                });

                this._gun.getMagazineMesh().getChildMeshes().forEach(magMesh => {
                    mesh.actionManager.registerAction(new ExecuteCodeAction({
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: { mesh: magMesh, usePreciseIntersection: true }
                    }, () => {
                        if (!this._gun._magazineInserted) {
                            console.log("INSERTION CHARGEUR !");
                            this.insertMagazineIntoGun();
                            this._gun._magazineInserted = true;
                        }
                    }));
                });
            });
        }
    }

    // Méthode pour saisir le pistolet avec la main droite
    private grabGunWithRightHand() {
        // Vérifier si l'arme est déjà attachée
        if (this._gun.getGunMesh().parent === this.rightHandNode) {
            return;
        }

        // Cacher la main droite
        this.rightHandNode.getChildMeshes().forEach(mesh => mesh.setEnabled(false));

        // Attacher le pistolet au contrôleur droit
        this._gun.getGunMesh().parent = this.rightHandNode;
        this._gun.getGunMesh().scaling = new Vector3(1.7, 1.7, 1.7);
        this._gun.getGunMesh().position = new Vector3(0, -1.25, -1.25); // Ajuster selon vos besoins
        this._gun.getGunMesh().rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(0),
            Tools.ToRadians(90),
            Tools.ToRadians(45)
        );
    }

    // Méthode pour insérer le chargeur dans le pistolet
    private insertMagazineIntoGun() {
        console.log("chargement");
        const magazineMesh = this._gun.getMagazineMesh();

        // Détacher le chargeur de la main gauche
        magazineMesh.parent = null;

        this._gun.insertMagazine(); // Réinitialiser les munitions

        console.log("Chargeur inséré !");
        setTimeout(() => {
            magazineMesh.setEnabled(false); // Masquer le chargeur
            this.leftHandNode.getChildMeshes().forEach(mesh => mesh.setEnabled(true)); // Réactiver la main gauche
        }, 1000); // Délai de 1 seconde avant de masquer le chargeur et de réactiver la main gauche
    }

    // Méthode pour configurer les événements du contrôleur gauche
    private setupLeftControllerEvents(controller: WebXRInputSource) {
        const squeezeLeftComponent = controller.motionController.getComponent("xr-standard-squeeze");
        const triggerComponent = controller.motionController.getComponent("xr-standard-trigger");
        const yButton = controller.motionController.getComponent("y-button");

        if (squeezeLeftComponent) {
            squeezeLeftComponent.onButtonStateChangedObservable.add(() => {
                if (controller.inputSource.handedness === 'left') {
                    if (squeezeLeftComponent.pressed) {
                        if (triggerComponent && triggerComponent.pressed) {
                            this.swordHoldingPositionAnimationL.start(true, 1.0, this.swordHoldingPositionAnimationL.from, this.swordHoldingPositionAnimationL.to, false);
                        } else {
                            this.indicatingPoseLAnimation.start(true, 1.0, this.indicatingPoseLAnimation.from, this.indicatingPoseLAnimation.to, false);
                        }
                    } else {
                        this.indicatingPoseLAnimation.stop();
                        this.swordHoldingPositionAnimationL.stop();
                        this.neutralPositionAnimationL.start(true, 1.0, this.neutralPositionAnimationL.from, this.neutralPositionAnimationL.to, false);
                    }
                }
            });
        }

        if (triggerComponent) {
            triggerComponent.onButtonStateChangedObservable.add(() => {
                if (controller.inputSource.handedness === 'left' && triggerComponent.pressed && squeezeLeftComponent && squeezeLeftComponent.pressed) {
                    this.swordHoldingPositionAnimationL.start(true, 1.0, this.swordHoldingPositionAnimationL.from, this.swordHoldingPositionAnimationL.to, false);
                } else if (!triggerComponent.pressed && (!squeezeLeftComponent || !squeezeLeftComponent.pressed)) {
                    this.swordHoldingPositionAnimationL.stop();
                    this.neutralPositionAnimationL.start(true, 1.0, this.neutralPositionAnimationL.from, this.neutralPositionAnimationL.to, false);
                }
            });
        }

        if (yButton) {
            yButton.onButtonStateChangedObservable.add(() => {
                if (yButton.pressed && !this._yButtonPressed) {
                    this._yButtonPressed = true; // Marquez le bouton comme pressé
                    this.teleportToHome(); // Méthode de téléportation
                } else if (!yButton.pressed && this._yButtonPressed) {
                    this._yButtonPressed = false; // Réinitialisez le drapeau lorsque le bouton est relâché
                }
            });
        }

        if (this.magazineAvailable && !this._gun._magazineTaken) {
            const magazineMesh = this._gun.getMagazineMesh();
            magazineMesh.getChildMeshes().forEach(mesh => {
                if (!mesh.actionManager) {
                    mesh.actionManager = new ActionManager(this._scene);
                }

                this.leftHandNode.getChildMeshes().forEach(leftHandMesh => {
                    mesh.actionManager.registerAction(new ExecuteCodeAction({
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: { mesh: leftHandMesh, usePreciseIntersection: true }
                    }, () => {
                        if (!this._gun._magazineTaken) {
                            console.log("CHARGEUR PRIS !");
                            this.grabMagazineWithLeftHand();
                            this._gun._magazineTaken = true;
                        }
                    }));
                });
            });
        }
    }




    // Méthode pour saisir le chargeur avec la main gauche
    private grabMagazineWithLeftHand() {
        // Vérifier si le chargeur est déjà attaché
        if (this._gun._magazineInserted) {
            return;
        }

        // Cacher la main gauche
        this.leftHandNode.getChildMeshes().forEach(mesh => mesh.setEnabled(false));

        // Attacher le chargeur au contrôleur gauche
        this._gun.getMagazineMesh().parent = this.leftHandNode;
        this._gun.getMagazineMesh().scaling = new Vector3(1.7, 1.7, 1.7);
        this._gun.getMagazineMesh().position = new Vector3(0.25, -1.2, -0.6);
        this._gun.getMagazineMesh().rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(30),
            Tools.ToRadians(0),
            Tools.ToRadians(0)
        );
    }

    // Méthode de mise à jour principale
    private update() {
        this._scene.onReadyObservable.addOnce(() => {
            setInterval(() => {
                if (this._boxer.cooldownTimeAttack < 99999999) {
                    this._boxer.cooldownTimeAttack += 1;
                }
                else {
                    this._boxer.cooldownTimeAttack = 0;
                }
                if (this._boxer.cooldownTimeStun < 99999999) {
                    this._boxer.cooldownTimeStun += 1;
                }
                else {
                    this._boxer.cooldownTimeStun = 0;
                }

                // Gestion des entrées de contrôleur et téléportation
                this.handleControllerInput();
                this.teleporter();
                console.log(this.player.isInvulnerable);

                // Mise à jour du comportement du boxeur si le combat est commencé
                if (this.startFight) {
                    this.updateBoxerBehavior();
                }
                if (this.inKayak) {
                    this._paddle.update();
                    this.applyPaddleForceToCamera();
                    this._canoe.update();
                    this._rower.update();
                    this._rower2.update();
                    this._rower3.update();
                    this.updateRank(); // Met à jour le classement
                }
            }, 30);
        });
    }

    // Variable pour suivre la vitesse de la caméra
    private _velocityCamera: Vector3 = Vector3.Zero();
    private _cooldown: boolean = false; // Variable pour suivre l'état du cooldown

    // Méthode pour appliquer la force de la pagaie à la caméra
    private applyPaddleForceToCamera(): void {
        const friction = 0.98; // Augmentez le facteur de friction pour une décélération plus rapide
        const forceScale = 0.005; // échelle de la force appliquée

        if (this._paddle.isPaddleTouchingWater() && this._paddle.hasSignificantMovement()) {
            const paddleRotation = this._paddle.getPaddleRotation();

            // Jouer le son si ce n'est pas déjà fait pour ce coup de pagaie et si le cooldown est terminé
            if (!this._cooldown) {
                this.rowingSound.play();
                this._cooldown = true; // Marquer le cooldown comme actif
                setTimeout(() => {
                    this._cooldown = false; // Réinitialiser le cooldown après 2 secondes
                }, 2000);
            }

            console.log(`Paddle rotation: ${paddleRotation.toString()}`);

            let force = Vector3.Zero();
            if (paddleRotation.x > 0.518) { // Pagaie vers la gauche
                if (this._camera.position.x > 25) {
                    force = new Vector3(1.6, 0, -0.5).scale(forceScale); // force
                } else {
                    force = new Vector3(1.6, 0, 0).scale(forceScale); // force
                }
            } else if (paddleRotation.x < -0.369) { // Pagaie vers la droite
                if (this._camera.position.x > 25) {
                    force = new Vector3(1.6, 0, 0.5).scale(forceScale); // force
                } else {
                    force = new Vector3(0.8, 0, 0.8).scale(forceScale); // force
                }
            }

            // Mettre à jour la vitesse en ajoutant la force appliquée
            this._velocityCamera.addInPlace(force);
        }

        // Appliquer la vitesse à la position de la caméra
        this._camera.position.addInPlace(this._velocityCamera);

        // Appliquer la friction pour simuler la décélération
        this._velocityCamera.scaleInPlace(friction);

        // Mettre à jour la rotation du canoë en fonction de la position de la caméra
        if (this._camera.position.x > 25) {
            this._canoe.getCanoeMesh().rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(0),
                Tools.ToRadians(180),
                Tools.ToRadians(0)
            );
        } else {
            this._canoe.getCanoeMesh().rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(0),
                Tools.ToRadians(160),
                Tools.ToRadians(0)
            );
        }
    }

    // Gère les téléportations en fonction de la position de la caméra
    private teleporter() {
        if (!this.teleportCooldown && this.teleportableBoxing && this._camera.position.x > 0 && this._camera.position.z < 40 && this._camera.position.z > 29) {
            this.teleportableBoxing = false;
            this.teleportCooldown = true; // Activer le cooldown
            this.teleportToArena();

            setTimeout(() => {
                this.teleportCooldown = false; // Désactiver le cooldown après un délai
            }, 5000); // 5000 millisecondes = 5 secondes de cooldown
        }
        if (!this.teleportCooldown && this.teleportableRing &&
            this._camera.position.z >= -12.5 && this._camera.position.z <= -10.4 &&
            this._camera.position.x < 7.6) {
            this.teleportToRing();
            setTimeout(() => {
                this.teleportCooldown = false; // Désactiver le cooldown après un délai
            }, 5000); // 5000 millisecondes = 5 secondes de cooldown
        }
        if (!this.teleportCooldown && this.teleportableShootingRange &&
            this._camera.position.x > -0.490 &&
            this._camera.position.z <= 53.7 &&
            this._camera.position.z >= 43.23) {
            this.teleportableShootingRange = false;
            this.teleportCooldown = true; // Activer le cooldown
            this.teleportToShootingRange();

            setTimeout(() => {
                this.teleportCooldown = false; // Désactiver le cooldown après un délai
            }, 5000); // 5000 millisecondes = 5 secondes de cooldown
        }
        if (!this.teleportCooldown && this.teleportableKayak &&
            this._camera.position.x < -20 && this._camera.position.z < 40) {
            this.teleportToKayak();

            setTimeout(() => {
                this.teleportCooldown = false; // Désactiver le cooldown après un délai
            }, 5000); // 5000 millisecondes = 5 secondes de cooldown
        }
    }

    // Méthode pour téléporter le joueur au kayak
    private async teleportToKayak() {
        this.canMove = false;
        if (!this.rightHandNode || !this.leftHandNode) {
            console.error("Hand nodes are not initialized.");
            return;
        }
        this._paddle = new Paddle(this._scene, this._camera, this.rightHandNode, this.leftHandNode);
        this._canoe = new Canoe(this._scene, this._camera);
        this.inKayak = true;
        this.teleportableKayak = false;
        this.teleportableBoxing = false;
        this.teleportableRing = false;
        this.teleportableShootingRange = false;
        this.homeSound.stop();
        this.kayakSound.play();
        this.map.forEach(mesh => mesh.setEnabled(false));

        await this._kayak.loadKayakModel();
        this._kayak.spawnKayak();

        await this._canoe.loadCanoeModel();

        // Charger la pagaie et l'attacher aux mains
        await this._paddle.loadPaddleModel();

        // Charger et positionner le rameur 
        const waypoints: Vector3[] = [
            new Vector3(-230, -8, -200), // bug
            new Vector3(-118, -8, -160),
            new Vector3(46, -8, -85),
            new Vector3(435, -8, -90),
            new Vector3(480, -8, -90),
        ];

        const waypoints2: Vector3[] = [
            new Vector3(-240, -8, -188),
            new Vector3(-125, -8, -145),
            new Vector3(46, -8, -73),
            new Vector3(435, -8, -68),
            new Vector3(480, -8, -68)
        ];
        const waypoints3: Vector3[] = [
            new Vector3(-240, -8, -160),
            new Vector3(-125, -8, -125),
            new Vector3(46, -8, -68),
            new Vector3(435, -8, -40),
            new Vector3(480, -8, -40)
        ];

        // Générer des vitesses aléatoires pour chaque rameur
        const speed1 = 0.05 + Math.random() * (0.15 - 0.05);
        const speed2 = 0.05 + Math.random() * (0.15 - 0.05);
        const speed3 = 0.05 + Math.random() * (0.15 - 0.05);

        this._rower = new Rower(this._scene, waypoints, speed1);
        this._rower2 = new Rower(this._scene, waypoints2, speed2);
        this._rower3 = new Rower(this._scene, waypoints3, speed3);

        await this._rower.loadRowerModel();
        await this._rower2.loadRowerModel();
        await this._rower3.loadRowerModel();

        // Charger et positionner la tour Eiffel
        this.eiffelTower = new EiffelTower(this._scene);
        await this.eiffelTower.loadEiffelTowerModel();

        // Positionner la caméra et attacher le canoë
        this._camera.position.set(-498.52, -6.7, -271.225);
        this._camera.setTarget(new Vector3(-498.52, -6.91, -272));

        // Ajouter un léger délai avant de mettre à jour les positions pour s'assurer que tout est bien initialisé
        setTimeout(() => {
            this._canoe.updateCanoePosition();
            this._paddle.updatePaddlePosition();
            this.inKayak = true;
            this._createKayakHUD();
        }, 5000);
    }

    // Mise à jour du classement dans la course de kayak
    private updateRank(): void {
        const positions = [
            { name: "Player", x: this._camera.position.x },
            { name: "Rower1", x: this._rower.getPosition().x },
            { name: "Rower2", x: this._rower2.getPosition().x },
            { name: "Rower3", x: this._rower3.getPosition().x }
        ];

        positions.sort((a, b) => b.x - a.x);

        const playerRank = positions.findIndex(p => p.name === "Player") + 1;
        const rankTextMap = ["1st", "2nd", "3rd", "4th"];
        this.rankText.text = rankTextMap[playerRank - 1];
    }

    // Création de l'interface utilisateur pour le kayak
    private _createKayakHUD(): void {
        const leftHandNode = this._scene.getTransformNodeByName("leftHandNode");
        if (!leftHandNode) {
            console.error("Left hand node not found.");
            return;
        }

        const plane = MeshBuilder.CreatePlane("kayakUI", { width: 0.12, height: 0.2 }, this._scene);
        plane.position = new Vector3(0.065, 0, -0.3);
        plane.parent = leftHandNode;
        plane.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(180),
            Tools.ToRadians(90),
            Tools.ToRadians(90)
        );

        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);

        const mainContainer = new Rectangle();
        mainContainer.width = 1;
        mainContainer.height = 1;
        mainContainer.cornerRadius = 20;
        mainContainer.thickness = 10;
        mainContainer.color = "#1b4cad";
        mainContainer.background = "transparent";
        mainContainer.alpha = 1;
        advancedTexture.addControl(mainContainer);

        const title = new Rectangle();
        title.width = 1;
        title.height = "80px";
        title.background = "#1b4cad";
        title.color = "white";
        title.thickness = 0;
        title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        const titleText = new TextBlock();
        titleText.text = "Kayak Race";
        titleText.color = "white";
        titleText.fontSize = 100;
        title.addControl(titleText);
        mainContainer.addControl(title);

        const stackPanel = new StackPanel();
        stackPanel.isVertical = true;
        stackPanel.top = "40px";
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        mainContainer.addControl(stackPanel);

        const rankContainer = new Rectangle();
        rankContainer.width = "800px";
        rankContainer.height = "400px";
        rankContainer.cornerRadius = 20;
        rankContainer.color = "white";
        rankContainer.background = "#1b4cad";
        rankContainer.thickness = 2;
        rankContainer.paddingTop = "20px";
        rankContainer.paddingBottom = "10px";
        this.rankText.color = "white";
        this.rankText.fontSize = 400;
        rankContainer.addControl(this.rankText);
        stackPanel.addControl(rankContainer);

        plane.setEnabled(true); // Afficher le nouveau HUD
        this._wristKayakUIPlane = plane; // Stocker la référence au plan du Kayak HUD
    }

    // Méthode pour téléporter le joueur au stand de tir
    private teleportToShootingRange() {
        // Mettre à jour les variables
        this.canMove = false;
        this.teleportableToHome = true;
        this.inShootingRange = true;
        this.inKayak = false;
        this.teleportableKayak = false;
        this.teleportableBoxing = false;
        this.teleportableRing = false;
        this.teleportableShootingRange = false;
        // Désactiver la carte actuelle
        this.map.forEach(mesh => mesh.setEnabled(false));
        this.homeSound.stop();
        this._gun.gunSound.play();

        // Créer et afficher le stand de tir
        this._shootingRange.loadRangeModel().then(() => {
            this._shootingRange.spawnRange();
        });

        // Faire apparaître le pistolet et les munitions
        this._gun.loadGunModel().then(() => {
            this._gun.spawnGun(new Vector3(2.8, 0.97, 1.4));
        });
        this.gunAvailable = true; // Le pistolet est maintenant disponible
        this._gun.loadMagazineModel().then(() => {
            this._gun.spawnMagazine(new Vector3(2, 1, 1.2));
        });
        this.magazineAvailable = true;

        // Déplacer la caméra à la nouvelle position
        this._camera.position.x = 2.33;
        this._camera.position.y = 1.6;
        this._camera.position.z = 0.85;
        this._camera.target = new Vector3(3.33, 1.75, 0.91);

        this._wristUIPlane.setEnabled(true);
    }

    // Méthode pour téléporter le joueur dans le ring
    private teleportToRing() {
        this.canMove = true;
        this.startFight = true;
        this._camera.position.x = -13.50;
        this._camera.position.y = -0.2;
        this._camera.position.z = -2.65;
        this._camera.target = new Vector3(-12.73, -0.3, -3.17);
        this.hexagone();
        this.initializeGameComponents();
        this.teleportableSpawn = true;
        this.teleportableRing = false;
        this._boxer.changeState(Boxer.State.IDLE);
    }

    // Méthode pour téléporter le joueur dans l'arène
    private teleportToArena() {
        this.inArena = true;
        this.canMove = true;
        this.teleportableToHome = true;
        this.inShootingRange = false;
        this.inKayak = false;
        this.teleportableKayak = false;
        this.teleportableBoxing = false;
        this.teleportableRing = true;
        this.teleportableShootingRange = false;
        this.homeSound.stop();
        this.boxerSound.play();
        this.map.forEach(mesh => mesh.setEnabled(false));
        this._boxing = new Boxing(this._scene, this._canvas, this._engine, this._camera);
        this.boxerMesh = this._scene.getMeshByName("boxer");
        this.boxerMesh.position = new Vector3(-7, -2.3, -3);
        this.previousGlovePositions = {
            left: new Vector3(),
            right: new Vector3()
        };
        // Déplacer la caméra à la nouvelle position
        this._camera.position.x = 47;
        this._camera.position.y = -2.5;
        this._camera.position.z = -7.5;
        this._camera.target = new Vector3(-44, -0.92, -2.8);
        this._boxer.changeState(Boxer.State.WARMING_UP);
    }

    // Création d'un hexagone pour la détection de collision dans l'arène
    private hexagone() {
        // Définition des points de l'hexagone
        const hexPoints = [
            new Vector3(-7.03, 0, 4.43),
            new Vector3(2.72, 0, -1.22),
            new Vector3(2.72, 0, -12.55),
            new Vector3(-7.12, 0, -18.2),
            new Vector3(-17, 0, -12.5),
            new Vector3(-16.90, 0, -1.09)
        ];

        // Le dernier point pour fermer l'hexagone
        hexPoints.push(hexPoints[0]);

        //const lines = MeshBuilder.CreateLines("hexLines", { points: hexPoints }, this._scene);
        //lines.color = new Color3(1, 0, 0); // Couleur rouge pour la visibilité

        // Calculer les vecteurs normaux et les points de départ pour chaque côté de l'hexagone
        const hexNormals = [];
        const hexStartPoints = [];
        for (let i = 0; i < hexPoints.length - 1; i++) {
            let nextIndex = i + 1;
            let edge = hexPoints[nextIndex].subtract(hexPoints[i]);
            let normal = new Vector3(-edge.z, 0, edge.x).normalize();
            hexNormals.push(normal);
            hexStartPoints.push(hexPoints[i]);
        }

        this._scene.onBeforeRenderObservable.add(() => {
            let cameraPos = this._camera.position;

            for (let i = 0; i < hexNormals.length; i++) {
                let point = hexStartPoints[i];
                let normal = hexNormals[i];
                let toCamera = cameraPos.subtract(point);
                let dotProduct = Vector3.Dot(toCamera, normal);

                if (dotProduct > 0) {
                    // Téléportation à la position spécifiée
                    this._camera.position.x = -13.50;
                    this._camera.position.y = -0.2;
                    this._camera.position.z = -2.65;
                    this._camera.setTarget(new Vector3(-12.73, -0.3, -3.17));
                    break;
                }
            }
        });
    }

    // Génération de tous les maillages avec un fichier de carte glb
    private async createMap(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "SampleScene.glb", this._scene);
            let env = result.meshes[0];
            let allMeshes = env.getChildMeshes();

            allMeshes.forEach(mesh => {
                mesh.checkCollisions = true;
            });

            this.map = allMeshes;

            this.kayakSound = new Sound("kayakSound", "sounds/kayak.mp3", this._scene, null, {
                loop: true,
                autoplay: false,
                volume: 0.7
            });

            this.boxerSound = new Sound("boxerSound", "sounds/boxer.mp3", this._scene, null, {
                loop: true,
                autoplay: false,
                volume: 0.7
            });

            this.walkSound = new Sound("walkingSound", "sounds/walk.mp3", this._scene, null, {
                loop: true,
                autoplay: false,
                volume: 1
            });

            this.homeSound = new Sound("homeSound", "sounds/home.mp3", this._scene, null, {
                loop: true,
                autoplay: true,
                volume: 0.1
            });

            // Sky material and mesh setup...
            var skyboxMaterial = new SkyMaterial("skyMaterial", this._scene);
            skyboxMaterial.backFaceCulling = false;
            var skybox = Mesh.CreateBox("skyBox", 1000.0, this._scene);
            skybox.material = skyboxMaterial;
            skyboxMaterial.luminance = 0;
            this._skyboxMaterial = skyboxMaterial;
            skyboxMaterial.useSunPosition = false;
            skyboxMaterial.sunPosition = new Vector3(0, 100, 0);

            this.mapLoaded();  // Signal that the map is loaded
        } catch (error) {
            console.error("Failed to load the map:", error);
        }
    }

    // Méthode pour signaler que la carte est chargée
    private async mapLoaded() {
        console.log("Map and meshes are fully loaded.");
        this.setupWebXR();  // Now safe to setup WebXR
    }

    // Méthode pour créer le boxeur
    private createBoxer() {
        this._boxer = new Boxer(this._scene, this._canvas, this._Boxervelocity, "boxer", this.player);
    }

    // Lancement de la journée et de ses fonctions, vérifications, etc.
    public async day() {
        this._round.day();
    }

    // Lancement de FirstPersonController.ts et changement de scène vers celle du jeu
    private async goToGame() {
        this._state = State.GAME;
        this.player = new Player(100);
        this._shootingRange = new ShootingRange(this._scene);
        this._gun = new Gun(this._scene, this._shootingRange);
        this._kayak = new Kayak(this._scene);
        this.createBoxer();
        this.soundBlock = new Sound("block", "sounds/hitGlove.mp3", this._scene, null, {
            loop: false,
            autoplay: false,
            volume: 1
        });
        this.soundHit = new Sound("hit", "sounds/hit.mp3", this._scene, null, {
            loop: false,
            autoplay: false,
            volume: 1
        });
        this.rowingSound = new Sound("rowing", "sounds/rowing.mp3", this._scene, null, {
            loop: false,
            autoplay: false,
            volume: 1
        });
        this._scene.onPointerDown = (evt) => {
            if (evt.button === 0) //left click
            {
                this._engine.enterPointerlock();
            }
            if (evt.button === 1) //middle click
            {
                this._engine.exitPointerlock();
            }
        };
        //stable framerate for using gravity
        const framesPerSecond = 29;
        const gravity = -9.81; //earth one
        this._scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        this._scene.collisionsEnabled = true;
        //get rid of start scene, switch to gamescene and change states
        //this._scene.detachControl();
        this._engine.loadingUIText = "\nChargement en cours... \nLe chargement peut prendre quelques minutes selon votre connexion internet.\n Merci de patienter.";
        this._engine.displayLoadingUI();
        await this.createMap();
        await this._scene.whenReadyAsync();

        //AFTER LOADING

        setTimeout(() => {
            this._engine.hideLoadingUI();
        }, 1000);
        //this._scene.debugLayer.show();
        //this._scene.attachControl();
        this._round = new Round(this._scene, this._canvas, this._skyboxMaterial);
        var light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);
        this.day();
        const guiGame = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiGame.idealHeight = 50; //fit our fullscreen ui to this height
    }

    private async teleportToHome() {
        this.canMove = true;
        this.teleportableToHome = true;
        this.teleportableKayak = true;
        this.teleportableBoxing = true;
        this.teleportableRing = true;
        this.teleportableShootingRange = true;
        // Stop any currently playing music
        if (this.kayakSound && this.kayakSound.isPlaying) {
            this.kayakSound.stop();
        }
        if (this.boxerSound && this.boxerSound.isPlaying) {
            this.boxerSound.stop();
        }
        if (this._gun.gunSound && this._gun.gunSound.isPlaying) {
            this._gun.gunSound.stop();
        }
        if (this.homeSound && !this.homeSound.isPlaying) {
            this.homeSound.play();
        }
        // Dispose the current map if any
        if (this.inShootingRange) {
            this._shootingRange.disposeRange();
            this._gun.dispose();
            this.gunAvailable = false;
            this.magazineAvailable = false;
            this.inShootingRange = false;
        } else if (this.inKayak) {
            this.inKayak = false;
            if (this._wristKayakUIPlane) {
                this._wristKayakUIPlane.setEnabled(false);
            }
            this._kayak.dispose();
            this._canoe.disposeCanoe();
            this._paddle.disposePaddle();
            this._rower.disposeRower();
            this._rower2.disposeRower();
            this._rower3.disposeRower();
            this.eiffelTower.dispose();
        } else if (this.inArena) {
            await this._boxing.dispose();
            await this._boxer.dispose();
            this.createBoxer();
            this.teleportableRing = false;
        }
        // Reactivate all meshes of the main map
        this.map.forEach(mesh => mesh.setEnabled(true));
        // Teleport to the home position
        console.log("Teleporting to home position...");
        this._camera.position = new Vector3(-11.11, 1.5, 45.66);
        this._camera.setTarget(new Vector3(-12.73, -0.3, -3.17));
        console.log("Teleportation to home completed.");
    }


    // Création de l'interface utilisateur au poignet
    private _createWristUI(): void {
        const leftHandNode = this._scene.getTransformNodeByName("leftHandNode");
        if (!leftHandNode) {
            console.error("Left hand node not found.");
            return;
        }

        const plane = MeshBuilder.CreatePlane("wristUI", { width: 0.12, height: 0.2 }, this._scene);
        plane.position = new Vector3(0.065, 0, -0.3);
        plane.parent = leftHandNode;
        plane.rotationQuaternion = Quaternion.FromEulerAngles(
            Tools.ToRadians(180),
            Tools.ToRadians(90),
            Tools.ToRadians(90)
        );

        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);

        const mainContainer = new Rectangle();
        mainContainer.width = 1;
        mainContainer.height = 1;
        mainContainer.cornerRadius = 20;
        mainContainer.thickness = 10;
        mainContainer.color = "#1b4cad";
        mainContainer.background = "transparent";
        mainContainer.alpha = 1;
        advancedTexture.addControl(mainContainer);

        const title = new Rectangle();
        title.width = 1;
        title.height = "80px";
        title.background = "#1b4cad";
        title.color = "white";
        title.thickness = 0;
        title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        const titleText = new TextBlock();
        titleText.text = "HUD";
        titleText.color = "white";
        titleText.fontSize = 80;
        title.addControl(titleText);
        mainContainer.addControl(title);

        const stackPanel = new StackPanel();
        stackPanel.isVertical = true;
        stackPanel.top = "40px";
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        mainContainer.addControl(stackPanel);

        const scoreContainer = new Rectangle();
        scoreContainer.width = "400px";
        scoreContainer.height = "100px";
        scoreContainer.cornerRadius = 20;
        scoreContainer.color = "white";
        scoreContainer.background = "#1b4cad";
        scoreContainer.thickness = 2;
        scoreContainer.paddingTop = "20px";
        scoreContainer.paddingBottom = "10px";
        const scoreText = new TextBlock();
        scoreText.text = "Score: 0";
        scoreText.color = "white";
        scoreText.fontSize = 50;
        scoreContainer.addControl(scoreText);
        stackPanel.addControl(scoreContainer);

        const timeContainer = new Rectangle();
        timeContainer.width = "400px";
        timeContainer.height = "100px";
        timeContainer.cornerRadius = 20;
        timeContainer.color = "white";
        timeContainer.background = "#1b4cad";
        timeContainer.thickness = 2;
        timeContainer.paddingTop = "20px";
        timeContainer.paddingBottom = "10px";
        const timeText = new TextBlock();
        timeText.text = "Time: 180";
        timeText.color = "white";
        timeText.fontSize = 50;
        timeContainer.addControl(timeText);
        stackPanel.addControl(timeContainer);

        const ammoContainer = new Rectangle();
        ammoContainer.width = "400px";
        ammoContainer.height = "100px";
        ammoContainer.cornerRadius = 20;
        ammoContainer.color = "white";
        ammoContainer.background = "#1b4cad";
        ammoContainer.thickness = 2;
        ammoContainer.paddingTop = "20px";
        ammoContainer.paddingBottom = "10px";
        const ammoText = new TextBlock();
        ammoText.text = `Ammo: ${this._gun._ammoCount}`;
        ammoText.color = "white";
        ammoText.fontSize = 50;
        ammoContainer.addControl(ammoText);
        stackPanel.addControl(ammoContainer);

        this._extraShotPoints = [];
        const pointsContainer = new Rectangle();
        pointsContainer.width = 1;
        pointsContainer.height = "100px";
        pointsContainer.thickness = 0;
        pointsContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        pointsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        pointsContainer.top = "-200px";
        mainContainer.addControl(pointsContainer);

        const pointPositions = [0.15, 0.30, 0.45, 0.60, 0.75];
        for (let i = 0; i < 5; i++) {
            const point = new Ellipse();
            point.width = "100px";
            point.height = "75px";
            point.color = "white";
            point.thickness = 5; // l'épaisseur du contour
            point.background = "transparent";
            point.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            point.left = `${pointPositions[i] * 100}%`;
            this._extraShotPoints.push(point);
            pointsContainer.addControl(point);
        }

        const endGameMessageText = new TextBlock();
        endGameMessageText.text = "";
        endGameMessageText.color = "red";
        endGameMessageText.fontSize = 30;
        endGameMessageText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        endGameMessageText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        stackPanel.addControl(endGameMessageText);

        plane.setEnabled(false);
        this._wristUIPlane = plane;
        this._gun._setHUDReferences(plane, scoreText, timeText, ammoText, endGameMessageText, this._extraShotPoints);
    }

    // Méthode pour créer le canvas
    private _createCanvas(): HTMLCanvasElement {
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }
}
new App();
