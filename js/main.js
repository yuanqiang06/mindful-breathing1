class BreathingApp {
    constructor() {
        // 配置参数
        this.config = {
            inhaleTime: 4000,     // 吸气时间（4秒）
            holdTime: 7000,       // 屏息时间（7秒）
            exhaleTime: 8000,     // 呼气时间（8秒）
            totalDuration: 5 * 60 * 1000,  // 默认总时长（5分钟）
            reminderInterval: 120 * 60 * 1000,  // 提醒间隔（毫秒）
            defaultBgImage: 'assets/images/default-bg.jpg'  // 默认背景图片
        };

        // DOM 元素
        this.elements = {
            breathingBall: document.querySelector('.breathing-ball'),
            breathingText: document.querySelector('.breathing-text'),
            textContent: document.querySelector('.text-content'),
            textHighlight: document.querySelector('.text-highlight'),
            progressRing: document.querySelector('.progress-ring__circle-progress'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettings: document.getElementById('closeSettings'),
            durationSelect: document.getElementById('durationSelect'),
            customDuration: document.getElementById('customDuration'),
            reminderInterval: document.getElementById('reminderInterval'),
            ttsToggle: document.getElementById('ttsToggle'),
            bgSoundSelect: document.getElementById('bgSoundSelect'),
            bgImageUpload: document.getElementById('bgImageUpload'),
            removeBgImage: document.getElementById('removeBgImage'),
            reminderOverlay: document.getElementById('reminderOverlay'),
            reminderClose: document.getElementById('reminderClose')
        };

        // 状态变量
        this.state = {
            isRunning: false,
            currentPhase: 'idle', // idle, inhale, hold, exhale
            startTime: null,
            remainingTime: this.config.totalDuration,
            reminderTimer: null,
            reminderTimeout: null,
            speechSynthesis: window.speechSynthesis,
            bgAudio: new Audio('sounds/waves.mp3'),
            defaultSound: 'waves',  // 设置默认音效
            lastReminderTime: 0,
            voiceEnabled: true  // 默认开启语音提示
        };

        // 初始化音频
        this.state.bgAudio.loop = true;
        this.state.bgAudio.volume = 0.5;

        // 初始化
        this.init();
    }

    init() {
        // 设置进度环
        const radius = this.elements.progressRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        this.elements.progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.elements.progressRing.style.strokeDashoffset = '0';

        // 设置语音提示默认开启
        this.elements.ttsToggle.checked = true;

        // 预加载背景图片
        const preloadImage = new Image();
        preloadImage.onload = () => {
            document.body.style.backgroundImage = `url(${this.config.defaultBgImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        };
        preloadImage.src = this.config.defaultBgImage;

        // 设置默认音效
        this.elements.bgSoundSelect.value = this.state.defaultSound;
        this.changeBackgroundSound(this.state.defaultSound);

        // 添加点击事件监听器以启用音频
        document.addEventListener('click', () => {
            if (this.state.bgAudio && this.state.isRunning) {
                this.state.bgAudio.play().catch(error => {
                    console.log('音频播放失败');
                });
            }
        }, { once: true });

        // 事件监听
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.reminderClose.addEventListener('click', () => this.closeReminder());
        
        // 设置变更监听
        this.elements.durationSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.elements.customDuration.style.display = 'block';
                this.config.totalDuration = parseInt(this.elements.customDuration.value) * 60 * 1000;
            } else {
                this.elements.customDuration.style.display = 'none';
                this.config.totalDuration = parseInt(e.target.value) * 60 * 1000;
            }
            this.reset();
        });

        this.elements.customDuration.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 30) {
                this.config.totalDuration = value * 60 * 1000;
                this.reset();
            }
        });

        this.elements.reminderInterval.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 30 && value <= 180) {
                this.config.reminderInterval = value * 60 * 1000;
                this.resetReminder();
            }
        });

        this.elements.ttsToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.speak('语音提示已启用');
            }
        });

        this.elements.bgSoundSelect.addEventListener('change', (e) => {
            this.changeBackgroundSound(e.target.value);
        });

        // 背景图片上传处理
        this.elements.bgImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        // 创建canvas进行图片压缩
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const MAX_WIDTH = 1920;
                        const MAX_HEIGHT = 1080;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                        document.body.style.backgroundImage = `url(${compressedImage})`;
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundPosition = 'center';
                        document.body.style.backgroundRepeat = 'no-repeat';
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // 移除背景图片
        this.elements.removeBgImage.addEventListener('click', () => {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            this.elements.bgImageUpload.value = '';
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            } else if (e.code === 'Escape') {
                this.pause();
            }
        });
    }

    start() {
        if (!this.state.isRunning) {
            this.state.isRunning = true;
            this.state.startTime = performance.now();
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            this.startBreathingCycle();
            this.startReminder();
            
            // 开始播放背景音乐
            this.state.bgAudio.currentTime = 0;
            const playPromise = this.state.bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('自动播放被阻止，请点击页面任意位置开始播放');
                    // 添加一次性点击事件监听器
                    document.addEventListener('click', () => {
                        this.state.bgAudio.play();
                    }, { once: true });
                });
            }
        }
    }

    pause() {
        if (this.state.isRunning) {
            this.state.isRunning = false;
            this.elements.startBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
            this.elements.breathingBall.classList.remove('inhale', 'hold', 'exhale');
            this.elements.textContent.textContent = '已暂停';
            this.stopReminder();
            // 暂停背景音乐
            if (this.state.bgAudio) {
                this.state.bgAudio.pause();
            }
        }
    }

    reset() {
        this.pause();
        this.state.remainingTime = this.config.totalDuration;
        this.updateProgress(1);
        this.elements.textContent.textContent = '准备开始';
        this.elements.breathingBall.classList.remove('inhale', 'hold', 'exhale');
        this.elements.breathingBall.style.transform = 'scale(1)';
        if (this.state.bgAudio) {
            this.state.bgAudio.pause();
            this.state.bgAudio.currentTime = 0;
        }
    }

    startBreathingCycle() {
        const cycle = () => {
            if (!this.state.isRunning) return;

            const startTime = performance.now();
            const totalCycleTime = this.config.inhaleTime + this.config.holdTime + this.config.exhaleTime;
            
            // 吸气阶段（4秒）
            this.state.currentPhase = 'inhale';
            this.elements.textContent.textContent = '吸气';
            this.animateBreathingBall('inhale');
            this.speak('请缓慢吸气');
            this.animateTextHighlight('吸气');

            setTimeout(() => {
                if (!this.state.isRunning) return;

                // 屏息阶段（7秒）
                this.state.currentPhase = 'hold';
                this.elements.textContent.textContent = '屏息';
                this.animateBreathingBall('hold');
                this.speak('屏息');
                this.animateTextHighlight('屏息');

                setTimeout(() => {
                    if (!this.state.isRunning) return;

                    // 呼气阶段（8秒）
                    this.state.currentPhase = 'exhale';
                    this.elements.textContent.textContent = '呼气';
                    this.animateBreathingBall('exhale');
                    this.speak('缓慢呼气');
                    this.animateTextHighlight('呼气');

                    setTimeout(() => {
                        if (!this.state.isRunning) return;
                        
                        // 检查总训练时间
                        const totalElapsed = performance.now() - this.state.startTime;
                        if (totalElapsed >= this.config.totalDuration) {
                            this.complete();
                            return;
                        }
                        
                        cycle();
                    }, this.config.exhaleTime);
                }, this.config.holdTime);
            }, this.config.inhaleTime);

            // 更新进度
            const updateProgressInterval = setInterval(() => {
                if (!this.state.isRunning) {
                    clearInterval(updateProgressInterval);
                    return;
                }
                const totalElapsed = performance.now() - this.state.startTime;
                const progress = Math.min(1, totalElapsed / this.config.totalDuration);
                this.updateProgress(progress);
            }, 16);
        };

        cycle();
    }

    animateBreathingBall(phase) {
        const ball = this.elements.breathingBall;
        // 移除所有动画类
        ball.classList.remove('inhale', 'hold', 'exhale');
        // 重置transform
        ball.style.transform = 'scale(1)';
        // 添加新的动画类
        requestAnimationFrame(() => {
            ball.classList.add(phase);
        });
    }

    animateTextHighlight(text) {
        const highlight = this.elements.textHighlight;
        highlight.style.width = '0';
        // 使用 requestAnimationFrame 实现逐字高亮效果
        let i = 0;
        const animate = () => {
            if (i < text.length) {
                highlight.style.width = `${(i + 1) * 100 / text.length}%`;
                i++;
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    updateProgress(progress) {
        const radius = this.elements.progressRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference * (1 - progress);
        this.elements.progressRing.style.strokeDashoffset = offset;
    }

    complete() {
        this.state.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.textContent.textContent = '训练完成';
        this.elements.breathingBall.classList.remove('inhale', 'hold', 'exhale');
        this.elements.breathingBall.style.transform = 'translate(-50%, -50%) scale(1)';
        this.speak('训练完成，辛苦了');
        this.stopReminder();
        if (this.state.bgAudio) {
            this.state.bgAudio.pause();
            this.state.bgAudio.currentTime = 0;
        }
    }

    speak(text) {
        if (this.elements.ttsToggle.checked && this.state.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            this.state.speechSynthesis.speak(utterance);
        }
    }

    startReminder() {
        this.stopReminder();
        this.state.reminderTimer = setInterval(() => {
            const now = performance.now();
            if (now - this.state.lastReminderTime >= this.config.reminderInterval) {
                this.showReminder();
                this.state.lastReminderTime = now;
            }
        }, 60000); // 每分钟检查一次
    }

    stopReminder() {
        if (this.state.reminderTimer) {
            clearInterval(this.state.reminderTimer);
            this.state.reminderTimer = null;
        }
        if (this.state.reminderTimeout) {
            clearTimeout(this.state.reminderTimeout);
            this.state.reminderTimeout = null;
        }
    }

    showReminder() {
        if (!document.hidden) {
            // 首次提醒：呼吸球轻微脉动
            this.elements.breathingBall.classList.add('pulse');
            this.speak('该休息一下了，让我们做一次深呼吸');
            
            // 3分钟后未响应：显示全屏遮罩
            this.state.reminderTimeout = setTimeout(() => {
                this.elements.reminderOverlay.classList.add('active');
            }, 3 * 60 * 1000);
            
            // 5分钟后未响应：自动暂停
            setTimeout(() => {
                if (this.state.isRunning) {
                    this.pause();
                }
            }, 5 * 60 * 1000);
        }
    }

    closeReminder() {
        this.elements.reminderOverlay.classList.remove('active');
        this.elements.breathingBall.classList.remove('pulse');
        if (this.state.reminderTimeout) {
            clearTimeout(this.state.reminderTimeout);
            this.state.reminderTimeout = null;
        }
    }

    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    changeBackgroundSound(sound) {
        if (this.state.bgAudio) {
            this.state.bgAudio.pause();
            this.state.bgAudio = null;
        }

        if (sound !== 'none') {
            this.state.bgAudio = new Audio(`sounds/${sound}.mp3`);
            this.state.bgAudio.loop = true;
            // 只有在训练运行时才播放
            if (this.state.isRunning) {
                this.state.bgAudio.play();
            }
        }
    }
}

// 添加动画关键帧
const style = document.createElement('style');
style.textContent = `
    @keyframes inhale {
        0% { transform: scale(1); }
        100% { transform: scale(1.5); }
    }

    @keyframes hold {
        0% { transform: scale(1.5); }
        50% { transform: scale(1.6); }
        100% { transform: scale(1.5); }
    }

    @keyframes exhale {
        0% { transform: scale(1.5); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
}); 