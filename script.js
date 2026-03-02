const canvas = document.getElementById('patternCanvas');
const ctx = canvas.getContext('2d');

// Elements
const categorySelectElem = document.getElementById('categorySelect');
const patternSelectElem = document.getElementById('patternSelect');
const colorHueElem = document.getElementById('colorHue');
const complexityElem = document.getElementById('complexity');
const speedElem = document.getElementById('speed');
const durationElem = document.getElementById('duration');

const hueValueElem = document.getElementById('hueValue');
const complexityValueElem = document.getElementById('complexityValue');
const speedValueElem = document.getElementById('speedValue');
const durationValueElem = document.getElementById('durationValue');

const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const secondaryPatternSelectElem = document.getElementById('secondaryPatternSelect');
const customBgUploadElem = document.getElementById('customBgUpload');

// State
let time = 0;
let animationFrameId;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingTimeout;
let recordingInterval;
let flatRegistryMap = {}; // Maps literal ID to object payload for O(1) draw lookup
let customBgImage = null;
let customBgVideo = null;

// Audio Context Globals
let audioCtx;
let gainNode;
let activeAudioNodes = [];

// Populate dropdown dynamically from patterns.js
function populateCategories() {
    categorySelectElem.innerHTML = '';

    // Fill first dropdown
    for (const categoryName of Object.keys(window.PATTERN_REGISTRY)) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categorySelectElem.appendChild(option);
    }

    // Listen for category change to update second dropdown
    categorySelectElem.addEventListener('change', populatePatterns);

    // Initial population of the second dropdown
    populatePatterns();
}

function populatePatterns() {
    patternSelectElem.innerHTML = '';
    const selectedCategory = categorySelectElem.value;
    const items = window.PATTERN_REGISTRY[selectedCategory];

    if (items) {
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            // Add index number to name for easier reading since they are massive lists now
            option.textContent = item.name;
            patternSelectElem.appendChild(option);

            // Store mapping for easy access in draw()
            flatRegistryMap[item.id] = item;
        });
    }

    // Reset time when changing patterns so loops start fresh
    time = 0;
}

function populateSecondaryPatterns() {
    secondaryPatternSelectElem.innerHTML = '<option value="none">None (Single Pattern)</option>';
    for (const [categoryName, items] of Object.entries(window.PATTERN_REGISTRY)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            optgroup.appendChild(option);
        });
        secondaryPatternSelectElem.appendChild(optgroup);
    }
}

populateCategories();
populateSecondaryPatterns();

customBgUploadElem.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        customBgImage = null;
        if (customBgVideo) { customBgVideo.pause(); }
        customBgVideo = null;
        return;
    }

    const fileURL = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
        if (customBgVideo) { customBgVideo.pause(); }
        customBgVideo = null;
        customBgImage = new Image();
        customBgImage.src = fileURL;
    } else if (file.type.startsWith('video/')) {
        customBgImage = null;
        customBgVideo = document.createElement('video');
        customBgVideo.src = fileURL;
        customBgVideo.muted = true;
        customBgVideo.loop = true;
        customBgVideo.play();
    }
});

// Update UI text values
function updateUIValues() {
    hueValueElem.textContent = colorHueElem.value;
    complexityValueElem.textContent = complexityElem.value;
    speedValueElem.textContent = speedElem.value;
    durationValueElem.textContent = durationElem.value;
}

const aspectRatioElem = document.getElementById('aspectRatio');
const resolutionScaleElem = document.getElementById('resolutionScale');
const frameRateElem = document.getElementById('frameRate');
const audioTrackElem = document.getElementById('audioTrack');

function updateAspectRatio() {
    const config = aspectRatioElem.value.split('|'); // e.g. "16:9|1920|1080"
    const ratioName = config[0];
    const newWidth = parseInt(config[1]);
    const newHeight = parseInt(config[2]);

    // Update raw native pixel canvas resolution
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Update CSS aspect ratio to match visual presentation natively
    const parts = ratioName.split(':');
    canvas.style.aspectRatio = `${parts[0]}/${parts[1]}`;

    // Reset canvas environment for seamless transition
    time = 0;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initial aspect ratio setup
updateAspectRatio();

aspectRatioElem.addEventListener('change', updateAspectRatio);

colorHueElem.addEventListener('input', updateUIValues);
complexityElem.addEventListener('input', updateUIValues);
speedElem.addEventListener('input', updateUIValues);
durationElem.addEventListener('input', updateUIValues);

function draw() {
    const type = patternSelectElem.value;
    const secondaryType = secondaryPatternSelectElem.value;
    const hue = parseInt(colorHueElem.value);
    const complexity = parseInt(complexityElem.value);
    const speed = parseInt(speedElem.value) / 1000;

    time += speed;

    // Draw Background
    if (customBgImage) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(customBgImage, 0, 0, canvas.width, canvas.height);
    } else if (customBgVideo && customBgVideo.readyState >= 2) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(customBgVideo, 0, 0, canvas.width, canvas.height);
    } else {
        // Create a slight fade effect to leave motion trails
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- DRAW PRIMARY PATTERN ---
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    const activePattern = flatRegistryMap[type];
    if (activePattern && activePattern.draw) {
        activePattern.draw(ctx, time, complexity, hue, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'white';
        ctx.font = '30px Outfit';
        ctx.fillText("Pattern not found", -100, 0);
    }
    ctx.restore();

    // --- DRAW SECONDARY OVERLAY PATTERN ---
    if (secondaryType !== 'none') {
        const secondaryPattern = flatRegistryMap[secondaryType];
        if (secondaryPattern && secondaryPattern.draw) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            // Blend mode to combine the two patterns beautifully
            ctx.globalCompositeOperation = 'screen';
            // Modulate variables slightly for secondary so it isn't identical
            secondaryPattern.draw(ctx, time * 0.8, complexity, (hue + 180) % 360, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    animationFrameId = requestAnimationFrame(draw);
}

// Start visual loop
draw();

// ==========================================
// Video Recording Logic using MediaRecorder
// ==========================================

recordBtn.addEventListener('click', () => {
    // Determine export quality overrides
    const resScale = parseFloat(resolutionScaleElem.value);
    const fps = parseInt(frameRateElem.value);

    // Apply strict rendering multiplier for the capture
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // Scale up the drawing context output specifically for recording
    canvas.width = Math.floor(originalWidth * resScale);
    canvas.height = Math.floor(originalHeight * resScale);

    // The visual CSS size remains the same (aspect-ratio driven), but the internal Canvas Pixel resolution skyrockets

    // Reset background and scale context proportionally for the new oversized canvas 
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Note: The draw() loop handles its own scaling logic naturally based on canvas.width/height, 
    // so it will dynamically draw everything in native 4k (if selected) without any extra logic!

    // Capture the stream at exactly the requested Framerate
    const canvasStream = canvas.captureStream(fps);

    // --- GENERATIVE AUDIO SYNTHESIS ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const audioStream = dest.stream;

    const trackType = audioTrackElem.value;
    activeAudioNodes = []; // Reset active nodes array for cleanup

    if (trackType !== 'none') {
        gainNode = audioCtx.createGain();
        gainNode.connect(dest);
        gainNode.gain.value = 0.0; // Start silent to avoid pop
        // Fade in gracefully
        gainNode.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.5);

        // Map visual Complexity (1-100) and Speed (1-100) to Audio Frequencies
        const visualComplexity = parseInt(complexityElem.value);
        const visualSpeed = parseInt(speedElem.value);

        if (trackType === 'drone') {
            // Original Deep Drone
            const mainOscillator = audioCtx.createOscillator();
            const lfoOscillator = audioCtx.createOscillator();

            mainOscillator.type = visualComplexity > 50 ? 'triangle' : 'sine';
            mainOscillator.frequency.value = 40 + visualComplexity;

            lfoOscillator.type = 'sine';
            lfoOscillator.frequency.value = (visualSpeed / 100) * 5;

            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 0.5;
            lfoOscillator.connect(lfoGain);
            lfoGain.connect(gainNode.gain);

            mainOscillator.connect(gainNode);
            mainOscillator.start();
            lfoOscillator.start();

            activeAudioNodes.push(mainOscillator, lfoOscillator);

        } else if (trackType === 'binaural') {
            // Deep Sleep Binaural Beats (Delta 1-4hz or Theta 4-8hz)
            const baseFreq = 100 + (visualComplexity * 0.5); // Low soothing tone
            const beatFreq = 2 + (visualSpeed / 100) * 6; // 2hz to 8hz difference for delta/theta

            const leftOsc = audioCtx.createOscillator();
            const rightOsc = audioCtx.createOscillator();

            leftOsc.type = 'sine';
            rightOsc.type = 'sine';
            leftOsc.frequency.value = baseFreq;
            rightOsc.frequency.value = baseFreq + beatFreq;

            // Pan hard left and hard right to create the binaural illusion in the brain
            const pannerLeft = audioCtx.createStereoPanner();
            const pannerRight = audioCtx.createStereoPanner();
            pannerLeft.pan.value = -1;
            pannerRight.pan.value = 1;

            // Soften the binaurals
            const binGain = audioCtx.createGain();
            binGain.gain.value = 0.6;

            leftOsc.connect(pannerLeft).connect(binGain).connect(gainNode);
            rightOsc.connect(pannerRight).connect(binGain).connect(gainNode);

            leftOsc.start();
            rightOsc.start();
            activeAudioNodes.push(leftOsc, rightOsc);

            // Add a very soft pink noise layer for background texture
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.05;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 400; // Muffle the noise into a soft rumble

            noiseSource.connect(lowpass).connect(gainNode);
            noiseSource.start();
            activeAudioNodes.push(noiseSource);

        } else if (trackType === 'youtube_sleep') {
            // Warm healing pads like classic YouTube sleep music
            // Uses a root note (e.g., A2), fifth, and octave for a very resonant, rich sound
            const rootFreq = 108 - (visualComplexity * 0.2); // Adjusts root faintly based on complexity
            const frequencies = [rootFreq, rootFreq * 1.5, rootFreq * 2, rootFreq * 2.5];

            frequencies.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                osc.type = i === 0 ? 'sine' : 'triangle'; // Root is sine, harmonics are triangle for warmth
                osc.frequency.value = freq;

                // Slow LFO for volume (breathing effect, 0.05 Hz)
                const volLfo = audioCtx.createOscillator();
                volLfo.type = 'sine';
                volLfo.frequency.value = 0.05 + (i * 0.01) + (visualSpeed / 1000); // Slightly out of phase

                const volLfoGain = audioCtx.createGain();
                volLfoGain.gain.value = 0.3;
                volLfo.connect(volLfoGain);

                const voiceGain = audioCtx.createGain();
                voiceGain.gain.value = 0.8 / frequencies.length;

                // Modulate the voice gain
                volLfoGain.connect(voiceGain.gain);

                // Slow panning
                const panner = audioCtx.createStereoPanner();
                const panLfo = audioCtx.createOscillator();
                panLfo.type = 'sine';
                panLfo.frequency.value = 0.02 + Math.random() * 0.02;
                const panGain = audioCtx.createGain();
                panGain.gain.value = 0.8;
                panLfo.connect(panGain).connect(panner.pan);

                // Lowpass filter to keep it dark and warm
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 300 + (visualComplexity * 2); // Opens up slightly with complexity

                osc.connect(voiceGain).connect(filter).connect(panner).connect(gainNode);

                osc.start();
                volLfo.start();
                panLfo.start();
                activeAudioNodes.push(osc, volLfo, panLfo);
            });

        } else if (trackType === 'brown') {
            // ASMR Brown Noise (Sounds like distant waterfalls or ocean waves)
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02; // Leaky integrator creates Brown Noise profile
                lastOut = output[i];
                output[i] *= 3.5; // Compensate volume
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            // Add a slow LFO filter to simulate breathing or ocean waves
            const biquadFilter = audioCtx.createBiquadFilter();
            biquadFilter.type = 'lowpass';
            biquadFilter.frequency.value = 400;

            const filterLFO = audioCtx.createOscillator();
            filterLFO.type = 'sine';
            filterLFO.frequency.value = 0.1 + (visualSpeed / 100) * 0.4; // Very slow wave

            const filterGain = audioCtx.createGain();
            filterGain.gain.value = 300; // Modulation depth

            filterLFO.connect(filterGain).connect(biquadFilter.frequency);
            noiseSource.connect(biquadFilter).connect(gainNode);

            noiseSource.start();
            filterLFO.start();
            activeAudioNodes.push(noiseSource, filterLFO);

        } else if (trackType === 'cosmos') {
            // Ethereal cosmic pads (stacked detuned sines creating a chorused angelic sound)
            const baseFreq = 200 - (visualComplexity);
            const numVoices = 5;
            for (let i = 0; i < numVoices; i++) {
                const osc = audioCtx.createOscillator();
                osc.type = i % 2 === 0 ? 'sine' : 'triangle';
                // Detune and spread
                osc.frequency.value = baseFreq * (i * 0.5 + 1) + (Math.random() * 4 - 2);

                // Slow panning for each voice
                const panner = audioCtx.createStereoPanner();
                const panLfo = audioCtx.createOscillator();
                panLfo.frequency.value = 0.05 + Math.random() * 0.1;

                const panLfoGain = audioCtx.createGain();
                panLfoGain.gain.value = 0.8;
                panLfo.connect(panLfoGain).connect(panner.pan);

                // Voice volume
                const vGain = audioCtx.createGain();
                vGain.gain.value = 1.0 / numVoices;

                osc.connect(panner).connect(vGain).connect(gainNode);

                osc.start();
                panLfo.start();
                activeAudioNodes.push(osc, panLfo);
            }
        }
    }

    // --- MERGE VIDEO AND AUDIO STREAMS ---
    const compositeStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);

    // Attempt to use high-quality VP9 codec with Opus Audio
    const options = { mimeType: 'video/webm; codecs=vp9,opus' };

    try {
        mediaRecorder = new MediaRecorder(compositeStream, options);
    } catch (e) {
        // Fallback to default WebM standard if vp9 is not supported by browser
        console.warn('VP9/Opus codec not supported, falling back to default webm.');
        mediaRecorder = new MediaRecorder(compositeStream, { mimeType: 'video/webm' });
    }

    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        // Revert canvas rendering size back to normal immediately to save PC resources
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Turn off Audio Synthesis
        if (gainNode) {
            // graceful fade out
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
            setTimeout(() => {
                activeAudioNodes.forEach(node => {
                    try { node.stop(); } catch (e) { }
                });
                if (audioCtx) audioCtx.close();
            }, 500);
        }

        // Compile captured chunks into a single Blob
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        recordedChunks = [];

        // Create an Object URL to download the video
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;

        // Current date in filename
        const datestring = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `PatternVideo_Res${resScale}x_${fps}fps_${datestring}.webm`;

        // Trigger download
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Reset UI
        isRecording = false;
        recordBtn.disabled = false;
        recordBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>
            Start Recording
        `;
        recordBtn.classList.remove('recording-active');
        stopBtn.disabled = true;
        recordingIndicator.classList.add('hidden');
    };

    // Start recording, chunking every 100ms
    mediaRecorder.start(100);
    isRecording = true;

    // Set UI to Recording State
    recordBtn.disabled = true;

    const durationSecs = parseInt(durationElem.value);

    if (durationSecs > 0) {
        let timeLeft = durationSecs;
        recordBtn.innerHTML = `Recording... (${timeLeft}s)`;
        recordingInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                recordBtn.innerHTML = `Recording... (${timeLeft}s)`;
            }
        }, 1000);

        recordingTimeout = setTimeout(() => {
            stopBtn.click();
        }, durationSecs * 1000);
    } else {
        recordBtn.innerHTML = `Recording...`;
    }

    recordBtn.classList.add('recording-active');
    stopBtn.disabled = false;
    recordingIndicator.classList.remove('hidden');
});

stopBtn.addEventListener('click', () => {
    if (isRecording && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        clearTimeout(recordingTimeout);
        // The file download runs asynchronously inside the onstop event
    }
});
