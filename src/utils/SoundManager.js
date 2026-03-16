export class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Sonido rápido como un corte de espada ("Swoosh")
    playSwordSwing() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    // Sonido mágico al abrir un cofre ("Tilin!")
    playChestOpen() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.4);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
    }

    // Sonido grave de golpe a enemigo
    playHit() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'square';
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }
}