// Funcionalidad de visualización y efectos
class MessageVisualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.messageDisplay = document.getElementById('messageDisplay');
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.particles = [];
        this.connections = [];
        
        // Paletas de colores mejoradas
        this.charColors = {
            'a': '#ff6b9d', 'b': '#4ecdc4', 'c': '#ffe66d', 'd': '#a8e6cf',
            'e': '#ffd93d', 'f': '#ff8b94', 'g': '#95e1d3', 'h': '#6bcf7e',
            'i': '#74b9ff', 'j': '#fd79a8', 'k': '#fdcb6e', 'l': '#e17055',
            'm': '#00b894', 'n': '#00cec9', 'o': '#a29bfe', 'p': '#ffeaa7',
            'q': '#fab1a0', 'r': '#81ecec', 's': '#55a3ff', 't': '#ff7675',
            'u': '#fd79a8', 'v': '#fdcb6e', 'w': '#e17055', 'x': '#00b894',
            'y': '#00cec9', 'z': '#a29bfe', ' ': '#ffffff',
            '0': '#ff6348', '1': '#5f27cd', '2': '#00d2d3', '3': '#ff9ff3',
            '4': '#54a0ff', '5': '#48dbfb', '6': '#feca57', '7': '#ff6b9d',
            '8': '#c44569', '9': '#f8b500',
            '.': '#dda0dd', ',': '#98fb98', '!': '#ff4757', '?': '#3742fa',
            ':': '#2ed573', ';': '#ffa726', '-': '#26c6da', "'": '#ab47bc'
        };

        this.colorPalettes = {
            warm: {
                'a': '#ff6b35', 'b': '#f7931e', 'c': '#ffd23f', 'd': '#ff6b9d',
                'e': '#ff8c69', 'f': '#ff4757', 'g': '#ff6348', 'h': '#ff7675',
                'i': '#fd79a8', 'j': '#fdcb6e', 'k': '#e17055', 'l': '#d63031',
                'm': '#a29bfe', 'n': '#6c5ce7', 'o': '#fd79a8', 'p': '#e84393',
                'q': '#00cec9', 'r': '#55efc4', 's': '#00b894', 't': '#81ecec',
                'u': '#74b9ff', 'v': '#0984e3', 'w': '#6c5ce7', 'x': '#a29bfe',
                'y': '#fd79a8', 'z': '#e84393', ' ': '#ffffff'
            },
            cool: {
                'a': '#74b9ff', 'b': '#0984e3', 'c': '#00cec9', 'd': '#55efc4',
                'e': '#00b894', 'f': '#81ecec', 'g': '#6c5ce7', 'h': '#a29bfe',
                'i': '#fd79a8', 'j': '#e84393', 'k': '#00cec9', 'l': '#55efc4',
                'm': '#74b9ff', 'n': '#0984e3', 'o': '#6c5ce7', 'p': '#a29bfe',
                'q': '#00b894', 'r': '#81ecec', 's': '#00cec9', 't': '#55efc4',
                'u': '#74b9ff', 'v': '#0984e3', 'w': '#6c5ce7', 'x': '#a29bfe',
                'y': '#fd79a8', 'z': '#e84393', ' ': '#ffffff'
            },
            neon: {
                'a': '#ff0080', 'b': '#00ff80', 'c': '#8000ff', 'd': '#ff8000',
                'e': '#0080ff', 'f': '#ff4080', 'g': '#80ff00', 'h': '#4080ff',
                'i': '#ff0040', 'j': '#00ff40', 'k': '#4000ff', 'l': '#ff4000',
                'm': '#0040ff', 'n': '#ff2080', 'o': '#40ff00', 'p': '#2080ff',
                'q': '#ff0020', 'r': '#00ff20', 's': '#2000ff', 't': '#ff2000',
                'u': '#0020ff', 'v': '#ff1080', 'w': '#20ff00', 'x': '#1080ff',
                'y': '#ff0010', 'z': '#00ff10', ' ': '#ffffff'
            }
        };

        this.customColorPalette = JSON.parse(localStorage.getItem('customColorPalette') || 'null');
        this.currentFontSize = localStorage.getItem('fontSize') || '2.5em';
        this.currentFontFamily = localStorage.getItem('fontFamily') || 'Courier New';
        
        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });
    }

    // Clase Particle para efectos visuales
    createParticle(x, y, color, char, index) {
        return {
            x: x,
            y: y,
            color: color,
            char: char,
            index: index,
            size: Math.random() * 4 + 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            decay: 0.005,
            trail: [],
            
            update() {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > 10) this.trail.shift();
                
                this.x += this.vx * 0.5;
                this.y += this.vy * 0.5;
                this.life -= this.decay;
                this.vx *= 0.99;
                this.vy *= 0.99;
            },
            
            draw(ctx) {
                ctx.save();
                
                // Dibujar rastro
                for (let i = 0; i < this.trail.length; i++) {
                    const alpha = (i / this.trail.length) * this.life * 0.3;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.trail[i].x, this.trail[i].y, this.size * (i / this.trail.length), 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Dibujar partícula principal
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        };
    }

    // Agregar carácter al mensaje con efectos visuales
    addCharacterToMessage(char, index, currentMode) {
        const colors = this.customColorPalette || this.charColors;
        const color = colors[char.toLowerCase()] || '#ffffff';
        
        // Crear elemento de carácter
        const charEl = document.createElement('span');
        charEl.className = char === ' ' ? 'char-display space' : 'char-display';
        charEl.textContent = char === ' ' ? '\u00A0' : char;
        charEl.style.color = color;
        charEl.style.animationDelay = `${index * 0.1}s`;
        
        this.messageDisplay.appendChild(charEl);
        
        // Crear efectos visuales
        this.createCharacterEffect(char, color, index);
        
        return { charEl, color };
    }

    // Crear efectos visuales para caracteres
    createCharacterEffect(char, color, index) {
        // Crear partículas
        for (let i = 0; i < 3; i++) {
            const particle = this.createParticle(
                this.width / 2 + (Math.random() - 0.5) * 100,
                this.height / 2 + (Math.random() - 0.5) * 100,
                color,
                char,
                index
            );
            this.particles.push(particle);
        }
        
        // Crear conexiones entre caracteres
        if (index > 0) {
            this.connections.push({
                from: index - 1,
                to: index,
                color: color,
                life: 1,
                decay: 0.01
            });
        }
    }

    // Dibujar conexiones entre caracteres
    drawConnection(connection) {
        const chars = this.messageDisplay.querySelectorAll('.char-display');
        if (chars[connection.from] && chars[connection.to]) {
            const fromRect = chars[connection.from].getBoundingClientRect();
            const toRect = chars[connection.to].getBoundingClientRect();
            
            this.ctx.save();
            this.ctx.globalAlpha = connection.life * 0.3;
            this.ctx.strokeStyle = connection.color;
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = connection.color;
            this.ctx.beginPath();
            this.ctx.moveTo(fromRect.left + fromRect.width/2, fromRect.top + fromRect.height/2);
            this.ctx.lineTo(toRect.left + toRect.width/2, toRect.top + toRect.height/2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    // Limpiar mensaje y efectos
    clearMessage() {
        this.messageDisplay.innerHTML = '';
        this.particles = [];
        this.connections = [];
    }

    // Animación principal
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Actualizar y dibujar partículas
        this.particles = this.particles.filter(particle => {
            particle.update();
            if (particle.life > 0) {
                particle.draw(this.ctx);
                return true;
            }
            return false;
        });
        
        // Dibujar conexiones
        this.connections = this.connections.filter(connection => {
            connection.life -= connection.decay;
            if (connection.life > 0) {
                this.drawConnection(connection);
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animate());
    }

    // Funciones de personalización
    updateFontSize(size) {
        this.currentFontSize = size + 'em';
        this.messageDisplay.style.fontSize = this.currentFontSize;
        localStorage.setItem('fontSize', this.currentFontSize);
        document.getElementById('fontSizeValue').textContent = this.currentFontSize;
    }

    updateFontFamily(family) {
        this.currentFontFamily = family;
        this.messageDisplay.style.fontFamily = family;
        localStorage.setItem('fontFamily', family);
    }

    useDefaultPalette() {
        this.customColorPalette = null;
        localStorage.removeItem('customColorPalette');
        document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.palette-btn').classList.add('active');
    }

    useCustomPalette(paletteName) {
        this.customColorPalette = this.colorPalettes[paletteName];
        localStorage.setItem('customColorPalette', JSON.stringify(this.customColorPalette));
        document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="useCustomPalette('${paletteName}')"]`).classList.add('active');
    }
}

// Instancia global del visualizador
const visualizer = new MessageVisualizer();