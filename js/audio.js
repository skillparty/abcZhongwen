// Funcionalidad de audio mejorada y reconocimiento de voz
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.recognition = null;
        this.isVoiceActive = false;
        this.masterGain = null;
        this.reverbNode = null;
        this.compressor = null;
        
        // Escalas musicales
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11], // Do mayor
            minor: [0, 2, 3, 5, 7, 8, 10], // La menor
            pentatonic: [0, 2, 4, 7, 9], // Pentatónica
            chinese: [0, 2, 4, 7, 9], // Escala china (similar a pentatónica)
            blues: [0, 3, 5, 6, 7, 10] // Blues
        };
        
        this.currentScale = 'pentatonic';
        this.baseFrequency = 261.63; // C4
        
        // Frecuencias musicales mejoradas (escala pentatónica por defecto)
        this.charFrequencies = {
            'a': 261.63, 'b': 293.66, 'c': 329.63, 'd': 392.00, 'e': 440.00,
            'f': 523.25, 'g': 587.33, 'h': 659.25, 'i': 783.99, 'j': 880.00,
            'k': 1046.50, 'l': 1174.66, 'm': 1318.51, 'n': 261.63, 'o': 293.66,
            'p': 329.63, 'q': 392.00, 'r': 440.00, 's': 523.25, 't': 587.33,
            'u': 659.25, 'v': 783.99, 'w': 880.00, 'x': 1046.50, 'y': 1174.66, 'z': 1318.51,
            ' ': 0,
            '0': 261.63, '1': 293.66, '2': 329.63, '3': 392.00, '4': 440.00,
            '5': 523.25, '6': 587.33, '7': 659.25, '8': 783.99, '9': 880.00
        };
        
        // Tipos de onda para diferentes instrumentos
        this.waveTypes = ['sine', 'triangle', 'square', 'sawtooth'];
        this.currentWaveType = 'sine';
        
        // Patrones rítmicos
        this.rhythmPatterns = {
            steady: [1, 1, 1, 1],
            waltz: [1.5, 0.75, 0.75],
            swing: [1.2, 0.8, 1.2, 0.8],
            march: [1, 0.5, 0.5, 1, 0.5, 0.5]
        };
        this.currentRhythm = 'steady';
        this.rhythmIndex = 0;
        
        this.initVoiceRecognition();
    }
    
    // Configurar escala musical
    setScale(scaleName) {
        if (this.scales[scaleName]) {
            this.currentScale = scaleName;
            this.updateFrequencies();
        }
    }
    
    // Actualizar frecuencias según la escala
    updateFrequencies() {
        const scale = this.scales[this.currentScale];
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        
        letters.split('').forEach((letter, index) => {
            const scaleIndex = index % scale.length;
            const octave = Math.floor(index / scale.length);
            const semitone = scale[scaleIndex];
            const frequency = this.baseFrequency * Math.pow(2, (semitone + octave * 12) / 12);
            this.charFrequencies[letter] = frequency;
        });
    }
    
    // Configurar tipo de onda
    setWaveType(type) {
        if (this.waveTypes.includes(type)) {
            this.currentWaveType = type;
        }
    }
    
    // Configurar patrón rítmico
    setRhythmPattern(pattern) {
        if (this.rhythmPatterns[pattern]) {
            this.currentRhythm = pattern;
            this.rhythmIndex = 0;
        }
    }
    
    // Obtener duración del siguiente beat
    getNextBeatDuration(baseDuration = 0.3) {
        const pattern = this.rhythmPatterns[this.currentRhythm];
        const multiplier = pattern[this.rhythmIndex % pattern.length];
        this.rhythmIndex++;
        return baseDuration * multiplier;
    }

    // Inicializar contexto de audio con efectos
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crear nodo de ganancia maestro
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            
            // Crear compresor para mejor sonido
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-20, this.audioContext.currentTime);
            this.compressor.knee.setValueAtTime(10, this.audioContext.currentTime);
            this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
            
            // Conectar cadena de audio
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.audioContext.destination);
            
            // Crear reverb simple
            this.createReverb();
        }
    }
    
    // Crear efecto de reverb
    async createReverb() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 1.5; // 1.5 segundos de reverb
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const impulseData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbNode.buffer = impulse;
    }

    // Reproducir nota musical mejorada
    playNote(frequency, duration = 0.3, delay = 0) {
        if (!this.audioContext || frequency === 0) return;
        
        setTimeout(() => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            // Configurar oscilador
            oscillator.type = this.currentWaveType;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Añadir vibrato sutil
            const vibrato = this.audioContext.createOscillator();
            const vibratoGain = this.audioContext.createGain();
            vibrato.frequency.setValueAtTime(5, this.audioContext.currentTime);
            vibratoGain.gain.setValueAtTime(3, this.audioContext.currentTime);
            vibrato.connect(vibratoGain);
            vibratoGain.connect(oscillator.frequency);
            vibrato.start(this.audioContext.currentTime);
            vibrato.stop(this.audioContext.currentTime + duration);
            
            // Configurar filtro
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + duration);
            
            // Envolvente ADSR
            const attackTime = 0.02;
            const decayTime = 0.1;
            const sustainLevel = 0.4;
            const releaseTime = duration * 0.3;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + attackTime);
            gainNode.gain.linearRampToValueAtTime(sustainLevel * 0.2, this.audioContext.currentTime + attackTime + decayTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            // Conectar nodos
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.masterGain || this.audioContext.destination);
            
            // Añadir reverb si está disponible
            if (this.reverbNode) {
                const reverbGain = this.audioContext.createGain();
                reverbGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.connect(reverbGain);
                reverbGain.connect(this.reverbNode);
                this.reverbNode.connect(this.audioContext.destination);
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        }, delay);
    }
    
    // Reproducir acorde
    playChord(frequencies, duration = 0.5, delay = 0) {
        frequencies.forEach((freq, index) => {
            this.playNote(freq, duration, delay + index * 20);
        });
    }
    
    // Reproducir arpegio
    playArpeggio(frequencies, noteSpacing = 100, noteDuration = 0.2) {
        frequencies.forEach((freq, index) => {
            this.playNote(freq, noteDuration, index * noteSpacing);
        });
    }

    // Reproducir sonido para carácter según el modo
    playCharacterSound(char, index, mode) {
        const frequency = this.charFrequencies[char.toLowerCase()] || 440;
        const duration = this.getNextBeatDuration(0.35);
        
        let soundDelay = 0;
        switch(mode) {
            case 'sequential':
                soundDelay = index * 80;
                break;
            case 'cascade':
                soundDelay = index * 40;
                break;
            case 'burst':
                soundDelay = Math.random() * 150;
                break;
        }
        
        this.playNote(frequency, duration, soundDelay);
        
        // Notificar al pentagrama
        if (typeof musicStaff !== 'undefined') {
            setTimeout(() => {
                musicStaff.addNote(char, index);
            }, soundDelay);
        }
    }
    
    // Reproducir sonido para caracteres chinos
    playChineseCharacterSound(char, index) {
        // Usar escala pentatónica china para caracteres chinos
        const originalScale = this.currentScale;
        this.setScale('chinese');
        
        // Calcular frecuencia basada en el código Unicode del carácter
        const charCode = char.charCodeAt(0);
        const scaleNotes = this.scales.chinese;
        const noteIndex = charCode % scaleNotes.length;
        const octave = Math.floor((charCode % 24) / scaleNotes.length);
        const semitone = scaleNotes[noteIndex];
        const frequency = this.baseFrequency * Math.pow(2, (semitone + octave * 12) / 12);
        
        // Reproducir con un sonido más suave y oriental
        this.setWaveType('triangle');
        const duration = this.getNextBeatDuration(0.4);
        this.playNote(frequency, duration, index * 60);
        
        // Restaurar configuración
        this.setScale(originalScale);
        this.setWaveType('sine');
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