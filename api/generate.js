// ClipForge AI — サーバーレス関数（Vercel用）
// ==============================================
// この関数はVercelのサーバー上で動き、OpenAI APIと安全に通信します。
// ユーザーのブラウザからは直接APIキーが見えないようにしています。

import OpenAI from 'openai';

export default async function handler(req, res) {
    // CORS（クロスオリジン）対応
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
        // APIキーがない場合はフォールバック（テンプレート生成）を返す
        return res.status(200).json({
            fallback: true,
            message: 'OpenAI APIキーが設定されていないため、テンプレート生成を使用しています'
        });
    }

    try {
        const { gameName, highlights, channelName, platform, tone } = req.body;

        if (!gameName || !highlights) {
            return res.status(400).json({ error: 'ゲームタイトルとハイライトは必須です' });
        }

        const openai = new OpenAI({ apiKey });

        const toneDescriptions = {
            hype: 'テンション高め・興奮系。「ヤバい」「神」「最強」などの表現を使う。wwwや！を多用',
            funny: 'おもしろ系・ネタ系。「草」「w」「放送事故」などの表現。ツッコミ風',
            chill: 'まったり・癒し系。穏やかで温かい雰囲気。絵文字は控えめに',
            skilled: 'スキル・プレイ重視。「神エイム」「クラッチ」「無双」などの表現。上手さを強調'
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

以下の形式でJSON形式で出力してください（他の文章は不要）:

{
  "titles": [
    "(クリップタイトル案1 - YouTubeでクリックされるような魅力的なタイトル。【】や絵文字を効果的に使用)",
    "(クリップタイトル案2 - 別の切り口のタイトル)",
    "(クリップタイトル案3)",
    "(クリップタイトル案4)",
    "(クリップタイトル案5)"
  ],
  "snsPosts": [
    "(Twitter/X用投稿文1 - 140文字以内。ハッシュタグ3-4個付き。配信の宣伝)",
    "(Twitter/X用投稿文2 - 別のアプローチの投稿文)",
    "(Twitter/X用投稿文3 - エンゲージメント重視の投稿文)"
  ],
  "description": "(YouTube/Twitch概要欄テンプレート。セクション分けして、配信情報・ハイライト・フォロー誘導を含む。━━━━で区切る)",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5", "タグ6", "タグ7", "タグ8", "タグ9", "タグ10", "タグ11", "タグ12"]
}`;

        const completion = await openai.chat.completions.create({
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
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content);

        return res.status(200).json({
            fallback: false,
            ...result
        });

    } catch (error) {
        console.error('AI生成エラー:', error);
        return res.status(500).json({
            error: 'AI生成中にエラーが発生しました',
            details: error.message
        });
    }
}
