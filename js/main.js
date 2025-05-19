class BreathingApp {
    constructor() {
        // 配置参数
        this.config = {
            inhaleTime: 4000,     // 吸气时间（4秒）
            holdTime: 7000,       // 屏息时间（7秒）
            exhaleTime: 8000,     // 呼气时间（8秒）
            totalDuration: 5 * 60 * 1000,  // 默认总时长（5分钟）
            reminderInterval: 120 * 60 * 1000,  // 提醒间隔（毫秒）
            defaultBgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80'  // 默认背景图片
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
            bgAudio: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1193.mp3'),
            defaultSound: 'waves',  // 设置默认音效
            lastReminderTime: 0,
            voiceEnabled: true  // 默认开启语音提示
        };

        this.init();
    }

    init() {
        // 初始化进度环
        const radius = this.elements.progressRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        this.elements.progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.elements.progressRing.style.strokeDashoffset = circumference;

        // 预加载背景图片
        const img = new Image();
        img.src = this.config.defaultBgImage;
        img.onload = () => {
            document.body.style.backgroundImage = `url(${this.config.defaultBgImage})`;
        };

        // 事件监听
        this.elements.startBtn.addEventListener('click', () => this.startBreathingCycle());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseBreathingCycle());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.durationSelect.addEventListener('change', (e) => this.handleDurationChange(e));
        this.elements.reminderInterval.addEventListener('change', (e) => this.handleReminderIntervalChange(e));
        this.elements.ttsToggle.addEventListener('change', (e) => this.handleTtsToggle(e));
        this.elements.bgSoundSelect.addEventListener('change', (e) => this.handleBgSoundChange(e));
        this.elements.bgImageUpload.addEventListener('change', (e) => this.handleBgImageUpload(e));
        this.elements.removeBgImage.addEventListener('click', () => this.removeBgImage());
        this.elements.reminderClose.addEventListener('click', () => this.closeReminder());

        // 初始化背景音乐
        this.state.bgAudio.loop = true;
        this.state.bgAudio.volume = 0.5;
    }

    startBreathingCycle() {
        if (this.state.isRunning) return;
        
        this.state.isRunning = true;
        this.state.startTime = Date.now();
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        
        // 开始播放背景音乐
        this.state.bgAudio.play().catch(() => {
            // 如果自动播放被阻止，添加点击事件监听器
            document.addEventListener('click', () => {
                this.state.bgAudio.play();
            }, { once: true });
        });

        this.cycle();
    }

    cycle() {
        if (!this.state.isRunning) return;

        const now = Date.now();
        const elapsed = now - this.state.startTime;
        
        if (elapsed >= this.config.totalDuration) {
            this.complete();
            return;
        }

        // 计算当前呼吸阶段
        const cycleTime = this.config.inhaleTime + this.config.holdTime + this.config.exhaleTime;
        const cyclePosition = elapsed % cycleTime;

        if (cyclePosition < this.config.inhaleTime) {
            this.animateBreathingBall('inhale');
        } else if (cyclePosition < this.config.inhaleTime + this.config.holdTime) {
            this.animateBreathingBall('hold');
        } else {
            this.animateBreathingBall('exhale');
        }

        // 更新进度
        this.updateProgress(elapsed);

        requestAnimationFrame(() => this.cycle());
    }

    animateBreathingBall(phase) {
        if (this.state.currentPhase === phase) return;
        this.state.currentPhase = phase;

        const scale = phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 1;
        const text = phase === 'inhale' ? '吸气' : phase === 'hold' ? '屏息' : '呼气';
        
        this.elements.breathingBall.style.transform = `scale(${scale})`;
        this.elements.textContent.textContent = text;

        if (this.state.voiceEnabled) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            this.state.speechSynthesis.speak(utterance);
        }
    }

    updateProgress(elapsed) {
        const progress = (elapsed / this.config.totalDuration) * 100;
        const radius = this.elements.progressRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress / 100) * circumference;
        this.elements.progressRing.style.strokeDashoffset = offset;
    }

    pauseBreathingCycle() {
        this.state.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.state.bgAudio.pause();
    }

    reset() {
        this.state.isRunning = false;
        this.state.currentPhase = 'idle';
        this.state.startTime = null;
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.breathingBall.style.transform = 'scale(1)';
        this.elements.textContent.textContent = '准备开始';
        this.elements.progressRing.style.strokeDashoffset = this.elements.progressRing.r.baseVal.value * 2 * Math.PI;
        this.state.bgAudio.pause();
        this.state.bgAudio.currentTime = 0;
    }

    complete() {
        this.reset();
        if (this.state.voiceEnabled) {
            const utterance = new SpeechSynthesisUtterance('训练完成');
            utterance.lang = 'zh-CN';
            this.state.speechSynthesis.speak(utterance);
        }
    }

    openSettings() {
        this.elements.settingsModal.style.display = 'flex';
    }

    closeSettings() {
        this.elements.settingsModal.style.display = 'none';
    }

    handleDurationChange(e) {
        const value = e.target.value;
        if (value === 'custom') {
            this.elements.customDuration.style.display = 'block';
            return;
        }
        this.elements.customDuration.style.display = 'none';
        this.config.totalDuration = parseInt(value) * 60 * 1000;
        this.state.remainingTime = this.config.totalDuration;
    }

    handleReminderIntervalChange(e) {
        this.config.reminderInterval = parseInt(e.target.value) * 60 * 1000;
    }

    handleTtsToggle(e) {
        this.state.voiceEnabled = e.target.checked;
    }

    handleBgSoundChange(e) {
        const value = e.target.value;
        if (value === 'none') {
            this.state.bgAudio.pause();
            return;
        }
        this.state.bgAudio.src = value;
        if (this.state.isRunning) {
            this.state.bgAudio.play();
        }
    }

    handleBgImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.body.style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    }

    removeBgImage() {
        document.body.style.backgroundImage = `url(${this.config.defaultBgImage})`;
        this.elements.bgImageUpload.value = '';
    }

    closeReminder() {
        this.elements.reminderOverlay.style.display = 'none';
        this.state.lastReminderTime = Date.now();
        this.scheduleNextReminder();
    }

    scheduleNextReminder() {
        if (this.state.reminderTimer) {
            clearTimeout(this.state.reminderTimer);
        }
        this.state.reminderTimer = setTimeout(() => {
            this.elements.reminderOverlay.style.display = 'flex';
        }, this.config.reminderInterval);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
}); 