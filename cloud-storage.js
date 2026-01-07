// 云端存储适配层（GitHub Pages + LeanCloud）
// 目标：不重写规则，只把“本地存储/同步”替换成“云端存储/同步”。

(function () {
  const cfg = window.LEANCLOUD_CONFIG;
  if (!window.AV || !cfg || !cfg.appId || !cfg.appKey || !cfg.serverURL) {
    console.warn('[cloud] LeanCloud 未配置或 AV SDK 未加载，将无法云端同步。');
    window.CloudStore = null;
    return;
  }

  // 初始化（重复调用也安全）
  try {
    window.AV.init({ appId: cfg.appId, appKey: cfg.appKey, serverURL: cfg.serverURL });
  } catch (e) {
    // AV.init 可能已被调用过
  }

  const GameSession = window.AV.Object.extend('GameSession');

  async function getSessionObject(sessionId) {
    const q = new window.AV.Query(GameSession);
    q.equalTo('sessionId', sessionId);
    return await q.first();
  }

  async function upsertSession(sessionId, data) {
    let obj = await getSessionObject(sessionId);
    if (!obj) {
      obj = new GameSession();
      obj.set('sessionId', sessionId);
    }
    obj.set('data', data);
    obj.set('updatedAtMs', Date.now());
    await obj.save();
    return obj;
  }

  async function loadSessionData(sessionId) {
    const obj = await getSessionObject(sessionId);
    return obj ? obj.get('data') : null;
  }

  // 只更新 selections，避免覆盖其它字段（降低并发冲突概率）
  async function updatePlayerSelection(sessionId, playerNumber, selection) {
    const obj = await getSessionObject(sessionId);
    if (!obj) throw new Error('SESSION_NOT_FOUND');
    const data = obj.get('data') || {};
    data.selections = data.selections || {};
    data.selections[playerNumber] = selection;
    data.updatedAtMs = Date.now();
    obj.set('data', data);
    obj.set('updatedAtMs', Date.now());
    await obj.save();
    return data;
  }

  window.CloudStore = {
    upsertSession,
    loadSessionData,
    updatePlayerSelection
  };
})();
