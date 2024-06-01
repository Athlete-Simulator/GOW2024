import { Scene, AbstractMesh, SceneLoader } from "@babylonjs/core";

export class Kayak {
    private _scene: Scene;
    private _kayakMeshes: AbstractMesh[];

    constructor(scene: Scene) {
        this._scene = scene;
        this._kayakMeshes = [];
    }

    public async loadKayakModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "./models/", "kayak.glb", this._scene);
            this._kayakMeshes = result.meshes;

            this._kayakMeshes.forEach(mesh => {
                mesh.checkCollisions = true;
            });
            this.hideKayak();

            console.log("Kayak loaded successfully.");
        } catch (error) {
            console.error("Failed to load the kayak:", error);
        }
    }

    public spawnKayak(): void {
        this._kayakMeshes.forEach(mesh => mesh.setEnabled(true));
    }

    public hideKayak(): void {
        this._kayakMeshes.forEach(mesh => mesh.setEnabled(false));
    }

    public getKayakMeshes(): AbstractMesh[] {
        return this._kayakMeshes;
    }

    public dispose(): void {
        this._kayakMeshes.forEach(mesh => {
            mesh.setEnabled(false); // Désactiver le maillage
            mesh.dispose(); // Libérer les ressources du maillage
        });
        this._kayakMeshes = []; // Réinitialiser la liste des maillages
        console.log("Kayak disposed successfully.");
    }
}
