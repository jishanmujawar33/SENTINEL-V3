# 🛡️ Sentinel — Fake Review Detection Engine

A full-stack web application that detects fake reviews using a client-side **XGBoost gradient boosting** classifier. Analyzes 14+ NLP signals to classify reviews as **FAKE**, **GENUINE**, or **SUSPICIOUS** — all in the browser, no API keys needed.

## Architecture

```
sentinel/
├── frontend/          # Vite + React SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level views
│   │   └── engine/       # XGBoost detection engine
│   └── ...
├── backend/           # Express.js API server
│   ├── routes/           # Auth & scan endpoints
│   ├── middleware/        # JWT authentication
│   └── utils/            # JSON file storage
└── .gitignore
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:3001`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App opens at `http://localhost:5173`

## Detection Engine

The XGBoost engine extracts **14 NLP features** from review text:

| # | Feature | Detects |
|---|---------|---------|
| 1 | Exclamation density | Over-enthusiasm |
| 2 | Caps ratio | Shouting/spam |
| 3 | Avg word length | Vocabulary complexity |
| 4 | Superlative count | "Best ever!!!" patterns |
| 5 | Specificity score | Real product details |
| 6 | Emotional polarity | Sentiment balance |
| 7 | Repetition score | Copy-paste patterns |
| 8 | Review length | Too short/long |
| 9 | Question presence | Genuine curiosity |
| 10 | First person pronouns | Personal experience |
| 11 | Hedging language | Nuanced opinions |
| 12 | Emoji/symbol density | Spam indicators |
| 13 | Sentence variety | Natural writing |
| 14 | Lexical diversity | Vocabulary richness |

These features feed into a **25-tree gradient boosting ensemble** that produces a verdict with confidence score.

## Tech Stack

- **Frontend**: React 18, Vite, CSS3 (custom design system)
- **Backend**: Express.js, JWT auth, bcryptjs, JSON file storage
- **ML Engine**: Pure JavaScript XGBoost implementation (no dependencies)

## License

MIT
