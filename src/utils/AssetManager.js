export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.materials = new Map();
        // this.models = new Map(); // Para cuando usemos .glb / .gltf
    }

    // Método para cargar todas las texturas de un nivel ANTES de jugar
    async loadDungeonAssets() {
        console.log("Cargando Texture Pack (Placeholder)...");

        // === EJEMPLO DE CÓMO SE CARGARÍAN TEXTURAS REALES ===
        // Si tuvieras imágenes en assets/textures/floor.png, harías esto:
        // const floorTex = new BABYLON.Texture("assets/textures/floor.png", this.scene);
        // const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
        // floorMat.diffuseTexture = floorTex;
        // this.materials.set("floor", floorMat);

        // === MIENTRAS TANTO: MATERIALES PROCEDURALES MEJORADOS ===
        // Suelo
        const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15); 
        floorMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Brillo del polvo
        this.materials.set("floor", floorMat);

        // Paredes
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.28); // Piedra más clara que el suelo
        wallMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.materials.set("wall", wallMat);

        // Madera (Cofres y Antorchas)
        const woodMat = new BABYLON.StandardMaterial("woodMat", this.scene);
        woodMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1); // Marrón madera
        woodMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0); // Ligero brillo
        this.materials.set("wood", woodMat);

        // Fuego (Antorchas)
        const fireMat = new BABYLON.StandardMaterial("fireMat", this.scene);
        fireMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // Naranja base
        fireMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0); // Brillo amarillo fuerte
        fireMat.disableLighting = true; // No le afecta la sombra, él emite luz
        this.materials.set("fire", fireMat);

        console.log("Assets cargados con éxito.");
    }

    getMaterial(name) {
        return this.materials.get(name);
    }
}