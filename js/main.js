// Hello Kitty Valentine Adventure - Main Game Controller
class HelloKittyGame {
    constructor() {
        this.gameData = null;
        this.currentScene = 'loading';
        this.userName = '';
        this.userAnswers = [];
        this.emotionalProfile = {
            romantic: 0,
            playful: 0,
            teasing: 0,
            emotional: 0,
            fantasy: 0,
            kitty: 0
        };
        this.currentQuestionIndex = 0;
        this.unlockedVaults = 0;
        this.selectedLetter = '';
        this.villainClickCount = 0;
        this.villainMessages = [
            "Are you sure? 😿",
            "But I have cat treats! 🍬",
            "My kitty heart is breaking...",
            "You monster! 😾",
            "Okay, I'll use my sad eyes... 🥺",
            "Please reconsider? 🙏",
            "I'm just a cute kitty! 🐱",
            "This is emotionally damaging!",
            "Fine, I'll ask my friend...",
            "OKAY FINE! YES IT IS! 😻"
        ];
        this.selectedOptionIndex = null;
        this.hasForcedYes = false;

        // Loading variables
        this.loadingInterval = null;
        this.skipButtonTimeout = null;
        this.isLoadingSkipped = false;
        this.catCursor = null;

        // Initialize game
        this.init();
    }

    async init() {
        // Initialize cat cursor
        this.initCatCursor();

        // Load game data
        await this.loadGameData();

        // Initialize event listeners
        this.initEventListeners();

        // Initialize audio
        this.initAudio();

        // Load character images
        this.loadCharacterImages();

        // Start loading sequence
        this.startLoadingSequence();
    }

    initCatCursor() {
        this.catCursor = document.getElementById('cat-cursor');
        if (this.catCursor) {
            document.addEventListener('mousemove', (e) => {
                this.catCursor.style.left = e.clientX + 'px';
                this.catCursor.style.top = e.clientY + 'px';
            });

            // Add click animation
            document.addEventListener('click', () => {
                this.catCursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
                setTimeout(() => {
                    this.catCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 100);
            });
        }
    }

    async loadGameData() {
        try {
            const response = await fetch('data/data.json');
            this.gameData = await response.json();
            console.log('🐱 Game data loaded successfully!');
        } catch (error) {
            console.error('😿 Error loading game data:', error);
            this.gameData = this.getFallbackData();
        }
    }

    loadCharacterImages() {
        const character1Img = document.getElementById('character1-img');
        const character2Img = document.getElementById('character2-img');
        const character1Container = character1Img.parentElement;
        const character2Container = character2Img.parentElement;

        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        character1Img.src = `assets/images/characters/hello-kitty.png?t=${timestamp}`;
        character2Img.src = `assets/images/characters/my-melody.png?t=${timestamp}`;

        // Handle image load success
        character1Img.onload = () => {
            character1Container.classList.add('loaded');
            console.log('😺 Hello Kitty image loaded successfully');
        };

        character2Img.onload = () => {
            character2Container.classList.add('loaded');
            console.log('🐰 My Melody image loaded successfully');
        };

        // Handle image load errors (fallback to placeholder)
        character1Img.onerror = () => {
            character1Container.style.display = 'none';
            character1Img.style.display = 'none';
            console.log('😿 Hello Kitty image failed to load, using placeholder');
        };

        character2Img.onerror = () => {
            character2Container.style.display = 'none';
            character2Img.style.display = 'none';
            console.log('😿 My Melody image failed to load, using placeholder');
        };
    }

    initEventListeners() {
        // Name submission
        document.getElementById('submit-name').addEventListener('click', () => this.handleNameSubmit());
        document.getElementById('user-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleNameSubmit();
        });

        // Disclaimer acceptance
        document.getElementById('accept-disclaimer').addEventListener('click', () => {
            this.playSFX('click');
            setTimeout(() => this.showQuestions(), 300);
        });

        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option-button')) {
                const optionButton = e.target.closest('.option-button');
                const optionIndex = parseInt(optionButton.dataset.index);
                this.playSFX('click');
                this.selectOption(optionIndex);
            }
        });

        // Next question button
        document.getElementById('next-question').addEventListener('click', () => {
            if (document.getElementById('next-question').disabled) return;
            this.playSFX('transition');
            this.goToNextQuestion();
        });

        // Letter selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.letter-card')) {
                this.playSFX('heart');
                const letterCard = e.target.closest('.letter-card');
                this.selectLetter(letterCard.dataset.type);
            }
        });

        // Proposal buttons
        document.getElementById('yes-button').addEventListener('click', () => this.handleYesClick());
        document.getElementById('no-button').addEventListener('click', () => this.handleNoClick());

        // Vault icons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.vault-icon')) {
                const vaultIcon = e.target.closest('.vault-icon');
                if (!vaultIcon.classList.contains('unlocked')) {
                    this.playSFX('success');
                    setTimeout(() => this.openVault(vaultIcon.dataset.vault), 300);
                }
            }
        });

        // Final actions
        document.getElementById('relive-button').addEventListener('click', () => {
            this.playSFX('click');
            setTimeout(() => this.restartGame(), 300);
        });

        document.getElementById('share-button').addEventListener('click', () => {
            this.playSFX('click');
            setTimeout(() => this.shareGame(), 300);
        });

        document.getElementById('treat-button').addEventListener('click', () => {
            this.playSFX('heart');
            this.giveVirtualTreat();
        });

        // Skip loading button
        document.getElementById('skip-loading').addEventListener('click', () => {
            this.skipLoading();
        });
    }

    initAudio() {
        // Background music element
        this.bgm = document.getElementById('background-music');
        this.bgm.volume = 0.4;

        // Cat sounds
        this.meowSound = document.getElementById('meow-sound');
        this.purrSound = document.getElementById('purr-sound');

        // Play BGM helper
        this.playBGM = () => {
            if (this.bgm) {
                this.bgm.currentTime = 0;
                this.bgm.play().catch(e => {
                    console.log('🎵 BGM play failed:', e);
                    // If autoplay is blocked, play on user interaction
                    document.addEventListener('click', () => {
                        this.bgm.play().catch(e => console.log('🎵 BGM still blocked'));
                    }, { once: true });
                });
            }
        };

        // Pause BGM helper
        this.pauseBGM = () => {
            if (this.bgm) {
                this.bgm.pause();
            }
        };

        // Play SFX helper with Web Audio API
        this.playSFX = (type) => {
            try {
                // Create audio context if not exists
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                // Create oscillator for sound effects
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                // Different sounds for different SFX
                let frequency = 440;
                let typeValue = 'sine';

                switch (type) {
                    case 'click':
                        frequency = 800;
                        typeValue = 'sine';
                        break;
                    case 'heart':
                        frequency = 523.25; // C5
                        typeValue = 'sine';
                        break;
                    case 'success':
                        frequency = 659.25; // E5 - Major 3rd
                        typeValue = 'triangle';
                        break;
                    case 'transition':
                        frequency = 392; // G4
                        typeValue = 'sine';
                        break;
                    case 'accept':
                        // Play a positive ascending chord
                        this.playChord([523.25, 659.25, 783.99], 'triangle');
                        return;
                    case 'error':
                        frequency = 220; // A3 - lower frequency for error
                        typeValue = 'sawtooth';
                        break;
                    case 'skip':
                        frequency = 698.46; // F5
                        typeValue = 'sine';
                        break;
                    case 'meow':
                        // Play actual meow sound if available
                        if (this.meowSound) {
                            this.meowSound.currentTime = 0;
                            this.meowSound.play();
                            return;
                        }
                        // Fallback to synthesized meow
                        frequency = 300;
                        typeValue = 'sawtooth';
                        break;
                    case 'purr':
                        // Play actual purr sound if available
                        if (this.purrSound) {
                            this.purrSound.currentTime = 0;
                            this.purrSound.play();
                            return;
                        }
                        // Fallback to synthesized purr
                        this.playPurr();
                        return;
                }

                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = typeValue;

                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            } catch (e) {
                console.log('🔊 SFX play failed:', e);
            }
        };

        // Helper for playing chords
        this.playChord = (frequencies, type = 'sine') => {
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = type;

                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);

                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                }, index * 50);
            });
        };

        // Helper for playing purr sound
        this.playPurr = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';

            // Create purr effect with frequency modulation
            oscillator.frequency.exponentialRampToValueAtTime(120, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.02, this.audioContext.currentTime + 1);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }

    startLoadingSequence() {
        this.playBGM();
        this.playSFX('purr');

        const quotes = this.gameData.loading.quotes;
        const quoteElement = document.getElementById('loading-quote');
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const skipButton = document.getElementById('skip-loading');

        // Reset skip button
        skipButton.style.display = 'none';
        this.isLoadingSkipped = false;

        // Calculate total loading time based on quotes
        const totalQuotes = quotes.length;
        const totalLoadingTime = totalQuotes * 2500; // 2.5 seconds per quote
        const progressPerQuote = 100 / totalQuotes;

        let currentQuoteIndex = 0;
        let progress = 0;

        // Create particles
        this.createKittyParticles();

        // Show skip button after 15 seconds
        this.skipButtonTimeout = setTimeout(() => {
            skipButton.style.display = 'flex';
            this.playSFX('meow');
        }, 15000);

        // Clear any existing interval
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }

        // Start loading interval
        this.loadingInterval = setInterval(() => {
            if (this.isLoadingSkipped) {
                clearInterval(this.loadingInterval);
                return;
            }

            // Update quote with fade animation
            quoteElement.style.animation = 'none';
            setTimeout(() => {
                quoteElement.textContent = quotes[currentQuoteIndex];
                quoteElement.style.animation = 'fadeInOut 2.5s ease-in-out';
            }, 50);

            // Update progress
            progress = (currentQuoteIndex + 1) * progressPerQuote;
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = Math.round(progress);

            // Play meow sound every few quotes
            if (currentQuoteIndex % 3 === 0) {
                this.playSFX('meow');
            }

            currentQuoteIndex++;

            // Check if loading is complete
            if (currentQuoteIndex >= totalQuotes) {
                clearInterval(this.loadingInterval);
                clearTimeout(this.skipButtonTimeout);
                this.completeLoading();
            }
        }, 2500); // 2.5 seconds per quote
    }

    createKittyParticles() {
        const container = document.getElementById('particles-container');
        const particleCount = 30;

        // Clear existing particles
        container.innerHTML = '';

        const emojis = ['🐱', '🐾', '💖', '🎀', '✨', '🌟', '😻', '🐈', '🧶'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            // Random properties
            const size = Math.random() * 25 + 15;
            const duration = Math.random() * 10 + 8;
            const delay = Math.random() * 6;
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const rotation = Math.random() * 360;

            particle.style.cssText = `
                position: absolute;
                left: ${startX}vw;
                top: ${startY}vh;
                font-size: ${size}px;
                opacity: ${Math.random() * 0.5 + 0.3};
                animation: float ${duration}s ease-in-out infinite;
                animation-delay: ${delay}s;
                pointer-events: none;
                z-index: 1;
                transform: rotate(${rotation}deg);
                filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1));
            `;

            container.appendChild(particle);
        }
    }

    completeLoading() {
        // Clear timeouts and intervals
        clearTimeout(this.skipButtonTimeout);
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }

        // Hide skip button
        document.getElementById('skip-loading').style.display = 'none';

        // Set to 100% and show success
        setTimeout(() => {
            document.getElementById('progress-fill').style.width = '100%';
            document.getElementById('progress-percent').textContent = '100';
            this.playSFX('success');

            // Add celebration
            this.createKittyParticles();

            setTimeout(() => {
                this.switchScene('name-screen');
            }, 1000);
        }, 300);
    }

    skipLoading() {
        if (this.isLoadingSkipped) return;

        this.playSFX('skip');
        this.isLoadingSkipped = true;

        // Clear timeouts and intervals
        clearTimeout(this.skipButtonTimeout);
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }

        // Hide skip button
        document.getElementById('skip-loading').style.display = 'none';

        // Show skipping animation
        const quoteElement = document.getElementById('loading-quote');
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');

        // Update quote to show skipping
        quoteElement.style.animation = 'none';
        setTimeout(() => {
            quoteElement.textContent = "Skipping to the cuteness! 🐱💨";
            quoteElement.style.animation = 'fadeInOut 1s ease-in-out';
        }, 50);

        // Quickly animate progress to 100%
        let skipProgress = parseFloat(progressFill.style.width) || 0;
        const skipInterval = setInterval(() => {
            skipProgress += 8;
            if (skipProgress > 100) skipProgress = 100;

            progressFill.style.width = `${skipProgress}%`;
            progressPercent.textContent = Math.round(skipProgress);

            if (skipProgress >= 100) {
                clearInterval(skipInterval);
                setTimeout(() => {
                    this.playSFX('success');
                    this.createKittyParticles();
                    setTimeout(() => {
                        this.switchScene('name-screen');
                    }, 800);
                }, 200);
            }
        }, 60);
    }

    handleNameSubmit() {
        this.playSFX('click');

        const nameInput = document.getElementById('user-name');
        const name = nameInput.value.trim();

        if (name) {
            this.userName = name;
            localStorage.setItem('kittyValentineName', name);
            this.playSFX('accept');
            this.playSFX('meow');

            // Add cute name validation
            if (name.toLowerCase().includes('kitty') || name.toLowerCase().includes('cat')) {
                this.playSFX('purr');
                setTimeout(() => {
                    alert(`OMG ${name}! That's the purr-fect name for a kitty lover! 😻`);
                }, 100);
            }

            this.switchScene('disclaimer-screen');
        } else {
            // Add shake animation to input
            this.playSFX('error');
            nameInput.classList.add('shake');
            nameInput.placeholder = "Please enter your cute name! 🐱";
            setTimeout(() => {
                nameInput.classList.remove('shake');
                nameInput.placeholder = "Type your beautiful name here...";
            }, 1000);
        }
    }

    showQuestions() {
        this.playSFX('transition');
        this.playSFX('meow');
        this.switchScene('questions-screen');
        this.loadQuestion(0);
    }

    loadQuestion(index) {
        if (index >= this.gameData.questions.length) {
            this.showResults();
            return;
        }

        this.currentQuestionIndex = index;
        this.selectedOptionIndex = null;
        const question = this.gameData.questions[index];

        // Update UI
        document.getElementById('main-question').textContent = question.question;

        // Set question image emoji
        const questionImage = document.getElementById('question-image');
        questionImage.innerHTML = question.imageEmoji || '🐱';

        document.getElementById('question-category').textContent = question.category;

        // Update progress
        const progressPercent = ((index + 1) / this.gameData.questions.length) * 100;
        document.getElementById('question-progress').style.width = `${progressPercent}%`;
        document.getElementById('current-question').textContent = index + 1;
        document.getElementById('total-questions').textContent = this.gameData.questions.length;

        // Load options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, i) => {
            const optionButton = document.createElement('button');
            optionButton.className = 'option-button';
            optionButton.dataset.index = i;

            optionButton.innerHTML = `
                <div class="option-image">${option.emoji || '💖'}</div>
                <span>${option.text}</span>
            `;

            optionsContainer.appendChild(optionButton);
        });

        // Update flirty quote
        document.getElementById('flirty-quote').textContent = question.flirtyQuote;

        // Clear previous reaction and enable/disable next button
        document.getElementById('option-reaction').textContent = 'Choose an option to continue... 🐾';
        document.getElementById('emoji-reactions').innerHTML = '';

        // Reset next button
        const nextButton = document.getElementById('next-question');
        nextButton.disabled = true;
        nextButton.classList.remove('enabled');
        nextButton.innerHTML = '<span>Select an option first</span><i class="fas fa-paw"></i>';

        // Animate cat walking
        this.animateCatWalking();
    }

    animateCatWalking() {
        const catWalking = document.getElementById('cat-walking');
        if (catWalking) {
            catWalking.style.animation = 'none';
            setTimeout(() => {
                catWalking.style.animation = 'fadeIn 0.5s ease';
            }, 50);
        }
    }

    selectOption(optionIndex) {
        const question = this.gameData.questions[this.currentQuestionIndex];
        const option = question.options[optionIndex];

        // Update selected option index
        this.selectedOptionIndex = optionIndex;

        // Show reaction
        const reactionText = document.getElementById('option-reaction');
        reactionText.textContent = option.reaction;
        this.playSFX('heart');

        // Play meow sound randomly
        if (Math.random() > 0.7) {
            this.playSFX('meow');
        }

        // Show emojis
        const emojiContainer = document.getElementById('emoji-reactions');
        emojiContainer.innerHTML = option.emojis.map(emoji =>
            `<span style="animation-delay: ${Math.random() * 0.5}s">${emoji}</span>`
        ).join('');

        // Add visual feedback to selected option
        const optionButtons = document.querySelectorAll('.option-button');
        optionButtons.forEach(btn => btn.classList.remove('selected'));
        optionButtons[optionIndex].classList.add('selected');

        // Enable next button
        const nextButton = document.getElementById('next-question');
        nextButton.disabled = false;
        nextButton.classList.add('enabled');
        nextButton.innerHTML = '<span>Next Meow-stion</span><i class="fas fa-paw"></i>';
        this.playSFX('accept');
    }

    goToNextQuestion() {
        if (this.selectedOptionIndex === null) return;

        const question = this.gameData.questions[this.currentQuestionIndex];
        const option = question.options[this.selectedOptionIndex];

        // Update emotional profile
        option.emotions.forEach(emotion => {
            this.emotionalProfile[emotion.type] += emotion.value;
        });

        // Add kitty points for choosing cat-related options
        if (option.text.toLowerCase().includes('cat') ||
            option.text.toLowerCase().includes('kitty') ||
            option.text.toLowerCase().includes('purr') ||
            option.text.toLowerCase().includes('meow')) {
            this.emotionalProfile.kitty += 2;
        }

        // Store answer
        this.userAnswers.push({
            question: question.question,
            answer: option.text,
            emotions: option.emotions
        });

        // Load next question
        this.loadQuestion(this.currentQuestionIndex + 1);
    }

    showResults() {
        this.playSFX('success');
        this.playSFX('meow');
        this.switchScene('results-screen');

        // Display user name
        document.getElementById('user-name-display').textContent = this.userName;

        // Determine dominant emotion
        const emotions = Object.entries(this.emotionalProfile);
        emotions.sort((a, b) => b[1] - a[1]);
        const dominantEmotion = emotions[0][0];

        // Generate letters
        const lettersContainer = document.getElementById('letters-container');
        lettersContainer.innerHTML = '';

        const letterTypes = ['romantic', 'playful', 'teasing', 'emotional', 'fantasy', 'kitty'];

        letterTypes.forEach(type => {
            const letterData = this.gameData.results.letters.find(l => l.type === type);
            if (letterData) {
                const letterCard = document.createElement('div');
                letterCard.className = 'letter-card';
                letterCard.dataset.type = type;

                // Highlight letter matching dominant emotion
                if (type === dominantEmotion) {
                    letterCard.style.boxShadow = '0 25px 60px rgba(255, 133, 161, 0.5)';
                    letterCard.style.border = '5px solid var(--color-kitty-red)';
                    letterCard.style.transform = 'translateY(-5px)';
                }

                letterCard.innerHTML = `
                    <h3>${letterData.title}</h3>
                    <p>${letterData.description}</p>
                    <div class="letter-preview">${this.generateLetterPreview(type)}</div>
                    <div class="letter-emoji">${letterData.emoji}</div>
                `;

                lettersContainer.appendChild(letterCard);
            }
        });
    }

    generateLetterPreview(type) {
        const previews = {
            romantic: `My dear ${this.userName}, every moment without you feels like a sunny day without rainbows... 🌈`,
            playful: `Hey ${this.userName}! Ready for some kitty-powered fun? 😹`,
            teasing: `Oh ${this.userName}, you really thought you could resist my cuteness? 😼`,
            emotional: `${this.userName}, there's something I've been wanting to tell you with all my heart... 💝`,
            fantasy: `In a world of magic and sparkles, I found you, ${this.userName}... ✨`,
            kitty: `${this.userName}, you're the cat's pajamas! The bee's knees! The purr-fect human! 🐱👑`
        };

        return previews[type] || `For my favorite human, ${this.userName}... 🐾`;
    }

    selectLetter(type) {
        this.selectedLetter = type;
        this.playSFX('purr');

        // Visual feedback
        const letterCards = document.querySelectorAll('.letter-card');
        letterCards.forEach(card => {
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.border = '';
        });

        const selectedCard = document.querySelector(`[data-type="${type}"]`);
        selectedCard.style.transform = 'translateY(-10px) scale(1.05)';
        selectedCard.style.boxShadow = '0 30px 70px rgba(255, 133, 161, 0.6)';
        selectedCard.style.border = '5px solid var(--color-kitty-red)';

        // Create sparkles
        this.createSparkles(selectedCard);

        // Proceed to proposal after delay
        setTimeout(() => {
            this.playSFX('success');
            this.showProposal();
        }, 1800);
    }

    createSparkles(element) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: fixed;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                font-size: ${Math.random() * 20 + 15}px;
                opacity: 0;
                pointer-events: none;
                z-index: 1000;
                animation: sparklePop 1s ease-out forwards;
            `;
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1000);
        }
    }

    showProposal() {
        this.switchScene('proposal-screen');

        // Display user name
        document.getElementById('proposal-name').textContent = this.userName;

        // Initialize villain button
        this.villainClickCount = 0;
        this.hasForcedYes = false;

        // Start background animation
        this.createFloatingHearts();
    }

    createFloatingHearts() {
        const container = document.getElementById('proposal-effects');
        for (let i = 0; i < 10; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '💖';
            heart.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: 100%;
                font-size: ${Math.random() * 30 + 20}px;
                opacity: ${Math.random() * 0.5 + 0.3};
                animation: float ${Math.random() * 10 + 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                pointer-events: none;
                z-index: 1;
            `;
            container.appendChild(heart);
        }
    }

    handleYesClick() {
        this.playSFX('heart');
        this.playSFX('purr');

        const yesButton = document.getElementById('yes-button');
        const noButton = document.getElementById('no-button');

        // Animate YES button
        yesButton.style.transform = 'scale(1.3)';
        yesButton.style.animation = 'none';

        // Create heart explosion
        this.createHeartExplosion();

        // Hide NO button
        noButton.style.opacity = '0';
        noButton.style.pointerEvents = 'none';

        // Create full-screen overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 255, 255, 0.85);
        z-index: 9999;
        opacity: 0;
        animation: fadeIn 0.5s forwards;
    `;

        // Create celebration message
        const celebration = document.createElement('div');
        celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 2rem 2.5rem;
        border-radius: 20px;
        border: 5px solid var(--color-kitty-red);
        z-index: 10000;
        text-align: center;
        animation: popIn 0.5s ease;
        box-shadow: 0 20px 60px rgba(255, 107, 139, 0.4);
        max-width: 90%;
        width: 500px;
    `;

        celebration.innerHTML = `
        <h3 style="font-size: clamp(1.8rem, 4vw, 2.5rem); color: var(--color-kitty-red); margin-bottom: 1rem; line-height: 1.2;">YAY! 😻🎉</h3>
        <p style="font-size: clamp(1.1rem, 2vw, 1.5rem); color: var(--color-kitty-purple-dark); line-height: 1.4;">
            ${this.userName}, you just made a kitty very happy!<br>
            Time to unlock some memories! 🗝️✨
        </p>
        <div style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 1rem;">🐱💖🎀</div>
    `;

        // Append to body directly
        document.body.appendChild(overlay);
        document.body.appendChild(celebration);

        // Remove celebration and overlay, then proceed
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            celebration.style.opacity = '0';
            celebration.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                overlay.remove();
                celebration.remove();
                this.playSFX('success');
                this.showMemoryVault();
            }, 500);
        }, 2500);
    }

    handleNoClick() {
        if (this.hasForcedYes) return;

        const noButton = document.getElementById('no-button');
        const yesButton = document.getElementById('yes-button');

        // Play different sounds based on click count
        if (this.villainClickCount < this.villainMessages.length) {
            this.playSFX('error');
            this.playSFX('meow');
        }

        // Update villain button text
        if (this.villainClickCount < this.villainMessages.length) {
            noButton.innerHTML = `
                <i class="fas fa-cat"></i>
                <span>${this.villainMessages[this.villainClickCount]}</span>
                <i class="fas fa-question"></i>
            `;
            this.villainClickCount++;
        }

        // Check if we should force yes
        if (this.villainClickCount >= this.villainMessages.length) {
            this.forceYes();
            return;
        }

        // Shrink and change villain button
        const currentScale = 1 - (this.villainClickCount * 0.08);
        noButton.style.transform = `scale(${Math.max(currentScale, 0.6)})`;
        noButton.style.backgroundColor = `rgba(255, ${200 - this.villainClickCount * 20}, ${200 - this.villainClickCount * 20}, 0.9)`;

        // Make villain button dodge
        this.dodgeVillainButton(noButton);

        // Grow YES button
        const yesScale = 1 + (this.villainClickCount * 0.12);
        yesButton.style.transform = `scale(${yesScale})`;
        yesButton.style.boxShadow = `0 0 ${30 + this.villainClickCount * 10}px rgba(255, 133, 161, 0.8)`;

        // Add encouragement text
        const encouragement = document.querySelector('.encouragement-bubble p');
        if (encouragement) {
            const encouragements = [
                "Say yes! I have treats! 🍬",
                "Don't make a kitty sad! 😿",
                "Pretty please? 🥺",
                "I'll be your best friend! 🤝",
                "Think of the cuddles! 🤗",
                "You know you want to! 😉",
                "It's Valentine's Day! 💖",
                "I'll share my yarn! 🧶",
                "Please? 🙏",
                "LAST CHANCE! 😼"
            ];
            encouragement.textContent = encouragements[this.villainClickCount] || "JUST SAY YES! 😻";
        }
    }

    forceYes() {
        if (this.hasForcedYes) return;
        this.hasForcedYes = true;

        const noButton = document.getElementById('no-button');
        const yesButton = document.getElementById('yes-button');

        // Play dramatic sound
        this.playSFX('error');
        setTimeout(() => this.playSFX('meow'), 300);

        // Create system takeover effect - APPEND TO BODY DIRECTLY
        const takeover = document.createElement('div');
        takeover.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #ff3366, #ff66a3, #ff99cc);
        z-index: 9998;
        opacity: 0;
        animation: fadeIn 0.5s forwards;
    `;

        const takeoverContent = document.createElement('div');
        takeoverContent.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        color: #ff6b6b;
        padding: 2.5rem;
        border-radius: 25px;
        border: 5px solid #ff6b6b;
        z-index: 10000;
        text-align: center;
        max-width: 90%;
        width: 500px;
        box-shadow: 0 0 80px rgba(255, 107, 107, 0.7);
        animation: popIn 0.5s ease;
    `;

        takeoverContent.innerHTML = `
        <h3 style="font-size: 2rem; margin-bottom: 1.5rem; color: white;">😼 SYSTEM OVERRIDE ACTIVATED! 😼</h3>
        <p style="font-size: 1.4rem; margin-bottom: 2rem; color: white; line-height: 1.4;">
            AHAHAHA! You thought you could say NO to a kitty?<br>
            Well guess what... YOU CAN'T! 😹
        </p>
        <div style="font-size: 3rem; margin: 2rem 0; color: white;">⚡🐱⚡</div>
        <p style="font-size: 1.2rem; color: #ffcc00; font-weight: bold; line-height: 1.4;">
            The choice has been made for you!<br>
            YES is the ONLY option! 💖
        </p>
    `;

        // Append to body directly
        document.body.appendChild(takeover);
        document.body.appendChild(takeoverContent);

        // Remove takeover after 4 seconds
        setTimeout(() => {
            takeover.style.opacity = '0';
            takeover.style.transition = 'opacity 0.5s';
            takeoverContent.style.opacity = '0';
            takeoverContent.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                takeover.remove();
                takeoverContent.remove();
            }, 500);
        }, 4000);

        // Make NO button escape dramatically
        noButton.classList.add('villain-escape');
        noButton.style.pointerEvents = 'none';

        // Make YES button ultimate
        yesButton.style.animation = 'heartbeat 0.3s infinite, glow 0.5s infinite alternate';
        yesButton.style.transform = 'scale(1.5)';
        yesButton.style.boxShadow = '0 0 80px rgba(255, 107, 139, 1)';
        yesButton.style.zIndex = '10001';
        yesButton.style.background = 'linear-gradient(45deg, #ff0000, #ff3366, #ff6699)';

        // Change YES button text
        setTimeout(() => {
            yesButton.innerHTML = `
            <i class="fas fa-crown"></i>
            <span>YOU'RE MINE NOW! 😻👑</span>
            <i class="fas fa-heart"></i>
        `;
        }, 1000);

        // Auto-click yes after 5 seconds
        setTimeout(() => {
            this.handleYesClick();
            // Clean up takeover if still present
            if (document.body.contains(takeover)) {
                takeover.remove();
            }
            if (document.body.contains(takeoverContent)) {
                takeoverContent.remove();
            }
        }, 5000);
    }

    dodgeVillainButton(button) {
        const container = document.querySelector('.proposal-container');
        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();

        // Calculate random position within visible area
        const maxX = containerRect.width - buttonRect.width - 20;
        const maxY = containerRect.height - buttonRect.height - 20;

        // Don't let it go too far from center
        const centerX = containerRect.width / 2 - buttonRect.width / 2;
        const centerY = containerRect.height / 2 - buttonRect.height / 2;

        const randomX = Math.max(20, Math.min(maxX, centerX + (Math.random() - 0.5) * 200));
        const randomY = Math.max(20, Math.min(maxY, centerY + (Math.random() - 0.5) * 150));

        // Move button
        button.style.position = 'absolute';
        button.style.left = `${randomX}px`;
        button.style.top = `${randomY}px`;
        button.style.transition = 'left 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), top 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    }

    createHeartExplosion() {
        const container = document.getElementById('proposal-effects');
        const emojis = ['💖', '💕', '💗', '💓', '💘', '😻', '🐱', '🎀', '✨', '🌟'];

        for (let i = 0; i < 50; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];

            const randomX = (Math.random() - 0.5) * 300;
            const randomY = -(Math.random() * 200 + 100);
            const randomScale = Math.random() * 0.5 + 0.5;
            const randomDuration = Math.random() * 1 + 1;

            heart.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                font-size: ${Math.random() * 40 + 20}px;
                opacity: 0.9;
                pointer-events: none;
                z-index: 1000;
                transform: translate(-50%, -50%) scale(${randomScale});
                animation: heartFloat ${randomDuration}s ease-out forwards;
            `;

            heart.style.setProperty('--random-x', `${randomX}px`);
            heart.style.setProperty('--random-y', `${randomY}px`);

            container.appendChild(heart);

            // Remove after animation
            setTimeout(() => heart.remove(), randomDuration * 1000);
        }
    }

    showMemoryVault() {
        this.switchScene('vault-screen');
        this.playSFX('meow');

        // Load vault icons
        const vaultIcons = document.getElementById('vault-icons');
        vaultIcons.innerHTML = '';

        const vaultItems = [
            { id: 'gallery', icon: 'fas fa-images', title: 'Kitty Gallery', color: '#ffafcc' },
            { id: 'memories', icon: 'fas fa-brain', title: 'Cute Memories', color: '#cdb4db' },
            { id: 'letters', icon: 'fas fa-envelope', title: 'Love Letters', color: '#a2d2ff' },
            { id: 'surprise', icon: 'fas fa-gift', title: 'Special Surprise', color: '#b5ead7' }
        ];

        vaultItems.forEach((item, index) => {
            const vaultIcon = document.createElement('div');
            vaultIcon.className = 'vault-icon';
            vaultIcon.dataset.vault = item.id;
            vaultIcon.style.borderColor = item.color;

            vaultIcon.innerHTML = `
                <i class="${item.icon}" style="color: ${item.color}"></i>
                <h3>${item.title}</h3>
            `;

            vaultIcons.appendChild(vaultIcon);
        });

        // Update progress cats
        this.updateProgressCats();
    }

    updateProgressCats() {
        const progressCats = document.querySelectorAll('.progress-cats i');
        progressCats.forEach((cat, index) => {
            if (index < this.unlockedVaults) {
                cat.classList.add('unlocked');
            } else {
                cat.classList.remove('unlocked');
            }
        });
    }

    openVault(vaultId) {
        // Mark vault as unlocked
        const vaultIcon = document.querySelector(`[data-vault="${vaultId}"]`);
        vaultIcon.classList.add('unlocked');
        this.unlockedVaults++;

        // Update progress
        document.getElementById('unlocked-count').textContent = this.unlockedVaults;
        this.updateProgressCats();

        // Show vault content with animation
        const vaultContent = document.getElementById('vault-content');
        vaultContent.style.animation = 'none';
        setTimeout(() => {
            vaultContent.style.animation = 'fadeIn 0.5s ease';
        }, 10);

        const contentMap = {
            gallery: this.generateGalleryContent(),
            memories: this.generateMemoriesContent(),
            letters: this.generateLettersContent(),
            surprise: this.generateSurpriseContent()
        };

        vaultContent.innerHTML = contentMap[vaultId] || '<p>😿 Something went wrong...</p>';

        // Play sound based on vault
        switch (vaultId) {
            case 'gallery':
                this.playSFX('heart');
                break;
            case 'memories':
                this.playSFX('purr');
                break;
            case 'letters':
                this.playSFX('success');
                break;
            case 'surprise':
                this.playSFX('accept');
                break;
        }

        // Check if all vaults are unlocked
        if (this.unlockedVaults === 4) {
            setTimeout(() => {
                this.playSFX('success');
                this.playSFX('meow');
                this.createSparkles(vaultContent);
                setTimeout(() => {
                    this.showFinalScene();
                }, 2000);
            }, 1500);
        }
    }

    generateGalleryContent() {
        const kittyImages = [
            { emoji: '🐱', color: '#ffafcc', desc: 'Hello Kitty being adorable' },
            { emoji: '🎀', color: '#ff6b8b', desc: 'Pink bow collection' },
            { emoji: '✨', color: '#ffcc00', desc: 'Magical sparkles' },
            { emoji: '🍬', color: '#cdb4db', desc: 'Sweet treats for you' },
            { emoji: '🧶', color: '#a2d2ff', desc: 'Yarn ball of love' },
            { emoji: '🌙', color: '#b5ead7', desc: 'Dreamy moonlit nights' }
        ];

        return `
            <h3 style="color: var(--color-kitty-red); margin-bottom: 0.5rem; text-align: center; font-family: var(--font-heading);">Our Kitty Gallery 🖼️</h3>
            <div class="gallery-grid" style="
                display: grid;
                grid-template-columns: 1fr;
                gap: 1.5rem;
                margin: 2rem 0;
            ">
                ${kittyImages.map((img, i) => `
                    <div style="
                        background: ${img.color}20;
                        border: 3px solid ${img.color};
                        border-radius: 15px;
                        padding: 1.5rem;
                        text-align: center;
                        animation: popIn 0.5s ease ${i * 0.1}s backwards;
                        transition: transform 0.3s ease;
                        cursor: pointer;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${img.emoji}</div>
                        <p style="color: var(--color-kitty-purple-dark); font-size: 0.9rem; margin: 0;">${img.desc}</p>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 2rem; text-align: center; font-style: italic; color: var(--color-kitty-purple);">
                Every moment with you, ${this.userName}, is a picture worth framing. 📸💖
            </p>
        `;
    }

    generateMemoriesContent() {
        // Get some random memorable answers
        const memories = this.userAnswers
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

        return `
            <h3 style="color: var(--color-kitty-red); margin-bottom: 2rem; text-align: center; font-family: var(--font-heading);">Sweet Memories 📝</h3>
            <div style="max-height: 300px; overflow-y: auto; padding-right: 1rem;">
                ${memories.map((answer, i) => `
                    <div style="
                        background: rgba(255, 255, 255, 0.9);
                        padding: 1.5rem;
                        margin: 1rem 0;
                        border-radius: 15px;
                        border-left: 5px solid var(--color-kitty-pink);
                        animation: slideInLeft 0.5s ease ${i * 0.1}s backwards;
                    ">
                        <p style="color: var(--color-kitty-purple-dark); margin-bottom: 0.8rem;">
                            <strong>Q:</strong> ${answer.question}
                        </p>
                        <p style="color: var(--color-kitty-pink-dark); display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-heart" style="color: var(--color-kitty-red);"></i>
                            <strong>Your answer:</strong> ${answer.answer}
                        </p>
                        <div style="display: flex; gap: 5px; margin-top: 0.8rem;">
                            ${answer.emotions.map(emotion =>
            `<span style="background: var(--color-kitty-peach-light); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: var(--color-kitty-purple-dark);">
                                    ${emotion.type}+${emotion.value}
                                </span>`
        ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 2rem; text-align: center; font-style: italic; color: var(--color-kitty-purple);">
                These memories made this journey special, ${this.userName}. Thank you for sharing them with me. 🐾
            </p>
        `;
    }

    generateLettersContent() {
        const letterType = this.selectedLetter || 'kitty';
        const letterData = this.gameData.results.letters.find(l => l.type === letterType);

        return `
            <h3 style="color: var(--color-kitty-red); margin-bottom: 1.5rem; text-align: center; font-family: var(--font-heading);">
                Your Chosen Letter 💌
                <div style="font-size: 2rem; margin-top: 0.5rem;">${letterData.emoji}</div>
            </h3>
            <div style="margin: 1.5rem 0;">
                <h4 style="color: var(--color-kitty-pink-dark); margin-bottom: 1.5rem; text-align: center; font-family: var(--font-cute);">
                    ${letterData.title}
                </h4>
                <div style="
                    background: rgba(255, 255, 255, 0.9);
                    padding: 2rem;
                    border-radius: 15px;
                    border: 2px dashed var(--color-kitty-pink);
                    margin-bottom: 2rem;
                ">
                    <p style="font-style: italic; color: var(--color-kitty-purple); line-height: 1.8; font-size: 1.1rem;">
                        ${this.generateFullLetter(letterType)}
                    </p>
                </div>
            </div>
            <div style="
                margin-top: 2rem;
                text-align: right;
                border-top: 3px solid var(--color-kitty-pink-light);
                padding-top: 1.5rem;
                position: relative;
            ">
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: white; padding: 0 1rem;">
                    <i class="fas fa-paw" style="color: var(--color-kitty-pink);"></i>
                </div>
                <p style="font-style: italic; color: var(--color-kitty-purple); margin-bottom: 0.5rem;">
                    With all my love and whiskers,
                </p>
                <p style="font-family: var(--font-cute); font-size: 2rem; color: var(--color-kitty-red);">
                    Your Secret Kitty Admirer 🐱💝
                </p>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem;">
                    <i class="fas fa-paw" style="color: var(--color-kitty-pink);"></i>
                    <i class="fas fa-heart" style="color: var(--color-kitty-red);"></i>
                    <i class="fas fa-star" style="color: var(--color-kitty-blue);"></i>
                </div>
            </div>
        `;
    }

    generateSurpriseContent() {
        // Determine dominant emotion
        const emotions = Object.entries(this.emotionalProfile);
        emotions.sort((a, b) => b[1] - a[1]);
        const dominantEmotion = emotions[0][0];

        const emotionDescriptions = {
            romantic: "a hopeless romantic who believes in fairy tales 💕",
            playful: "a playful spirit who brings joy everywhere 😄",
            teasing: "a charming teaser with witty banter 😏",
            emotional: "an emotional soul with depth and feeling 🥺",
            fantasy: "a dreamer who sees magic everywhere ✨",
            kitty: "a certified cat lover extraordinaire! 🐱👑"
        };

        const totalScore = Object.values(this.emotionalProfile).reduce((a, b) => a + b, 0);
        const maxPossible = 150; // Approximate max score
        const percentage = Math.round((totalScore / maxPossible) * 100);

        return `
            <h3 style="color: var(--color-kitty-red); margin-bottom: 2rem; text-align: center; font-family: var(--font-heading);">
                Special Surprise! 🎁✨
            </h3>
            <div style="text-align: center; padding: 1rem;">
                <div style="
                    font-size: 5rem;
                    margin: 1rem 0;
                    animation: bounce 2s infinite;
                    filter: drop-shadow(0 5px 10px rgba(255, 204, 0, 0.3));
                ">
                    🏆
                </div>
                
                <p style="font-size: 1.5rem; color: var(--color-kitty-purple-dark); margin-bottom: 1.5rem; font-family: var(--font-cute);">
                    Congratulations, ${this.userName}! 🎉
                </p>
                
                <div style="
                    background: linear-gradient(45deg, #fffacd, #ffebcd);
                    padding: 1.5rem;
                    border-radius: 15px;
                    border: 3px solid gold;
                    margin: 1.5rem 0;
                    text-align: left;
                ">
                    <p style="margin-bottom: 1rem; color: var(--color-kitty-purple-dark);">
                        <strong>🎯 Your Love Profile:</strong>
                    </p>
                    <p style="color: var(--color-kitty-purple); font-style: italic; margin-bottom: 1.5rem;">
                        You are ${emotionDescriptions[dominantEmotion]}
                    </p>
                    
                    <div style="margin: 1.5rem 0;">
                        <p style="color: var(--color-kitty-purple-dark); margin-bottom: 0.8rem;">
                            <strong>❤️ Your Love Score:</strong> ${totalScore} points (${percentage}% purr-fect!)
                        </p>
                        <div style="
                            width: 100%;
                            height: 20px;
                            background: rgba(255, 255, 255, 0.5);
                            border-radius: 10px;
                            overflow: hidden;
                            margin: 1rem 0;
                        ">
                            <div style="
                                width: ${percentage}%;
                                height: 100%;
                                background: var(--gradient-kitty);
                                border-radius: 10px;
                                transition: width 1s ease;
                            "></div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-top: 1.5rem;">
                        ${Object.entries(this.emotionalProfile).map(([emotion, value]) => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 0.5rem 1rem;
                                background: ${value > 15 ? 'rgba(255, 175, 204, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
                                border-radius: 8px;
                                border-left: 4px solid ${value > 15 ? 'var(--color-kitty-red)' : 'var(--color-kitty-pink)'};
                            ">
                                <span style="color: var(--color-kitty-purple-dark); font-weight: ${value > 15 ? 'bold' : 'normal'}">
                                    ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}:
                                </span>
                                <span style="color: var(--color-kitty-red); font-weight: bold; font-size: 1.1rem;">
                                    ${value} ${value > 15 ? '🌟' : '⭐'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="
                    background: rgba(255, 255, 255, 0.9);
                    padding: 1.5rem;
                    border-radius: 15px;
                    border: 2px dotted var(--color-kitty-blue);
                    margin-top: 1.5rem;
                ">
                    <p style="color: var(--color-kitty-purple-dark); font-style: italic; text-align: center;">
                        "This Valentine's, may you find someone who appreciates every meow-ment with you.<br>
                        Someone who sees the magic in your smile and the sparkle in your eyes.<br>
                        Until then, know that in this corner of the internet,<br>
                        <strong>you made a kitty's heart very happy.</strong> 🐱💖"
                    </p>
                </div>
                
                <div style="margin-top: 2rem; font-size: 3rem; color: var(--color-kitty-red);">
                    🐾 THE END 🐾
                </div>
            </div>
        `;
    }

    generateFullLetter(type) {
        const letterTemplates = {
            romantic: `My dearest ${this.userName}, from the moment we began this journey, I knew there was something special about you. Your heart speaks in whispers that echo through my thoughts, and every answer you gave only confirmed what I felt - that you are someone worth cherishing. In a world full of ordinary moments, you make everything extraordinary.`,
            playful: `Hey ${this.userName}! So here's the thing - you're absolutely amazing. Like, seriously. Your playful spirit and quick wit have made this whole experience unforgettable. I hope we can keep this energy going! Life's too short to be serious all the time, right? Let's keep the fun going!`,
            teasing: `Alright ${this.userName}, I have to admit - you've been driving me crazy (in the best way possible). Your clever answers and that subtle confidence? Absolutely lethal. Consider yourself officially the highlight of my Valentine's season. You're trouble, and I'm here for it!`,
            emotional: `${this.userName}, there are moments that stay with you forever, and every interaction we've had is now etched in my memory. Your sincerity and depth have touched me more than you could ever know. Thank you for being authentically, beautifully you.`,
            fantasy: `In a realm of starlight and whispered dreams, I found you, ${this.userName}. Not in a castle of crystal or a forest of silver, but right here in this moment - and that feels like the most magical discovery of all. You're the fairy tale I didn't know I was waiting for.`,
            kitty: `Dear ${this.userName}, you're the cat's pajamas! The bee's knees! The purr-fect human! Seriously though, your love for kitties just proves how awesome you are. Anyone who appreciates the finer things in life (like cat naps and yarn balls) is automatically amazing in my book. Stay pawsome!`
        };

        return letterTemplates[type] || `Dear ${this.userName}, thank you for sharing this wonderful journey with me. You're truly special.`;
    }

    showFinalScene() {
        // Generate final letter
        const finalLetter = document.getElementById('final-letter');
        finalLetter.innerHTML = `
            <h2>For My Favorite Human, ${this.userName}... 💝</h2>
            ${this.generateFinalLetter()}
            <div class="signature">
                <p>With all my love, cuddles, and purrs,</p>
                <p class="signature-name">Your Secret Kitty Admirer 🐱💖</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 1rem; font-size: 1.5rem;">
                    <i class="fas fa-paw" style="color: var(--color-kitty-pink);"></i>
                    <i class="fas fa-heart" style="color: var(--color-kitty-red);"></i>
                    <i class="fas fa-star" style="color: var(--color-kitty-blue);"></i>
                    <i class="fas fa-cat" style="color: var(--color-kitty-purple);"></i>
                    <i class="fas fa-paw" style="color: var(--color-kitty-pink);"></i>
                </div>
            </div>
        `;

        this.switchScene('final-screen');
        this.playSFX('success');
        this.playSFX('purr');

        // Create celebration particles
        this.createCelebrationParticles();
    }

    generateFinalLetter() {
        // Get dominant emotion
        const emotions = Object.entries(this.emotionalProfile);
        emotions.sort((a, b) => b[1] - a[1]);
        const dominantEmotion = emotions[0][0];

        // Get a random memorable answer
        const randomAnswer = this.userAnswers.length > 0
            ? this.userAnswers[Math.floor(Math.random() * this.userAnswers.length)].answer
            : "something absolutely wonderful";

        // Get user's name for personalized message
        const name = this.userName;

        const paragraphs = [
            `From the moment you clicked "start" on this little adventure, I knew there was something special about you, ${name}. The way you answered each question, with that unique ${dominantEmotion} energy... it's been lighting up this digital space like a constellation of fireflies. ✨`,

            `Remember when you said "${randomAnswer}"? That's when I realized you weren't just playing a game - you were sharing pieces of your wonderful self, and each piece has been more delightful than the last. Like finding the perfect sunbeam for a nap. 🐱☀️`,

            `This Valentine's Day, I don't just want to give you virtual flowers or digital chocolates (though you definitely deserve both, and maybe some cat treats too!). I want to give you moments that make your heart do that funny little flip, memories that linger like the scent of fresh cookies, and the absolute certainty that you are worth celebrating every single day. 🍪💖`,

            `So here's my confession: If you were a library book, I'd never return you because you're the only story I want to keep reading. If you were a cat video, you'd break the internet with cuteness. If you were a sunbeam, I'd nap in you all day. 😻📚🌞`,

            `No matter where life takes you, know that today, in this corner of the internet, you made someone believe in magic again. You reminded me that connections can spark anywhere - even in lines of code, carefully crafted questions, and shared smiles. The world needs more people like you. 🌍💫`,

            `Thank you, ${name}, for being the wonderful, amazing, spectacular person you are. May your days be filled with the same joy, warmth, and sparkle you've brought to this little digital adventure. And may you always find the perfect sunbeam for your naps. 🥰🐾`
        ];

        return paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    createCelebrationParticles() {
        const container = document.querySelector('.final-container');
        if (!container) return;

        const emojis = ['🎉', '✨', '🌟', '💖', '🐱', '🎀', '🥳', '😻', '💫', '🧨'];

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];

            particle.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                font-size: ${Math.random() * 30 + 20}px;
                opacity: 0;
                pointer-events: none;
                z-index: 100;
                animation: popIn 0.5s ease ${i * 0.1}s forwards,
                           float ${Math.random() * 3 + 2}s ease-in-out ${i * 0.1}s infinite;
            `;

            container.appendChild(particle);
        }
    }

    giveVirtualTreat() {
        this.playSFX('meow');
        this.playSFX('purr');

        // Create treat animation
        const treat = document.createElement('div');
        treat.innerHTML = '🍪';
        treat.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: 80px;
            transform: translate(-50%, -50%) scale(0);
            z-index: 10000;
            animation: popIn 0.3s ease forwards,
                       treatFloat 2s ease-in-out 0.3s forwards;
            pointer-events: none;
        `;

        document.body.appendChild(treat);

        // Create message
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 2rem 3rem;
                border-radius: 20px;
                border: 5px solid #ffcc00;
                z-index: 10001;
                text-align: center;
                animation: popIn 0.5s ease;
                box-shadow: 0 20px 60px rgba(255, 204, 0, 0.4);
            ">
                <h3 style="font-size: 2.5rem; color: #ff9966; margin-bottom: 1rem;">YUM! 🍪</h3>
                <p style="font-size: 1.5rem; color: var(--color-kitty-purple-dark);">
                    ${this.userName}, you deserve all the treats in the world!<br>
                    Here's a virtual cookie just for you! 😋
                </p>
                <p style="font-size: 1.2rem; color: var(--color-kitty-purple); margin-top: 1rem; font-style: italic;">
                    *nom nom nom* Delicious! 🐱
                </p>
            </div>
        `;

        document.body.appendChild(message);

        // Remove after animation
        setTimeout(() => {
            treat.remove();
            message.remove();
        }, 3000);
    }

    switchScene(sceneId) {
        // Hide current scene
        const currentScene = document.querySelector('.game-scene.active');
        if (currentScene) {
            currentScene.classList.remove('active');
            this.playSFX('transition');
        }

        // Show new scene
        setTimeout(() => {
            const newScene = document.getElementById(sceneId);
            if (newScene) {
                newScene.classList.add('active');
                this.currentScene = sceneId;

                // Scroll to top
                window.scrollTo(0, 0);

                // Update cursor
                if (this.catCursor) {
                    this.catCursor.style.display = 'block';
                }
            }
        }, 500);
    }

    restartGame() {
        // Clear loading intervals
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        if (this.skipButtonTimeout) {
            clearTimeout(this.skipButtonTimeout);
        }

        // Reset game state but keep name
        const savedName = localStorage.getItem('kittyValentineName');
        if (savedName) {
            document.getElementById('user-name').value = savedName;
            this.userName = savedName;
        }

        this.userAnswers = [];
        this.emotionalProfile = {
            romantic: 0,
            playful: 0,
            teasing: 0,
            emotional: 0,
            fantasy: 0,
            kitty: 0
        };
        this.currentQuestionIndex = 0;
        this.unlockedVaults = 0;
        this.selectedLetter = '';
        this.villainClickCount = 0;
        this.selectedOptionIndex = null;
        this.hasForcedYes = false;
        this.isLoadingSkipped = false;

        // Reset proposal buttons
        const noButton = document.getElementById('no-button');
        if (noButton) {
            noButton.innerHTML = `<i class="fas fa-cat"></i><span>Maybe later? 🙀</span><i class="fas fa-question"></i>`;
            noButton.style.cssText = '';
            noButton.classList.remove('villain-escape');
        }

        const yesButton = document.getElementById('yes-button');
        if (yesButton) {
            yesButton.innerHTML = `<i class="fas fa-heart"></i><span>YES! Absolutely! 😻</span><i class="fas fa-star"></i>`;
            yesButton.style.cssText = '';
            yesButton.style.animation = 'heartbeat 1.5s infinite, glow 2s infinite alternate';
        }

        // Clear effects
        const effects = document.getElementById('proposal-effects');
        if (effects) {
            effects.innerHTML = '';
        }

        // Hide skip button
        const skipButton = document.getElementById('skip-loading');
        if (skipButton) {
            skipButton.style.display = 'none';
        }

        // Reset vault
        const vaultIcons = document.querySelectorAll('.vault-icon');
        vaultIcons.forEach(icon => {
            icon.classList.remove('unlocked');
        });

        // Go back to loading screen
        this.switchScene('loading-screen');
        setTimeout(() => {
            this.startLoadingSequence();
        }, 1000);
    }

    shareGame() {
        this.playSFX('click');
        this.playSFX('meow');

        const shareText = `I just experienced the most adorable Hello Kitty Valentine's game! 😻💖 Try it and see if it makes you smile! 🐱✨`;
        const shareUrl = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: 'Hello Kitty Valentine Adventure 🐱💖',
                text: shareText,
                url: shareUrl
            }).catch(err => {
                console.log('Share failed:', err);
                this.copyToClipboard(shareText, shareUrl);
            });
        } else {
            this.copyToClipboard(shareText, shareUrl);
        }
    }

    copyToClipboard(text, url) {
        const fullText = `${text}\n\n${url}`;

        // Create a more fun message
        const successMessage = `Link copied to clipboard! 🐱📋\n\nShare this cuteness with someone who deserves a smile! 💖\n\nP.S. You're amazing! ✨`;

        navigator.clipboard.writeText(fullText).then(() => {
            alert(successMessage);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = fullText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert(successMessage);
        });
    }

    getFallbackData() {
        return {
            loading: {
                quotes: [
                    "Baking heart-shaped cookies... 🍪💖",
                    "Training kittens to deliver love letters... 📮🐱",
                    "Polishing Hello Kitty's bow... 🎀✨",
                    "Warming up the purr engine... 🐾💨",
                    "Sprinkling magical kitty dust... ✨🐈",
                    "Untangling balls of yarn... 🧶😅",
                    "Teaching cats to dance... 💃🐱🕺",
                    "Filling treat bags with love... 🍬💝",
                    "Testing the cuteness meter... 😻📊",
                    "Charging the hug batteries... 🔋🤗",
                    "Organizing a cuddle puddle... 🐱🐱🐱",
                    "Programming the meow-sic... 🎵🐱",
                    "Inflating heart balloons... 🎈❤️",
                    "Brewing friendship tea... ☕️🐾",
                    "Knitting cozy memories... 🧣💭",
                    "Counting falling stars... 🌠🔢",
                    "Planting smile seeds... 🌱😊",
                    "Wrapping virtual hugs... 🎁🤗",
                    "Calibrating the giggle detector... 😄📡",
                    "Finalizing the purr-fect experience... 🐱✅"
                ]
            },
            questions: [
                {
                    question: "If I were a kitten knocking things off your table, you'd:",
                    category: "Kitty Scenarios 🐱",
                    imageEmoji: "🐈",
                    flirtyQuote: "Asking for a friend who might want to cause cute chaos...",
                    options: [
                        {
                            text: "Film it for TikTok immediately",
                            emoji: "📱",
                            reaction: "A content creator! I like your style! 😹",
                            emojis: ["🎬", "🌟", "💫"],
                            emotions: [
                                { type: "playful", value: 4 },
                                { type: "kitty", value: 3 }
                            ]
                        },
                        {
                            text: "Say 'Aww' and pet me anyway",
                            emoji: "🥺",
                            reaction: "So forgiving! You'd spoil any kitty rotten!",
                            emojis: ["💖", "🐾", "✨"],
                            emotions: [
                                { type: "romantic", value: 3 },
                                { type: "emotional", value: 2 }
                            ]
                        },
                        {
                            text: "Put everything in safety cabinets",
                            emoji: "🔒",
                            reaction: "Practical and prepared! Smart human!",
                            emojis: ["🧠", "⚡", "🎯"],
                            emotions: [
                                { type: "teasing", value: 2 },
                                { type: "playful", value: 1 }
                            ]
                        },
                        {
                            text: "Join me and knock stuff off too",
                            emoji: "😼",
                            reaction: "PARTNER IN CRIME! Let's cause chaos together!",
                            emojis: ["👯", "💥", "🎉"],
                            emotions: [
                                { type: "playful", value: 5 },
                                { type: "kitty", value: 4 }
                            ]
                        }
                    ]
                }
            ],
            results: {
                letters: [
                    {
                        type: "romantic",
                        title: "Purr-fectly Romantic 💕",
                        description: "Heartfelt confessions with extra cuddles",
                        emoji: "💝"
                    },
                    {
                        type: "playful",
                        title: "Playfully Paw-some 😹",
                        description: "Fun and games with your favorite kitty",
                        emoji: "🎮"
                    },
                    {
                        type: "teasing",
                        title: "Cheeky Kitty 😼",
                        description: "Witty banter with a side of catitude",
                        emoji: "😏"
                    },
                    {
                        type: "emotional",
                        title: "Heartfelt Meows 🥺",
                        description: "Deep feelings from the bottom of my furry heart",
                        emoji: "💌"
                    },
                    {
                        type: "fantasy",
                        title: "Magical Kitty Realm ✨",
                        description: "Dreamy adventures in kitty wonderland",
                        emoji: "🌈"
                    },
                    {
                        type: "kitty",
                        title: "Ultimate Cat Lover 🐱👑",
                        description: "For those who speak fluent purr",
                        emoji: "👑"
                    }
                ]
            }
        };
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add custom animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparklePop {
            0% {
                transform: scale(0) rotate(0deg);
                opacity: 0;
            }
            50% {
                transform: scale(1.2) rotate(180deg);
                opacity: 1;
            }
            100% {
                transform: scale(1) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes treatFloat {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -150%) scale(0);
                opacity: 0;
            }
        }
        
        @keyframes popIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            80% {
                transform: scale(1.1);
                opacity: 1;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Start the game
    window.kittyGame = new HelloKittyGame();

    // Load saved name if exists
    const savedName = localStorage.getItem('kittyValentineName');
    if (savedName) {
        document.getElementById('user-name').value = savedName;
    }

    // Add click handler for audio autoplay
    document.body.addEventListener('click', () => {
        const bgm = document.getElementById('background-music');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.log('🎵 Autoplay still blocked'));
        }
    }, { once: true });

    // Add Easter egg - multiple clicks on title
    let titleClicks = 0;
    const title = document.querySelector('.game-title');
    if (title) {
        title.addEventListener('click', () => {
            titleClicks++;
            if (titleClicks >= 5) {
                title.textContent = "🐱 SECRET KITTY MODE ACTIVATED! 😼";
                title.style.animation = 'glow 0.5s infinite alternate';
                setTimeout(() => {
                    title.textContent = "🐱 Hello Kitty Valentine Adventure 💖";
                    title.style.animation = '';
                }, 2000);
                titleClicks = 0;
            }
        });
    }
});