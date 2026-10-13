# 技術アーキテクチャ・API構成仕様書

## 1. システム全体図

```mermaid
graph TD
    subgraph Frontend [フロントエンド (Web App)]
        UI[対話UI / キャラ選択 / HP入力 / VOD選択]
        Card[作品処方カード / 視聴手段リンク]
    end

    subgraph Backend [バックエンド API]
        ChatController[対話・セッション制御]
        SafetyGuard[セーフティ・地雷フィルタ]
        RecommendationEngine[レコメンド・プロンプトエンジン]
        AvailabilityChecker[配信・価格判定モジュール]
    end

    subgraph External [外部サービス・API]
        LLM[LLM API (Gemini 2.5/Flash / OpenAI / Claude)]
        TMDB[TMDB API (作品情報・JP配信プロバイダー)]
        Search[Web Search / 検索グラウンディング (直リンク・価格取得)]
    end

    UI --> ChatController
    ChatController --> SafetyGuard
    SafetyGuard -- 危機発知 --> UI
    SafetyGuard -- 安全 --> RecommendationEngine
    RecommendationEngine --> LLM
    RecommendationEngine --> AvailabilityChecker
    AvailabilityChecker --> TMDB
    AvailabilityChecker --> Search
    AvailabilityChecker --> Card
```

---

## 2. 確定技術スタック (Phase 1)

| レイヤー | 採用技術 | 選定理由 |
|:---|:---|:---|
| **フロントエンド** | **Next.js 14+ (App Router)** + **React** + **Tailwind CSS** + **Lucide Icons** | 高速なプロトタイピング、SSR/APIルート統合、リッチなUIコンポーネント |
| **バックエンド** | **Next.js Route Handlers (TypeScript)** | サーバーレスで完結し、デプロイや環境構築が最小限 |
| **LLM** | **Google Gemini Flash Lite (`gemini-3.5-flash-lite`)** + **自動フェイルオーバー (`gemini-3.5-flash`)** | 基本は低コスト・軽量なFlash Liteで推論し、高負荷・遅延時（5秒経過またはエラー）のみ自動でFlashへフォールバックして体験を死守 |
| **作品・配信データ** | **安全シードデータ (ローカルJSON) ＋ Gemini推論** | TMDB等の追加APIキー不要で即座に動作。地雷トリガー検証済みの作品プール |
| **状態管理** | **React State + LocalStorage** | ログイン不要、セッション維持、翌日の再訪挨拶を実現 |

---

## 3. 主要API・データ連携仕様

### ① LLM: 階層的フェイルオーバー設計 (`@google/genai`)
- **プライマリ**: `gemini-3.5-flash-lite`（5秒タイムアウト設定）
- **セカンダリ（自動切替）**: `gemini-3.5-flash`（プライマリのタイムアウト・503エラー時に即時呼び出し）
- **ターシャリ（安全網）**: ローカルスマートフォールバック（両系障害時にもフリーズせず温かい返答を維持）
- **主な役割**:
  - **傾聴モード (`action: "listen"`)**: ユーザーの吐露に対する深い共感・傾聴、状況の深掘り質問、クイック選択肢の動的生成。
  - **推薦モード (`action: "recommend"`)**: 「母性あふれるキャラクター（静久）」の視点から、相手の心に今夜必要な作品をセレクトし、愛情のこもった推薦理由を生成。
  - **セーフティ判定**: 希死念慮・重度自傷の文脈検知。

### ② データ戦略（追加APIキー不要の設計）
- TMDB等のAPIキーがない状態でも確実に動作し、かつ地雷を踏まないようにするため、**「地雷検証済みアニメ・シードマスター」** をローカルに配置。
- シードデータには以下を含める：
  - タイトル、ジャンル、視聴カロリー（ショート/1クール/映画）
  - 国内主要VOD配信状況（Netflix, Prime Video, U-NEXT, dアニメストア, DMM TV, Disney+）
  - 地雷フリータグ（「いじめ描写なし」「過度な挫折なし」「死別なし」等）
  - キービジュアル・あらすじ・公式リンク
- LLMはユーザーの感情とこのマスターデータを照合し、最適な1作を選択してキャラクターとして語りかける。

