import { Scene, Mesh, Ray, Sound, PointParticleEmitter, Color4, ParticleSystem, Animation, Texture, PointLight, RayHelper, StandardMaterial, Color3, Vector3, Tools, AbstractMesh, PhysicsImpostor, ActionManager, ExecuteCodeAction, MeshBuilder, SceneLoader, TransformNode, Quaternion } from "@babylonjs/core";
import { ShootingRange } from "./ShootingRange";
import { AdvancedDynamicTexture, Control, TextBlock, Ellipse } from "@babylonjs/gui";


export class Gun {
    private _scene: Scene;
    private _gunMesh: AbstractMesh;
    private _shootingRange: ShootingRange; // Référence à la shooting range
    private _gunNode: TransformNode;
    private _magazineMesh: AbstractMesh;
    private _magazineNode: TransformNode;
    public _ammoCount: number = 0;
    private _maxAmmo: number = 10; // Nombre maximum de balles par chargeur
    public _magazineInserted: boolean = false; // Indicateur pour vérifier si le chargeur est inséré
    private _lastShotTime: number = 0; // Indicateur pour vérifier le temps du dernier tir
    private _shootCooldown: number = 200; // Délai entre les tirs en millisecondes
    private _muzzleSmoke: ParticleSystem;


    private _reloadSound: Sound;
    private _fireSound: Sound;

    private _yesLogo: Mesh;
    private _noLogo: Mesh;

    private _score: number = 0;
    private _timeLeft: number = 180; // 180 secondes pour le jeu
    private _scoreText: TextBlock;
    private _isGameOver: boolean = false;
    private _timerInterval: number;

    public _homeButtonMesh: Mesh;
    public _wristUIPlane: Mesh;
    private _timeText: TextBlock;
    private _ammoText: TextBlock;
    private _endGameMessageText: TextBlock;

    private _extraShotsLeft: number = 5; // Nombre de tirs supplémentaires
    public _hudPoints: Mesh[] = []; // Liste des points rouges et verts sur le HUD du poignet
    private _muzzleFlame: ParticleSystem;
    private _muzzleFlashLight: PointLight;
    private _extraShotIndex: number = 0;

    public _magazineTaken: boolean = false;
    public _gunTaken: boolean = false;
    private _extraShotPoints: Ellipse[];
    private _extraShotsStarted: boolean = false;
    private emptySound: Sound
    public gunSound: Sound;

    constructor(scene: Scene, shootingRange: ShootingRange) {
        this._scene = scene;
        this._shootingRange = shootingRange;
        this._loadSounds();

        this._extraShotPoints = []; // Initialiser le tableau des points supplémentaires
    }

    public _setHUDReferences(homeButtonMesh: Mesh, wristUIPlane: Mesh, scoreText: TextBlock, timeText: TextBlock, ammoText: TextBlock, endGameMessageText: TextBlock, extraShotPoints: Ellipse[]): void {
        this._homeButtonMesh = homeButtonMesh;
        this._wristUIPlane = wristUIPlane;
        this._scoreText = scoreText;
        this._timeText = timeText;
        this._ammoText = ammoText;
        this._endGameMessageText = endGameMessageText;
        this._extraShotPoints = extraShotPoints; // Ajouter cette ligne
    }



    private _loadSounds(): void {
        this._reloadSound = new Sound("reloadSound", "./sounds/m9Reload.mp3", this._scene, null, { loop: false, autoplay: false });
        this._fireSound = new Sound("fireSound", "./sounds/m9Fire.mp3", this._scene, null, { loop: false, autoplay: false });
        this.gunSound = new Sound("gunSound", "sounds/gunSound.mp3", this._scene, null, { loop: true, autoplay: false });
        this.emptySound = new Sound("emptySound", "sounds/emptyammo.mp3", this._scene, null, { loop: false, autoplay: false });
        this.gunSound.setVolume(0.2);
    }

    public async loadGunModel(): Promise<void> {
        // Charger le modèle de gun
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "gun.glb", this._scene);
        this._gunMesh = result.meshes[0];
        this._gunMesh.name = "Gun";

        // Redimensionner le modèle pour l'adapter à la taille souhaitée
        this._gunMesh.scaling = new Vector3(1, 1, 1);
        this._gunMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);

        // Ajouter des propriétés de collision et de gravité
        this._gunMesh.checkCollisions = true;
        this._gunMesh.physicsImpostor = new PhysicsImpostor(this._gunMesh, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, this._scene);

        this._gunMesh.getChildMeshes().forEach(mesh => {
            mesh.checkCollisions = true;
        });

        this._gunMesh.setEnabled(false); // Désactiver par défaut

        this._gunMesh.actionManager = new ActionManager(this._scene);

        this._initializeMuzzleEffects(); // Initialiser la flamme et le flash du canon

    }

    public spawnGun(position: Vector3): void {
        if (this._gunMesh) {
            this._gunMesh.position = position;
            this._gunMesh.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(90),
                Tools.ToRadians(180),
                Tools.ToRadians(0)
            );
            this._gunMesh.setEnabled(true);
        } else {
            console.error("Gun model not loaded. Call loadGunModel() before spawning the gun.");
        }
    }

    public hideGun(): void {
        if (this._gunMesh) {
            this._gunMesh.setEnabled(false);
        }
    }

    public getGunMesh(): AbstractMesh {
        return this._gunMesh;
    }

    public async loadMagazineModel(): Promise<void> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "M9_Magazine.glb", this._scene);
        this._magazineMesh = result.meshes[0];
        this._magazineMesh.name = "Magazine";
        this._magazineMesh.scaling.scaleInPlace(1);
        this._magazineMesh.checkCollisions = true;
        this._magazineMesh.physicsImpostor = new PhysicsImpostor(this._magazineMesh, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, this._scene);
        this._magazineMesh.getChildMeshes().forEach(mesh => {
            mesh.checkCollisions = true;
        });

        this._magazineMesh.setEnabled(false);
        this._magazineMesh.actionManager = new ActionManager(this._scene);
    }

    public spawnMagazine(position: Vector3): void {
        if (this._magazineMesh) {
            this._magazineMesh.position = position;
            this._magazineMesh.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(90),
                Tools.ToRadians(120),
                Tools.ToRadians(0)
            );
            this._magazineMesh.setEnabled(true);
        } else {
            console.error("Magazine model not loaded. Call loadMagazineModel() before spawning the magazine.");
        }
    }

    public hideMagazine(): void {
        if (this._magazineMesh) {
            this._magazineMesh.setEnabled(false);
        }
    }

    public getMagazineMesh(): AbstractMesh {
        return this._magazineMesh;
    }

    public insertMagazine(): void {
        if(!this._yesLogo){
            this._createValidationLogos();
        }
        if (!this.gunSound.isPlaying) {
            this.gunSound.play();
        }
        this._magazineTaken = false;
        console.log("Chargeur inséré !");
        this._ammoCount = this._maxAmmo; // Réinitialiser les munitions
        this._magazineInserted = true; // Mettre à jour l'indicateur de chargeur inséré
        this._reloadSound.play(); // Jouer le son de rechargement

        if (this._isGameOver || this._timeLeft === 180) {
            this._startGame(); // Démarrer le jeu si le chargeur est inséré après la fin du jeu
        }
    }


    public shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this._lastShotTime < this._shootCooldown) {
            return;
        }
        this._lastShotTime = currentTime;

        if (!this._gunMesh || !this._magazineInserted) {
            console.log("Le pistolet n'est pas prêt ou le chargeur n'est pas inséré.");
            return;
        }

        if (this._ammoCount <= 0) {
            this.emptySound.play();
            this._magazineInserted = false
            this.spawnMagazine(new Vector3(2, 1, 0.8));
            this._magazineMesh.scaling = new Vector3(1, 1, 1);
            console.log("Pas de munitions !");
            return;
        }

        if (this._ammoText) {
            this._ammoText.text = `Ammo: ${this._ammoCount}`;
        }

        this._ammoCount--;
        console.log(`Balles restantes: ${this._ammoCount}`);

        this._fireSound.play();

        const muzzleOffset = new Vector3(0.14, 0.06, 0.015);
        const start = this._gunMesh.getChildMeshes()[3].getAbsolutePosition().add(muzzleOffset);
        const forward = this._gunMesh.getChildMeshes()[3].forward;
        const end = start.add(forward.scale(100));

        const ray = new Ray(start, forward, 100);
        const hit = this._scene.pickWithRay(ray);

        // Activer et positionner la flamme et le flash de tir
        this._activateMuzzleEffects(start, forward);

        if (hit.pickedMesh) {
            console.log("Objet touché :", hit.pickedMesh.name);
            this.createImpact(hit.pickedPoint);
            if (hit.pickedMesh.name === "centerDetector") {
                console.log("Cible touchée en son centre !");
                this._showYesLogo();
                this._shootingRange.animateTarget();
                this._increaseScore(1);
                if (this._score > 11 || (this._score == 11 && this._extraShotsStarted)) {
                    this._handleExtraShot(true);
                } else if (this._score == 11 && !this._extraShotsStarted) {
                    this._extraShotsStarted = true;
                }
            } else {
                this._showNoLogo();
                if (this._score >= 11 && this._extraShotsStarted) {
                    this._handleExtraShot(false);
                }
            }
        } else {
            console.log("Aucun objet touché.");
            this._showNoLogo();
            if (this._score >= 11 && this._extraShotsStarted) {
                this._handleExtraShot(false);
            }
        }

        // Lancer l'animation M9Hammer et ajouter un recul de l'arme
        this._playGunAnimation();
        this._recoilGun();
    }


    // Méthode pour activer et positionner la flamme et le flash de tir
    private _activateMuzzleEffects(start: Vector3, forward: Vector3): void {
        // Positionner et activer la flamme du canon
        this._muzzleFlame.emitter = start.add(forward.scale(0.01)); // Positionner légèrement devant le canon
        this._muzzleFlame.start();

        // Activer la lumière du flash du canon
        this._muzzleFlashLight.position = start;
        this._muzzleFlashLight.intensity = 4;

        // Activer les particules de fumée
        this._muzzleSmoke.emitter = start.add(forward.scale(0.03)); // Positionner légèrement devant le canon
        this._muzzleSmoke.start();

        setTimeout(() => {
            this._muzzleFlame.stop();
            this._muzzleFlashLight.intensity = 0;
            this._muzzleSmoke.stop();
        }, 100); // La flamme, la lumière et la fumée disparaissent après 100 ms
    }


    // Méthode pour jouer l'animation de recul de l'arme
    private _recoilGun(): void {
        const recoilAnimation = new Animation("recoil", "position.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: this._gunMesh.position.z },
            { frame: 5, value: this._gunMesh.position.z - 0.1 },
            { frame: 10, value: this._gunMesh.position.z }
        ];
        recoilAnimation.setKeys(keys);

        this._gunMesh.animations = [recoilAnimation];
        this._scene.beginAnimation(this._gunMesh, 0, 10, false);
    }

    // Méthode pour jouer l'animation du marteau du pistolet
    private _playGunAnimation(): void {
        const hammerAnimation = this._scene.getAnimationGroupByName("M9Hammer");
        if (hammerAnimation) {
            hammerAnimation.start(true, 1.0, hammerAnimation.from, hammerAnimation.to, false);
        }
    }


    public updateScore(score: number): void {
        if (this._scoreText) {
            this._scoreText.text = `Score: ${score}`;
        }
    }

    public updateTime(time: number): void {
        if (this._timeText) {
            this._timeText.text = `Time: ${time}`;
        }
    }

    public updateAmmo(ammo: number): void {
        this._ammoCount = ammo;
        if (this._ammoText) {
            this._ammoText.text = `Ammo: ${ammo}`;
        }
    }

    private createImpact(position: Vector3): void {
        // Créez une petite sphère pour représenter l'impact
        const impact = MeshBuilder.CreateSphere("impact", { diameter: 0.05 }, this._scene);
        impact.position = position;

        // Créez un matériau de couleur noire pour simuler un trou
        const impactMaterial = new StandardMaterial("impactMaterial", this._scene);
        impactMaterial.diffuseColor = new Color3(0, 0, 0); // Couleur noire
        impactMaterial.specularColor = new Color3(0, 0, 0); // Pas de réflexion
        impact.material = impactMaterial;

        setTimeout(() => {
            impact.dispose();
        }, 500); // L'impact disparaît après 1 seconde
    }




    public _createValidationLogos(): void {
        const gunDesk = this._scene.getTransformNodeById("Gun Desk (3)");
        if (gunDesk) {
            // Créer le logo "yes"
            this._yesLogo = MeshBuilder.CreatePlane("yesLogo", { size: 1 }, this._scene);
            this._yesLogo.position = new Vector3(-0.1, 0.03, 0); // Placer le logo légèrement au-dessus de la table
            this._yesLogo.scaling = new Vector3(0.2, -0.2, 0.2);
            this._yesLogo.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(90),
                Tools.ToRadians(90),
                Tools.ToRadians(0)
            );
            this._yesLogo.parent = gunDesk; // Faire du logo un enfant de la table
            const yesLogoMaterial = new StandardMaterial("yesLogoMaterial", this._scene);
            yesLogoMaterial.diffuseTexture = new Texture("./sprites/yes.png", this._scene);
            this._yesLogo.material = yesLogoMaterial;
            this._yesLogo.setEnabled(false); // Masquer par défaut

            // Créer le logo "no"
            this._noLogo = MeshBuilder.CreatePlane("noLogo", { size: 1 }, this._scene);
            this._noLogo.position = new Vector3(-0.1, 0.03, 0); // Placer le logo légèrement au-dessus de la table
            this._noLogo.scaling = new Vector3(0.2, 0.2, 0.2);
            this._noLogo.rotationQuaternion = Quaternion.FromEulerAngles(
                Tools.ToRadians(90),
                Tools.ToRadians(0),
                Tools.ToRadians(0)
            );
            this._noLogo.parent = gunDesk; // Faire du logo un enfant de la table
            const noLogoMaterial = new StandardMaterial("noLogoMaterial", this._scene);
            noLogoMaterial.diffuseTexture = new Texture("./sprites/no.png", this._scene);
            this._noLogo.material = noLogoMaterial;
            this._noLogo.setEnabled(false); // Masquer par défaut
        }
    }

    private _showYesLogo(): void {
        if (this._yesLogo) {
            this._yesLogo.setEnabled(true);
            this._noLogo.setEnabled(false);
            setTimeout(() => {
                this._yesLogo.setEnabled(false);
            }, 2000); // Masquer le logo après 1 seconde
        }
    }

    private _showNoLogo(): void {
        if (this._noLogo) {
            this._noLogo.setEnabled(true);
            this._yesLogo.setEnabled(false);
            setTimeout(() => {
                this._noLogo.setEnabled(false);
            }, 2000); // Masquer le logo après 1 seconde
        }
    }

    private _startGame(): void {
        this._score = 0;
        this._timeLeft = 180;
        this._isGameOver = false;
        this._magazineInserted = true;
        this._ammoCount = this._maxAmmo;

        if (this._scoreText) {
            this._scoreText.text = "Score: 0";
        } else {
            console.error("_scoreText is not defined");
        }

        if (this._timeText) {
            this._timeText.text = "Time Left: 180";
        } else {
            console.error("_timerText is not defined");
        }

        // Réinitialiser les points de score supplémentaires
        for (let i = 0; i < this._extraShotPoints.length; i++) {
            this._extraShotPoints[i].background = "transparent";
            this._extraShotPoints[i].color = "white";
        }

        this._timerInterval = window.setInterval(() => {
            if (this._timeLeft > 0) {
                this._timeLeft -= 1;
                if (this._timeText) {
                    this._timeText.text = "Time Left: " + this._timeLeft;
                } else {
                    console.error("_timerText is not defined");
                }
            } else {
                if (!this._isGameOver) { // Vérifier si le jeu est déjà terminé
                    this._endGame();
                }
            }
        }, 1000); // Décompte chaque seconde
    }



    private _endGame(): void {
        if (this._isGameOver) {
            return; // Évitez de terminer le jeu plusieurs fois
        }
        this._isGameOver = true;
        window.clearInterval(this._timerInterval);

        // Mettre à jour le message de fin de jeu sur le HUD
        if (this._endGameMessageText) {
            this._endGameMessageText.text = "Game Over! Your Score: " + this._score;
        }

        // Réinitialiser la cible
        this._shootingRange.resetTarget();

        // Réinitialiser le chargeur
        this._magazineInserted = false;
        this._ammoCount = 0;
        this._magazineMesh.setEnabled(true);
        console.log("Séquence de tirs supplémentaires terminée.");
        this._extraShotIndex = 0;
        this._gunTaken = false;
        this._endGame()
        this._gunMesh.parent = null;
        this._gunMesh.scaling = new Vector3(1, 1, 1);
        this._magazineMesh.parent = null;
        this._magazineMesh.scaling = new Vector3(1, 1, 1);
        this.spawnGun(new Vector3(2.8, 0.97, 1.4));
        this.spawnMagazine(new Vector3(2, 1, 0.8));
        this._scene.getTransformNodeByName("rightHandNode").getChildMeshes().forEach(mesh => mesh.setEnabled(true)); // Réapparaître la main droite
        this.gunSound.stop();
    }


    private _increaseScore(points: number): void {
        this._score += points;
        const maxPoints = 11;
        const normalizedScore = Math.min(this._score, maxPoints);
        this._scoreText.text = `Score: ${normalizedScore}/${maxPoints}`;

        if (this._score >= maxPoints && this._extraShotsLeft === 0) {
            this._startExtraShots();
        }
    }

    private _startExtraShots(): void {
        this._extraShotsLeft = 5;
    }

    private _handleExtraShot(hit: boolean): void {
        if (this._extraShotIndex < this._extraShotPoints.length) {
            this._extraShotPoints[this._extraShotIndex].background = hit ? "green" : "red";
            this._extraShotIndex++;
        }
        if (this._extraShotIndex >= this._extraShotPoints.length) {
            this._endGame();
        }
    }


    private _initializeMuzzleEffects(): void {
        // Créer la lumière du flash du canon
        this._muzzleFlashLight = new PointLight("muzzleFlash", Vector3.Zero(), this._scene);
        this._muzzleFlashLight.intensity = 0;
        this._muzzleFlashLight.range = 2;
        this._muzzleFlashLight.diffuse = new Color3(1, 1, 1); // Couleur blanche

        // Créer le système de particules de flamme du canon
        this._muzzleFlame = new ParticleSystem("muzzleFlame", 2000, this._scene);
        this._muzzleFlame.particleTexture = new Texture("sprites/flare2.png", this._scene);

        // Utiliser un PointParticleEmitter
        const flameEmitter = new PointParticleEmitter();
        flameEmitter.direction1 = new Vector3(1, 0, 0); // Aller vers l'avant
        flameEmitter.direction2 = new Vector3(0, 0, 0); // Aller vers l'avant
        this._muzzleFlame.particleEmitterType = flameEmitter;

        // Configurer les autres propriétés du système de particules
        this._muzzleFlame.color1 = new Color4(1.0, 1.0, 0.0, 1.0);
        this._muzzleFlame.color2 = new Color4(1.0, 0.66, 0.66, 1.0);
        this._muzzleFlame.colorDead = new Color4(1.0, 0.22, 0.22, 0.2);

        this._muzzleFlame.minSize = 0.005;
        this._muzzleFlame.maxSize = 0.01;

        this._muzzleFlame.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        this._muzzleFlame.gravity = new Vector3(0, 0, 0);

        this._muzzleFlame.minAngularSpeed = 0;
        this._muzzleFlame.maxAngularSpeed = Math.PI;

        this._muzzleFlame.minLifeTime = 0.02;
        this._muzzleFlame.maxLifeTime = 0.05;

        this._muzzleFlame.emitRate = 700;
        this._muzzleFlame.updateSpeed = 0.01;

        this._muzzleFlame.minEmitPower = 0.15;
        this._muzzleFlame.maxEmitPower = 0.5;
        this._muzzleFlame.stop();

        // Créer le système de particules de fumée
        this._muzzleSmoke = new ParticleSystem("muzzleSmoke", 2000, this._scene);
        this._muzzleSmoke.particleTexture = new Texture("sprites/flare2.png", this._scene);

        // Utiliser un PointParticleEmitter
        const smokeEmitter = new PointParticleEmitter();
        smokeEmitter.direction1 = new Vector3(-0.5, 1, -0.5); // Disperser dans différentes directions
        smokeEmitter.direction2 = new Vector3(0.5, 1, 0.5); // Disperser dans différentes directions
        this._muzzleSmoke.particleEmitterType = smokeEmitter;

        // Configurer les autres propriétés du système de particules
        this._muzzleSmoke.color1 = new Color4(0.8, 0.8, 0.8, 1.0);
        this._muzzleSmoke.color2 = new Color4(0.5, 0.5, 0.5, 1.0);
        this._muzzleSmoke.colorDead = new Color4(0.5, 0.5, 0.5, 1.0);

        this._muzzleSmoke.minSize = 0.005;
        this._muzzleSmoke.maxSize = 0.01; // Plus petite taille pour la fumée

        this._muzzleSmoke.minLifeTime = 0.2;
        this._muzzleSmoke.maxLifeTime = 1;

        this._muzzleSmoke.emitRate = 10;
        this._muzzleSmoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        this._muzzleSmoke.gravity = new Vector3(0, -0.2, 0); // La fumée monte légèrement

        this._muzzleSmoke.direction1 = new Vector3(-0.5, 1, -0.5); // Disperser dans différentes directions
        this._muzzleSmoke.direction2 = new Vector3(0.5, 1, 0.5); // Disperser dans différentes directions

        this._muzzleSmoke.minEmitPower = 0.01;
        this._muzzleSmoke.maxEmitPower = 0.3; // Moins de puissance pour la fumée

        this._muzzleSmoke.updateSpeed = 0.01;
        this._muzzleSmoke.stop();
    }


}
