// Obtener canvas y crear engine
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Crear escena
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0,0,0);

// Cámara con límites
const camera = new BABYLON.ArcRotateCamera("camera", 
    Math.PI / 2, Math.PI / 4, 20, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

// Limitar ángulos y distancia
camera.lowerBetaLimit = 0.1;              // evita que baje demasiado
camera.upperBetaLimit = Math.PI / 2.2;    // límite superior
camera.lowerRadiusLimit = 5;              // distancia mínima
camera.upperRadiusLimit = 50;             // distancia máxima

// Luz ambiental tenue
const starLight = new BABYLON.PointLight("starLight", new BABYLON.Vector3(0,50,0), scene);
starLight.intensity = 0.3;

const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0,1,0), scene);
hemiLight.intensity = 0.2;

// Skybox con estrellas
const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000}, scene);
const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.disableLighting = true;
skyboxMaterial.diffuseColor = new BABYLON.Color3(0,0,0);
skyboxMaterial.emissiveTexture = new BABYLON.Texture("assets/stars.jpg", scene);
skybox.material = skyboxMaterial;

// Piso
const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:50, height:50}, scene);
const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
groundMaterial.diffuseColor = new BABYLON.Color3(0.2,0.2,0.2);
ground.material = groundMaterial;

// Cubo de prueba
const box = BABYLON.MeshBuilder.CreateBox("box", {size:2}, scene);
box.position.y = 1;

// Render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Resize
window.addEventListener("resize", () => {
  engine.resize();
});
