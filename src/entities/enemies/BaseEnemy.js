import { EnemyAI, AI_STATES } from '../../ai/EnemyAI.js';

export class BaseEnemy {
    constructor(scene, name, hp, speed, damage, target) {
        this.scene = scene;
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.damage = damage;
        
        // Malla y físicas (Se definen en las clases hijas, pero configuramos lo básico)
        this.mesh = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, scene);
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);

        // IA
        this.ai = new EnemyAI(this, target, 12, 1.8);
        
        // Estado de combate
        this.isTakingDamage = false;
        this.attackCooldown = 0;
    }

    update() {
        if (this.hp <= 0) return;
        
        // Reducir cooldown de ataque
        if (this.attackCooldown > 0) this.attackCooldown--;

        // La IA decide qué hacer
        this.ai.update();
    }

    idle() {
        // En un futuro: Patrullar aleatoriamente. Por ahora: Quedarse quieto.
    }

    chase(target) {
        if (this.isTakingDamage) return; // No se mueve si está aturdido por un golpe

        // Calcular dirección hacia el jugador
        const direction = target.mesh.position.subtract(this.mesh.position);
        direction.y = 0; // No volar
        direction.normalize();

        // Moverse físicamente hacia el jugador simulando gravedad
        const moveVector = new BABYLON.Vector3(direction.x * this.speed, -0.2, direction.z * this.speed);
        this.mesh.moveWithCollisions(moveVector);
        
        // --- 🛡️ Hard-Collision con el piso ---
        // Evitar que el enemigo se hunda por la gravedad o atraviese el suelo
        if (this.mesh.position.y < 0.5) {
            this.mesh.position.y = 0.5;
        }

        // Mirar hacia el jugador
        const targetAngle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = targetAngle;
    }

    attackTarget(target) {
        if (this.attackCooldown <= 0 && !this.isTakingDamage) {
            // Animación de ataque simple (Saltar un poco)
            this.mesh.position.y += 0.5;
            setTimeout(() => { if(this.mesh) this.mesh.position.y -= 0.5; }, 200);

            console.log(`${this.name} atacó al jugador por ${this.damage} de daño!`);
            // Aquí en un futuro llamaremos a: target.takeDamage(this.damage);
            
            this.attackCooldown = 60; // Esperar 60 frames (1 segundo aprox) antes de volver a atacar
        }
    }

    takeDamage(amount) {
        if (this.hp <= 0) return;

        this.hp -= amount;
        this.isTakingDamage = true;
        
        // Efecto visual de recibir daño (Ponerse rojo)
        const oldColor = this.mesh.material.emissiveColor.clone();
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        
        // Empuje hacia atrás (Knockback) simple
        const backward = this.mesh.calcMovePOV(0, 0, -0.5);
        this.mesh.moveWithCollisions(backward);

        console.log(`${this.name} recibió ${amount} daño. HP Restante: ${this.hp}`);

        if (this.hp <= 0) {
            this.die();
        } else {
            setTimeout(() => {
                if(this.mesh && this.mesh.material) {
                    this.mesh.material.emissiveColor = oldColor;
                    this.isTakingDamage = false;
                }
            }, 300); // 300ms aturdido
        }
    }

    die() {
        this.ai.state = AI_STATES.DEAD;
        
        // Efecto de muerte (Hundirse y desaparecer)
        this.mesh.scaling.y = 0.1;
        this.mesh.material.alpha = 0.5;
        
        setTimeout(() => {
            this.mesh.dispose(); // Eliminar del motor 3D
        }, 1000);
    }
}