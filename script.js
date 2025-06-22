let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;
let ytPlayer;
let apiReady = false;
let pendingVideoId = null;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("✅ script.js loaded");

// Load YouTube IFrame API
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const base64Data = urlParams.get("data");
const playlistFile = urlParams.get("playlist");
const nextPlaylist = urlParams.get("next");
const fromFilter = urlParams.get("fromFilter") === "1";
const filePath = playlistFile ? `playlists/${playlistFile}` : null;

// Main load trigger
document.addEventListener("DOMContentLoaded", () => {
  if (fromFilter && localStorage.getItem("filteredPlaylist")) {
    console.log("🎯 Loading from localStorage (filteredPlaylist)");
    try {
      const raw = localStorage.getItem("filteredPlaylist");
      const parsed = JSON.parse(raw);
      console.log("📦 Loaded filteredPlaylist with", parsed.length, "songs");
      if (Array.isArray(parsed) && parsed.length > 0) {
        songs = parsed;
        currentIndex = 0;
        if (apiReady) loadSong(currentIndex);
        else pendingVideoId = extractYouTubeID(songs[0].youtube_url);
      } else throw new Error("Invalid playlist data");
    } catch (e) {
      console.error("❌ Failed to parse filtered playlist:", e);
      fallbackToRickAstley("Invalid playlist data.");
    }
  } else if (base64Data) {
    console.log("🎯 Loading from base64 encoded data");
    try {
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const data = JSON.parse(jsonStr);
      console.log("📦 Decoded base64 with", data.length, "songs");
      songs = data.filter(song => song && song.song_title);
      if (songs.length === 0) throw new Error("Filtered song list is empty.");
      currentIndex = 0;
      if (apiReady) loadSong(currentIndex);
      else pendingVideoId = extractYouTubeID(songs[0].youtube_url);
    } catch (err) {
      console.error("❌ Error decoding base64 song data:", err);
      fallbackToRickAstley("Invalid song data.");
    }
  } else if (filePath) {
    console.log("🎯 Loading from static playlist file:", filePath);
    loadPlaylist(filePath);
  } else {
    console.warn("⚠️ No playlist data found. Falling back.");
    fallbackToRickAstley("No playlist selected.");
  }
});

function loadPlaylist(path) {
  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("📦 Loaded JSON playlist with", data.length, "songs");
      songs = data.filter(song => song && song.song_title);
      if (songs.length === 0) throw new Error("No valid songs");
      currentIndex = 0;
      if (apiReady) loadSong(currentIndex);
      else pendingVideoId = extractYouTubeID(songs[0].youtube_url);
    })
    .catch(err => {
      console.error("❌ Error loading JSON playlist:", err);
      fallbackToRickAstley("Unable to load song data.");
    });
}

function fallbackToRickAstley(message = "") {
  const fallbackSong = {
    song_title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    submitter: "Fallback Bot",
    score: "∞",
    rank: "1",
    comments: "You tried to break it, but Rick rolled you instead.",
    round_name: "Classic Internet Moments",
    season: "Bonus",
    spotify_url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
    youtube_url: `https://www.youtube.com/watch?v=${fallbackVideoId}`
  };

  songs = [fallbackSong];
  currentIndex = 0;

  const songInfoEl = document.getElementById("songInfo");
  if (songInfoEl && message) songInfoEl.innerText = message;

  if (apiReady) loadSong(currentIndex);
  else pendingVideoId = fallbackVideoId;
}

function extractYouTubeID(url) {
  if (!url) return '';
  const match = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function loadSong(index) {
  clearInterval(commentInterval);
  const song = songs[index];
  if (!song) return console.warn("🚫 No song to load at index", index);

  const videoId = extractYouTubeID(song.youtube_url) || fallbackVideoId;
  if (ytPlayer) {
    ytPlayer.loadVideoById(videoId);
  }

  document.getElementById("songInfo").innerHTML = `
    <h2>${song.season || 'Unknown Season'} - ${song.round_name || 'Unknown Round'}</h2>
    <p><strong>Artist:</strong> ${song.artist || 'Unknown Artist'}</p>
    <p><strong>Song:</strong> <span class="highlight">${song.song_title || 'Unknown Title'}</span></p>
    <p><strong>Submitter:</strong> ${song.submitter || 'Unknown'}</p>
    <p><strong>Score:</strong> ${song.score || 0}</p>
    <p><strong>Rank:</strong> ${song.rank || 0}</p>
  `;

  const commentBox = document.getElementById("commentBox");
  const comments = song.comments ? song.comments.split('\n') : ['No comments available'];
  commentIndex = 0;

  function showNextComment() {
    commentBox.style.opacity = 0;
    setTimeout(() => {
      commentBox.innerText = comments[commentIndex] || '';
      commentBox.style.opacity = 1;
      commentIndex = (commentIndex + 1) % comments.length;
    }, 700);
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
  if (!ytPlayer) return;
  const func = isPaused ? "playVideo" : "pauseVideo";
  ytPlayer[func]();
  isPaused = !isPaused;
  document.getElementById("playPauseBtn").innerText = isPaused ? "Play" : "Pause";
}

// ✅ YouTube API Ready → Initialize Player
function onYouTubeIframeAPIReady() {
  console.log("🎬 YT IFrame API Ready");
  ytPlayer = new YT.Player("ytplayer", {
    events: {
      onReady: () => {
        apiReady = true;
        console.log("🟢 YT Player Ready");
        if (pendingVideoId) {
          loadSong(currentIndex);
          pendingVideoId = null;
        }
      },
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log("⏭️ Song ended, moving to next");
    nextSong();
  }
}

function getCurrentPlaylistFilename() {
  return playlistFile;
}

function goToNextPlaylist() {
  const allPlaylists = ["Fall2024_Top3.json", "Spring2025_Top3.json"];
  const current = getCurrentPlaylistFilename();
  const currentIndex = allPlaylists.indexOf(current);
  const next = allPlaylists[currentIndex + 1];
  if (next) {
    window.location.href = `player.html?playlist=${next}`;
  } else {
    alert("End of all playlists.");
  }
}
