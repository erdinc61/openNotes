import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const db = new Database(path.join(process.cwd(), "data", "opennotes.db"));
const USER_ID = "1G18Wbvyk6FD8N8kuab6BGS6lc0jNF86";

function ts(date) {
  return Math.floor(date.getTime() / 1000);
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const now = new Date();

// --- PAGES ---
const pages = [
  {
    id: randomUUID(), title: "Weekly Review Template",
    icon: "📋",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "What went well this week?" }] },
        { type: "paragraph", content: [{ type: "text", text: "Reflect on wins, progress, and positive moments." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "What could be improved?" }] },
        { type: "paragraph", content: [{ type: "text", text: "Think about blockers, distractions, and missed opportunities." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Goals for next week" }] },
        { type: "paragraph", content: [{ type: "text", text: "Set 3 clear goals you want to accomplish." }] },
      ]
    }),
    parentId: null, isFavorite: true,
  },
  {
    id: randomUUID(), title: "Lernplan Japanisch",
    icon: "🇯🇵",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hiragana & Katakana" }] },
        { type: "paragraph", content: [{ type: "text", text: "Alle 46 Grundzeichen + Dakuten lernen. Ziel: flüssig lesen können bis Ende des Monats." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kanji - JLPT N5" }] },
        { type: "paragraph", content: [{ type: "text", text: "Die ersten 100 Kanji aus der JLPT N5 Liste. Pro Tag 5 neue Kanji lernen und mit Flashcards wiederholen." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Grammatik" }] },
        { type: "paragraph", content: [{ type: "text", text: "Grundlegende Satzstruktur: SOV (Subjekt-Objekt-Verb). Partikel は、が、を、に、で verstehen." }] },
      ]
    }),
    parentId: null, isFavorite: true,
  },
  {
    id: randomUUID(), title: "Buchnotizen: Atomic Habits",
    icon: "📖",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kernideen" }] },
        { type: "paragraph", content: [{ type: "text", text: "1% besser jeden Tag. Gewohnheiten sind der Zinseszins der Selbstverbesserung." }] },
        { type: "paragraph", content: [{ type: "text", text: "Die 4 Gesetze der Verhaltensänderung: Mach es offensichtlich, attraktiv, einfach, befriedigend." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Meine Takeaways" }] },
        { type: "paragraph", content: [{ type: "text", text: "Habit Stacking nutzen: Nach dem Kaffee → 10 Min Vokabeln. Umgebung gestalten, nicht auf Willenskraft verlassen." }] },
      ]
    }),
    parentId: null, isFavorite: false,
  },
  {
    id: randomUUID(), title: "Workout Routine",
    icon: "💪",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Push Day" }] },
        { type: "paragraph", content: [{ type: "text", text: "Bench Press 4x8, Overhead Press 3x10, Incline Dumbbell Press 3x12, Lateral Raises 3x15, Tricep Pushdowns 3x12" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Pull Day" }] },
        { type: "paragraph", content: [{ type: "text", text: "Deadlift 4x6, Barbell Rows 4x8, Pull-Ups 3xAMRAP, Face Pulls 3x15, Bicep Curls 3x12" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Leg Day" }] },
        { type: "paragraph", content: [{ type: "text", text: "Squats 4x8, Romanian Deadlift 3x10, Leg Press 3x12, Leg Curls 3x12, Calf Raises 4x15" }] },
      ]
    }),
    parentId: null, isFavorite: false,
  },
  {
    id: randomUUID(), title: "Rezepte",
    icon: "🍳",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Overnight Oats" }] },
        { type: "paragraph", content: [{ type: "text", text: "50g Haferflocken, 150ml Milch, 1 EL Chiasamen, Honig, Beeren. Abends vorbereiten, morgens genießen." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Chicken Teriyaki Bowl" }] },
        { type: "paragraph", content: [{ type: "text", text: "Hähnchenbrust in Teriyaki-Sauce, Reis, Edamame, Avocado, Sesam. 30 Min Zubereitung." }] },
      ]
    }),
    parentId: null, isFavorite: false,
  },
];

// Sub-pages for Lernplan Japanisch
const japanischId = pages[1].id;
const subPages = [
  {
    id: randomUUID(), title: "Hiragana Übersicht",
    icon: "あ",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "あ い う え お — a i u e o" }] },
        { type: "paragraph", content: [{ type: "text", text: "か き く け こ — ka ki ku ke ko" }] },
        { type: "paragraph", content: [{ type: "text", text: "さ し す せ そ — sa shi su se so" }] },
      ]
    }),
    parentId: japanischId, isFavorite: false,
  },
  {
    id: randomUUID(), title: "Nützliche Phrasen",
    icon: "💬",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "おはようございます — Guten Morgen" }] },
        { type: "paragraph", content: [{ type: "text", text: "ありがとうございます — Vielen Dank" }] },
        { type: "paragraph", content: [{ type: "text", text: "すみません — Entschuldigung" }] },
        { type: "paragraph", content: [{ type: "text", text: "いただきます — Guten Appetit (vor dem Essen)" }] },
      ]
    }),
    parentId: japanischId, isFavorite: false,
  },
];

const insertPage = db.prepare(`
  INSERT INTO page (id, user_id, parent_id, title, content, icon, cover_image, is_archived, is_favorite, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?)
`);

for (const p of [...pages, ...subPages]) {
  const created = daysAgo(Math.floor(Math.random() * 14) + 1);
  const updated = daysAgo(Math.floor(Math.random() * 3));
  insertPage.run(p.id, USER_ID, p.parentId, p.title, p.content, p.icon, p.isFavorite ? 1 : 0, ts(created), ts(updated));
}
console.log(`Inserted ${pages.length + subPages.length} pages`);

// --- DECKS & CARDS ---
const decksData = [
  {
    name: "Japanisch - Hiragana",
    cards: [
      { front: "あ", back: "a" },
      { front: "い", back: "i" },
      { front: "う", back: "u" },
      { front: "え", back: "e" },
      { front: "お", back: "o" },
      { front: "か", back: "ka" },
      { front: "き", back: "ki" },
      { front: "く", back: "ku" },
      { front: "け", back: "ke" },
      { front: "こ", back: "ko" },
      { front: "さ", back: "sa" },
      { front: "し", back: "shi" },
      { front: "す", back: "su" },
      { front: "せ", back: "se" },
      { front: "そ", back: "so" },
    ],
  },
  {
    name: "Japanisch - Vokabeln N5",
    cards: [
      { front: "水 (みず)", back: "Wasser" },
      { front: "食べる (たべる)", back: "essen" },
      { front: "飲む (のむ)", back: "trinken" },
      { front: "大きい (おおきい)", back: "groß" },
      { front: "小さい (ちいさい)", back: "klein" },
      { front: "新しい (あたらしい)", back: "neu" },
      { front: "古い (ふるい)", back: "alt" },
      { front: "高い (たかい)", back: "teuer / hoch" },
      { front: "安い (やすい)", back: "günstig" },
      { front: "早い (はやい)", back: "schnell / früh" },
      { front: "遅い (おそい)", back: "langsam / spät" },
      { front: "学校 (がっこう)", back: "Schule" },
      { front: "先生 (せんせい)", back: "Lehrer" },
      { front: "学生 (がくせい)", back: "Student" },
      { front: "友達 (ともだち)", back: "Freund" },
      { front: "家族 (かぞく)", back: "Familie" },
      { front: "仕事 (しごと)", back: "Arbeit" },
      { front: "電車 (でんしゃ)", back: "Zug" },
      { front: "天気 (てんき)", back: "Wetter" },
      { front: "時間 (じかん)", back: "Zeit" },
    ],
  },
  {
    name: "Englisch - Business Vokabeln",
    cards: [
      { front: "revenue", back: "Umsatz / Einnahmen" },
      { front: "profit margin", back: "Gewinnmarge" },
      { front: "stakeholder", back: "Interessengruppe / Beteiligter" },
      { front: "leverage", back: "Hebelwirkung / nutzen" },
      { front: "scalability", back: "Skalierbarkeit" },
      { front: "ROI", back: "Return on Investment — Kapitalrendite" },
      { front: "due diligence", back: "Sorgfaltspflicht / Risikoprüfung" },
      { front: "pipeline", back: "Vertriebspipeline / Projekt-Pipeline" },
      { front: "KPI", back: "Key Performance Indicator — Leistungskennzahl" },
      { front: "bottom line", back: "Endergebnis / Gewinn" },
      { front: "cash flow", back: "Cashflow / Zahlungsstrom" },
      { front: "benchmark", back: "Vergleichsmaßstab / Richtwert" },
    ],
  },
  {
    name: "Allgemeinwissen",
    cards: [
      { front: "Hauptstadt von Australien?", back: "Canberra (nicht Sydney!)" },
      { front: "Wer malte die Mona Lisa?", back: "Leonardo da Vinci" },
      { front: "Chemisches Symbol für Gold?", back: "Au (Aurum)" },
      { front: "Längster Fluss der Welt?", back: "Nil (6.650 km)" },
      { front: "Wie viele Planeten hat unser Sonnensystem?", back: "8 (Pluto ist ein Zwergplanet)" },
      { front: "Was ist die Lichtgeschwindigkeit?", back: "ca. 300.000 km/s" },
      { front: "Wer schrieb 'Die Verwandlung'?", back: "Franz Kafka" },
      { front: "In welchem Jahr fiel die Berliner Mauer?", back: "1989" },
      { front: "Was ist Photosynthese?", back: "Pflanzen wandeln CO₂ + Wasser + Licht in Glukose + Sauerstoff um" },
      { front: "Wie heißt die größte Wüste der Welt?", back: "Antarktis (Kältewüste) / Sahara (Hitzewüste)" },
    ],
  },
];

const insertDeck = db.prepare(`
  INSERT INTO deck (id, user_id, name, description, created_at, updated_at)
  VALUES (?, ?, ?, NULL, ?, ?)
`);

const insertCard = db.prepare(`
  INSERT INTO card (id, deck_id, user_id, front, back, interval, ease_factor, repetitions, due_date, source_page_id, is_archived, front_image, back_image, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, NULL, NULL, ?, ?)
`);

const insertReview = db.prepare(`
  INSERT INTO review_log (id, card_id, user_id, rating, reviewed_at)
  VALUES (?, ?, ?, ?, ?)
`);

let totalCards = 0;
let totalReviews = 0;

for (const d of decksData) {
  const deckId = randomUUID();
  const created = daysAgo(14);
  insertDeck.run(deckId, USER_ID, d.name, ts(created), ts(created));

  for (let i = 0; i < d.cards.length; i++) {
    const c = d.cards[i];
    const cardId = randomUUID();
    const cardCreated = daysAgo(14 - Math.floor(i / 3));

    // Simulate varied review history
    let interval = 1;
    let easeFactor = 2.5;
    let repetitions = 0;
    let dueDate;
    const reviewCount = Math.floor(Math.random() * 5);

    const reviews = [];
    for (let r = 0; r < reviewCount; r++) {
      const rating = [1, 2, 2, 2, 3][Math.floor(Math.random() * 5)];
      const reviewDate = daysAgo(14 - r * 3);

      if (rating === 0) { repetitions = 0; interval = 1; easeFactor = Math.max(1.3, easeFactor - 0.2); }
      else if (rating === 1) { interval = Math.ceil(interval * 1.2); easeFactor = Math.max(1.3, easeFactor - 0.15); }
      else if (rating === 2) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.ceil(interval * easeFactor);
        repetitions++;
      } else {
        if (repetitions === 0) interval = 2;
        else if (repetitions === 1) interval = 8;
        else interval = Math.ceil(interval * easeFactor * 1.3);
        easeFactor += 0.15;
        repetitions++;
      }

      reviews.push({ rating, reviewDate });
    }

    // Set due date based on last review
    if (reviewCount > 0) {
      dueDate = daysFromNow(-2 + interval);
    } else {
      // Never reviewed — due now or in the past
      dueDate = daysAgo(Math.floor(Math.random() * 3));
    }

    // Insert card first (before reviews, due to foreign key)
    insertCard.run(cardId, deckId, USER_ID, c.front, c.back, interval, easeFactor, repetitions, ts(dueDate), ts(cardCreated), ts(cardCreated));

    // Now insert reviews
    for (const rev of reviews) {
      insertReview.run(randomUUID(), cardId, USER_ID, rev.rating, ts(rev.reviewDate));
      totalReviews++;
    }
    totalCards++;
  }
}
console.log(`Inserted ${decksData.length} decks, ${totalCards} cards, ${totalReviews} reviews`);

// --- TASKS ---
const insertTask = db.prepare(`
  INSERT INTO task (id, user_id, title, is_recurring, schedule_days, completed_dates, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = now.toISOString().slice(0, 10);
const tasks = [
  { title: "Japanisch Vokabeln wiederholen", isRecurring: true, scheduleDays: [], completedDates: [today] },
  { title: "30 Min lesen", isRecurring: true, scheduleDays: [], completedDates: [] },
  { title: "Workout", isRecurring: true, scheduleDays: [1, 3, 5], completedDates: [] },
  { title: "Wocheneinkauf", isRecurring: true, scheduleDays: [6], completedDates: [] },
  { title: "Weekly Review schreiben", isRecurring: true, scheduleDays: [0], completedDates: [] },
  { title: "Zahnarzttermin ausmachen", isRecurring: false, scheduleDays: [], completedDates: [] },
  { title: "Paket zur Post bringen", isRecurring: false, scheduleDays: [], completedDates: [] },
];

for (const t of tasks) {
  const created = daysAgo(7);
  insertTask.run(randomUUID(), USER_ID, t.title, t.isRecurring ? 1 : 0, JSON.stringify(t.scheduleDays), JSON.stringify(t.completedDates), ts(created), ts(created));
}
console.log(`Inserted ${tasks.length} tasks`);

console.log("\nDone! Restart your dev server to see the data.");
