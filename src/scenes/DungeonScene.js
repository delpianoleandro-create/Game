import { InputController } from '../utils/InputController.js?v=11';
import { HUD } from '../ui/HUD.js?v=11';
import { Player } from '../entities/Player.js?v=11';
import { Companion } from '../entities/Companion.js?v=11';
import { DungeonGenerator } from '../world/DungeonGenerator.js?v=11';
import { DialogueManager } from '../ui/DialogueManager.js?v=11';
import { Minimap } from '../ui/Minimap.js?v=11';
import { ShadowRat } from '../entities/enemies/ShadowRat.js?v=11';
import { TopDownController } from '../controllers/TopDownController.js?v=11';
import { ShooterController } from '../controllers/ShooterController.js?v=11';
import { AssetManager } from '../utils/AssetManager.js?v=11';
import { SoundManager } from '../utils/SoundManager.js?v=11'; // Importar Sonidos

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
        const texturePackStyle = config.texturePack || "classic";
        await this.assetManager.loadDungeonAssets(texturePackStyle);
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
        world.generate(); // Prepara el mundo infinito

        // Le pasamos el SoundManager al Player
        const heroSelected = config.hero || "mago";
        this.player = new Player(scene, this.input, hud, dialogue, this.soundManager, heroSelected);
        playerLight.parent = this.player.mesh;
        flashlight.parent = this.player.mesh;

        if (config.companion && config.companion !== "ninguno") {
            this.companion = new Companion(scene, this.player, config.companion);
        }

        // Aplicar controlador basado en config
        this.applyConfig(config);

        // Pre-generar el mundo inicial AHORA para evitar congelamientos post-diálogo
        const enemies = [];
        world.update(this.player.mesh.position, enemies);
        while(world.enemiesData.length > 0) {
            let ed = world.enemiesData.pop();
            enemies.push(new ShadowRat(scene, this.player, ed.x, ed.z));
        }

        // Generar armas iniciales garantizadas en el punto de inicio para no estar desnudos
        world.createChest("chest_start_sword", "espada", -4, 0.5, 4);
        world.createChest("chest_start_shield", "escudo", 4, 0.5, 4);

        this.player.canMove = false; 

        setTimeout(() => {
            if (scene.paused) return; 
            dialogue.startDialogue([
                { speaker: "Voz Desconocida", text: "¿Aún respiras, Buscador?" },
                { speaker: "Tú", text: "¿Dónde... dónde estoy? Esto parece no tener fin..." },
                { speaker: "Voz Desconocida", text: "Estás en el Laberinto Infinito de Elyria. Enciende tu luz y no mires atrás..." }
            ], () => {
                playerLight.intensity = 1.0;
                flashlight.intensity = 3.0; 
                this.soundManager.playChestOpen(); 
                
                setTimeout(() => {
                    dialogue.startDialogue([
                        { speaker: "Voz Desconocida", text: "Toma tu arma con fuerza. Sobrevive todo lo que puedas." }
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
                
                // 1. EL MUNDO INIFINITO REACCIONA AL JUGADOR
                world.update(this.player.mesh.position, enemies);
                
                // Si el mundo generó datos de enemigos nuevos, los instanciamos aquí (para tener contexto de la escena)
                while(world.enemiesData.length > 0) {
                    let ed = world.enemiesData.pop();
                    enemies.push(new ShadowRat(scene, this.player, ed.x, ed.z));
                }

                // 2. JUGADOR
                this.player.update(world.chests, enemies);

                if (this.companion) {
                    this.companion.update();
                }

                // --- 🕯️ EFECTO DE PARPADEO (FLICKER) PARA ANTORCHAS ---
                if (scene.torchLights) {
                    scene.torchLights.forEach(light => {
                        light.intensity = 1.3 + Math.random() * 0.5;
                    });
                }
                if (playerLight.intensity > 0) {
                    playerLight.intensity = 0.9 + Math.random() * 0.3;
                }

                // --- CORRECCIÓN LINTERNA OMNIDIRECCIONAL ---
                // Usamos trigonometría pura sobre el ángulo Y del jugador para calcular hacia dónde apunta
                const playerAngle = this.player.mesh.rotation.y;
                const dirX = Math.sin(playerAngle);
                const dirZ = Math.cos(playerAngle);
                
                if (this.config.cameraMode === "SHOOTER") {
                    const camForward = this.camera.getForwardRay().direction;
                    // Mantenemos X y Z del jugador, pero Y de la cámara para que mire arriba/abajo
                    flashlight.direction = new BABYLON.Vector3(dirX, camForward.y, dirZ).normalize();
                } else {
                    // En TopDown, la luz debe ir plana (casi recta) en la dirección del jugador
                    flashlight.direction = new BABYLON.Vector3(dirX, -0.2, dirZ).normalize();
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