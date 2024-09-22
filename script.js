let mediaRecorder;
let audioChunks = [];
let audioContext;
let originalBlob;

// Start Recording
document.getElementById('record-button').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        originalBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const originalAudioURL = URL.createObjectURL(originalBlob);
        document.getElementById('original-audio').src = originalAudioURL;

        // Automatically process the audio after recording
        await enhanceAudio(originalBlob);
    };

    mediaRecorder.start();
    document.getElementById('record-button').disabled = true;
    document.getElementById('stop-button').disabled = false;
};

// Stop Recording
document.getElementById('stop-button').onclick = () => {
    mediaRecorder.stop();
    document.getElementById('record-button').disabled = false;
    document.getElementById('stop-button').disabled = true;
};

// Enhance Audio
async function enhanceAudio(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Apply a simple gain node to simulate enhancement (boost volume)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.5;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode).connect(audioContext.destination);

    // Create new enhanced audio from the buffer
    const enhancedAudioBlob = await bufferToBlob(audioBuffer);
    const enhancedAudioURL = URL.createObjectURL(enhancedAudioBlob);
    document.getElementById('enhanced-audio').src = enhancedAudioURL;

    // Enable the playback of enhanced audio
    document.getElementById('play-enhanced-button').disabled = false;
}

// Convert the enhanced audio buffer back to a blob
async function bufferToBlob(audioBuffer) {
    const numOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChannels * 2;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
            const sample = audioBuffer.getChannelData(channel)[i] * 0x7fff;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }

    const wavBlob = new Blob([view], { type: 'audio/wav' });
    return wavBlob;
}
