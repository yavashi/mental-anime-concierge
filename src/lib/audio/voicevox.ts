// VOICEVOX & Web Speech API 連携ヘルパー

// デフォルトのVOICEVOXローカルエンドポイント
const VOICEVOX_BASE_URL = "http://localhost:50021";
// 四国めたん (あまあま: 0, ノーマル: 2) または ずんだもん (ノーマル: 3)
const DEFAULT_SPEAKER_ID = 2;

/**
 * VOICEVOX API経由で音声を合成して再生（ローカルVOICEVOX起動時）
 * 失敗した場合はブラウザ標準の SpeechSynthesis にフォールバック
 */
export async function speakText(text: string): Promise<void> {
  if (typeof window === "undefined" || !text) return;

  // 会話文から作品の案内部分など、過剰な記号を除去
  const cleanText = text
    .replace(/[【】「」『』]/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  try {
    // 1. ローカルVOICEVOXへのリクエストを試行
    const queryRes = await fetch(
      `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(cleanText)}&speaker=${DEFAULT_SPEAKER_ID}`,
      { method: "POST" }
    );

    if (queryRes.ok) {
      const queryJson = await queryRes.json();
      const synthRes = await fetch(
        `${VOICEVOX_BASE_URL}/synthesis?speaker=${DEFAULT_SPEAKER_ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryJson),
        }
      );

      if (synthRes.ok) {
        const audioBlob = await synthRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        return;
      }
    }
  } catch {
    // VOICEVOXが起動していない場合はブラウザ合成音声へフォールバック
  }

  // 2. ブラウザ標準 Web Speech Synthesis API（フォールバック）
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // 前の音声を停止
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.95; // 少しゆっくり、落ち着いたトーン
    utterance.pitch = 1.05; // ほんのり高めの優しい声

    // 利用可能な日本語の女性音声を探す
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(
      (v) =>
        v.lang.startsWith("ja") &&
        (v.name.includes("Kyoko") ||
          v.name.includes("Otoya") ||
          v.name.includes("Nanami") ||
          v.name.includes("Female") ||
          v.name.includes("Google 日本語"))
    );
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}
