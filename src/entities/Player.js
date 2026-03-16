export class Player {
    constructor(scene, input, hud, dialogueManager) {
        this.scene = scene;
        this.input = input;
        this.hud = hud;
        this.dialogueManager = dialogueManager;
        
        // El jugador es temporalmente una cápsula
        this.mesh = BABYLON.MeshBuilder.CreateCapsule("player", { radius: 0.5, height: 2 }, scene);
        this.mesh.position.y = 1;
        
        // Físicas: Darle masa sólida al jugador
        this.mesh.checkCollisions = true; 
        this.mesh.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5); // El "tamaño" de su cuerpo para chocar
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

        const mat = new BABYLON.StandardMaterial("playerMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8); // Color de la túnica
        this.mesh.material = mat;

        this.speed = 0.2; // Un poco más rápido para compensar la fricción de colisiones
        this.isAttacking = false;
        this.isDefending = false;
        this.canMove = true;
        
        // Sistema de Inventario
        this.inventory = [];
        this.hasSword = false;
        this.hasShield = false;
        
        // Orientación independiente
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
    }

    update(chests) {
        if (!this.canMove) return;

        // Moverse usando Físicas (moveWithCollisions)
        if (this.input.joyX !== 0 || this.input.joyY !== 0) {
            if (!this.isDefending) {
                // Vector de movimiento. Añadimos -0.1 en Y para simular "gravedad" contra el suelo
                const moveDirection = new BABYLON.Vector3(this.input.joyX * this.speed, -0.1, this.input.joyY * this.speed);
                this.mesh.moveWithCollisions(moveDirection);
            }
            
            // Rotar hacia donde camina
            const targetAngle = Math.atan2(this.input.joyX, this.input.joyY);
            this.mesh.rotation.y = targetAngle;
        }

        // Acciones y Combate
        if (this.input.actionA && !this.isAttacking && !this.isDefending) {
            if (this.hasSword) {
                this.attack();
            } else {
                this.input.actionA = false; // Soltar botón virtual
                this.showMessage("Aún no tienes un arma. Busca en los cofres.");
            }
        }
        
        if (this.input.actionB) {
            if (this.hasShield) {
                this.defend();
            } else {
                this.input.actionB = false; // Soltar botón virtual
                if(!this.isDefending) this.showMessage("Aún no tienes un escudo para defenderte.");
            }
        } else if (this.isDefending) {
            this.stopDefend();
        }

        // Interacción con objetos del entorno (Cofres)
        this.checkInteractables(chests);
    }

    showMessage(text) {
        // Evitar múltiples mensajes si ya está pausado
        if (this.canMove) {
            this.canMove = false;
            this.dialogueManager.startDialogue([
                { speaker: "Sistema", text: text }
            ], () => {
                this.canMove = true;
            });
        }
    }

    checkInteractables(chests) {
        if (!chests) return;
        
        for (let chest of chests) {
            if (!chest.metadata.opened) {
                // Medir distancia entre el jugador y el cofre
                const distance = BABYLON.Vector3.Distance(this.mesh.position, chest.position);
                
                // Si está lo suficientemente cerca (Rango de interacción)
                if (distance < 2.5) {
                    this.openChest(chest);
                }
            }
        }
    }

    openChest(chest) {
        chest.metadata.opened = true;
        const itemName = chest.metadata.item;
        
        // Efecto visual de "cofre abierto"
        chest.material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Pierde el brillo mágico
        chest.scaling.y = 0.3; // Se "aplasta" para simular que está abierto
        chest.position.y = 0.15; // Ajustar a nivel del suelo
        
        // Añadir al inventario
        this.inventory.push(itemName);
        if (itemName === "espada") this.hasSword = true;
        if (itemName === "escudo") this.hasShield = true;
        
        // Actualizar UI
        this.hud.updateInventory(this.inventory);
        this.showMessage(`¡Has encontrado: ${itemName.toUpperCase()}!`);
    }

    attack() {
        this.isAttacking = true;
        const anim = new BABYLON.Animation("atk", "rotation.x", 45, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: 0 },
            { frame: 5, value: Math.PI / 3 },
            { frame: 15, value: 0 }
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
            this.mesh.scaling.y = 0.7;
            this.mesh.position.y = 0.7;
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0.5);
        }
    }

    stopDefend() {
        this.isDefending = false;
        this.mesh.scaling.y = 1;
        this.mesh.position.y = 1;
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }
}