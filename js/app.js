// Aplicación principal - Coordinador de todos los módulos
class SpanishChineseApp {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.sequentialBtn = document.getElementById('sequentialBtn');
        this.cascadeBtn = document.getElementById('cascadeBtn');
        this.burstBtn = document.getElementById('burstBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Elementos para dos ventanas
        this.chineseCharactersDisplay = document.getElementById('chineseCharacters');
        this.pinyinDisplay = document.getElementById('pinyinDisplay');
        this.chineseMusicBars = document.getElementById('chineseMusicBars');
        this.messageDisplayInline = document.getElementById('messageDisplay');
        
        // Elementos para selector de idioma
        this.inputLanguage = localStorage.getItem('inputLanguage') || 'es';
        this.inputPanelIcon = document.getElementById('inputPanelIcon');
        this.inputPanelTitle = document.getElementById('inputPanelTitle');
        
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
        
        if (typeof visualizer !== 'undefined') {
            visualizer.updateFontSize(parseFloat(savedFontSize));
            visualizer.updateFontFamily(savedFontFamily);
        }
        
        // Aplicar idioma guardado
        this.setInputLanguage(this.inputLanguage, false);
        
        // Mantener el foco en el input
        if (this.textInput) {
            this.textInput.focus();
        }
        
        console.log('🎵 Aplicación Traductor Musical inicializada');
    }
    
    // Establecer idioma de entrada
    setInputLanguage(lang, save = true) {
        this.inputLanguage = lang;
        
        // Actualizar botones
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(lang === 'es' ? 'langSpanish' : 'langEnglish');
        if (activeBtn) activeBtn.classList.add('active');
        
        // Actualizar panel de entrada
        if (this.inputPanelIcon) {
            this.inputPanelIcon.textContent = lang === 'es' ? '🇪🇸' : '🇬🇧';
        }
        if (this.inputPanelTitle) {
            this.inputPanelTitle.textContent = lang === 'es' ? 'Escribe en Español' : 'Write in English';
        }
        if (this.textInput) {
            this.textInput.placeholder = lang === 'es' ? 'Escribe aquí...' : 'Type here...';
        }
        
        // Actualizar idioma en el traductor
        if (typeof translator !== 'undefined') {
            translator.sourceLanguage = lang;
        }
        
        // Actualizar reconocimiento de voz
        if (typeof audioManager !== 'undefined' && audioManager.recognition) {
            audioManager.recognition.lang = lang === 'es' ? 'es-ES' : 'en-US';
        }
        
        // Guardar preferencia
        if (save) {
            localStorage.setItem('inputLanguage', lang);
            this.showNotification(lang === 'es' ? 'Idioma: Español' : 'Language: English', 'info');
        }
    }

    setupEventListeners() {
        // Evento principal de entrada de texto
        if (this.textInput) {
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
                    
                    // Remover elementos de caracteres del display inline
                    if (this.messageDisplayInline) {
                        const charElements = this.messageDisplayInline.querySelectorAll('.char-display');
                        for (let i = 0; i < charsToRemove; i++) {
                            if (charElements[charElements.length - 1 - i]) {
                                charElements[charElements.length - 1 - i].remove();
                            }
                        }
                    }
                    
                    // Limpiar notas del pentagrama
                    if (typeof musicStaff !== 'undefined') {
                        musicStaff.clearNotes();
                        // Re-agregar notas restantes
                        this.messageChars.forEach((char, idx) => {
                            musicStaff.addNote(char, idx);
                        });
                    }
                }
                
                // Actualizar traducción al chino
                this.updateChineseTranslation(newText);
            });
        }

        // Botones de modo
        if (this.sequentialBtn) {
            this.sequentialBtn.addEventListener('click', () => this.setMode('sequential'));
        }
        if (this.cascadeBtn) {
            this.cascadeBtn.addEventListener('click', () => this.setMode('cascade'));
        }
        if (this.burstBtn) {
            this.burstBtn.addEventListener('click', () => this.setMode('burst'));
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearMessage());
        }

        // Botón de reproducir traducción china
        const playChineseBtn = document.getElementById('playChineseBtn');
        if (playChineseBtn) {
            playChineseBtn.addEventListener('click', () => this.playChineseTranslation());
        }

        // Mantener foco en el input
        if (this.textInput) {
            this.textInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this.textInput) this.textInput.focus();
                }, 100);
            });
        }
    }

    // Agregar carácter al mensaje (texto original con efectos)
    addCharacterToMessage(char, index) {
        // Agregar al display inline en el panel
        if (this.messageDisplayInline) {
            const charSpan = document.createElement('span');
            charSpan.className = 'char-display';
            charSpan.textContent = char;
            charSpan.style.color = this.getCharColor(char);
            charSpan.style.animationDelay = `${index * 0.05}s`;
            this.messageDisplayInline.appendChild(charSpan);
        }
        
        // Reproducir sonido
        if (typeof audioManager !== 'undefined') {
            audioManager.playCharacterSound(char, index, this.currentMode);
        }
        
        // Verificar finalización de palabra
        if (char === ' ' || index === this.messageChars.length - 1) {
            this.highlightCompletedWord(index);
        }
    }
    
    // Obtener color para un carácter
    getCharColor(char) {
        const colors = {
            'a': '#ff6b9d', 'b': '#4ecdc4', 'c': '#ffe66d', 'd': '#a8e6cf',
            'e': '#ffd93d', 'f': '#ff8b94', 'g': '#95e1d3', 'h': '#6bcf7e',
            'i': '#74b9ff', 'j': '#fd79a8', 'k': '#fdcb6e', 'l': '#e17055',
            'm': '#00b894', 'n': '#00cec9', 'o': '#a29bfe', 'p': '#ffeaa7',
            'q': '#fab1a0', 'r': '#81ecec', 's': '#55a3ff', 't': '#ff7675',
            'u': '#fd79a8', 'v': '#fdcb6e', 'w': '#e17055', 'x': '#00b894',
            'y': '#00cec9', 'z': '#a29bfe', ' ': '#ffffff'
        };
        return colors[char.toLowerCase()] || '#74b9ff';
    }

    // Actualizar traducción al chino
    updateChineseTranslation(text) {
        if (!text.trim()) {
            if (this.chineseCharactersDisplay) {
                this.chineseCharactersDisplay.innerHTML = '';
            }
            if (this.chineseMusicBars) {
                this.chineseMusicBars.innerHTML = '';
            }
            return;
        }
        
        // Primero intentar traducción local
        let translation = this.translateLocally(text);
        
        // Verificar si la traducción tiene caracteres chinos
        const hasChineseChars = /[\u4e00-\u9fff]/.test(translation);
        const hasUntranslated = /[a-zA-Z]{2,}/.test(translation);
        
        // Si no hay caracteres chinos o hay palabras sin traducir, usar API
        if (!hasChineseChars || hasUntranslated) {
            this.translateWithAPI(text);
        } else {
            this.displayChineseCharacters(translation);
        }
    }
    
    // Traducción usando API externa
    async translateWithAPI(text) {
        try {
            if (typeof translator !== 'undefined') {
                const apiTranslation = await translator.translateToChineseAPI(text);
                if (apiTranslation && /[\u4e00-\u9fff]/.test(apiTranslation)) {
                    this.displayChineseCharacters(apiTranslation);
                    return;
                }
            }
        } catch (error) {
            console.log('API translation failed, using local:', error);
        }
        
        // Fallback a traducción local
        const localTranslation = this.translateLocally(text);
        this.displayChineseCharacters(localTranslation);
    }
    
    // Traducción local mejorada
    translateLocally(text) {
        if (typeof translator !== 'undefined' && translator.multiLanguageToChinese) {
            const dict = translator.multiLanguageToChinese;
            const lowerText = text.toLowerCase().trim();
            
            // Primero intentar buscar la frase completa
            if (dict[lowerText]) {
                return dict[lowerText];
            }
            
            // Intentar buscar frases de 2-3 palabras
            const words = lowerText.split(/\s+/);
            const result = [];
            let i = 0;
            
            while (i < words.length) {
                let found = false;
                
                // Intentar con 3 palabras
                if (i + 2 < words.length) {
                    const threeWords = `${words[i]} ${words[i+1]} ${words[i+2]}`;
                    if (dict[threeWords]) {
                        result.push(dict[threeWords]);
                        i += 3;
                        found = true;
                        continue;
                    }
                }
                
                // Intentar con 2 palabras
                if (i + 1 < words.length) {
                    const twoWords = `${words[i]} ${words[i+1]}`;
                    if (dict[twoWords]) {
                        result.push(dict[twoWords]);
                        i += 2;
                        found = true;
                        continue;
                    }
                }
                
                // Intentar palabra individual
                const word = words[i].replace(/[.,!?;:'"]/g, '');
                if (dict[word]) {
                    result.push(dict[word]);
                    found = true;
                } else {
                    // No traducida, mantener original
                    result.push(word);
                }
                i++;
            }
            
            // Solo retornar si al menos una palabra fue traducida
            const hasTranslation = result.some(r => /[\u4e00-\u9fff]/.test(r));
            if (hasTranslation) {
                return result.join('');
            }
        }
        return text;
    }
    
    // Mostrar caracteres chinos con animación
    displayChineseCharacters(translation) {
        if (!this.chineseCharactersDisplay) return;
        
        this.chineseCharactersDisplay.innerHTML = '';
        
        const chars = translation.split('');
        chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'chinese-char';
            span.textContent = char;
            span.style.animationDelay = `${index * 0.08}s`;
            
            // Click para reproducir sonido del carácter
            span.addEventListener('click', () => {
                if (typeof audioManager !== 'undefined') {
                    audioManager.playChineseCharacterSound(char, 0);
                }
            });
            
            this.chineseCharactersDisplay.appendChild(span);
        });
        
        // Agregar barras de música
        this.updateChineseMusicBars(chars);
    }

    // Actualizar panel de traducción china con efectos
    updateChinesePanel(text) {
        this.updateChineseTranslation(text);
    }
    
    // Actualizar barras de música para caracteres chinos
    updateChineseMusicBars(chars) {
        if (!this.chineseMusicBars) return;
        
        this.chineseMusicBars.innerHTML = '';
        
        chars.forEach((char, index) => {
            const bar = document.createElement('div');
            bar.className = 'chinese-music-bar';
            
            // Altura basada en el código del carácter
            const charCode = char.charCodeAt(0);
            const height = 10 + (charCode % 30);
            bar.style.height = `${height}px`;
            bar.style.animationDelay = `${index * 0.05}s`;
            
            this.chineseMusicBars.appendChild(bar);
        });
    }
    
    // Reproducir sonido de la traducción china
    playChineseTranslation() {
        const translation = this.chineseCharactersDisplay?.textContent || '';
        if (!translation) {
            this.showNotification('No hay traducción para reproducir', 'warning');
            return;
        }
        
        audioManager.initAudio();
        
        const chars = translation.split('');
        chars.forEach((char, index) => {
            setTimeout(() => {
                audioManager.playChineseCharacterSound(char, 0);
                
                // Animar el carácter correspondiente
                const charElements = this.chineseCharactersDisplay.querySelectorAll('.chinese-char');
                if (charElements[index]) {
                    charElements[index].style.transform = 'scale(1.3)';
                    charElements[index].style.textShadow = '0 0 30px rgba(255, 217, 61, 1)';
                    setTimeout(() => {
                        charElements[index].style.transform = 'scale(1)';
                        charElements[index].style.textShadow = '0 0 20px rgba(255, 217, 61, 0.5)';
                    }, 300);
                }
            }, index * 300);
        });
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
        if (this.textInput) {
            this.textInput.value = '';
        }
        this.messageChars = [];
        this.charIndex = 0;
        
        // Limpiar display inline
        if (this.messageDisplayInline) {
            this.messageDisplayInline.innerHTML = '';
        }
        
        // Limpiar visualizer si existe
        if (typeof visualizer !== 'undefined') {
            visualizer.clearMessage();
        }
        
        // Limpiar traducción antigua si existe
        if (typeof translator !== 'undefined' && translator.translationDisplay) {
            const translationContent = translator.translationDisplay.querySelector('.translation-content');
            if (translationContent) {
                translationContent.textContent = '';
            }
        }
        
        // Limpiar panel de caracteres chinos
        if (this.chineseCharactersDisplay) {
            this.chineseCharactersDisplay.innerHTML = '';
        }
        if (this.pinyinDisplay) {
            this.pinyinDisplay.textContent = '';
        }
        if (this.chineseMusicBars) {
            this.chineseMusicBars.innerHTML = '';
        }
        
        // Limpiar pentagrama
        if (typeof musicStaff !== 'undefined') {
            musicStaff.clearNotes();
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

function toggleAudioSettings() {
    const panel = document.getElementById('audioSettingsPanel');
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

// Funciones de audio
function changeScale(scale) {
    audioManager.setScale(scale);
    app.showNotification(`Escala: ${scale}`, 'info');
}

function changeWaveType(type) {
    audioManager.setWaveType(type);
    const names = { sine: 'Piano Suave', triangle: 'Flauta', square: '8-Bit Retro', sawtooth: 'Sintetizador' };
    app.showNotification(`Instrumento: ${names[type]}`, 'info');
}

function changeRhythm(pattern) {
    audioManager.setRhythmPattern(pattern);
    app.showNotification(`Ritmo: ${pattern}`, 'info');
}

function changeVolume(value) {
    if (audioManager.masterGain) {
        audioManager.masterGain.gain.setValueAtTime(value / 100, audioManager.audioContext.currentTime);
    }
    document.getElementById('volumeValue').textContent = value + '%';
}

// Función para cambiar idioma de entrada
function setInputLanguage(lang) {
    if (typeof app !== 'undefined') {
        app.setInputLanguage(lang);
    }
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