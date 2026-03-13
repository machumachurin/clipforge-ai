/* ========================================
   ClipForge AI — Application Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initPlatformSelector();
    initToneSelector();
    initGenerator();
    initClipUrlFetcher();
    initStatCounters();
    initScrollAnimations();
});

/* ─── Navbar ─── */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '60px';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.flexDirection = 'column';
            navLinks.style.background = 'rgba(10, 10, 15, 0.98)';
            navLinks.style.padding = '1.5rem';
            navLinks.style.gap = '1rem';
            navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        });
    }

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
                // Close mobile menu
                if (window.innerWidth <= 768) {
                    navLinks.style.display = 'none';
                }
            }
        });
    });
}

/* ─── Platform Selector ─── */
function initPlatformSelector() {
    const btns = document.querySelectorAll('.platform-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

/* ─── Tone Selector ─── */
function initToneSelector() {
    const btns = document.querySelectorAll('.tone-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

/* ─── Stat Counter Animation ─── */
function initStatCounters() {
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(el, target) {
    const duration = 1500;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(eased * target);
        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* ─── Scroll Animations ─── */
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.feature-card, .step, .pricing-card, .output-section'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = entry.target.classList.contains('pricing-featured')
                    ? 'scale(1.05)' : 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.5s ease ${i % 3 * 0.1}s`;
        observer.observe(el);
    });
}

/* ─── Generator ─── */
function initGenerator() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', handleGenerate);
}

/* ─── Clip URL Fetcher（TwitchクリップURL自動取得） ─── */
function initClipUrlFetcher() {
    const fetchBtn = document.getElementById('fetchClipBtn');
    const clipInput = document.getElementById('clipUrl');

    if (!fetchBtn || !clipInput) return;

    // ボタンクリック時
    fetchBtn.addEventListener('click', handleClipFetch);

    // URLペースト時に自動で取得開始
    clipInput.addEventListener('paste', () => {
        setTimeout(() => {
            if (clipInput.value.includes('twitch.tv')) {
                handleClipFetch();
            }
        }, 100);
    });
}

async function handleClipFetch() {
    const clipInput = document.getElementById('clipUrl');
    const fetchBtn = document.getElementById('fetchClipBtn');
    const fetchText = fetchBtn.querySelector('.fetch-text');
    const fetchLoading = fetchBtn.querySelector('.fetch-loading');
    const statusEl = document.getElementById('clipStatus');

    const clipUrl = clipInput.value.trim();

    if (!clipUrl) {
        showClipStatus('error', 'クリップURLを入力してください');
        shakeElement(clipInput);
        return;
    }

    // ローディング表示
    fetchText.style.display = 'none';
    fetchLoading.style.display = 'inline-flex';
    fetchBtn.disabled = true;

    try {
        const response = await fetch('/api/clip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clipUrl })
        });

        const data = await response.json();

        if (data.error) {
            showClipStatus('error', data.message || 'クリップ情報の取得に失敗しました');
        } else {
            // フォームに自動入力
            if (data.gameName) {
                document.getElementById('gameName').value = data.gameName;
                highlightField('gameName');
            }
            if (data.channelName) {
                document.getElementById('channelName').value = data.channelName;
                highlightField('channelName');
            }
            if (data.clipTitle) {
                document.getElementById('highlights').value = data.clipTitle;
                highlightField('highlights');
            }

            // Twitchを自動選択
            const twitchBtn = document.getElementById('btn-twitch');
            if (twitchBtn && !twitchBtn.classList.contains('active')) {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                twitchBtn.classList.add('active');
            }

            const info = [
                data.gameName ? `🎮 ${data.gameName}` : '',
                data.channelName ? `📺 ${data.channelName}` : '',
                data.viewCount ? `👁️ ${data.viewCount.toLocaleString()}回視聴` : ''
            ].filter(Boolean).join('　');

            showClipStatus('success', `✅ 取得成功！ ${info}`);
        }
    } catch (e) {
        showClipStatus('error', 'APIに接続できませんでした。手動で情報を入力してください。');
    }

    // ボタンリセット
    fetchText.style.display = 'inline';
    fetchLoading.style.display = 'none';
    fetchBtn.disabled = false;
}

function showClipStatus(type, message) {
    const statusEl = document.getElementById('clipStatus');
    statusEl.style.display = 'block';
    statusEl.className = `clip-status ${type}`;
    statusEl.textContent = message;

    // 成功時は5秒後に非表示
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = 'var(--color-success)';
    field.style.boxShadow = '0 0 0 3px rgba(52, 211, 153, 0.15)';
    setTimeout(() => {
        field.style.borderColor = '';
        field.style.boxShadow = '';
    }, 2000);
}

async function handleGenerate() {
    const gameName = document.getElementById('gameName').value.trim();
    const highlights = document.getElementById('highlights').value.trim();
    const channelName = document.getElementById('channelName').value.trim();
    const platform = document.querySelector('.platform-btn.active')?.dataset.platform || 'twitch';
    const tone = document.querySelector('.tone-btn.active')?.dataset.tone || 'hype';

    // Validation（入力チェック）
    if (!gameName) {
        shakeElement(document.getElementById('gameName'));
        return;
    }
    if (!highlights) {
        shakeElement(document.getElementById('highlights'));
        return;
    }

    // Show loading state（ローディング表示）
    const btn = document.getElementById('generateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    btn.disabled = true;

    let results;
    let usedAI = false;

    try {
        // まずAI APIを試す
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameName, highlights, channelName, platform, tone })
        });

        if (response.ok) {
            const data = await response.json();
            if (!data.fallback && data.titles) {
                // AI APIの結果を使用
                results = data;
                usedAI = true;
            }
        }
    } catch (e) {
        // APIが利用できない場合は無視（フォールバックに進む）
        console.log('AI API利用不可、テンプレート生成にフォールバック:', e.message);
    }

    // フォールバック: テンプレートベースの生成
    if (!results) {
        await sleep(800); // テンプレート生成は速いので少し待つ
        results = generateContent({ gameName, highlights, channelName, platform, tone });
    }

    // Render results（結果を画面に表示）
    renderResults(results);

    // AI使用バッジの表示
    showGenerationBadge(usedAI);

    // Reset button（ボタンを元に戻す）
    btnText.style.display = 'inline-flex';
    btnLoading.style.display = 'none';
    btn.disabled = false;

    // Show output panel（結果パネルを表示）
    const outputPanel = document.getElementById('outputPanel');
    outputPanel.style.display = 'block';

    // Scroll to results（結果までスクロール）
    setTimeout(() => {
        outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// AI使用バッジの表示
function showGenerationBadge(usedAI) {
    // 既存のバッジを削除
    const existingBadge = document.getElementById('ai-badge');
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement('div');
    badge.id = 'ai-badge';
    badge.style.cssText = `
        text-align: center;
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        animation: fadeInUp 0.5s ease forwards;
    `;

    if (usedAI) {
        badge.style.background = 'rgba(94, 234, 212, 0.1)';
        badge.style.border = '1px solid rgba(94, 234, 212, 0.3)';
        badge.style.color = '#5eead4';
        badge.textContent = '✨ AI生成（GPT-4o-mini）';
    } else {
        badge.style.background = 'rgba(145, 71, 255, 0.1)';
        badge.style.border = '1px solid rgba(145, 71, 255, 0.3)';
        badge.style.color = '#9147ff';
        badge.textContent = '⚡ テンプレート生成';
    }

    const outputPanel = document.getElementById('outputPanel');
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    wrapper.appendChild(badge);
    outputPanel.insertBefore(wrapper, outputPanel.firstChild);
}

function shakeElement(el) {
    el.style.borderColor = 'var(--color-error)';
    el.style.animation = 'shake 0.5s ease';
    el.addEventListener('animationend', () => {
        el.style.animation = '';
    }, { once: true });
    el.addEventListener('input', () => {
        el.style.borderColor = '';
    }, { once: true });
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

/* ─── Content Generation Engine ─── */
function generateContent({ gameName, highlights, channelName, platform, tone }) {
    const toneConfig = getToneConfig(tone);
    const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';
    const channel = channelName || '配信者';

    // Title patterns based on tone
    const titles = generateTitles(gameName, highlights, toneConfig, channel);
    const snsPosts = generateSNSPosts(gameName, highlights, toneConfig, channel, platform);
    const description = generateDescription(gameName, highlights, channel, platformLabel);
    const tags = generateTags(gameName, platform);

    return { titles, snsPosts, description, tags };
}

function getToneConfig(tone) {
    const configs = {
        hype: {
            label: 'テンション高め',
            prefixes: ['【神回】', '【衝撃】', '【鳥肌】', '【伝説】', '【奇跡】'],
            suffixes: ['がヤバすぎたwww', 'が凄すぎて泣いた', 'した結果www', 'が止まらないwww', 'で大絶叫'],
            emojis: ['🔥', '⚡', '😱', '🏆', '💥'],
            hashtags: ['神回', 'クリップ', '切り抜き', '名シーン']
        },
        funny: {
            label: 'おもしろ系',
            prefixes: ['【爆笑】', '【草】', '【放送事故】', '【カオス】', '【まさかの】'],
            suffixes: ['が面白すぎるwww', 'で腹筋崩壊www', 'したら大変なことになった', 'が草www', 'でリスナー困惑www'],
            emojis: ['😂', '🤣', '💀', '😭', '🤪'],
            hashtags: ['草', '爆笑', '面白い', '放送事故']
        },
        chill: {
            label: 'まったり',
            prefixes: ['【雰囲気◎】', '【癒し】', '【ゆるっと】', '【のんびり】', '【ほっこり】'],
            suffixes: ['が最高すぎた', 'に癒された', 'で幸せになれる配信', 'がたまらない', 'な時間'],
            emojis: ['☺️', '🌙', '✨', '🎮', '💫'],
            hashtags: ['まったり', '癒し', 'ゆるゲー', 'のんびり']
        },
        skilled: {
            label: 'スキル系',
            prefixes: ['【プロ級】', '【超絶テク】', '【1v3】', '【無双】', '【覚醒】'],
            suffixes: ['のキル集が異次元', 'でエースクラッチ', 'のプレイが上手すぎる', 'の神エイム', 'で完全制圧'],
            emojis: ['🎯', '🏆', '👑', '💪', '⚔️'],
            hashtags: ['キル集', '神プレイ', 'クラッチ', 'FPS']
        }
    };
    return configs[tone] || configs.hype;
}

function generateTitles(gameName, highlights, toneConfig, channel) {
    const titles = [];
    const highlightWords = extractKeywords(highlights);

    // Pattern 1: Prefix + Highlight + Game
    titles.push(
        `${toneConfig.prefixes[0]}${highlights.split('。')[0]}${toneConfig.suffixes[0]}【${gameName}】`
    );

    // Pattern 2: Question style
    titles.push(
        `${gameName}で${highlightWords[0] || '奇跡'}が起きた瞬間${toneConfig.suffixes[1]}`
    );

    // Pattern 3: Channel focus
    titles.push(
        `${toneConfig.prefixes[1]}${channel}の${gameName}${toneConfig.suffixes[2]}`
    );

    // Pattern 4: Number + Impact
    titles.push(
        `${toneConfig.prefixes[2]}${gameName}${toneConfig.suffixes[3]}【切り抜き】`
    );

    // Pattern 5: Curiosity gap
    titles.push(
        `${gameName}で${toneConfig.prefixes[3].replace(/[【】]/g, '')}の瞬間${toneConfig.suffixes[4]}${toneConfig.emojis[0]}`
    );

    return titles;
}

function generateSNSPosts(gameName, highlights, toneConfig, channel, platform) {
    const posts = [];
    const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';
    const emoji = toneConfig.emojis;
    const tags = toneConfig.hashtags;
    const highlightShort = highlights.length > 40 ? highlights.substring(0, 40) + '...' : highlights;

    // Post 1: Hype announcement
    posts.push(
        `${emoji[0]} ${gameName}で${highlightShort}${toneConfig.suffixes[0]}\n\n` +
        `フルはこちら↓\n` +
        `🔗 [リンク]\n\n` +
        `#${gameName.replace(/\s/g, '')} #${tags[0]} #${tags[1]} #${platformLabel}配信`
    );

    // Post 2: Clip share
    posts.push(
        `【新しい切り抜き】\n` +
        `${emoji[1]} ${highlights.split('。')[0]}\n\n` +
        `${emoji[2]} ${gameName}やってたら${toneConfig.suffixes[2]}\n\n` +
        `#${tags[2]} #${tags[3]} #ゲーム配信`
    );

    // Post 3: Engagement focused
    posts.push(
        `${emoji[3]} ${gameName}配信ありがとうございました！\n\n` +
        `今日のハイライト：\n` +
        `${emoji[4]} ${highlightShort}\n\n` +
        `明日も配信するのでぜひ遊びに来てね！\n` +
        `#${gameName.replace(/\s/g, '')} #配信者 #${platformLabel}`
    );

    return posts;
}

function generateDescription(gameName, highlights, channel, platformLabel) {
    return `${channel}の${gameName}配信のハイライト！\n\n` +
        `📌 今回のハイライト\n` +
        `${highlights}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🎮 ゲームタイトル: ${gameName}\n` +
        `📺 配信プラットフォーム: ${platformLabel}\n` +
        `🎤 配信者: ${channel}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📢 フォロー＆チャンネル登録お願いします！\n` +
        `🔔 通知ONで配信をお見逃しなく！\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🏷️ タグ\n` +
        `#${gameName.replace(/\s/g, '')} #ゲーム実況 #配信切り抜き #${channel.replace(/\s/g, '')} #${platformLabel}`;
}

function generateTags(gameName, platform) {
    const baseTags = [
        gameName,
        `${gameName} 実況`,
        `${gameName} 配信`,
        `${gameName} 切り抜き`,
        `${gameName} ハイライト`,
        'ゲーム実況',
        'ゲーム配信',
        '切り抜き',
        'クリップ',
        '面白い',
        'ハイライト',
        '名シーン'
    ];

    if (platform === 'twitch') {
        baseTags.push('Twitch', 'Twitchクリップ', 'Twitch配信者');
    } else {
        baseTags.push('YouTube', 'YouTubeゲーム実況', 'YouTube切り抜き');
    }

    // Game-specific tags
    const gameSpecific = getGameSpecificTags(gameName);
    baseTags.push(...gameSpecific);

    return [...new Set(baseTags)]; // Remove duplicates
}

function getGameSpecificTags(gameName) {
    const lower = gameName.toLowerCase();
    const tagMap = {
        'apex': ['Apex Legends', 'エーペックス', 'バトロワ', 'FPS', 'ランク', 'チャンピオン'],
        'valorant': ['VALORANT', 'ヴァロラント', 'FPS', 'タクティカルシューター', 'エース'],
        'フォートナイト': ['Fortnite', 'フォトナ', 'バトロワ', 'ビクロイ'],
        'fortnite': ['Fortnite', 'フォトナ', 'バトロワ', 'ビクロイ'],
        'マインクラフト': ['Minecraft', 'マイクラ', 'サバイバル', '建築'],
        'minecraft': ['Minecraft', 'マイクラ', 'サバイバル', '建築'],
        'スプラトゥーン': ['Splatoon', 'スプラ', 'ガチマッチ', 'Xマッチ'],
        'lol': ['League of Legends', 'LoL', 'MOBA', 'ランク'],
        'overwatch': ['Overwatch', 'オーバーウォッチ', 'OW', 'FPS', 'ランク'],
        '原神': ['Genshin Impact', '原神', 'オープンワールド', 'miHoYo'],
        'ポケモン': ['Pokemon', 'ポケモン', '対戦', 'ランクマ'],
        'スト': ['ストリートファイター', 'SF6', '格ゲー', '対戦格闘'],
        '雑談': ['雑談配信', 'トーク', 'フリートーク', '雑談枠'],
    };

    for (const [key, tags] of Object.entries(tagMap)) {
        if (lower.includes(key)) {
            return tags;
        }
    }

    return ['ゲーム', 'ゲーム実況者'];
}

function extractKeywords(text) {
    // Simple keyword extraction: split by common delimiters, filter short words
    const words = text
        .replace(/[。、！？!?…\n]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2)
        .slice(0, 5);
    return words;
}

/* ─── Render Results ─── */
function renderResults(results) {
    renderTitles(results.titles);
    renderSNSPosts(results.snsPosts);
    renderDescription(results.description);
    renderTags(results.tags);
}

function renderTitles(titles) {
    const container = document.getElementById('titles-content');
    container.innerHTML = titles.map((title, i) => `
        <div class="output-item">
            <span class="output-item-number">${i + 1}</span>
            <span class="output-item-text">${escapeHtml(title)}</span>
            <button class="copy-btn" onclick="copyToClipboard(this, '${escapeAttr(title)}')">📋 コピー</button>
        </div>
    `).join('');
}

function renderSNSPosts(posts) {
    const container = document.getElementById('sns-content');
    container.innerHTML = posts.map((post, i) => `
        <div class="output-item" style="align-items: flex-start;">
            <span class="output-item-number">${i + 1}</span>
            <span class="output-item-text">${escapeHtml(post)}</span>
            <button class="copy-btn" onclick="copyToClipboard(this, \`${escapeTemplate(post)}\`)">📋 コピー</button>
        </div>
    `).join('');
}

function renderDescription(description) {
    const container = document.getElementById('description-content');
    container.innerHTML = `
        <div class="output-description-text">
            <button class="copy-btn" onclick="copyToClipboard(this, \`${escapeTemplate(description)}\`)">📋 コピー</button>
            ${escapeHtml(description)}
        </div>
    `;
}

function renderTags(tags) {
    const container = document.getElementById('tags-content');
    container.innerHTML = `
        <div class="tags-container">
            ${tags.map(tag => `
                <span class="tag-chip" onclick="copyTag(this, '${escapeAttr(tag)}')">#${escapeHtml(tag)}</span>
            `).join('')}
        </div>
        <div style="text-align: right; padding: var(--space-md);">
            <button class="copy-btn" onclick="copyAllTags(this)">📋 全タグをコピー</button>
        </div>
    `;
}

/* ─── Clipboard Utilities ─── */
function copyToClipboard(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✅ コピー済み';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.textContent = '✅ コピー済み';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = '📋 コピー';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function copyTag(chip, tag) {
    copyToClipboard(chip, '#' + tag);
    chip.classList.add('copied');
    setTimeout(() => chip.classList.remove('copied'), 2000);
}

function copyAllTags(btn) {
    const tags = document.querySelectorAll('.tag-chip');
    const allTags = Array.from(tags).map(t => t.textContent).join(' ');
    copyToClipboard(btn, allTags);
}

/* ─── Helper Utilities ─── */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function escapeAttr(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}

function escapeTemplate(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        .replace(/\n/g, '\\n');
}
