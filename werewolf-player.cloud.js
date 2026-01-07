// 角色定义（与法官端保持一致）
const ROLES = {
    // 狼人阵营
    wolf: { name: '狼人', camp: 'wolf', emoji: '🐺' },
    wolfKing: { name: '狼王', camp: 'wolf', emoji: '👑' },
    hiddenWolf: { name: '隐狼', camp: 'wolf', emoji: '🌑' },
    wolfBeauty: { name: '狼美人', camp: 'wolf', emoji: '💋' },
    
    // 神职角色
    seer: { name: '预言家', camp: 'good', emoji: '🔮' },
    witch: { name: '女巫', camp: 'good', emoji: '🧪' },
    hunter: { name: '猎人', camp: 'good', emoji: '🏹' },
    guard: { name: '守卫', camp: 'good', emoji: '🛡️' },
    gravekeeper: { name: '守墓人', camp: 'good', emoji: '🪦' },
    magician: { name: '魔术师', camp: 'good', emoji: '🎩' },
    crow: { name: '乌鸦', camp: 'good', emoji: '🐦' },
    elder: { name: '禁言长老', camp: 'good', emoji: '🤐' },
    cupid: { name: '丘比特', camp: 'good', emoji: '💘' },
    knight: { name: '骑士', camp: 'good', emoji: '⚔️' },
    
    // 特殊角色
    thief: { name: '盗贼', camp: 'good', emoji: '🎭' },
    wildChild: { name: '野孩子', camp: 'good', emoji: '👶' },
    
    // 平民
    villager: { name: '村民', camp: 'good', emoji: '👨' }
};

// 云端会话ID：优先从 URL 读取（player.html?session=xxx），没有则允许手动输入
let CURRENT_SESSION_ID = null;
try {
  CURRENT_SESSION_ID = new URLSearchParams(window.location.search).get('session');
} catch(e) {}

// 当前玩家状态
let currentPlayer = {
    number: null,
    cards: [],
    topFixed: null,
    topCard: null,
    bottomCard: null,
    confirmed: false
};

// 登录
async function login() {
    const numberInput = document.getElementById('player-number');
    const passwordInput = document.getElementById('player-password');
    
    const playerNumber = parseInt(numberInput.value);
    const password = passwordInput.value.trim();
    
    // 验证输入
    if (!playerNumber || playerNumber < 1) {
        alert('❌ 请输入有效的号码！');
        return;
    }
    
    if (!password || password.length !== 4) {
        alert('❌ 请输入4位密码！');
        return;
    }
    
    // 读取游戏会话（云端优先）
    let gameData = null;

    if (window.CloudStore) {
        // 1) URL 里带了 session 参数就用它
        // 2) 否则允许玩家在“游戏会话ID”输入框里自己填（你如果想要我再加这个输入框，我也能加）
        const sid = CURRENT_SESSION_ID;
        if (!sid) {
            alert('❌ 缺少游戏会话ID！

请让法官把“玩家链接”发给你（包含 ?session=...）。');
            return;
        }
        try {
            gameData = await window.CloudStore.loadSessionData(sid);
        } catch (e) {
            alert('❌ 连接云端失败！

请稍后重试，或让法官确认会话是否有效。');
            return;
        }

        if (!gameData) {
            alert('❌ 没有找到该会话！

请检查链接是否正确，或让法官重新生成会话。');
            return;
        }
    } else {
        // 兜底：本地模式（单机调试）
        const sessionData = localStorage.getItem('werewolf_game_session');
        if (!sessionData) {
            alert('❌ 没有找到游戏会话！

请确认法官已经生成发牌。');
            return;
        }
        try {
            gameData = JSON.parse(sessionData);
        } catch (e) {
            alert('❌ 游戏数据错误！');
            return;
        }
    }
    
    // 验证号码和密码
    if (!gameData.passwords[playerNumber]) {
        alert('❌ 号码不存在！\n\n请检查号码是否正确。');
        return;
    }
    
    if (gameData.passwords[playerNumber] !== password) {
        alert('❌ 密码错误！\n\n请重新输入。');
        return;
    }
    
    // 获取玩家的牌
    const distribution = gameData.distributions[playerNumber];
    if (!distribution || !distribution.cards || distribution.cards.length !== 2) {
        alert('❌ 该号码没有分配到牌！');
        return;
    }
    
    // 登录成功
    currentPlayer.number = playerNumber;
    currentPlayer.cards = distribution.cards;
    currentPlayer.topFixed = distribution.topFixed;
    
    // 检查是否已经选择过
    const selection = gameData.selections[playerNumber];
    if (selection && selection.confirmed) {
        currentPlayer.confirmed = true;
        currentPlayer.topCard = selection.top;
        currentPlayer.bottomCard = selection.bottom;
    }
    
    // 显示选择界面
    showSelectionSection();
}

// 显示选择界面
function showSelectionSection() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('selection-section').classList.add('active');
    
    // 显示玩家信息
    const playerInfo = document.getElementById('player-info');
    playerInfo.innerHTML = `<div class="alert alert-info"><strong>${currentPlayer.number}号玩家</strong></div>`;
    
    // 显示牌
    const cardsDisplay = document.getElementById('cards-display');
    let cardsHTML = '<div style="margin-bottom: 20px;">';
    
    currentPlayer.cards.forEach(roleId => {
        const role = ROLES[roleId];
        const campClass = role.camp === 'wolf' ? 'wolf' : 'good';
        cardsHTML += `
            <div class="role-card ${campClass}">
                <div class="role-name">${role.emoji} ${role.name}</div>
                <div class="role-desc">${role.camp === 'wolf' ? '狼人阵营' : '好人阵营'}</div>
            </div>
        `;
    });
    
    cardsHTML += '</div>';
    cardsDisplay.innerHTML = cardsHTML;
    
    // 如果有固定上牌
    const selectionArea = document.getElementById('selection-area');
    if (currentPlayer.topFixed) {
        const fixedRole = ROLES[currentPlayer.topFixed];
        const otherCard = currentPlayer.cards.find(c => c !== currentPlayer.topFixed);
        
        selectionArea.innerHTML = `
            <div class="fixed-indicator">
                <strong>🔒 ${fixedRole.name} 必须在上牌</strong><br>
                这是第一夜角色，系统已自动设置。
            </div>
            <div class="input-group">
                <label>上牌（第一身份）🔒</label>
                <input type="text" value="${fixedRole.emoji} ${fixedRole.name}" disabled style="background:#f0f0f0;">
            </div>
            <div class="input-group">
                <label>下牌（第二身份）🔒</label>
                <input type="text" value="${ROLES[otherCard].emoji} ${ROLES[otherCard].name}" disabled style="background:#f0f0f0;">
            </div>
        `;
        
        // 自动设置
        currentPlayer.topCard = currentPlayer.topFixed;
        currentPlayer.bottomCard = otherCard;
        
        // 显示阵营
        updateCampDisplay();
        
        // 添加确认按钮
        selectionArea.innerHTML += '<button class="btn" onclick="confirmSelection()" style="margin-top:20px;">✅ 确认选择</button>';
    } else {
        // 填充下拉选项
        const topSelect = document.getElementById('top-card');
        const bottomSelect = document.getElementById('bottom-card');
        
        topSelect.innerHTML = '<option value="">请选择</option>';
        bottomSelect.innerHTML = '<option value="">请选择</option>';
        
        currentPlayer.cards.forEach(roleId => {
            const role = ROLES[roleId];
            topSelect.innerHTML += `<option value="${roleId}">${role.emoji} ${role.name}</option>`;
            bottomSelect.innerHTML += `<option value="${roleId}">${role.emoji} ${role.name}</option>`;
        });
        
        // 如果已经选择过，回显
        if (currentPlayer.confirmed) {
            topSelect.value = currentPlayer.topCard;
            bottomSelect.value = currentPlayer.bottomCard;
            topSelect.disabled = true;
            bottomSelect.disabled = true;
            updateCampDisplay();
            showConfirmedMessage();
        } else {
            // 监听变化
            topSelect.addEventListener('change', validateAndUpdateCamp);
            bottomSelect.addEventListener('change', validateAndUpdateCamp);
        }
    }
    
    // 如果已确认，显示确认消息
    if (currentPlayer.confirmed) {
        showConfirmedMessage();
    }
}

// 验证和更新阵营显示
function validateAndUpdateCamp() {
    const topSelect = document.getElementById('top-card');
    const bottomSelect = document.getElementById('bottom-card');
    const campDisplay = document.getElementById('camp-display');
    
    const topCard = topSelect.value;
    const bottomCard = bottomSelect.value;
    
    if (!topCard || !bottomCard) {
        campDisplay.innerHTML = '';
        return;
    }
    
    if (topCard === bottomCard) {
        campDisplay.innerHTML = '<div class="alert alert-danger">❌ 上牌和下牌不能相同！</div>';
        return;
    }
    
    // 更新阵营
    currentPlayer.topCard = topCard;
    currentPlayer.bottomCard = bottomCard;
    updateCampDisplay();
}

// 更新阵营显示
function updateCampDisplay() {
    const campDisplay = document.getElementById('camp-display');
    
    if (!currentPlayer.topCard || !currentPlayer.bottomCard) {
        campDisplay.innerHTML = '';
        return;
    }
    
    const topRole = ROLES[currentPlayer.topCard];
    const bottomRole = ROLES[currentPlayer.bottomCard];
    
    let camp;
    let campText;
    let campColor;
    
    if (topRole.camp === 'wolf' || bottomRole.camp === 'wolf') {
        camp = 'wolf';
        campText = '狼人阵营 🐺';
        campColor = '#ffe6e6';
    } else {
        camp = 'good';
        campText = '好人阵营 🛡️';
        campColor = '#e6f7ff';
    }
    
    campDisplay.innerHTML = campText;
    campDisplay.style.background = campColor;
    campDisplay.style.border = `2px solid ${camp === 'wolf' ? '#e74c3c' : '#3498db'}`;
}

// 确认选择
async function confirmSelection() {
    // 验证
    if (!currentPlayer.topCard || !currentPlayer.bottomCard) {
        alert('❌ 请先选择上牌和下牌！');
        return;
    }
    
    if (currentPlayer.topCard === currentPlayer.bottomCard) {
        alert('❌ 上牌和下牌不能相同！');
        return;
    }
    
    // 确认对话
    const topRole = ROLES[currentPlayer.topCard];
    const bottomRole = ROLES[currentPlayer.bottomCard];
    const topCamp = topRole.camp === 'wolf' ? '狼人阵营' : '好人阵营';
    const bottomCamp = bottomRole.camp === 'wolf' ? '狼人阵营' : '好人阵营';
    
    const message = `请确认你的选择：\n\n` +
        `上牌：${topRole.emoji} ${topRole.name}（${topCamp}）\n` +
        `下牌：${bottomRole.emoji} ${bottomRole.name}（${bottomCamp}）\n\n` +
        `确认后将无法修改！`;
    
    if (!confirm(message)) {
        return;
    }
    
    // 保存到localStorage
    const sessionData = JSON.parse(localStorage.getItem('werewolf_game_session'));
    sessionData.selections[currentPlayer.number] = {
        top: currentPlayer.topCard,
        bottom: currentPlayer.bottomCard,
        confirmed: true
    };
    if (window.CloudStore) {
        const sid = CURRENT_SESSION_ID || (sessionData && sessionData.sessionId);
        if (!sid) {
            alert('❌ 缺少会话ID，无法提交到云端。');
            return;
        }
        try {
            await window.CloudStore.updatePlayerSelection(sid, currentPlayer.number, {
                top: currentPlayer.topCard,
                bottom: currentPlayer.bottomCard,
                confirmed: true,
                ts: Date.now()
            });
        } catch (e) {
            alert('❌ 提交失败！请重试，或让法官检查云端会话是否有效。');
            return;
        }
    } else {
        localStorage.setItem('werewolf_game_session', JSON.stringify(sessionData));
    }
    
    // 更新状态
    currentPlayer.confirmed = true;
    
    // 显示确认消息
    showConfirmedMessage();
}

// 显示确认消息
function showConfirmedMessage() {
    document.getElementById('selection-area').style.display = 'none';
    document.getElementById('confirmed-message').style.display = 'block';
}

// 登出
function logout() {
    currentPlayer = {
        number: null,
        cards: [],
        topFixed: null,
        topCard: null,
        bottomCard: null,
        confirmed: false
    };
    
    document.getElementById('player-number').value = '';
    document.getElementById('player-password').value = '';
    document.getElementById('selection-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
    document.getElementById('selection-area').style.display = 'block';
    document.getElementById('confirmed-message').style.display = 'none';
}
