// Store active timers
let activeTimers = [];

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'startTimer':
      // Generate a unique ID for the timer
      const timerId = Date.now();

      // Create an alarm with the specified duration
      browser.alarms.create(`timer_${timerId}`, {
        delayInMinutes: message.duration,
        periodInMinutes: message.repeat ? message.duration : null
      });

      // Store timer details
      activeTimers.push({
        id: timerId,
        hours: message.hours,
        minutes: message.minutes,
        repeat: message.repeat,
        media: message.media || {}
      });
      break;

    case 'getActiveTimers':
      // Return list of active timers
      sendResponse(activeTimers);
      return true;

    case 'removeTimer':
      // Remove specific timer
      browser.alarms.clear(`timer_${message.timerId}`);

      // Remove from active timers list
      activeTimers = activeTimers.filter(timer => timer.id !== message.timerId);
      break;
  }
});

browser.alarms.onAlarm.addListener((alarm) => {
  // Extract timer ID from alarm name
  const timerId = parseInt(alarm.name.split('_')[1]);

  // Find the corresponding timer
  const timerIndex = activeTimers.findIndex(timer => timer.id === timerId);
  if (timerIndex !== -1) {
    const timer = activeTimers[timerIndex];

    // Prepare notification options
    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon-96.png',
      title: 'Timer Finished',
      message: 'Your timer has completed!'
    };

    // Add image to notification if available
    if (timer.media && timer.media.image) {
      notificationOptions.type = 'image';
      notificationOptions.imageUrl = timer.media.image;
    }

    // Create notification
    const notificationId = browser.notifications.create(notificationOptions);

    // Play audio if available
    if (timer.media && timer.media.audio) {
      const audio = new Audio(timer.media.audio);
      audio.play();
    }

    // Remove non-repeating timer
    if (!timer.repeat) {
      activeTimers.splice(timerIndex, 1);
    }
  }
});
