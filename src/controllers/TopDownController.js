export class TopDownController {
    constructor(camera, player, input, canvas) {
        this.camera = camera;
        this.player = player;
        this.input = input;
        
        // Configuración de la Cámara Inclinada (Isométrica Elevada)
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = 0.8; // Un poco más picada
        this.camera.radius = 32; // Mucho más arriba para vista táctica
        
        // Bloquear límites
        this.camera.lowerBetaLimit = 0.8;
        this.camera.upperBetaLimit = 0.8;
        
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
                
                // Rotar el jugador SUAVEMENTE hacia la dirección en la que camina
                // En Babylon, Atan2(x, z) es la forma correcta de obtener el ángulo de Yaw (Y)
                const targetAngle = Math.atan2(this.input.joyX, this.input.joyY);
                
                // Interpolación lineal (Lerp) para giro suave en vez de robótico
                let currentRotation = this.player.mesh.rotation.y;
                // Ajustar si cruza la frontera de PI y -PI para evitar giros raros (ej. pasar de 180 a -180)
                let diff = targetAngle - currentRotation;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                this.player.mesh.rotation.y += diff * 0.2; // Suavidad 0.2
            }
        } else {
            // Aplicar siempre gravedad aunque no camine
            this.player.mesh.moveWithCollisions(new BABYLON.Vector3(0, -0.2, 0));
        }

        // --- 🛡️ Hard-Collision con el piso ---
        if (this.player.mesh.position.y < 1.0 && !this.player.isDefending) {
            this.player.mesh.position.y = 1.0;
        }
        
        // La cámara sigue al jugador de forma sólida, sin girar
        this.camera.target = this.player.mesh.position;
    }
}