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

// Populate dropdown filters
function populateAllFilters(data) {
  populateFilter("seasonFilter", [...new Set(data.map(s => s.season))]);
  populateFilter("submitterFilter", [...new Set(data.map(s => s.submitter))]);
  populateFilter("rankFilter", [...new Set(data.map(s => s.rank))].sort((a, b) => a - b));
}

function populateFilter(id, items) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = "";
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function getSelectedValues(selectId) {
  const select = document.getElementById(selectId);
  return select ? Array.from(select.selectedOptions).map(opt => opt.value) : [];
}

function applyFilters() {
  const seasons = getSelectedValues("seasonFilter");
  const submitters = getSelectedValues("submitterFilter");
  const ranks = getSelectedValues("rankFilter");

  filteredSongs = masterSongs.filter(song => {
    return (
      (seasons.length === 0 || seasons.includes(song.season)) &&
      (submitters.length === 0 || submitters.includes(song.submitter)) &&
      (ranks.length === 0 || ranks.includes(song.rank.toString()))
    );
  });

  updateAvailableOptions();
  renderTable(filteredSongs);
}

function updateAvailableOptions() {
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

function promptCreatePlaylist() {
  const modal = document.getElementById("playlistModal");
  if (!modal) {
    console.error("playlistModal not found in DOM.");
    return;
  }

  const filters = {
    Season: getSelectedValues("seasonFilter").join(", "),
    Submitter: getSelectedValues("submitterFilter").join(", "),
    Rank: getSelectedValues("rankFilter").join(", ")
  };

  const summary = Object.entries(filters)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}: ${val}`)
    .join(" | ");

  document.getElementById("filterSummary").textContent = summary || "None (all songs)";
  document.getElementById("playlistName").value = "";
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("playlistModal");
  if (modal) modal.style.display = "none";
}

function createPlaylist() {
  const name = document.getElementById("playlistName").value.trim();

  // Store filteredSongs directly in localStorage
  localStorage.setItem("filteredPlaylist", JSON.stringify(filteredSongs));

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  params.set("fromFilter", "1");

  window.location.href = `player.html?${params.toString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const createBtn = document.getElementById("createBtn");

  if (applyBtn) applyBtn.onclick = applyFilters;
  if (resetBtn) resetBtn.onclick = resetFilters;
  if (createBtn) createBtn.onclick = promptCreatePlaylist;
});
