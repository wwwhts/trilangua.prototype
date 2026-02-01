// MAIN APPLICATION - CLEAN VERSION

class TranslatorApp {
    constructor() {
        this.history = [];
        this.currentTranslation = null;
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    async init() {
        this.setupElements();
        this.loadHistory();
        this.setupEventListeners();
        this.updateUI();
        
        // Setup mobile navigation
        if (this.isMobile) {
            this.setupMobileNav();
        }
        
        console.log('Translator App initialized');
    }

    setupElements() {
        // Core elements
        this.elements = {
            // Input
            inputText: document.getElementById('input-text'),
            fromLang: document.getElementById('from-lang'),
            toLang: document.getElementById('to-lang'),
            
            // Output
            outputText: document.getElementById('output-text'),
            
            // Buttons
            translateBtn: document.getElementById('translate-btn'),
            swapBtn: document.getElementById('swap-btn'),
            clearBtn: document.getElementById('clear-btn'),
            copyBtn: document.getElementById('copy-btn'),
            speakBtn: document.getElementById('speak-btn'),
            saveBtn: document.getElementById('save-btn'),
            voiceInputBtn: document.getElementById('voice-input-btn'),
            clearHistoryBtn: document.getElementById('clear-history'),
            
            // Counters & indicators
            charCount: document.getElementById('char-count'),
            languageHint: document.getElementById('language-hint-text'),
            
            // History
            historyList: document.getElementById('history-list'),
            
            // Mobile
            mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
            mobileNavBtns: document.querySelectorAll('.nav-btn'),
            quickButtons: document.querySelectorAll('.quick-btn')
        };
    }

    setupEventListeners() {
        // Translation
        this.elements.translateBtn.addEventListener('click', () => this.translate());
        this.elements.swapBtn.addEventListener('click', () => this.swapLanguages());
        
        // Text input events
        this.elements.inputText.addEventListener('input', () => {
            this.updateCharCount();
            this.detectLanguage();
        });
        
        // Action buttons
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.copyBtn.addEventListener('click', () => this.copyOutput());
        this.elements.saveBtn.addEventListener('click', () => this.saveTranslation());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Quick action buttons
        this.elements.quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.currentTarget.getAttribute('data-text');
                this.elements.inputText.value = text;
                this.updateCharCount();
                this.detectLanguage();
                this.elements.inputText.focus();
            });
        });
        
        // Enter key shortcut
        this.elements.inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.translate();
            }
        });
        
        // Language change events
        this.elements.fromLang.addEventListener('change', () => this.savePreferences());
        this.elements.toLang.addEventListener('change', () => this.savePreferences());
    }

    setupMobileNav() {
        // Mobile menu button
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => {
                const historySidebar = document.querySelector('.history-sidebar');
                historySidebar.classList.toggle('active');
            });
        }
        
        // Mobile navigation buttons
        this.elements.mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.switchMobileSection(section);
            });
        });
    }

    switchMobileSection(section) {
        // Update active button
        this.elements.mobileNavBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === section) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide sections
        const mainContent = document.querySelector('.main-content');
        const historySidebar = document.querySelector('.history-sidebar');
        
        switch(section) {
            case 'translate':
                mainContent.style.display = 'block';
                historySidebar.style.display = 'none';
                break;
            case 'history':
                mainContent.style.display = 'none';
                historySidebar.style.display = 'block';
                historySidebar.classList.add('active');
                break;
            case 'settings':
                // For now, just show translate section
                mainContent.style.display = 'block';
                historySidebar.style.display = 'none';
                break;
        }
    }

    async translate() {
        const inputText = this.elements.inputText.value.trim();
        const fromLang = this.elements.fromLang.value;
        const toLang = this.elements.toLang.value;
        
        if (!inputText) {
            this.showMessage('Please enter text to translate', 'warning');
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Translate using the translation engine
            const translatedText = await window.translateText(inputText, fromLang, toLang);
            
            // Display result
            this.displayTranslation(translatedText);
            
            // Store current translation
            this.currentTranslation = {
                input: inputText,
                output: translatedText,
                from: fromLang,
                to: toLang,
                timestamp: new Date()
            };
            
            this.showMessage('Translation complete!', 'success');
            
        } catch (error) {
            console.error('Translation error:', error);
            this.displayTranslationError(error);
            this.showMessage('Translation failed. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    displayTranslation(text) {
        const outputElement = this.elements.outputText;
        
        // Clear previous content
        outputElement.innerHTML = '';
        
        // Create and append translation text
        const translationText = document.createElement('div');
        translationText.className = 'translation-text';
        translationText.textContent = text;
        translationText.style.cssText = `
            font-size: 1.125rem;
            line-height: 1.7;
            color: var(--dark);
            animation: fadeIn 0.3s ease;
        `;
        
        outputElement.appendChild(translationText);
        outputElement.classList.add('fade-in');
        setTimeout(() => outputElement.classList.remove('fade-in'), 300);
    }

    displayTranslationError(error) {
        this.elements.outputText.innerHTML = `
            <div class="output-placeholder">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                <p style="color: var(--danger);">Translation failed</p>
                <small style="color: var(--gray);">${error.message || 'Unknown error'}</small>
            </div>
        `;
    }

    swapLanguages() {
        const fromLang = this.elements.fromLang.value;
        const toLang = this.elements.toLang.value;
        
        this.elements.fromLang.value = toLang;
        this.elements.toLang.value = fromLang;
        
        
        if (this.currentTranslation) {
            this.elements.inputText.value = this.currentTranslation.output;
            this.displayTranslation(this.currentTranslation.input);
            
            // Update current translation
            this.currentTranslation = {
                input: this.currentTranslation.output,
                output: this.currentTranslation.input,
                from: toLang,
                to: fromLang,
                timestamp: new Date()
            };
        }
        
        this.updateCharCount();
        this.detectLanguage();
        this.showMessage('Languages swapped', 'success');
        
        // Animation
        this.elements.swapBtn.classList.add('pulse');
        setTimeout(() => this.elements.swapBtn.classList.remove('pulse'), 1000);
    }

    clearInput() {
        this.elements.inputText.value = '';
        this.elements.outputText.innerHTML = `
            <div class="output-placeholder">
                <i class="fas fa-language"></i>
                <p>Translation will appear here</p>
            </div>
        `;
        this.updateCharCount();
        this.elements.languageHint.textContent = 'Detecting language...';
        this.currentTranslation = null;
        this.elements.inputText.focus();
    }

    async copyOutput() {
        const text = this.elements.outputText.textContent;
        
        if (!text || text.includes('Translation will appear here')) {
            this.showMessage('No text to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalIcon = this.elements.copyBtn.innerHTML;
            this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyBtn.style.color = 'var(--success)';
            
            setTimeout(() => {
                this.elements.copyBtn.innerHTML = originalIcon;
                this.elements.copyBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Copy failed:', error);
            this.showMessage('Failed to copy', 'error');
        }
    }

    saveTranslation() {
        if (!this.currentTranslation) {
            this.showMessage('No translation to save', 'warning');
            return;
        }
        
        const translation = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString(),
            ...this.currentTranslation
        };
        
        // Add to history (limit to 50 items)
        this.history.unshift(translation);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        // Save to localStorage
        localStorage.setItem('translatorHistory', JSON.stringify(this.history));
        
        // Update UI
        this.renderHistory();
        this.showMessage('Translation saved to history', 'success');
        
        // Visual feedback
        const originalText = this.elements.saveBtn.innerHTML;
        this.elements.saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        this.elements.saveBtn.style.color = 'var(--success)';
        
        setTimeout(() => {
            this.elements.saveBtn.innerHTML = originalText;
            this.elements.saveBtn.style.color = '';
        }, 2000);
    }

    loadHistory() {
        const saved = localStorage.getItem('translatorHistory');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (error) {
                console.error('Failed to parse history:', error);
                this.history = [];
            }
        }
        this.renderHistory();
    }

    renderHistory() {
        const historyList = this.elements.historyList;
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>No translation history yet</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-lang">
                        ${this.getLangFlag(item.from)} → ${this.getLangFlag(item.to)}
                    </span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
                <div class="history-text">
                    ${this.truncateText(item.input, 60)}
                </div>
                <div class="history-translation">
                    ${this.truncateText(item.output, 60)}
                </div>
            </div>
        `).join('');
        
        // Add click events to history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                this.loadFromHistory(id);
            });
        });
    }

    loadFromHistory(id) {
        const item = this.history.find(h => h.id === id);
        if (!item) return;
        
        this.elements.inputText.value = item.input;
        this.elements.fromLang.value = item.from;
        this.elements.toLang.value = item.to;
        this.displayTranslation(item.output);
        
        this.currentTranslation = {
            input: item.input,
            output: item.output,
            from: item.from,
            to: item.to,
            timestamp: new Date()
        };
        
        this.updateCharCount();
        this.showMessage('Loaded from history', 'success');
        
        // On mobile, switch to translate section
        if (this.isMobile) {
            this.switchMobileSection('translate');
        }
    }

    clearHistory() {
        if (this.history.length === 0) {
            this.showMessage('History is already empty', 'info');
            return;
        }
        
        if (confirm('Clear all translation history?')) {
            this.history = [];
            localStorage.removeItem('translatorHistory');
            this.renderHistory();
            this.showMessage('History cleared', 'success');
        }
    }

    updateCharCount() {
        const text = this.elements.inputText.value;
        const count = text.length;
        this.elements.charCount.textContent = count;
        
        // Color coding
        if (count > 450) {
            this.elements.charCount.style.color = 'var(--danger)';
        } else if (count > 400) {
            this.elements.charCount.style.color = 'var(--warning)';
        } else {
            this.elements.charCount.style.color = 'var(--primary)';
        }
        
        // Limit to 500 characters
        if (count > 500) {
            this.elements.inputText.value = text.substring(0, 500);
            this.updateCharCount();
        }
    }

    detectLanguage() {
        const text = this.elements.inputText.value.trim();
        
        if (!text) {
            this.elements.languageHint.textContent = 'Detecting language...';
            return;
        }
        
        // Simple language detection
        const detected = this.autoDetectLanguage(text);
        this.elements.languageHint.textContent = `Detected: ${detected}`;
    }

    autoDetectLanguage(text) {
        if (/[\u4e00-\u9fff]/.test(text)) {
            return 'Mandarin 🇨🇳';
        }
        
        // Check for English common words
        const englishWords = ['the', 'and', 'you', 'that', 'have', 'for', 'with', 'this'];
        const words = text.toLowerCase().split(/\s+/);
        const englishCount = words.filter(word => englishWords.includes(word)).length;
        
        if (englishCount > 0) {
            return 'English 🇺🇸';
        }
        
        // Check for Indonesian common words
        const indonesianWords = ['dan', 'yang', 'dengan', 'ini', 'itu', 'ada', 'tidak'];
        const indonesianCount = words.filter(word => indonesianWords.includes(word)).length;
        
        if (indonesianCount > 0) {
            return 'Indonesian 🇮🇩';
        }
        
        return 'Unknown';
    }

    setLoadingState(loading) {
        const translateBtn = this.elements.translateBtn;
        
        if (loading) {
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Translating...</span>';
            translateBtn.classList.add('loading');
        } else {
            translateBtn.disabled = false;
            translateBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Translate Now</span>';
            translateBtn.classList.remove('loading');
        }
    }

    savePreferences() {
        const preferences = {
            fromLang: this.elements.fromLang.value,
            toLang: this.elements.toLang.value
        };
        localStorage.setItem('translatorPreferences', JSON.stringify(preferences));
    }

    loadPreferences() {
        const saved = localStorage.getItem('translatorPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                this.elements.fromLang.value = preferences.fromLang || 'id';
                this.elements.toLang.value = preferences.toLang || 'en';
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        }
    }

    getLangFlag(code) {
        const flags = {
            'id': '🇮🇩',
            'en': '🇺🇸',
            'zh': '🇨🇳'
        };
        return flags[code] || code;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showMessage(text, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message-toast');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const message = document.createElement('div');
        message.className = `message-toast ${type}`;
        message.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            <span>${text}</span>
        `;
        
        // Style the message
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(message);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => message.remove(), 300);
        }, 3000);
        
        // Add animation styles if not already present
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getMessageColor(type) {
        const colors = {
            'success': 'var(--success)',
            'error': 'var(--danger)',
            'warning': 'var(--warning)',
            'info': 'var(--primary)'
        };
        return colors[type] || 'var(--primary)';
    }

    updateUI() {
        this.updateCharCount();
        this.loadPreferences();
    }
}

// Initialize the app
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TranslatorApp();
    window.app = app;
    
    // Show welcome message
    setTimeout(() => {
        app.showMessage('Welcome to Tlanslator by den, try say : JOKOPI subianti');
    }, 1000);
});