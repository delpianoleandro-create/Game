import { InputController } from '../utils/InputController.js';
import { HUD } from '../ui/HUD.js';
import { Player } from '../entities/Player.js';
import { DungeonGenerator } from '../world/DungeonGenerator.js';
import { DialogueManager } from '../ui/DialogueManager.js';
import { ShadowRat } from '../entities/enemies/ShadowRat.js';
import { TopDownController } from '../controllers/TopDownController.js';
import { ShooterController } from '../controllers/ShooterController.js';

export class DungeonScene {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
    }

    async createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.collisionsEnabled = true;
        scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02);

        // Cámara Universal (ArcRotateCamera) que será dominada por el controlador elegido
        const camera = new BABYLON.ArcRotateCamera("ArcCam", -Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
        camera.lowerRadiusLimit = 8;
        camera.upperRadiusLimit = 25;
        camera.lowerBetaLimit = 0.2; 
        camera.upperBetaLimit = Math.PI / 2.1;
        camera.checkCollisions = true; 
        camera.collisionRadius = new BABYLON.Vector3(1, 1, 1);
        camera.inertia = 0.8; 

        // === 💡 MEJORA DE ILUMINACIÓN ===
        // 1. Luz de ambiente general mucho más fuerte
        const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.8; // Antes era 0.35
        ambientLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        // 2. Luz base del jugador
        const playerLight = new BABYLON.PointLight("playerLight", new BABYLON.Vector3(0, 3, 0), scene);
        playerLight.intensity = 0;
        playerLight.diffuse = new BABYLON.Color3(1, 0.8, 0.5);
        playerLight.range = 30;

        // 3. Linterna corregida y más potente
        const flashlight = new BABYLON.SpotLight("flashlight", new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 2.5, 10, scene);
        flashlight.intensity = 0;
        flashlight.diffuse = new BABYLON.Color3(1, 1, 1);
        flashlight.range = 60;

        // Sistemas Principales
        const input = new InputController();
        const hud = new HUD();
        const dialogue = new DialogueManager();
        
        const world = new DungeonGenerator(scene);
        world.generate();

        const player = new Player(scene, input, hud, dialogue);
        playerLight.parent = player.mesh;
        flashlight.parent = player.mesh;

        // ============================================
        // 🕹️ SELECTOR DE MODO DE CONTROL Y CÁMARA
        // ============================================
        // Como pediste, empezamos con "TOP_DOWN": cámara fija arriba y mando de joystick puro (sin touch libre)
        // Puedes cambiar esto a "SHOOTER" si prefieres el de Free Fire
        const gameMode = "TOP_DOWN"; 
        
        let controller;
        if (gameMode === "TOP_DOWN") {
            // Ocultar la mira central (Crosshair) porque no hace falta en Top-Down
            const crosshair = document.getElementById("crosshair");
            if (crosshair) crosshair.style.display = "none";
            
            controller = new TopDownController(camera, player, input, this.canvas);
        } else if (gameMode === "SHOOTER") {
            controller = new ShooterController(camera, player, input, this.canvas);
        }

        const enemies = [];
        try {
            enemies.push(new ShadowRat(scene, player, 0, 18));
            enemies.push(new ShadowRat(scene, player, 8, -12));
            enemies.push(new ShadowRat(scene, player, -12, -8));
        } catch (error) {
            console.error("Error al cargar enemigos:", error);
        }

        // Bloquear movimiento temporalmente para la historia inicial
        player.canMove = false; 

        setTimeout(() => {
            dialogue.startDialogue([
                { speaker: "Voz Desconocida", text: "¿Aún respiras, Buscador?" },
                { speaker: "Tú", text: "¿Dónde... dónde estoy? Mi cabeza da vueltas..." },
                { speaker: "Voz Desconocida", text: "En la tumba de la avaricia del Imperio de Elyria. Enciende tu luz..." }
            ], () => {
                playerLight.intensity = 1.0;
                flashlight.intensity = 3.0; // Enciende la linterna corregida
                
                setTimeout(() => {
                    dialogue.startDialogue([
                        { speaker: "Voz Desconocida", text: "Toma tu arma con fuerza. Ellos ya han olido tu luz. Sobrevive." }
                    ], () => {
                        player.canMove = true;
                    });
                }, 1000);
            });
        }, 1500);

        // Bucle Principal (Tick Rate)
        scene.onBeforeRenderObservable.add(() => {
            if(player.canMove !== false) {
                // 1. Controlador ejecuta Movimiento y Cámara
                controller.update();
                
                // 2. Jugador ejecuta Acciones (Combate e Inventario)
                player.update(world.chests, enemies);

                // 3. Arreglar Linterna: Garantizar que apunte hacia adelante del jugador siempre
                if (gameMode === "SHOOTER") {
                    // En modo Shooter se inclina arriba/abajo según mire la cámara
                    const camForward = camera.getForwardRay().direction;
                    flashlight.direction = new BABYLON.Vector3(0, camForward.y, 1).normalize();
                } else {
                    // En modo TopDown la luz siempre apunta al frente (en paralelo al suelo)
                    flashlight.direction = new BABYLON.Vector3(0, -0.1, 1).normalize();
                }

                // 4. Actualizar IA de Enemigos
                for (let i = enemies.length - 1; i >= 0; i--) {
                    if (enemies[i].hp <= 0) {
                        enemies.splice(i, 1);
                    } else {
                        enemies[i].update();
                    }
                }
            }
        });

        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.02;
        scene.fogColor = scene.clearColor;

        return scene;
    }
}