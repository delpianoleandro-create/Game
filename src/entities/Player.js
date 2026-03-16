export class Player {
    constructor(scene, input, hud, dialogueManager, soundManager, heroType = "mago") {
        this.scene = scene;
        this.input = input;
        this.hud = hud;
        this.dialogueManager = dialogueManager;
        this.sounds = soundManager; 
        
        // BUG FIX: Al crear la cápsula, el pivote está en el centro. Como mide 2, su centro debe estar en Y=1 para tocar el suelo, no hundido.
        this.mesh = BABYLON.MeshBuilder.CreateCapsule("player", { radius: 0.5, height: 2 }, scene);
        this.mesh.position.y = 1.0; 
        
        this.mesh.checkCollisions = true; 
        this.mesh.ellipsoid = new BABYLON.Vector3(0.48, 0.95, 0.48); // Ligeramente más pequeño que la malla para no atorarse
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.95, 0);

        const mat = new BABYLON.StandardMaterial("playerMat", scene);
        
        // --- PERSONALIZACIÓN DEL HÉROE ---
        this.speed = 0.2;
        if (heroType === "mago") {
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8); // Túnica Azul Oscuro
            mat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2); // Brillo mágico tenue
            this.speed = 0.18; // Mago es un poco más lento
        } else if (heroType === "indiana") {
            mat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2); // Chaqueta Marrón Cuero
            this.mesh.scaling.y = 1.05; // Un poco más alto
        } else if (heroType === "mujer") {
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.3); // Ropa Roja/Vino
            this.mesh.scaling.x = 0.8; // Más delgada
            this.mesh.scaling.z = 0.8;
            this.speed = 0.24; // Más ágil y rápida
        }
        this.mesh.material = mat;

        this.isAttacking = false;
        this.isDefending = false;
        this.canMove = true;
        
        this.inventory = [];
        this.hasSword = false;
        this.hasShield = false;
        
        this.createVisualWeapons();
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
    }

    createVisualWeapons() {
        this.swordMesh = BABYLON.MeshBuilder.CreateBox("sword", { width: 0.2, height: 1.5, depth: 0.2 }, this.scene);
        this.swordMesh.position = new BABYLON.Vector3(0.6, 0.5, 0.5); 
        this.swordMesh.rotation.x = Math.PI / 2; 
        this.swordMesh.parent = this.mesh;
        this.swordMesh.isVisible = false; 
        
        const swordMat = new BABYLON.StandardMaterial("swordMat", this.scene);
        swordMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); 
        this.swordMesh.material = swordMat;

        this.shieldMesh = BABYLON.MeshBuilder.CreateCylinder("shield", { height: 0.1, diameter: 1.2 }, this.scene);
        this.shieldMesh.position = new BABYLON.Vector3(-0.6, 0.5, 0.5); 
        this.shieldMesh.rotation.x = Math.PI / 2;
        this.shieldMesh.rotation.z = Math.PI / 2;
        this.shieldMesh.parent = this.mesh;
        this.shieldMesh.isVisible = false; 
        
        const shieldMat = new BABYLON.StandardMaterial("shieldMat", this.scene);
        shieldMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1); 
        this.shieldMesh.material = shieldMat;
    }

    update(chests, enemies) {
        if (!this.canMove) return;

        // NOTA: El movimiento físico del jugador y la cámara ahora está delegado 
        // en src/controllers/ (TopDownController.js o ShooterController.js)

        // Acciones y Combate
        if (this.input.actionA && !this.isAttacking && !this.isDefending) {
            if (this.hasSword) {
                this.attack(chests, enemies); 
            } else {
                this.input.actionA = false; 
                this.showMessage("Aún no tienes un arma. Busca en los cofres.");
            }
        }
        
        if (this.input.actionB) {
            if (this.hasShield) {
                this.defend();
            } else {
                this.input.actionB = false; 
                if(!this.isDefending) this.showMessage("Aún no tienes un escudo para defenderte.");
            }
        } else if (this.isDefending) {
            this.stopDefend();
        }

        this.checkInteractables(chests);
    }

    showMessage(text) {
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
                const distance = BABYLON.Vector3.Distance(this.mesh.position, chest.position);
                if (distance < 2.5) {
                    this.openChest(chest);
                }
            }
        }
    }

    openChest(chest) {
        chest.metadata.opened = true;
        const itemName = chest.metadata.item;
        chest.material.emissiveColor = new BABYLON.Color3(0, 0, 0); 
        chest.scaling.y = 0.3; 
        chest.position.y = 0.15; 
        
        // Sonido de cofre
        if (this.sounds) this.sounds.playChestOpen();

        this.inventory.push(itemName);
        if (itemName === "espada") {
            this.hasSword = true;
            this.swordMesh.isVisible = true; 
        }
        if (itemName === "escudo") {
            this.hasShield = true;
            this.shieldMesh.isVisible = true; 
        }
        this.hud.updateInventory(this.inventory);
        this.showMessage(`¡Has encontrado: ${itemName.toUpperCase()}!`);
    }

    attack(destructibles, enemies) {
        this.isAttacking = true;
        const anim = new BABYLON.Animation("atk", "rotation.x", 45, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [{ frame: 0, value: 0 }, { frame: 5, value: Math.PI / 2.5 }, { frame: 15, value: 0 }];
        anim.setKeys(keys);
        this.mesh.animations = [anim];
        
        // Sonido de cortar el aire
        if (this.sounds) this.sounds.playSwordSwing();

        let hitSomething = false;

        if (enemies) {
            for (let enemy of enemies) {
                const dist = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
                if (dist < 3.0) {
                    enemy.takeDamage(10);
                    hitSomething = true;
                }
            }
        }

        if (destructibles) {
            for (let i = 0; i < destructibles.length; i++) {
                let obj = destructibles[i];
                if (obj && obj.metadata.opened && !obj.metadata.broken) {
                    const dist = BABYLON.Vector3.Distance(this.mesh.position, obj.position);
                    if (dist < 3.0) {
                        obj.metadata.broken = true; 
                        obj.dispose(); 
                        this.hud.updateGold(5); 
                        this.hud.updateDisplay();
                        hitSomething = true;
                    }
                }
            }
        }

        // Sonido de impacto grave si golpeó a un enemigo o rompió un cofre
        if (hitSomething && this.sounds) {
            this.sounds.playHit();
        }

        this.scene.beginAnimation(this.mesh, 0, 15, false, 1, () => {
            this.isAttacking = false;
        });
    }

    defend() {
        if (!this.isDefending && !this.isAttacking) {
            this.isDefending = true;
            this.mesh.scaling.y = 0.8;
            this.mesh.position.y = 0.8;
            this.shieldMesh.position.x = 0; 
            this.shieldMesh.position.z = 1.0; 
            this.shieldMesh.material.emissiveColor = new BABYLON.Color3(0, 0.5, 1); 
        }
    }

    stopDefend() {
        this.isDefending = false;
        this.mesh.scaling.y = 1;
        this.mesh.position.y = 1;
        this.shieldMesh.position.x = -0.6; 
        this.shieldMesh.position.z = 0.5;
        this.shieldMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0); 
    }
}