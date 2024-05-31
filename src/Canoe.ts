import { Scene, WebXRCamera, Vector3, SceneLoader, AbstractMesh } from "@babylonjs/core";
import { Paddle } from "./Paddle";

export class Canoe {
    private _scene: Scene; // Scène de la simulation
    private _camera: WebXRCamera; // Caméra WebXR
    private _canoeMesh: AbstractMesh; // Maillage du canoë
    private _paddle: Paddle; // Pagaie utilisée pour déplacer le canoë

    constructor(scene: Scene, camera: WebXRCamera, paddle: Paddle) {
        this._scene = scene;
        this._camera = camera;
        this._paddle = paddle;
    }

    // Méthode pour charger le modèle 3D du canoë
    public async loadCanoeModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "canoe.glb", this._scene);
            this._canoeMesh = result.meshes[0];
            this._canoeMesh.name = "Canoe";

            this._canoeMesh.scaling = new Vector3(2, 2, 2); // Échelle du canoë

            // Position initiale du canoë
            this.updateCanoePosition();
        } catch (error) {
            console.error("Failed to load the canoe:", error);
        }
    }

    // Méthode pour mettre à jour la position du canoë en fonction de la position de la caméra
    public updateCanoePosition(): void {
        if (this._canoeMesh) {
            this._canoeMesh.position = new Vector3(
                this._camera.position.x + 0.2,
                this._camera.position.y - 1.1,
                this._camera.position.z,
            );
        }
    }

    // Méthode pour obtenir le maillage du canoë
    public getCanoeMesh(): AbstractMesh {
        return this._canoeMesh;
    }

    // Méthode pour mettre à jour le canoë (appelée à chaque frame)
    public update(): void {
        this.updateCanoePosition();
    }
}
