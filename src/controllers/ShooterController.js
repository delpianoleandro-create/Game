export class ShooterController {
    constructor(camera, player, input, canvas) {
        this.camera = camera;
        this.player = player;
        this.input = input;
        
        // Configuración de Cámara en 3ra Persona
        this.camera.radius = 15;
        this.camera.lowerBetaLimit = 0.2;
        this.camera.upperBetaLimit = Math.PI / 2.1;
        
        // Habilitar rotación de cámara por touch/mouse en la pantalla
        this.camera.attachControl(canvas, true);
        this.camera.angularSensibilityX = 1000;
        this.camera.angularSensibilityY = 1000;
        this.camera.panningSensibility = 0;

        // Deshabilitar control por teclado de cámara
        this.camera.keysUp = [];
        this.camera.keysDown = [];
        this.camera.keysLeft = [];
        this.camera.keysRight = [];
    }

    update() {
        if (!this.player.canMove) return;

        // 1. ROTACIÓN: El jugador siempre mira a donde apunta la cámara
        if (this.camera) {
            this.player.mesh.rotation.y = -this.camera.alpha - Math.PI / 2;
        }

        // 2. TRASLACIÓN: Relativa a la visión actual
        if (this.input.joyX !== 0 || this.input.joyY !== 0) {
            if (!this.player.isDefending) {
                const forward = new BABYLON.Vector3(Math.sin(this.player.mesh.rotation.y), 0, Math.cos(this.player.mesh.rotation.y));
                const right = new BABYLON.Vector3(Math.cos(this.player.mesh.rotation.y), 0, -Math.sin(this.player.mesh.rotation.y));
                
                const moveDirection = right.scale(this.input.joyX).add(forward.scale(this.input.joyY));
                
                if (moveDirection.lengthSquared() > 0) {
                    moveDirection.normalize().scaleInPlace(this.player.speed);
                    moveDirection.y = -0.2; // Gravedad
                    this.player.mesh.moveWithCollisions(moveDirection);
                }
            }
        } else {
            this.player.mesh.moveWithCollisions(new BABYLON.Vector3(0, -0.2, 0));
        }

        // --- 🛡️ Hard-Collision con el piso ---
        if (this.player.mesh.position.y < 1.0 && !this.player.isDefending) {
            this.player.mesh.position.y = 1.0;
        }

        this.camera.target = this.player.mesh.position;
    }
}