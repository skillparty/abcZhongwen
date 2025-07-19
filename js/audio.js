// Funcionalidad de audio y reconocimiento de voz
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.recognition = null;
        this.isVoiceActive = false;
        
        // Frecuencias musicales para armonía cronológica
        this.charFrequencies = {
            'a': 261.63, 'b': 293.66, 'c': 329.63, 'd': 349.23, 'e': 392.00,
            'f': 440.00, 'g': 493.88, 'h': 523.25, 'i': 587.33, 'j': 659.25,
            'k': 698.46, 'l': 739.99, 'm': 783.99, 'n': 830.61, 'o': 880.00,
            'p': 932.33, 'q': 987.77, 'r': 1046.50, 's': 1108.73, 't': 1174.66,
            'u': 1244.51, 'v': 1318.51, 'w': 1396.91, 'x': 1479.98, 'y': 1567.98, 'z': 1661.22,
            ' ': 0,
            '0': 1760.00, '1': 1864.66, '2': 1975.53, '3': 2093.00, '4': 2217.46,
            '5': 2349.32, '6': 2489.02, '7': 2637.02, '8': 2793.83, '9': 2959.96
        };
        
        this.initVoiceRecognition();
    }

    // Inicializar contexto de audio
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Reproducir nota musical
    playNote(frequency, duration = 0.3, delay = 0) {
        if (!this.audioContext || frequency === 0) return;
        
        setTimeout(() => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        }, delay);
    }

    // Reproducir sonido para carácter según el modo
    playCharacterSound(char, index, mode) {
        const frequency = this.charFrequencies[char.toLowerCase()] || 440;
        
        let soundDelay = 0;
        switch(mode) {
            case 'sequential':
                soundDelay = index * 100;
                break;
            case 'cascade':
                soundDelay = index * 50;
                break;
            case 'burst':
                soundDelay = Math.random() * 200;
                break;
        }
        
        this.playNote(frequency, 0.4, soundDelay);
    }

    // Inicializar reconocimiento de voz
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'es-ES'; // Por defecto español, puede cambiar a 'en-US' para inglés
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    const textInput = document.getElementById('textInput');
                    textInput.value = finalTranscript;
                    textInput.dispatchEvent(new Event('input'));
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Error de reconocimiento de voz:', event.error);
                this.stopVoiceInput();
            };
        }
    }

    // Alternar entrada de voz
    toggleVoiceInput() {
        const voiceBtn = document.getElementById('voiceBtn');
        
        if (!this.recognition) {
            alert('El reconocimiento de voz no está disponible en este navegador');
            return;
        }
        
        if (this.isVoiceActive) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    // Iniciar entrada de voz
    startVoiceInput() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.isVoiceActive = true;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.textContent = '🎤 Detener Voz';
            voiceBtn.classList.add('active');
        } catch (error) {
            console.error('Error al iniciar reconocimiento de voz:', error);
        }
    }

    // Detener entrada de voz
    stopVoiceInput() {
        if (!this.recognition) return;
        
        try {
            this.recognition.stop();
            this.isVoiceActive = false;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.textContent = '🎤 Iniciar Voz';
            voiceBtn.classList.remove('active');
        } catch (error) {
            console.error('Error al detener reconocimiento de voz:', error);
        }
    }
}

// Instancia global del gestor de audio
const audioManager = new AudioManager();