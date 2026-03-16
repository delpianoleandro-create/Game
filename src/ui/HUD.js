export class HUD {
    constructor() {
        this.scoreDisplay = document.getElementById("scoreDisplay");
        this.creditsBtn = document.getElementById("creditsBtn");
        this.creditsPanel = document.getElementById("creditsPanel");
        this.gold = 0;
        this.level = 1;

        this.initCredits();
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

    initCredits() {
        this.creditsBtn.addEventListener("click", async () => {
            if (this.creditsPanel.style.display === "none" || this.creditsPanel.style.display === "") {
                try {
                    const res = await fetch("data/comentarios.json");
                    const data = await res.json();
                    this.creditsPanel.innerHTML = "<h3>👥 Aventureros</h3>";
                    data.forEach(entry => {
                        this.creditsPanel.innerHTML += `<p><strong>${entry.usuario}</strong>:<br><i>"${entry.comentario}"</i></p>`;
                    });
                    this.creditsPanel.style.display = "block";
                } catch (err) {
                    this.creditsPanel.innerHTML = "<p>El pergamino está dañado (Error al cargar).</p>";
                    this.creditsPanel.style.display = "block";
                }
            } else {
                this.creditsPanel.style.display = "none";
            }
        });
    }
}