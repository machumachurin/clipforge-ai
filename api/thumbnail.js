// ClipForge AI — サムネイル画像生成API（お試し版）
// ==============================================
// OpenAI DALL-E APIを使ってサムネイル画像を生成

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'POSTのみ' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({ error: true, message: 'APIキーが設定されていません' });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: true, message: 'プロンプトが必要です' });
        }

        const imagePrompt = `Gaming stream thumbnail, high quality, vibrant colors, dynamic composition. ${prompt}. Style: eye-catching YouTube/Twitch thumbnail, bold text overlay areas, dramatic lighting, 16:9 aspect ratio`;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: imagePrompt,
                n: 1,
                size: '1792x1024',
                quality: 'standard'
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(200).json({
                error: true,
                message: `画像生成エラー: ${response.status}`
            });
        }

        const data = await response.json();
        return res.status(200).json({
            error: false,
            imageUrl: data.data[0].url
        });

    } catch (error) {
        console.error('サムネイル生成エラー:', error);
        return res.status(200).json({
            error: true,
            message: 'サムネイル生成に失敗しました'
        });
    }
}
