// archive.js - Handles filtering, rendering, and playlist creation on archive.html

let masterSongs = [];
let filteredSongs = [];

const masterJSON = "master_songs.json";

// Fetch the master JSON and initialize the app
fetch(masterJSON)
  .then(res => res.json())
  .then(data => {
    masterSongs = data;
    filteredSongs = [...masterSongs];
    populateFilters(masterSongs);
    renderTable(filteredSongs);
  })
  .catch(err => console.error("Error loading master_songs.json:", err));

// Populate the dropdown filters
function populateFilters(data) {
  const roundSet = new Set();
  const seasonSet = new Set();
  const submitterSet = new Set();

  data.forEach(song => {
    roundSet.add(song.round_name);
    seasonSet.add(song.season);
    submitterSet.add(song.submitter);
  });

  populateSelect("roundFilter", roundSet);
  populateSelect("seasonFilter", seasonSet);
  populateSelect("submitterFilter", submitterSet);
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  values = Array.from(values).sort();
  values.forEach(value => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

// Filter songs when any dropdown changes
function applyFilters() {
  const round = document.getElementById("roundFilter").value;
  const season = document.getElementById("seasonFilter").value;
  const submitter = document.getElementById("submitterFilter").value;

  filteredSongs = masterSongs.filter(song => {
    return (!round || song.round_name === round) &&
           (!season || song.season === season) &&
           (!submitter || song.submitter === submitter);
  });

  renderTable(filteredSongs);
}

// Render the filtered songs in a table
function renderTable(songs) {
  const tbody = document.getElementById("songTableBody");
  tbody.innerHTML = "";

  songs.forEach(song => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${song.season}</td>
      <td>${song.round_name}</td>
      <td>${song.song_title}</td>
      <td>${song.artist}</td>
      <td>${song.submitter}</td>
      <td>${song.score}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("resultCount").textContent = songs.length;
}

// Trigger the modal to confirm playlist creation
function confirmPlaylistModal() {
  const filters = {
    round: document.getElementById("roundFilter").value,
    season: document.getElementById("seasonFilter").value,
    submitter: document.getElementById("submitterFilter").value
  };

  const summary = Object.entries(filters)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`)
    .join(" | ");

  document.getElementById("filterSummary").textContent = summary || "None (playing full list)";
  document.getElementById("playlistName").value = "";
  document.getElementById("modalOverlay").style.display = "flex";
}

// Cancel modal
function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";
}

// Proceed with playing or saving playlist
function createPlaylist() {
  const name = document.getElementById("playlistName").value.trim();
  const filterParams = new URLSearchParams(window.location.search);

  // For now just redirect with filters in URL
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  const round = document.getElementById("roundFilter").value;
  const season = document.getElementById("seasonFilter").value;
  const submitter = document.getElementById("submitterFilter").value;

  if (round) params.set("round", round);
  if (season) params.set("season", season);
  if (submitter) params.set("submitter", submitter);

  window.location.href = `player.html?${params.toString()}`;
}
