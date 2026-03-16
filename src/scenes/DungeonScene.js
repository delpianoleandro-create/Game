import { InputController } from '../utils/InputController.js';
import { HUD } from '../ui/HUD.js';
import { Player } from '../entities/Player.js';
import { DungeonGenerator } from '../world/DungeonGenerator.js';
import { DialogueManager } from '../ui/DialogueManager.js';
import { Minimap } from '../ui/Minimap.js';
import { ShadowRat } from '../entities/enemies/ShadowRat.js';
import { TopDownController } from '../controllers/TopDownController.js';
import { ShooterController } from '../controllers/ShooterController.js';
import { AssetManager } from '../utils/AssetManager.js';
import { SoundManager } from '../utils/SoundManager.js'; // Importar Sonidos

export class DungeonScene {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.scene = null;
        this.controller = null;
        this.player = null;
        this.camera = null;
        this.input = null;
        this.config = null;
        this.assetManager = null;
        this.soundManager = null; // Gestor de Audio
    }

    async createScene(config) {
        this.config = config;
        this.scene = new BABYLON.Scene(this.engine);
        const scene = this.scene;
        scene.paused = false;
        scene.collisionsEnabled = true;
        scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02);

        // Inicializar Gestor de Assets y Sonidos
        this.assetManager = new AssetManager(scene);
        await this.assetManager.loadDungeonAssets();
        this.soundManager = new SoundManager();

        this.camera = new BABYLON.ArcRotateCamera("ArcCam", -Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 35; // Permitir zoom más alejado
        this.camera.lowerBetaLimit = 0.1; 
        this.camera.upperBetaLimit = Math.PI / 2.1;
        this.camera.checkCollisions = true; 
        this.camera.collisionRadius = new BABYLON.Vector3(1, 1, 1);
        this.camera.inertia = 0.8; 

        // 1. Luz de ambiente general reducida para resaltar antorchas
        const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.4; 
        ambientLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // 2. Luz base del jugador (Antorcha de mano)
        const playerLight = new BABYLON.PointLight("playerLight", new BABYLON.Vector3(0, 3, 0), scene);
        playerLight.intensity = 0;
        playerLight.diffuse = new BABYLON.Color3(1, 0.8, 0.5);
        playerLight.range = 30;

        // 3. Linterna corregida y más potente
        const flashlight = new BABYLON.SpotLight("flashlight", new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 2.5, 10, scene);
        flashlight.intensity = 0;
        flashlight.diffuse = new BABYLON.Color3(1, 1, 1);
        flashlight.range = 60;

        this.input = new InputController();
        const hud = new HUD();
        const dialogue = new DialogueManager();
        const minimap = new Minimap();
        
        const world = new DungeonGenerator(scene, this.assetManager);
        world.generate();

        // Le pasamos el SoundManager al Player para que haga ruido al atacar/abrir cofres
        this.player = new Player(scene, this.input, hud, dialogue, this.soundManager);
        playerLight.parent = this.player.mesh;
        flashlight.parent = this.player.mesh;

        // Aplicar controlador basado en config
        this.applyConfig(config);

        const enemies = [];
        try {
            enemies.push(new ShadowRat(scene, this.player, 0, 18));
            enemies.push(new ShadowRat(scene, this.player, 8, -12));
            enemies.push(new ShadowRat(scene, this.player, -12, -8));
        } catch (error) {
            console.error("Error al cargar enemigos:", error);
        }

        this.player.canMove = false; 

        setTimeout(() => {
            if (scene.paused) return; 
            dialogue.startDialogue([
                { speaker: "Voz Desconocida", text: "¿Aún respiras, Buscador?" },
                { speaker: "Tú", text: "¿Dónde... dónde estoy? Mi cabeza da vueltas..." },
                { speaker: "Voz Desconocida", text: "En la tumba de la avaricia del Imperio de Elyria. Enciende tu luz..." }
            ], () => {
                playerLight.intensity = 1.0;
                flashlight.intensity = 3.0; 
                this.soundManager.playChestOpen(); // Sonido mágico de encendido
                
                setTimeout(() => {
                    dialogue.startDialogue([
                        { speaker: "Voz Desconocida", text: "Toma tu arma con fuerza. Ellos ya han olido tu luz. Sobrevive." }
                    ], () => {
                        this.player.canMove = true;
                    });
                }, 1000);
            });
        }, 1500);

        // Bucle Principal (Tick Rate)
        scene.onBeforeRenderObservable.add(() => {
            if(this.player.canMove !== false && !scene.paused) {
                if (this.controller) this.controller.update();
                this.player.update(world.chests, enemies);

                // --- 🕯️ EFECTO DE PARPADEO (FLICKER) PARA ANTORCHAS ---
                if (scene.torchLights) {
                    scene.torchLights.forEach(light => {
                        light.intensity = 1.3 + Math.random() * 0.5;
                    });
                }
                if (playerLight.intensity > 0) {
                    playerLight.intensity = 0.9 + Math.random() * 0.3;
                }

                // --- CORRECCIÓN LINTERNA ABSOLUTA ---
                // Le pedimos a la malla del jugador su vector "Adelante" exacto en coordenadas globales
                // Así, no importa en qué modo estés (Shooter o TopDown), la luz siempre sale de su pecho.
                const forward = this.player.mesh.getDirection(BABYLON.Vector3.Forward());
                
                if (this.config.cameraMode === "SHOOTER") {
                    // En Shooter, copiamos un poco la inclinación vertical de la cámara
                    const camForward = this.camera.getForwardRay().direction;
                    flashlight.direction = new BABYLON.Vector3(forward.x, camForward.y, forward.z).normalize();
                } else {
                    // En Top-Down, la linterna siempre apunta recta, pero sigue la rotación del cuerpo
                    flashlight.direction = new BABYLON.Vector3(forward.x, -0.1, forward.z).normalize();
                }

                for (let i = enemies.length - 1; i >= 0; i--) {
                    if (enemies[i].hp <= 0) {
                        enemies.splice(i, 1);
                    } else {
                        enemies[i].update();
                    }
                }

                minimap.update(this.player, world.chests, enemies);
            }
        });

        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.02;
        scene.fogColor = scene.clearColor;

        return scene;
    }

    applyConfig(newConfig) {
        this.config = newConfig;
        this.camera.detachControl();

        if (this.config.cameraMode === "TOP_DOWN") {
            this.controller = new TopDownController(this.camera, this.player, this.input, this.canvas);
        } else if (this.config.cameraMode === "SHOOTER") {
            this.controller = new ShooterController(this.camera, this.player, this.input, this.canvas);
        }
    }
}