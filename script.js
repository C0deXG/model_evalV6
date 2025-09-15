class AudioEvaluationApp {
    constructor() {
        this.data = null;
        this.currentFontSize = 18;
        this.minFontSize = 12;
        this.maxFontSize = 28;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderCards();
    }

    setupEventListeners() {
        const fontIncreaseBtn = document.getElementById('fontIncrease');
        const fontDecreaseBtn = document.getElementById('fontDecrease');
        const retryBtn = document.getElementById('retryBtn');

        fontIncreaseBtn?.addEventListener('click', () => this.increaseFontSize());
        fontDecreaseBtn?.addEventListener('click', () => this.decreaseFontSize());
        retryBtn?.addEventListener('click', () => this.retryLoadData());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    this.increaseFontSize();
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.decreaseFontSize();
                }
            }
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            if (!this.data) {
                this.retryLoadData();
            }
        });

        window.addEventListener('offline', () => {
            this.showError('You are offline. Please check your connection.');
        });
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Add cache busting for production
            const cacheBuster = `?v=${Date.now()}`;
            const response = await fetch(`evaluation_results_clean.json${cacheBuster}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data || !data.results || !Array.isArray(data.results)) {
                throw new Error('Invalid data format');
            }

            this.data = data.results;
            this.retryCount = 0;
            
            console.log(`Successfully loaded ${this.data.length} audio samples`);
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.handleLoadError(error);
        }
    }

    async retryLoadData() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`);
            await this.loadData();
        } else {
            this.showError('Failed to load data after multiple attempts. Please refresh the page.');
        }
    }

    handleLoadError(error) {
        let errorMessage = 'Failed to load evaluation data.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Data file not found. Please check if the file exists.';
        } else if (error.message.includes('Invalid data format')) {
            errorMessage = 'Invalid data format. Please check the JSON file.';
        }

        this.showError(errorMessage);
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const container = document.getElementById('cardsContainer');
        
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';
        if (container) container.innerHTML = '';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const container = document.getElementById('cardsContainer');
        
        if (loading) loading.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            const errorText = error.querySelector('.error-text');
            if (errorText) errorText.textContent = message;
        }
        if (container) container.innerHTML = '';
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
        if (fontSizeDisplay) {
            fontSizeDisplay.textContent = `${this.currentFontSize}px`;
        }
        
        const textContents = document.querySelectorAll('.text-content');
        textContents.forEach(element => {
            element.style.fontSize = `${this.currentFontSize}px`;
        });

        // Store preference in localStorage
        localStorage.setItem('preferredFontSize', this.currentFontSize.toString());
    }

    loadFontSizePreference() {
        const saved = localStorage.getItem('preferredFontSize');
        if (saved) {
            const size = parseInt(saved);
            if (size >= this.minFontSize && size <= this.maxFontSize) {
                this.currentFontSize = size;
                this.updateFontSize();
            }
        }
    }

    renderCards() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const container = document.getElementById('cardsContainer');
        
        if (!this.data) {
            return;
        }

        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';
        
        if (container) {
            container.innerHTML = '';
            
            this.data.forEach((item, index) => {
                const card = this.createAudioCard(item, index);
                container.appendChild(card);
            });
        }

        this.loadFontSizePreference();
    }

    createAudioCard(item, index) {
        const card = document.createElement('div');
        card.className = 'audio-card';
        
        const sampleNumber = this.extractSampleNumber(item.path);
        
        card.innerHTML = `
            <div class="sample-info">Sample #${sampleNumber}</div>
            
            <audio class="audio-player" controls preload="metadata" onerror="this.style.display='none'">
                <source src="${item.path}" type="audio/wav">
                <source src="${item.path.replace('.wav', '.mp3')}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            
            <div class="text-section ground-truth">
                <h3>Ground Truth</h3>
                <div class="text-content" style="font-size: ${this.currentFontSize}px">${this.escapeHtml(item.ground_truth)}</div>
            </div>
            
            <div class="text-section prediction">
                <h3>Prediction</h3>
                <div class="text-content" style="font-size: ${this.currentFontSize}px">${this.escapeHtml(item.prediction)}</div>
            </div>
        `;
        
        return card;
    }

    extractSampleNumber(path) {
        const match = path.match(/sample_(\d+)\.wav$/);
        if (match) {
            return parseInt(match[1]);
        }
        return 0;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const stats = document.getElementById('stats');
        if (stats && this.data) {
            const totalSamples = this.data.length;
            const currentTime = new Date().toLocaleString();
            stats.innerHTML = `
                <div>Total Samples: ${totalSamples}</div>
                <div>Last Updated: ${currentTime}</div>
            `;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation
    const loading = document.getElementById('loading');
    if (loading) {
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            const loadingText = loading.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Loading evaluation data' + '.'.repeat(dots);
            }
        }, 500);
        
        // Clear interval when data loads
        const checkData = setInterval(() => {
            if (document.querySelector('.audio-card')) {
                clearInterval(interval);
                clearInterval(checkData);
            }
        }, 100);
    }

    // Initialize app
    new AudioEvaluationApp();
});

// Service Worker registration for better caching (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
