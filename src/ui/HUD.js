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
                // Si el cofre está vacío, lo marcamos como roto para que desaparezca o quede abierto
                if (this.currentChest && this.currentChest.metadata.items.length === 0) {
                    this.currentChest.metadata.broken = true;
                }
            }
        });
        
        document.getElementById("btnLootAll").addEventListener("click", () => {
            if (this.player && this.currentChest) {
                this.player.lootAll(this.currentChest);
            }
        });
    }

    toggleBackpack(forceShow) {
        if (forceShow === true || this.backpackModal.style.display === "none") {
            this.backpackModal.style.display = "flex";
            if (this.player) this.updateInventory(this.player.inventory);
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
    }

    updateLevel(level) {
        this.level = level;
        this.updateDisplay();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = `Oro: ${this.gold} | Nivel: ${this.level}`;
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
            slot.title = "Clic para VENDER por " + item.value + " oro";
            slot.innerHTML = `
                <span class="item-price">💰${item.value}</span>
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
            `;
            // Click to sell
            slot.onclick = () => {
                if (this.player) {
                    this.player.sellItem(index);
                    this.updateInventory(this.player.inventory);
                }
            };
            this.backpackItems.appendChild(slot);
        });
    }
}