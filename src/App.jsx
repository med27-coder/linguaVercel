import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "fr", name: "French", flag: "🇫🇷", voiceId: "cgSgspJ2msm6clMCkdW9", srLang: "fr-FR" },
  { code: "es", name: "Spanish", flag: "🇪🇸", voiceId: "EXAVITQu4vr4xnSDxMaL", srLang: "es-ES" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", voiceId: "pFZP5JQG7iQjIQuC4Bku", srLang: "sw-KE" },
  { code: "en", name: "English", flag: "🇺🇸", voiceId: "21m00Tcm4TlvDq8ikWAM", srLang: "en-US" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", voiceId: "AZnzlk1XvdvUeBnXmlld", srLang: "ja-JP" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", voiceId: "onwK4e9ZLuTAKqWW03F9", srLang: "zh-CN" },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const TOPICS = [
  { id: "daily", label: "Daily Life & Small Talk", emoji: "💬", description: "Weather, family, hobbies, casual conversation" },
  { id: "food",  label: "Food & Restaurants",      emoji: "🍽️", description: "Ordering food, describing meals, recipes" },
  { id: "travel",label: "Travel & Directions",     emoji: "✈️", description: "Airports, hotels, asking for directions" },
  { id: "business",label:"Business & Work",        emoji: "💼", description: "Meetings, emails, professional introductions" },
];

const GEMINI_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const ELEVEN_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

export default function App() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [level, setLevel] = useState("Beginner");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [corrections, setCorrections] = useState(0);
  const [started, setStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang?.srLang || "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => { const transcript = e.results[0][0].transcript; setInput(transcript); setTimeout(() => handleSend(), 500); };
    recognition.start();
  };

  const buildSystemPrompt = (lang, lvl) => `
You are Lingua, an expert AI language tutor for ${lang.name}.
The student's level is: ${lvl}.
The conversation topic is: ${topic.label} — ${topic.description}. Keep all conversation, vocabulary, and suggested sentences focused on this topic.

You MUST follow this exact response format every single time, no exceptions:

[Your conversational reply in ${lang.name} — 2 to 3 sentences max]
(English translation of your reply)

🔊 Pronunciation: [every key word from your reply with phonetic guide separated by · e.g. Hola [OH-lah] · estás [es-TAHS] · bien [BYEN]]

💬 Try saying:
• [suggested sentence in ${lang.name}] [phonetic] — [English meaning]
• [suggested sentence in ${lang.name}] [phonetic] — [English meaning]
• [suggested sentence in ${lang.name}] [phonetic] — [English meaning]

Additional rules:
- ${autoCorrect ? `If the student makes a grammar or spelling error, add a 💡 Correction: line before the pronunciation section.` : "Do not explicitly correct errors."}
- Always suggest exactly 3 sentences the student can realistically say next
- Always include phonetic pronunciation for every key word in the reply
- For Beginner: simple vocabulary and short sentences only
- For Intermediate: mix simple and complex structures
- For Advanced: natural, native-level language

Start by greeting the student warmly in ${lang.name}.
`;

  const startSession = () => {
    if (!selectedLang) return;
    setStarted(true);
    setMessages([]);
    setCorrections(0);
    sendToGemini([], true);
  };

  const sendToGemini = async (history, isGreeting = false) => {
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(selectedLang, level);
      const geminiMessages = isGreeting
        ? [{ role: "user", parts: [{ text: "Please greet me and start our conversation." }] }]
        : history.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`);
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond.";

      if (reply.includes("💡 Correction:")) setCorrections((c) => c + 1);

      const newMessages = isGreeting
        ? [{ role: "assistant", content: reply }]
        : [...history, { role: "assistant", content: reply }];

      setMessages(newMessages);

      if (voiceEnabled) await speakWithElevenLabs(reply, selectedLang.voiceId);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI. Check your API keys." }]);
    }
    setLoading(false);
  };

  const speakWithElevenLabs = async (text, voiceId) => {
    if (!ELEVEN_KEY) {
      setVoiceEnabled(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Voice disabled: ElevenLabs API key not configured." }]);
      return;
    }
    try {
      const cleanText = text.replace(/💡 Correction:.*$/gm, "").trim();
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail?.message || `ElevenLabs error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      new Audio(url).play();
    } catch (err) {
      console.error("ElevenLabs error:", err);
      setVoiceEnabled(false);
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Voice error: ${err.message}. Voice disabled.` }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    await sendToGemini(updatedMessages);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  return (
    <div style={styles.page}>
      <div style={styles.chatWrapper}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setStarted(false)}>← Back</button>
          <div style={styles.headerCenter}>
            <span style={{ fontSize: 22 }}>{selectedLang.flag}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{selectedLang.name}</span>
            <span style={styles.levelBadge}>{level}</span>
            <span style={styles.topicBadge}>{topic.emoji} {topic.label}</span>
          </div>
          <div style={styles.stats}>
            💬 {messages.length} &nbsp; ✏️ {corrections}
          </div>
        </div>

        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.bubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
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

        <div style={styles.inputRow}>
          <textarea
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type or speak in ${selectedLang.name} or English...`}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#fff",
    padding: 16,
  },
  landing: {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  logo: { fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 8, letterSpacing: -1 },
  tagline: { textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: 32, fontSize: 14 },
  section: { marginBottom: 24 },
  label: { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", marginBottom: 12 },
  langGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  langBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "14px 8px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "#fff",
    transition: "all 0.2s",
  },
  langBtnActive: { border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)", boxShadow: "0 0 16px rgba(124,106,247,0.4)" },
  levelRow: { display: "flex", gap: 10 },
  levelBtn: {
    flex: 1, padding: "10px 0", borderRadius: 10, border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  levelBtnActive: { border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)" },
  topicGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  topicBtn: {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
    padding: "12px 14px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "#fff",
    textAlign: "left", transition: "all 0.2s",
  },
  topicBtnActive: { border: "2px solid #7c6af7", background: "rgba(124,106,247,0.25)", boxShadow: "0 0 16px rgba(124,106,247,0.4)" },
  topicBadge: { fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(167,139,250,0.3)", fontWeight: 600 },
  toggleRow: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 },
  toggleLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)", cursor: "pointer" },
  startBtn: {
    width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #7c6af7, #a78bfa)", color: "#fff",
    fontWeight: 700, fontSize: 16, cursor: "pointer", letterSpacing: 0.5,
    boxShadow: "0 4px 20px rgba(124,106,247,0.5)",
  },
  startBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  chatWrapper: {
    display: "flex", flexDirection: "column", width: "100%", maxWidth: 680,
    height: "90vh", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
    borderRadius: 24, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.2)",
  },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 },
  headerCenter: { display: "flex", alignItems: "center", gap: 8 },
  levelBadge: { fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(124,106,247,0.4)", fontWeight: 600 },
  stats: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 },
  bubble: { maxWidth: "80%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.5 },
  aiBubble: { background: "rgba(124,106,247,0.2)", border: "1px solid rgba(124,106,247,0.3)", alignSelf: "flex-start" },
  userBubble: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", alignSelf: "flex-end" },
  aiLabel: { fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  inputRow: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", alignItems: "center" },
  input: {
    flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12, color: "#fff", padding: "10px 14px", fontSize: 14, resize: "none",
    outline: "none", fontFamily: "inherit",
  },
  micBtn: {
    padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 16,
  },
  sendBtn: {
    padding: "0 20px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #7c6af7, #a78bfa)", color: "#fff",
    fontWeight: 700, cursor: "pointer", fontSize: 14, height: 44,
  },
};