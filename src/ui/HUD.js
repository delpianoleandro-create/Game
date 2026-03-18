import { logger } from '../game.js';

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
        
        this.gold = 0;
        this.level = 1;
        this.player = null; // Se setea desde Player
        this.currentChest = null;
        
        this.initEvents();
    }

    initEvents() {
        if (this.btnBackpack) {
            this.btnBackpack.addEventListener("click", () => this.toggleBackpack());
        }
        
        document.getElementById("btnCloseBackpack").addEventListener("click", () => this.toggleBackpack(false));
        document.getElementById("btnSortBackpack").addEventListener("click", () => {
            if (this.player) {
                this.player.sortInventory();
                this.updateInventory(this.player.inventory);
            }
        });
        
        document.getElementById("btnCloseChest").addEventListener("click", () => {
            this.chestModal.style.display = "none";
            if (this.player) {
                this.player.canMove = true;
            }
        });
        
        document.getElementById("btnLootAll").addEventListener("click", () => {
            if (this.player && this.currentChest) {
                this.player.lootAll(this.currentChest);
            }
        });

        // Logs events
        window.addEventListener("exitGame", () => {
            this.showLogs();
        });

        document.getElementById("btnCloseLog").addEventListener("click", () => {
            this.logModal.style.display = "none";
            // Volver al menú principal
            window.dispatchEvent(new Event("pauseGame"));
            document.getElementById("ui-layer").style.display = "none";
            document.getElementById("menu-layer").style.display = "flex";
            document.getElementById("mainMenu").style.display = "block";
        });

        document.getElementById("btnDownloadLog").addEventListener("click", () => {
            if (logger) logger.downloadReport();
        });
    }

    showLogs() {
        if (this.player) this.player.canMove = false;
        if (logger) {
            this.logContent.textContent = logger.getReport();
        }
        this.logModal.style.display = "flex";
    }

    toggleBackpack(forceShow) {
        if (forceShow === true || this.backpackModal.style.display === "none") {
            this.backpackModal.style.display = "flex";
            if (this.player) {
                this.updateInventory(this.player.inventory);
                this.updateEquipment(this.player.equipment);
            }
        } else {
            this.backpackModal.style.display = "none";
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
            slot.onclick = () => {
                if (this.player) {
                    this.player.lootItem(index, this.currentChest);
                    this.renderChestItems(); // re-render
                }
            };
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
                el.onclick = () => {
                    if(this.player) {
                        this.player.unequipItem(slotId);
                        this.updateEquipment(this.player.equipment);
                        this.updateInventory(this.player.inventory);
                    }
                };
            } else {
                el.innerHTML = `
                    <span class="item-icon" style="opacity: 0.3;">${defaultIcon}</span>
                    <span class="item-name">${defaultName}</span>
                `;
                el.onclick = null;
            }
        };

        renderEquipSlot("equipWeapon", equipment.weapon, "🗡️", "Arma");
        renderEquipSlot("equipShield", equipment.shield, "🛡️", "Escudo");
        renderEquipSlot("equipCompanion", equipment.companion, "✨", "Compañero");
    }

    updateInventory(items) {
        if(!items) return;
        
        // Update button
        const pct = Math.floor((items.length / 30) * 100);
        if(this.backpackFill) this.backpackFill.textContent = `${pct}%`;
        if(this.backpackCount) this.backpackCount.textContent = items.length;
        
        // Render backpack items
        this.backpackItems.innerHTML = "";
        items.forEach((item, index) => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            slot.title = "Toca para Equipar/Usar";
            slot.innerHTML = `
                <div class="sell-btn" title="Vender" data-index="${index}">💰${item.value}</div>
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
            `;
            
            slot.onclick = (e) => {
                // Si hizo clic en el botón de vender, no hacemos el "equip"
                if (e.target.classList.contains("sell-btn")) {
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
            };

            this.backpackItems.appendChild(slot);
        });
    }
}