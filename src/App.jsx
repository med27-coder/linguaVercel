import { useState, useRef, useEffect } from "react";

// ─── UTILITY ────────────────────────────────────────────────────────────────

const stripMarkdown = (text) => text
  .replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "")
  .replace(/_{3}/g, "").replace(/_{2}/g, "").replace(/(?<![a-zA-Z])_(?![a-zA-Z])/g, "")
  .replace(/^#{1,6}\s+/gm, "").replace(/^---+$/gm, "").replace(/^___+$/gm, "")
  .replace(/`{1,3}/g, "").replace(/^>\s+/gm, "")
  .replace(/\n{3,}/g, "\n\n").trim();

// ─── DATA ────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "fr", name: "French",   nativeScript: "Français",  flag: "🇫🇷", voiceId: "cgSgspJ2msm6clMCkdW9", srLang: "fr-FR", dialect: "Standard (France)",         dialectNote: "Use standard French as spoken in France. Use words like courriel, week-end, smartphone." },
  { code: "es", name: "Spanish",  nativeScript: "Español",   flag: "🇪🇸", voiceId: "EXAVITQu4vr4xnSDxMaL", srLang: "es-ES", dialect: "Castilian (Spain)",         dialectNote: "Use Castilian Spanish from Spain. Use vosotros, ordenador, coche, piso, móvil." },
  { code: "sw", name: "Swahili",  nativeScript: "Kiswahili", flag: "🇰🇪", voiceId: "pFZP5JQG7iQjIQuC4Bku", srLang: "sw-KE", dialect: "Standard (Kiswahili Sanifu)", dialectNote: "Use Standard Swahili (Kiswahili Sanifu), the official form used in East Africa." },
  { code: "en", name: "English",  nativeScript: "English",   flag: "🇺🇸", voiceId: "21m00Tcm4TlvDq8ikWAM", srLang: "en-US", dialect: "American",                  dialectNote: "Use American English vocabulary and spelling. Use elevator, apartment, soccer, chips." },
  { code: "ja", name: "Japanese", nativeScript: "日本語",     flag: "🇯🇵", voiceId: "AZnzlk1XvdvUeBnXmlld", srLang: "ja-JP", dialect: "Standard (Hyojungo)",       dialectNote: "Use standard Japanese (標準語/Hyojungo) as spoken in Tokyo and used in formal settings." },
  { code: "zh", name: "Mandarin", nativeScript: "中文",       flag: "🇨🇳", voiceId: "onwK4e9ZLuTAKqWW03F9", srLang: "zh-CN", dialect: "Simplified",                dialectNote: "Use Simplified Chinese characters (简体中文) as used in Mainland China." },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const TOPICS = [
  { id: "daily",    label: "Daily Life & Small Talk", emoji: "💬", description: "Weather, family, hobbies, casual conversation" },
  { id: "food",     label: "Food & Restaurants",      emoji: "🍽️", description: "Ordering food, describing meals, recipes" },
  { id: "travel",   label: "Travel & Directions",     emoji: "✈️", description: "Airports, hotels, asking for directions" },
  { id: "business", label: "Business & Work",         emoji: "💼", description: "Meetings, emails, professional introductions" },
];

const KEYBOARDS = {
  fr: {
    label: "French AZERTY",
    hint: "Type normally — click the accented characters below to insert them (é, à, ç, œ...)",
    rows: [
      ["A","Z","E","R","T","Y","U","I","O","P"],
      ["Q","S","D","F","G","H","J","K","L","M"],
      ["W","X","C","V","B","N"],
    ],
    specials: ["é","è","ê","ë","à","â","ù","û","ü","ô","ö","î","ï","ç","œ","æ"],
  },
  es: {
    label: "Spanish QWERTY",
    hint: "Type normally — click the accented characters below to insert them (á, é, ñ, ¿, ¡...)",
    rows: [
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L","Ñ"],
      ["Z","X","C","V","B","N","M"],
    ],
    specials: ["á","é","í","ó","ú","ü","¿","¡"],
  },
  sw: {
    label: "Swahili QWERTY",
    hint: "Swahili uses the standard Latin alphabet — type exactly as you would in English",
    rows: [
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L"],
      ["Z","X","C","V","B","N","M"],
    ],
    specials: [],
  },
  ja: {
    label: "Japanese Hiragana",
    hint: "Click keys to insert hiragana directly, or type romaji (e.g. 'a' → あ, 'ka' → か) — the AI understands both",
    rows: [
      ["ろ","ぬ","ふ","あ","う","え","お","や","ゆ","よ"],
      ["た","て","い","す","か","ん","な","に","ら","せ"],
      ["つ","さ","そ","ひ","こ","み","も"],
    ],
    specials: ["っ","ゃ","ゅ","ょ","ぁ","ぃ","ぅ","ぇ","ぉ","ー","。","、","「","」"],
    keyMap: {
      "q":"ろ","w":"ぬ","e":"ふ","r":"あ","t":"う","y":"え","u":"お","i":"や","o":"ゆ","p":"よ",
      "a":"た","s":"て","d":"い","f":"す","g":"か","h":"ん","j":"な","k":"に","l":"ら",";":"せ",
      "z":"つ","x":"さ","c":"そ","v":"ひ","b":"こ","n":"み","m":"も",
    },
  },
  zh: {
    label: "Mandarin Pinyin",
    hint: "Type Pinyin (e.g. 'ni hao', 'wo ai ni') — the AI reads it as Mandarin. The characters shown are just pronunciation hints",
    toneKey: [
      { num: "1", shape: "ā", label: "flat" },
      { num: "2", shape: "á", label: "rising" },
      { num: "3", shape: "ǎ", label: "dip" },
      { num: "4", shape: "à", label: "falling" },
      { num: "·", shape: "",  label: "neutral" },
    ],
    rows: [
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L"],
      ["Z","X","C","V","B","N","M"],
    ],
    charHints: {
      "Q":"去","W":"我","E":"鹅","R":"人","T":"他","Y":"有","U":"五","I":"以","O":"哦","P":"朋",
      "A":"啊","S":"是","D":"的","F":"发","G":"个","H":"好","J":"就","K":"看","L":"了",
      "Z":"在","X":"小","C":"从","V":"鱼","B":"不","N":"你","M":"们",
    },
    specialGroups: [
      { label: "a", chars: ["ā","á","ǎ","à"] },
      { label: "e", chars: ["ē","é","ě","è"] },
      { label: "i", chars: ["ī","í","ǐ","ì"] },
      { label: "o", chars: ["ō","ó","ǒ","ò"] },
      { label: "u", chars: ["ū","ú","ǔ","ù"] },
      { label: "ü", chars: ["ǖ","ǘ","ǚ","ǜ"] },
    ],
  },
};

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const GEMINI_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const ELEVEN_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// ─── KEYBOARD PANEL COMPONENT ────────────────────────────────────────────────

function KeyboardPanel({ kb, langCode, lastTyped, onKeyClick }) {
  const revKeyMap = kb.keyMap
    ? Object.fromEntries(Object.entries(kb.keyMap).map(([k, v]) => [v, k.toUpperCase()]))
    : {};

  const isKeyActive = (key) => {
    if (!lastTyped) return false;
    const lt = lastTyped.toLowerCase();
    if (kb.keyMap) return kb.keyMap[lt] === key || key === lastTyped;
    return key.toLowerCase() === lt || key === lastTyped;
  };

  const renderKeyLabel = (key) => {
    if (langCode === "ja") return (
      <>
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{revKeyMap[key] || ""}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", lineHeight: 1 }}>{key}</span>
      </>
    );
    if (langCode === "zh" && kb.charHints?.[key]) return (
      <>
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{key}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", lineHeight: 1 }}>{kb.charHints[key]}</span>
      </>
    );
    return key;
  };

  return (
    <div style={styles.kbPanel}>
      {kb.hint && <div style={styles.kbHint}>{kb.hint}</div>}

      {kb.toneKey && (
        <div style={styles.toneKeyRow}>
          <span style={styles.toneKeyTitle}>Tones:</span>
          {kb.toneKey.map(({ num, shape, label }) => (
            <span key={num} style={styles.toneKeyItem}>
              <span style={styles.toneKeyNum}>{num}</span>
              {shape && <span style={styles.toneKeyShape}>{shape}</span>}
              <span style={styles.toneKeyLabel}>{label}</span>
            </span>
          ))}
        </div>
      )}

      {kb.rows.map((row, ri) => (
        <div key={ri} style={styles.kbRow}>
          {row.map((key) => (
            <button
              key={key}
              style={{ ...styles.kbKey, ...(isKeyActive(key) ? styles.kbKeyActive : {}) }}
              onClick={() => onKeyClick(key.toLowerCase())}
            >
              {renderKeyLabel(key)}
            </button>
          ))}
        </div>
      ))}

      {kb.specialGroups?.map((group) => (
        <div key={group.label} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
          <span style={styles.kbGroupLabel}>{group.label}:</span>
          {group.chars.map((key) => (
            <button
              key={key}
              style={{ ...styles.kbKey, ...styles.kbKeySpecial, ...(isKeyActive(key) ? styles.kbKeyActive : {}) }}
              onClick={() => onKeyClick(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}

      {kb.specials && kb.specials.length > 0 && (
        <div style={{ ...styles.kbRow, flexWrap: "wrap", gap: 3, marginTop: 2 }}>
          {kb.specials.map((key) => (
            <button
              key={key}
              style={{ ...styles.kbKey, ...styles.kbKeySpecial, ...(isKeyActive(key) ? styles.kbKeyActive : {}) }}
              onClick={() => onKeyClick(key)}
            >
              {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP COMPONENT ───────────────────────────────────────────────────────────

export default function App() {

  // --- Settings (persist across sessions) ---
  const [selectedLang, setSelectedLang] = useState(null);
  const [level,        setLevel]        = useState("Beginner");
  const [topic,        setTopic]        = useState(TOPICS[0]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoCorrect,  setAutoCorrect]  = useState(true);
  const [nativeLang,   setNativeLang]   = useState("English");

  // --- Session ---
  const [started,     setStarted]     = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [corrections, setCorrections] = useState(0);
  const [loading,     setLoading]     = useState(false);

  // --- Input ---
  const [input,       setInput]       = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastTyped,   setLastTyped]   = useState("");

  // --- Keyboard ---
  const [kbOpen, setKbOpen] = useState(false);

  const bottomRef      = useRef(null);
  const recognitionRef = useRef(null);

  // ── Effects ───────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!input) { setLastTyped(""); return; }
    setLastTyped(input[input.length - 1]);
    const t = setTimeout(() => setLastTyped(""), 600);
    return () => clearTimeout(t);
  }, [input]);

  // ── Voice input ───────────────────────────────────────────

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");
    if (isListening) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang?.srLang || "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript || loading) return;
      setInput("");
      const userMessage    = { role: "user", content: transcript };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      sendToGemini(updatedMessages);
    };
    recognition.start();
  };

  // ── System prompt ─────────────────────────────────────────

  const buildSystemPrompt = (lang, lvl) => {
    const native = nativeLang.trim() || "English";
    return `
You are Lingua, an expert AI language tutor for ${lang.name}.
The student's level is: ${lvl}.
The student's native language is ${native}. Always use ${native} for all translations, explanations, and suggested sentence meanings — never use any other language for these.
The conversation topic is: ${topic.label} — ${topic.description}. Keep all conversation, vocabulary, and suggested sentences focused on this topic.
${lang.dialectNote ? `Important dialect rule: ${lang.dialectNote} Do not mix in vocabulary from other regional variants.` : ""}

NEVER use markdown: no **, no *, no _, no #, no ---, no backticks. Plain text only.
For ALL phonetic notation: use simple Latin letters and hyphens only. NEVER use IPA symbols (ʁ ɔ ɥ ʒ õ ɛ ə ɑ ŋ etc). Stress the loudest syllable in CAPS. Example: "bon-ZHOOR", "koh-MAH".
${lang.code === "zh" ? "For Mandarin phonetics: use numbered tone pinyin — write the tone number after each syllable (e.g. ni3 hao3, wo3 ai4 ni3, xie4 xie). This is essential so the student learns the correct tones." : ""}
${lang.code === "ja" ? "For Japanese phonetics: use romaji with hyphens between syllables and CAPS on the stressed mora (e.g. ko-NI-chi-wa, a-ri-GA-to go-ZA-i-mas)." : ""}
${autoCorrect ? `If the student makes a grammar or spelling error, add a line "💡 Correction: [corrected sentence]" before anything else.` : "Do not explicitly correct errors."}

${lvl === "Beginner" ? `You MUST follow this EXACT format every reply:

[Your conversational reply in ${lang.name} — 2 to 3 simple sentences]
(${native} translation of your reply)

🔊 Pronunciation: word1 [phonetic1] · word2 [phonetic2] · word3 [phonetic3]

💬 Try saying:
• [full sentence in ${lang.name}] [phonetic] — [${native} meaning]
• [full sentence in ${lang.name}] [phonetic] — [${native} meaning]
• [full sentence in ${lang.name}] [phonetic] — [${native} meaning]

Use simple vocabulary and short sentences only.`

: lvl === "Intermediate" ? `You MUST follow this EXACT format every reply:

[Your conversational reply in ${lang.name} — 2 to 3 sentences]
(${native} translation of your reply)

💬 Try saying:
• [full sentence in ${lang.name}] — [${native} meaning]
• [full sentence in ${lang.name}] — [${native} meaning]
• [full sentence in ${lang.name}] — [${native} meaning]

Do NOT include a pronunciation section unless the student explicitly asks for pronunciation of a word or phrase — in that case provide it on a line starting with "🔊 Pronunciation:" then resume normal format. Mix simple and complex structures.`

: `Respond naturally in ${lang.name} only — no ${native} translation, no pronunciation section, no suggested sentences. Speak to the student as you would a native speaker. If the student explicitly asks for pronunciation of a word or phrase, provide it on a line starting with "🔊 Pronunciation:" then resume normal conversation. Use natural, native-level language.`}

Start by greeting the student warmly in ${lang.name}.
`;
  };

  // ── Session management ────────────────────────────────────

  const startSession = () => {
    if (!selectedLang) return;
    setStarted(true);
    setCorrections(0);
    setKbOpen(false);
    setMessages([{
      role: "system",
      content: `ℹ️ Voice recognition is set to ${selectedLang.nativeScript} (${selectedLang.name}). For best results, speak in ${selectedLang.name}.\n\nNo ${selectedLang.name} keyboard? No problem — you can type the pronunciation in Latin letters (e.g. "ni hao", "bonjour", "hola") and the AI will understand you.`,
    }]);
    sendToGemini([], true);
  };

  // ── Gemini API ────────────────────────────────────────────

  const sendToGemini = async (history, isGreeting = false) => {
    setLoading(true);
    try {
      const systemPrompt   = buildSystemPrompt(selectedLang, level);
      const geminiMessages = isGreeting
        ? [{ role: "user", parts: [{ text: "Please greet me and start our conversation." }] }]
        : history
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role:  m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }],
            }));

      const res  = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
          }),
        }
      );
      const data  = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`);
      const reply = stripMarkdown(data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond.");

      if (reply.includes("💡 Correction:")) setCorrections((c) => c + 1);

      if (isGreeting) {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        setMessages([...history, { role: "assistant", content: reply }]);
      }

      if (voiceEnabled) await speakWithElevenLabs(reply, selectedLang.voiceId);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI. Check your API keys." }]);
    }
    setLoading(false);
  };

  // ── ElevenLabs TTS ────────────────────────────────────────

  const speakWithElevenLabs = async (text, voiceId) => {
    if (!ELEVEN_KEY) {
      setVoiceEnabled(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Voice disabled: ElevenLabs API key not configured." }]);
      return;
    }
    try {
      const cleanText = text
        .replace(/💡 Correction:.*$/gm, "")
        .replace(/^\(.*\)$/gm, "")
        .split("🔊 Pronunciation:")[0]
        .split("💬 Try saying:")[0]
        .trim();
      if (!cleanText) return;

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": ELEVEN_KEY },
        body:    JSON.stringify({
          text: cleanText,
          model_id:       "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail?.message || `ElevenLabs error ${res.status}`);
      }
      const url   = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      const revokeUrl = () => URL.revokeObjectURL(url);
      audio.onended = revokeUrl;
      audio.onerror = revokeUrl;
      audio.play().catch(revokeUrl);
    } catch (err) {
      console.error("ElevenLabs error:", err);
      setVoiceEnabled(false);
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Voice error: ${err.message}. Voice disabled.` }]);
    }
  };

  // ── Message input handlers ────────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage     = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    await sendToGemini(updatedMessages);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Landing page ──────────────────────────────────────────

  if (!started) {
    return (
      <div style={styles.page}>
        <div style={styles.landing}>
          <div style={styles.logo}>🌐 Lingua</div>
          <p style={styles.tagline}>Your AI-powered language conversation coach</p>

          <div style={styles.section}>
            <label style={styles.label}>Choose a Language</label>
            <div style={styles.langGrid}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  style={{ ...styles.langBtn, ...(selectedLang?.code === lang.code ? styles.langBtnActive : {}) }}
                  onClick={() => setSelectedLang(lang)}
                >
                  <span style={{ fontSize: 28 }}>{lang.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{lang.nativeScript}</span>
                  {lang.dialect && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{lang.dialect}</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Your Level</label>
            <div style={styles.levelRow}>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  style={{ ...styles.levelBtn, ...(level === l ? styles.levelBtnActive : {}) }}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Conversation Topic</label>
            <div style={styles.topicGrid}>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  style={{ ...styles.topicBtn, ...(topic.id === t.id ? styles.topicBtnActive : {}) }}
                  onClick={() => setTopic(t)}
                >
                  <span style={{ fontSize: 22 }}>{t.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.toggleRow}>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
              🔊 Voice responses (ElevenLabs)
            </label>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={autoCorrect} onChange={(e) => setAutoCorrect(e.target.checked)} />
              ✏️ Auto-correct my mistakes
            </label>
          </div>

          <div style={styles.landingDisclaimer}>
            ℹ️ Voice recognition listens in the selected language. No native keyboard? You can type pronunciations in Latin letters (e.g. "ni hao", "konnichiwa", "bonjour") and the AI will understand you.
          </div>

          <button
            style={{ ...styles.startBtn, ...(selectedLang ? {} : styles.startBtnDisabled) }}
            onClick={startSession}
            disabled={!selectedLang}
          >
            Start Conversation →
          </button>
        </div>
      </div>
    );
  }

  // ── Chat page ─────────────────────────────────────────────

  const kb = KEYBOARDS[selectedLang.code] || null;

  return (
    <div style={styles.page}>
      <div style={styles.chatWrapper}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => {
            recognitionRef.current?.stop();
            setInput("");
            setLoading(false);
            setStarted(false);
          }}>← Back</button>
          <div style={styles.headerCenter}>
            <span style={{ fontSize: 22 }}>{selectedLang.flag}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{selectedLang.name}</span>
            <span style={styles.levelBadge}>{level}</span>
            <span style={styles.topicBadge}>{topic.emoji} {topic.label}</span>
          </div>
          <div style={styles.stats}>
            💬 {messages.filter((m) => m.role !== "system").length} &nbsp; ✏️ {corrections}
          </div>
        </div>

        {/* Native language bar */}
        <div style={styles.nativeLangBar}>
          <span style={styles.nativeLangLabel}>🌍 My language:</span>
          <input
            style={styles.nativeLangInput}
            value={nativeLang}
            onChange={(e) => setNativeLang(e.target.value)}
            placeholder="English"
            spellCheck={false}
          />
          <span style={styles.nativeLangHint}>— set once, remembered for this session</span>
        </div>

        {/* Message list */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            msg.role === "system"
              ? <div key={i} style={styles.systemMsg}>{msg.content}</div>
              : <div key={i} style={{ ...styles.bubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
                  {msg.role === "assistant" && <div style={styles.aiLabel}>🌐 Lingua</div>}
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.content}</div>
                </div>
          ))}
          {loading && (
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <div style={styles.aiLabel}>🌐 Lingua</div>
              <div>...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Keyboard toggle */}
        {kb && (
          <div style={styles.kbToggleBar}>
            <button style={styles.kbToggleBtn} onClick={() => setKbOpen((o) => !o)}>
              ⌨️ {kb.label} {kbOpen ? "▲" : "▼"}
            </button>
          </div>
        )}

        {/* Keyboard panel */}
        {kbOpen && kb && (
          <KeyboardPanel
            kb={kb}
            langCode={selectedLang.code}
            lastTyped={lastTyped}
            onKeyClick={(char) => setInput((prev) => prev + char)}
          />
        )}

        {/* Input row */}
        <div style={styles.inputRow}>
          <textarea
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type or speak in ${selectedLang.name} or ${nativeLang.trim() || "English"}...`}
            rows={2}
            disabled={loading}
          />
          <button
            style={{ ...styles.micBtn, background: isListening ? "#ef4444" : "rgba(255,255,255,0.15)" }}
            onClick={startListening}
            disabled={loading}
          >
            {isListening ? "🔴" : "🎤"}
          </button>
          <button style={styles.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = {

  // ── Shared ────────────────────────────────────────────────
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif", color: "#fff", padding: 16,
  },

  // ── Landing page ──────────────────────────────────────────
  landing: {
    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
    borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 520,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)",
  },
  logo:    { fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 8, letterSpacing: -1 },
  tagline: { textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: 32, fontSize: 14 },
  section: { marginBottom: 24 },
  label:   { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", marginBottom: 12 },

  langGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  langBtn:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "#fff", transition: "all 0.2s" },
  langBtnActive:{ border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)", boxShadow: "0 0 16px rgba(124,106,247,0.4)" },

  levelRow:      { display: "flex", gap: 10 },
  levelBtn:      { flex: 1, padding: "10px 0", borderRadius: 10, border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  levelBtnActive:{ border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)" },

  topicGrid:      { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  topicBtn:       { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 14px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "#fff", textAlign: "left", transition: "all 0.2s" },
  topicBtnActive: { border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)", boxShadow: "0 0 16px rgba(124,106,247,0.4)" },

  toggleRow:    { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 },
  toggleLabel:  { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)", cursor: "pointer" },
  landingDisclaimer: { fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, lineHeight: 1.6, textAlign: "center" },

  startBtn:        { width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c6af7, #a78bfa)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 4px 20px rgba(124,106,247,0.5)" },
  startBtnDisabled:{ opacity: 0.4, cursor: "not-allowed" },

  // ── Chat: layout & header ─────────────────────────────────
  chatWrapper: { display: "flex", flexDirection: "column", width: "100%", maxWidth: 680, height: "90vh", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" },
  header:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" },
  backBtn:     { background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 },
  headerCenter:{ display: "flex", alignItems: "center", gap: 8 },
  levelBadge:  { fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(124,106,247,0.4)", fontWeight: 600 },
  topicBadge:  { fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(167,139,250,0.3)", fontWeight: 600 },
  stats:       { fontSize: 13, color: "rgba(255,255,255,0.5)" },

  // ── Chat: messages ────────────────────────────────────────
  messages:  { flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 },
  systemMsg: { alignSelf: "center", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 16px", maxWidth: "90%", whiteSpace: "pre-wrap", lineHeight: 1.6 },
  bubble:    { maxWidth: "80%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.5 },
  aiBubble:  { background: "rgba(124,106,247,0.2)", border: "1px solid rgba(124,106,247,0.3)", alignSelf: "flex-start" },
  userBubble:{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", alignSelf: "flex-end" },
  aiLabel:   { fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },

  // ── Chat: input row ───────────────────────────────────────
  inputRow: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", alignItems: "center" },
  input:    { flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff", padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" },
  micBtn:   { padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 16 },
  sendBtn:  { padding: "0 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c6af7, #a78bfa)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, height: 44 },

  // ── Keyboard ──────────────────────────────────────────────
  kbToggleBar: { padding: "6px 16px", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "center" },
  kbToggleBtn: { background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 11, padding: "4px 18px", fontFamily: "inherit", letterSpacing: 0.5 },
  kbPanel:     { background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 5, maxHeight: 210, overflowY: "auto" },
  kbRow:       { display: "flex", justifyContent: "center", gap: 4 },
  kbKey:       { minWidth: 28, height: 34, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 7px", transition: "background 0.12s, box-shadow 0.12s, border-color 0.12s", userSelect: "none" },
  kbKeyActive: { background: "rgba(124,106,247,0.55)", border: "1px solid #a78bfa", boxShadow: "0 0 10px rgba(167,139,250,0.7)" },
  kbHint:      { fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "2px 8px 6px", lineHeight: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 },
  kbGroupLabel:{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontStyle: "italic", minWidth: 10, textAlign: "right" },
  toneKeyRow:  { display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "4px 8px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4, flexWrap: "wrap" },
  toneKeyTitle:{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontStyle: "italic", marginRight: 2 },
  toneKeyItem: { display: "flex", alignItems: "center", gap: 3 },
  toneKeyNum:  { fontSize: 11, fontWeight: 700, color: "#a78bfa", minWidth: 8, textAlign: "center" },
  toneKeyShape:{ fontSize: 11, color: "rgba(255,255,255,0.6)" },
  toneKeyLabel:{ fontSize: 9, color: "rgba(255,255,255,0.35)" },
  kbKeySpecial:{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", fontSize: 12, minWidth: 26, padding: "0 6px" },

  // ── Native language bar ───────────────────────────────────
  nativeLangBar:   { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 16px", background: "rgba(251,191,36,0.08)", borderBottom: "2px solid rgba(251,191,36,0.5)", flexShrink: 0 },
  nativeLangLabel: { fontSize: 11, color: "#fbbf24", whiteSpace: "nowrap", fontWeight: 600 },
  nativeLangHint:  { fontSize: 10, color: "rgba(251,191,36,0.5)", whiteSpace: "nowrap", fontStyle: "italic" },
  nativeLangInput: { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 8, color: "#fff", padding: "3px 10px", fontSize: 12, outline: "none", fontFamily: "inherit", textAlign: "center", width: 120 },
};
