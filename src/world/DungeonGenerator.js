export class DungeonGenerator {
    constructor(scene) {
        this.scene = scene;
        
        // Materiales oscuros y rocosos para la mazmorra
        this.wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
        this.wallMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.22);
        this.wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        this.floorMaterial = new BABYLON.StandardMaterial("floorMat", scene);
        this.floorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); 
        this.floorMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        
        this.walls = [];
    }

    generate() {
        // Suelo principal (40x40 unidades)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, this.scene);
        ground.material = this.floorMaterial;

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
        
        // Un objeto llamativo: Un cofre al final (Placeholder)
        const chest = BABYLON.MeshBuilder.CreateBox("chest", { width: 1.5, height: 1, depth: 1 }, this.scene);
        chest.position.set(0, 0.5, 15);
        const chestMat = new BABYLON.StandardMaterial("chestMat", this.scene);
        chestMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1); // Marrón madera
        chestMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0); // Ligero brillo
        chest.material = chestMat;
    }

    createWall(name, w, h, d, x, y, z) {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        wall.position.set(x, y, z);
        wall.material = this.wallMaterial;
        this.walls.push(wall);
    }
}