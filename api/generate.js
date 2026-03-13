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

        const prompt = `あなたは日本のゲーム配信・ストリーマー文化に精通したコンテンツマーケターです。
以下の配信情報から、バズるコンテンツを生成してください。

【配信情報】
- ゲーム: ${gameName}
- プラットフォーム: ${platformLabel}
- ハイライト: ${highlights}
- チャンネル名: ${channel}
- トーン: ${toneDesc}

以下のJSON形式で出力（他の文章は不要）:
{
  "titles": ["タイトル案1", "タイトル案2", "タイトル案3", "タイトル案4", "タイトル案5"],
  "snsPosts": ["SNS投稿文1（ハッシュタグ付き）", "SNS投稿文2", "SNS投稿文3"],
  "description": "概要欄テンプレート（セクション分け、配信情報、フォロー誘導含む）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5", "タグ6", "タグ7", "タグ8", "タグ9", "タグ10", "タグ11", "タグ12"]
}`;

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
                        content: 'あなたは日本のゲーム配信者向けのコンテンツ生成AIです。必ずJSON形式のみで回答してください。'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 2000,
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
