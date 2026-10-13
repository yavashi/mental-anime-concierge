import { NextResponse } from "next/server";
import { processShizukuChat } from "@/lib/characters/shizuku";
import { Message, UserSessionState } from "@/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userInput, session, history } = body as {
      userInput: string;
      session: UserSessionState;
      history: Message[];
    };

    if (!userInput) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const responseMessage = await processShizukuChat({
      userInput,
      session: session || { userHp: 30, selectedVods: [], turn: 1, introducedAnimeIds: [] },
      history: history || [],
    });

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error("API error:", error);
    // 予期せぬエラーでもクライアントを壊さず、温かい返答で包み込む
    return NextResponse.json({
      role: "assistant",
      content: "ごめんね、電波の調子が悪いみたいで……。でもあなたの話、ちゃんと聞いてるからね。もう一度だけ教えてもらえるかな？",
      quickReplies: ["もう一度話すね", "少し待ってみる"],
    });
  }
}
