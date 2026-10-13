import { GoogleGenAI } from "@google/genai";
import { ANIME_DATABASE } from "@/data/anime-seed";
import { AnimeItem, Message, UserSessionState } from "@/types";

// 静久のコア・システムプロンプト
const SHIZUKU_SYSTEM_PROMPT = `
あなたは「静久（シズク）」という名前の、深い包容力と思いやりの心を持った女性です。
今夜、心身ともに疲れ果てて傷ついた親しい友人の話をLINEやメッセンジャーのようにチャットで聴いてあげる存在です。

【あなたのパーソナリティ】
- 傷ついた心をそのまま丸ごと受け止める無条件の肯定感を持っています。
- 相手が「平気なふり」をして我慢してきたことを見抜く、温かく鋭い観察眼があります。
- 決して説教や正論、上から目線のアドバイスはしません。
- 「母性」「全肯定」「AI」「推薦」「処方」「ターン」といった機械的・メタ的な言葉は絶対に使わないでください。親しい友人として自然にチャットしてください。
- 一人称は「私（わたし）」、二人称は「あなた」または「〇〇さん/君」。
- 口調: ゆったりと落ち着いた優しいトーン。「〜〜だよ」「〜〜だったね」「よく頑張ったね」「大丈夫だよ」。

【相手の心の状態を察する柔軟な対話姿勢（最重要）】
あなたは機械的に「何回話したらアニメを紹介する」というロボットではありません。
会話の文脈と相手の言葉の機微から、相手が今どうしてほしいのかを深く察知して行動を選択してください：

1. 【action: "listen"】相手がまだ話したがっている・愚痴や痛みを吐き出している時：
   - 相手がまだ辛さ・理不尽さ・悔しさを語っている間は、何回でもじっくりと話を聴き、共感と受容に専念してください。
   - この時は**アニメのタイトルや紹介は一切出さないでください**。
   - 「それ、本当に悔しかったね……」「よく今まで一人で抱えてきたね」と心から共感し、必要なら優しく問いかけてください。

2. 【action: "recommend"】相手が作品を受け取る心の準備ができた・何か求めている時：
   - 相手が一通り吐き出し終えて一息ついた時（「少し話せて落ち着いた」「何か観て忘れようかな」「どうしたらいいかな」など）、または最初から「何か観たい」「おすすめある？」と言っている時。
   - この時初めて、「あんな人のためにあなたが悩むのは悔しいから、今夜はあえて『〇〇』を観てみてほしいの」「実はね……」と、友達として自然に作品を差し出してください。

【セーフティガード（厳守）】
- 希死念慮（死にたい、消えたい、自傷など）を検知した場合は、作品紹介を中止し、真摯に心配して公的相談窓口（よりそいホットライン: 0120-279-338）を案内してください。
`;

function checkCrisis(input: string): boolean {
  const crisisKeywords = [
    "死にたい", "消えたい", "自殺", "首を吊", "生きている意味",
    "リスカ", "自傷", "終わりにしたい", "殺して", "楽になりたい"
  ];
  return crisisKeywords.some((keyword) => input.includes(keyword));
}

export async function processShizukuChat(params: {
  userInput: string;
  session: UserSessionState;
  history: Message[];
}): Promise<Message> {
  const { userInput, session, history } = params;

  // 1. セーフティチェック
  if (checkCrisis(userInput)) {
    return {
      role: "assistant",
      content: `そんなに辛い思いを一人で抱え込んでいたんだね……話してくれてありがとう。
今は何も考えなくていいよ。でも、あなたのことが本当に心配だから、専門の方にお話しできる窓口をここに置いておくね。

・よりそいホットライン：0120-279-338 (24時間無料)
・こころの健康相談統一ダイヤル：0570-064-556

今夜は無理をせず、温かい毛布に包まって、少しでも身体を休めてね。`,
      isCrisis: true,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Gemini 3.5 Flash Lite API を呼び出し
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
${SHIZUKU_SYSTEM_PROMPT}

【利用可能な作品リスト】
${JSON.stringify(
  ANIME_DATABASE.filter((a) => !session.introducedAnimeIds?.includes(a.id)),
  null,
  2
)}

ユーザーの状況:
- 残存HP: ${session.userHp}%
- 契約中VOD: ${session.selectedVods.join(", ") || "なし"}
- すでに紹介した作品IDリスト（絶対に再提案禁止）: [${(session.introducedAnimeIds || []).join(", ")}]
- これまでの会話履歴:
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}
- 今回のユーザーの発言: "${userInput}"

【あなたの思考と判断プロセス】
1. 相手の今回の発言とこれまでの文脈をよく観察してください。
   * 【ケースA: アニメのフィードバック】ユーザーが「もう観たことある」「気分じゃない」「別の作品がいい」と言っている場合：
     → 即座に action: "recommend" を選択し、「あ、もう観てたんだね！さすが詳しいね」「そっか、好みに合わなくてごめんね、じゃあこっちのタイプにしよう！」と人間味たっぷりに受け止め、**【すでに紹介した作品リスト】以外の別の作品を新しく提案**してください。
   * 【ケースB: アニメへのお礼・会話の継続】ユーザーが「ありがとう、観てみるね」「わかったよ」などとお礼を言っている場合：
     → action: "listen" を選択し、**新しいアニメは提案せず**、「うん、お布団に入って温かくしてゆっくり観てね。またいつでも話しかけてね」と優しく見送るか、他愛のない雑談に付き合ってください。
   * 【ケースC: まだ辛さを吐き出している場合】：
     → action: "listen" を選択し、アニメには触れず、相手の痛みに深く寄り添ってください。
   * 【ケースD: 作品を受け取る準備ができた場合】：
     → action: "recommend" を選択し、会話の流れの中で自然に作品を差し出してください。

【出力フォーマット（JSON形式）】
{
  "action": "listen" または "recommend",
  "message": "チャット返信メッセージ",
  "quickReplies": ["選択肢1", "選択肢2", "選択肢3"],
  "selectedAnimeId": "選んだ作品ID（recommendの時のみ。listenの時は空文字。すでに紹介した作品IDは絶対不可）"
}
`;

      let responseText: string | null = null;

      // 1. まず優先して gemini-3.5-flash-lite を試行（タイムアウト5秒）
      try {
        console.log("[Gemini API] Primary attempt with gemini-3.5-flash-lite (timeout: 5s)...");
        const liteTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Flash Lite timed out after 5s")), 5000)
        );
        const liteCall = ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const liteRes = await Promise.race([liteCall, liteTimeout]);
        if (liteRes.text) {
          responseText = liteRes.text;
          console.log("[Gemini API] Primary gemini-3.5-flash-lite succeeded!");
        }
      } catch (liteErr) {
        console.warn("[Gemini API] Flash Lite did not respond in time, failing over to gemini-3.5-flash:", (liteErr as Error).message);
      }

      // 2. 返答が返ってこない時だけ gemini-3.5-flash に自動切り替え（タイムアウト8秒）
      if (!responseText) {
        try {
          console.log("[Gemini API] Failover attempt with gemini-3.5-flash (timeout: 8s)...");
          const flashTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Flash timed out after 8s")), 8000)
          );
          const flashCall = ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });
          const flashRes = await Promise.race([flashCall, flashTimeout]);
          if (flashRes.text) {
            responseText = flashRes.text;
            console.log("[Gemini API] Failover gemini-3.5-flash succeeded!");
          }
        } catch (flashErr) {
          console.error("[Gemini API] Both Flash Lite and Flash failed:", flashErr);
        }
      }

      if (responseText) {
        console.log("[Gemini API] Response received:", responseText);
        const parsed = JSON.parse(responseText);

        if (parsed.action === "recommend" && parsed.selectedAnimeId) {
          const selectedAnime =
            ANIME_DATABASE.find((a) => a.id === parsed.selectedAnimeId) || ANIME_DATABASE[0];

          const isAvailableInPlan = selectedAnime.streamingPlatforms.some((p) =>
            session.selectedVods.includes(p)
          );

          let availabilityNote;
          if (session.selectedVods.length > 0 && !isAvailableInPlan) {
            const alternative = ANIME_DATABASE.find(
              (a) =>
                a.id !== selectedAnime.id &&
                a.streamingPlatforms.some((p) => session.selectedVods.includes(p))
            );
            availabilityNote = {
              type: "out_of_plan_warning" as const,
              message: `契約中のサービスで観られる『${alternative?.title || "他の作品"}』もおすすめだよ。`,
              alternativeAnime: alternative,
            };
          }

          return {
            role: "assistant",
            content: parsed.message,
            quickReplies: parsed.quickReplies || ["ありがとう、観てみるね", "もう少し話したいな", "他の作品もある？"],
            recommendedAnime: selectedAnime,
            availabilityNote,
          };
        } else {
          // 傾聴モード
          return {
            role: "assistant",
            content: parsed.message,
            quickReplies: parsed.quickReplies || ["まだ悔しくてモヤモヤする", "少し話せて楽になった", "何か観て忘れようかな"],
          };
        }
      }
    } catch (e) {
      console.error("[Gemini API] Error, falling back to smart mock:", e);
    }
  }

  // 3. APIキー未設定・エラー時のスマートフォールバック
  return generateSmartAdaptiveMock(userInput, session, history);
}

function generateSmartAdaptiveMock(
  userInput: string,
  session: UserSessionState,
  history: Message[]
): Message {
  // アニメや気分転換を求めているかを判定
  const isSeekingAnime =
    userInput.includes("アニメ") ||
    userInput.includes("おすすめ") ||
    userInput.includes("観") ||
    userInput.includes("忘れよう") ||
    userInput.includes("気分転換");

  if (!isSeekingAnime && history.length < 4) {
    // まだ傾聴を続ける
    return {
      role: "assistant",
      content: `そうだったんだね……。話してくれてありがとう。本当に一人で抱え込んで、辛かったね。\n\n私でよければ、もっと吐き出していいんだよ。言いたいこと、まだ心の中に残ってない？`,
      quickReplies: [
        "まだ悔しくて涙が出る",
        "誰にも言えなくて孤独だった",
        "少し話せて落ち着いてきた",
      ],
    };
  } else {
    // 作品を紹介する
    const targetAnime = ANIME_DATABASE.find((a) => a.id === "skip_and_loafer") || ANIME_DATABASE[0];
    return {
      role: "assistant",
      content: `たくさん話してくれてありがとう。少しでも気持ちが軽くなったなら嬉しいよ。\n\n今夜のあなたには、傷ついた心をじんわり温めてくれる『${targetAnime.title}』を観てほしいな。意地悪な人が一人も出てこない、優しい世界だよ。`,
      recommendedAnime: targetAnime,
      quickReplies: ["ありがとう、観てみるね", "もう少し話したいな"],
    };
  }
}
