import { Scene, WebXRCamera, Tools, Vector3, SceneLoader, AbstractMesh, TransformNode, Quaternion } from "@babylonjs/core";

export class Paddle {
    private _scene: Scene;
    private _camera: WebXRCamera;
    private _paddleMesh: AbstractMesh;
    private _leftHand: TransformNode;
    private _rightHand: TransformNode;
    private _centerNode: TransformNode;
    private _previousRotation: Vector3;

    constructor(scene: Scene, camera: WebXRCamera, leftHand: TransformNode, rightHand: TransformNode) {
        this._scene = scene;
        this._camera = camera;
        this._leftHand = leftHand;
        this._rightHand = rightHand;
        this._centerNode = new TransformNode("paddleCenter", this._scene);
        this._centerNode.rotationQuaternion = new Quaternion();
        this._previousRotation = Vector3.Zero();
    }

    public async loadPaddleModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "paddle.glb", this._scene);
            this._paddleMesh = result.meshes[0];
            this._paddleMesh.name = "Paddle";
            this._paddleMesh.position = new Vector3(-0.95, -0.55, 0);
            this._paddleMesh.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(0),
                Tools.ToRadians(90),
                Tools.ToRadians(0)
            );
            this._paddleMesh.scaling = new Vector3(3, 3, 3);
            this._paddleMesh.parent = this._centerNode;

            // Initialiser la position de la pagaie
            this.updatePaddlePosition();
        } catch (error) {
            console.error("Failed to load the paddle:", error);
        }
    }

    public updatePaddlePosition(): void {
        if (this._centerNode) {
            const leftHandPosition = this._leftHand.getAbsolutePosition();
            const rightHandPosition = this._rightHand.getAbsolutePosition();
            const centerPosition = Vector3.Lerp(leftHandPosition, rightHandPosition, 0.5);
            
            this._centerNode.position.copyFrom(centerPosition);
            this._centerNode.lookAt(rightHandPosition);
        }
    }

    public update(): void {
        this.updatePaddlePosition();
        this.logPaddleRotation();
    }

    private logPaddleRotation(): void {
        const rotationQuaternion = this._centerNode.rotationQuaternion;
        if (rotationQuaternion) {
            const rotation = rotationQuaternion.toEulerAngles();
            //console.log(`Paddle center rotation: ${rotation.toString()}`);
        }
    }

    public getPaddleMesh(): AbstractMesh {
        return this._paddleMesh;
    }

    public getPaddleRotation(): Vector3 {
        const rotationQuaternion = this._centerNode.rotationQuaternion;
        if (rotationQuaternion) {
            return rotationQuaternion.toEulerAngles();
        }
        return Vector3.Zero();
    }

    public isPaddleTouchingWater(): boolean {
        const rotation = this.getPaddleRotation();
        return (
            (rotation.x >= 0.518 && rotation.x <= 1.5) ||  // Paddle left
            (rotation.x <= -0.369 && rotation.x >= -1.5)  // Paddle right
        );
    }

    public hasSignificantMovement(): boolean {
        const currentRotation = this.getPaddleRotation();
        const rotationDifference = currentRotation.subtract(this._previousRotation).length();
        this._previousRotation = currentRotation;
        return rotationDifference > 0.05; // marge d'erreur
    }

    public disposePaddle(): void {
        if (this._paddleMesh) {
            this._paddleMesh.dispose();
        }
    }
    
}
