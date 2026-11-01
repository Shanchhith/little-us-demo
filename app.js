const labels = {
  memory: "Memory",
  letter: "Little letter",
  checkin: "Check-in",
  date: "Date idea",
};

const icons = { memory: "✳", letter: "✉", checkin: "♡", date: "☼" };
const colors = { memory: "rose", letter: "lavender", checkin: "sage", date: "butter" };
let entries = [];
let gallery = [];
let currentFilter = "all";

const loginView = document.querySelector("#login-view");
const appView = document.querySelector("#app-view");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const entryDialog = document.querySelector("#entry-dialog");
const entryForm = document.querySelector("#entry-form");
const entryError = document.querySelector("#entry-error");
const kindSelect = document.querySelector("#entry-kind");
const unlockField = document.querySelector("#unlock-field");

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong.");
  return result;
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
  document.querySelector("#password").value = "";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

function makeCard(entry) {
  const card = document.createElement("article");
  card.className = `entry-card ${colors[entry.kind]}`;

  const top = document.createElement("div");
  top.className = "card-top";
  const icon = document.createElement("span");
  icon.className = "card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = icons[entry.kind];
  const type = document.createElement("span");
  type.className = "card-kind";
  type.textContent = labels[entry.kind];
  const date = document.createElement("time");
  date.className = "card-date";
  date.dateTime = entry.createdAt;
  date.textContent = formatDate(entry.createdAt);
  top.append(icon, type, date);

  const title = document.createElement("h3");
  title.textContent = entry.title;
  const body = document.createElement("p");
  body.className = "card-body";
  if (entry.body === null && entry.unlockAt) {
    body.textContent = `Tucked away until ${formatDate(entry.unlockAt)}. A little surprise is waiting.`;
    body.classList.add("locked-note");
  } else {
    body.textContent = entry.body;
  }
  const photos = document.createElement("div");
  photos.className = "card-photos";
  for (const photoId of entry.photos || []) {
    const image = document.createElement("img");
    image.src = window.demoPhotoUrl(photoId);
    image.alt = `Photo saved with ${entry.title}`;
    image.loading = "lazy";
    photos.append(image);
  }
  const bottom = document.createElement("div");
  bottom.className = "card-bottom";
  if (entry.unlockAt && entry.body === null) {
    const lockLabel = document.createElement("span");
    lockLabel.className = "unlock-label";
    lockLabel.textContent = `Opens ${formatDate(entry.unlockAt)}`;
    bottom.append(lockLabel);
  } else {
    bottom.append(document.createElement("span"));
  }
  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove ${entry.title}`);
  remove.addEventListener("click", () => deleteEntry(entry.id));
  bottom.append(remove);
  card.append(top, title);
  if (photos.childElementCount) card.append(photos);
  card.append(body, bottom);
  return card;
}

function renderEntries() {
  const visible = entries.filter((entry) => currentFilter === "all" || entry.kind === currentFilter);
  entryList.replaceChildren(...visible.map(makeCard));
  document.querySelector("#entry-count").textContent = `${entries.length} ${entries.length === 1 ? "keepsake" : "keepsakes"}`;
  emptyState.hidden = entries.length > 0;
  entryList.hidden = entries.length === 0;
}

function renderGallery() {
  const galleryList = document.querySelector("#gallery-list");
  galleryList.replaceChildren(...gallery.map((item) => {
    const card = document.createElement("article");
    card.className = "gallery-card";
    const image = document.createElement("img");
    image.src = window.demoPhotoUrl(item.id);
    image.alt = item.caption || "A photo in our private folder";
    image.loading = "lazy";
    const details = document.createElement("div");
    details.className = "gallery-card-details";
    const caption = document.createElement("p");
    caption.textContent = item.caption || "A little moment";
    const date = document.createElement("time");
    date.dateTime = item.createdAt;
    date.textContent = formatDate(item.createdAt);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove photo ${item.caption || ""}`);
    remove.addEventListener("click", () => deleteGalleryPhoto(item.id));
    details.append(caption, date, remove);
    card.append(image, details);
    return card;
  }));
  document.querySelector("#photo-count").textContent = `${gallery.length} ${gallery.length === 1 ? "photo" : "photos"}`;
  document.querySelector("#gallery-empty").hidden = gallery.length > 0;
  galleryList.hidden = gallery.length === 0;
}

async function loadEntries() {
  entries = await request("/api/entries");
  renderEntries();
}

async function loadGallery() {
  gallery = await request("/api/gallery");
  renderGallery();
}

function openDialog() {
  entryError.textContent = "";
  entryDialog.showModal();
  document.querySelector("#entry-title").focus();
}

async function deleteEntry(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry || !window.confirm(`Remove “${entry.title}” from our shelf?`)) return;
  try {
    entries = await request(`/api/entries/${id}`, { method: "DELETE" });
    renderEntries();
  } catch (error) {
    window.alert(error.message);
  }
}

async function deleteGalleryPhoto(id) {
  const photo = gallery.find((item) => item.id === id);
  if (!photo || !window.confirm("Remove this photo from our private folder?")) return;
  try {
    gallery = await request(`/api/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
    renderGallery();
  } catch (error) {
    window.alert(error.message);
  }
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Couldn’t read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const button = loginForm.querySelector("button");
  button.disabled = true;
  try {
    await request("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: new FormData(loginForm).get("password") }),
    });
    showApp();
    await Promise.all([loadEntries(), loadGallery()]);
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await request("/api/logout", { method: "POST" });
  showLogin();
});

document.querySelector("#new-entry-button").addEventListener("click", openDialog);
document.querySelector("[data-open-entry]").addEventListener("click", openDialog);
document.querySelector("#close-dialog").addEventListener("click", () => entryDialog.close());
document.querySelector("#cancel-entry").addEventListener("click", () => entryDialog.close());

kindSelect.addEventListener("change", () => {
  unlockField.hidden = kindSelect.value !== "letter";
  document.querySelector("#photo-field").hidden = kindSelect.value === "letter";
  if (kindSelect.value === "letter") document.querySelector("#entry-photos").value = "";
});

document.querySelector("#filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  currentFilter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((filter) => filter.classList.toggle("active", filter === button));
  renderEntries();
});

entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  entryError.textContent = "";
  const button = entryForm.querySelector('[type="submit"]');
  button.disabled = true;
  const values = new FormData(entryForm);
  const unlockValue = values.get("unlockAt");
  try {
    const selectedPhotos = [...document.querySelector("#entry-photos").files];
    if (selectedPhotos.length > 3) throw new Error("Choose up to 3 photos.");
    for (const photo of selectedPhotos) {
      if (photo.size > 2 * 1024 * 1024) throw new Error("Each photo must be 2 MB or smaller.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
        throw new Error("Choose a JPEG, PNG, or WebP photo.");
      }
    }
    const photos = await Promise.all(selectedPhotos.map(async (photo) => ({ data: await readPhoto(photo) })));
    entries = await request("/api/entries", {
      method: "POST",
      body: JSON.stringify({
        kind: values.get("kind"),
        title: values.get("title"),
        body: values.get("body"),
        photos,
        ...(unlockValue ? { unlockAt: new Date(unlockValue).toISOString() } : {}),
      }),
    });
    currentFilter = "all";
    document.querySelectorAll(".filter").forEach((filter) => filter.classList.toggle("active", filter.dataset.filter === "all"));
    renderEntries();
    entryForm.reset();
    unlockField.hidden = true;
    entryDialog.close();
  } catch (error) {
    entryError.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#gallery-upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#gallery-files");
  const captionInput = document.querySelector("#gallery-caption");
  const status = document.querySelector("#gallery-status");
  const button = document.querySelector("#gallery-upload-button");
  const files = [...input.files];
  status.textContent = "";
  if (!files.length) {
    status.textContent = "Choose at least one photo first.";
    return;
  }
  for (const file of files) {
    if (file.size > 2 * 1024 * 1024) {
      status.textContent = `${file.name} is too large. Each photo must be 2 MB or smaller.`;
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      status.textContent = `${file.name} isn’t a JPEG, PNG, or WebP photo.`;
      return;
    }
  }

  button.disabled = true;
  let uploaded = 0;
  try {
    for (const file of files) {
      gallery = await request("/api/gallery", {
        method: "POST",
        body: JSON.stringify({
          photo: await readPhoto(file),
          caption: captionInput.value.trim(),
        }),
      });
      uploaded += 1;
      status.textContent = `${uploaded} of ${files.length} photos added…`;
      renderGallery();
    }
    input.value = "";
    captionInput.value = "";
    status.textContent = `${uploaded} ${uploaded === 1 ? "photo" : "photos"} added to our private folder.`;
  } catch (error) {
    status.textContent = uploaded
      ? `${uploaded} photo${uploaded === 1 ? "" : "s"} added. ${error.message}`
      : error.message;
  } finally {
    button.disabled = false;
  }
});

request("/api/entries")
  .then((loadedEntries) => {
    entries = loadedEntries;
    renderEntries();
    return loadGallery();
  })
  .then(() => {
    showApp();
  })
  .catch((error) => {
    if (!String(error.message).includes("sign in")) loginError.textContent = error.message;
  });
