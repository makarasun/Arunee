# PROJECT STATUS - ARUNEE

Source of truth for the current work; keep in ASCII to avoid font issues.

---

## LAST UPDATED
- Date: 2025-12-16
- Updated by: Codex

---

## CURRENT STATUS
- Tangmo AI:
  - Uses OpenAI API + TTS; intro voice lines now mention “ร้านอรุณี ผ้าม่าน” เป็นบริการตกแต่งครบวงจร
  - Mic button uses `/assets/mic.png`, red glowing when listening/speaking/processing
  - Chat board toggles under AI bar via the switch; background uses `/assets/talking-frame.png`
- Carousel:
  - 6 cards in a 3D ring; swipe/drag/wheel with momentum; tap pops card and scrolls viewer
  - Card preview windows show seeded media per service
  - Files: `css/carousel.circular.css`, `js/carousel.circular.js`, `style.css`, `script.js`
- Media mapping (seed, auto-discovery still works):
  - curtain -> `/assets/gallery/curtain/curtain-bg1.jpg`
  - wall -> `/assets/gallery/wall/wall-BG1.jpg`
  - floor -> `/assets/gallery/floor/floor-BG1.jpg`
  - install -> `/assets/gallery/install/install-BG1.jpg`
  - aftercare -> `/assets/gallery/aftercare/aftercar-BG1.jpg`
  - design -> `/assets/gallery/design/sample-1.jpg`
  - Additional media picked up via `sample-*` / `sample-*-thumb` / `vsample-*` / `vsample-*-thumb`
- Viewer:
  - Image/video, fullscreen, thumbnail strip per service
- Data: all service text and greetings are hardcoded in `script.js` for now; no inventory/stock source yet

---

## IN PROGRESS
- Align card preview content visibility through glass window (depends on transparency of card art)
- Plan inventory/tones ingestion (Excel/JSON) pending customer decision
- Thai copy finalization (awaiting customer-provided wording)

---

## LOCKED
- Tangmo core logic outside carousel scope (unless explicitly requested)
- Overall page layout outside carousel/AI/chat sections

---

## NEXT GOALS
1) Inventory/tones:
   - Decide source (single Excel vs JSON) and implement loader + mapping to services/tones
2) Media:
   - Confirm final seed media per service; adjust preview if card art needs transparency tweaks
3) Copy:
   - Replace placeholder Thai text with approved client copy once received

---

## NOTES / DECISIONS
- Default delivery = replace whole file
- Mic icon path: `/assets/mic.png`
- Chat board frame: `/assets/talking-frame.png`
- Media seeds listed above; auto-discovery keeps working if files follow naming pattern

---

## HOW TO USE
- Update greeting lines: `script.js` → `sayOpeningOnce()` array `lines`
- Update service titles/descriptions: `script.js` → `SERVICES` object
- Add media: drop files into corresponding `assets/gallery/<service>/` with names `sample-1.jpg` / `sample-1-thumb.jpg` / `vsample-1.mp4` / `vsample-1-thumb.jpg` (or overwrite the seeded BG files)
- Inventory integration: not implemented; choose source format (Excel/JSON) then add loader
