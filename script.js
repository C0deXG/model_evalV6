class AudioEvaluationApp {
    constructor() {
        this.data = null;
        this.currentFontSize = 16;
        this.minFontSize = 12;
        this.maxFontSize = 24;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderCards();
    }

    async loadData() {
        try {
            const response = await fetch('evaluation_results_clean.json');
            const data = await response.json();
            this.data = data.results;
            console.log(`Loaded ${this.data.length} audio samples`);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading data');
        }
    }

    setupEventListeners() {
        const fontIncreaseBtn = document.getElementById('fontIncrease');
        const fontDecreaseBtn = document.getElementById('fontDecrease');

        fontIncreaseBtn.addEventListener('click', () => this.increaseFontSize());
        fontDecreaseBtn.addEventListener('click', () => this.decreaseFontSize());
    }

    increaseFontSize() {
        if (this.currentFontSize < this.maxFontSize) {
            this.currentFontSize += 2;
            this.updateFontSize();
        }
    }

    decreaseFontSize() {
        if (this.currentFontSize > this.minFontSize) {
            this.currentFontSize -= 2;
            this.updateFontSize();
        }
    }

    updateFontSize() {
        const fontSizeDisplay = document.getElementById('fontSize');
        fontSizeDisplay.textContent = `${this.currentFontSize}px`;
        
        const textContents = document.querySelectorAll('.text-content');
        textContents.forEach(element => {
            element.style.fontSize = `${this.currentFontSize}px`;
        });
    }

    renderCards() {
        const loading = document.getElementById('loading');
        const container = document.getElementById('cardsContainer');
        
        if (!this.data) {
            this.showError('No data available');
            return;
        }

        loading.style.display = 'none';
        
        this.data.forEach((item, index) => {
            const card = this.createAudioCard(item, index);
            container.appendChild(card);
        });
    }

    createAudioCard(item, index) {
        const card = document.createElement('div');
        card.className = 'audio-card';
        
        // Extract sample number from path
        const sampleNumber = this.extractSampleNumber(item.path);
        
        card.innerHTML = `
            <div class="sample-info">Sample #${sampleNumber}</div>
            
            <audio class="audio-player" controls preload="metadata">
                <source src="${item.path}" type="audio/wav">
                Your browser does not support the audio element.
            </audio>
            
            <div class="text-section ground-truth">
                <h3>Ground Truth</h3>
                <div class="text-content" style="font-size: ${this.currentFontSize}px">${item.ground_truth}</div>
            </div>
            
            <div class="text-section prediction">
                <h3>Prediction</h3>
                <div class="text-content" style="font-size: ${this.currentFontSize}px">${item.prediction}</div>
            </div>
        `;
        
        return card;
    }

    extractSampleNumber(path) {
        // Extract sample number from path like "audio_fixed/sample_00000.wav"
        const match = path.match(/sample_(\d+)\.wav$/);
        if (match) {
            return parseInt(match[1]);
        }
        return 0;
    }

    showError(message) {
        const loading = document.getElementById('loading');
        loading.textContent = message;
        loading.style.color = '#e74c3c';
        loading.style.background = 'rgba(231, 76, 60, 0.1)';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioEvaluationApp();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add keyboard shortcuts for font size
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                document.getElementById('fontIncrease').click();
            } else if (e.key === '-') {
                e.preventDefault();
                document.getElementById('fontDecrease').click();
            }
        }
    });
    
    // Add loading animation
    const loading = document.getElementById('loading');
    if (loading) {
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            loading.textContent = 'Loading data' + '.'.repeat(dots);
        }, 500);
        
        // Clear interval when data loads
        const checkData = setInterval(() => {
            if (document.querySelector('.audio-card')) {
                clearInterval(interval);
                clearInterval(checkData);
            }
        }, 100);
    }
});
