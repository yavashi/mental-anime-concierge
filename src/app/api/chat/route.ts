import { NextResponse } from "next/server";
import { processShizukuChat } from "@/lib/characters/shizuku";
import { Message, UserSessionState } from "@/types";

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
      session,
      history: history || [],
    });

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
