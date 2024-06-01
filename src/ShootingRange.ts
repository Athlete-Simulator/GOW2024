import { Scene, Animation,TransformNode,StandardMaterial, Color3,MeshBuilder,ActionManager, Vector3, Mesh, SceneLoader, AbstractMesh } from "@babylonjs/core";

export class ShootingRange {
    private _scene: Scene;
    private _rangeMeshes: AbstractMesh[];
    private _targetNode: TransformNode;
    private _isAnimating: boolean = false;
    private _minPositionX: number = -12; // Position minimale de la cible
    private _startPositionX: number = 8; // Position initiale de la cible
    private _animationDuration: number = 1000; // Durée de l'animation en millisecondes


    constructor(scene: Scene) {
        this._scene = scene;
        this._rangeMeshes = [];
    }

    public async loadRangeModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "ShootingRange.glb", this._scene);
            this._rangeMeshes = result.meshes;

            this._rangeMeshes.forEach(mesh => {
                mesh.checkCollisions = true;
            });
            this.hideRange();

            this._targetNode = this._scene.getTransformNodeByName("Target 3") as TransformNode;
            this._targetNode.position.x = 8; // Position initiale de la cible

            this._addCenterDetectorToTarget(); //ajouter le détecteur

            console.log("Shooting range loaded successfully.");
        } catch (error) {
            console.error("Failed to load the shooting range:", error);
        }
    }

    public spawnRange(): void {
        this._rangeMeshes.forEach(mesh => mesh.setEnabled(true));
    }

    public hideRange(): void {
        this._rangeMeshes.forEach(mesh => mesh.setEnabled(false));
    }

    public getRangeMeshes(): AbstractMesh[] {
        return this._rangeMeshes;
    }

    private _addCenterDetectorToTarget(): void {
        const target = this._scene.getMeshByName("Target 3_primitive3");
        if (target) {
            const centerDetector = MeshBuilder.CreateBox("centerDetector", { size: 0.2 }, this._scene);
            centerDetector.position = new Vector3(0.1, -1.14, -0.002); // Positionner au centre de la cible
            centerDetector.scaling = new Vector3(0.1, 0.8, 0.5); 
            centerDetector.checkCollisions = true;
            centerDetector.parent = target; // Faire du détecteur un enfant de la cible
    
            // Rendre le détecteur visible et coloré pour le débogage
            centerDetector.isVisible = true;
            const centerDetectorMaterial = new StandardMaterial("centerDetectorMaterial", this._scene);
            centerDetectorMaterial.diffuseColor = new Color3(1, 0, 0); // Rouge pour une visibilité claire
            centerDetector.material = centerDetectorMaterial;
    
            centerDetector.actionManager = new ActionManager(this._scene);
        }
    }

    public animateTarget(): void {
        if (this._isAnimating || !this._targetNode) {
            return;
        }

        const newPositionX = Math.max(this._targetNode.position.x - 2, this._minPositionX);
        if (newPositionX === this._targetNode.position.x) {
            return; // Déjà à la position minimale
        }

        this._isAnimating = true;

        const animation = new Animation("targetMove", "position.x", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: this._targetNode.position.x },
            { frame: 30, value: newPositionX }
        ];
        animation.setKeys(keys);

        this._targetNode.animations = [animation];
        this._scene.beginAnimation(this._targetNode, 0, 30, false, 1, () => {
            this._isAnimating = false;
        });
    }

    public resetTarget(): void {
        const animation = new Animation("resetTarget", "position.x", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: this._targetNode.position.x },
            { frame: 30, value: this._startPositionX }
        ];
        animation.setKeys(keys);
    
        this._targetNode.animations = [animation];
        this._scene.beginAnimation(this._targetNode, 0, 30, false, 1, () => {
            this._isAnimating = false;
        });
    }

    public disposeRange(): void {
        this._rangeMeshes.forEach(mesh => {
            mesh.dispose();
        });
        this._rangeMeshes = [];
    }
    
    
}