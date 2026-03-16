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
camera.lowerBetaLimit = 0.1;              
camera.upperBetaLimit = Math.PI / 2.2;    
camera.lowerRadiusLimit = 5;              
camera.upperRadiusLimit = 50;             

// Luz ambiental tenue
const starLight = new BABYLON.PointLight("starLight", new BABYLON.Vector3(0,50,0), scene);
starLight.intensity = 0.3;

const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0,1,0), scene);
hemiLight.intensity = 0.4;

// Skybox estrellado (usa 6 imágenes: px, nx, py, ny, pz, nz)
const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000}, scene);
const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/stars", scene);
skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
skyboxMaterial.diffuseColor = new BABYLON.Color3(0,0,0);
skyboxMaterial.specularColor = new BABYLON.Color3(0,0,0);
skybox.material = skyboxMaterial;

// Piso
const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:50, height:50}, scene);
const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
groundMaterial.diffuseColor = new BABYLON.Color3(0.2,0.2,0.2);
ground.material = groundMaterial;

// Cubo de prueba
const box = BABYLON.MeshBuilder.CreateBox("box", {size:2}, scene);
box.position.y = 1;

// Joystick virtual
const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
const leftJoystick = new BABYLON.GUI.VirtualJoystick(true);
leftJoystick.setJoystickColor("cyan");

// Movimiento con joystick
scene.onBeforeRenderObservable.add(() => {
  if (leftJoystick.pressed) {
    box.position.x += leftJoystick.deltaPosition.x * 0.05;
    box.position.z += leftJoystick.deltaPosition.y * 0.05;
  }
});

// Render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Resize
window.addEventListener("resize", () => {
  engine.resize();
});
