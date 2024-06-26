import { Animation, Tools, Light, RayHelper, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int, _TimeToken, CameraInputTypes } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";

export class Round{
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _light1: Light;
    private _skyboxMaterial: SkyMaterial;
    private _ambianceMusic: Sound;
    private _dayAmbianceMusic: Sound;

    constructor(scene: Scene, canvas: HTMLCanvasElement, skyboxMaterial: SkyMaterial ) {
        this._scene = scene;
        this._canvas = canvas;
        this._skyboxMaterial = skyboxMaterial;
    }
    
    //day settings
    public async day(){
            this._skyboxMaterial.luminance = 1;
            this._skyboxMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
            this._skyboxMaterial.sunPosition = new Vector3(0, 100, 0);
    }
 
    //night settings
    public async night(){
            this._skyboxMaterial.luminance = 0;
            this._skyboxMaterial.useSunPosition = false;
    }
}