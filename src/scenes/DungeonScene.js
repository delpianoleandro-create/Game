import { InputController } from '../utils/InputController.js';
import { HUD } from '../ui/HUD.js';
import { Player } from '../entities/Player.js';
import { DungeonGenerator } from '../world/DungeonGenerator.js';

export class DungeonScene {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
    }

    async createScene() {
        const scene = new BABYLON.Scene(this.engine);
        
        // Color base de la cueva profunda
        scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02);

        // Cámara "Top-Down" isométrica siguiendo al jugador
        const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 15, -15), scene);
        camera.radius = 18; 
        camera.heightOffset = 15;
        camera.rotationOffset = 180;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 10;
        
        // Bloquear control del usuario sobre la cámara para enfocar en aventura
        camera.attachControl(this.canvas, false);

        // Luz de ambiente oscura (Cueva)
        const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.2;
        ambientLight.groundColor = new BABYLON.Color3(0.05, 0.05, 0.05);

        // Luz que lleva el jugador (Antorcha/Aura)
        const playerLight = new BABYLON.PointLight("playerLight", new BABYLON.Vector3(0, 3, 0), scene);
        playerLight.intensity = 0.8;
        playerLight.diffuse = new BABYLON.Color3(1, 0.8, 0.5); // Naranja cálido
        playerLight.range = 15;

        // Sistemas Principales
        const input = new InputController();
        const hud = new HUD();
        
        // Generador de Nivel
        const world = new DungeonGenerator(scene);
        world.generate();

        // Entidades
        const player = new Player(scene, input);
        camera.lockedTarget = player.mesh; // Seguir al héroe
        playerLight.parent = player.mesh; // La luz lo sigue a donde vaya

        // Bucle Principal
        scene.onBeforeRenderObservable.add(() => {
            player.update();
            
            // Más adelante aquí se verificarán colisiones con paredes, 
            // enemigos y recolección de cofres de oro para actualizar el HUD.
        });

        // Efecto de Niebla de guerra profunda
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.04;
        scene.fogColor = scene.clearColor;

        return scene;
    }
}