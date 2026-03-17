# ⚡ Chip Pulse — Semiconductor Intelligence Platform

## 🚀 Overview
**Chip Pulse** is a full-stack semiconductor intelligence dashboard that provides real-time insights into the chip industry, including market trends, company analysis, fab metrics, and AI-powered insights.

The platform aggregates and simulates data to deliver a unified view of semiconductor activity — similar to professional industry intelligence tools.

---

## 🔥 Core Features

### 📰 Real-Time News Engine
- Fetches semiconductor-related news using APIs
- Categorizes articles (AI Chips, Foundry, Memory, Automotive, etc.)
- Sentiment tagging (Bullish / Bearish)
- Clean card-based UI for quick insights

---

### 📊 Fab Intelligence Dashboard
- Active nodes tracking (3nm / 5nm / 7nm)
- Fab success rate monitoring
- Equipment utilization metrics
- Backlog / order tracking
- Yield trend visualization

---

### 📈 Market & Stock Tracking
- Live stock ticker (TSMC, NVIDIA, AMD, ASML, etc.)
- Real-time price updates via API
- Percentage change calculations
- Smooth scrolling ticker UI

---

### 🏢 Company Intelligence
- Company-wise sentiment analysis
- Latest headline aggregation
- Sector classification (AI Chips, Foundry, Memory)
- Interactive company cards

---

### 📊 Trends & Analytics
- Trending topics detection from news data
- Keyword-based category tracking (EUV, VLSI, AI Chips, etc.)
- Bullish vs Bearish sentiment analysis
- Most active sector identification

---

### 🤖 AI Assistant (Chat Panel)
- Ask questions about semiconductor industry
- Get insights on companies, trends, and comparisons
- Integrated via API-based LLM backend

---

### 🎯 Interview Prep Module
- Generates ECE/VLSI interview questions
- Based on latest semiconductor news
- Difficulty-based questions (Easy / Medium / Hard)

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend / APIs
- Finnhub API (Stock data)
- News API (Semiconductor news)
- LLM API (AI assistant)

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FINNHUB_KEY=your_finnhub_key
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key
GROQ_API_KEY=your_llm_api_key
