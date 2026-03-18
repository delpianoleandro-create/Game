import { ItemDatabase } from '../data/ItemDatabase.js?v=9';

export class DungeonGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager; 
        
        // Configuraciones del Mundo Infinito
        this.roomSize = 30; // Tamaño de cada Chunk (Parcela)
        this.wallThickness = 2;
        this.doorSize = 10; // Pasillos anchos
        
        // Memoria del mundo
        this.generatedChunks = new Set(); // Guarda qué parcelas ya se crearon "X,Z"
        this.chests = [];
        this.enemiesData = []; // Para spawnear enemigos en nuevos chunks
    }

    // Ya no genera todo el mapa de golpe, solo prepara el sistema
    generate() {
        console.log("Iniciando Mundo Procedural Infinito...");
        // El primer chunk se genera en (0,0) automáticamente cuando el jugador caiga allí
    }

    // Se llama en cada fotograma para revisar dónde está el jugador
    update(playerPos, enemiesArray) {
        // ¿En qué coordenada de Chunk está el jugador ahora mismo?
        const currentChunkX = Math.floor((playerPos.x + this.roomSize / 2) / this.roomSize);
        const currentChunkZ = Math.floor((playerPos.z + this.roomSize / 2) / this.roomSize);

        // Optimización: Si el jugador sigue en la misma parcela, no recalcular todo el vecindario
        if (this.lastChunkX === currentChunkX && this.lastChunkZ === currentChunkZ) return;
        
        this.lastChunkX = currentChunkX;
        this.lastChunkZ = currentChunkZ;

        // Generar un radio de 3x3 Chunks alrededor del jugador (Vision Distance)
        const renderDistance = 1; // 1 chunk de distancia en todas direcciones (9 chunks activos a la vez)

        for (let x = -renderDistance; x <= renderDistance; x++) {
            for (let z = -renderDistance; z <= renderDistance; z++) {
                const targetX = currentChunkX + x;
                const targetZ = currentChunkZ + z;
                const chunkKey = `${targetX},${targetZ}`;

                // Si este Chunk nunca ha sido explorado, ¡Constrúyelo!
                if (!this.generatedChunks.has(chunkKey)) {
                    this.buildChunk(targetX, targetZ, enemiesArray);
                    this.generatedChunks.add(chunkKey);
                }
            }
        }
    }

    buildChunk(chunkX, chunkZ, enemiesArray) {
        // Centro real en el mundo 3D
        const cx = chunkX * this.roomSize;
        const cz = chunkZ * this.roomSize;

        // 1. Construir Suelo Infinito para este chunk
        const ground = BABYLON.MeshBuilder.CreateGround(`ground_${chunkX}_${chunkZ}`, { width: this.roomSize, height: this.roomSize }, this.scene);
        ground.position.set(cx, 0, cz);
        ground.material = this.assets.getMaterial("floor");
        ground.checkCollisions = true;

        // 2. Construir Paredes Perimetrales del Chunk (Siempre con puertas/pasillos en los 4 lados para que sea infinito)
        const halfRoom = this.roomSize / 2;
        const wThick = this.wallThickness;
        const h = 6; 
        const sideLen = (this.roomSize - this.doorSize) / 2;

        // Muro Norte (Con puerta central)
        this.createWall(`wN_L_${chunkX}_${chunkZ}`, sideLen, h, wThick, cx - this.roomSize/4 - this.doorSize/4, 3, cz + halfRoom);
        this.createWall(`wN_R_${chunkX}_${chunkZ}`, sideLen, h, wThick, cx + this.roomSize/4 + this.doorSize/4, 3, cz + halfRoom);
        
        // Muro Sur
        this.createWall(`wS_L_${chunkX}_${chunkZ}`, sideLen, h, wThick, cx - this.roomSize/4 - this.doorSize/4, 3, cz - halfRoom);
        this.createWall(`wS_R_${chunkX}_${chunkZ}`, sideLen, h, wThick, cx + this.roomSize/4 + this.doorSize/4, 3, cz - halfRoom);
        
        // Muro Este
        this.createWall(`wE_B_${chunkX}_${chunkZ}`, wThick, h, sideLen, cx + halfRoom, 3, cz - this.roomSize/4 - this.doorSize/4);
        this.createWall(`wE_T_${chunkX}_${chunkZ}`, wThick, h, sideLen, cx + halfRoom, 3, cz + this.roomSize/4 + this.doorSize/4);

        // Muro Oeste
        this.createWall(`wW_B_${chunkX}_${chunkZ}`, wThick, h, sideLen, cx - halfRoom, 3, cz - this.roomSize/4 - this.doorSize/4);
        this.createWall(`wW_T_${chunkX}_${chunkZ}`, wThick, h, sideLen, cx - halfRoom, 3, cz + this.roomSize/4 + this.doorSize/4);

        // 3. Iluminación Procedural (Antorchas en los cruces)
        // Ponemos una antorcha en el pilar Noroeste de esta sala
        this.createTorch(`torch_${chunkX}_${chunkZ}`, cx - halfRoom + 1, 2.5, cz + halfRoom - 1, "S");

        // 4. Generación de Contenido Aleatorio (RNG)
        // No generamos enemigos ni trampas en el Chunk de inicio (0,0)
        if (chunkX === 0 && chunkZ === 0) return;

        // Generar Pilares o Puentes interiores
        if (Math.random() > 0.4) {
            // Pilar gigante en el centro de la sala
            this.createWall(`pillar_${chunkX}_${chunkZ}`, 4, 6, 4, cx, 3, cz);
        }

        // 20% de probabilidad de que haya un Cofre con tesoro
        if (Math.random() > 0.8) {
            const offsetX = (Math.random() > 0.5 ? 1 : -1) * (this.roomSize/2 - 5);
            const offsetZ = (Math.random() > 0.5 ? 1 : -1) * (this.roomSize/2 - 5);
            const itemType = Math.random() > 0.5 ? "espada" : "escudo";
            this.createChest(`chest_${chunkX}_${cz}`, itemType, cx + offsetX, 0.5, cz + offsetZ);
        }

        // 40% de probabilidad de generar una Rata de Sombra en este nuevo Chunk
        if (Math.random() > 0.6 && enemiesArray) {
            const offsetX = (Math.random() - 0.5) * 15;
            const offsetZ = (Math.random() - 0.5) * 15;
            this.enemiesData.push({ x: cx + offsetX, z: cz + offsetZ }); // Guardamos el dato para que Scene lo instancie
        }
    }

    createTorch(id, x, y, z, side) {
        const holder = BABYLON.MeshBuilder.CreateBox(`${id}_holder`, { width: 0.2, height: 0.5, depth: 0.2 }, this.scene);
        holder.position.set(x, y, z);
        holder.material = this.assets.getMaterial("wood");

        const fire = BABYLON.MeshBuilder.CreateBox(`${id}_fire`, { width: 0.3, height: 0.3, depth: 0.3 }, this.scene);
        fire.position.set(x, y + 0.3, z);
        fire.material = this.assets.getMaterial("fire");

        const light = new BABYLON.PointLight(`${id}_light`, new BABYLON.Vector3(x, y + 0.6, z), this.scene);
        light.diffuse = new BABYLON.Color3(1, 0.7, 0.2); 
        light.intensity = 1.5; 
        light.range = 20;

        if (!this.scene.torchLights) this.scene.torchLights = [];
        this.scene.torchLights.push(light);
    }

    createWall(name, w, h, d, x, y, z) {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        wall.position.set(x, y, z);
        wall.material = this.assets.getMaterial("wall");
        wall.checkCollisions = true; 
    }

    createChest(name, itemType, x, y, z) {
        // Base del cofre (Más robusta)
        const chest = BABYLON.MeshBuilder.CreateBox(name + "_base", { width: 1.2, height: 0.8, depth: 0.8 }, this.scene);
        chest.position.set(x, y - 0.1, z);
        chest.material = this.assets.getMaterial("wood");
        chest.checkCollisions = true;

        // Bisagra trasera
        const hinge = new BABYLON.TransformNode(name + "_hinge", this.scene);
        hinge.parent = chest;
        hinge.position.set(0, 0.4, 0.4); 

        // Tapa del cofre (Anclada a la bisagra)
        const lid = BABYLON.MeshBuilder.CreateBox(name + "_lid", { width: 1.2, height: 0.3, depth: 0.8 }, this.scene);
        lid.parent = hinge;
        lid.position.set(0, 0.15, -0.4); 
        lid.material = this.assets.getMaterial("wood");

        // Cerradura dorada
        const lock = BABYLON.MeshBuilder.CreateBox(name + "_lock", { width: 0.2, height: 0.2, depth: 0.1 }, this.scene);
        lock.parent = lid;
        lock.position.set(0, -0.05, -0.4);
        const goldMat = new BABYLON.StandardMaterial("goldMat", this.scene);
        goldMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
        lock.material = goldMat;
        
        chest.lidMesh = hinge;

        let generatedItems = [];
        if (itemType === "espada") {
            generatedItems.push(ItemDatabase.getItem("espada_larga")); 
        } else if (itemType === "escudo") {
            generatedItems.push(ItemDatabase.getItem("escudo_hierro")); 
        } else {
            const numItems = Math.floor(Math.random() * 3) + 1; // 1 a 3 objetos
            for (let i = 0; i < numItems; i++) {
                generatedItems.push(ItemDatabase.generateLoot()); 
            }
        }

        chest.metadata = { items: generatedItems, opened: false, broken: false, canAutoTrigger: false };
        this.chests.push(chest);
    }
}