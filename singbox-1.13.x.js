const { type, name } = $arguments;
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
};

let compatible = false;

// 1. 读取并清理模板中的注释，使其成为合法 JSON
let rawConfig = $files[0];
let cleanConfig = rawConfig.replace(/\/\/.*$/gm, ''); // 移除单行注释
let config = JSON.parse(cleanConfig);

// 2. 获取代理节点列表
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

// 3. 将节点对象追加到 outbounds 末尾（全部节点配置）
config.outbounds.push(...proxies);

// 4. 获取所有节点 tag
const allTags = getTags(proxies);
const cryptoTags = getTags(proxies, /澳|门|macau|macao|🇲🇴|日|jp|japan|🇯🇵|台|tw|taiwan|🇹🇼|韩|kr|korea|🇰🇷/i);

// 5. 填充各 outbounds 的节点列表
config.outbounds.forEach(outbound => {
  if (outbound.tag === '🚀 PROXY') {
    outbound.outbounds = ['⚡ AUTO', ...allTags];
  } else if (outbound.tag === '⚡ AUTO') {
    outbound.outbounds = allTags;
  } else if (outbound.tag === '🪙 CRYPTO') {
    outbound.outbounds = cryptoTags;
  }
});

// 6. 兼容处理：如果某个 outbounds 的 outbounds 数组为空，添加一个 COMPATIBLE 直连
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound);
      compatible = true;
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// 7. 输出最终配置
$content = JSON.stringify(config, null, 2);

// 工具函数：根据正则过滤节点 tag，若不传正则则返回全部 tag
function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}