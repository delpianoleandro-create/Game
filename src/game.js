import { DungeonScene } from './scenes/DungeonScene.js';
import { MenuManager } from './ui/MenuManager.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let currentScene = null;
let gameStarted = false;

const initGame = async (config) => {
    try {
        if (!gameStarted) {
            // Primera vez que se inicia
            const gameScene = new DungeonScene(engine, canvas);
            currentScene = await gameScene.createScene(config);
            
            engine.runRenderLoop(() => {
                if (currentScene && !currentScene.paused) {
                    currentScene.render();
                }
            });

            window.addEventListener("resize", () => {
                engine.resize();
            });
            
            gameStarted = true;
        } else {
            // Reanudar juego si estaba pausado
            if (currentScene) {
                currentScene.paused = false;
                
                // Aplicar nueva configuración si cambió en el menú de pausa
                if (currentScene.applyConfig) {
                    currentScene.applyConfig(config);
                }
            }
        }
    } catch (err) {
        document.body.innerHTML = `<div style="background: white; color: red; padding: 20px; font-size: 20px; position: absolute; top:0; left:0; z-index: 9999;"><b>Error fatal:</b> ${err.message}<br><br>${err.stack}</div>`;
    }
};

// Escuchar evento de pausa desde el MenuManager
window.addEventListener("pauseGame", () => {
    if (currentScene) {
        currentScene.paused = true;
    }
});

// Inicializar el gestor de menús (que a su vez llamará a initGame)
const menuManager = new MenuManager(initGame);