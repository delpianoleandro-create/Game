export class Player {
    constructor(scene, input) {
        this.scene = scene;
        this.input = input;
        
        // El jugador es temporalmente una cápsula tipo "héroe"
        this.mesh = BABYLON.MeshBuilder.CreateCapsule("player", { radius: 0.5, height: 2 }, scene);
        this.mesh.position.y = 1;
        
        const mat = new BABYLON.StandardMaterial("playerMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8); // Color de la túnica
        this.mesh.material = mat;

        this.speed = 0.15;
        this.isAttacking = false;
        this.isDefending = false;
        
        // Orientación independiente
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
    }

    update() {
        // Moverse
        if (this.input.joyX !== 0 || this.input.joyY !== 0) {
            // No moverse si está defendiendo
            if (!this.isDefending) {
                this.mesh.position.x += this.input.joyX * this.speed;
                this.mesh.position.z += this.input.joyY * this.speed;
            }
            
            // Rotar hacia donde camina
            const targetAngle = Math.atan2(this.input.joyX, this.input.joyY);
            this.mesh.rotation.y = targetAngle;
        }

        // Acciones
        if (this.input.actionA && !this.isAttacking && !this.isDefending) {
            this.attack();
        }
        
        if (this.input.actionB) {
            this.defend();
        } else if (this.isDefending) {
            this.stopDefend();
        }
    }

    attack() {
        this.isAttacking = true;
        // Animación simple de "espada" (inclinarse rápido hacia adelante)
        const anim = new BABYLON.Animation("atk", "rotation.x", 45, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: 0 },
            { frame: 5, value: Math.PI / 3 }, // Baja rápido
            { frame: 15, value: 0 }           // Sube suave
        ];
        anim.setKeys(keys);
        this.mesh.animations = [anim];
        
        this.scene.beginAnimation(this.mesh, 0, 15, false, 1, () => {
            this.isAttacking = false;
        });
    }

    defend() {
        if (!this.isDefending && !this.isAttacking) {
            this.isDefending = true;
            this.mesh.scaling.y = 0.7; // Agacharse bajo el escudo
            this.mesh.position.y = 0.7;
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0.5); // Brillo mágico
        }
    }

    stopDefend() {
        this.isDefending = false;
        this.mesh.scaling.y = 1;
        this.mesh.position.y = 1;
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Vuelve a la normalidad
    }
}