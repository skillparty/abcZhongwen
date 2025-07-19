// Aplicación principal - Coordinador de todos los módulos
class SpanishChineseApp {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.sequentialBtn = document.getElementById('sequentialBtn');
        this.cascadeBtn = document.getElementById('cascadeBtn');
        this.burstBtn = document.getElementById('burstBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Estado de la aplicación
        this.currentMode = 'sequential';
        this.messageChars = [];
        this.charIndex = 0;
        this.isReplaying = false;
        
        // Historial de mensajes
        this.messageHistory = JSON.parse(localStorage.getItem('messageHistory') || '[]');
        this.currentMessageId = null;
        
        // Colaboración
        this.isCollaborating = false;
        this.collaborationId = null;
        this.collaborators = new Map();
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadHistory();
    }

    initializeApp() {
        // Aplicar configuraciones guardadas
        const savedFontSize = localStorage.getItem('fontSize') || '2.5em';
        const savedFontFamily = localStorage.getItem('fontFamily') || 'Courier New';
        
        visualizer.updateFontSize(parseFloat(savedFontSize));
        visualizer.updateFontFamily(savedFontFamily);
        
        // Mantener el foco en el input
        this.textInput.focus();
        
        console.log('Aplicación Traductor Español-Chino inicializada');
    }

    setupEventListeners() {
        // Evento principal de entrada de texto
        this.textInput.addEventListener('input', (e) => {
            audioManager.initAudio();
            const newText = e.target.value;
            
            // Solo agregar nuevos caracteres del texto original
            if (newText.length > this.messageChars.length) {
                for (let i = this.messageChars.length; i < newText.length; i++) {
                    this.messageChars.push(newText[i]);
                    this.addCharacterToMessage(newText[i], i);
                }
            }
            // Manejar backspace
            else if (newText.length < this.messageChars.length) {
                const charsToRemove = this.messageChars.length - newText.length;
                this.messageChars = this.messageChars.slice(0, -charsToRemove);
                
                // Remover elementos de caracteres
                const charElements = visualizer.messageDisplay.querySelectorAll('.char-display');
                for (let i = 0; i < charsToRemove; i++) {
                    if (charElements[charElements.length - 1 - i]) {
                        charElements[charElements.length - 1 - i].remove();
                    }
                }
            }
            
            // Configurar traducción para mostrar en el campo de abajo
            translator.setupTranslation(newText);
        });

        // Botones de modo
        this.sequentialBtn.addEventListener('click', () => this.setMode('sequential'));
        this.cascadeBtn.addEventListener('click', () => this.setMode('cascade'));
        this.burstBtn.addEventListener('click', () => this.setMode('burst'));
        this.clearBtn.addEventListener('click', () => this.clearMessage());

        // Mantener foco en el input
        this.textInput.addEventListener('blur', () => {
            setTimeout(() => this.textInput.focus(), 100);
        });
    }

    // Agregar carácter al mensaje (texto original con efectos)
    addCharacterToMessage(char, index) {
        visualizer.addCharacterToMessage(char, index, this.currentMode);
        
        // Reproducir sonido
        audioManager.playCharacterSound(char, index, this.currentMode);
        
        // Verificar finalización de palabra
        if (char === ' ' || index === this.messageChars.length - 1) {
            this.highlightCompletedWord(index);
        }
    }

    // Resaltar palabra completada
    highlightCompletedWord(index) {
        const soundDelay = this.getSoundDelay(index);
        
        setTimeout(() => {
            const words = visualizer.messageDisplay.querySelectorAll('.char-display');
            let wordStart = 0;
            for (let i = 0; i <= index; i++) {
                if (this.messageChars[i] === ' ' || i === index) {
                    // Resaltar palabra completada
                    for (let j = wordStart; j <= i; j++) {
                        if (words[j]) {
                            words[j].classList.add('word-glow');
                            setTimeout(() => words[j].classList.remove('word-glow'), 1000);
                        }
                    }
                    wordStart = i + 1;
                }
            }
        }, soundDelay + 300);
    }

    // Obtener delay de sonido según el modo
    getSoundDelay(index) {
        switch(this.currentMode) {
            case 'sequential': return index * 100;
            case 'cascade': return index * 50;
            case 'burst': return Math.random() * 200;
            default: return 0;
        }
    }

    // Cambiar modo de visualización
    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Btn').classList.add('active');
    }

    // Limpiar mensaje
    clearMessage() {
        this.textInput.value = '';
        this.messageChars = [];
        this.charIndex = 0;
        visualizer.clearMessage();
        const translationContent = translator.translationDisplay.querySelector('.translation-content');
        if (translationContent) {
            translationContent.textContent = '';
        }
    }

    // Funciones de historial
    saveCurrentMessage() {
        if (this.messageChars.length === 0) return;
        
        const originalText = this.messageChars.join('');
        const translation = translator.getImmediateTranslation(originalText);
        
        const message = {
            id: Date.now(),
            text: originalText,
            translation: translation,
            timestamp: new Date().toISOString(),
            mode: this.currentMode,
            colorPalette: visualizer.customColorPalette ? 'custom' : 'default',
            fontSize: visualizer.currentFontSize,
            fontFamily: visualizer.currentFontFamily
        };
        
        this.messageHistory.unshift(message);
        
        // Limitar historial a 50 mensajes
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(0, 50);
        }
        
        localStorage.setItem('messageHistory', JSON.stringify(this.messageHistory));
        this.updateHistoryDisplay();
        
        this.showNotification('Mensaje guardado', 'success');
    }

    loadHistory() {
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.messageHistory.forEach(message => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="message-preview">${message.text}</div>
                <div class="message-preview" style="color: #ffd93d; font-size: 0.9em;">${message.translation}</div>
                <div class="message-meta">
                    <span>${new Date(message.timestamp).toLocaleString('es-ES')}</span>
                    <span>${message.mode}</span>
                </div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.replayMessage(message);
            });
            
            historyList.appendChild(historyItem);
        });
    }

    replayMessage(message) {
        this.clearMessage();
        this.setMode(message.mode);
        
        // Configurar estilo
        if (message.fontSize) visualizer.updateFontSize(parseFloat(message.fontSize));
        if (message.fontFamily) visualizer.updateFontFamily(message.fontFamily);
        
        // Reproducir mensaje original carácter por carácter
        this.isReplaying = true;
        let index = 0;
        
        const replayInterval = setInterval(() => {
            if (index < message.text.length) {
                this.textInput.value += message.text[index];
                this.messageChars.push(message.text[index]);
                this.addCharacterToMessage(message.text[index], index);
                index++;
            } else {
                clearInterval(replayInterval);
                this.isReplaying = false;
                // La traducción se mostrará automáticamente por el evento input
            }
        }, 150);
    }

    clearHistory() {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            this.messageHistory = [];
            localStorage.removeItem('messageHistory');
            this.updateHistoryDisplay();
            this.showNotification('Historial borrado', 'info');
        }
    }

    // Compartir mensaje
    shareMessage() {
        if (this.messageChars.length === 0) {
            this.showNotification('No hay mensaje para compartir', 'warning');
            return;
        }
        
        const message = this.messageChars.join('');
        const translation = translator.getImmediateTranslation(message);
        const shareText = `Original: ${message}\n中文: ${translation}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Traductor Multiidioma-Chino',
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Mensaje copiado al portapapeles', 'success');
            });
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Exportar como GIF (placeholder)
    exportAsGif() {
        this.showNotification('Función de exportación GIF en desarrollo', 'info');
    }
}

// Funciones globales para los paneles
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    panel.classList.toggle('active');
}

function toggleCustomization() {
    const panel = document.getElementById('customizationPanel');
    panel.classList.toggle('active');
}

function toggleCollaboration() {
    const panel = document.getElementById('collaborationPanel');
    panel.classList.toggle('active');
}

// Funciones de personalización
function updateFontSize(value) {
    visualizer.updateFontSize(value);
}

function updateFontFamily(value) {
    visualizer.updateFontFamily(value);
}

function useDefaultPalette() {
    visualizer.useDefaultPalette();
}

function useCustomPalette(paletteName) {
    visualizer.useCustomPalette(paletteName);
}

function toggleVoiceInput() {
    audioManager.toggleVoiceInput();
}

// Funciones de historial
function saveCurrentMessage() {
    app.saveCurrentMessage();
}

function shareMessage() {
    app.shareMessage();
}

function clearHistory() {
    app.clearHistory();
}

function exportAsGif() {
    app.exportAsGif();
}

// Funciones de colaboración (placeholder)
function createCollabRoom() {
    app.showNotification('Función de colaboración en desarrollo', 'info');
}

function joinCollabRoom() {
    app.showNotification('Función de colaboración en desarrollo', 'info');
}

function copyRoomId() {
    app.showNotification('Función de colaboración en desarrollo', 'info');
}

// Función para crear partículas flotantes
function createFloatingParticles() {
    const container = document.getElementById('floatingParticles');
    if (!container) return;
    
    // Crear 20 partículas
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posición aleatoria
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        
        // Color aleatorio sutil
        const colors = ['rgba(116, 185, 255, 0.3)', 'rgba(253, 121, 168, 0.3)', 'rgba(253, 203, 110, 0.3)', 'rgba(255, 255, 255, 0.2)'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(particle);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpanishChineseApp();
    createFloatingParticles();
});