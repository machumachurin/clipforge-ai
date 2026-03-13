// ClipForge AI — サーバーレス関数（Vercel用）
// ==============================================
// OpenAI APIと通信してコンテンツを生成する。
// ネイティブfetchを使用（外部パッケージ依存なし）

module.exports = async function handler(req, res) {
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POSTメソッドのみ対応しています' });
    }

    // APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({
            fallback: true,
            message: 'OpenAI APIキーが設定されていません'
        });
    }

    try {
        const { gameName, highlights, channelName, platform, tone } = req.body;

        if (!gameName || !highlights) {
            return res.status(400).json({ error: 'ゲームタイトルとハイライトは必須です' });
        }

        const toneDescriptions = {
            hype: 'テンション高め・興奮系。「ヤバい」「神」「最強」などの表現を使う',
            funny: 'おもしろ系・ネタ系。「草」「w」「放送事故」などの表現',
            chill: 'まったり・癒し系。穏やかで温かい雰囲気',
            skilled: 'スキル・プレイ重視。「神エイム」「クラッチ」「無双」などの表現'
        };

        const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';
        const toneDesc = toneDescriptions[tone] || toneDescriptions.hype;
        const channel = channelName || '配信者';

        const prompt = `あなたは日本のゲーム配信・ストリーマー文化に精通したコンテンツマーケター兼SNSアナリストです。
以下の配信情報から、バズるコンテンツを生成してください。

【配信情報】
- ゲーム: ${gameName}
- プラットフォーム: ${platformLabel}
- ハイライト: ${highlights}
- チャンネル名: ${channel}
- トーン: ${toneDesc}

以下のJSON形式で出力（他の文章は不要）:
{
  "titles": [
    {"text": "タイトル案1", "score": {"catchy": 85, "ctr": 90, "seo": 80}, "advice": "このタイトルが良い理由と改善ポイント"},
    {"text": "タイトル案2", "score": {"catchy": 80, "ctr": 85, "seo": 75}, "advice": "アドバイス"},
    {"text": "タイトル案3", "score": {"catchy": 75, "ctr": 80, "seo": 85}, "advice": "アドバイス"},
    {"text": "タイトル案4", "score": {"catchy": 70, "ctr": 75, "seo": 80}, "advice": "アドバイス"},
    {"text": "タイトル案5", "score": {"catchy": 65, "ctr": 70, "seo": 75}, "advice": "アドバイス"}
  ],
  "snsPosts": ["SNS投稿文1（ハッシュタグ3-4個付き）", "SNS投稿文2", "SNS投稿文3"],
  "description": "概要欄テンプレート（セクション分け、配信情報、フォロー誘導含む）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5", "タグ6", "タグ7", "タグ8", "タグ9", "タグ10", "タグ11", "タグ12"],
  "bestPostingTime": {
    "best": "21:00-23:00",
    "reason": "この時間帯がおすすめの理由（ゲームジャンルや視聴者層を踏まえて）",
    "days": ["金曜", "土曜", "日曜"]
  },
  "thumbnailIdea": "サムネイル画像の具体的なビジュアル案（色使い、テキスト配置、表情、エフェクトなど詳細に）"
}

注意事項:
- titlesのscoreはcatchy(キャッチーさ),ctr(クリック誘引力),seo(検索最適化)の3項目で0-100で評価
- scoreは正直に差をつけて。全部高いスコアにしないこと
- adviceは具体的に（なぜこのスコアなのか、どう改善できるか）
- bestPostingTimeはゲームジャンルと${platformLabel}の視聴者層を考慮
- thumbnailIdeaは画像生成AIに指示できるレベルの詳細さで`;

        // OpenAI APIをfetchで直接呼び出し
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'あなたは日本のゲーム配信者向けのコンテンツ生成・分析AIです。必ずJSON形式のみで回答してください。スコアは正直に差をつけて評価すること。'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 3000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI APIエラー:', response.status, errorData);
            return res.status(200).json({
                fallback: true,
                message: `OpenAI APIエラー: ${response.status}`
            });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);

        return res.status(200).json({
            fallback: false,
            ...result
        });

    } catch (error) {
        console.error('AI生成エラー:', error);
        return res.status(200).json({
            fallback: true,
            message: error.message
        });
    }
}
