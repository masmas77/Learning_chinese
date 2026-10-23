"use client";

import { useEffect, useMemo, useState } from "react";

type Question = {
  zh: string;
  jp: string;
  pinyin: string;
  category: string;
  example: string;
};

const cities = [
  { name: "台北", icon: "🏙️", requiredLevel: 1 },
  { name: "新竹", icon: "🔬", requiredLevel: 2 },
  { name: "台中", icon: "🏭", requiredLevel: 3 },
  { name: "台南", icon: "🏯", requiredLevel: 4 },
  { name: "高雄", icon: "⚓", requiredLevel: 5 },
];

const fallbackChoices = [
  "ご確認をお願いします。",
  "予定通り出荷できますか。",
  "ご返信ありがとうございます。",
  "関連情報をご提供ください。",
  "承知しました。",
  "ご協力ありがとうございます。",
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[randomIndex]] = [
      copy[randomIndex],
      copy[i],
    ];
  }

  return copy;
}

export default function TaiwanRpg() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);

  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [showHint, setShowHint] = useState(false);
  const [cityIndex, setCityIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          "/csv/rti_master.csv",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `CSVの取得に失敗しました: ${response.status}`
          );
        }

        const text = await response.text();

        const rows = text
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .filter((row) => row.trim() !== "");

        const data: Question[] = rows
          .slice(1)
          .map((row) => {
            const columns = row
              .split(",")
              .map((column) =>
                column
                  .trim()
                  .replace(/^"|"$/g, "")
              );

            return {
              zh: columns[0] ?? "",
              jp: columns[1] ?? "",
              pinyin: columns[2] ?? "",
              category: columns[3] ?? "社内用語",
              example: columns[4] ?? "",
            };
          })
          .filter(
            (question) =>
              question.zh !== "" &&
              question.jp !== ""
          );

        if (data.length === 0) {
          throw new Error(
            "CSVに有効な問題がありません。"
          );
        }

        setQuestions(data);
        setIndex(0);
      } catch (error) {
        console.error(error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "CSVを読み込めませんでした。"
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const currentQuestion =
    questions.length > 0
      ? questions[index % questions.length]
      : null;

  const choices = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    const otherAnswers = [
      ...new Set([
        ...questions.map((question) => question.jp),
        ...fallbackChoices,
      ]),
    ].filter(
      (answer) =>
        answer !== currentQuestion.jp
    );

    const incorrectAnswers = shuffle(
      otherAnswers
    ).slice(0, 3);

    return shuffle([
      currentQuestion.jp,
      ...incorrectAnswers,
    ]);
  }, [currentQuestion, questions]);

  function checkAnswer(answer: string) {
    if (
      !currentQuestion ||
      selectedAnswer !== null
    ) {
      return;
    }

    setSelectedAnswer(answer);

    if (answer === currentQuestion.jp) {
      setCorrectCount(
        (previous) => previous + 1
      );

      setCombo((previous) => previous + 1);

      setExp((previousExp) => {
        const nextExp = previousExp + 20;

        if (nextExp >= 100) {
          setLevel((previousLevel) =>
            Math.min(previousLevel + 1, 5)
          );

          return nextExp - 100;
        }

        return nextExp;
      });
    } else {
      setCombo(0);
    }
  }

  function nextQuestion() {
    if (questions.length === 0) {
      return;
    }

    setIndex(
      (previous) =>
        (previous + 1) % questions.length
    );

    setSelectedAnswer(null);
    setShowHint(false);
  }

  function moveToCity(nextCityIndex: number) {
    const city = cities[nextCityIndex];

    if (level < city.requiredLevel) {
      return;
    }

    setCityIndex(nextCityIndex);
  }

  if (loading) {
    return (
      <main style={styles.loading}>
        <h1>🇹🇼 台湾RPG</h1>
        <p>RTI教材を読み込んでいます...</p>
      </main>
    );
  }

  if (loadError || !currentQuestion) {
    return (
      <main style={styles.errorPage}>
        <h1>CSVを読み込めませんでした</h1>

        <p style={styles.errorText}>
          {loadError ||
            "問題データがありません。"}
        </p>

        <p>
          次の場所にCSVがあるか確認してください。
        </p>

        <code style={styles.code}>
          public/csv/rti_master.csv
        </code>
      </main>
    );
  }

  const isCorrect =
    selectedAnswer === currentQuestion.jp;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            🇹🇼 台灣語彙冒險
          </h1>

          <p style={styles.subtitle}>
            RTI・RORZE Taiwan 実務中国語
          </p>
        </div>

        <div style={styles.statusArea}>
          <div>
            Lv.{level}　EXP {exp}/100
          </div>

          <div style={styles.expBackground}>
            <div
              style={{
                ...styles.expBar,
                width: `${exp}%`,
              }}
            />
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <aside style={styles.mapPanel}>
          <h2 style={styles.sectionTitle}>
            台湾マップ
          </h2>

          <div style={styles.cityList}>
            {cities.map((city, cityNumber) => {
              const locked =
                level < city.requiredLevel;

              const active =
                cityNumber === cityIndex;

              return (
                <button
                  key={city.name}
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    moveToCity(cityNumber)
                  }
                  style={{
                    ...styles.cityButton,
                    ...(active
                      ? styles.activeCity
                      : {}),
                    ...(locked
                      ? styles.lockedCity
                      : {}),
                  }}
                >
                  <span style={styles.cityIcon}>
                    {city.icon}
                  </span>

                  <span>
                    <strong>{city.name}</strong>

                    <small
                      style={styles.cityDescription}
                    >
                      {locked
                        ? `Lv.${city.requiredLevel}で解放`
                        : active
                          ? "現在地"
                          : "移動する"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={styles.metrics}>
            <div style={styles.metric}>
              <strong>{correctCount}</strong>
              <small>正解</small>
            </div>

            <div style={styles.metric}>
              <strong>{combo}</strong>
              <small>連続</small>
            </div>

            <div style={styles.metric}>
              <strong>{questions.length}</strong>
              <small>問題数</small>
            </div>
          </div>
        </aside>

        <section style={styles.quizPanel}>
          <div style={styles.quizTop}>
            <span>
              {cities[cityIndex].name}クエスト
            </span>

            <span>
              {index + 1} / {questions.length}
            </span>
          </div>

          <div style={styles.questionCard}>
            <span style={styles.npcName}>
              RTIメール担当
            </span>

            <h2 style={styles.chinese}>
              {currentQuestion.zh}
            </h2>

            <p style={styles.pinyin}>
              {currentQuestion.pinyin}
            </p>

            <span style={styles.category}>
              {currentQuestion.category}
            </span>
          </div>

          <h3 style={styles.prompt}>
            日本語の意味を選んでください
          </h3>

          <div style={styles.choices}>
            {choices.map((choice, choiceIndex) => {
              const correctChoice =
                selectedAnswer !== null &&
                choice === currentQuestion.jp;

              const wrongChoice =
                selectedAnswer === choice &&
                choice !== currentQuestion.jp;

              return (
                <button
                  key={`${choice}-${choiceIndex}`}
                  type="button"
                  disabled={
                    selectedAnswer !== null
                  }
                  onClick={() =>
                    checkAnswer(choice)
                  }
                  style={{
                    ...styles.choiceButton,
                    ...(correctChoice
                      ? styles.correctChoice
                      : {}),
                    ...(wrongChoice
                      ? styles.wrongChoice
                      : {}),
                  }}
                >
                  <span style={styles.answerNumber}>
                    {choiceIndex + 1}
                  </span>

                  {choice}
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            style={styles.resultArea}
          >
            {selectedAnswer !== null && (
              <>
                <strong
                  style={{
                    color: isCorrect
                      ? "#087443"
                      : "#c03945",
                  }}
                >
                  {isCorrect
                    ? "✅ 正解！ +20 EXP"
                    : `❌ 不正解。正解は「${currentQuestion.jp}」`}
                </strong>

                {currentQuestion.example && (
                  <p style={styles.example}>
                    例文・メモ：
                    {currentQuestion.example}
                  </p>
                )}
              </>
            )}

            {showHint &&
              selectedAnswer === null && (
                <p style={styles.hint}>
                  💡 カテゴリ：
                  {currentQuestion.category}
                  <br />
                  ピンイン：
                  {currentQuestion.pinyin}
                </p>
              )}
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() =>
                setShowHint(true)
              }
              style={styles.hintButton}
            >
              💡 ヒント
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              style={styles.nextButton}
            >
              次の問題へ
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    background:
      "linear-gradient(135deg, #e5f6ed, #fff7df)",
    fontFamily:
      'Arial, "Yu Gothic", "Noto Sans TC", sans-serif',
    color: "#17231d",
  },

  loading: {
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  errorPage: {
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  errorText: {
    color: "#c03945",
    fontWeight: "bold",
  },

  code: {
    display: "inline-block",
    padding: "10px",
    borderRadius: "8px",
    background: "#eeeeee",
  },

  header: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #087a57, #0b9a6e)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#d7fff0",
  },

  statusArea: {
    minWidth: "180px",
    fontWeight: "bold",
  },

  expBackground: {
    height: "10px",
    marginTop: "8px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.3)",
  },

  expBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#ffd86b",
    transition: "width 0.3s",
  },

  content: {
    maxWidth: "1000px",
    margin: "16px auto 0",
    display: "grid",
    gridTemplateColumns:
      "minmax(230px, 0.8fr) minmax(300px, 1.5fr)",
    gap: "16px",
  },

  mapPanel: {
    padding: "18px",
    borderRadius: "20px",
    background: "white",
    boxShadow:
      "0 10px 30px rgba(30,70,50,0.12)",
  },

  quizPanel: {
    padding: "18px",
    borderRadius: "20px",
    background: "white",
    boxShadow:
      "0 10px 30px rgba(30,70,50,0.12)",
  },

  sectionTitle: {
    marginTop: 0,
    fontSize: "17px",
    color: "#52645a",
  },

  cityList: {
    display: "grid",
    gap: "8px",
  },

  cityButton: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e0e8e3",
    borderRadius: "13px",
    background: "#f6f9f7",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    textAlign: "left",
    color: "#17231d",
    cursor: "pointer",
  },

  activeCity: {
    border: "2px solid #0b8b62",
    background: "#dff7ec",
  },

  lockedCity: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  cityIcon: {
    fontSize: "25px",
  },

  cityDescription: {
    display: "block",
    marginTop: "3px",
    color: "#6a7a71",
  },

  metrics: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "7px",
  },

  metric: {
    padding: "10px 5px",
    borderRadius: "12px",
    background: "#f1f6f3",
    textAlign: "center",
  },

  quizTop: {
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    color: "#65766c",
    fontSize: "14px",
    fontWeight: "bold",
  },

  questionCard: {
    padding: "20px",
    borderRadius: "17px",
    background:
      "linear-gradient(135deg, #e8f7ff, #f5fbff)",
  },

  npcName: {
    color: "#2874a6",
    fontSize: "13px",
    fontWeight: "bold",
  },

  chinese: {
    margin: "10px 0 4px",
    fontSize: "30px",
  },

  pinyin: {
    margin: "0 0 12px",
    color: "#52645a",
  },

  category: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "white",
    fontSize: "12px",
    fontWeight: "bold",
  },

  prompt: {
    margin: "18px 0 10px",
    fontSize: "16px",
  },

  choices: {
    display: "grid",
    gap: "9px",
  },

  choiceButton: {
    width: "100%",
    padding: "13px",
    border: "1px solid #dce5df",
    borderRadius: "13px",
    background: "#f7f9f8",
    color: "#17231d",
    fontSize: "15px",
    fontWeight: "bold",
    textAlign: "left",
    cursor: "pointer",
  },

  correctChoice: {
    border: "2px solid #1e9b67",
    background: "#dcf7e8",
  },

  wrongChoice: {
    border: "2px solid #cf4a58",
    background: "#ffe4e8",
  },

  answerNumber: {
    display: "inline-block",
    width: "25px",
    height: "25px",
    marginRight: "9px",
    borderRadius: "50%",
    background: "#e4ece7",
    textAlign: "center",
    lineHeight: "25px",
  },

  resultArea: {
    minHeight: "70px",
    paddingTop: "14px",
  },

  example: {
    margin: "8px 0 0",
    color: "#53655b",
  },

  hint: {
    margin: 0,
    color: "#2d6ea3",
  },

  actions: {
    display: "flex",
    gap: "9px",
  },

  hintButton: {
    padding: "12px 16px",
    border: 0,
    borderRadius: "12px",
    background: "#e5ece8",
    color: "#263c31",
    fontWeight: "bold",
    cursor: "pointer",
  },

  nextButton: {
    flex: 1,
    padding: "12px 16px",
    border: 0,
    borderRadius: "12px",
    background: "#087a57",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};