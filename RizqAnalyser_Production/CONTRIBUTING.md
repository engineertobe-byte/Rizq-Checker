# Contributing to RizqAnalyser

## 🛠 Adding New Keywords
To add a prohibited industry or role:
1. Open `background.js`.
2. Locate `KEYWORD_MAPS`.
3. Add the keyword to the relevant category array.

## 🌐 Adding New Platforms
To support a new job board:
1. Open `content.js`.
2. Add the CSS selector for the company name to the `selectors` array in `detectCompany()`.
3. Add the CSS selector for the job title to the `selectors` array in `detectRole()`.

## 📖 Scriptural Verification
All additions to `data/scriptures.json` must be:
1. Authenticated (Sahih/Hasan).
2. Sourced with specific Surah/Ayah or Collection/Hadith number.
3. Provided in both English and Arabic.

## 💻 Code Style
- No `module.exports`.
- No external APIs except Wikidata.
- Use standard Chrome Extension API (Manifest V3).
