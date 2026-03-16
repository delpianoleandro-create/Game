export class HUD {
    constructor() {
        this.scoreDisplay = document.getElementById("scoreDisplay");
        this.inventoryItems = document.getElementById("inventoryItems");
        this.gold = 0;
        this.level = 1;
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
        if (items.length === 0) {
            this.inventoryItems.textContent = "Vacío";
        } else {
            const displayItems = items.map(item => item.charAt(0).toUpperCase() + item.slice(1));
            this.inventoryItems.textContent = displayItems.join(", ");
        }
    }
}