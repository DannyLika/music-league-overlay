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
    populateAllFilters(masterSongs);
    renderTable(filteredSongs);
  })
  .catch(err => console.error("Error loading master_songs.json:", err));

// Populate all dropdown filters with unique values
function populateAllFilters(data) {
  populateFilter("seasonFilter", [...new Set(data.map(s => s.season))]);
 // populateFilter("roundFilter", [...new Set(data.map(s => s.round_name))]);
  populateFilter("submitterFilter", [...new Set(data.map(s => s.submitter))]);
  populateFilter("rankFilter", [...new Set(data.map(s => s.rank))].sort((a, b) => a - b));
}

function populateFilter(id, items) {
  const select = document.getElementById(id);
  select.innerHTML = ''; // clear existing
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

// Get selected values from a <select multiple>
function getSelectedValues(selectId) {
  const select = document.getElementById(selectId);
  return Array.from(select.selectedOptions).map(opt => opt.value);
}

// Filter songs using all selected filters
function applyFilters() {
  const seasons = getSelectedValues("seasonFilter");
  const rounds = getSelectedValues("roundFilter");
  const submitters = getSelectedValues("submitterFilter");
  const ranks = getSelectedValues("rankFilter");

  filteredSongs = masterSongs.filter(song => {
    return (
      (seasons.length === 0 || seasons.includes(song.season)) &&
      (rounds.length === 0 || rounds.includes(song.round_name)) &&
      (submitters.length === 0 || submitters.includes(song.submitter)) &&
      (ranks.length === 0 || ranks.includes(song.rank))
    );
  });

  updateAvailableOptions();
  renderTable(filteredSongs);
}

function updateAvailableOptions() {
  // Dynamically adjust available filter values based on current filtered results
  populateFilter("roundFilter", [...new Set(filteredSongs.map(s => s.round_name))]);
  populateFilter("submitterFilter", [...new Set(filteredSongs.map(s => s.submitter))]);
  populateFilter("rankFilter", [...new Set(filteredSongs.map(s => s.rank))].sort((a, b) => a - b));
}

function resetFilters() {
  document.querySelectorAll("select").forEach(sel => sel.selectedIndex = -1);
  filteredSongs = [...masterSongs];
  populateAllFilters(masterSongs);
  renderTable(filteredSongs);
}

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
      <td>${song.rank}</td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById("resultCount").textContent = songs.length;
}

// Playlist Modal
function promptCreatePlaylist() {
  const filters = {
    Season: getSelectedValues("seasonFilter").join(", "),
    Round: getSelectedValues("roundFilter").join(", "),
    Submitter: getSelectedValues("submitterFilter").join(", "),
    Rank: getSelectedValues("rankFilter").join(", ")
  };

  const summary = Object.entries(filters)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}: ${val}`)
    .join(" | ");

  document.getElementById("filterSummary").textContent = summary || "None (all songs)";
  document.getElementById("playlistName").value = "";
  document.getElementById("playlistModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("playlistModal").style.display = "none";
}

function createPlaylist() {
  const name = document.getElementById("playlistName").value.trim();
  const params = new URLSearchParams();

  if (name) params.set("name", name);
  getSelectedValues("seasonFilter").forEach(v => params.append("season", v));
  getSelectedValues("roundFilter").forEach(v => params.append("round", v));
  getSelectedValues("submitterFilter").forEach(v => params.append("submitter", v));
  getSelectedValues("rankFilter").forEach(v => params.append("rank", v));

  window.location.href = `player.html?${params.toString()}`;
}
