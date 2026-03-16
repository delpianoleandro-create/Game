export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.materials = new Map();
    }

    // Método principal de carga. "style" puede ser "classic", "realist" o "neon"
    async loadDungeonAssets(style = "classic") {
        console.log(`Cargando Texture Pack: ${style}...`);

        if (style === "realist") {
            this.buildRealistMaterials();
        } else if (style === "neon") {
            this.buildNeonMaterials();
        } else {
            this.buildClassicMaterials();
        }

        console.log("Assets cargados con éxito.");
    }

    // --- PACK 1: CLÁSICO (Bajo Consumo) ---
    buildClassicMaterials() {
        const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15); 
        floorMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05); 
        floorMat.maxSimultaneousLights = 6;
        this.materials.set("floor", floorMat);

        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.28);
        wallMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        wallMat.maxSimultaneousLights = 6;
        this.materials.set("wall", wallMat);

        const woodMat = new BABYLON.StandardMaterial("woodMat", this.scene);
        woodMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1); 
        woodMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0); 
        woodMat.maxSimultaneousLights = 6;
        this.materials.set("wood", woodMat);

        const fireMat = new BABYLON.StandardMaterial("fireMat", this.scene);
        fireMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0); 
        fireMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0); 
        fireMat.disableLighting = true; 
        this.materials.set("fire", fireMat);
    }

    // --- PACK 2: REALISTA (Procedural PBR) ---
    buildRealistMaterials() {
        // Generar una textura matemática de "Ruido" (Piedra Sucia)
        const noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, this.scene);
        noiseTexture.octaves = 4;
        noiseTexture.persistence = 0.8;
        noiseTexture.animationSpeedFactor = 0; // Estático

        // Suelo PBR (Roca húmeda)
        const floorPBR = new BABYLON.PBRMaterial("floorPBR", this.scene);
        floorPBR.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Oscuro base
        floorPBR.metallic = 0.1; // Ligeramente brillante
        floorPBR.roughness = 0.4; // Refleja la humedad
        floorPBR.bumpTexture = noiseTexture; // Da relieve a la geometría 3D sin añadir polígonos
        floorPBR.maxSimultaneousLights = 6;
        this.materials.set("floor", floorPBR);

        // Muros PBR (Roca áspera y seca)
        const wallPBR = new BABYLON.PBRMaterial("wallPBR", this.scene);
        wallPBR.albedoColor = new BABYLON.Color3(0.2, 0.2, 0.22);
        wallPBR.metallic = 0.0;
        wallPBR.roughness = 0.9; // Piedra seca (no refleja casi nada)
        wallPBR.bumpTexture = noiseTexture; // Mismo relieve
        wallPBR.maxSimultaneousLights = 6;
        this.materials.set("wall", wallPBR);

        // Madera Barnizada PBR (Cofres)
        const woodPBR = new BABYLON.PBRMaterial("woodPBR", this.scene);
        woodPBR.albedoColor = new BABYLON.Color3(0.4, 0.2, 0.05); // Madera viva
        woodPBR.metallic = 0.05;
        woodPBR.roughness = 0.6; 
        woodPBR.maxSimultaneousLights = 6;
        this.materials.set("wood", woodPBR);

        // Fuego Clásico (El fuego no refleja luz, la emite)
        const fireMat = new BABYLON.StandardMaterial("fireMat", this.scene);
        fireMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
        fireMat.disableLighting = true;
        this.materials.set("fire", fireMat);
    }

    // --- PACK 3: CYBER-NEÓN (Todo por código) ---
    buildNeonMaterials() {
        // Suelo: Espejo Oscuro
        const floorNeon = new BABYLON.StandardMaterial("floorNeon", this.scene);
        floorNeon.diffuseColor = new BABYLON.Color3(0.01, 0.01, 0.02);
        floorNeon.specularColor = new BABYLON.Color3(1, 1, 1); // Reflejos puros
        floorNeon.specularPower = 64; // Brillo muy concentrado
        floorNeon.maxSimultaneousLights = 6;
        this.materials.set("floor", floorNeon);

        // Muros: Marcos emisivos verdes (Wireframe estilo Tron)
        const wallNeon = new BABYLON.StandardMaterial("wallNeon", this.scene);
        wallNeon.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        wallNeon.emissiveColor = new BABYLON.Color3(0.0, 0.2, 0.0); // Resplandor verde de fondo
        wallNeon.wireframe = true; // TRUCO DE CÓDIGO: Muestra los polígonos
        wallNeon.maxSimultaneousLights = 6;
        this.materials.set("wall", wallNeon);

        // Objetos: Cajas de energía azul
        const neonBox = new BABYLON.StandardMaterial("neonBox", this.scene);
        neonBox.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
        neonBox.emissiveColor = new BABYLON.Color3(0, 0.2, 0.5); // Brillo azul intenso
        neonBox.maxSimultaneousLights = 6;
        this.materials.set("wood", neonBox); // Reemplazamos la "madera" por cajas de energía

        // Fuego: Núcleos de poder rosa/magenta
        const neonCore = new BABYLON.StandardMaterial("neonCore", this.scene);
        neonCore.emissiveColor = new BABYLON.Color3(1, 0, 1); // Rosa brillante
        neonCore.disableLighting = true;
        this.materials.set("fire", neonCore);
    }

    getMaterial(name) {
        return this.materials.get(name);
    }
}