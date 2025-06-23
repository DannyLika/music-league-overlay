console.log("✅ script.js loaded");

let player;
let currentIndex = 0;
let playlist = [];
let fromFilter = false;
let playlistFile = null;
let base64Data = null;

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('fromFilter')) {
    fromFilter = true;
}
if (urlParams.has('playlist')) {
    playlistFile = urlParams.get('playlist');
}
if (urlParams.has('base64')) {
    base64Data = urlParams.get('base64');
}

console.log("🔍 URL Params:", { base64Data, playlistFile, fromFilter });

document.addEventListener("DOMContentLoaded", function () {
    console.log("🌸 DOM ready");

    if (base64Data) {
        try {
            playlist = JSON.parse(atob(base64Data));
            console.log(`📦 Loaded base64 playlist with ${playlist.length} songs`);
            initializePlayer();
        } catch (error) {
            console.error("❌ Failed to parse base64 playlist:", error);
        }
    } else if (fromFilter) {
        const data = localStorage.getItem('filteredPlaylist');
        if (data) {
            try {
                playlist = JSON.parse(data);
                console.log(`📦 Loaded filteredPlaylist with ${playlist.length} songs`);
                initializePlayer();
            } catch (error) {
                console.error("❌ Failed to parse filteredPlaylist:", error);
            }
        } else {
            console.warn("⚠️ No filteredPlaylist found in localStorage");
        }
    } else if (playlistFile) {
        console.log(`🎯 Loading from static playlist file: playlists/${playlistFile}`);
        fetch(`playlists/${playlistFile}`)
            .then(response => response.json())
            .then(data => {
                playlist = data;
                console.log(`📦 Loaded playlist file with ${playlist.length} songs`);
                initializePlayer();
            })
            .catch(error => {
                console.error("❌ Failed to load playlist file:", error);
            });
    } else {
        console.warn("⚠️ No playlist selected.");
    }
});

// YouTube IFrame API ready
function onYouTubeIframeAPIReady() {
    console.log("🎥 YouTube IFrame API ready");
    player = new YT.Player('player', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    if (playlist.length > 0) {
        loadSong(currentIndex);
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        nextSong();
    }
}

function loadSong(index) {
    if (!playlist || playlist.length === 0 || index >= playlist.length) return;

    const song = playlist[index];
    currentIndex = index;

    // Load the video
    player.loadVideoById(song.videoId);
    console.log(`🎬 Now playing: ${song.song} by ${song.artist} [${index + 1}/${playlist.length}]`);

    // Update metadata
    document.getElementById("roundTitle").innerText = song.round || '';
    document.getElementById("artist").innerText = song.artist || '';
    document.getElementById("song").innerText = song.song || '';
    document.getElementById("submitter").innerText = song.submitter || '';
    document.getElementById("score").innerText = song.score ?? '';
    document.getElementById("rank").innerText = song.rank ?? '';

    // Display only the current song's comments
    const commentsContainer = document.getElementById("comments");
    commentsContainer.innerHTML = '';
    if (song.comments && Array.isArray(song.comments)) {
        song.comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = "comment";
            div.textContent = `${comment.name}: ${comment.text}`;
            commentsContainer.appendChild(div);
        });
    }
}

function nextSong() {
    if (currentIndex < playlist.length - 1) {
        loadSong(currentIndex + 1);
    }
}

function prevSong() {
    if (currentIndex > 0) {
        loadSong(currentIndex - 1);
    }
}

function pauseSong() {
    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
}

// Assign button functions
window.nextSong = nextSong;
window.prevSong = prevSong;
window.pauseSong = pauseSong;
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 DOM ready");

  const playlistFile = playlist ?? null;
  const fromFilter = window.location.search.includes("fromFilter=1");

  if (fromFilter) {
    console.log("🎯 Loading from localStorage (filteredPlaylist)");
    const base64 = localStorage.getItem("filteredPlaylist");
    if (base64) {
      try {
        const json = JSON.parse(atob(base64));
        currentPlaylist = json;
        console.log(`📦 Loaded filteredPlaylist with ${json.length} songs`);
        currentIndex = 0;
        playSong(currentIndex);
      } catch (e) {
        console.error("❌ Failed to decode base64 filteredPlaylist", e);
      }
    } else {
      console.warn("⚠️ No filteredPlaylist found in localStorage");
    }
  } else if (playlistFile) {
    console.log("🎯 Fetching playlist JSON:", `playlists/${playlistFile}`);
    loadPlaylist(`playlists/${playlistFile}`, nextPlaylist);
  } else {
    console.warn("⚠️ No playlist selected");
    document.getElementById("songInfo").innerText = "No playlist selected.";
  }
});

