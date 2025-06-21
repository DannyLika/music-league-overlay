let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;
let ytPlayer;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("script.js loaded!");

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

// Get URL Params
const urlParams = new URLSearchParams(window.location.search);
const playlistFile = urlParams.get("playlist");
const filePath = playlistFile ? `playlists/${playlistFile}` : null;
const nextPlaylist = urlParams.get("next");

if (filePath) {
  loadPlaylist(filePath, nextPlaylist);
} else {
  fallbackToRickAstley("No playlist selected.");
}

function loadPlaylist(path, nextPlaylist = null) {
  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        console.warn("Playlist is empty. Falling back to Rick Astley.");
        fallbackToRickAstley();
        return;
      }

      songs = data.filter(song => song && song.song_title);
      if (songs.length === 0) {
        console.warn("No valid songs found. Fallback triggered.");
        fallbackToRickAstley();
        return;
      }

      currentIndex = 0;
      loadSong(currentIndex);
    })
    .catch(err => {
      console.error("JSON load error:", err);
      fallbackToRickAstley("Unable to load song data.");
    });
}

function fallbackToRickAstley(message = '') {
  const fallbackSong = {
    song_title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    submitter: "Fallback Bot",
    score: "∞",
    comments: "You tried to break it, but Rick rolled you instead.",
    round_name: "Classic Internet Moments",
    season: "Bonus",
    spotify_url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
    youtube_url: `https://www.youtube.com/watch?v=${fallbackVideoId}`
  };

  songs = [fallbackSong];
  currentIndex = 0;
  if (message) {
    document.getElementById('songInfo').innerText = message;
  }
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

  const videoId = extractYouTubeID(song.youtube_url) || fallbackVideoId;
  const spotifyUrl = song.spotify_url;
  const iframe = document.getElementById('ytplayer');

  if (videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  } else if (spotifyUrl) {
    iframe.src = `https://open.spotify.com/embed/track/${spotifyUrl.split('/track/')[1]}`;
  } else {
    iframe.src = `https://www.youtube.com/embed/${fallbackVideoId}?autoplay=1&enablejsapi=1`;
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
  const iframe = document.getElementById('ytplayer');
  const func = isPaused ? 'playVideo' : 'pauseVideo';
  iframe.contentWindow.postMessage(`{"event":"command","func":"${func}","args":""}`, "*");
  isPaused = !isPaused;
  document.getElementById('playPauseBtn').innerText = isPaused ? 'Play' : 'Pause';
}

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytplayer', {
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    nextSong();
  }
}

function getCurrentPlaylistFilename() {
  return urlParams.get("playlist");
}

function goToNextPlaylist() {
  const allPlaylists = [
    "Fall2024_Top3.json",
    "Spring2025_Top3.json"
    // Add more as needed
  ];
  const current = getCurrentPlaylistFilename();
  const currentIndex = allPlaylists.indexOf(current);
  const next = allPlaylists[currentIndex + 1];

  if (next) {
    window.location.href = `player.html?playlist=${next}`;
  } else {
    alert("End of all playlists.");
  }
}
