let mediaRecorder;
let audioChunks = [];

document.getElementById("startRecord").addEventListener("click", function() {
    // Requesting microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Clear previous recordings

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, {type: "audio/wav"});
            sendDataToServer(audioBlob);
        };

        mediaRecorder.start();
        document.getElementById("stopRecord").disabled = false;
    })
    .catch(error => {
        console.error("Error accessing microphone:", error);
        alert("Error accessing microphone. Please ensure you've granted access.");
    });
});

document.getElementById("stopRecord").addEventListener("click", function() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        document.getElementById("stopRecord").disabled = true;
    }
});

function sendDataToServer(blob) {
    const formData = new FormData();
    formData.append("audio", blob);

    fetch('http://localhost:5000/process_audio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Insert the transcribed text into the selected text field
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: insertTranscription,
                args: [data.transcription]
            });
        });
    })
    .catch(error => {
        console.error("Error accessing microphone:", error.name, "-", error.message);
        alert(`Error accessing microphone: ${error.name} - ${error.message}`);
    });
}

function insertTranscription(transcription) {
    document.activeElement.value = transcription;
}
