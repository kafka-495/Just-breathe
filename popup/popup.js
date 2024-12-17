document.addEventListener('DOMContentLoaded', () => {
  const hoursInput = document.getElementById('hours');
  const minutesInput = document.getElementById('minutes');
  const repeatCheckbox = document.getElementById('repeat-timer');
  const startTimerButton = document.getElementById('start-timer');
  const confirmationDiv = document.getElementById('confirmation');
  const timerDurationSpan = document.getElementById('timer-duration');
  const nextReminderSpan = document.getElementById('next-reminder');
  const timerList = document.getElementById('timer-list');

  // Media upload elements
  const imageUpload = document.getElementById('image-upload');
  const audioUpload = document.getElementById('audio-upload');
  const imagePreview = document.getElementById('image-preview');
  const audioPreview = document.getElementById('audio-preview');

  let imageFile = null;
  let audioFile = null;

  // Prevent popup from closing when interacting with file inputs
  imageUpload.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  audioUpload.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  // Image upload preview
  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (e.g., limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large. Maximum size is 5MB.');
        imageUpload.value = ''; // Clear the input
        return;
      }

      imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Audio upload preview
  audioUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (e.g., limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Audio file is too large. Maximum size is 10MB.');
        audioUpload.value = ''; // Clear the input
        return;
      }

      audioFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        audioPreview.src = e.target.result;
        audioPreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Function to refresh active timers list
  function refreshActiveTimers() {
    browser.runtime.sendMessage({ action: 'getActiveTimers' }, (activeTimers) => {
      // Clear existing list
      timerList.innerHTML = '';

      // Populate active timers
      activeTimers.forEach((timer) => {
        const listItem = document.createElement('li');
        listItem.className = 'timer-item';

        const timerInfo = document.createElement('span');
        timerInfo.textContent = `${timer.hours} hrs ${timer.minutes} mins ${timer.repeat ? '(Repeating)' : ''}`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-timer';
        removeButton.addEventListener('click', () => {
          browser.runtime.sendMessage({
            action: 'removeTimer',
            timerId: timer.id
          });
          refreshActiveTimers();
        });

        listItem.appendChild(timerInfo);
        listItem.appendChild(removeButton);
        timerList.appendChild(listItem);
      });
    });
  }

  // Initial refresh of active timers
  refreshActiveTimers();

  startTimerButton.addEventListener('click', () => {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const repeat = repeatCheckbox.checked;

    if (hours === 0 && minutes === 0) {
      alert('Please set a timer duration');
      return;
    }

    const totalMinutes = hours * 60 + minutes;

    // Prepare media files
    const prepareMediaFiles = () => {
      return new Promise((resolve) => {
        const mediaData = {
          image: null,
          audio: null
        };

        let imageDone = !imageFile;
        let audioDone = !audioFile;

        if (imageFile) {
          const imageReader = new FileReader();
          imageReader.onload = (e) => {
            mediaData.image = e.target.result;
            imageDone = true;
            if (imageDone && audioDone) {
              resolve(mediaData);
            }
          };
          imageReader.readAsDataURL(imageFile);
        }

        if (audioFile) {
          const audioReader = new FileReader();
          audioReader.onload = (e) => {
            mediaData.audio = e.target.result;
            audioDone = true;
            if (imageDone && audioDone) {
              resolve(mediaData);
            }
          };
          audioReader.readAsDataURL(audioFile);
        }

        // If no media files, resolve immediately
        if (!imageFile && !audioFile) {
          resolve(mediaData);
        }
      });
    };

    // Prepare and send timer with media
    prepareMediaFiles().then((mediaData) => {
      // Send message to background script
      browser.runtime.sendMessage({
        action: 'startTimer',
        duration: totalMinutes,
        repeat: repeat,
        hours: hours,
        minutes: minutes,
        media: mediaData
      });

      // Update confirmation UI
      timerDurationSpan.textContent = `${hours} hours ${minutes} minutes`;

      const now = new Date();
      now.setMinutes(now.getMinutes() + totalMinutes);
      nextReminderSpan.textContent = now.toLocaleTimeString();

      confirmationDiv.classList.remove('hidden');

      // Refresh active timers list
      refreshActiveTimers();

      // Clear file inputs and previews
      imageUpload.value = '';
      audioUpload.value = '';
      imagePreview.src = '';
      audioPreview.src = '';
      imagePreview.classList.add('hidden');
      audioPreview.classList.add('hidden');
      imageFile = null;
      audioFile = null;
    });
  });
});
