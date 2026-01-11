let timerInterval = null;
let timeLeft = 120;
let isRunning = false;
let completedCycles = 0;

// Load state when service worker starts
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
    
    // Resume timer if it was running
    if (isRunning && timeLeft > 0) {
        startTimer();
    }
});

function startTimer() {
    console.log('startTimer called, timerInterval:', timerInterval, 'timeLeft:', timeLeft);
    if (!timerInterval && timeLeft > 0) {
        isRunning = true;
        console.log('Actually starting timer');
        
        timerInterval = setInterval(() => {
            timeLeft--;
            console.log('Timer tick, timeLeft:', timeLeft);
            
            // Save current state
            chrome.storage.local.set({
                timeLeft: timeLeft,
                isRunning: isRunning,
                completedCycles: completedCycles
            });
            
            // Send update to popup if open
            chrome.runtime.sendMessage({
                action: 'timerTick',
                timeLeft: timeLeft
            }).catch(() => {
                // Popup might be closed, ignore error
            });
            
            if (timeLeft <= 0) {
                completeTimer();
            }
        }, 1000);
    }
}

function stopTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        
        // Save state
        chrome.storage.local.set({
            timeLeft: timeLeft,
            isRunning: isRunning,
            completedCycles: completedCycles
        });
        
        // Notify popup
        chrome.runtime.sendMessage({
            action: 'timerStopped',
            timeLeft: timeLeft
        }).catch(() => {
            // Popup might be closed, ignore error
        });
    }
}

function completeTimer() {
    completedCycles++;
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'GTD Timer',
        message: '✅ 2分経過！次のサイクルを開始'
    });
    
    // Auto-restart for next session
    timeLeft = 120;
    
    // Save state
    chrome.storage.local.set({
        timeLeft: timeLeft,
        isRunning: isRunning,
        completedCycles: completedCycles
    });
    
    // Notify popup
    chrome.runtime.sendMessage({
        action: 'timerComplete',
        completedCycles: completedCycles
    }).catch(() => {
        // Popup might be closed, ignore error
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    if (message.action === 'startTimer') {
        timeLeft = message.timeLeft;
        console.log('Starting timer with timeLeft:', timeLeft);
        startTimer();
    } else if (message.action === 'stopTimer') {
        console.log('Stopping timer');
        stopTimer();
    }
});

// Handle alarm for persistent timers (fallback)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'gtdTimer') {
        completeTimer();
    }
});