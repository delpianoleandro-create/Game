import { logger } from '../game.js?v=13';

export class HUD {
    constructor() {
        this.scoreDisplay = document.getElementById("scoreDisplay");
        this.btnBackpack = document.getElementById("btnBackpack");
        this.backpackFill = document.getElementById("backpackFill");
        
        this.backpackModal = document.getElementById("backpackModal");
        this.backpackItems = document.getElementById("backpackItems");
        this.backpackCount = document.getElementById("backpackCount");
        
        this.chestModal = document.getElementById("chestModal");
        this.chestItems = document.getElementById("chestItems");

        this.logModal = document.getElementById("logModal");
        this.logContent = document.getElementById("logContent");

        this.healthBar = document.getElementById("healthBar");
        this.healthText = document.getElementById("healthText");
        this.energyBar = document.getElementById("energyBar");
        this.energyText = document.getElementById("energyText");

        this.gameOverModal = document.getElementById("gameOverModal");

        this.gold = 0;        this.level = 1;
        this.player = null; // Se setea desde Player
        this.currentChest = null;
        
        this.initEvents();
    }

    bindTap(el, action) {
        if (!el) return;
        let lastTrigger = 0;
        const handler = (e) => {
            const now = Date.now();
            if (now - lastTrigger < 500) return; // Incrementar debounce
            lastTrigger = now;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            action(e);
        };
        // Usar EXCLUSIVAMENTE pointerdown para evitar doble firing de touchstart+mousedown
        el.addEventListener("pointerdown", handler, { passive: false });
    }

    replaceAndBind(id, action) {
        let el = document.getElementById(id);
        if (!el && id === "btnBackpack") el = this.btnBackpack;
        if (!el) return;
        
        // Clonar para purgar event listeners de sesiones anteriores (evita bug de doble disparo al reiniciar)
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        
        if (id === "btnBackpack") this.btnBackpack = clone;
        
        this.bindTap(clone, action);
    }

    initEvents() {
        this.replaceAndBind("btnBackpack", () => this.toggleBackpack());
        this.replaceAndBind("btnCloseBackpack", () => this.toggleBackpack(false));
        this.replaceAndBind("btnCloseBackpackTop", () => this.toggleBackpack(false));

        this.replaceAndBind("btnSortBackpack", () => {
            if (this.player) {
                this.player.sortInventory();
                this.updateInventory(this.player.inventory);
            }
        });

        this.replaceAndBind("btnCloseChest", () => {
            this.chestModal.style.display = "none";
            if (this.player) {
                this.player.canMove = true;
            }
        });

        this.replaceAndBind("btnLootAll", () => {
            if (this.player && this.currentChest) {
                this.player.lootAll(this.currentChest);
            }
        });
        
        // Logs events
        window.addEventListener("exitGame", () => {
            this.showLogs();
        });

        const btnCloseLog = document.getElementById("btnCloseLog");
        if (btnCloseLog) {
            const cloneLog = btnCloseLog.cloneNode(true);
            btnCloseLog.parentNode.replaceChild(cloneLog, btnCloseLog);
            cloneLog.addEventListener("click", () => {
                this.logModal.style.display = "none";
                window.dispatchEvent(new Event("pauseGame"));
                document.getElementById("ui-layer").style.display = "none";
                document.getElementById("menu-layer").style.display = "flex";
                document.getElementById("mainMenu").style.display = "block";
            });
        }

        const btnDownloadLog = document.getElementById("btnDownloadLog");
        if (btnDownloadLog) {
            const cloneDL = btnDownloadLog.cloneNode(true);
            btnDownloadLog.parentNode.replaceChild(cloneDL, btnDownloadLog);
            cloneDL.addEventListener("click", () => {
                if (logger) logger.downloadReport();
            });
        }

        const btnRestartGame = document.getElementById("btnRestartGame");
        if (btnRestartGame) {
            this.replaceAndBind("btnRestartGame", () => {
                this.gameOverModal.style.display = "none";
                window.dispatchEvent(new Event("pauseGame"));
                document.getElementById("ui-layer").style.display = "none";
                document.getElementById("menu-layer").style.display = "flex";
                document.getElementById("btnNewGame").click(); // Simular un clic para empezar nueva partida
            });
        }
    }

    showGameOver() {
        if (this.player) this.player.canMove = false;
        if (this.gameOverModal) {
            this.gameOverModal.style.display = "block";
        }
    }

    updateHealth(current, max) {
        if (this.healthBar && this.healthText) {
            const pct = Math.max(0, Math.min(100, (current / max) * 100));
            this.healthBar.style.width = `${pct}%`;
            this.healthText.textContent = `${Math.floor(current)}/${max}`;
        }
    }

    updateEnergy(current, max) {
        if (this.energyBar && this.energyText) {
            const pct = Math.max(0, Math.min(100, (current / max) * 100));
            this.energyBar.style.width = `${pct}%`;
            this.energyText.textContent = `${Math.floor(current)}/${max}`;
        }
    }

    showLogs() {
        if (this.player) this.player.canMove = false;
        if (logger) {
            this.logContent.textContent = logger.getReport();
        }
        this.logModal.style.display = "flex";
    }

    toggleBackpack(forceShow) {
        if (forceShow === true || this.backpackModal.style.display !== "flex") {
            this.backpackModal.style.display = "flex";
            if (this.player) {
                this.player.canMove = false; // Pausar movimiento
                this.updateInventory(this.player.inventory);
                this.updateEquipment(this.player.equipment);
            }
        } else {
            this.backpackModal.style.display = "none";
            if (this.player) {
                this.player.canMove = true; // Reanudar movimiento
            }
        }
    }

    showChestLoot(chest) {
        this.currentChest = chest;
        this.chestModal.style.display = "flex";
        this.renderChestItems();
    }

    renderChestItems() {
        this.chestItems.innerHTML = "";
        if (!this.currentChest || !this.currentChest.metadata.items) return;
        
        const items = this.currentChest.metadata.items;
        items.forEach((item, index) => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            slot.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
            `;
            this.bindTap(slot, () => {
                if (this.player) {
                    this.player.lootItem(index, this.currentChest);
                    this.renderChestItems(); // re-render
                }
            });
            this.chestItems.appendChild(slot);
        });
        
        if (items.length === 0) {
            this.chestItems.innerHTML = "<p style='width:100%;text-align:center;color:#aaa;grid-column: 1 / -1;'>Vacío</p>";
        }
    }

    updateGold(amount) {
        this.gold += amount;
        this.updateDisplay();
        if (amount > 0 && logger) logger.addLog(`Recolectó ${amount} de oro`, 'info');
    }

    updateLevel(level) {
        this.level = level;
        this.updateDisplay();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = `Oro: ${this.gold} | Nivel: ${this.level}`;
        const goldModal = document.getElementById("goldDisplayModal");
        if(goldModal) goldModal.textContent = `💰 Oro: ${this.gold}`;
    }

    updateEquipment(equipment) {
        if(!equipment) return;
        
        const renderEquipSlot = (slotId, item, defaultIcon, defaultName) => {
            const el = document.getElementById(slotId);
            if (!el) return;
            if (item) {
                el.innerHTML = `
                    <span class="item-price" style="background:green">E</span>
                    <span class="item-icon">${item.icon}</span>
                    <span class="item-name">${item.name}</span>
                `;
                this.bindTap(el, () => {
                    if(this.player) {
                        this.player.unequipItem(slotId);
                        this.updateEquipment(this.player.equipment);
                        this.updateInventory(this.player.inventory);
                    }
                });
            } else {
                el.innerHTML = `
                    <span class="item-icon" style="opacity: 0.3;">${defaultIcon}</span>
                    <span class="item-name">${defaultName}</span>
                `;
                // Remove previous event listeners by cloning
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);
            }
        };

        renderEquipSlot("equipWeapon", equipment.weapon, "🗡️", "Arma");
        renderEquipSlot("equipShield", equipment.shield, "🛡️", "Escudo");
        renderEquipSlot("equipHelmet", equipment.helmet, "🪖", "Casco");
        renderEquipSlot("equipArmor", equipment.armor, "🦺", "Armadura");
        renderEquipSlot("equipBoots", equipment.boots, "👢", "Botas");
        renderEquipSlot("equipAccessory", equipment.accessory, "💍", "Accesorio");
        renderEquipSlot("equipCompanion", equipment.companion, "✨", "Compañero");
    }

    updateInventory(items) {
        if(!items) return;

        // Update button
        const count = items.length;
        if(this.backpackFill) this.backpackFill.textContent = count;
        if(this.backpackCount) this.backpackCount.textContent = count;

        // Render backpack items
        if(this.backpackItems) this.backpackItems.innerHTML = "";
        
        items.forEach((item, index) => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            slot.title = "Toca para Equipar/Usar";
            slot.innerHTML = `
                <div class="sell-btn" title="Vender" data-index="${index}">💰${item.value}</div>
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
            `;
            
            this.bindTap(slot, (e) => {
                // Si hizo clic en el botón de vender, no hacemos el "equip"
                if (e.target && e.target.classList && e.target.classList.contains("sell-btn")) {
                    if (this.player) {
                        this.player.sellItem(index);
                        this.updateInventory(this.player.inventory);
                    }
                    return;
                }

                if (this.player) {
                    if (item.type === "weapon" || item.type === "shield" || item.type === "companion_power") {
                        this.player.equipItem(index);
                    } else if (item.type === "gold") {
                        this.player.useItem(index);
                    } else {
                        // Vender por defecto si no es equipable
                        this.player.sellItem(index);
                    }
                    this.updateInventory(this.player.inventory);
                    this.updateEquipment(this.player.equipment);
                }
            });

            this.backpackItems.appendChild(slot);
        });
    }
}