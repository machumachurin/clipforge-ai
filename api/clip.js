// ClipForge AI — TwitchクリップURL情報取得API
// ==============================================
// TwitchクリップのURLからゲーム名・チャンネル名などの情報を取得する

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

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(200).json({
            error: true,
            message: 'Twitch APIが設定されていません。手動で情報を入力してください。'
        });
    }

    try {
        const { clipUrl } = req.body;

        if (!clipUrl) {
            return res.status(400).json({ error: true, message: 'クリップURLを入力してください' });
        }

        // クリップIDをURLから抽出
        const clipId = extractClipId(clipUrl);
        if (!clipId) {
            return res.status(400).json({
                error: true,
                message: '有効なTwitchクリップURLではありません。\n例: https://clips.twitch.tv/ExampleClip や https://www.twitch.tv/channel/clip/ExampleClip'
            });
        }

        // App Access Token を取得（Client Credentials Flow）
        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
        });

        if (!tokenResponse.ok) {
            return res.status(200).json({
                error: true,
                message: 'Twitchの認証に失敗しました'
            });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // クリップ情報を取得
        const clipResponse = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!clipResponse.ok) {
            return res.status(200).json({
                error: true,
                message: 'クリップ情報の取得に失敗しました'
            });
        }

        const clipData = await clipResponse.json();

        if (!clipData.data || clipData.data.length === 0) {
            return res.status(200).json({
                error: true,
                message: 'クリップが見つかりませんでした。URLを確認してください。'
            });
        }

        const clip = clipData.data[0];

        // ゲーム名を取得（game_idから）
        let gameName = '';
        if (clip.game_id) {
            const gameResponse = await fetch(`https://api.twitch.tv/helix/games?id=${clip.game_id}`, {
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (gameResponse.ok) {
                const gameData = await gameResponse.json();
                if (gameData.data && gameData.data.length > 0) {
                    gameName = gameData.data[0].name;
                }
            }
        }

        return res.status(200).json({
            error: false,
            clipTitle: clip.title,
            channelName: clip.broadcaster_name,
            gameName: gameName,
            viewCount: clip.view_count,
            createdAt: clip.created_at,
            thumbnailUrl: clip.thumbnail_url,
            clipUrl: clip.url
        });

    } catch (error) {
        console.error('Twitchクリップ取得エラー:', error);
        return res.status(200).json({
            error: true,
            message: 'クリップ情報の取得中にエラーが発生しました'
        });
    }
}

// クリップURLからIDを抽出する関数
function extractClipId(url) {
    try {
        // パターン1: https://clips.twitch.tv/ClipID
        const pattern1 = /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/;
        // パターン2: https://www.twitch.tv/channel/clip/ClipID
        const pattern2 = /twitch\.tv\/[^\/]+\/clip\/([a-zA-Z0-9_-]+)/;
        // パターン3: クリップIDが直接入力された場合
        const pattern3 = /^[a-zA-Z0-9_-]+$/;

        let match = url.match(pattern1);
        if (match) return match[1];

        match = url.match(pattern2);
        if (match) return match[1];

        // URLではなく直接IDが入力された場合
        if (pattern3.test(url.trim())) {
            return url.trim();
        }

        return null;
    } catch (e) {
        return null;
    }
}
