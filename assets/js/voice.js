// VOICE HANDLER WITH ENHANCED FEATURES

class VoiceHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.speechSynthesis = window.speechSynthesis || null;
        this.speechUtterance = null;
        this.isSpeaking = false;
        
        // Voice languages mapping
        this.voiceLanguages = {
            'id': 'id-ID',
            'en': 'en-US',
            'zh': 'zh-CN'
        };
        
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.loadVoices();
    }

    setupSpeechRecognition() {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            this.disableVoiceFeatures();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuration
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'id-ID'; // Default to Indonesian
        this.recognition.maxAlternatives = 3; // Get multiple alternatives
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceButton(true);
            this.showMessage('🎤 Listening... Speak now', 'info');
        };
        
        this.recognition.onresult = (event) => {
            const results = event.results[0];
            const transcript = results[0].transcript;
            const confidence = results[0].confidence;
            
            console.log('Voice recognized:', transcript, 'Confidence:', confidence);
            
            // Insert text into input field
            this.handleVoiceInput(transcript);
            
            this.isListening = false;
            this.updateVoiceButton(false);
            this.showMessage('✅ Voice input received', 'success');
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButton(false);
            
            const errorMessages = {
                'no-speech': 'No speech detected',
                'audio-capture': 'No microphone',
                'not-allowed': 'Microphone permission denied',
                'network': 'Network error',
                'aborted': 'Recognition aborted'
            };
            
            const message = errorMessages[event.error] || `Error: ${event.error}`;
            this.showMessage(`❌ ${message}`, 'error');
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton(false);
        };
    }

    setupEventListeners() {
        const voiceBtn = document.getElementById('voice-input-btn');
        const speakBtn = document.getElementById('speak-btn');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleVoiceInput();
            });
            
            // Add touch events for mobile
            voiceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isListening) {
                    this.startVoiceInput();
                }
            });
            
            voiceBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.isListening) {
                    this.stopVoiceInput();
                }
            });
        }
        
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.speakTranslation();
            });
        }
        
        // Handle language change for voice
        document.addEventListener('change', (e) => {
            if (e.target.id === 'from-lang' || e.target.id === 'to-lang') {
                this.updateRecognitionLanguage();
            }
        });
    }

    disableVoiceFeatures() {
        const voiceBtn = document.getElementById('voice-input-btn');
        const speakBtn = document.getElementById('speak-btn');
        
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
            voiceBtn.disabled = true;
        }
        
        if (speakBtn) {
            speakBtn.style.display = 'none';
            speakBtn.disabled = true;
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showMessage('Voice input not supported', 'error');
            return;
        }
        
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        // Set language based on input language selection
        const fromLang = document.getElementById('from-lang').value;
        this.recognition.lang = this.voiceLanguages[fromLang] || 'id-ID';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            this.showMessage('Failed to start voice input', 'error');
        }
    }

    stopVoiceInput() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    handleVoiceInput(transcript) {
        const inputText = document.getElementById('input-text');
        const currentText = inputText.value;
        
        // Add space if there's existing text
        const separator = (currentText && !currentText.endsWith(' ')) ? ' ' : '';
        const newText = currentText + separator + transcript;
        
        // Update input field
        inputText.value = newText;
        
        // Trigger input events
        inputText.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus on input
        inputText.focus();
        
        // Auto-translate if text is long enough
        if (newText.length > 10 && !newText.includes('?')) {
            setTimeout(() => {
                const translateBtn = document.getElementById('translate-btn');
                if (translateBtn) {
                    translateBtn.click();
                }
            }, 500);
        }
    }

    speakTranslation() {
        const outputText = document.getElementById('output-text');
        const toLang = document.getElementById('to-lang').value;
        
        if (!outputText) {
            this.showMessage('No output text found', 'error');
            return;
        }
        
        // Get text content (without HTML tags)
        let text = outputText.textContent || outputText.innerText;
        
        if (!text || text.includes('Translation will appear here')) {
            this.showMessage('No text to speak', 'warning');
            return;
        }
        
        // Clean the text
        text = text.trim();
        
        if (!this.speechSynthesis) {
            this.showMessage('Text-to-speech not supported', 'error');
            return;
        }
        
        // Cancel any ongoing speech
        this.stopSpeaking();
        
        // Create utterance
        this.speechUtterance = new SpeechSynthesisUtterance(text);
        this.speechUtterance.lang = this.voiceLanguages[toLang] || 'en-US';
        this.speechUtterance.rate = 0.9; // Slightly slower for clarity
        this.speechUtterance.pitch = 1.0;
        this.speechUtterance.volume = 1.0;
        
        // Try to find appropriate voice
        this.setVoiceForLanguage(toLang);
        
        // Event handlers
        this.speechUtterance.onstart = () => {
            this.isSpeaking = true;
            this.updateSpeakButton(true);
            this.showMessage('🔊 Speaking...', 'info');
        };
        
        this.speechUtterance.onend = () => {
            this.isSpeaking = false;
            this.updateSpeakButton(false);
        };
        
        this.speechUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateSpeakButton(false);
            this.showMessage('Failed to speak text', 'error');
        };
        
        // Start speaking
        this.speechSynthesis.speak(this.speechUtterance);
    }

    stopSpeaking() {
        if (this.speechSynthesis && this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.updateSpeakButton(false);
        }
    }

    setVoiceForLanguage(lang) {
        if (!this.speechUtterance || !this.speechSynthesis) return;
        
        const voices = this.speechSynthesis.getVoices();
        if (voices.length === 0) return;
        
        const targetLang = this.voiceLanguages[lang] || 'en-US';
        const langPrefix = targetLang.substring(0, 2);
        
        // Try to find exact match first
        let voice = voices.find(v => v.lang === targetLang);
        
        // Then try language prefix match
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith(langPrefix));
        }
        
        // Then try any Chinese voice for Mandarin
        if (!voice && lang === 'zh') {
            voice = voices.find(v => v.lang.includes('zh') || v.name.includes('Chinese'));
        }
        
        if (voice) {
            this.speechUtterance.voice = voice;
        }
    }

    loadVoices() {
        if (!this.speechSynthesis) return;
        
        // Load voices when they become available
        if (this.speechSynthesis.getVoices().length > 0) {
            this.voicesLoaded = true;
        } else {
            this.speechSynthesis.addEventListener('voiceschanged', () => {
                this.voicesLoaded = true;
            });
        }
    }

    updateRecognitionLanguage() {
        if (!this.recognition) return;
        
        const fromLang = document.getElementById('from-lang').value;
        this.recognition.lang = this.voiceLanguages[fromLang] || 'id-ID';
    }

    updateVoiceButton(listening) {
        const voiceBtn = document.getElementById('voice-input-btn');
        if (!voiceBtn) return;
        
        if (listening) {
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            voiceBtn.style.background = '#ff6b6b';
            voiceBtn.style.color = 'white';
            voiceBtn.style.borderColor = '#ff6b6b';
            voiceBtn.classList.add('pulse');
        } else {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = '';
            voiceBtn.style.color = '';
            voiceBtn.style.borderColor = '';
            voiceBtn.classList.remove('pulse');
        }
    }

    updateSpeakButton(speaking) {
        const speakBtn = document.getElementById('speak-btn');
        if (!speakBtn) return;
        
        if (speaking) {
            speakBtn.innerHTML = '<i class="fas fa-stop"></i>';
            speakBtn.style.background = '#ff6b6b';
            speakBtn.style.color = 'white';
            speakBtn.style.borderColor = '#ff6b6b';
        } else {
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakBtn.style.background = '';
            speakBtn.style.color = '';
            speakBtn.style.borderColor = '';
        }
    }

    showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.voice-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const message = document.createElement('div');
        message.className = `voice-message ${type}`;
        message.innerHTML = text;
        
        // Style the message
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : 
                        type === 'error' ? '#f44336' : 
                        type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(message);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
        
        // Add animation styles if not already present
        if (!document.querySelector('#voice-message-styles')) {
            const style = document.createElement('style');
            style.id = 'voice-message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .pulse {
                    animation: pulse 1.5s infinite;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize voice handler
let voiceHandler;

document.addEventListener('DOMContentLoaded', () => {
    voiceHandler = new VoiceHandler();
    window.voiceHandler = voiceHandler;
    
    // Auto-focus on input when voice input ends
    document.addEventListener('focusin', (e) => {
        if (e.target.id === 'input-text' && voiceHandler && voiceHandler.isListening) {
            voiceHandler.stopVoiceInput();
        }
    });
});