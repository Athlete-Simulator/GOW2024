import { UtilityLayerRenderer, Engine, TransformNode, WebXRAbstractMotionController, int, KeyboardEventTypes, SceneOptimizer, SceneOptimizerOptions, Tools, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, AnimationGroup, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material, float, Light, AbstractMesh } from "@babylonjs/core";
import { SkyMaterial } from '@babylonjs/materials';
import { WebXRCamera, WebXRSessionManager, WebXRInputSource } from '@babylonjs/core/XR';

export class Boxing {
    private _scene: Scene; // Scène de la simulation
    private _canvas: HTMLCanvasElement; // Canvas HTML pour le rendu
    private _engine: Engine; // Moteur de rendu
    private _camera: WebXRCamera; // Caméra WebXR
    private _meshes: AbstractMesh[]; // Array to hold all meshes

    constructor(scene: Scene, canvas: HTMLCanvasElement, engine: Engine, camera: WebXRCamera) {
        this._scene = scene;
        this._canvas = canvas;
        this._engine = engine;
        this._camera = camera; // Initialisation de la caméra
        this._meshes = []; // Initialize the meshes array
        this.createMapAndDisplayLoading(); // Création de la carte et affichage de l'interface de chargement
    }

    // Méthode pour créer la carte de boxe
    private async createMapBoxing(): Promise<void> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "boxing_arena.glb", this._scene);
        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        // Activation des collisions pour tous les maillages et ajout à _meshes
        allMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            this._meshes.push(mesh); // Ajout du maillage à _meshes
        });
    }

    // Méthode pour créer la carte et afficher l'interface de chargement
    private async createMapAndDisplayLoading() {
        this._engine.displayLoadingUI(); // Affiche l'interface de chargement
        await this.createMapBoxing(); // Crée la carte de boxe
        await this._scene.whenReadyAsync(); // Attend que la scène soit prête
        this._engine.hideLoadingUI(); // Cache l'interface de chargement
    }

    public dispose(): void {
        this._meshes.forEach(mesh => {
            mesh.dispose();
        });
        this._meshes = [];
    }
}
