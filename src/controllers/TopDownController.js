export class TopDownController {
    constructor(camera, player, input, canvas) {
        this.camera = camera;
        this.player = player;
        this.input = input;
        
        // Configuración de la Cámara Cenital / Isométrica
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = Math.PI / 3; // Ángulo picado
        this.camera.radius = 20; // Más lejos para ver más terreno
        
        // IMPORTANTE: Desactivar rotación táctil de pantalla en este modo
        this.camera.detachControl(); 
    }

    update() {
        if (!this.player.canMove) return;

        // Traslación Absoluta: Moverse Norte/Sur/Este/Oeste según Joystick
        if (this.input.joyX !== 0 || this.input.joyY !== 0) {
            if (!this.player.isDefending) {
                const moveDirection = new BABYLON.Vector3(this.input.joyX, -0.2, this.input.joyY);
                moveDirection.normalize().scaleInPlace(this.player.speed);
                moveDirection.y = -0.2; // Gravedad
                this.player.mesh.moveWithCollisions(moveDirection);
                
                // Rotar el jugador hacia la dirección en la que camina
                const targetAngle = Math.atan2(this.input.joyX, this.input.joyY);
                this.player.mesh.rotation.y = targetAngle;
            }
        } else {
            // Aplicar siempre gravedad aunque no camine
            this.player.mesh.moveWithCollisions(new BABYLON.Vector3(0, -0.2, 0));
        }
        
        // La cámara sigue al jugador de forma sólida, sin girar
        this.camera.target = this.player.mesh.position;
    }
}