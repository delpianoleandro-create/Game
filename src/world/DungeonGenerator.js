export class DungeonGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager; 
        this.walls = [];
        this.chests = [];
        
        // Configuraciones de Mundo Abierto / Laberinto
        this.roomSize = 30; // Tamaño de cada habitación
        this.wallThickness = 2;
        this.doorSize = 8; // Ancho del pasillo que conecta salas
    }

    generate() {
        // En lugar de una sola sala, vamos a generar un "Mundo" de 3x3 habitaciones
        const gridSize = 3; 
        const offset = Math.floor(gridSize / 2);

        // Generar un suelo global gigante para todo el mundo
        const worldSize = this.roomSize * gridSize;
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: worldSize, height: worldSize }, this.scene);
        ground.material = this.assets.getMaterial("floor");
        ground.checkCollisions = true; 

        // Recorrer la cuadrícula y crear las habitaciones
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Calcular la posición central real (3D) de esta habitación
                const roomX = (x - offset) * this.roomSize;
                const roomZ = (z - offset) * this.roomSize;
                
                // Saber si es una habitación del borde del mundo
                const isNorthEdge = (z === gridSize - 1);
                const isSouthEdge = (z === 0);
                const isEastEdge = (x === gridSize - 1);
                const isWestEdge = (x === 0);

                // Construir las paredes de esta habitación, dejando huecos para puertas si no es el borde exterior
                this.buildRoom(roomX, roomZ, isNorthEdge, isSouthEdge, isEastEdge, isWestEdge);
                
                // Decorar y poblar la habitación (Si no es la sala de inicio del jugador)
                if (x !== offset || z !== offset) {
                    this.populateRoom(roomX, roomZ);
                }
            }
        }
    }

    buildRoom(cx, cz, edgeN, edgeS, edgeE, edgeW) {
        const halfRoom = this.roomSize / 2;
        const wThick = this.wallThickness;
        const h = 6; // Altura de paredes

        // Norte (Si es borde exterior, pared completa. Si no, pared partida por la puerta)
        if (edgeN) {
            this.createWall("wN_Full", this.roomSize, h, wThick, cx, 3, cz + halfRoom);
        } else {
            const sideLen = (this.roomSize - this.doorSize) / 2;
            this.createWall("wN_L", sideLen, h, wThick, cx - this.roomSize/4 - this.doorSize/4, 3, cz + halfRoom);
            this.createWall("wN_R", sideLen, h, wThick, cx + this.roomSize/4 + this.doorSize/4, 3, cz + halfRoom);
            // Antorchas en las puertas
            this.createTorch(`tN_${cx}_${cz}`, cx - this.doorSize/2, 2.5, cz + halfRoom - 0.5, "N");
        }

        // Sur
        if (edgeS) {
            this.createWall("wS_Full", this.roomSize, h, wThick, cx, 3, cz - halfRoom);
        } else {
            const sideLen = (this.roomSize - this.doorSize) / 2;
            this.createWall("wS_L", sideLen, h, wThick, cx - this.roomSize/4 - this.doorSize/4, 3, cz - halfRoom);
            this.createWall("wS_R", sideLen, h, wThick, cx + this.roomSize/4 + this.doorSize/4, 3, cz - halfRoom);
        }

        // Este
        if (edgeE) {
            this.createWall("wE_Full", wThick, h, this.roomSize, cx + halfRoom, 3, cz);
        } else {
            const sideLen = (this.roomSize - this.doorSize) / 2;
            this.createWall("wE_B", wThick, h, sideLen, cx + halfRoom, 3, cz - this.roomSize/4 - this.doorSize/4);
            this.createWall("wE_T", wThick, h, sideLen, cx + halfRoom, 3, cz + this.roomSize/4 + this.doorSize/4);
            // Antorchas
            this.createTorch(`tE_${cx}_${cz}`, cx + halfRoom - 0.5, 2.5, cz - this.doorSize/2, "E");
        }

        // Oeste
        if (edgeW) {
            this.createWall("wW_Full", wThick, h, this.roomSize, cx - halfRoom, 3, cz);
        } else {
            const sideLen = (this.roomSize - this.doorSize) / 2;
            this.createWall("wW_B", wThick, h, sideLen, cx - halfRoom, 3, cz - this.roomSize/4 - this.doorSize/4);
            this.createWall("wW_T", wThick, h, sideLen, cx - halfRoom, 3, cz + this.roomSize/4 + this.doorSize/4);
        }
    }

    populateRoom(cx, cz) {
        // Generar un pilar central o ruinas en cada sala para darle cobertura
        const hasPillar = Math.random() > 0.5;
        if (hasPillar) {
            this.createWall(`pillar_${cx}_${cz}`, 3, 5, 3, cx, 2.5, cz);
        }

        // Generar cofre aleatorio en esquinas
        const spawnChest = Math.random() > 0.7; // 30% de probabilidad de cofre por sala
        if (spawnChest) {
            // Posición aleatoria en un cuadrante de la sala (Lejos del centro)
            const offsetX = (Math.random() > 0.5 ? 1 : -1) * (this.roomSize/2 - 4);
            const offsetZ = (Math.random() > 0.5 ? 1 : -1) * (this.roomSize/2 - 4);
            const itemType = Math.random() > 0.5 ? "espada" : "escudo";
            this.createChest(`chest_${cx}_${cz}`, itemType, cx + offsetX, 0.5, cz + offsetZ);
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
        light.range = 15;

        if (!this.scene.torchLights) this.scene.torchLights = [];
        this.scene.torchLights.push(light);
    }

    createWall(name, w, h, d, x, y, z) {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        wall.position.set(x, y, z);
        wall.material = this.assets.getMaterial("wall");
        wall.checkCollisions = true; 
        this.walls.push(wall);
    }

    createChest(name, itemType, x, y, z) {
        const chest = BABYLON.MeshBuilder.CreateBox(name, { width: 1.5, height: 1, depth: 1 }, this.scene);
        chest.position.set(x, y, z);
        chest.material = this.assets.getMaterial("wood");
        chest.checkCollisions = true;
        chest.metadata = { item: itemType, opened: false };
        this.chests.push(chest);
    }
}