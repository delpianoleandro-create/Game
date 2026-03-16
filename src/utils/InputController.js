export class InputController {
    constructor() {
        this.joyX = 0;
        this.joyY = 0;
        this.actionA = false; // Ataque
        this.actionB = false; // Defensa

        this.initJoystick();
        this.initButtons();
    }

    initJoystick() {
        const joystick = document.getElementById("joystick");
        const stick = document.getElementById("stick");
        let centerX = 0, centerY = 0;

        const updateCenter = () => {
            const rect = joystick.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        };

        // Recalcular el centro al iniciar y si la pantalla cambia de tamaño
        window.addEventListener('resize', updateCenter);

        joystick.addEventListener("touchstart", (e) => {
            updateCenter();
            this.handleJoystickMove(e, stick, centerX, centerY);
        }, { passive: false });

        joystick.addEventListener("touchmove", (e) => {
            e.preventDefault();
            this.handleJoystickMove(e, stick, centerX, centerY);
        }, { passive: false });

        joystick.addEventListener("touchend", (e) => {
            e.preventDefault();
            stick.style.left = "50px"; 
            stick.style.top = "50px";
            this.joyX = 0; 
            this.joyY = 0;
        }, { passive: false });
    }

    handleJoystickMove(e, stick, centerX, centerY) {
        const touch = e.touches[0];
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let maxDist = 50; // radio de movimiento interno

        if (dist > maxDist) { 
            dx *= maxDist / dist; 
            dy *= maxDist / dist; 
        }
        
        stick.style.left = (dx + 50) + "px";
        stick.style.top = (dy + 50) + "px";
        
        // Normalizar valores entre -1 y 1. Invertimos Y para el eje Z de Babylon
        this.joyX = dx / maxDist;
        this.joyY = -dy / maxDist; 
    }

    initButtons() {
        const btnA = document.getElementById("actionA");
        const btnB = document.getElementById("actionB");

        btnA.addEventListener("touchstart", (e) => { e.preventDefault(); this.actionA = true; }, { passive: false });
        btnA.addEventListener("touchend", (e) => { e.preventDefault(); this.actionA = false; }, { passive: false });
        
        btnB.addEventListener("touchstart", (e) => { e.preventDefault(); this.actionB = true; }, { passive: false });
        btnB.addEventListener("touchend", (e) => { e.preventDefault(); this.actionB = false; }, { passive: false });
        
        // Fallback para probar en PC
        btnA.addEventListener("mousedown", () => this.actionA = true);
        btnA.addEventListener("mouseup", () => this.actionA = false);
        btnB.addEventListener("mousedown", () => this.actionB = true);
        btnB.addEventListener("mouseup", () => this.actionB = false);
    }
}