export class DialogueManager {
    constructor() {
        this.box = document.getElementById("dialogueBox");
        this.nameElement = document.getElementById("dialogueName");
        this.textElement = document.getElementById("dialogueText");
        this.avatarElement = document.getElementById("dialogueAvatar");
        
        this.dialogues = [];
        this.currentDialogIndex = 0;
        this.isTyping = false;
        this.typeSpeed = 30; // ms por letra
        this.currentTimeout = null;
        
        this.onDialogueEnd = null; // Callback para cuando termina la conversación

        // Evento para avanzar diálogo al tocar la caja
        this.box.addEventListener("click", () => this.advanceDialogue());
        this.box.addEventListener("touchstart", (e) => {
            e.preventDefault();
            this.advanceDialogue();
        }, { passive: false });
    }

    startDialogue(dialogueArray, onComplete = null) {
        if (!dialogueArray || dialogueArray.length === 0) return;
        
        this.dialogues = dialogueArray;
        this.currentDialogIndex = 0;
        this.onDialogueEnd = onComplete;
        
        this.box.style.display = "block";
        this.showCurrentDialogue();
    }

    showCurrentDialogue() {
        if (this.currentDialogIndex >= this.dialogues.length) {
            this.endDialogue();
            return;
        }

        const current = this.dialogues[this.currentDialogIndex];
        this.nameElement.textContent = current.speaker;
        this.textElement.textContent = "";
        
        if (this.avatarElement) {
            const speakerLow = current.speaker.toLowerCase();
            let icon = "🗣️";
            if (speakerLow.includes("sistema")) icon = "⚙️";
            else if (speakerLow.includes("tú")) icon = "🧑";
            else if (speakerLow.includes("voz")) icon = "👻";
            this.avatarElement.textContent = icon;
        }
        
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }
        
        this.isTyping = true;
        this.typeText(current.text, 0);
    }

    typeText(text, index) {
        if (!this.isTyping) return; // Evitar letras "de más" si se saltó el diálogo
        if (index < text.length) {
            this.textElement.textContent += text.charAt(index);
            this.currentTimeout = setTimeout(() => {
                this.typeText(text, index + 1);
            }, this.typeSpeed);
        } else {
            this.isTyping = false;
        }
    }

    advanceDialogue() {
        if (this.isTyping) {
            // Si está escribiendo, forzamos a que muestre todo el texto de golpe
            if (this.currentTimeout) {
                clearTimeout(this.currentTimeout);
            }
            this.isTyping = false; // Detener flag antes
            this.textElement.textContent = this.dialogues[this.currentDialogIndex].text;
        } else {
            // Si ya terminó de escribir, pasamos al siguiente
            this.currentDialogIndex++;
            this.showCurrentDialogue();
        }
    }

    endDialogue() {
        this.box.style.display = "none";
        this.dialogues = [];
        if (this.onDialogueEnd) {
            this.onDialogueEnd();
        }
    }
}