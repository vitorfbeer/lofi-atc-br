let playPauseButton = document.getElementById("playPause");
let isPlaying = false;
let atcPlayer;
let atcAudio = new Audio("https://s1-bos.liveatc.net/sbbr3_app?nocache=2025022215215419159"); // ATC do Galeão

// Inicializa a API do YouTube
function onYouTubeIframeAPIReady() {
    atcPlayer = new YT.Player('atcPlayer', { events: { 'onReady': onPlayerReady } });
}

// Quando o player estiver pronto, define o volume do YouTube
function onPlayerReady(event) {
    event.target.setVolume(50);
}

// Função para atualizar o volume do ATC
const atcVolumeControl = document.getElementById("atcVolume");
atcVolumeControl.addEventListener("input", (event) => {
    atcAudio.volume = event.target.value / 100;  // O valor do volume é de 0 a 1
});

// Função para atualizar o volume do Lo-Fi
const lofiVolumeControl = document.getElementById("lofiVolume");
lofiVolumeControl.addEventListener("input", (event) => {
    atcPlayer.setVolume(event.target.value);  // O volume do YouTube vai de 0 a 100
});

// Função Play/Pause sincronizada
playPauseButton.addEventListener("click", () => {
    if (!isPlaying) {
        atcPlayer.playVideo();
        atcAudio.play();
        playPauseButton.textContent = "⏸ Pause";
    } else {
        atcPlayer.pauseVideo();
        atcAudio.pause();
        playPauseButton.textContent = "▶ Play";
    }
    isPlaying = !isPlaying;
});
