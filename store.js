(() => {
  const owner = "Shanchhith";
  const repo = "little-us-demo";
  const branch = "gh-pages";
  const storageKey = "little-us-entries-v1";

  const starter = [
    { id: "welcome", kind: "memory", title: "Our little corner", body: "This is our place. Tap “Add a little something” to save memories, letters, check-ins, and date ideas. They’re saved on this device.", createdAt: new Date().toISOString(), photos: [] },
  ];

  function loadEntries() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return starter;
  }

  function saveEntries(entries) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {}
  }

  let entries = loadEntries();
  let gallery = [];
  let galleryLoaded = false;

  const imagePattern = /\.(jpe?g|png|webp|gif)$/i;

  function captionFrom(name) {
    return name.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  }

  async function loadGallery() {
    if (galleryLoaded) return gallery;
    galleryLoaded = true;
    try {
      const response = await window.nativeFetch(`https://api.github.com/repos/${owner}/${repo}/contents/photos?ref=${branch}`);
      if (response.ok) {
        const files = await response.json();
        gallery = files
          .filter((file) => file.type === "file" && imagePattern.test(file.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
          .map((file) => ({ id: file.name, caption: captionFrom(file.name), createdAt: new Date().toISOString() }));
      }
    } catch {}
    return gallery;
  }

  window.demoPhotoUrl = (id) => `photos/${encodeURIComponent(id)}`;

  const reply = (status, value) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  const toPublic = (entry) => (entry.kind === "letter" && entry.unlockAt && Date.parse(entry.unlockAt) > Date.now() ? { ...entry, body: null, photos: [] } : entry);

  window.nativeFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    if (typeof url !== "string" || !url.startsWith("/api/")) return window.nativeFetch(url, options);
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    if (url === "/api/entries" && method === "GET") return reply(200, entries.map(toPublic));
    if (url === "/api/entries" && method === "POST") {
      entries = [{
        id: crypto.randomUUID(),
        kind: body.kind,
        title: body.title,
        body: body.body,
        createdAt: new Date().toISOString(),
        photos: [],
        ...(body.unlockAt ? { unlockAt: body.unlockAt } : {}),
      }, ...entries];
      saveEntries(entries);
      return reply(201, entries.map(toPublic));
    }
    if (url.startsWith("/api/entries/") && method === "DELETE") {
      entries = entries.filter((entry) => entry.id !== url.split("/").pop());
      saveEntries(entries);
      return reply(200, entries.map(toPublic));
    }
    if (url === "/api/gallery" && method === "GET") return reply(200, await loadGallery());
    return reply(404, { error: "Not found." });
  };
})();
