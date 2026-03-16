export class MenuManager {
    constructor(onStartGame) {
        this.onStartGameCallback = onStartGame;
        
        // Elementos del DOM
        this.layerMenu = document.getElementById("menu-layer");
        this.mainMenu = document.getElementById("mainMenu");
        this.settingsMenu = document.getElementById("settingsMenu");
        this.uiLayer = document.getElementById("ui-layer");
        this.creditsPanel = document.getElementById("creditsPanel");

        // Botones
        document.getElementById("btnNewGame").addEventListener("click", () => this.startGame());
        document.getElementById("btnSettingsMain").addEventListener("click", () => this.showSettings());
        document.getElementById("btnSaveSettings").addEventListener("click", () => this.hideSettings());
        
        // Botón de Pausa (Dentro del juego)
        document.getElementById("btnPause").addEventListener("click", () => {
            this.showMainMenu();
        });

        // Créditos
        document.getElementById("btnCredits").addEventListener("click", () => this.toggleCredits());

        // Configuración por defecto
        this.config = {
            cameraMode: "TOP_DOWN",
            shadows: true,
            hero: "mago"
        };
    }

    showMainMenu() {
        this.uiLayer.style.display = "none";
        this.layerMenu.style.display = "flex";
        this.mainMenu.style.display = "block";
        this.settingsMenu.style.display = "none";
        
        // Disparar evento para pausar el juego si ya estaba corriendo
        window.dispatchEvent(new Event("pauseGame"));
    }

    showSettings() {
        this.mainMenu.style.display = "none";
        this.settingsMenu.style.display = "block";
    }

    hideSettings() {
        // Leer la configuración seleccionada
        const camRadios = document.getElementsByName("camMode");
        for (let radio of camRadios) {
            if (radio.checked) {
                this.config.cameraMode = radio.value;
                break;
            }
        }
        this.config.shadows = document.getElementById("chkShadows").checked;

        this.settingsMenu.style.display = "none";
        this.mainMenu.style.display = "block";
    }

    startGame() {
        // Leer el héroe seleccionado antes de empezar
        const heroSelect = document.getElementById("heroSelect");
        if (heroSelect) {
            this.config.hero = heroSelect.value;
        }

        this.layerMenu.style.display = "none";
        this.uiLayer.style.display = "block";
        this.creditsPanel.style.display = "none";
        
        // Ajustar UI según el modo
        const crosshair = document.getElementById("crosshair");
        if (this.config.cameraMode === "SHOOTER") {
            crosshair.style.display = "block";
        } else {
            crosshair.style.display = "none";
        }

        // Llamar a la función que arranca el juego con la config
        this.onStartGameCallback(this.config);
    }

    async toggleCredits() {
        if (this.creditsPanel.style.display === "none" || this.creditsPanel.style.display === "") {
            try {
                const res = await fetch(`data/comentarios.json?v=${Date.now()}`);
                const data = await res.json();
                this.creditsPanel.innerHTML = "<h3>👥 Aventureros</h3>";
                data.forEach(entry => {
                    this.creditsPanel.innerHTML += `<p><strong>${entry.usuario}</strong>:<br><i>"${entry.comentario}"</i></p>`;
                });
                this.creditsPanel.style.display = "block";
            } catch (err) {
                this.creditsPanel.innerHTML = "<p>El pergamino está dañado.</p>";
                this.creditsPanel.style.display = "block";
            }
        } else {
            this.creditsPanel.style.display = "none";
        }
    }
}