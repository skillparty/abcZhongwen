// Módulo de Pentagrama Musical - Visualización de notas y ritmo
class MusicStaff {
    constructor() {
        this.staffCanvas = null;
        this.staffCtx = null;
        this.notes = [];
        this.rhythmBars = [];
        this.currentBeat = 0;
        this.bpm = 120;
        this.isPlaying = false;
        this.animationId = null;
        
        // Configuración del pentagrama
        this.staffConfig = {
            lineSpacing: 12,
            noteRadius: 8,
            staffY: 60,
            staffHeight: 48,
            margin: 40
        };
        
        // Mapeo de letras a notas musicales (escala cromática)
        this.letterToNote = {
            'a': { note: 'C4', position: 0, name: 'Do' },
            'b': { note: 'D4', position: 1, name: 'Re' },
            'c': { note: 'E4', position: 2, name: 'Mi' },
            'd': { note: 'F4', position: 3, name: 'Fa' },
            'e': { note: 'G4', position: 4, name: 'Sol' },
            'f': { note: 'A4', position: 5, name: 'La' },
            'g': { note: 'B4', position: 6, name: 'Si' },
            'h': { note: 'C5', position: 7, name: 'Do' },
            'i': { note: 'D5', position: 8, name: 'Re' },
            'j': { note: 'E5', position: 9, name: 'Mi' },
            'k': { note: 'F5', position: 10, name: 'Fa' },
            'l': { note: 'G5', position: 11, name: 'Sol' },
            'm': { note: 'A5', position: 12, name: 'La' },
            'n': { note: 'B5', position: 13, name: 'Si' },
            'o': { note: 'C4', position: 0, name: 'Do' },
            'p': { note: 'D4', position: 1, name: 'Re' },
            'q': { note: 'E4', position: 2, name: 'Mi' },
            'r': { note: 'F4', position: 3, name: 'Fa' },
            's': { note: 'G4', position: 4, name: 'Sol' },
            't': { note: 'A4', position: 5, name: 'La' },
            'u': { note: 'B4', position: 6, name: 'Si' },
            'v': { note: 'C5', position: 7, name: 'Do' },
            'w': { note: 'D5', position: 8, name: 'Re' },
            'x': { note: 'E5', position: 9, name: 'Mi' },
            'y': { note: 'F5', position: 10, name: 'Fa' },
            'z': { note: 'G5', position: 11, name: 'Sol' },
            ' ': { note: 'rest', position: -1, name: 'Silencio' }
        };
        
        // Colores de las notas según la escala
        this.noteColors = {
            'Do': '#ff6b6b',
            'Re': '#ffa94d',
            'Mi': '#ffd43b',
            'Fa': '#69db7c',
            'Sol': '#4dabf7',
            'La': '#9775fa',
            'Si': '#f783ac',
            'Silencio': '#868e96'
        };
        
        this.init();
    }
    
    init() {
        this.createStaffContainer();
        this.setupCanvas();
        this.startAnimation();
    }
    
    createStaffContainer() {
        // Crear contenedor del pentagrama
        const container = document.createElement('div');
        container.id = 'musicStaffContainer';
        container.className = 'music-staff-container';
        container.innerHTML = `
            <div class="staff-header">
                <span class="staff-title">🎼 Pentagrama Musical</span>
                <div class="staff-controls">
                    <button id="playRhythmBtn" class="staff-btn" title="Reproducir Ritmo">▶️</button>
                    <button id="clearStaffBtn" class="staff-btn" title="Limpiar">🗑️</button>
                    <span class="bpm-display">♩ = <span id="bpmValue">${this.bpm}</span> BPM</span>
                </div>
            </div>
            <canvas id="staffCanvas"></canvas>
            <div class="rhythm-display" id="rhythmDisplay">
                <span class="rhythm-label">Ritmo:</span>
                <div class="rhythm-bars" id="rhythmBars"></div>
            </div>
            <div class="notes-legend" id="notesLegend"></div>
        `;
        
        // Insertar en el wrapper específico
        const wrapper = document.getElementById('musicStaffWrapper');
        if (wrapper) {
            wrapper.appendChild(container);
        } else {
            // Fallback: insertar después del header
            const header = document.querySelector('.app-header');
            if (header) {
                header.parentNode.insertBefore(container, header.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }
        
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.staffCanvas = document.getElementById('staffCanvas');
        this.staffCtx = this.staffCanvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.getElementById('musicStaffContainer');
        if (container && this.staffCanvas) {
            this.staffCanvas.width = container.offsetWidth - 40;
            this.staffCanvas.height = 180;
            this.draw();
        }
    }
    
    setupEventListeners() {
        const playBtn = document.getElementById('playRhythmBtn');
        const clearBtn = document.getElementById('clearStaffBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlayback());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearNotes());
        }
    }
    
    // Dibujar el pentagrama
    drawStaffLines() {
        const ctx = this.staffCtx;
        const width = this.staffCanvas.width;
        const { lineSpacing, staffY, margin } = this.staffConfig;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        
        // Dibujar las 5 líneas del pentagrama
        for (let i = 0; i < 5; i++) {
            const y = staffY + (i * lineSpacing);
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(width - margin, y);
            ctx.stroke();
        }
        
        // Dibujar clave de sol simplificada
        this.drawTrebleClef(margin + 10, staffY + lineSpacing * 2);
    }
    
    drawTrebleClef(x, y) {
        const ctx = this.staffCtx;
        ctx.font = '48px serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('𝄞', x, y + 15);
    }
    
    // Agregar una nota al pentagrama
    addNote(char, index) {
        const noteInfo = this.letterToNote[char.toLowerCase()];
        if (!noteInfo) return null;
        
        const note = {
            char: char,
            note: noteInfo.note,
            position: noteInfo.position,
            name: noteInfo.name,
            color: this.noteColors[noteInfo.name],
            index: index,
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1.5,
            timestamp: Date.now()
        };
        
        // Calcular posición X basada en el índice
        const startX = this.staffConfig.margin + 60;
        const spacing = 30;
        const maxNotes = Math.floor((this.staffCanvas.width - startX - this.staffConfig.margin) / spacing);
        
        // Si hay demasiadas notas, desplazar
        if (this.notes.length >= maxNotes) {
            this.notes.shift();
            this.notes.forEach((n, i) => {
                n.x = startX + (i * spacing);
            });
        }
        
        note.x = startX + (this.notes.length * spacing);
        
        // Calcular posición Y basada en la posición de la nota
        const { staffY, lineSpacing } = this.staffConfig;
        const baseY = staffY + (lineSpacing * 4); // Línea inferior
        
        if (noteInfo.position >= 0) {
            // Mapear posición de nota a posición en el pentagrama
            note.y = baseY - (noteInfo.position * (lineSpacing / 2));
        } else {
            // Silencio - centro del pentagrama
            note.y = staffY + (lineSpacing * 2);
        }
        
        this.notes.push(note);
        this.addRhythmBar(char, index);
        this.updateNotesLegend(note);
        
        return note;
    }
    
    // Agregar barra de ritmo
    addRhythmBar(char, index) {
        const rhythmContainer = document.getElementById('rhythmBars');
        if (!rhythmContainer) return;
        
        const noteInfo = this.letterToNote[char.toLowerCase()];
        if (!noteInfo) return;
        
        const bar = document.createElement('div');
        bar.className = 'rhythm-bar';
        bar.style.backgroundColor = this.noteColors[noteInfo.name];
        bar.style.animationDelay = `${index * 0.05}s`;
        
        // Altura basada en la posición de la nota
        const height = noteInfo.position >= 0 ? 10 + (noteInfo.position * 3) : 5;
        bar.style.height = `${height}px`;
        
        rhythmContainer.appendChild(bar);
        
        // Limitar número de barras visibles
        const bars = rhythmContainer.querySelectorAll('.rhythm-bar');
        if (bars.length > 40) {
            bars[0].remove();
        }
    }
    
    // Actualizar leyenda de notas
    updateNotesLegend(note) {
        const legend = document.getElementById('notesLegend');
        if (!legend) return;
        
        // Mostrar las últimas 8 notas
        const legendNotes = this.notes.slice(-8);
        legend.innerHTML = legendNotes.map(n => `
            <span class="legend-note" style="background-color: ${n.color}">
                ${n.char.toUpperCase()} = ${n.name}
            </span>
        `).join('');
    }
    
    // Dibujar una nota
    drawNote(note) {
        const ctx = this.staffCtx;
        const { noteRadius, lineSpacing, staffY } = this.staffConfig;
        
        // Aplicar animación de entrada
        const age = Date.now() - note.timestamp;
        const animProgress = Math.min(age / 300, 1);
        const currentScale = 1 + (0.5 * (1 - animProgress));
        const currentOpacity = Math.min(animProgress * 2, 1);
        
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.translate(note.x, note.y);
        ctx.scale(currentScale, currentScale);
        
        if (note.position < 0) {
            // Dibujar silencio
            ctx.fillStyle = note.color;
            ctx.font = '20px serif';
            ctx.fillText('𝄽', -8, 8);
        } else {
            // Dibujar nota
            ctx.beginPath();
            ctx.ellipse(0, 0, noteRadius, noteRadius * 0.7, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = note.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Dibujar plica (stem)
            ctx.beginPath();
            ctx.moveTo(noteRadius - 1, 0);
            ctx.lineTo(noteRadius - 1, -35);
            ctx.strokeStyle = note.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Dibujar líneas adicionales si es necesario
            if (note.y > staffY + lineSpacing * 4) {
                const numLines = Math.floor((note.y - staffY - lineSpacing * 4) / lineSpacing) + 1;
                for (let i = 0; i < numLines; i++) {
                    const lineY = staffY + lineSpacing * (4 + i + 1);
                    ctx.beginPath();
                    ctx.moveTo(-noteRadius - 5, lineY - note.y);
                    ctx.lineTo(noteRadius + 5, lineY - note.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            if (note.y < staffY) {
                const numLines = Math.floor((staffY - note.y) / lineSpacing) + 1;
                for (let i = 0; i < numLines; i++) {
                    const lineY = staffY - lineSpacing * (i + 1);
                    ctx.beginPath();
                    ctx.moveTo(-noteRadius - 5, lineY - note.y);
                    ctx.lineTo(noteRadius + 5, lineY - note.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            
            // Mostrar nombre de la nota
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(note.name, 0, noteRadius + 15);
        }
        
        ctx.restore();
    }
    
    // Dibujar beat indicator
    drawBeatIndicator() {
        if (!this.isPlaying) return;
        
        const ctx = this.staffCtx;
        const { margin, staffY, lineSpacing } = this.staffConfig;
        
        const beatX = margin + 60 + (this.currentBeat % this.notes.length) * 30;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(beatX, staffY - 20);
        ctx.lineTo(beatX, staffY + lineSpacing * 4 + 20);
        ctx.stroke();
        ctx.restore();
    }
    
    // Dibujar todo
    draw() {
        if (!this.staffCtx) return;
        
        const ctx = this.staffCtx;
        ctx.clearRect(0, 0, this.staffCanvas.width, this.staffCanvas.height);
        
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.staffCanvas.width, this.staffCanvas.height);
        
        this.drawStaffLines();
        
        // Dibujar todas las notas
        this.notes.forEach(note => this.drawNote(note));
        
        this.drawBeatIndicator();
    }
    
    // Animación principal
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    // Toggle reproducción
    togglePlayback() {
        const btn = document.getElementById('playRhythmBtn');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            if (btn) btn.textContent = '▶️';
            clearInterval(this.playbackInterval);
        } else {
            if (this.notes.length === 0) return;
            
            this.isPlaying = true;
            if (btn) btn.textContent = '⏸️';
            this.currentBeat = 0;
            
            const beatDuration = 60000 / this.bpm;
            this.playbackInterval = setInterval(() => {
                if (this.notes[this.currentBeat]) {
                    const note = this.notes[this.currentBeat];
                    if (typeof audioManager !== 'undefined') {
                        audioManager.playNote(
                            audioManager.charFrequencies[note.char.toLowerCase()] || 440,
                            0.3,
                            0
                        );
                    }
                }
                this.currentBeat = (this.currentBeat + 1) % this.notes.length;
            }, beatDuration);
        }
    }
    
    // Limpiar notas
    clearNotes() {
        this.notes = [];
        this.isPlaying = false;
        this.currentBeat = 0;
        clearInterval(this.playbackInterval);
        
        const btn = document.getElementById('playRhythmBtn');
        if (btn) btn.textContent = '▶️';
        
        const rhythmBars = document.getElementById('rhythmBars');
        if (rhythmBars) rhythmBars.innerHTML = '';
        
        const legend = document.getElementById('notesLegend');
        if (legend) legend.innerHTML = '';
        
        this.draw();
    }
    
    // Obtener estadísticas de ritmo
    getRhythmStats() {
        if (this.notes.length === 0) return null;
        
        const noteCounts = {};
        this.notes.forEach(note => {
            noteCounts[note.name] = (noteCounts[note.name] || 0) + 1;
        });
        
        return {
            totalNotes: this.notes.length,
            uniqueNotes: Object.keys(noteCounts).length,
            noteCounts: noteCounts,
            dominantNote: Object.entries(noteCounts).sort((a, b) => b[1] - a[1])[0]
        };
    }
}

// Instancia global del pentagrama
const musicStaff = new MusicStaff();
