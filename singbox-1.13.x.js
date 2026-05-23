const { type, name } = $arguments;
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
};

let compatible = false;

// 1. 读取并移除单行注释（ // 开头直到行尾 ），保留合法 JSON
let rawConfig = $files[0];
let cleanConfig = rawConfig.replace(/\/\/.*$/gm, '');
let config = JSON.parse(cleanConfig);

// 2. 获取所有代理节点
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

// 3. 净化节点 tag：移除 ASCII 控制字符 (0x00-0x1F) 和多余空格
function sanitizeTag(tag) {
  return tag.replace(/[\x00-\x1F]/g, '').trim();
}
proxies.forEach(p => {
  p.tag = sanitizeTag(p.tag);
});

// 4. 追加所有节点到 outbounds
config.outbounds.push(...proxies);

// 5. 生成各类节点分组所需的标签列表
const allTags = getTags(proxies);
// 加密币分组：澳门、日本、台湾、韩国、新加坡等（可按需调整）
const cryptoTags = getTags(proxies, /澳|门|macau|macao|🇲🇴|日|jp|japan|🇯🇵|台|tw|taiwan|🇹🇼|韩|kr|korea|🇰🇷|新|sg|singapore|🇸🇬/i);

// 6. 自动填充 outbounds 中的节点列表
config.outbounds.forEach(outbound => {
  if (outbound.tag === '🚀 PROXY') {
    outbound.outbounds = ['⚡ AUTO', ...allTags];
  } else if (outbound.tag === '⚡ AUTO') {
    outbound.outbounds = allTags;
  } else if (outbound.tag === '🪙 CRYPTO') {
    outbound.outbounds = cryptoTags;
  }
});

// 7. 空数组兜底：若某分组无节点，自动插入 COMPATIBLE 直连
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound);
      compatible = true;
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// 8. 输出，确保所有字符串安全
$content = JSON.stringify(config, null, 2);

// 工具函数
function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}
