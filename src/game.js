import { DungeonScene } from './scenes/DungeonScene.js?v=11';
import { MenuManager } from './ui/MenuManager.js?v=11';
import { LogManager } from './utils/LogManager.js?v=11';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let currentScene = null;
let gameStarted = false;
export const logger = new LogManager();

const initGame = async (config, isNewGame = false) => {
    try {
        if (isNewGame && currentScene) {
            if (currentScene.scene) currentScene.scene.dispose();
            currentScene = null;
            gameStarted = false;
            logger.addLog("Reiniciando el juego y destruyendo escena anterior...", "info");
        }

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
            logger.addLog("Juego iniciado con éxito.", "info");
        } else {
            // Reanudar juego si estaba pausado
            if (currentScene) {
                currentScene.paused = false;
                logger.addLog("Juego reanudado.", "info");
                
                // Aplicar nueva configuración si cambió en el menú de pausa
                if (currentScene.applyConfig) {
                    currentScene.applyConfig(config);
                }
            }
        }
    } catch (err) {
        logger.addLog("Error fatal: " + err.message, "error");
        document.body.innerHTML = `<div style="background: white; color: red; padding: 20px; font-size: 20px; position: absolute; top:0; left:0; z-index: 9999;"><b>Error fatal:</b> ${err.message}<br><br>${err.stack}</div>`;
    }
};

// Escuchar evento de pausa desde el MenuManager
window.addEventListener("pauseGame", () => {
    if (currentScene) {
        currentScene.paused = true;
        logger.addLog("Juego pausado.", "info");
    }
});

// Inicializar el gestor de menús (que a su vez llamará a initGame)
console.log("Inicializando MenuManager...");
const menuManager = new MenuManager(initGame);
menuManager.showMainMenu();
console.log("Menú Principal mostrado en pantalla.");