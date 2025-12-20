# PROJECT STATUS - ARUNEE
# ASCII only to avoid font issues

---
## LAST UPDATED
- Date: 2025-12-20
- Updated by: Codex

---
## CURRENT STATUS
- Tangmo AI:
  - Uses OpenAI API + TTS; intro lines mention “ร้านอรุณี ผ้าม่าน” เป็นบริการตกแต่งครบวงจร
  - Mic button `/assets/mic.png`, red glow when listening/speaking/processing; TTS voice fixed to `alloy` (env OPENAI_TTS_VOICE override)
  - Chat dock is in the top bar; toggle by switch; uploads show in chat log
- Chat API:
  - `api/chat.js` uses OpenAI responses API with system prompt (env OPENAI_ASSISTANT_PROMPT or default); model = env OPENAI_MODEL or `gpt-4o-mini`
  - Parses output_text/output[].content[].text/content[0].text; returns 500 on empty response
  - Prompt includes abilities: image analysis, suggest materials/tones, mention forwarding to installer team, tone recolor examples, remembers customer name/topics if provided
- Memory:
  - LocalStorage long/short memory: remembers name/topics; short notes expire after 2h; summary sent as system context on each chat
- Carousel:
  - 6 cards 3D ring; swipe/drag/wheel with momentum; tap pops and scrolls viewer
  - Card preview windows show seeded media per service
  - Files: `css/carousel.circular.css`, `js/carousel.circular.js`, `style.css`, `script.js`
- Media seeds (auto-discovery still works for sample-*/vsample-*):
  - curtain -> `/assets/gallery/curtain/curtain-bg1.jpg`
  - wall -> `/assets/gallery/wall/wall-BG1.jpg`
  - floor -> `/assets/gallery/floor/floor-BG1.jpg`
  - install -> `/assets/gallery/install/install-BG1.jpg`
  - aftercare -> `/assets/gallery/aftercare/aftercar-BG1.jpg`
  - design -> `/assets/gallery/design/sample-1.jpg`
- Viewer: image/video, fullscreen, thumbnail strip per service
- Service buttons: 6-button strip under dock; click selects service + plays audio from `/assets/audio/service-*.mp3`
- Audio scripts: stored in `script.js` -> `SERVICE_AUDIO.script` for TTS generation
- Data: inventory/stock not integrated yet

---
## IN PROGRESS
- Align card preview visibility (depends on card art transparency)
- Plan inventory/tones ingestion (Excel/JSON) pending customer decision
- Thai copy finalization when client provides wording

---
## LOCKED
- Tangmo core logic outside carousel scope unless requested
- Overall page layout outside carousel/AI/chat sections

---
## NEXT GOALS
1) Inventory/tones: choose source (Excel/JSON), implement loader + mapping per service/tone
2) Media: confirm final seed media; adjust preview if card art needs transparency tweaks
3) Copy: replace placeholder Thai text with approved client copy

---
## NOTES / DECISIONS
- Default delivery = replace whole file
- Mic icon path: `/assets/mic.png`
- Chat frame: `/assets/talking-frame.png`
- Media seeds listed above; auto-discovery via naming pattern

---
## HOW TO USE
- Update greetings: `script.js` -> `sayOpeningOnce()` lines
- Update service text: `script.js` -> `SERVICES`
- Add media: drop files into `assets/gallery/<service>/` named `sample-1.jpg`, `sample-1-thumb.jpg`, `vsample-1.mp4`, `vsample-1-thumb.jpg` (or replace seeded BG files)
- Inventory integration: not implemented; pick format then add loader
