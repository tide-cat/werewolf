// 双身份狼人杀法官辅助系统 - JavaScript逻辑

// 角色定义
const ROLES = {
    // 狼人阵营
    wolf: { name: '普通狼人', camp: 'wolf', desc: '夜晚睁眼刀人（仅上牌）' },
    wolfKing: { name: '狼王', camp: 'wolf', desc: '可自爆带人（仅上牌）' },
    hiddenWolf: { name: '隐狼', camp: 'wolf', desc: '预言家验不出，不睁眼' },
    wolfBeauty: { name: '狼美人', camp: 'wolf', desc: '每晚魅惑一人，当晚殉情（仅上牌）' },
    
    // 神职
    seer: { name: '预言家', camp: 'good', desc: '每晚验一人身份' },
    witch: { name: '女巫', camp: 'good', desc: '解药+毒药各一瓶' },
    hunter: { name: '猎人', camp: 'good', desc: '死亡开枪带人（非毒死）' },
    guard: { name: '守卫', camp: 'good', desc: '每晚守护一人' },
    gravedigger: { name: '守墓人', camp: 'good', desc: '验证被投出者身份' },
    magician: { name: '魔术师', camp: 'good', desc: '交换两个座位号' },
    crow: { name: '乌鸦', camp: 'good', desc: '诅咒一人，白天自带一票' },
    elder: { name: '禁言长老', camp: 'good', desc: '禁言一人' },
    cupid: { name: '丘比特', camp: 'good', desc: '第一夜连接情侣' },
    knight: { name: '骑士', camp: 'good', desc: '白天决斗一人' },
    thief: { name: '盗贼', camp: 'good', desc: '第一夜查看底牌并换身份' },
    wildChild: { name: '野孩子', camp: 'good', desc: '第一夜选榜样，榜样死后变狼' },
    
    // 平民
    villager: { name: '普通村民', camp: 'good', desc: '无特殊技能' }
};

// 游戏状态
let gameState = {
    playerCount: 0,
    selectedRoles: [],
    players: [],
    configMode: 'manual', // 'manual' 或 'auto'
    night: 0,
    isFirstNight: true,
    isDayPhase: false, // 新增：标记当前是否为白天
    
    // 关系网络
    couples: null, // [p1, p2]
    couplesAreCamp: null, // 'wolf', 'good', 'third'
    wildChildModel: null, // 玩家索引
    currentCharm: null, // 当前被魅惑者
    
    // 白天状态
    cursedPlayer: null, // 被乌鸦诅咒
    silencedPlayer: null, // 被禁言
    police: null, // 警长
    policeNeedTransfer: false, // 警长需要传警徽
    lastExiled: null, // 上一个被放逐的玩家 {playerId, role, camp}
    
    // 当晚行动记录
    nightActions: {
        thiefSwap: null,
        guardTarget: null,
        magicianSwap: null, // [a, b]
        wolfKill: null,
        wolfBeautyCharm: null,
        witchSave: false,
        witchPoison: null,
        seerCheck: null
    },
    
    // 物品使用记录
    witchAntidoteUsed: false,
    witchPoisonUsed: false,
    guardLastTarget: null, // 守卫上一晚守护目标
    knightDuelUsed: false, // 骑士决斗是否已使用
    knightSkillUsed: false, // 骑士是否已使用决斗技能
    hunterCanShoot: null, // 猎人是否可以开枪（存储玩家ID）
    
    // 死亡日志
    deathLog: [],
    
    // 状态快照（用于回退）
    stateSnapshots: [], // 每夜开始前保存快照
    
    // 玩家端相关
    sessionId: null, // 游戏会话ID
    playerPasswords: {}, // 每个号码的密码
    playerSelections: {} // 玩家的选择状态
};

// 保存当前状态快照
function saveStateSnapshot() {
    const snapshot = {
        night: gameState.night,
        isFirstNight: gameState.isFirstNight,
        isDayPhase: gameState.isDayPhase,
        players: JSON.parse(JSON.stringify(gameState.players)), // 深拷贝
        couples: gameState.couples,
        couplesAreCamp: gameState.couplesAreCamp,
        wildChildModel: gameState.wildChildModel,
        currentCharm: gameState.currentCharm,
        cursedPlayer: gameState.cursedPlayer,
        silencedPlayer: gameState.silencedPlayer,
        police: gameState.police,
        policeNeedTransfer: gameState.policeNeedTransfer,
        lastExiled: gameState.lastExiled,
        nightActions: JSON.parse(JSON.stringify(gameState.nightActions)),
        witchAntidoteUsed: gameState.witchAntidoteUsed,
        witchPoisonUsed: gameState.witchPoisonUsed,
        guardLastTarget: gameState.guardLastTarget,
        knightDuelUsed: gameState.knightDuelUsed,
        deathLog: JSON.parse(JSON.stringify(gameState.deathLog))
    };
    gameState.stateSnapshots.push(snapshot);
}

// 恢复到上一个快照
function restoreLastSnapshot() {
    if (gameState.stateSnapshots.length === 0) {
        alert('没有可以恢复的状态！');
        return false;
    }
    
    const snapshot = gameState.stateSnapshots.pop(); // 取出并删除最后一个快照
    
    // 恢复所有状态
    gameState.night = snapshot.night;
    gameState.isFirstNight = snapshot.isFirstNight;
    gameState.isDayPhase = snapshot.isDayPhase;
    gameState.players = snapshot.players;
    gameState.couples = snapshot.couples;
    gameState.couplesAreCamp = snapshot.couplesAreCamp;
    gameState.wildChildModel = snapshot.wildChildModel;
    gameState.currentCharm = snapshot.currentCharm;
    gameState.cursedPlayer = snapshot.cursedPlayer;
    gameState.silencedPlayer = snapshot.silencedPlayer;
    gameState.police = snapshot.police;
    gameState.policeNeedTransfer = snapshot.policeNeedTransfer;
    gameState.lastExiled = snapshot.lastExiled;
    gameState.nightActions = snapshot.nightActions;
    gameState.witchAntidoteUsed = snapshot.witchAntidoteUsed;
    gameState.witchPoisonUsed = snapshot.witchPoisonUsed;
    gameState.guardLastTarget = snapshot.guardLastTarget;
    gameState.knightDuelUsed = snapshot.knightDuelUsed || false;
    gameState.deathLog = snapshot.deathLog;
    
    return true;
}

// ========== 自动发牌系统 ==========

// 检查两张牌是否可以配对
function isValidCardPair(card1, card2) {
    const wolves = ['wolf', 'wolfKing', 'hiddenWolf', 'wolfBeauty'];
    const isWolf1 = wolves.includes(card1);
    const isWolf2 = wolves.includes(card2);
    
    // 规则1：不能有"狼人+盗贼"
    if ((isWolf1 && card2 === 'thief') || (isWolf2 && card1 === 'thief')) {
        return false;
    }
    
    // 规则2：不能有"狼人+预言家"
    if ((isWolf1 && card2 === 'seer') || (isWolf2 && card1 === 'seer')) {
        return false;
    }
    
    return true;
}

// 自动分配角色（带重试机制）
function autoDistributeCards(selectedRoles) {
    const maxAttempts = 100; // 最多尝试100次
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const cards = [...selectedRoles]; // 复制一份
        const result = [];
        let failed = false;
        
        // 特殊角色必须在上牌
        const firstNightRoles = ['cupid', 'wildChild'];
        
        while (cards.length >= 2) {
            // 随机抽取两张牌
            const index1 = Math.floor(Math.random() * cards.length);
            const card1 = cards.splice(index1, 1)[0];
            
            const index2 = Math.floor(Math.random() * cards.length);
            const card2 = cards.splice(index2, 1)[0];
            
            // 检查是否有效
            if (!isValidCardPair(card1, card2)) {
                // 无效组合，标记失败
                failed = true;
                break;
            }
            
            // 存储配对（不指定上下，除了特殊角色）
            const hasFirstNightRole = firstNightRoles.includes(card1) || firstNightRoles.includes(card2);
            
            if (hasFirstNightRole) {
                // 如果有丘比特或野孩子，必须在上牌
                if (firstNightRoles.includes(card1)) {
                    result.push({ cards: [card1, card2], topFixed: card1 });
                } else {
                    result.push({ cards: [card2, card1], topFixed: card2 });
                }
            } else {
                // 普通配对，不固定上下
                result.push({ cards: [card1, card2], topFixed: null });
            }
        }
        
        // 如果成功生成，返回结果
        if (!failed && cards.length === 0) {
            return result;
        }
    }
    
    // 如果100次都失败，返回null
    return null;
}

// 保存常用配置
function savePreset() {
    const presetName = prompt('请输入配置名称（如"10人标准局"）：');
    if (!presetName) return;
    
    const preset = {
        name: presetName,
        playerCount: gameState.playerCount,
        selectedRoles: [...gameState.selectedRoles],
        timestamp: Date.now()
    };
    
    // 从localStorage读取现有配置
    let presets = [];
    try {
        const stored = localStorage.getItem('werewolf_presets');
        if (stored) {
            presets = JSON.parse(stored);
        }
    } catch (e) {
        console.error('读取配置失败:', e);
    }
    
    // 添加新配置
    presets.push(preset);
    
    // 保存
    try {
        localStorage.setItem('werewolf_presets', JSON.stringify(presets));
        alert(`✅ 配置"${presetName}"已保存！`);
    } catch (e) {
        alert('❌ 保存失败：' + e.message);
    }
}

// 加载常用配置
function loadPreset() {
    let presets = [];
    try {
        const stored = localStorage.getItem('werewolf_presets');
        if (stored) {
            presets = JSON.parse(stored);
        }
    } catch (e) {
        console.error('读取配置失败:', e);
    }
    
    if (presets.length === 0) {
        alert('还没有保存的配置！');
        return;
    }
    
    // 生成选择列表
    let message = '请选择要加载的配置：\n\n';
    presets.forEach((p, index) => {
        const date = new Date(p.timestamp).toLocaleDateString();
        message += `${index + 1}. ${p.name} (${p.playerCount}人, ${date})\n`;
    });
    message += '\n输入序号：';
    
    const choice = prompt(message);
    if (!choice) return;
    
    const index = parseInt(choice) - 1;
    if (index < 0 || index >= presets.length) {
        alert('无效的序号！');
        return;
    }
    
    const preset = presets[index];
    
    // 应用配置
    gameState.playerCount = preset.playerCount;
    gameState.selectedRoles = [...preset.selectedRoles];
    
    // 更新界面
    document.getElementById('player-count').value = preset.playerCount;
    
    // 更新角色选择
    document.querySelectorAll('.role-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    preset.selectedRoles.forEach(roleId => {
        const checkbox = document.getElementById(`role-${roleId}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    updateRoleCount();
    
    alert(`✅ 已加载配置"${preset.name}"！`);
}

// 全局错误捕获
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', message, error);
    showErrorAndExport(message, error);
    return true;
};

// 显示错误并导出状态
function showErrorAndExport(message, error) {
    const errorSection = document.getElementById('error-report-section');
    const errorMessage = document.getElementById('error-message');
    
    errorSection.style.display = 'block';
    errorMessage.textContent = `错误信息：${message}\n\n堆栈：\n${error ? error.stack : '无堆栈信息'}`;
    
    // 自动显示导出界面
    exportGameState();
    
    alert('⚠️ 系统遇到错误！\n\n已自动导出游戏状态，请查看弹窗。\n您可以：\n1. 复制内容继续纸质版游戏\n2. 将错误信息反馈给开发者');
}

// 导出游戏状态
function exportGameState() {
    const modal = document.getElementById('export-modal');
    const readableTextarea = document.getElementById('export-readable');
    const jsonTextarea = document.getElementById('export-json');
    
    // 生成可读格式
    const readable = generateReadableExport();
    readableTextarea.value = readable;
    
    // 生成JSON格式
    const json = JSON.stringify(gameState, null, 2);
    jsonTextarea.value = json;
    
    // 显示模态框
    modal.classList.add('active');
}

// 生成可读格式导出
function generateReadableExport() {
    let text = '═══════════════════════════════════════\n';
    text += '  双身份狼人杀 - 游戏状态导出\n';
    text += '═══════════════════════════════════════\n\n';
    
    text += `📅 当前进度：第 ${gameState.night} ${gameState.isDayPhase ? '天（白天）' : '夜（夜晚）'}\n`;
    text += `👥 玩家人数：${gameState.playerCount} 人\n\n`;
    
    text += '─── 玩家身份配置 ───\n\n';
    gameState.players.forEach(p => {
        const topStatus = p.topAlive ? '✓' : '✗';
        const bottomStatus = p.bottomAlive ? '✓' : '✗';
        const topRole = ROLES[p.topRole].name;
        const bottomRole = ROLES[p.bottomRole].name;
        
        text += `${p.id}号玩家：\n`;
        text += `  上牌：${topRole} ${topStatus}\n`;
        text += `  下牌：${bottomRole} ${bottomStatus}\n`;
        text += `  阵营：${p.camp === 'wolf' ? '狼人🐺' : '好人🛡️'}\n`;
        
        if (!p.topAlive && !p.bottomAlive) {
            text += `  状态：彻底出局 ☠️\n`;
        } else if (!p.topAlive) {
            text += `  状态：上牌已死，当前使用下牌\n`;
        } else {
            text += `  状态：上牌存活\n`;
        }
        text += '\n';
    });
    
    text += '─── 关系网络 ───\n\n';
    
    if (gameState.couples) {
        const camp = gameState.couplesAreCamp === 'third' ? '第三方💛' : 
                     gameState.couplesAreCamp === 'wolf' ? '狼人🐺' : '好人🛡️';
        text += `💕 情侣：${gameState.couples[0]}号 & ${gameState.couples[1]}号 (${camp})\n`;
    }
    
    if (gameState.wildChildModel) {
        text += `👶 野孩子榜样：${gameState.wildChildModel}号\n`;
    }
    
    if (gameState.currentCharm) {
        text += `💋 当前被魅惑：${gameState.currentCharm}号\n`;
    }
    
    if (gameState.police) {
        text += `👮 当前警长：${gameState.police}号\n`;
    }
    
    if (gameState.cursedPlayer) {
        text += `🐦 被乌鸦诅咒：${gameState.cursedPlayer}号（白天自带一票）\n`;
    }
    
    if (gameState.silencedPlayer) {
        text += `🤐 被禁言：${gameState.silencedPlayer}号（白天不能发言）\n`;
    }
    
    text += '\n─── 物品使用情况 ───\n\n';
    text += `🧪 女巫解药：${gameState.witchAntidoteUsed ? '已使用 ✗' : '可用 ✓'}\n`;
    text += `🧪 女巫毒药：${gameState.witchPoisonUsed ? '已使用 ✗' : '可用 ✓'}\n`;
    
    if (gameState.guardLastTarget) {
        text += `🛡️ 守卫上次守护：${gameState.guardLastTarget}号\n`;
    }
    
    if (gameState.lastExiled) {
        const camp = gameState.lastExiled.camp === 'wolf' ? '狼人👎' : '好人👍';
        text += `⚰️ 上次被放逐：${gameState.lastExiled.playerId}号（上牌：${ROLES[gameState.lastExiled.role].name}，${camp}）\n`;
    }
    
    text += '\n─── 当晚行动记录 ───\n\n';
    const actions = gameState.nightActions;
    
    if (actions.guardTarget) {
        text += `🛡️ 守卫守护：${actions.guardTarget}号\n`;
    }
    
    if (actions.magicianSwap) {
        text += `🎩 魔术师交换：${actions.magicianSwap[0]}号 ↔ ${actions.magicianSwap[1]}号\n`;
    }
    
    if (actions.wolfKill) {
        text += `🐺 狼人刀人：${actions.wolfKill}号\n`;
    }
    
    if (actions.wolfBeautyCharm) {
        text += `💋 狼美人魅惑：${actions.wolfBeautyCharm}号\n`;
    }
    
    if (actions.witchSave) {
        text += `🧪 女巫使用解药：是\n`;
    }
    
    if (actions.witchPoison) {
        text += `🧪 女巫毒人：${actions.witchPoison}号\n`;
    }
    
    if (actions.seerCheck) {
        text += `🔮 预言家查验：${actions.seerCheck}号\n`;
    }
    
    text += '\n═══ 法官视角记录 ═══\n\n';
    text += '【按时间顺序的关键操作】\n\n';
    
    // 分析死亡日志，生成法官视角记录
    const judgeView = generateJudgeViewFromLog();
    text += judgeView;
    
    text += '\n─── 死亡日志（最近10条）───\n\n';
    const recentLogs = gameState.deathLog.slice(-10);
    recentLogs.forEach(log => {
        text += `第${log.night}${log.night <= 1 ? '夜' : (gameState.isDayPhase ? '天' : '夜')}：${log.message}\n`;
    });
    
    text += '\n═══════════════════════════════════════\n';
    text += '导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
    text += '═══════════════════════════════════════\n';
    
    return text;
}

// 从死亡日志生成法官视角记录
function generateJudgeViewFromLog() {
    let view = '';
    
    // 按夜/天分组日志
    const grouped = {};
    gameState.deathLog.forEach(log => {
        const key = `第${log.night}${log.night <= 1 && !log.message.includes('天') ? '夜' : log.message.includes('天') || log.message.includes('放逐') || log.message.includes('警长') || log.message.includes('归票') || log.message.includes('决斗') ? '天' : '夜'}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(log.message);
    });
    
    // 生成每个阶段的记录
    Object.keys(grouped).sort().forEach(phase => {
        view += `【${phase}】\n`;
        grouped[phase].forEach(msg => {
            view += `- ${msg}\n`;
        });
        view += '\n';
    });
    
    return view || '（暂无记录）\n';
}

// 复制到剪贴板
function copyToClipboard(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    document.execCommand('copy');
    
    // 显示提示
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.style.background = '#27ae60';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

// 关闭模态框
function closeExportModal() {
    const modal = document.getElementById('export-modal');
    modal.classList.remove('active');
    
    // 隐藏错误信息（如果下次导出是主动的，不是因为错误）
    const errorSection = document.getElementById('error-report-section');
    errorSection.style.display = 'none';
}

// 初始化配置界面
function initConfigSection() {
    const playerCountInput = document.getElementById('player-count');
    const wolfRolesDiv = document.getElementById('wolf-roles');
    const godRolesDiv = document.getElementById('god-roles');
    const villagerRolesDiv = document.getElementById('villager-roles');
    
    // 渲染角色选择卡片
    const wolfRoles = ['wolf', 'wolfKing', 'hiddenWolf', 'wolfBeauty'];
    const godRoles = ['seer', 'witch', 'hunter', 'guard', 'gravedigger', 'magician', 
                      'crow', 'elder', 'cupid', 'knight', 'thief', 'wildChild'];
    const villagerRoles = ['villager'];
    
    function renderRoles(roles, container, campClass) {
        container.innerHTML = '';
        roles.forEach(roleId => {
            const role = ROLES[roleId];
            const card = document.createElement('div');
            card.className = `role-card ${campClass}`;
            card.dataset.role = roleId;
            
            // 判断是否是可以多选的角色
            const isMultiple = roleId === 'wolf' || roleId === 'villager';
            
            if (isMultiple) {
                // 数量选择
                const numberInput = document.createElement('input');
                numberInput.type = 'number';
                numberInput.min = '0';
                numberInput.max = '10';
                numberInput.value = '0';
                numberInput.dataset.role = roleId;
                numberInput.style.position = 'absolute';
                numberInput.style.top = '10px';
                numberInput.style.right = '10px';
                numberInput.style.width = '50px';
                numberInput.style.padding = '5px';
                numberInput.addEventListener('input', function() {
                    if (parseInt(this.value) > 0) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                    updateRoleSelection();
                });
                card.appendChild(numberInput);
            } else {
                // 单选框
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'role-checkbox';
                checkbox.dataset.role = roleId;
                checkbox.addEventListener('change', function() {
                    updateRoleSelection();
                });
                card.appendChild(checkbox);
                
                card.addEventListener('click', function(e) {
                    if (e.target !== checkbox && e.target.type !== 'number') {
                        checkbox.checked = !checkbox.checked;
                        updateRoleSelection();
                    }
                });
            }
            
            const roleName = document.createElement('div');
            roleName.className = 'role-name';
            roleName.textContent = role.name;
            
            const roleDesc = document.createElement('div');
            roleDesc.className = 'role-desc';
            roleDesc.textContent = role.desc;
            
            card.appendChild(roleName);
            card.appendChild(roleDesc);
            
            container.appendChild(card);
        });
    }
    
    renderRoles(wolfRoles, wolfRolesDiv, 'wolf');
    renderRoles(godRoles, godRolesDiv, 'god');
    renderRoles(villagerRoles, villagerRolesDiv, '');
    
    // 监听人数变化
    playerCountInput.addEventListener('input', updateRoleSelection);
    
    // 监听配置模式切换
    document.querySelectorAll('input[name="config-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const startBtn = document.getElementById('start-assign-btn');
            if (this.value === 'auto') {
                startBtn.textContent = '🎴 自动生成发牌';
            } else {
                startBtn.textContent = '开始分配身份';
            }
        });
    });
    
    // 初始更新
    updateRoleSelection();
}

// 更新角色选择状态
function updateRoleSelection() {
    const playerCount = parseInt(document.getElementById('player-count').value) || 0;
    const selectedRoles = [];
    
    // 处理单选角色（checkbox）
    const checkboxes = document.querySelectorAll('.role-card input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const card = cb.closest('.role-card');
        if (cb.checked) {
            card.classList.add('selected');
            selectedRoles.push(cb.dataset.role);
        } else {
            card.classList.remove('selected');
        }
    });
    
    // 处理数量选择角色（number input）
    const numberInputs = document.querySelectorAll('.role-card input[type="number"]');
    numberInputs.forEach(input => {
        const count = parseInt(input.value) || 0;
        for (let i = 0; i < count; i++) {
            selectedRoles.push(input.dataset.role);
        }
    });
    
    const requiredCount = playerCount * 2;
    const selectedCount = selectedRoles.length;
    
    document.getElementById('selected-count').textContent = selectedCount;
    document.getElementById('required-count').textContent = requiredCount;
    
    const statusDiv = document.getElementById('count-status');
    const startBtn = document.getElementById('start-assign-btn');
    
    if (selectedCount === requiredCount && playerCount >= 4) {
        statusDiv.innerHTML = '<span class="success">✓ 配置正确，可以开始游戏！</span>';
        startBtn.disabled = false;
    } else if (selectedCount > requiredCount) {
        statusDiv.innerHTML = `<span class="error">✗ 角色过多，请减少 ${selectedCount - requiredCount} 个</span>`;
        startBtn.disabled = true;
    } else if (selectedCount < requiredCount) {
        statusDiv.innerHTML = `<span class="error">✗ 角色不足，还需 ${requiredCount - selectedCount} 个</span>`;
        startBtn.disabled = true;
    } else {
        statusDiv.innerHTML = '<span class="error">✗ 请先设置玩家人数</span>';
        startBtn.disabled = true;
    }
}

// 开始分配身份
function startAssignIdentities() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const selectedRoles = [];
    
    // 收集checkbox选中的角色
    const checkboxes = document.querySelectorAll('.role-card input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selectedRoles.push(cb.dataset.role);
    });
    
    // 收集number input的角色
    const numberInputs = document.querySelectorAll('.role-card input[type="number"]');
    numberInputs.forEach(input => {
        const count = parseInt(input.value) || 0;
        for (let i = 0; i < count; i++) {
            selectedRoles.push(input.dataset.role);
        }
    });
    
    gameState.playerCount = playerCount;
    gameState.selectedRoles = selectedRoles;
    
    // 获取配置模式
    const configMode = document.querySelector('input[name="config-mode"]:checked').value;
    gameState.configMode = configMode;
    
    // 初始化玩家
    gameState.players = [];
    for (let i = 0; i < playerCount; i++) {
        gameState.players.push({
            id: i + 1,
            topRole: null,
            bottomRole: null,
            topAlive: true,
            bottomAlive: true,
            camp: null
        });
    }
    
    if (configMode === 'auto') {
        // 自动发牌模式
        const distribution = autoDistributeCards(selectedRoles);
        
        if (!distribution) {
            alert('❌ 自动发牌失败！\n\n可能的原因：\n1. 角色组合无法满足限制规则\n2. 请尝试重新生成或调整角色配置');
            return;
        }
        
        // 生成游戏会话
        gameState.sessionId = generateSessionId();
        // 云端会话展示
        try {
            const box = document.getElementById('cloud-session-box');
            const sidInput = document.getElementById('cloud-session-id');
            const linkSpan = document.getElementById('cloud-player-link');
            const copyBtn = document.getElementById('copy-player-link-btn');
            if (box && sidInput && linkSpan && copyBtn) {
                const baseUrl = window.location.origin + window.location.pathname.replace(/judge\.html?$/,'');
                const playerUrl = baseUrl + 'player.html?session=' + encodeURIComponent(gameState.sessionId);
                sidInput.value = gameState.sessionId;
                linkSpan.textContent = playerUrl;
                box.style.display = 'block';
                copyBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(playerUrl);
                        copyBtn.textContent = '已复制';
                        setTimeout(()=>copyBtn.textContent='复制玩家链接',1200);
                    } catch(e) {
                        prompt('复制失败，手动复制：', playerUrl);
                    }
                };
            }
        } catch(e) {}
        
        gameState.playerPasswords = {};
        gameState.playerSelections = {};
        
        // 保存配对信息到players（不设置topRole和bottomRole）
        distribution.forEach((pair, index) => {
            if (gameState.players[index]) {
                const playerId = gameState.players[index].id;
                
                gameState.players[index].assignedCards = pair.cards; // 分到的两张牌
                gameState.players[index].topFixed = pair.topFixed; // 是否固定上牌
                // topRole和bottomRole留空，等待玩家选择或法官设置
                
                // 生成该玩家的密码
                gameState.playerPasswords[playerId] = generatePassword();
                
                // 初始化选择状态
                gameState.playerSelections[playerId] = {
                    confirmed: false,
                    top: null,
                    bottom: null
                };
            }
        });
        
        // 保存到localStorage供玩家端访问
        saveGameSession().catch(()=>{});
        startCloudSync();
        
        // 渲染身份分配界面（自动发牌模式）
        renderAssignSection();
        
        // 切换到分配界面
        showSection('assign-section');
    } else {
        // 手动配置模式
        // 渲染分配界面
        renderAssignSection();
        
        // 切换到分配界面
        showSection('assign-section');
    }
}

// 渲染身份分配界面
function renderAssignSection() {
    const container = document.getElementById('player-cards');
    container.innerHTML = '';
    
    if (gameState.configMode === 'auto') {
        // 自动发牌模式：显示每个玩家分到的牌
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info';
        infoDiv.innerHTML = `
            <strong>🎴 自动发牌完成！</strong><br>
            <span style="color:#856404;">💡 新功能：玩家可以通过手机自己选择上下牌！</span>
        `;
        container.appendChild(infoDiv);
        
        // 显示玩家端链接和密码
        const playerLinkDiv = document.createElement('div');
        playerLinkDiv.className = 'alert alert-success';
        playerLinkDiv.style.background = '#d4edda';
        playerLinkDiv.style.borderLeft = '4px solid #28a745';
        playerLinkDiv.innerHTML = `
            <strong>📱 玩家端使用说明</strong><br>
            1. 让玩家用手机打开：<strong><span id="player-url"></span></strong><br>
            2. 玩家输入号码和密码查看自己的牌<br>
            3. 玩家选择上下牌后提交<br>
            4. 法官端会实时更新玩家状态<br>
            <br>
            <button class="btn btn-primary" onclick="showPasswordList()" style="margin-top:10px;">
                🔑 查看所有密码
            </button>
            <button class="btn btn-secondary" onclick="togglePlayerMode()" style="margin-top:10px;">
                ⚙️ 切换为法官手动设置
            </button>
        `;
        container.appendChild(playerLinkDiv);
        
        // 设置玩家端URL
        const playerUrl = window.location.href.replace('werewolf-judge.html', 'werewolf-player.html');
        document.getElementById('player-url').textContent = playerUrl;
        
        // 玩家状态显示区域
        const statusDiv = document.createElement('div');
        statusDiv.id = 'player-status-area';
        statusDiv.style.marginTop = '20px';
        container.appendChild(statusDiv);
        
        // 渲染玩家状态
        renderPlayerSelectionStatus();
        
        gameState.players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            
            // 玩家编号
            const playerNumber = document.createElement('div');
            playerNumber.className = 'player-number';
            playerNumber.textContent = `${player.id}号玩家`;
            card.appendChild(playerNumber);
            
            // 显示分到的牌
            if (player.assignedCards) {
                const assignedDiv = document.createElement('div');
                assignedDiv.style.padding = '10px';
                assignedDiv.style.background = '#f8f9fa';
                assignedDiv.style.borderRadius = '5px';
                assignedDiv.style.marginBottom = '10px';
                
                const cardsText = player.assignedCards.map(roleId => ROLES[roleId].name).join('、');
                assignedDiv.innerHTML = `<strong>分到的牌：</strong>${cardsText}`;
                
                if (player.topFixed) {
                    assignedDiv.innerHTML += `<br><span style="color:#856404;">🔒 ${ROLES[player.topFixed].name} 必须在上牌</span>`;
                }
                
                card.appendChild(assignedDiv);
                
                // 创建上牌下拉（只显示分到的两张牌）
                const topSelect = createLimitedIdentitySelect(index, 'top', player.assignedCards, player.topFixed);
                card.appendChild(topSelect);
                
                // 创建下牌下拉（只显示分到的两张牌）
                const bottomSelect = createLimitedIdentitySelect(index, 'bottom', player.assignedCards, player.topFixed);
                card.appendChild(bottomSelect);
            }
            
            // 创建阵营显示
            const campDiv = document.createElement('div');
            campDiv.className = 'camp';
            campDiv.id = `camp-${index}`;
            card.appendChild(campDiv);
            
            container.appendChild(card);
        });
        
        // 初始化阵营显示（对于已固定的角色）
        gameState.players.forEach((player, index) => {
            if (player.topFixed) {
                updatePlayerCamp(index);
            }
        });
        
        // 添加重新生成按钮
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        btnGroup.style.marginTop = '20px';
        
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'btn btn-secondary';
        regenerateBtn.textContent = '🔄 重新生成发牌';
        regenerateBtn.onclick = function() {
            if (confirm('确定要重新生成发牌吗？当前配置将丢失。')) {
                // 返回配置界面
                showSection('config-section');
            }
        };
        
        btnGroup.appendChild(regenerateBtn);
        container.appendChild(btnGroup);
    } else {
        // 手动配置模式：显示所有可用角色
        const availableRoles = [...gameState.selectedRoles];
        
        gameState.players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            
            // 创建玩家编号
            const playerNumber = document.createElement('div');
            playerNumber.className = 'player-number';
            playerNumber.textContent = `${player.id}号玩家`;
            card.appendChild(playerNumber);
            
            // 创建上牌选择
            const topSelect = createIdentitySelect(index, 'top', availableRoles);
            card.appendChild(topSelect);
            
            // 创建下牌选择
            const bottomSelect = createIdentitySelect(index, 'bottom', availableRoles);
            card.appendChild(bottomSelect);
            
            // 创建阵营显示
            const campDiv = document.createElement('div');
            campDiv.className = 'camp';
            campDiv.id = `camp-${index}`;
            card.appendChild(campDiv);
            
            container.appendChild(card);
        });
    }
}

// 创建身份选择下拉框
function createIdentitySelect(playerIndex, type, availableRoles) {
    const wrapper = document.createElement('div');
    wrapper.className = 'identity-select';
    
    const label = document.createElement('label');
    label.textContent = type === 'top' ? '上牌（第一身份）：' : '下牌（第二身份）：';
    wrapper.appendChild(label);
    
    const select = document.createElement('select');
    select.id = `${type}-${playerIndex}`;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择';
    select.appendChild(defaultOption);
    
    availableRoles.forEach(roleId => {
        const role = ROLES[roleId];
        const option = document.createElement('option');
        option.value = roleId;
        option.textContent = role.name;
        select.appendChild(option);
    });
    
    select.addEventListener('change', function() {
        updatePlayerCamp(playerIndex);
    });
    
    wrapper.appendChild(select);
    return wrapper;
}

// 创建限制选项的身份选择下拉框（自动发牌模式）
function createLimitedIdentitySelect(playerIndex, type, assignedCards, topFixed) {
    const wrapper = document.createElement('div');
    wrapper.className = 'identity-select';
    
    const label = document.createElement('label');
    label.textContent = type === 'top' ? '上牌（第一身份）：' : '下牌（第二身份）：';
    wrapper.appendChild(label);
    
    const select = document.createElement('select');
    select.id = `${type}-${playerIndex}`;
    
    // 如果是上牌且有固定角色
    if (type === 'top' && topFixed) {
        // 只显示固定的角色
        const option = document.createElement('option');
        option.value = topFixed;
        option.textContent = ROLES[topFixed].name;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true;
        select.style.background = '#f0f0f0';
        
        // 直接设置
        gameState.players[playerIndex].topRole = topFixed;
    } else if (type === 'bottom' && topFixed) {
        // 下牌是另一张
        const otherCard = assignedCards.find(card => card !== topFixed);
        const option = document.createElement('option');
        option.value = otherCard;
        option.textContent = ROLES[otherCard].name;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true;
        select.style.background = '#f0f0f0';
        
        // 直接设置
        gameState.players[playerIndex].bottomRole = otherCard;
    } else {
        // 显示"请选择"
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择';
        select.appendChild(defaultOption);
        
        // 只显示分到的两张牌
        assignedCards.forEach(roleId => {
            const role = ROLES[roleId];
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = role.name;
            select.appendChild(option);
        });
    }
    
    select.addEventListener('change', function() {
        updatePlayerCamp(playerIndex);
    });
    
    wrapper.appendChild(select);
    return wrapper;
}

// 更新玩家阵营
function updatePlayerCamp(playerIndex) {
    const topSelect = document.getElementById(`top-${playerIndex}`);
    const bottomSelect = document.getElementById(`bottom-${playerIndex}`);
    const campDiv = document.getElementById(`camp-${playerIndex}`);
    
    const topRole = topSelect.value;
    const bottomRole = bottomSelect.value;
    
    if (!topRole || !bottomRole) {
        campDiv.innerHTML = '';
        return;
    }
    
    gameState.players[playerIndex].topRole = topRole;
    gameState.players[playerIndex].bottomRole = bottomRole;
    
    // 判断阵营：只要有狼牌就是狼人
    const topCamp = ROLES[topRole].camp;
    const bottomCamp = ROLES[bottomRole].camp;
    
    let camp;
    if (topCamp === 'wolf' || bottomCamp === 'wolf') {
        camp = 'wolf';
        campDiv.innerHTML = '<div class="camp wolf">狼人阵营 🐺</div>';
    } else {
        camp = 'good';
        campDiv.innerHTML = '<div class="camp good">好人阵营 🛡️</div>';
    }
    
    gameState.players[playerIndex].camp = camp;
}

// 渲染自动发牌结果
// 开始游戏
function startGame() {
    // 检查是否所有玩家都分配了身份
    const allAssigned = gameState.players.every(p => p.topRole && p.bottomRole);
    if (!allAssigned) {
        alert('请为所有玩家分配完整的双身份！');
        return;
    }
    
    // 检查是否有重复使用角色
    const usedRoles = [];
    gameState.players.forEach(p => {
        usedRoles.push(p.topRole, p.bottomRole);
    });
    
    const roleCounts = {};
    usedRoles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    const availableRoleCounts = {};
    gameState.selectedRoles.forEach(role => {
        availableRoleCounts[role] = (availableRoleCounts[role] || 0) + 1;
    });
    
    for (let role in roleCounts) {
        if (roleCounts[role] > availableRoleCounts[role]) {
            alert(`角色"${ROLES[role].name}"使用次数超出限制！`);
            return;
        }
    }
    
    // 初始化游戏状态
    gameState.night = 1;
    gameState.isFirstNight = true;
    
    // 切换到游戏界面
    showSection('game-section');
    renderNightActions();
    updateGameDisplay();
}

// 渲染夜间行动表单
function renderNightActions() {
    // 保存状态快照（用于回退）
    saveStateSnapshot();
    
    const container = document.getElementById('night-actions');
    container.innerHTML = '';
    
    const phaseIndicator = document.getElementById('phase-indicator');
    phaseIndicator.textContent = gameState.isFirstNight ? '第一夜' : `第 ${gameState.night} 夜`;
    
    // 第一夜特殊流程
    if (gameState.isFirstNight) {
        // 1. 盗贼
        if (hasRoleInGame('thief')) {
            const isActive = isRoleActive('thief');
            container.appendChild(createThiefForm(isActive));
        }
        
        // 2. 丘比特
        if (hasRoleInGame('cupid')) {
            const isActive = isRoleActive('cupid');
            container.appendChild(createCupidForm(isActive));
        }
        
        // 3. 野孩子
        if (hasRoleInGame('wildChild')) {
            const isActive = isRoleActive('wildChild');
            container.appendChild(createWildChildForm(isActive));
        }
    }
    
    // 常规夜间流程
    if (!gameState.isFirstNight) {
        // 守墓人（第二夜开始）
        if (hasRoleInGame('gravedigger')) {
            const isActive = isRoleActive('gravedigger');
            container.appendChild(createGravediggerForm(isActive));
        }
    }
    
    // 守卫
    if (hasRoleInGame('guard')) {
        const isActive = isRoleActive('guard');
        container.appendChild(createGuardForm(isActive));
    }
    
    // 魔术师
    if (hasRoleInGame('magician')) {
        const isActive = isRoleActive('magician');
        container.appendChild(createMagicianForm(isActive));
    }
    
    // 狼人
    const hasWolf = hasRoleInGame('wolf') || hasRoleInGame('wolfKing') || hasRoleInGame('wolfBeauty');
    if (hasWolf) {
        container.appendChild(createWolfForm());
    }
    
    // 女巫
    if (hasRoleInGame('witch')) {
        const isActive = isRoleActive('witch');
        container.appendChild(createWitchForm(isActive));
    }
    
    // 预言家
    if (hasRoleInGame('seer')) {
        const isActive = isRoleActive('seer');
        container.appendChild(createSeerForm(isActive));
    }
    
    // 乌鸦
    if (hasRoleInGame('crow')) {
        const isActive = isRoleActive('crow');
        container.appendChild(createCrowForm(isActive));
    }
    
    // 禁言长老
    if (hasRoleInGame('elder')) {
        const isActive = isRoleActive('elder');
        container.appendChild(createElderForm(isActive));
    }
    
    // 猎人状态确认（每晚最后环节，防止信息泄露）
    if (hasRoleInGame('hunter')) {
        container.appendChild(createHunterStatusForm());
    }
}

// 检查是否有存活的某角色（上牌才算）
function hasActiveRole(roleId) {
    return gameState.players.some(p => 
        (p.topAlive && p.topRole === roleId) || 
        (!p.topAlive && p.bottomAlive && p.bottomRole === roleId)
    );
}

// 检查某角色是否在游戏中（不管上牌下牌，只要有玩家配了这个角色）
function hasRoleInGame(roleId) {
    return gameState.players.some(p => 
        p.topRole === roleId || p.bottomRole === roleId
    );
}

// 保存游戏会话到localStorage
async function saveGameSession() {
    const sessionData = {
        sessionId: gameState.sessionId,
        passwords: gameState.playerPasswords,
        distributions: {},
        selections: gameState.playerSelections,
        timestamp: Date.now()
    };

    // 保存每个玩家的分配信息
    gameState.players.forEach(player => {
        if (player.assignedCards) {
            sessionData.distributions[player.id] = {
                cards: player.assignedCards,
                topFixed: player.topFixed
            };
        }
    });

    // 云端优先（GitHub Pages 场景）
    if (window.CloudStore) {
        await window.CloudStore.upsertSession(gameState.sessionId, sessionData);
    } else {
        // 兜底：仍支持本地存储（单机调试）
        localStorage.setItem('werewolf_game_session', JSON.stringify(sessionData));
    }
}

// 从localStorage加载玩家选择
async function loadPlayerSelections() {
    // 云端优先
    if (window.CloudStore && gameState.sessionId) {
        try {
            const data = await window.CloudStore.loadSessionData(gameState.sessionId);
            if (data && data.sessionId === gameState.sessionId) {
                gameState.playerSelections = data.selections || {};
                applySelectionsToPlayers();
            }
        } catch (e) {
            console.warn('[cloud] 拉取玩家选择失败', e);
        }
        return;
    }

    // 兜底：本地存储
    const sessionData = localStorage.getItem('werewolf_game_session');
    if (!sessionData) return;
    try {
        const data = JSON.parse(sessionData);
        if (data.sessionId === gameState.sessionId) {
            gameState.playerSelections = data.selections || {};
            applySelectionsToPlayers();
        }
    } catch (e) {}
}

// 把 playerSelections 映射回 players（抽出来，云端/本地都复用）

// 云端轮询同步（法官端看到玩家确认情况）
let __cloudSyncTimer = null;
function startCloudSync() {
    if (!window.CloudStore || !gameState.sessionId) return;
    if (__cloudSyncTimer) clearInterval(__cloudSyncTimer);
    __cloudSyncTimer = setInterval(async () => {
        await loadPlayerSelections();
    }, 2000);
}

function stopCloudSync() {
    if (__cloudSyncTimer) {
        clearInterval(__cloudSyncTimer);
        __cloudSyncTimer = null;
    }
}

function applySelectionsToPlayers() {
    // 更新玩家的topRole和bottomRole
    gameState.players.forEach(player => {
        const selection = gameState.playerSelections[player.id];
        if (selection) {
            player.topRole = selection.top;
            player.bottomRole = selection.bottom;
        } else {
            player.topRole = null;
            player.bottomRole = null;
        }
    });

    // 更新玩家列表显示
    updatePlayerList();
}
function showPasswordList() {
    let message = '🔑 玩家密码列表\n\n';
    message += '请将对应的密码告诉玩家：\n\n';
    
    gameState.players.forEach(player => {
        const password = gameState.playerPasswords[player.id];
        const cards = player.assignedCards ? 
            player.assignedCards.map(r => ROLES[r].name).join('、') : 
            '未分配';
        message += `${player.id}号: ${password}\n`;
        message += `(分到：${cards})\n\n`;
    });
    
    message += '⚠️ 请保密！不要让玩家看到其他人的密码！';
    
    alert(message);
}

// 切换玩家模式/法官模式
function togglePlayerMode() {
    const statusArea = document.getElementById('player-status-area');
    const isPlayerMode = statusArea.dataset.mode === 'player';
    
    if (isPlayerMode) {
        // 切换到法官模式
        statusArea.dataset.mode = 'judge';
        renderPlayerSelectionStatus();
    } else {
        // 切换到玩家模式
        statusArea.dataset.mode = 'player';
        renderPlayerSelectionStatus();
    }
}

// 渲染玩家选择状态
function renderPlayerSelectionStatus() {
    const statusArea = document.getElementById('player-status-area');
    if (!statusArea) return;
    
    const mode = statusArea.dataset.mode || 'player'; // 默认玩家模式
    
    let html = '<div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">';
    html += `<strong>📊 玩家选择状态</strong>`;
    html += '<table style="width:100%;margin-top:10px;border-collapse:collapse;">';
    html += '<tr style="background:#f8f9fa;"><th style="padding:8px;border:1px solid #ddd;">号码</th><th style="padding:8px;border:1px solid #ddd;">状态</th><th style="padding:8px;border:1px solid #ddd;">分配的牌</th></tr>';
    
    gameState.players.forEach(player => {
        const selection = gameState.playerSelections[player.id];
        const isConfirmed = selection && selection.confirmed;
        const statusIcon = isConfirmed ? '✅' : '⏳';
        const statusText = isConfirmed ? '已完成' : '等待中';
        const cards = player.assignedCards ? 
            player.assignedCards.map(r => ROLES[r].name).join('、') : 
            '未分配';
        
        html += `<tr>`;
        html += `<td style="padding:8px;border:1px solid #ddd;text-align:center;">${player.id}号</td>`;
        html += `<td style="padding:8px;border:1px solid #ddd;text-align:center;">${statusIcon} ${statusText}</td>`;
        html += `<td style="padding:8px;border:1px solid #ddd;">${cards}</td>`;
        html += `</tr>`;
    });
    
    html += '</table>';
    
    // 统计
    const total = gameState.players.length;
    const confirmed = Object.values(gameState.playerSelections).filter(s => s.confirmed).length;
    html += `<div style="margin-top:10px;"><strong>进度：${confirmed}/${total}</strong></div>`;
    
    if (confirmed === total) {
        html += '<div style="margin-top:10px;color:#28a745;"><strong>✅ 所有玩家已完成选择！可以开始游戏了！</strong></div>';
    }
    
    html += '</div>';
    
    statusArea.innerHTML = html;
}

// 更新玩家选择状态
function updatePlayerSelectionStatus() {
    loadPlayerSelections();
    renderPlayerSelectionStatus();
    
    // 同时更新玩家卡片的下拉框
    gameState.players.forEach((player, index) => {
        const selection = gameState.playerSelections[player.id];
        if (selection && selection.confirmed) {
            const topSelect = document.getElementById(`top-${index}`);
            const bottomSelect = document.getElementById(`bottom-${index}`);
            
            if (topSelect && bottomSelect) {
                topSelect.value = selection.top;
                bottomSelect.value = selection.bottom;
                updatePlayerCamp(index);
            }
        }
    });
}

// 监听localStorage变化（其他标签页的更新）
window.addEventListener('storage', function(e) {
    if (e.key === 'werewolf_game_session' && gameState.sessionId) {
        loadPlayerSelections();
        // 如果在分配界面，刷新显示
        if (document.getElementById('assign-section').style.display !== 'none') {
            updatePlayerSelectionStatus();
        }
    }
});

// 生成随机密码（4位数字）
function generatePassword() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// 生成游戏会话ID
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 检查某角色当前是否可用（必须是当前存活的牌）
function isRoleActive(roleId) {
    return hasActiveRole(roleId);
}

// 创建玩家选择下拉框
function createPlayerSelect(id, label, excludeDead = true, allowNone = false) {
    let options = allowNone ? '<option value="">不选择</option>' : '<option value="">请选择</option>';
    
    gameState.players.forEach(p => {
        const isDead = !p.topAlive && !p.bottomAlive;
        if (excludeDead && isDead) return;
        
        const status = p.topAlive ? '上牌' : (p.bottomAlive ? '下牌' : '已出局');
        options += `<option value="${p.id}">${p.id}号 (${status})</option>`;
    });
    
    return `
        <div class="form-row">
            <label>${label}：</label>
            <select id="${id}">${options}</select>
        </div>
    `;
}

// 盗贼表单
function createThiefForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    const title = document.createElement('h4');
    title.textContent = '🎭 盗贼';
    form.appendChild(title);
    
    const script = document.createElement('div');
    script.className = 'alert alert-warning';
    script.style.backgroundColor = '#fff3cd';
    script.style.borderLeft = '4px solid #ffc107';
    script.innerHTML = `
        <strong>【法官台词】</strong><br>
        "【盗贼】请睁眼。"<br>
        "请查看场下的两张底牌。你可以选择其中一张，替换你的下层身份。"<br>
        "盗贼请闭眼。"
    `;
    form.appendChild(script);
    
    if (!isActive) {
        const warning = document.createElement('div');
        warning.className = 'alert alert-danger';
        warning.innerHTML = `
            <strong>⚠️ 盗贼在下牌，本轮不能使用技能</strong><br>
            法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件。
        `;
        form.appendChild(warning);
    } else {
        const info = document.createElement('div');
        info.className = 'alert alert-info';
        info.textContent = '盗贼查看底牌并可以替换自己的身份（通常替换下牌）';
        form.appendChild(info);
    }
    
    // 盗贼是谁
    const playerRow = document.createElement('div');
    playerRow.className = 'form-row';
    const playerLabel = document.createElement('label');
    playerLabel.textContent = '盗贼是谁：';
    playerRow.appendChild(playerLabel);
    const playerSelect = document.createElement('select');
    playerSelect.id = 'thief-player';
    
    let option = document.createElement('option');
    option.value = '';
    option.textContent = '请选择';
    playerSelect.appendChild(option);
    
    gameState.players.forEach(p => {
        const status = '上牌';
        option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.id}号 (${status})`;
        playerSelect.appendChild(option);
    });
    playerRow.appendChild(playerSelect);
    form.appendChild(playerRow);
    
    // 是否换牌
    const swapRow = document.createElement('div');
    swapRow.className = 'form-row';
    const swapLabel = document.createElement('label');
    swapLabel.textContent = '是否换牌：';
    swapRow.appendChild(swapLabel);
    const swapSelect = document.createElement('select');
    swapSelect.id = 'thief-swap';
    
    ['不换', '换上牌', '换下牌'].forEach((text, index) => {
        option = document.createElement('option');
        option.value = ['no', 'top', 'bottom'][index];
        option.textContent = text;
        swapSelect.appendChild(option);
    });
    swapRow.appendChild(swapSelect);
    form.appendChild(swapRow);
    
    // 换成的身份
    const newRoleRow = document.createElement('div');
    newRoleRow.className = 'form-row';
    newRoleRow.id = 'thief-new-role-row';
    newRoleRow.style.display = 'none';
    const newRoleLabel = document.createElement('label');
    newRoleLabel.textContent = '换成的身份：';
    newRoleRow.appendChild(newRoleLabel);
    const newRoleSelect = document.createElement('select');
    newRoleSelect.id = 'thief-new-role';
    
    option = document.createElement('option');
    option.value = '';
    option.textContent = '请选择';
    newRoleSelect.appendChild(option);
    
    Object.keys(ROLES).forEach(roleId => {
        option = document.createElement('option');
        option.value = roleId;
        option.textContent = ROLES[roleId].name;
        newRoleSelect.appendChild(option);
    });
    newRoleRow.appendChild(newRoleSelect);
    form.appendChild(newRoleRow);
    
    // 添加事件监听
    swapSelect.addEventListener('change', function() {
        newRoleRow.style.display = this.value === 'no' ? 'none' : 'block';
    });
    
    return form;
}

// 丘比特表单
function createCupidForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 丘比特在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-info">丘比特连接两名玩家成为情侣，一方死亡另一方殉情</div>`;
    }
    
    form.innerHTML = `
        <h4>💘 丘比特</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【丘比特】请睁眼。"<br>
            "请指定两名玩家连为情侣。"<br>
            "丘比特请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('cupid-player1', '情侣1', false)}
        ${createPlayerSelect('cupid-player2', '情侣2', false)}
    `;
    return form;
}

// 野孩子表单
function createWildChildForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 野孩子在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-info">野孩子选择一名榜样，榜样双身份都死后，野孩子变狼</div>`;
    }
    
    form.innerHTML = `
        <h4>👶 野孩子</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【野孩子】请睁眼。"<br>
            "请选择一名玩家成为你的榜样。"<br>
            "野孩子请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('wildchild-model', '榜样是谁', false)}
    `;
    return form;
}

// 守墓人表单
function createGravediggerForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 守墓人在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。
            </div>
        `;
    }
    
    let verificationInfo = '';
    if (gameState.lastExiled && isActive) {
        const camp = gameState.lastExiled.camp;
        const gesture = camp === 'wolf' ? '👎 狼人' : '👍 好人';
        verificationInfo = `
            <div class="alert alert-success" style="background:#d4edda;">
                <strong>验证结果：</strong>${gameState.lastExiled.playerId}号的上牌是 ${gesture}
            </div>
        `;
    } else if (!isActive) {
        verificationInfo = '';
    } else {
        verificationInfo = '<div class="alert alert-info">昨天没有人被放逐</div>';
    }
    
    form.innerHTML = `
        <h4>⚰️ 守墓人</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【守墓人】请睁眼。"<br>
            "昨天白天被放逐的玩家，他死掉的那张【上牌】身份是……"<br>
            （手势：拇指向上👍=好人 / 拇指向下👎=狼人）<br>
            "守墓人请闭眼。"
        </div>
        ${warningHTML}
        ${verificationInfo}
    `;
    return form;
}

// 守卫表单
function createGuardForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 守卫在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则选择"不守护"。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-warning">注意：守卫连续两晚不能守同一人！${gameState.guardLastTarget ? `上一晚守护了${gameState.guardLastTarget}号` : ''}</div>`;
    }
    
    form.innerHTML = `
        <h4>🛡️ 守卫</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【守卫】请睁眼。"<br>
            "请选择今晚要守护的玩家。"<br>
            "守卫请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('guard-target', '守护目标', true, true)}
    `;
    return form;
}

// 魔术师表单
function createMagicianForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 魔术师在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则选择"不交换"。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-info">魔术师交换两个座位号，所有作用于他们的效果会互换</div>`;
    }
    
    form.innerHTML = `
        <h4>🎩 魔术师</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【魔术师】请睁眼。"<br>
            "请选择两个号码，交换他们的状态。"<br>
            "魔术师请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('magician-player1', '交换对象1', true, true)}
        ${createPlayerSelect('magician-player2', '交换对象2', true, true)}
    `;
    return form;
}

// 狼人表单
function createWolfForm() {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    // 计算哪些狼人可以参与刀人（上牌必须是狼人牌）
    const activeWolves = gameState.players.filter(p => {
        if (!p.topAlive && !p.bottomAlive) return false; // 完全死亡
        const currentRole = p.topAlive ? p.topRole : p.bottomRole;
        return currentRole === 'wolf' || currentRole === 'wolfKing' || currentRole === 'wolfBeauty';
    });
    
    let wolvesInfo = '<div class="alert alert-info" style="background:#e3f2fd;border-left:4px solid #2196f3;">';
    wolvesInfo += '<strong>📋 可参与刀人的狼人（上牌必须是狼人牌）：</strong><br>';
    if (activeWolves.length > 0) {
        activeWolves.forEach(p => {
            const currentRole = p.topAlive ? p.topRole : p.bottomRole;
            const roleName = ROLES[currentRole].name;
            const status = p.topAlive ? '上牌' : '下牌';
            wolvesInfo += `- ${p.id}号（${roleName}，${status}）<br>`;
        });
    } else {
        wolvesInfo += '<span style="color:red;">⚠️ 当前没有狼人可以睁眼刀人！</span><br>';
    }
    wolvesInfo += '</div>';
    
    form.innerHTML = `
        <h4>🐺 狼人</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【狼人】请睁眼。"<br>
            "请确认同伴。请选择今晚击杀的目标。"<br>
            ${hasActiveRole('wolfBeauty') ? '"【狼美人】请举手。请选择你要魅惑的玩家。"<br>' : ''}
            "狼人请闭眼。"
        </div>
        ${wolvesInfo}
        ${createPlayerSelect('wolf-kill', '击杀目标', true, true)}
        ${hasActiveRole('wolfBeauty') ? createPlayerSelect('wolfbeauty-charm', '狼美人魅惑', true, true) : ''}
    `;
    return form;
}

// 女巫表单
function createWitchForm(isActive = true) {
    const antidoteDisabled = gameState.witchAntidoteUsed ? 'disabled' : '';
    const poisonDisabled = gameState.witchPoisonUsed ? 'disabled' : '';
    
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let deadPlayer = '未知';
    let magicianHint = '';
    if (gameState.nightActions.wolfKill) {
        let originalTarget = gameState.nightActions.wolfKill;
        let actualTarget = originalTarget;
        
        // 考虑魔术师交换
        if (gameState.nightActions.magicianSwap) {
            const [a, b] = gameState.nightActions.magicianSwap;
            if (originalTarget === a) actualTarget = b;
            else if (originalTarget === b) actualTarget = a;
            
            // 如果发生了交换，添加明显的提示
            if (originalTarget !== actualTarget) {
                magicianHint = `
                    <div class="alert alert-danger" style="background:#ffe6e6;border-left:4px solid #e74c3c;">
                        <strong>🎩 魔术师交换提醒：</strong><br>
                        狼人刀的是 <strong>${originalTarget}号座位</strong><br>
                        但因为魔术师交换了 ${gameState.nightActions.magicianSwap[0]}号 ↔️ ${gameState.nightActions.magicianSwap[1]}号<br>
                        所以实际死的是 <strong>${actualTarget}号玩家</strong><br>
                        <span style="color:#c0392b;">⚠️ 法官告诉女巫：${actualTarget}号死了</span>
                    </div>
                `;
            }
        }
        deadPlayer = `${actualTarget}号`;
    }
    
    let witchPoisonHunterHint = '';
    // 检查是否有活着的猎人
    const activeHunter = gameState.players.find(p => {
        const currentRole = p.topAlive ? p.topRole : (p.bottomAlive ? p.bottomRole : null);
        return currentRole === 'hunter' && (p.topAlive || p.bottomAlive);
    });
    if (activeHunter) {
        witchPoisonHunterHint = `
            <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #f39c12;">
                <strong>🏹 猎人状态提醒：</strong><br>
                ${activeHunter.id}号是猎人。如果女巫毒死猎人，猎人不能开枪。<br>
                法官需要记住：如果毒了猎人，后续猎人状态确认时显示 👎
            </div>
        `;
    }
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 女巫在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则都不选择。
            </div>
        `;
    }
    
    form.innerHTML = `
        <h4>🧪 女巫</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【女巫】请睁眼。"<br>
            "今晚他（手势指向：<strong>${deadPlayer}</strong>）死了，你有一瓶解药，要用吗？"<br>
            "你有一瓶毒药，要用吗？"<br>
            "女巫请闭眼。"
        </div>
        ${magicianHint}
        ${witchPoisonHunterHint}
        ${warningHTML}
        <div class="alert alert-info">
            解药状态：${gameState.witchAntidoteUsed ? '已使用 ✗' : '可用 ✓'}<br>
            毒药状态：${gameState.witchPoisonUsed ? '已使用 ✗' : '可用 ✓'}
        </div>
        <div class="form-row">
            <label>
                <input type="checkbox" id="witch-save" ${antidoteDisabled}> 使用解药救人
            </label>
        </div>
        ${createPlayerSelect('witch-poison', '使用毒药毒', true, true)}
        ${poisonDisabled ? '<div class="alert alert-warning">毒药已使用</div>' : ''}
    `;
    return form;
}

// 预言家表单
function createSeerForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    const title = document.createElement('h4');
    title.textContent = '🔮 预言家';
    form.appendChild(title);
    
    const script = document.createElement('div');
    script.className = 'alert alert-warning';
    script.style.backgroundColor = '#fff3cd';
    script.style.borderLeft = '4px solid #ffc107';
    script.innerHTML = `
        <strong>【法官台词】</strong><br>
        "【预言家】请睁眼。"<br>
        "请选择要查验的玩家。"<br>
        （手势告知：👍好人 / 👎狼人）<br>
        "预言家请闭眼。"
    `;
    form.appendChild(script);
    
    // 如果角色在下牌，显示警告但仍保留控件
    if (!isActive) {
        const warning = document.createElement('div');
        warning.className = 'alert alert-danger';
        warning.innerHTML = `
            <strong>⚠️ 预言家在下牌，本轮不能使用技能</strong><br>
            法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则选择"不查验"。
        `;
        form.appendChild(warning);
    } else {
        const info = document.createElement('div');
        info.className = 'alert alert-info';
        info.textContent = '预言家查验一名玩家的当前身份（上牌）';
        form.appendChild(info);
    }
    
    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    
    const label = document.createElement('label');
    label.textContent = '查验目标：';
    formRow.appendChild(label);
    
    const select = document.createElement('select');
    select.id = 'seer-check';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择';
    select.appendChild(defaultOption);
    
    gameState.players.forEach(p => {
        const isDead = !p.topAlive && !p.bottomAlive;
        if (isDead) return;
        
        const status = p.topAlive ? '上牌' : '下牌';
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.id}号 (${status})`;
        select.appendChild(option);
    });
    
    formRow.appendChild(select);
    form.appendChild(formRow);
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'form-row';
    resultDiv.id = 'seer-result';
    resultDiv.style.marginTop = '10px';
    form.appendChild(resultDiv);
    
    // 添加事件监听
    select.addEventListener('change', function() {
        if (!this.value) {
            resultDiv.innerHTML = '';
            return;
        }
        const playerId = parseInt(this.value);
        const player = gameState.players.find(p => p.id === playerId);
        const currentRole = player.topAlive ? player.topRole : player.bottomRole;
        const role = ROLES[currentRole];
        
        // 隐狼验不出来
        let result;
        if (currentRole === 'hiddenWolf') {
            result = '<span style="color:#3498db;">好人 👍</span>';
        } else if (role.camp === 'wolf') {
            result = '<span style="color:#e74c3c;">狼人 👎</span>';
        } else {
            result = '<span style="color:#3498db;">好人 👍</span>';
        }
        
        resultDiv.innerHTML = `<strong>验证结果：${result}</strong>`;
    });
    
    return form;
}

// 乌鸦表单
function createCrowForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 乌鸦在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则选择"不诅咒"。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-info">乌鸦诅咒一名玩家，该玩家明天白天自带一票</div>`;
    }
    
    form.innerHTML = `
        <h4>🐦 乌鸦</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【乌鸦】请睁眼。"<br>
            "请选择诅咒一名玩家，该玩家明天自带一票。"<br>
            "乌鸦请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('crow-curse', '诅咒目标', true, true)}
    `;
    return form;
}

// 禁言长老表单
function createElderForm(isActive = true) {
    const form = document.createElement('div');
    form.className = 'action-form';
    
    let warningHTML = '';
    if (!isActive) {
        warningHTML = `
            <div class="alert alert-danger">
                <strong>⚠️ 禁言长老在下牌，本轮不能使用技能</strong><br>
                法官仍需念上述台词防止信息泄露。如需记录信息，可使用下方控件，否则选择"不禁言"。
            </div>
        `;
    } else {
        warningHTML = `<div class="alert alert-info">禁言长老指定一名玩家明天白天不能发言</div>`;
    }
    
    form.innerHTML = `
        <h4>🤐 禁言长老</h4>
        <div class="alert alert-warning" style="background:#fff3cd;border-left:4px solid #ffc107;">
            <strong>【法官台词】</strong><br>
            "【禁言长老】请睁眼。"<br>
            "请指定一名玩家明天白天不能发言。"<br>
            "禁言长老请闭眼。"
        </div>
        ${warningHTML}
        ${createPlayerSelect('elder-silence', '禁言目标', true, true)}
    `;
    return form;
}

// 猎人状态确认（每晚最后环节）
function createHunterStatusForm() {
    const form = document.createElement('div');
    form.className = 'action-form';
    form.style.borderLeft = '4px solid #ff5722';
    
    const title = document.createElement('h4');
    title.textContent = '🏹 猎人状态确认';
    form.appendChild(title);
    
    const script = document.createElement('div');
    script.className = 'alert alert-warning';
    script.style.backgroundColor = '#fff3cd';
    script.style.borderLeft = '4px solid #ffc107';
    script.innerHTML = `
        <strong>【法官台词】</strong><br>
        "【猎人】请睁眼。"<br>
        （法官做手势告知猎人当前状态）<br>
        "猎人请闭眼。"
    `;
    form.appendChild(script);
    
    // 检查猎人是否被女巫毒
    const witchPoison = gameState.nightActions.witchPoison;
    let isPoisoned = false;
    
    if (witchPoison) {
        // 检查被毒的玩家是否是猎人
        const poisonedPlayer = gameState.players.find(p => p.id === witchPoison);
        if (poisonedPlayer) {
            const currentRole = poisonedPlayer.topAlive ? poisonedPlayer.topRole : poisonedPlayer.bottomRole;
            isPoisoned = (currentRole === 'hunter');
        }
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'alert';
    
    if (isPoisoned) {
        statusDiv.style.backgroundColor = '#ffebee';
        statusDiv.style.borderLeft = '4px solid #f44336';
        statusDiv.innerHTML = `
            <strong>👎 手势：向下（禁止开枪）</strong><br>
            猎人被女巫毒杀，技能被封印，无法开枪。
        `;
    } else {
        statusDiv.style.backgroundColor = '#e8f5e9';
        statusDiv.style.borderLeft = '4px solid #4caf50';
        statusDiv.innerHTML = `
            <strong>👍 手势：向上（可以开枪）</strong><br>
            猎人未被毒，死亡时可以开枪。
        `;
    }
    
    form.appendChild(statusDiv);
    
    const noteDiv = document.createElement('div');
    noteDiv.className = 'alert alert-info';
    noteDiv.style.fontSize = '0.9em';
    noteDiv.innerHTML = `
        <strong>📋 说明：</strong>每晚都要向猎人确认状态，防止信息泄露。<br>
        猎人通过手势知道自己能否开枪，但其他玩家不知道。
    `;
    form.appendChild(noteDiv);
    
    return form;
}

// 结算当晚
function settleNight() {
    try {
        // 收集所有行动
        collectNightActions();
        
        // 如果是第一夜，处理特殊行动
        if (gameState.isFirstNight) {
            handleFirstNightActions();
        }
        
        // 计算死亡
        const deaths = calculateDeaths();
        
        // 显示死亡结果
        displayDeaths(deaths);
        
        // 更新显示
        updateGameDisplay();
        
        // 准备进入白天（不增加night计数，等白天结束后再增加）
        gameState.isFirstNight = false;
    } catch (error) {
        console.error('结算夜晚时出错:', error);
        showErrorAndExport('结算夜晚时出现错误', error);
    }
}

// 收集夜间行动
function collectNightActions() {
    const actions = gameState.nightActions;
    
    // 守卫
    const guardTarget = document.getElementById('guard-target')?.value;
    actions.guardTarget = guardTarget ? parseInt(guardTarget) : null;
    if (guardTarget) {
        gameState.guardLastTarget = parseInt(guardTarget);
    }
    
    // 魔术师
    const mag1 = document.getElementById('magician-player1')?.value;
    const mag2 = document.getElementById('magician-player2')?.value;
    if (mag1 && mag2) {
        actions.magicianSwap = [parseInt(mag1), parseInt(mag2)];
    } else {
        actions.magicianSwap = null;
    }
    
    // 狼人
    const wolfKill = document.getElementById('wolf-kill')?.value;
    actions.wolfKill = wolfKill ? parseInt(wolfKill) : null;
    
    // 狼美人
    const wolfBeautyCharm = document.getElementById('wolfbeauty-charm')?.value;
    actions.wolfBeautyCharm = wolfBeautyCharm ? parseInt(wolfBeautyCharm) : null;
    gameState.currentCharm = actions.wolfBeautyCharm;
    
    // 女巫
    actions.witchSave = document.getElementById('witch-save')?.checked || false;
    const witchPoison = document.getElementById('witch-poison')?.value;
    actions.witchPoison = witchPoison ? parseInt(witchPoison) : null;
    
    if (actions.witchSave) gameState.witchAntidoteUsed = true;
    if (actions.witchPoison) gameState.witchPoisonUsed = true;
    
    // 预言家（仅记录，不影响结算）
    const seerCheck = document.getElementById('seer-check')?.value;
    actions.seerCheck = seerCheck ? parseInt(seerCheck) : null;
    
    // 乌鸦
    const crowCurse = document.getElementById('crow-curse')?.value;
    gameState.cursedPlayer = crowCurse ? parseInt(crowCurse) : null;
    
    // 禁言长老
    const elderSilence = document.getElementById('elder-silence')?.value;
    gameState.silencedPlayer = elderSilence ? parseInt(elderSilence) : null;
}

// 处理第一夜特殊行动
function handleFirstNightActions() {
    // 盗贼
    const thiefPlayer = document.getElementById('thief-player')?.value;
    const thiefSwap = document.getElementById('thief-swap')?.value;
    const thiefNewRole = document.getElementById('thief-new-role')?.value;
    
    if (thiefPlayer && thiefSwap !== 'no' && thiefNewRole) {
        const player = gameState.players.find(p => p.id === parseInt(thiefPlayer));
        if (thiefSwap === 'top') {
            player.topRole = thiefNewRole;
        } else {
            player.bottomRole = thiefNewRole;
        }
        // 重新判断阵营
        const topCamp = ROLES[player.topRole].camp;
        const bottomCamp = ROLES[player.bottomRole].camp;
        player.camp = (topCamp === 'wolf' || bottomCamp === 'wolf') ? 'wolf' : 'good';
        
        addDeathLog(`🎭 ${player.id}号盗贼换牌成功`);
    }
    
    // 丘比特
    const cupid1 = document.getElementById('cupid-player1')?.value;
    const cupid2 = document.getElementById('cupid-player2')?.value;
    
    if (cupid1 && cupid2 && cupid1 !== cupid2) {
        const p1 = gameState.players.find(p => p.id === parseInt(cupid1));
        const p2 = gameState.players.find(p => p.id === parseInt(cupid2));
        
        gameState.couples = [p1.id, p2.id];
        
        // 判断是否第三方
        if (p1.camp !== p2.camp) {
            gameState.couplesAreCamp = 'third';
            addDeathLog(`💘 ${p1.id}号和${p2.id}号成为情侣（第三方阵营）`);
        } else if (p1.camp === 'wolf') {
            gameState.couplesAreCamp = 'wolf';
            addDeathLog(`💘 ${p1.id}号和${p2.id}号成为情侣（狼人阵营）`);
        } else {
            gameState.couplesAreCamp = 'good';
            addDeathLog(`💘 ${p1.id}号和${p2.id}号成为情侣（好人阵营）`);
        }
    }
    
    // 野孩子
    const wildChildModel = document.getElementById('wildchild-model')?.value;
    if (wildChildModel) {
        gameState.wildChildModel = parseInt(wildChildModel);
        addDeathLog(`👶 野孩子的榜样是${wildChildModel}号`);
    }
}

// 计算死亡
function calculateDeaths() {
    const actions = gameState.nightActions;
    const deaths = [];
    
    // 1. 基础死亡：狼刀
    let wolfKillTarget = actions.wolfKill;
    
    // 魔术师交换
    if (actions.magicianSwap) {
        const [a, b] = actions.magicianSwap;
        if (wolfKillTarget === a) wolfKillTarget = b;
        else if (wolfKillTarget === b) wolfKillTarget = a;
        
        // 守卫守护也会被交换
        if (actions.guardTarget === a) actions.guardTarget = b;
        else if (actions.guardTarget === b) actions.guardTarget = a;
    }
    
    // 检查守卫和解药
    if (wolfKillTarget) {
        const isGuarded = actions.guardTarget === wolfKillTarget;
        const isSaved = actions.witchSave;
        
        if (isGuarded && isSaved) {
            // 同守同救，必死
            deaths.push({ playerId: wolfKillTarget, reason: '同守同救' });
        } else if (!isGuarded && !isSaved) {
            // 没守没救，死
            deaths.push({ playerId: wolfKillTarget, reason: '狼刀' });
        }
        // 其他情况：有守或有救，不死
    }
    
    // 2. 女巫毒
    if (actions.witchPoison) {
        deaths.push({ playerId: actions.witchPoison, reason: '女巫毒' });
    }
    
    return deaths;
}

// 显示死亡结果
function displayDeaths(initialDeaths) {
    if (initialDeaths.length === 0) {
        addDeathLog('🌙 平安夜，无人死亡');
        alert('平安夜！无人死亡。');
        return;
    }
    
    // 处理连锁死亡
    const allDeaths = processChainDeaths(initialDeaths);
    
    // 显示死亡
    let message = '昨夜死亡：\n\n';
    allDeaths.forEach(death => {
        const player = gameState.players.find(p => p.id === death.playerId);
        const identity = player.topAlive ? ROLES[player.topRole].name : ROLES[player.bottomRole].name;
        message += `${death.playerId}号 (${identity}) - ${death.reason}\n`;
        
        addDeathLog(`💀 ${death.playerId}号死亡 - ${death.reason}`);
        
        // 更新玩家状态
        if (player.topAlive) {
            player.topAlive = false;
        } else {
            player.bottomAlive = false;
        }
    });
    
    alert(message);
}

// 处理连锁死亡
function processChainDeaths(initialDeaths) {
    const allDeaths = [...initialDeaths];
    const processed = new Set();
    
    let i = 0;
    while (i < allDeaths.length) {
        const death = allDeaths[i];
        if (processed.has(death.playerId)) {
            i++;
            continue;
        }
        processed.add(death.playerId);
        
        const player = gameState.players.find(p => p.id === death.playerId);
        const dyingRole = player.topAlive ? player.topRole : player.bottomRole;
        
        // 记录警长是否死亡（留待白天处理传警徽）
        if (gameState.police === death.playerId) {
            gameState.policeNeedTransfer = true;
        }
        
        // 3. 狼美人殉情（只在上牌是狼美人且魅惑了人时）
        if (dyingRole === 'wolfBeauty' && player.topAlive && gameState.currentCharm) {
            allDeaths.push({ playerId: gameState.currentCharm, reason: '狼美人殉情' });
            // 不立即清空，留待白天结束清空
        }
        
        // 4. 情侣殉情
        if (gameState.couples && gameState.couples.includes(death.playerId)) {
            const partnerId = gameState.couples.find(id => id !== death.playerId);
            if (!processed.has(partnerId)) {
                allDeaths.push({ playerId: partnerId, reason: '情侣殉情' });
            }
        }
        
        // 5. 猎人开枪标记（不立即询问，留待白天处理）
        if (dyingRole === 'hunter' && death.reason !== '女巫毒' && player.topAlive) {
            // 标记猎人可以开枪，但不立即处理
            if (!gameState.hunterCanShoot) {
                gameState.hunterCanShoot = death.playerId;
            }
        }
        
        // 6. 狼王开枪（如果不是被女巫毒死且上牌是狼王）
        if (dyingRole === 'wolfKing' && death.reason !== '女巫毒' && player.topAlive) {
            const alivePlayers = gameState.players
                .filter(p => (p.topAlive || p.bottomAlive) && p.id !== death.playerId && !processed.has(p.id))
                .map(p => p.id)
                .join(', ');
            
            const target = prompt(
                `${death.playerId}号狼王可以开枪！\n\n请输入目标号码（输入0表示不开枪）：\n存活玩家：${alivePlayers}`
            );
            
            if (target && parseInt(target) > 0) {
                allDeaths.push({ playerId: parseInt(target), reason: '狼王开枪' });
            }
        }
        
        // 7. 检查野孩子榜样
        if (gameState.wildChildModel === death.playerId) {
            const wildChildDead = !player.topAlive && !player.bottomAlive;
            if (wildChildDead) {
                // 找野孩子并变狼
                const wildChild = gameState.players.find(p => 
                    (p.topAlive && p.topRole === 'wildChild') || 
                    (!p.topAlive && p.bottomAlive && p.bottomRole === 'wildChild')
                );
                if (wildChild) {
                    if (wildChild.topAlive && wildChild.topRole === 'wildChild') {
                        wildChild.topRole = 'wolf';
                    } else if (!wildChild.topAlive && wildChild.bottomRole === 'wildChild') {
                        wildChild.bottomRole = 'wolf';
                    }
                    wildChild.camp = 'wolf';
                    addDeathLog(`👶 野孩子的榜样死亡，野孩子变成狼人！`);
                }
            }
        }
        
        i++;
    }
    
    return allDeaths;
}

// 添加死亡日志
function addDeathLog(message) {
    gameState.deathLog.push({
        night: gameState.night,
        message: message
    });
}

// 更新游戏显示
function updateGameDisplay() {
    updatePlayerStatus();
    updateRelations();
    updateDeathLog();
}

// 更新玩家状态
function updatePlayerStatus() {
    const container = document.getElementById('player-status');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const item = document.createElement('div');
        const isDeadAll = !player.topAlive && !player.bottomAlive;
        
        item.className = 'player-status-item';
        if (isDeadAll) {
            item.className += ' dead-all';
        } else if (!player.topAlive) {
            item.className += ' dead-top';
        }
        
        const currentRole = player.topAlive ? 
            ROLES[player.topRole].name : 
            (player.bottomAlive ? ROLES[player.bottomRole].name : '出局');
        
        const badges = [];
        
        // 阵营徽章
        if (!isDeadAll) {
            if (player.camp === 'wolf') {
                badges.push('<span class="badge badge-wolf">狼</span>');
            } else {
                badges.push('<span class="badge badge-good">好人</span>');
            }
        }
        
        // 情侣徽章
        if (gameState.couples && gameState.couples.includes(player.id)) {
            if (gameState.couplesAreCamp === 'third') {
                badges.push('<span class="badge badge-third">第三方</span>');
            }
            badges.push('<span class="badge badge-couple">情侣</span>');
        }
        
        // 警长徽章
        if (gameState.police === player.id) {
            badges.push('<span class="badge badge-police">警长</span>');
        }
        
        // 被魅惑徽章
        if (gameState.currentCharm === player.id) {
            badges.push('<span class="badge" style="background:#e91e63;color:white;">💋魅惑</span>');
        }
        
        // 诅咒徽章
        if (gameState.cursedPlayer === player.id) {
            badges.push('<span class="badge badge-cursed">诅咒</span>');
        }
        
        // 禁言徽章
        if (gameState.silencedPlayer === player.id) {
            badges.push('<span class="badge badge-silenced">禁言</span>');
        }
        
        // 详细状态显示
        const topRoleName = ROLES[player.topRole].name;
        const bottomRoleName = ROLES[player.bottomRole].name;
        const topStatus = player.topAlive ? '✓' : '✗';
        const bottomStatus = player.bottomAlive ? '✓' : '✗';
        
        let statusText = '';
        if (isDeadAll) {
            statusText = '彻底出局';
        } else if (!player.topAlive) {
            statusText = `当前：${bottomRoleName}`;
        } else {
            statusText = `当前：${topRoleName}`;
        }
        
        item.innerHTML = `
            <div>
                <strong>${player.id}号</strong> - ${statusText}
            </div>
            <div style="font-size:0.85em;color:#666;margin-top:3px;">
                上牌：${topRoleName} ${topStatus} | 下牌：${bottomRoleName} ${bottomStatus}
            </div>
            <div class="badges">${badges.join('')}</div>
        `;
        
        container.appendChild(item);
    });
}

// 更新关系网络
function updateRelations() {
    const container = document.getElementById('relations-content');
    const relations = [];
    
    if (gameState.couples) {
        relations.push(`💕 情侣：${gameState.couples[0]}号 & ${gameState.couples[1]}号`);
    }
    
    if (gameState.wildChildModel) {
        relations.push(`👶 野孩子榜样：${gameState.wildChildModel}号`);
    }
    
    if (gameState.currentCharm) {
        relations.push(`💋 当前被魅惑：${gameState.currentCharm}号`);
    }
    
    if (relations.length === 0) {
        container.innerHTML = '<div style="color:#999;">暂无关系</div>';
    } else {
        container.innerHTML = relations.map(r => `<div>${r}</div>`).join('');
    }
}

// 更新死亡日志
function updateDeathLog() {
    const container = document.getElementById('death-items');
    container.innerHTML = '';
    
    // 只显示最近10条
    const recentLogs = gameState.deathLog.slice(-10).reverse();
    
    recentLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'death-item';
        item.textContent = `第${log.night}夜：${log.message}`;
        container.appendChild(item);
    });
}

// 切换显示区域
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// 重置当晚行动
function resetNightActions() {
    if (confirm('确定要撤销本夜吗？\n\n将恢复到本夜开始前的状态，所有本夜操作将丢失！')) {
        if (restoreLastSnapshot()) {
            alert('✅ 已恢复到本夜开始前的状态');
            updateGameDisplay();
            renderNightActions();
        } else {
            alert('❌ 撤销失败：没有可恢复的状态（可能是游戏刚开始）');
        }
    }
}

// 进入白天
function enterDayPhase() {
    // 不再清空魅惑，魅惑持续到白天结束
    
    // 渲染白天界面
    renderDayPhase();
}

// 渲染白天界面
function renderDayPhase() {
    const container = document.getElementById('night-actions');
    container.innerHTML = '';
    
    const phaseIndicator = document.getElementById('phase-indicator');
    phaseIndicator.textContent = `第 ${gameState.night} 天`;
    phaseIndicator.style.background = '#f39c12';
    
    // 白天流程提示
    const dayScript = document.createElement('div');
    dayScript.className = 'alert alert-warning';
    dayScript.style.backgroundColor = '#fff3cd';
    dayScript.style.borderLeft = '4px solid #ffc107';
    
    // 生成昨夜死亡信息
    let nightDeathsInfo = '';
    const lastNightDeaths = gameState.deathLog.filter(log => log.night === gameState.night);
    
    if (lastNightDeaths.length > 0) {
        nightDeathsInfo = '<br><div style="background:#ffe6e6;padding:10px;border-radius:5px;border-left:4px solid #e74c3c;margin:10px 0;">';
        nightDeathsInfo += '<strong style="color:#e74c3c;">【昨夜死讯】</strong><br>';
        lastNightDeaths.forEach(log => {
            nightDeathsInfo += `${log.message}<br>`;
        });
        nightDeathsInfo += '</div>';
    } else {
        nightDeathsInfo = '<br><strong style="color:#27ae60;">【昨夜】平安夜，无人死亡 🌙</strong><br>';
    }
    
    dayScript.innerHTML = `
        <strong>【法官台词 - 白天流程】</strong><br>
        1. "天亮了，请睁眼。"
        ${nightDeathsInfo}
        2. 警长传警徽（如果警长死亡）<br>
        3. 竞选警长（仅第一天）<br>
        4. <strong style="color:#e74c3c;">骑士决斗（在归票投票之前）</strong><br>
        5. 发言阶段（注意禁言和乌鸦诅咒）<br>
        6. 警长归票<br>
        7. 放逐投票<br>
        8. 猎人开枪（如果被投出且可以开枪）
    `;
    container.appendChild(dayScript);
    
    // 白天操作表单
    const dayForm = document.createElement('div');
    dayForm.className = 'action-form';
    
    let formHTML = '<h4>☀️ 白天操作</h4>';
    
    // 显示被魅惑的玩家
    if (gameState.currentCharm) {
        formHTML += `
            <div class="alert alert-danger" style="background:#ffe6e6;border-left:4px solid #e74c3c;">
                <strong>💋 狼美人魅惑：</strong>${gameState.currentCharm}号玩家被魅惑（狼美人死亡则殉情）
            </div>
        `;
    }
    
    // 警长传警徽
    if (gameState.policeNeedTransfer) {
        formHTML += `
            <div class="alert alert-danger" style="background:#ffe6e6;border-left:4px solid #e74c3c;">
                <strong>👮 警长已死亡！需要传警徽或撕毁警徽</strong>
            </div>
            <div class="form-row">
                <label>警长传警徽给：</label>
                <select id="police-transfer">
                    <option value="0">撕毁警徽</option>
                    ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                        `<option value="${p.id}">${p.id}号</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }
    
    // 禁言提示
    if (gameState.silencedPlayer) {
        formHTML += `
            <div class="alert alert-info">
                <strong>🤐 禁言：</strong>${gameState.silencedPlayer}号玩家今天不能发言
            </div>
        `;
    }
    
    // 乌鸦诅咒
    if (gameState.cursedPlayer) {
        formHTML += `
            <div class="alert alert-info">
                <strong>🐦 乌鸦诅咒：</strong>${gameState.cursedPlayer}号玩家今天自带一票
            </div>
        `;
    }
    
    // 第一天选举警长
    if (gameState.night === 1 && !gameState.police) {
        formHTML += `
            <div class="form-row">
                <label>竞选警长：</label>
                <select id="police-select">
                    <option value="">无人当选警长</option>
                    ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                        `<option value="${p.id}">${p.id}号</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }
    
    // ========== 骑士决斗（在归票投票之前）==========
    if (hasActiveRole('knight') && !gameState.knightDuelUsed) {
        formHTML += `
            <div style="background:#fff3cd;padding:10px;border-radius:5px;margin:15px 0;border-left:4px solid #f39c12;">
                <strong>⚔️ 骑士决斗</strong><br>
                <span style="font-size:0.9em;color:#856404;">骑士决斗在归票投票之前进行。如果骑士开错了，只死骑士身份（上牌），本轮不能参与归票投票。<br>
                <strong style="color:#e74c3c;">⚠️ 骑士技能只能使用一次！</strong></span>
            </div>
            <div class="form-row">
                <label>骑士决斗：</label>
                <select id="knight-duel-from">
                    <option value="">无人使用骑士</option>
                    ${gameState.players.filter(p => {
                        const currentRole = p.topAlive ? p.topRole : p.bottomRole;
                        return (p.topAlive || p.bottomAlive) && currentRole === 'knight';
                    }).map(p => 
                        `<option value="${p.id}">${p.id}号骑士</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-row" id="knight-target-row" style="display:none;">
                <label>决斗目标：</label>
                <select id="knight-duel-target">
                    <option value="">请选择</option>
                    ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                        `<option value="${p.id}">${p.id}号</option>`
                    ).join('')}
                </select>
            </div>
        `;
    } else if (hasRoleInGame('knight') && gameState.knightDuelUsed) {
        formHTML += `
            <div class="alert alert-info" style="background:#e3f2fd;border-left:4px solid #2196f3;">
                <strong>⚔️ 骑士决斗技能不可用</strong><br>
                骑士决斗技能只能使用一次，本局已使用。
            </div>
        `;
    }
    
    // 警长归票（注意：如果骑士本轮死了，需要排除）
    if (gameState.police && !gameState.policeNeedTransfer) {
        formHTML += `
            <div class="form-row">
                <label>警长归票（可选）：</label>
                <select id="police-vote">
                    <option value="">不归票</option>
                    ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                        `<option value="${p.id}">${p.id}号</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }
    
    // 放逐投票
    formHTML += `
        <div class="form-row">
            <label>投票放逐：</label>
            <select id="day-exile">
                <option value="">无人被放逐</option>
                ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                    `<option value="${p.id}">${p.id}号</option>`
                ).join('')}
            </select>
        </div>
    `;
    
    // 猎人开枪（如果被放逐且可以开枪）
    formHTML += `
        <div class="form-row">
            <label>猎人开枪（被放逐且未被毒）：</label>
            <select id="hunter-shoot">
                <option value="">不开枪</option>
                ${gameState.players.filter(p => p.topAlive || p.bottomAlive).map(p => 
                    `<option value="${p.id}">${p.id}号</option>`
                ).join('')}
            </select>
        </div>
    `;
    
    dayForm.innerHTML = formHTML;
    container.appendChild(dayForm);
    
    // 骑士决斗联动
    const knightFrom = document.getElementById('knight-duel-from');
    const knightTargetRow = document.getElementById('knight-target-row');
    if (knightFrom && knightTargetRow) {
        knightFrom.addEventListener('change', function() {
            knightTargetRow.style.display = this.value ? 'block' : 'none';
        });
    }
    
    // 修改按钮文本
    document.getElementById('settle-night-btn').textContent = '结算白天';
    document.getElementById('day-phase-btn').style.display = 'none';
}

// 结算白天
function settleDayPhase() {
    try {
        const exileId = document.getElementById('day-exile')?.value;
        const knightFrom = document.getElementById('knight-duel-from')?.value;
        const knightTarget = document.getElementById('knight-duel-target')?.value;
        const hunterShoot = document.getElementById('hunter-shoot')?.value;
        const policeId = document.getElementById('police-select')?.value;
        const policeTransfer = document.getElementById('police-transfer')?.value;
        const policeVote = document.getElementById('police-vote')?.value;
        
        const deaths = [];
        let knightDied = false; // 记录骑士是否本轮死亡
        
        // 警长传警徽
        if (gameState.policeNeedTransfer && policeTransfer !== undefined) {
            if (policeTransfer === '0') {
                gameState.police = null;
                addDeathLog(`👮 警徽撕毁`);
            } else {
                gameState.police = parseInt(policeTransfer);
                addDeathLog(`👮 警徽传给${policeTransfer}号`);
            }
            gameState.policeNeedTransfer = false;
        }
        
        // ========== 骑士决斗（先处理）==========
        if (knightFrom && knightTarget) {
            const knight = gameState.players.find(p => p.id === parseInt(knightFrom));
            const target = gameState.players.find(p => p.id === parseInt(knightTarget));
            const targetRole = target.topAlive ? target.topRole : target.bottomRole;
            const targetCamp = ROLES[targetRole].camp;
            
            // 标记骑士技能已使用
            gameState.knightDuelUsed = true;
            
            if (targetCamp === 'wolf') {
                // 决斗成功，目标死亡
                const targetRoleName = ROLES[targetRole].name;
                addDeathLog(`⚔️ ${knightFrom}号骑士决斗${knightTarget}号成功！${knightTarget}号（${targetRoleName}）死亡`);
                deaths.push({ playerId: parseInt(knightTarget), reason: '骑士决斗' });
            } else {
                // 决斗失败，骑士只死上牌（骑士身份）
                const targetRoleName = ROLES[targetRole].name;
                addDeathLog(`⚔️ ${knightFrom}号骑士决斗${knightTarget}号（${targetRoleName}）失败！骑士身份死亡`);
                
                // 只杀上牌
                const knightPlayer = gameState.players.find(p => p.id === parseInt(knightFrom));
                if (knightPlayer.topAlive) {
                    knightPlayer.topAlive = false;
                    knightDied = true;
                    
                    // 检查是否是警长
                    if (gameState.police === parseInt(knightFrom)) {
                        gameState.policeNeedTransfer = true;
                    }
                    
                    // 不加入deaths数组，因为只是上牌死亡，玩家还活着
                    addDeathLog(`💀 ${knightFrom}号的上牌（骑士）死亡`);
                }
            }
        }
        
        // 警长归票（仅记录日志）
        // 注意：如果是骑士本人且本轮死了，归票无效
        if (policeVote) {
            if (knightDied && gameState.police === parseInt(knightFrom)) {
                addDeathLog(`👮 警长（${knightFrom}号）本轮死亡，归票无效`);
            } else {
                addDeathLog(`👮 警长归票：${policeVote}号`);
            }
        }
        
        // 放逐投票
        if (exileId) {
            const exilePlayerId = parseInt(exileId);
            deaths.push({ playerId: exilePlayerId, reason: '放逐投票' });
            addDeathLog(`🗳️ ${exileId}号被放逐`);
            
            // 记录被放逐者（供守墓人验证）
            const exiledPlayer = gameState.players.find(p => p.id === exilePlayerId);
            gameState.lastExiled = {
                playerId: exilePlayerId,
                role: exiledPlayer.topAlive ? exiledPlayer.topRole : exiledPlayer.bottomRole,
                camp: ROLES[exiledPlayer.topAlive ? exiledPlayer.topRole : exiledPlayer.bottomRole].camp
            };
        }
        
        // 猎人开枪（白天被放逐且可以开枪）
        if (hunterShoot) {
            const shootTarget = parseInt(hunterShoot);
            deaths.push({ playerId: shootTarget, reason: '猎人开枪' });
            addDeathLog(`🏹 猎人开枪带走${hunterShoot}号`);
        }
        
        // 第一天选举警长
        if (policeId) {
            gameState.police = parseInt(policeId);
            addDeathLog(`👮 ${policeId}号当选警长`);
        }
        
        // 处理死亡（使用processChainDeaths处理连锁）
        if (deaths.length > 0) {
            displayDeaths(deaths);
        } else if (knightDied) {
            // 只有骑士上牌死亡
            alert(`⚔️ ${knightFrom}号骑士决斗失败，上牌（骑士）死亡`);
            updateGameDisplay();
        } else {
            alert('白天无人死亡');
        }
        
        // 清除白天状态和魅惑
        gameState.cursedPlayer = null;
        gameState.silencedPlayer = null;
        gameState.currentCharm = null; // 白天结束后清空魅惑
        
        // 更新显示
        updateGameDisplay();
        
        // 准备下一夜
        gameState.night++;
        renderNightActions();
        
        // 恢复按钮
        document.getElementById('settle-night-btn').textContent = '结算本夜';
        document.getElementById('day-phase-btn').style.display = 'block';
        
        // 重置阶段指示器颜色
        const phaseIndicator = document.getElementById('phase-indicator');
        phaseIndicator.style.background = '#667eea';
    } catch (error) {
        console.error('结算白天时出错:', error);
        showErrorAndExport('结算白天时出现错误', error);
    }
}

// 重新开始游戏
function restartGame() {
    stopCloudSync();
    if (confirm('确定要重新开始游戏吗？所有进度将丢失！')) {
        location.reload();
    }
}

// 事件绑定
document.addEventListener('DOMContentLoaded', function() {
    initConfigSection();
    
    // 配置阶段
    document.getElementById('start-assign-btn').onclick = startAssignIdentities;
    document.getElementById('save-preset-btn').onclick = savePreset;
    document.getElementById('load-preset-btn').onclick = loadPreset;
    
    // 分配阶段
    document.getElementById('back-to-config-btn').onclick = () => showSection('config-section');
    document.getElementById('start-game-btn').onclick = startGame;
    
    // 游戏阶段
    document.getElementById('settle-night-btn').onclick = function() {
        if (gameState.isDayPhase) {
            settleDayPhase();
            gameState.isDayPhase = false;
        } else {
            settleNight();
        }
    };
    document.getElementById('reset-night-btn').onclick = resetNightActions;
    document.getElementById('day-phase-btn').onclick = function() {
        gameState.isDayPhase = true;
        enterDayPhase();
    };
    document.getElementById('restart-game-btn').onclick = restartGame;
    
    // 导出和模态框
    document.getElementById('export-state-btn').onclick = exportGameState;
    document.getElementById('close-modal').onclick = closeExportModal;
    
    // 点击模态框外部关闭
    document.getElementById('export-modal').onclick = function(event) {
        if (event.target === this) {
            closeExportModal();
        }
    };
});
