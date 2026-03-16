export class DungeonGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager; // Recibe el gestor de texturas
        this.walls = [];
        this.chests = [];
    }

    generate() {
        // Suelo principal (40x40 unidades)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, this.scene);
        ground.material = this.assets.getMaterial("floor"); // ¡Pide la textura al Manager!
        ground.checkCollisions = true; // Suelo sólido

        // Muros perimetrales gigantes
        this.createWall("wallN", 40, 6, 1, 0, 3, 20);
        this.createWall("wallS", 40, 6, 1, 0, 3, -20);
        this.createWall("wallE", 1, 6, 40, 20, 3, 0);
        this.createWall("wallW", 1, 6, 40, -20, 3, 0);

        // Generar pilares de ruinas aleatorios (Obstáculos)
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 36; // Entre -18 y 18
            const z = (Math.random() - 0.5) * 36;
            
            // Dejar la zona central (donde aparece el jugador) despejada
            if (Math.abs(x) > 4 || Math.abs(z) > 4) {
                // Variar el tamaño del pilar para dar aspecto irregular
                const sizeW = 1 + Math.random() * 2;
                const sizeD = 1 + Math.random() * 2;
                this.createWall(`pillar_${i}`, sizeW, 5, sizeD, x, 2.5, z);
            }
        }
        
        // Cofre con la Espada oxidada
        this.createChest("chest_sword", "espada", -10, 0.5, 12);
        // Cofre con el Escudo viejo
        this.createChest("chest_shield", "escudo", 10, 0.5, 12);

        // --- DECORACIÓN: Antorchas de luz amarilla en los muros ---
        // Muro Norte
        this.createTorch("torch_n1", -10, 2.5, 19.5, "N");
        this.createTorch("torch_n2", 10, 2.5, 19.5, "N");
        // Muro Sur
        this.createTorch("torch_s1", -10, 2.5, -19.5, "S");
        this.createTorch("torch_s2", 10, 2.5, -19.5, "S");
        // Muro Este
        this.createTorch("torch_e1", 19.5, 2.5, -10, "E");
        this.createTorch("torch_e2", 19.5, 2.5, 10, "E");
        // Muro Oeste
        this.createTorch("torch_w1", -19.5, 2.5, -10, "W");
        this.createTorch("torch_w2", -19.5, 2.5, 10, "W");
        }

        createTorch(id, x, y, z, side) {
        // 1. Soporte físico
        const holder = BABYLON.MeshBuilder.CreateBox(`${id}_holder`, { width: 0.2, height: 0.5, depth: 0.2 }, this.scene);
        holder.position.set(x, y, z);
        holder.material = this.assets.getMaterial("wood");

        // 2. Fuego visual
        const fire = BABYLON.MeshBuilder.CreateBox(`${id}_fire`, { width: 0.3, height: 0.3, depth: 0.3 }, this.scene);
        fire.position.set(x, y + 0.3, z);
        fire.material = this.assets.getMaterial("fire");

        // 3. LUZ REAL: La separamos un poco del muro según el lado en que esté
        let lightX = x;
        let lightZ = z;
        const offset = 0.6; // Distancia de separación del muro

        if (side === "N") lightZ -= offset;
        if (side === "S") lightZ += offset;
        if (side === "E") lightX -= offset;
        if (side === "W") lightX += offset;

        const light = new BABYLON.PointLight(`${id}_light`, new BABYLON.Vector3(lightX, y + 0.6, lightZ), this.scene);
        light.diffuse = new BABYLON.Color3(1, 0.7, 0.2); // Más naranja fuego
        light.intensity = 1.5; 
        light.range = 15;

        // Guardar la luz en un array global de la escena para poder animarla (parpadeo)
        if (!this.scene.torchLights) this.scene.torchLights = [];
        this.scene.torchLights.push(light);
        }

    createWall(name, w, h, d, x, y, z) {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        wall.position.set(x, y, z);
        wall.material = this.assets.getMaterial("wall"); // ¡Piedra del Manager!
        wall.checkCollisions = true; // Muro sólido
        this.walls.push(wall);
    }

    createChest(name, itemType, x, y, z) {
        const chest = BABYLON.MeshBuilder.CreateBox(name, { width: 1.5, height: 1, depth: 1 }, this.scene);
        chest.position.set(x, y, z);
        chest.material = this.assets.getMaterial("wood"); // ¡Madera del Manager!
        chest.checkCollisions = true;
        
        chest.metadata = { item: itemType, opened: false };
        this.chests.push(chest);
    }
}