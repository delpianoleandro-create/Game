import { InputController } from '../utils/InputController.js';
import { HUD } from '../ui/HUD.js';
import { Player } from '../entities/Player.js';
import { DungeonGenerator } from '../world/DungeonGenerator.js';
import { DialogueManager } from '../ui/DialogueManager.js';
import { ShadowRat } from '../entities/enemies/ShadowRat.js';

export class DungeonScene {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
    }

    async createScene() {
        const scene = new BABYLON.Scene(this.engine);
        
        // Habilitar motor de colisiones
        scene.collisionsEnabled = true;
        
        // Color base de la cueva profunda
        scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02);

        // Cámara en 3ra persona tipo Shooter / Action RPG
        // La cámara ahora se bloqueará detrás del jugador
        const camera = new BABYLON.ArcRotateCamera("ArcCam", -Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
        
        // Límites estrictos
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 20;
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI / 2.2;
        
        camera.checkCollisions = true; 
        camera.collisionRadius = new BABYLON.Vector3(1, 1, 1);
        
        // Permitimos la rotación de la cámara por arrastre en la pantalla (Touch)
        camera.attachControl(this.canvas, true); 
        
        camera.inertia = 0.7; 
        camera.angularSensibilityX = 1500; 
        camera.angularSensibilityY = 1500; 

        // Luz de ambiente oscura (Cueva)
        const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.35; // Un poco más clara
        ambientLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Luz base que lleva el jugador (Antorcha/Aura perimetral). Inicialmente apagada por la historia
        const playerLight = new BABYLON.PointLight("playerLight", new BABYLON.Vector3(0, 3, 0), scene);
        playerLight.intensity = 0; // Apagada
        playerLight.diffuse = new BABYLON.Color3(1, 0.8, 0.5); // Naranja cálido
        playerLight.range = 25; // Mayor alcance

        // Linterna direccional del jugador. Inicialmente apagada.
        const flashlight = new BABYLON.SpotLight("flashlight", new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, -0.1, 1), Math.PI / 2.5, 5, scene);
        flashlight.intensity = 0; // Apagada
        flashlight.diffuse = new BABYLON.Color3(1, 1, 1); // Luz blanca
        flashlight.range = 50;

        // Sistemas Principales
        const input = new InputController();
        const hud = new HUD();
        const dialogue = new DialogueManager();
        
        // Generador de Nivel
        const world = new DungeonGenerator(scene);
        world.generate();

        // Entidades
        const player = new Player(scene, input, hud, dialogue);
        camera.lockedTarget = player.mesh; // Seguir al héroe
        playerLight.parent = player.mesh; // El aura lo sigue
        flashlight.parent = player.mesh; // La linterna lo sigue y apunta hacia donde mira

        // Generar algunos enemigos con manejo de errores
        const enemies = [];
        try {
            console.log("Intentando generar enemigos...");
            enemies.push(new ShadowRat(scene, player, 0, 18));
            enemies.push(new ShadowRat(scene, player, 8, -12));
            enemies.push(new ShadowRat(scene, player, -12, -8));
            console.log("Enemigos generados con éxito:", enemies.length);
        } catch (error) {
            console.error("Error crítico al cargar enemigos:", error);
            // Mostrar el error en la pantalla para poder leerlo
            document.body.innerHTML += `<div style="position:absolute; top:10%; left:10%; background:red; color:white; padding:20px; z-index:99999;"><b>Error Cargando Enemigos:</b> ${error.message}<br>${error.stack}</div>`;
        }

        // Bloquear movimiento temporalmente para el inicio
        player.canMove = false; 

        // Lanzar Historia Inicial (Capítulo 1: El Despertar)
        setTimeout(() => {
            dialogue.startDialogue([
                { speaker: "Voz Desconocida", text: "¿Aún respiras, Buscador?" },
                { speaker: "Tú", text: "¿Dónde... dónde estoy? Mi cabeza da vueltas..." },
                { speaker: "Voz Desconocida", text: "En la tumba de la avaricia del Imperio de Elyria. Enciende tu luz..." }
            ], () => {
                // Callback: Cuando el diálogo termina
                playerLight.intensity = 1.0; // Enciende la antorcha
                flashlight.intensity = 2.5;  // Enciende la linterna
                
                setTimeout(() => {
                    dialogue.startDialogue([
                        { speaker: "Voz Desconocida", text: "Toma tu arma con fuerza. Ellos ya han olido tu luz. Sobrevive." }
                    ], () => {
                        player.canMove = true; // El jugador ya puede moverse
                    });
                }, 1000);
            });
        }, 1500);

        // Bucle Principal
        scene.onBeforeRenderObservable.add(() => {
            if(player.canMove !== false) {
                player.update(world.chests, enemies);

                // La cámara sigue físicamente al jugador, pero rota libremente por el touch
                camera.target = player.mesh.position;
                
                // Limpiar enemigos muertos del array y actualizar los vivos
                for (let i = enemies.length - 1; i >= 0; i--) {
                    if (enemies[i].hp <= 0) {
                        enemies.splice(i, 1);
                    } else {
                        enemies[i].update();
                    }
                }
            }
        });

        // Efecto de Niebla de guerra profunda
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.02; // Menos densa para que la luz penetre más
        scene.fogColor = scene.clearColor;

        return scene;
    }
}