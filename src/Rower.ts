import { Scene, AnimationGroup, Animation,SceneLoader, AbstractMesh, Vector3, TransformNode } from "@babylonjs/core";

export class Rower {
    private _scene: Scene;
    private _rowerMesh: AbstractMesh;
    private _currentWaypointIndex: number;
    private _waypoints: Vector3[];
    private _speed: number;
    private _targetNode: TransformNode;
    private _animationGroup: AnimationGroup;
    private _reversedAnimationGroup: AnimationGroup;


    constructor(scene: Scene, waypoints: Vector3[], speed: number = 0.05) {
        this._scene = scene;
        this._currentWaypointIndex = 0;
        this._waypoints = waypoints;
        this._speed = speed;
        this._targetNode = new TransformNode("targetNode", this._scene);
    }

    public async loadRowerModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "rower.glb", this._scene);
            this._rowerMesh = result.meshes[0];
            this._rowerMesh.name = "Rower";
            this._rowerMesh.position = new Vector3(-485, -8, -280);
            this._rowerMesh.scaling = new Vector3(1.5, 1.5, 1.5);
            setTimeout(() => {
                this._animationGroup = this._scene.getAnimationGroupByName("Boat_DoublePaddle_Row");
            }, 4000); // 4000 millisecondes = 5 secondes de cooldown

            console.log("Rower loaded successfully.");
        } catch (error) {
            console.error("Failed to load the rower:", error);
        }
    }

    public update(): void {
        if (!this._rowerMesh || this._currentWaypointIndex >= this._waypoints.length) return;
    
        const targetPosition = this._waypoints[this._currentWaypointIndex];
        const direction = targetPosition.subtract(this._rowerMesh.position).normalize();
        const moveStep = direction.scale(this._speed);
    
        this._rowerMesh.position.addInPlace(moveStep);
    
        // Check if the rower is close to the target position
        if (Vector3.Distance(this._rowerMesh.position, targetPosition) < this._speed) {
            this._currentWaypointIndex++;
        }
    
        // Orienter le rower vers la direction opposée au mouvement
        if (moveStep.length() > 0.01) {
            const oppositeDirection = this._rowerMesh.position.subtract(targetPosition).normalize();
            const oppositeTargetPosition = this._rowerMesh.position.add(oppositeDirection);
            this._rowerMesh.lookAt(oppositeTargetPosition);
    
            // Éviter les mouvements imprévus
            this._rowerMesh.rotation.x = 0;
            this._rowerMesh.rotation.z = 0;
        }
    }

    public getPosition(): Vector3 {
        return this._rowerMesh ? this._rowerMesh.position : Vector3.Zero();
    }

    public disposeRower(): void {
        if (this._rowerMesh) {
            this._rowerMesh.dispose();
        }
    }
}
