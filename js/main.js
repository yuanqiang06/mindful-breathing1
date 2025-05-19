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

    // ... existing code ...
} 