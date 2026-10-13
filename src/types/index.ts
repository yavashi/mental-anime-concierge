export type StressFactor =
  | "work_burnout" // 仕事・過労・理不尽な叱責
  | "human_relationship" // 対人関係の摩擦・いじめ・孤立
  | "self_blame" // 自信喪失・ミス・劣等感
  | "loneliness" // 孤独感・寂しさ・虚無感
  | "exhaustion" // ただただ疲れ果てた・思考停止したい
  | "other";

export type VodPlatform =
  | "netflix"
  | "prime_video"
  | "unext"
  | "danime"
  | "dmm_tv"
  | "disney_plus";

export interface VodInfo {
  id: VodPlatform;
  name: string;
  iconName: string;
  color: string;
}

export type ViewEnergy = "short" | "standard" | "movie"; // 視聴カロリー (ショート/1クール/映画)

export interface AnimeItem {
  id: string;
  title: string;
  originalTitle?: string;
  description: string;
  episodes: string; // 例: "全12話" / "全10話 (1話約3分)" / "劇場版 (111分)"
  energy: ViewEnergy;
  energyLabel: string; // 例: "サクッと3分" / "1話完結で安心" / "今夜映画で完結"
  genres: string[];
  safePoints: string[]; // 例: ["理不尽な怒声なし", "誰も責められない優しい世界", "過度な挫折なし"]
  streamingPlatforms: VodPlatform[];
  officialUrl?: string;
  posterUrl: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  quickReplies?: string[];
  recommendedAnime?: AnimeItem;
  recommendationReason?: string;
  availabilityNote?: {
    type: "in_plan" | "out_of_plan_warning" | "disc_or_rental" | "premium_stop";
    message: string;
    alternativeAnime?: AnimeItem;
  };
  isCrisis?: boolean;
}

export interface UserSessionState {
  userHp: number; // 0 - 100
  selectedVods: VodPlatform[];
  stressCategory?: StressFactor;
  turn: number;
  introducedAnimeIds: string[]; // すでに紹介済みの作品IDリスト
}

