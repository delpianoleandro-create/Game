export class Companion {
    constructor(scene, targetPlayer, type) {
        this.scene = scene;
        this.target = targetPlayer;
        this.type = type;

        // Crear la malla del compañero
        if (type === "duende") {
            // Un duende (cápsula verde pequeña)
            this.mesh = BABYLON.MeshBuilder.CreateCapsule("companion_goblin", { radius: 0.25, height: 1 }, scene);
            const mat = new BABYLON.StandardMaterial("compMat", scene);
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2); // Verde
            this.mesh.material = mat;
        } else if (type === "animal") {
            // Un perrito/animal (esfera marrón)
            this.mesh = BABYLON.MeshBuilder.CreateSphere("companion_animal", { diameter: 0.6 }, scene);
            const mat = new BABYLON.StandardMaterial("compMat", scene);
            mat.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1); // Marrón
            this.mesh.material = mat;
            
            // Orejas
            const ear1 = BABYLON.MeshBuilder.CreateBox("ear1", { width: 0.1, height: 0.3, depth: 0.1 }, scene);
            ear1.parent = this.mesh;
            ear1.position = new BABYLON.Vector3(-0.2, 0.3, 0);
            ear1.material = mat;
            
            const ear2 = BABYLON.MeshBuilder.CreateBox("ear2", { width: 0.1, height: 0.3, depth: 0.1 }, scene);
            ear2.parent = this.mesh;
            ear2.position = new BABYLON.Vector3(0.2, 0.3, 0);
            ear2.material = mat;
        }

        // Posición inicial detrás del jugador
        this.mesh.position = this.target.mesh.position.clone();
        this.mesh.position.z -= 2;
        this.mesh.position.y = 0.5;
        this.mesh.checkCollisions = true;

        this.followDistance = 2.0;
        this.speed = 0.05;
    }

    update() {
        if (!this.target || !this.target.mesh) return;

        // Mantenerlo al nivel del suelo
        if (this.type === "duende") {
            this.mesh.position.y = 0.5;
        } else {
            this.mesh.position.y = 0.3;
        }

        const targetPos = this.target.mesh.position;
        const currentPos = this.mesh.position;
        const distance = BABYLON.Vector3.Distance(new BABYLON.Vector3(currentPos.x, 0, currentPos.z), new BABYLON.Vector3(targetPos.x, 0, targetPos.z));

        // Moverse hacia el jugador si está demasiado lejos
        if (distance > this.followDistance) {
            // Calcular dirección
            const dir = targetPos.subtract(currentPos);
            dir.y = 0; // Ignorar eje Y para el movimiento
            dir.normalize();

            // Moverse (interpolación simple)
            this.mesh.position.x += dir.x * this.speed;
            this.mesh.position.z += dir.z * this.speed;

            // Rotar hacia el jugador
            const angle = Math.atan2(dir.x, dir.z);
            this.mesh.rotation.y = angle;
            
            // Animación sencilla de "caminar" o flotar
            if (this.type === "animal") {
                this.mesh.rotation.z = Math.sin(Date.now() / 100) * 0.2;
            } else {
                this.mesh.position.y += Math.sin(Date.now() / 150) * 0.05;
            }
        }
    }
}