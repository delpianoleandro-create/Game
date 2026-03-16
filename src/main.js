import { DungeonScene } from './scenes/DungeonScene.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const initGame = async () => {
    try {
        const gameScene = new DungeonScene(engine, canvas);
        const scene = await gameScene.createScene();
        
        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener("resize", () => {
            engine.resize();
        });
    } catch (err) {
        document.body.innerHTML = `<div style="background: white; color: red; padding: 20px; font-size: 20px; position: absolute; top:0; left:0; z-index: 9999;"><b>Error fatal:</b> ${err.message}<br><br>${err.stack}</div>`;
    }
};

initGame();