let timeLeft = 120; // 2 minutes in seconds
let totalTime = 120;
let timerInterval = null;
let isRunning = false;
let completedCycles = 0;

const timerFill = document.getElementById('timerFill');
const digitalTimer = document.getElementById('digitalTimer');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const cycleIndicator = document.getElementById('cycleIndicator');

// Wait for DOM to load, then initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    document.getElementById('playPauseBtn').addEventListener('click', toggleTimer);
    document.getElementById('resetBtn').addEventListener('click', resetTimer);
    
    // Load state from storage when popup opens
    if (chrome && chrome.storage) {
        chrome.storage.local.get(['timeLeft', 'isRunning', 'completedCycles'], (result) => {
            if (result.timeLeft !== undefined) {
                timeLeft = result.timeLeft;
            }
            if (result.isRunning !== undefined) {
                isRunning = result.isRunning;
            }
            if (result.completedCycles !== undefined) {
                completedCycles = result.completedCycles;
            }
            
            updateDisplay();
            
            if (isRunning) {
                playPauseBtn.textContent = '⏸';
                playPauseBtn.classList.add('playing');
                // Timer will continue in background via service worker
            }
        });
    } else {
        // Fallback if Chrome APIs not available
        updateDisplay();
    }
});

function updateDisplay() {
    // Update digital timer
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    digitalTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update circular timer
    const progress = (totalTime - timeLeft) / totalTime;
    
    if (timeLeft === totalTime) {
        timerFill.style.background = '#ff4444';
    } else if (timeLeft === 0) {
        timerFill.style.background = 'transparent';
    } else {
        const progressDegrees = progress * 360;
        timerFill.style.background = `conic-gradient(from 0deg, transparent 0deg, transparent ${progressDegrees}deg, #ff4444 ${progressDegrees}deg, #ff4444 360deg)`;
    }

    // Update cycle indicator
    if (completedCycles > 0) {
        cycleIndicator.textContent = `🔄 ${completedCycles}`;
    } else {
        cycleIndicator.textContent = '';
    }
}

function toggleTimer() {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (!isRunning) {
        // Update UI immediately
        playPauseBtn.textContent = '⏸';
        playPauseBtn.classList.add('playing');
        
        // Notify background script to start timer
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'startTimer',
                timeLeft: timeLeft
            });
        }
        
        isRunning = true;
    }
}

function stopTimer() {
    if (isRunning) {
        isRunning = false;
        playPauseBtn.textContent = '▶';
        playPauseBtn.classList.remove('playing');
        
        // Notify background script to stop timer
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'stopTimer'
            });
        }
    }
}

function resetTimer() {
    stopTimer();
    timeLeft = totalTime;
    completedCycles = 0;
    updateDisplay();
    
    // Save state
    if (chrome && chrome.storage) {
        chrome.storage.local.set({
            timeLeft: timeLeft,
            isRunning: isRunning,
            completedCycles: completedCycles
        });
    }
}

// Listen for messages from background script
if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'timerTick') {
            timeLeft = message.timeLeft;
            updateDisplay();
        } else if (message.action === 'timerComplete') {
            completedCycles = message.completedCycles;
            timeLeft = totalTime;
            updateDisplay();
        } else if (message.action === 'timerStopped') {
            isRunning = false;
            playPauseBtn.textContent = '▶';
            playPauseBtn.classList.remove('playing');
            timeLeft = message.timeLeft;
            updateDisplay();
        }
    });
}