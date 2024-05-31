import { Scene, SceneLoader, AbstractMesh, Vector3, Quaternion, Tools } from "@babylonjs/core";

export class EiffelTower {
    private _scene: Scene; // Scène de la simulation
    private _eiffelTowerMesh: AbstractMesh; // Maillage de la Tour Eiffel

    constructor(scene: Scene) {
        this._scene = scene; // Initialisation de la scène
    }

    // Méthode pour charger le modèle 3D de la Tour Eiffel
    public async loadEiffelTowerModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "tour.glb", this._scene);
            this._eiffelTowerMesh = result.meshes[0];
            this._eiffelTowerMesh.name = "EiffelTower"; // Nommer le maillage pour une identification facile
            this._eiffelTowerMesh.scaling = new Vector3(8, 8, 8); // Échelle du modèle
            this._eiffelTowerMesh.position = new Vector3(425, 1, 56); // Position initiale du modèle

            // Initialiser la rotation si nécessaire
            this._eiffelTowerMesh.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(0),
                Tools.ToRadians(0),
                Tools.ToRadians(0)
            );

            console.log("Eiffel Tower loaded successfully.");
        } catch (error) {
            console.error("Failed to load the Eiffel Tower:", error);
        }
    }

    // Méthode pour obtenir le maillage de la Tour Eiffel
    public getEiffelTowerMesh(): AbstractMesh {
        return this._eiffelTowerMesh;
    }
}
