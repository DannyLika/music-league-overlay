let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;
let ytPlayer;
let ytReady = false;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("✅ script.js loaded");

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

// Parse URL Params
const urlParams = new URLSearchParams(window.location.search);
const base64Data = urlParams.get("data");
const playlistFile = urlParams.get("playlist");
const fromFilter = urlParams.get("fromFilter") === "1";
const filePath = playlistFile ? `playlists/${playlistFile}` : null;

// Wait for DOMContentLoaded + YT ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🧠 DOM ready");
  checkStart();
});

function onYouTubeIframeAPIReady() {
  console.log("🎬 YouTube IFrame API ready");
  ytReady = true;
  ytPlayer = new YT.Player('ytplayer', {
    events: {
      'onReady': () => {
        console.log("🎥 YT Player Ready");
        checkStart();
      },
      'onStateChange': onPlayerStateChange
    }
  });
}

function checkStart() {
  if (!ytReady || !document.readyState || !document.getElementById("ytplayer")) return;

  if (fromFilter && localStorage.getItem("filteredPlaylist")) {
    console.log("📦 Source: localStorage (filteredPlaylist)");
    try {
      const raw = localStorage.getItem("filteredPlaylist");
      const parsed = JSON.parse(raw);
      console.log("✅ Parsed localStorage with", parsed.length, "songs");
      songs = parsed.filter(song => song && song.song_title);
      if (songs.length === 0) throw new Error("Empty playlist");
      currentIndex = 0;
      loadSong(currentIndex);
    } catch (e) {
      console.error("❌ Failed to parse localStorage playlist:", e);
      fallbackToRickAstley("Corrupt playlist in localStorage");
    }
  } else if (base64Data) {
    console.log("📦 Source: base64Data");
    try {
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const data = JSON.parse(jsonStr);
      songs = data.filter(song => song && song.song_title);
      console.log("✅ Decoded base64 playlist with", songs.length, "songs");
      if (songs.length === 0) throw new Error("Empty decoded list");
      currentIndex = 0;
      loadSong(currentIndex);
    } catch (err) {
      console.error("❌ Failed to decode base64:", err);
      fallbackToRickAstley("Invalid base64 song data.");
    }
  } else if (filePath) {
    console.log("📦 Source: playlist file", filePath);
    loadPlaylist(filePath);
  } else {
    console.warn("⚠️ No playlist found in URL. Fallback triggered.");
    fallbackToRickAstley("No playlist selected.");
  }
}

function loadPlaylist(path) {
  console.log("📂 Fetching playlist JSON:", path);
  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      songs = data.filter(song => song && song.song_title);
      console.log("✅ Loaded playlist file with", songs.length, "songs");
      if (songs.length === 0) throw new Error("Empty playlist file");
      currentIndex = 0;
      loadSong(currentIndex);
    })
    .catch(err => {
      console.error("❌ Error loading JSON playlist:", err);
      fallbackToRickAstley("Unable to load playlist file.");
    });
}

function fallbackToRickAstley(message = '') {
  console.warn("💥 Fallback triggered:", message);
  const fallbackSong = {
    song_title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    submitter: "Fallback Bot",
    score: "∞",
    rank: "1",
    comments: "You tried to break it, but Rick rolled you instead.",
    round_name: "Classic Internet Moments",
    season: "Bonus",
    youtube_url: `https://www.youtube.com/watch?v=${fallbackVideoId}`
  };
  songs = [fallbackSong];
  currentIndex = 0;
  loadSong(currentIndex);
}

function extractYouTubeID(url) {
  if (!url) return '';
  const match = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function loadSong(index) {
  clearInterval(commentInterval);
  const song = songs[index];
  if (!song) return console.error("🚫 No song found at index", index);

  console.log(`🎼 Now playing: ${song.song_title} by ${song.artist} [${index + 1}/${songs.length}]`);

  const videoId = extractYouTubeID(song.youtube_url) || fallbackVideoId;
  const comments = song.comments ? song.comments.split('\n') : ['No comments available'];

  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(videoId);
  }

  document.getElementById('songInfo').innerHTML = `
    <h2>${song.season || 'Unknown Season'} - ${song.round_name || 'Unknown Round'}</h2>
    <p><strong>Artist:</strong> ${song.artist || 'Unknown Artist'}</p>
    <p><strong>Song:</strong> <span class="highlight">${song.song_title || 'Unknown Title'}</span></p>
    <p><strong>Submitter:</strong> ${song.submitter || 'Unknown'}</p>
    <p><strong>Score:</strong> ${song.score || 0}</p>
    <p><strong>Rank:</strong> ${song.rank || 0}</p>
  `;

  const commentBox = document.getElementById("commentBox");
  commentIndex = 0;

  function showNextComment() {
    commentBox.style.opacity = 0;
    setTimeout(() => {
      commentBox.innerText = comments[commentIndex] || '';
      commentBox.style.opacity = 1;
      commentIndex = (commentIndex + 1) % comments.length;
    }, 300);
  }

  showNextComment();
  commentInterval = setInterval(showNextComment, 6000);
}

function prevSong() {
  if (currentIndex > 0) {
    currentIndex--;
    loadSong(currentIndex);
  }
}

function nextSong() {
  if (currentIndex < songs.length - 1) {
    currentIndex++;
    loadSong(currentIndex);
  } else {
    goToNextPlaylist();
  }
}

function togglePlayPause() {
  const func = isPaused ? 'playVideo' : 'pauseVideo';
  if (ytPlayer && ytPlayer[func]) {
    ytPlayer[func]();
    isPaused = !isPaused;
    document.getElementById('playPauseBtn').innerText = isPaused ? 'Play' : 'Pause';
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    nextSong();
  }
}

function getCurrentPlaylistFilename() {
  return playlistFile;
}

function goToNextPlaylist() {
  const allPlaylists = [
    "Fall2024_Top3.json",
    "Spring2025_Top3.json"
  ];
  const current = getCurrentPlaylistFilename();
  const currentIndex = allPlaylists.indexOf(current);
  const next = allPlaylists[currentIndex + 1];
  if (next) {
    window.location.href = `player.html?playlist=${next}`;
  } else {
    alert("🎉 End of all playlists.");
  }
}
