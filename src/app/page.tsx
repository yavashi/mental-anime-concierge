"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Message, UserSessionState, VodPlatform } from "@/types";
import { VOD_PLATFORMS } from "@/data/anime-seed";
import { speakText } from "@/lib/audio/voicevox";
import { 
  Heart, 
  Send, 
  Sparkles, 
  Tv, 
  ExternalLink,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  SlidersHorizontal
} from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<UserSessionState>({
    userHp: 30,
    selectedVods: ["prime_video", "netflix"],
    turn: 1,
    introducedAnimeIds: [],
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "今日もお疲れ様。よく頑張ってここまで帰ってきたね。\n\n温かいお茶でも飲んで、少し深呼吸しよ？ 何かあったのか、無理のない範囲で教えて？",
      quickReplies: [
        "仕事で理不尽に怒られて限界",
        "人の悪意や摩擦に当てられて疲れた",
        "大失敗して自分が情けない",
        "理由はわからないけど虚しくて眠れない",
      ],
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioAutoPlay, setIsAudioAutoPlay] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 音声入力（Web Speech API）
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ja-JP";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInputText(transcript);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("お使いのブラウザは音声入力に対応していません。Google Chrome等をお試しください。");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVodToggle = (vodId: VodPlatform) => {
    setSession((prev) => {
      const exists = prev.selectedVods.includes(vodId);
      const newVods = exists
        ? prev.selectedVods.filter((v) => v !== vodId)
        : [...prev.selectedVods, vodId];
      return { ...prev, selectedVods: newVods };
    });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: textToSend,
          session,
          history: messages,
        }),
      });

      if (!res.ok) throw new Error("Network error");
      const data: Message = await res.json();

      setMessages((prev) => [...prev, data]);
      setSession((prev) => {
        const nextIntroduced = data.recommendedAnime
          ? Array.from(new Set([...prev.introducedAnimeIds, data.recommendedAnime.id]))
          : prev.introducedAnimeIds;
        return {
          ...prev,
          turn: prev.turn + 1,
          introducedAnimeIds: nextIntroduced,
        };
      });

      if (isAudioAutoPlay) {
        speakText(data.content);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "ごめんね、少し考え込んじゃった……。もう一度だけ話しかけてもらえる？",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSession({
      userHp: 30,
      selectedVods: ["prime_video", "netflix"],
      turn: 1,
      introducedAnimeIds: [],
    });
    setMessages([
      {
        role: "assistant",
        content: "今日もお疲れ様。よく頑張ってここまで帰ってきたね。\n\n温かいお茶でも飲んで、少し深呼吸しよ？ 何かあったのか、無理のない範囲で教えて？",
        quickReplies: [
          "仕事で理不尽に怒られて限界",
          "人の悪意や摩擦に当てられて疲れた",
          "大失敗して自分が情けない",
          "理由はわからないけど虚しくて眠れない",
        ],
      },
    ]);
  };

  return (
    <main 
      className="flex flex-col min-h-screen max-w-2xl mx-auto px-4 py-3 md:py-6"
      style={{ backgroundColor: "#FAF7F2", color: "#2B2319" }}
    >
      {/* 1. ヘッダー */}
      <header className="flex items-center justify-between border-b border-[#E8DFD1] pb-3 mb-3 bg-[#FAF7F2]/90 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D5C7B2] shadow-sm flex-shrink-0 relative">
            <Image
              src="/images/shizuku.jpg"
              alt="静久"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#2B2319] leading-tight">静久</h1>
            <p className="text-[11px] text-[#8C7355] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              温かいお茶を入れて待っています
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ボイス自動再生トグル */}
          <button
            onClick={() => {
              const next = !isAudioAutoPlay;
              setIsAudioAutoPlay(next);
              if (next) speakText("声の再生をオンにしたよ");
            }}
            title={isAudioAutoPlay ? "自動読み上げON" : "自動読み上げOFF"}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
              isAudioAutoPlay
                ? "bg-[#EAF0EC] border-[#769A85] text-[#517460] font-medium shadow-xs"
                : "bg-white border-[#E8DFD1] text-[#8C7355] hover:border-[#D5C7B2]"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">{isAudioAutoPlay ? "声ON" : "声OFF"}</span>
          </button>

          {/* 状態設定ボタン */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#D5C7B2] text-[#63503B] transition-all flex items-center gap-1.5 shadow-xs"
            title="心の状態・VOD設定"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#8C7355]" />
            <span className="text-xs hidden sm:inline">HP {session.userHp}%</span>
          </button>

          <button
            onClick={handleReset}
            title="最初からやり直す"
            className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#D5C7B2] text-[#8C7355] hover:text-[#2B2319] transition-all shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. 静久の大きなビジュアル・紹介パネル（対話相手の温かい存在感） */}
      <section className="mb-4 bg-white border border-[#E8DFD1] rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#D5C7B2] shadow-sm flex-shrink-0 relative bg-[#F4EFE6]">
          <Image
            src="/images/shizuku.jpg"
            alt="静久（シズク）"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80px, 96px"
            priority
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-base sm:text-lg text-[#2B2319]">静久（シズク）</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#8C7355] border border-[#E8DFD1]">
              相談相手
            </span>
          </div>
          <p className="text-xs text-[#63503B] leading-relaxed mb-2">
            「今日もお疲れ様。外で嫌なことがあったり、心がすり減っちゃったら、何でも話してね。無理に元気を出さなくて大丈夫だよ」
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#8C7355]">
            <Coffee className="w-3.5 h-3.5 text-[#A9895B]" />
            <span>あなたのペースでゆっくり話してね</span>
          </div>
        </div>
      </section>

      {/* 3. 状態設定パネル（必要時のみ開く） */}
      {showConfig && (
        <section className="bg-white border border-[#E8DFD1] rounded-2xl p-4 mb-4 text-xs space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-medium text-[#453829] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" /> 今夜の心のエネルギー残量 (HP)
              </span>
              <span className="text-[#517460] font-bold">{session.userHp}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={session.userHp}
              onChange={(e) => setSession({ ...session, userHp: Number(e.target.value) })}
              className="w-full accent-[#769A85] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8C7355] mt-1">
              <span>5% (限界・思考停止)</span>
              <span>50% (疲れ気味)</span>
              <span>100% (少し元気)</span>
            </div>
          </div>

          <div>
            <span className="font-medium text-[#453829] block mb-2 flex items-center gap-1">
              <Tv className="w-3.5 h-3.5 text-[#8C7355]" /> よく使う配信サービス（複数選択可）
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VOD_PLATFORMS.map((v) => {
                const isChecked = session.selectedVods.includes(v.id as VodPlatform);
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVodToggle(v.id as VodPlatform)}
                    className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                      isChecked
                        ? "bg-[#EAF0EC] border-[#769A85] text-[#517460] font-medium shadow-xs"
                        : "bg-[#FAF7F2] border-[#E8DFD1] text-[#63503B] hover:border-[#D5C7B2]"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3 h-3 text-[#769A85]" />}
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. チャットエリア */}
      <section className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* メッセージ本文 */}
            <div className="flex items-start gap-2.5 max-w-[94%] md:max-w-[88%]">
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D5C7B2] flex-shrink-0 mt-0.5 bg-[#F4EFE6] relative">
                  <Image
                    src="/images/shizuku.jpg"
                    alt="静久"
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              )}

              <div className="group relative">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm transition-all ${
                    msg.role === "user"
                      ? "bg-[#769A85] text-white rounded-br-xs font-normal"
                      : "bg-white border border-[#E8DFD1] text-[#2B2319] rounded-tl-xs"
                  }`}
                  style={{ color: msg.role === "user" ? "#FFFFFF" : "#2B2319" }}
                >
                  {msg.content}
                </div>

                {/* 音声再生ボタン（静久のメッセージのみ） */}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakText(msg.content)}
                    title="このメッセージを声で聴く"
                    className="absolute -right-8 bottom-1 p-1 rounded-full text-[#8C7355] hover:text-[#517460] hover:bg-[#FAF7F2] transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* クイック返信チップ（最新のメッセージにのみ表示） */}
            {msg.quickReplies && msg.quickReplies.length > 0 && index === messages.length - 1 && !isLoading && (
              <div className="mt-3 flex flex-wrap gap-2 max-w-full pl-11">
                {msg.quickReplies.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => handleSendMessage(reply)}
                    className="text-xs px-3.5 py-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#769A85] hover:bg-[#EAF0EC]/50 text-[#453829] transition-all shadow-xs flex items-center gap-1.5 text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#769A85] flex-shrink-0" />
                    <span>{reply}</span>
                  </button>
                ))}
              </div>
            )}

            {/* アニメ紹介カード（友達が送ってくれたURLプレビュー風） */}
            {msg.recommendedAnime && (
              <div className="mt-3 ml-11 w-full max-w-md bg-white border border-[#E8DFD1] rounded-2xl overflow-hidden shadow-md animate-in fade-in slide-in-from-bottom-2">
                <div className="flex p-3.5 gap-3.5">
                  <img
                    src={msg.recommendedAnime.posterUrl}
                    alt={msg.recommendedAnime.title}
                    className="w-20 h-28 object-cover rounded-xl border border-[#E8DFD1] flex-shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#8C7355] font-medium border border-[#E8DFD1]">
                          {msg.recommendedAnime.energyLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#2B2319] leading-snug line-clamp-1">
                        {msg.recommendedAnime.title}
                      </h3>
                      <p className="text-[11px] text-[#8C7355] mb-1.5">{msg.recommendedAnime.episodes}</p>
                      <p className="text-xs text-[#63503B] line-clamp-2 leading-relaxed">
                        {msg.recommendedAnime.description}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(msg.recommendedAnime.title + " アニメ 配信")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#517460] hover:underline text-[11px] font-medium flex items-center gap-1 mt-1"
                    >
                      配信情報をGoogleで確認
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 契約状況に応じた補足 */}
                {msg.availabilityNote && (
                  <div className="px-3.5 py-2.5 bg-[#FAF7F2] border-t border-[#E8DFD1] text-[11px] text-[#63503B]">
                    <p className="leading-relaxed">
                      💡 {msg.availabilityNote.message}
                    </p>
                  </div>
                )}

                {/* ワンクリック・フィードバックボタン（最新の提案のみ） */}
                {index === messages.length - 1 && !isLoading && (
                  <div className="p-3 bg-white border-t border-[#E8DFD1] flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        handleSendMessage(
                          `『${msg.recommendedAnime!.title}』はもう観たことあるよ。他の作品はある？`
                        )
                      }
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#D5C7B2] hover:border-[#769A85] hover:bg-[#EAF0EC] text-[#453829] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>👀 もう観たことある</span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage(
                          `今はちょっと気分じゃないかも……別のタイプのアニメはある？`
                        )
                      }
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#D5C7B2] hover:border-[#769A85] hover:bg-[#EAF0EC] text-[#453829] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>🍵 ちょっと気分じゃないかも</span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage(`おすすめしてくれてありがとう！観てみるね`)
                      }
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#EAF0EC] border border-[#769A85] text-[#517460] font-medium hover:bg-[#769A85] hover:text-white transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>✨ ありがとう、観てみるね</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 入力中インジケータ（LINEライクな波打つ3つのドット） */}
        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D5C7B2] flex-shrink-0 bg-[#F4EFE6] relative">
              <Image
                src="/images/shizuku.jpg"
                alt="静久"
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
            <div className="bg-white border border-[#E8DFD1] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8C7355] animate-typing" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#8C7355] animate-typing" style={{ animationDelay: "200ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#8C7355] animate-typing" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* 5. 下部入力フォーム（文字が絶対にはっきり見える設計） */}
      <footer className="border-t border-[#E8DFD1] pt-3 pb-3 safe-bottom bg-[#FAF7F2] sticky bottom-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          {/* 音声入力ボタン */}
          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? "音声入力を停止" : "声で入力する"}
            className={`p-3 rounded-2xl border transition-all flex-shrink-0 shadow-xs ${
              isRecording
                ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                : "bg-white border-[#D5C7B2] hover:border-[#769A85] text-[#63503B] hover:text-[#517460]"
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* 入力欄（強制的に白背景・濃い黒文字を指定） */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording
                ? "お話しください……（聞き取っています）"
                : "今夜の気持ちを教えてね（声での入力もできるよ）…"
            }
            disabled={isLoading}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1A1A1A",
              caretColor: "#1A1A1A",
            }}
            className="flex-1 bg-white border-2 border-[#CBB89D] focus:border-[#769A85] rounded-2xl px-4 py-3 text-sm font-medium placeholder:text-[#9C8E7D] focus:outline-none transition-all shadow-xs"
          />

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-[#769A85] hover:bg-[#517460] disabled:opacity-35 disabled:hover:bg-[#769A85] text-white p-3 rounded-2xl transition-all shadow-sm flex-shrink-0"
            title="送信"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="text-[11px] text-[#8C7355] text-center mt-2">
          無理な登録や購入は一切おすすめしません。ゆっくり休んでくださいね。
        </p>
      </footer>
    </main>
  );
}
