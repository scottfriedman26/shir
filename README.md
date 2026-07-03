# Shir · שיר — Learn Hebrew Through Song

A personal iPhone PWA for learning Hebrew through Israeli music (Omer Adam, Ishay Ribo, and whoever's next). Study fully offline; go online only when you want to generate a new song pack.

## What's offline vs online

**Always offline (once installed):**
- Sing-along view — Hebrew, transliteration, and English stacked per line, each layer toggleable, adjustable text size
- Sing mode — full-screen, one line at a time, tap to advance while your music plays
- Line-referenced lessons per song (vocab in context, grammar patterns, culture, pronunciation)
- The word repository — every song's vocabulary pours in, organized by category, searchable, growing forever
- Flashcards with spaced repetition (Leitner boxes: cards you know come back in 1 / 3 / 7 / 21 days)

**Online, only when you tap it:**
- Generating a new song pack (step 3 on the Add tab)

Everything is stored in the browser's local storage on your phone. No account, no server, no data leaves the device except the prompt you paste into Claude.

## Hosting it (one-time, ~5 minutes)

A PWA needs to be served over HTTPS once so iOS can install and cache it. GitHub Pages is free:

1. Create a GitHub account if needed, then a new **public repository** (e.g. `shir`).
2. Upload these 6 files: `index.html`, `app.js`, `sw.js`, `manifest.json`, `icon-180.png`, `icon-512.png`.
3. Repo **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**.
4. After a minute your app is live at `https://YOURNAME.github.io/shir/`.

## Installing on your iPhone

1. Open that URL in **Safari** (must be Safari for install).
2. Tap **Share → Add to Home Screen → Add**.
3. Open it once from the home screen while online — the service worker caches everything.
4. Airplane-mode test it: it should load and study perfectly.

## Adding a song (the workflow)

1. **Add tab** → enter title, artist, and your Spotify/YouTube link (that becomes the play button next to the song).
2. Paste the **Hebrew lyrics** from wherever you have them (lyrics site, video description). If your source already has transliteration/English, paste that too — the AI aligns and improves it.
3. Tap **Copy lesson prompt** → open the Claude app → paste → Claude replies with a JSON study pack (transliteration matched to the sung pronunciation, natural English, 4–6 lessons referencing actual lines, 10–20 categorized vocab words).
4. Copy Claude's reply, paste it into **step 4**, tap **Save pack to my phone**.

From that moment the song is permanent and offline. Its words merge into the repository (duplicates skipped), and each new word enters the flashcard rotation.

## Listening while singing

Spotify/YouTube links open the song in those apps with one tap from the Songs tab. Start the track, switch back to Shir, hit **Sing mode**. (Streaming itself needs your normal connection or downloaded playlists — that's on Spotify's side.)

## Good to know

- **Backups:** data lives in Safari's storage for this app. If you ever delete the app icon or clear Safari website data, packs are lost — worth keeping your generated JSONs in Notes as a backup. iOS can also evict storage from web apps unused for many weeks; opening Shir regularly (which you will) prevents this.
- **Updating the app:** replace files in the GitHub repo and bump `shir-v1` to `shir-v2` in `sw.js`; the app refreshes next time it's opened online.
- A tiny public-domain demo song (*Hevenu Shalom Aleichem*) is preloaded so you can feel the flow before adding your first real song.
