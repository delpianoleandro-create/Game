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
        
        this.heroType = heroType;
        this.projectiles = []; // Para la magia del mago
        
        this.mesh.checkCollisions = true; 
        this.mesh.ellipsoid = new BABYLON.Vector3(0.48, 0.95, 0.48); // Ligeramente más pequeño que la malla para no atorarse
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.95, 0);

        const mat = new BABYLON.StandardMaterial("playerMat", scene);
        
        // --- PERSONALIZACIÓN DEL HÉROE Y ACCESORIOS ---
        this.speed = 0.2;
        if (heroType === "mago") {
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8); // Túnica Azul Oscuro
            mat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2); // Brillo mágico tenue
            this.speed = 0.18; // Mago es un poco más lento

            // Sombrero de Mago
            const hat = BABYLON.MeshBuilder.CreateCylinder("mageHat", { diameterTop: 0, diameterBottom: 0.8, height: 1 }, scene);
            hat.parent = this.mesh;
            hat.position.y = 1.2;
            const hatMat = new BABYLON.StandardMaterial("hatMat", scene);
            hatMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.5);
            hat.material = hatMat;

        } else if (heroType === "indiana") {
            mat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2); // Chaqueta Marrón Cuero
            this.mesh.scaling.y = 1.05; // Un poco más alto

            // Sombrero de Aventurero (Cilindro con ala)
            const hatBase = BABYLON.MeshBuilder.CreateCylinder("indianaHat", { diameter: 0.5, height: 0.4 }, scene);
            hatBase.parent = this.mesh;
            hatBase.position.y = 1.0;
            const hatBrim = BABYLON.MeshBuilder.CreateCylinder("indianaBrim", { diameter: 0.9, height: 0.05 }, scene);
            hatBrim.parent = hatBase;
            hatBrim.position.y = -0.15;
            const hatMat = new BABYLON.StandardMaterial("hatMat", scene);
            hatMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);
            hatBase.material = hatMat;
            hatBrim.material = hatMat;

        } else if (heroType === "mujer") {
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.3); // Ropa Roja/Vino
            this.mesh.scaling.x = 0.8; // Más delgada
            this.mesh.scaling.z = 0.8;
            this.speed = 0.24; // Más ágil y rápida

            // Diadema / Lazo
            const headband = BABYLON.MeshBuilder.CreateTorus("headband", { diameter: 0.52, thickness: 0.05 }, scene);
            headband.parent = this.mesh;
            headband.position.y = 0.8;
            headband.rotation.x = Math.PI / 8;
            const hdMat = new BABYLON.StandardMaterial("hdMat", scene);
            hdMat.diffuseColor = new BABYLON.Color3(1, 1, 0); // Amarillo
            headband.material = hdMat;
        }
        this.mesh.material = mat;

        this.isAttacking = false;
        this.isDefending = false;
        this.canMove = true;
        
        this.inventory = [];
        this.maxInventory = 30;
        this.hasSword = false;
        this.hasShield = false;

        // Conectar Player al HUD
        if (this.hud) {
            this.hud.player = this;
            this.hud.updateInventory(this.inventory);
        }
        
        this.createVisualWeapons();
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
    }

    createVisualWeapons() {
        if (this.heroType === "mago") {
            // Vara mágica
            this.swordMesh = BABYLON.MeshBuilder.CreateCylinder("sword", { height: 1.8, diameter: 0.08 }, this.scene);
            
            // Punta brillante de la vara
            const crystal = BABYLON.MeshBuilder.CreateSphere("crystal", { diameter: 0.2 }, this.scene);
            crystal.parent = this.swordMesh;
            crystal.position.y = 0.9;
            const cryMat = new BABYLON.StandardMaterial("cryMat", this.scene);
            cryMat.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan
            crystal.material = cryMat;
        } else {
            // Espada normal
            this.swordMesh = BABYLON.MeshBuilder.CreateBox("sword", { width: 0.2, height: 1.5, depth: 0.2 }, this.scene);
        }

        this.swordMesh.position = new BABYLON.Vector3(0.6, 0.5, 0.5); 
        this.swordMesh.rotation.x = Math.PI / 2; 
        this.swordMesh.parent = this.mesh;
        this.swordMesh.isVisible = false; 
        
        const swordMat = new BABYLON.StandardMaterial("swordMat", this.scene);
        swordMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); 
        if (this.heroType === "mago") swordMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1); // Madera
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
        
        // --- 🛡️ Hard-Collision con el piso ---
        // Evitar que el jugador se hunda por la gravedad
        if (this.mesh.position.y < 1.0 && !this.isDefending) {
            this.mesh.position.y = 1.0;
        }

        this.updateProjectiles(chests, enemies);

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
            if (!chest.metadata.broken) {
                const distance = BABYLON.Vector3.Distance(this.mesh.position, chest.position);
                if (distance < 2.5) {
                    // Abrir automático la primera vez, o manual después
                    if (!chest.metadata.opened) {
                        this.openChest(chest);
                    } else if (this.input.actionA && this.canMove && chest.metadata.items.length > 0) {
                        this.input.actionA = false;
                        this.openChest(chest);
                    }
                }
            }
        }
    }

    openChest(chest) {
        if (!chest.metadata.opened) {
            chest.metadata.opened = true;
            
            // Animación de abrir cofre
            if (chest.lidMesh) {
                const anim = new BABYLON.Animation("openLid", "rotation.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                const keys = [{ frame: 0, value: 0 }, { frame: 15, value: -Math.PI / 2 }];
                anim.setKeys(keys);
                chest.lidMesh.animations = [anim];
                this.scene.beginAnimation(chest.lidMesh, 0, 15, false);
            } else {
                chest.material.emissiveColor = new BABYLON.Color3(0, 0, 0); 
                chest.scaling.y = 0.3; 
                chest.position.y = 0.15; 
            }
            
            if (this.sounds) this.sounds.playChestOpen();
        }

        this.canMove = false; // Pausar movimiento mientras el UI de Loot esté abierto
        this.hud.showChestLoot(chest);
    }

    lootItem(index, chest) {
        if (this.inventory.length >= this.maxInventory) {
            this.hud.toggleBackpack(false); 
            this.showMessage("¡Tu mochila está llena! (30/30). Vende u ordena objetos.");
            return;
        }

        const item = chest.metadata.items[index];
        chest.metadata.items.splice(index, 1); 
        
        this.inventory.push(item);
        
        if (item.id === "espada") {
            this.hasSword = true;
            this.swordMesh.isVisible = true; 
        } else if (item.id === "escudo") {
            this.hasShield = true;
            this.shieldMesh.isVisible = true; 
        }
        
        this.hud.updateInventory(this.inventory);
        if (this.sounds) this.sounds.playHit(); 
    }

    lootAll(chest) {
        while (chest.metadata.items.length > 0 && this.inventory.length < this.maxInventory) {
            this.lootItem(0, chest);
        }
        this.hud.renderChestItems(); 
        if (this.inventory.length >= this.maxInventory && chest.metadata.items.length > 0) {
            this.showMessage("No pudiste recoger todo. Tu mochila está llena.");
        }
    }

    sellItem(index) {
        const item = this.inventory[index];
        this.inventory.splice(index, 1);
        this.hud.updateGold(item.value);
        if (this.sounds) this.sounds.playHit(); 
        
        // Verificar si nos quedamos sin espada o escudo
        this.hasSword = this.inventory.some(i => i.id === "espada");
        this.swordMesh.isVisible = this.hasSword;
        
        this.hasShield = this.inventory.some(i => i.id === "escudo");
        this.shieldMesh.isVisible = this.hasShield;
    }

    sortInventory() {
        this.inventory.sort((a, b) => b.value - a.value); 
    }

    attack(destructibles, enemies) {
        this.isAttacking = true;
        
        if (this.heroType === "mago") {
            // Ataque a distancia: Dispara proyectil de luz
            if (this.sounds) this.sounds.playSwordSwing(); // Reutilizar sonido por ahora
            
            const projectile = BABYLON.MeshBuilder.CreateSphere("proj", { diameter: 0.4 }, this.scene);
            projectile.position = this.mesh.position.clone();
            projectile.position.y += 0.5; // A la altura del pecho
            
            const projMat = new BABYLON.StandardMaterial("projMat", this.scene);
            projMat.emissiveColor = new BABYLON.Color3(0, 1, 1);
            projectile.material = projMat;
            
            // Luz dinámica para el proyectil
            const pLight = new BABYLON.PointLight("pLight", BABYLON.Vector3.Zero(), this.scene);
            pLight.diffuse = new BABYLON.Color3(0, 1, 1);
            pLight.intensity = 1.0;
            pLight.range = 5;
            pLight.parent = projectile;

            // Obtener dirección a la que mira el jugador (suponiendo que la cámara o el controlador ya lo rotaron)
            const angle = this.mesh.rotation.y;
            const dirX = Math.sin(angle);
            const dirZ = Math.cos(angle);
            const direction = new BABYLON.Vector3(dirX, 0, dirZ).normalize();

            this.projectiles.push({
                mesh: projectile,
                light: pLight,
                direction: direction,
                speed: 0.8,
                life: 60 // frames
            });

            // Animación del bastón (vara)
            const anim = new BABYLON.Animation("atk", "rotation.x", 45, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            const keys = [{ frame: 0, value: Math.PI / 2 }, { frame: 5, value: Math.PI / 4 }, { frame: 15, value: Math.PI / 2 }];
            anim.setKeys(keys);
            this.swordMesh.animations = [anim];
            this.scene.beginAnimation(this.swordMesh, 0, 15, false, 1, () => {
                this.isAttacking = false;
            });

        } else {
            // Ataque cuerpo a cuerpo (resto de héroes)
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
    }

    updateProjectiles(destructibles, enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.mesh.position.addInPlace(p.direction.scale(p.speed));
            p.life--;

            let hit = false;
            
            // Comprobar colisiones con enemigos
            if (enemies) {
                for (let enemy of enemies) {
                    if (BABYLON.Vector3.Distance(p.mesh.position, enemy.mesh.position) < 1.5) {
                        enemy.takeDamage(10);
                        if (this.sounds) this.sounds.playHit();
                        hit = true;
                        break;
                    }
                }
            }

            // Comprobar colisiones con cofres destructibles
            if (!hit && destructibles) {
                for (let obj of destructibles) {
                    if (obj && obj.metadata.opened && !obj.metadata.broken) {
                        if (BABYLON.Vector3.Distance(p.mesh.position, obj.position) < 1.5) {
                            obj.metadata.broken = true;
                            obj.dispose();
                            this.hud.updateGold(5);
                            this.hud.updateDisplay();
                            if (this.sounds) this.sounds.playHit();
                            hit = true;
                            break;
                        }
                    }
                }
            }

            if (hit || p.life <= 0) {
                p.mesh.dispose();
                p.light.dispose();
                this.projectiles.splice(i, 1);
            }
        }
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