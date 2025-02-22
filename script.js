let playPauseButton = document.getElementById("playPause");
let isPlaying = false;
let atcPlayer;
let atcAudio = new Audio("https://s1-bos.liveatc.net/sbbr3_app?nocache=2025022215215419159"); // ATC do Galeão

// Inicializa a API do YouTube
function onYouTubeIframeAPIReady() {
    atcPlayer = new YT.Player('atcPlayer', { events: { 'onReady': onPlayerReady } });
}

// Quando o player estiver pronto, define o volume
function onPlayerReady(event) {
    event.target.setVolume(50);
}

// Play/Pause sincronizado
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
