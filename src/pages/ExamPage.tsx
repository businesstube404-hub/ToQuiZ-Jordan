import { useState, useEffect, useRef } from "react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface Lesson {
  title: string;
  questions: Question[];
}

type View = "home" | "subjects" | "subject" | "exam" | "result" | "review" | "tips" | "plan" | "timer";

const SUBJECTS = [
  { id: "deen", name: "تربية إسلامية", icon: "🕌" },
  { id: "math", name: "رياضيات", icon: "📐" },
  { id: "arabic", name: "لغة عربية", icon: "📖" },
  { id: "history", name: "تاريخ الأردن", icon: "🏛️" },
];

const DEEN_LESSONS = [
  { title: "الدرس الأول: سورة آل عمران (الآيات 102-105)", range: [0, 30] },
  { title: "الدرس الثاني: الحديث الشريف — اتقاء الشبهات", range: [30, 60] },
];

export default function ExamPage() {
  const [view, setView] = useState<View>("home");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentSubject, setCurrentSubject] = useState<{ id: string; name: string } | null>(null);
  const [currentLesson, setCurrentLesson] = useState<string>("");
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedNow, setSelectedNow] = useState<number | null>(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", mins: "00" });
  const [planResult, setPlanResult] = useState("");
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [timerInput, setTimerInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecsRef = useRef(0);

  const basePath = import.meta.env.BASE_URL || "/";

  useEffect(() => {
    const url = basePath.endsWith("/") ? `${basePath}questions.json` : `${basePath}/questions.json`;
    fetch(url).then(r => r.json()).then((data: Question[]) => setAllQuestions(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const examDate = new Date("June 20, 2026 00:00:00").getTime();
    const tick = () => {
      const dist = examDate - Date.now();
      if (dist < 0) return;
      setCountdown({
        days: String(Math.floor(dist / 86400000)).padStart(2, "0"),
        hours: String(Math.floor((dist % 86400000) / 3600000)).padStart(2, "0"),
        mins: String(Math.floor((dist % 3600000) / 60000)).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const goTo = (v: View) => { setView(v); window.scrollTo(0, 0); };

  const openSubject = (sub: { id: string; name: string }) => {
    setCurrentSubject(sub);
    goTo("subject");
  };

  const startLesson = (lessonTitle: string, qs: Question[]) => {
    if (qs.length === 0) return;
    setCurrentLesson(lessonTitle);
    setExamQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setSelectedNow(null);
    setIsAutoAdvancing(false);
    goTo("exam");
  };

  const handleSelectOption = (optIdx: number) => {
    if (isAutoAdvancing) return;
    const q = examQuestions[currentIndex];
    if (answers[q.id] !== undefined) return;

    setSelectedNow(optIdx);
    setIsAutoAdvancing(true);
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));

    setTimeout(() => {
      setSelectedNow(null);
      setIsAutoAdvancing(false);
      if (currentIndex + 1 >= examQuestions.length) {
        goTo("result");
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 600);
  };

  const handlePrev = () => {
    if (currentIndex === 0 || isAutoAdvancing) return;
    setCurrentIndex(i => i - 1);
    setSelectedNow(null);
  };

  const correctCount = examQuestions.filter(q => answers[q.id] === q.correct).length;
  const score = examQuestions.length > 0 ? Math.round((correctCount / examQuestions.length) * 100) : 0;
  const wrongQuestions = examQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.correct);
  const correctQuestions = examQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] === q.correct);

  const shareResult = (platform: string) => {
    const text = encodeURIComponent(`أنهيت تدريبي للتو وحصلت على ${score}% في منصة ToQuiz! جربوها الآن!`);
    const url = encodeURIComponent("https://toquiz.online");
    const urls: Record<string, string> = {
      wa: `https://wa.me/?text=${text} ${url}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      tg: `https://t.me/share/url?url=${url}&text=${text}`,
    };
    window.open(urls[platform], "_blank");
  };

  const generatePlan = () => {
    const subjectEl = document.getElementById("sp-subject") as HTMLSelectElement;
    const totalEl = document.getElementById("sp-total") as HTMLInputElement;
    const completedEl = document.getElementById("sp-completed") as HTMLInputElement;
    const levelEl = document.getElementById("sp-level") as HTMLSelectElement;
    const subject = subjectEl?.value || "";
    const total = parseInt(totalEl?.value) || 0;
    const completed = parseInt(completedEl?.value) || 0;
    const level = levelEl?.value || "medium";
    const remaining = total - completed;
    if (remaining <= 0 || total <= 0) { alert("يرجى إدخال أرقام صحيحة!"); return; }
    const templates: Record<string, { schedule: string[]; speed: number; time: string }> = {
      weak: { schedule: ["دراسة (نصف درس)", "دراسة (نصف درس)", "مراجعة وتثبيت", "دراسة (درس)", "مراجعة خفيفة", "دراسة (نصف درس)", "راحة ☕"], speed: 2.5, time: "ساعتان تقريباً" },
      medium: { schedule: ["دراسة (درس)", "دراسة (درس)", "مراجعة", "دراسة (درس)", "دراسة (درس)", "دراسة (درس)", "راحة ☕"], speed: 5, time: "ساعة ونصف تقريباً" },
      strong: { schedule: ["دراسة (درسين)", "دراسة (درس)", "دراسة (درسين)", "دراسة (درس)", "دراسة (درسين)", "مراجعة سريعة", "راحة ☕"], speed: 8, time: "ساعة إلى ساعة ونصف" },
    };
    const plan = templates[level];
    const daysNeeded = Math.ceil((remaining / plan.speed) * 7);
    setPlanResult(`<div style="font-family:'Cairo',sans-serif;direction:rtl">
      <h3 style="color:#050505;margin-bottom:12px;font-weight:800">الخطة الأسبوعية لمادة ${subject}</h3>
      <div style="background:rgba(10,61,98,0.06);padding:14px;border-radius:12px;margin-bottom:16px;border:1px dashed #0a3d62">
        <p style="margin-bottom:6px"><strong>📚 الدروس المتبقية:</strong> ${remaining}</p>
        <p style="margin-bottom:6px"><strong>⏱️ وقت يومي:</strong> ${plan.time}</p>
        <p><strong>⏳ الأيام المتوقعة:</strong> ${daysNeeded} يوم</p>
      </div>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px">
        ${plan.schedule.map((t, i) => `<li style="background:#f8f9fa;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;display:flex;justify-content:space-between"><strong style="color:#050505">اليوم ${i + 1}</strong><span>${t}</span></li>`).join("")}
      </ul>
    </div>`);
  };

  const startTimer = () => {
    const mins = parseInt(timerInput);
    if (isNaN(mins) || mins <= 0) { alert("يرجى كتابة مدة صحيحة بالدقائق ⏱️"); return; }
    if (timerRef.current) clearInterval(timerRef.current);
    timerSecsRef.current = mins * 60;
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    setTimerDisplay(fmt(timerSecsRef.current));
    timerRef.current = setInterval(() => {
      timerSecsRef.current--;
      setTimerDisplay(fmt(timerSecsRef.current));
      if (timerSecsRef.current <= 0) {
        clearInterval(timerRef.current!);
        alert("انتهى وقت الدراسة! خذ استراحة قصيرة ☕");
        setTimerInput("");
        setTimerDisplay("00:00");
      }
    }, 1000);
  };

  const currentQ = examQuestions[currentIndex];

  const getOptionStyle = (idx: number): React.CSSProperties => {
    if (selectedNow === idx) {
      return { background: "#0a3d62", borderColor: "#0a3d62", color: "#fff" };
    }
    if (answers[currentQ?.id] !== undefined) {
      return { background: "#f0f0f0", borderColor: "#e2e8f0", color: "#aaa", opacity: 0.65 };
    }
    return { background: "#f8f9fa", borderColor: "#e2e8f0", color: "#111" };
  };

  const sectionTitle = (text: string) => (
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#050505", marginBottom: 22, borderRight: "5px solid #0a3d62", paddingRight: 14 }}>{text}</h2>
  );

  const backBtn = (label: string, to: View) => (
    <button onClick={() => goTo(to)} style={{ background: "transparent", border: "2px solid #0a3d62", color: "#0a3d62", padding: "10px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginBottom: 22, fontSize: 14 }}>
      ← {label}
    </button>
  );

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl", background: "#f8f9fa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        .subject-card { background:#fff; border:2px solid #e2e8f0; padding:30px 20px; text-align:center; cursor:pointer; transition:all 0.3s; border-radius:20px; }
        .subject-card:hover { border-color:#0a3d62; transform:translateY(-8px); box-shadow:0 15px 35px rgba(10,61,98,0.2); }
        .opt-btn:not(:disabled):hover { border-color:#0a3d62 !important; background:#eff6ff !important; color:#0a3d62 !important; }
        .nav-btn { background:transparent; border:none; color:#fff; font-weight:700; font-size:14px; cursor:pointer; font-family:'Cairo',sans-serif; padding:0; transition:0.2s; }
        .nav-btn:hover { color:#6db3f2; }
        .test-card { background:#fff; padding:22px; border-radius:20px; box-shadow:0 10px 30px -10px rgba(10,61,98,0.12); border:1px solid #e2e8f0; border-right:4px solid #0a3d62; }
        .tip-card { background:#fff; padding:30px; border-radius:20px; box-shadow:0 10px 30px -10px rgba(10,61,98,0.12); border:1px solid #e2e8f0; border-top:6px solid #0a3d62; margin-bottom:25px; }
        .lesson-card { background:#f8f9fa; border:1px solid #e2e8f0; border-radius:16px; padding:20px; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s; }
        .lesson-card:hover { border-color:#0a3d62; background:#eff6ff; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#050505", borderBottom: "4px solid #0a3d62", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => goTo("home")}>
            <img src={`${basePath}logo.jpeg`} alt="ToQuiz" style={{ width: 46, height: 46, borderRadius: 12, objectFit: "contain", background: "#fff", padding: 2 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>ToQuiz</div>
              <div style={{ color: "#ccc", fontSize: 12 }}>لجيل 2009 و 2010</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
            <button className="nav-btn" onClick={() => goTo("home")}>الرئيسية</button>
            <button className="nav-btn" onClick={() => goTo("subjects")}>المواد</button>
            <button className="nav-btn" onClick={() => goTo("plan")}>خطة الدراسة</button>
            <button className="nav-btn" onClick={() => goTo("timer")}>المؤقت</button>
            <button className="nav-btn" onClick={() => goTo("tips")}>نصائح وأدعية</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 16px" }}>

        {/* ══════════ HOME ══════════ */}
        {view === "home" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #050505, #0a3d62)", borderRadius: 20, padding: "32px 24px", textAlign: "center", color: "#fff", marginBottom: 28 }}>
              <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 22 }}>كم بقي للامتحان الوزاري؟ ⏳</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                {[{ v: countdown.days, l: "يوم" }, { v: countdown.hours, l: "ساعة" }, { v: countdown.mins, l: "دقيقة" }].map(({ v, l }) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", padding: "14px 18px", borderRadius: 16, minWidth: 85 }}>
                    <span style={{ display: "block", fontSize: 38, fontWeight: 900 }}>{v}</span>
                    <small style={{ fontSize: 13 }}>{l}</small>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: "26px 24px", boxShadow: "0 10px 30px -10px rgba(10,61,98,0.1)", border: "1px solid #e2e8f0", borderBottom: "5px solid #050505", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
              {[{ icon: "👥", num: "500+", label: "طالب طموح" }, { icon: "📋", num: "1,200+", label: "سؤال وزاري" }, { icon: "⏱️", num: "50+", label: "امتحان شامل" }].map(({ icon, num, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#050505" }}>{num}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 28 }}>
              {sectionTitle("ابدأ الامتحان مباشرة 🎯")}
              <button onClick={() => goTo("subjects")} style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "14px 36px", borderRadius: 14, fontWeight: 800, fontSize: 18, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                اختر مادة وابدأ →
              </button>
            </div>

            <div>
              {sectionTitle("ماذا يقول الطلاب عنا؟ 💬")}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { name: "أحمد خالد", text: '"الموقع ساعدني كثيرًا في فهم نمط أسئلة الوزارة، التصميم مريح والمحاكاة حقيقية."' },
                  { name: "سارة محمود", text: '"أفضل موقع لحل أسئلة التوجيهي بطريقة سهلة. التحديث التلقائي رهيب!"' },
                  { name: "يوسف علي", text: '"شكراً لمنصة ToQuiz، كنت خايف من مادة التربية بس بنك الأسئلة شمل كل الأفكار."' },
                  { name: "ليان عبدالله", text: '"تجربة الاختبار مع الانتقال التلقائي ممتازة خلتني أتعود على ضغط الوقت."' },
                ].map(({ name, text }) => (
                  <div key={name} className="test-card">
                    <h4 style={{ color: "#050505", fontSize: 15, marginBottom: 8, fontWeight: 800 }}>{name} ✓</h4>
                    <p style={{ fontSize: 13, color: "#555", fontStyle: "italic", lineHeight: 1.7 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ SUBJECTS ══════════ */}
        {view === "subjects" && (
          <div>
            {sectionTitle("اختر المادة وابدأ التحدي 🎯")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 22 }}>
              {SUBJECTS.map(sub => (
                <div key={sub.id} className="subject-card" onClick={() => openSubject(sub)}>
                  <div style={{ fontSize: 46, marginBottom: 12 }}>{sub.icon}</div>
                  <h3 style={{ fontWeight: 800, color: "#050505", fontSize: 16 }}>{sub.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ SUBJECT (LESSONS LIST) ══════════ */}
        {view === "subject" && currentSubject && (
          <div>
            {backBtn("رجوع للمواد", "subjects")}
            <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 10px 30px -10px rgba(10,61,98,0.1)", border: "1px solid #e2e8f0" }}>
              {sectionTitle(currentSubject.name)}
              {currentSubject.id === "deen" && allQuestions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {DEEN_LESSONS.map((lesson, i) => {
                    const qs = allQuestions.slice(lesson.range[0], lesson.range[1]);
                    return (
                      <div key={i} className="lesson-card">
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#050505" }}>{lesson.title}</div>
                          <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{qs.length} سؤال تفاعلي</div>
                        </div>
                        <button
                          onClick={() => startLesson(lesson.title, qs)}
                          style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: 14, whiteSpace: "nowrap" }}
                        >
                          ابدأ ▶
                        </button>
                      </div>
                    );
                  })}
                  <div className="lesson-card" style={{ opacity: 0.7 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#050505" }}>الامتحان الشامل (الدرسان)</div>
                      <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{allQuestions.length} سؤال</div>
                    </div>
                    <button
                      onClick={() => startLesson("الامتحان الشامل — تربية إسلامية", allQuestions)}
                      style={{ background: "#050505", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: 14, whiteSpace: "nowrap" }}
                    >
                      ابدأ ▶
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "#888", fontSize: 15 }}>سيتم إضافة دروس هذه المادة قريباً.</div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ EXAM ══════════ */}
        {view === "exam" && currentQ && (
          <div>
            <div style={{ background: "#fff", borderRadius: 20, padding: "16px 22px", marginBottom: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", borderTop: "4px solid #0a3d62", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, color: "#050505", fontSize: 16 }}>{currentLesson}</span>
              <span style={{ color: "#555", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>السؤال {currentIndex + 1} / {examQuestions.length}</span>
            </div>

            <div style={{ width: "100%", background: "#e2e8f0", height: 10, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", background: "#0a3d62", width: `${((currentIndex + 1) / examQuestions.length) * 100}%`, transition: "width 0.4s ease" }} />
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: "38px 26px", boxShadow: "0 10px 30px -10px rgba(10,61,98,0.1)", border: "1px solid #e2e8f0", textAlign: "center" }}>
              <h2 style={{ fontSize: 21, fontWeight: 900, color: "#111", marginBottom: 30, lineHeight: 1.75 }}>{currentQ.question}</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className="opt-btn"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAutoAdvancing || answers[currentQ.id] !== undefined}
                    style={{
                      width: "100%",
                      textAlign: "right",
                      padding: "15px 18px",
                      borderRadius: 14,
                      border: "2px solid",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: isAutoAdvancing || answers[currentQ.id] !== undefined ? "default" : "pointer",
                      fontFamily: "'Cairo',sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "all 0.2s",
                      ...getOptionStyle(idx),
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: selectedNow === idx ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: 13
                    }}>
                      {["A", "B", "C", "D"][idx]}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              <p style={{ marginTop: 18, color: "#aaa", fontSize: 13, fontWeight: 600 }}>
                اختر إجابة للانتقال تلقائياً للسؤال التالي ✨
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isAutoAdvancing}
                  style={{ background: "transparent", border: "2px solid #cbd5e1", color: "#666", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: currentIndex === 0 ? "not-allowed" : "pointer", fontFamily: "'Cairo',sans-serif", opacity: currentIndex === 0 ? 0.35 : 1, transition: "0.2s" }}
                >
                  ← السابق
                </button>
                <button
                  onClick={() => { if (currentIndex + 1 >= examQuestions.length) goTo("result"); else setCurrentIndex(i => i + 1); }}
                  style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
                >
                  {currentIndex + 1 === examQuestions.length ? "إنهاء ✓" : "التالي →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ RESULT ══════════ */}
        {view === "result" && (
          <div style={{ background: "#fff", borderRadius: 24, padding: "48px 24px", boxShadow: "0 10px 30px -10px rgba(10,61,98,0.15)", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#050505", marginBottom: 18 }}>انتهى الاختبار! 🎉</h2>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 28, background: "rgba(10,61,98,0.05)", padding: "14px 26px", borderRadius: 14, display: "inline-block", border: "2px dashed #0a3d62", color: "#050505" }}>
              ﴿ إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا ﴾
            </div>

            <div style={{ width: 170, height: 170, borderRadius: "50%", border: "12px solid #0a3d62", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 26px", boxShadow: "0 0 30px rgba(10,61,98,0.15)" }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: "#050505", lineHeight: 1 }}>{score}%</span>
              <span style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{currentLesson.includes("الأول") ? "الدرس الأول" : currentLesson.includes("الثاني") ? "الدرس الثاني" : "الشامل"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 26 }}>
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 16, padding: "14px 22px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a" }}>{correctCount}</div>
                <div style={{ fontSize: 13, color: "#15803d", fontWeight: 700 }}>إجابات صحيحة ✓</div>
              </div>
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 16, padding: "14px 22px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626" }}>{examQuestions.length - correctCount}</div>
                <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700 }}>إجابات خاطئة ✗</div>
              </div>
            </div>

            <button
              onClick={() => goTo("review")}
              style={{ background: "linear-gradient(45deg,#050505,#0a3d62)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 30, fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "'Cairo',sans-serif", boxShadow: "0 4px 15px rgba(0,0,0,0.25)", display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}
            >
              🔍 مراجعة الأخطاء والإجابات
            </button>

            <div style={{ margin: "16px 0" }}>
              <p style={{ fontWeight: 700, color: "#666", marginBottom: 12, fontSize: 15 }}>شارك نتيجتك مع أصدقائك:</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {[{ p: "wa", bg: "#25D366", label: "واتساب", icon: "💬" }, { p: "fb", bg: "#1877F2", label: "فيسبوك", icon: "📘" }, { p: "tg", bg: "#229ED9", label: "تيليجرام", icon: "✈️" }, { p: "x", bg: "#050505", label: "إكس", icon: "✕" }].map(({ p, bg, label, icon }) => (
                  <button key={p} onClick={() => shareResult(p)} title={label} style={{ width: 46, height: 46, borderRadius: "50%", background: bg, border: "none", fontSize: 18, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
              <button
                onClick={() => { setAnswers({}); setCurrentIndex(0); setSelectedNow(null); goTo("exam"); }}
                style={{ background: "transparent", border: "2px solid #0a3d62", color: "#0a3d62", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
              >
                إعادة الامتحان
              </button>
              <button onClick={() => goTo("subject")} style={{ background: "transparent", border: "2px solid #ccc", color: "#666", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                ← اختر درساً آخر
              </button>
              <button onClick={() => goTo("home")} style={{ background: "transparent", border: "2px solid #ccc", color: "#666", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                🏠 الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* ══════════ REVIEW ══════════ */}
        {view === "review" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#050505" }}>مراجعة الإجابات</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 13, padding: "6px 14px", borderRadius: 20 }}>{correctCount} صحيحة ✓</span>
                <span style={{ background: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: 13, padding: "6px 14px", borderRadius: 20 }}>{wrongQuestions.length} خاطئة ✗</span>
              </div>
            </div>

            {examQuestions.map((q, qi) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correct;
              const isSkipped = userAns === undefined;
              return (
                <div key={q.id} style={{ background: "#fff", borderRadius: 18, padding: "22px", marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.05)", border: `1px solid ${isSkipped ? "#e2e8f0" : isCorrect ? "#86efac" : "#fca5a5"}`, borderRight: `5px solid ${isSkipped ? "#cbd5e1" : isCorrect ? "#22c55e" : "#ef4444"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>السؤال {qi + 1}</span>
                    {isSkipped ? (
                      <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>لم تُجَب</span>
                    ) : isCorrect ? (
                      <span style={{ background: "#dcfce7", color: "#166534", fontSize: 12, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>صحيحة ✓</span>
                    ) : (
                      <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 12, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>خاطئة ✗</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#050505", marginBottom: 16, lineHeight: 1.75 }}>{q.question}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {q.options.map((opt, idx) => {
                      const isCorrectOpt = idx === q.correct;
                      const isUserWrong = idx === userAns && !isCorrect;
                      return (
                        <div key={idx} style={{
                          padding: "11px 15px", borderRadius: 12, border: "2px solid",
                          fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 10,
                          ...(isCorrectOpt ? { background: "#dcfce7", borderColor: "#22c55e", color: "#166534" } :
                            isUserWrong ? { background: "#fee2e2", borderColor: "#ef4444", color: "#991b1b" } :
                              { background: "#f8f9fa", borderColor: "#e2e8f0", color: "#999", opacity: 0.75 }),
                        }}>
                          <span style={{ fontWeight: 900, fontSize: 12, minWidth: 18 }}>{["A", "B", "C", "D"][idx]}</span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {isCorrectOpt && <span style={{ fontWeight: 900, fontSize: 13, color: "#166534", whiteSpace: "nowrap" }}>✓ الإجابة الصحيحة</span>}
                          {isUserWrong && <span style={{ fontWeight: 900, fontSize: 13, color: "#991b1b", whiteSpace: "nowrap" }}>✗ إجابتك</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
              <button onClick={() => goTo("result")} style={{ background: "transparent", border: "2px solid #ccc", color: "#666", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>← العودة للنتيجة</button>
              <button onClick={() => { setAnswers({}); setCurrentIndex(0); setSelectedNow(null); goTo("exam"); }} style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إعادة الامتحان</button>
            </div>
          </div>
        )}

        {/* ══════════ TIPS ══════════ */}
        {view === "tips" && (
          <div>
            {sectionTitle("نصائح وأدعية للنجاح 🌟")}
            {[
              { title: "📖 آيات وأدعية مباركة", items: ["دعاء المذاكرة: «اللهم إني أسألك فهم النبيين، وحفظ المرسلين، والملائكة المقربين.»", "دعاء التسهيل: «اللهم لا سهل إلا ما جعلته سهلاً، وأنت تجعل الحزن إذا شئت سهلاً.»", "دعاء النسيان: «اللهم يا جامع الناس ليوم لا ريب فيه، اجمع علي ضالتي.»", "من سورة طه: ﴿رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي﴾", "للتحصين: قراءة آية الكرسي والمعوذات لدفع التوتر وتصفية الذهن."] },
              { title: "☀️ قبل الامتحان", items: ["النوم المبكر (لا تسهر ليلة الامتحان) لتنشيط الذاكرة.", "تجهيز أدوات الامتحان والهوية من الليل.", "مراجعة العناوين الرئيسية فقط بدلاً من قراءة التفاصيل.", "تناول فطور صحي وخفيف (مثل التمر).", "الابتعاد عن الطلاب المتوترين أمام القاعة."] },
              { title: "✏️ أثناء الامتحان", items: ["قراءة دعاء التسهيل قبل الورقة وأخذ نفس عميق.", "البدء بالأسئلة السهلة لرفع المعنويات.", "قراءة السؤال كاملاً بتركيز، ففهم السؤال نصف الإجابة.", "اترك السؤال الصعب للنهاية.", "تظليل الإجابات بحذر على ورقة الماسح الضوئي."] },
              { title: "🌙 بعد الامتحان", items: ["لا تراجع إجاباتك مع زملائك بعد الخروج أبداً!", "سلم أمرك لله، فما كتبه لك هو الخير.", "خذ قسطاً من الراحة قبل البدء بالمادة الجديدة.", "ابدأ صفحة جديدة بتركيز وعزيمة أقوى."] },
            ].map(({ title, items }) => (
              <div key={title} className="tip-card">
                <h3 style={{ color: "#0a3d62", marginBottom: 18, fontSize: 19, fontWeight: 800 }}>{title}</h3>
                <ul style={{ paddingRight: 20, listStyleType: "square" }}>
                  {items.map((item, i) => <li key={i} style={{ marginBottom: 11, lineHeight: 1.85, fontSize: 15 }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ STUDY PLAN ══════════ */}
        {view === "plan" && (
          <div>
            {sectionTitle("صانع خطة الدراسة 📅")}
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 10px 30px -10px rgba(10,61,98,0.1)", border: "1px solid #e2e8f0", maxWidth: 560 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <select id="sp-subject" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", fontFamily: "'Cairo',sans-serif", fontSize: 15, outline: "none" }}>
                  <option>الرياضيات</option><option>اللغة العربية</option><option>تاريخ الأردن</option><option>التربية الإسلامية</option>
                </select>
                <div style={{ display: "flex", gap: 10 }}>
                  <input id="sp-total" type="number" placeholder="إجمالي الدروس" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", fontFamily: "'Cairo',sans-serif", outline: "none" }} />
                  <input id="sp-completed" type="number" placeholder="الدروس المنجزة" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", fontFamily: "'Cairo',sans-serif", outline: "none" }} />
                </div>
                <select id="sp-level" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", fontFamily: "'Cairo',sans-serif", fontSize: 14, outline: "none" }}>
                  <option value="weak">مستواي ضعيف (دراسة بطيئة)</option>
                  <option value="medium">مستواي متوسط (خطة متوازنة)</option>
                  <option value="strong">مستواي ممتاز (إنجاز سريع)</option>
                </select>
                <button onClick={generatePlan} style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إنشاء الخطة 🚀</button>
              </div>
              {planResult && <div style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 20 }} dangerouslySetInnerHTML={{ __html: planResult }} />}
            </div>
          </div>
        )}

        {/* ══════════ TIMER ══════════ */}
        {view === "timer" && (
          <div>
            {sectionTitle("مؤقت الدراسة ⏱️")}
            <div style={{ background: "#fff", borderRadius: 20, padding: "36px 28px", maxWidth: 420, margin: "0 auto", textAlign: "center", boxShadow: "0 10px 30px -10px rgba(10,61,98,0.1)", border: "1px solid #e2e8f0" }}>
              <p style={{ color: "#666", fontSize: 15, marginBottom: 20 }}>اكتب مدة الدراسة بالدقائق للبدء أو إعادة الضبط.</p>
              <input
                type="number" value={timerInput} onChange={e => setTimerInput(e.target.value)}
                placeholder="مثال: 25"
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #cbd5e1", fontFamily: "'Cairo',sans-serif", fontSize: 20, fontWeight: 700, textAlign: "center", outline: "none", marginBottom: 18 }}
              />
              <div style={{ fontSize: 70, fontWeight: 900, color: "#0a3d62", margin: "14px 0", fontFamily: "monospace", direction: "ltr" }}>{timerDisplay}</div>
              <button onClick={startTimer} style={{ background: "#0a3d62", color: "#fff", border: "none", padding: "13px 36px", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>بدء / تصفير ▶</button>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ background: "#050505", color: "#fff", padding: "40px 16px 24px", marginTop: 50, borderTop: "4px solid #0a3d62" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ marginBottom: 12, fontWeight: 800 }}>منصة ToQuiz 🇯🇴</h3>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: "#ccc", marginBottom: 26 }}>
            المنصة التفاعلية الأولى لتدريب طلاب التوجيهي (جيل 2009 و 2010) في الأردن. نسعى لكسر حاجز الخوف من الامتحان الوزاري من خلال محاكاة حقيقية وبنوك أسئلة شاملة.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 22, marginBottom: 22 }}>
            {[{ href: "https://www.instagram.com/toquiz.online", label: "📸" }, { href: "https://www.youtube.com/@Quran_4ever0", label: "▶️" }, { href: "#", label: "📘" }, { href: "#", label: "💬" }].map(({ href, label }, i) => (
              <a key={i} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 22, color: "#ccc", textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#888", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18 }}>جميع الحقوق محفوظة لمنصة <strong>ToQuiz</strong> © 2026</p>
        </div>
      </footer>
    </div>
  );
}
