const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

config.outbounds.push(...proxies)

config.outbounds.map(i => {
  if (['⚡ AUTO', '🚀 PROXY'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (['🪙 CRYPTO'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan|🇹🇼|日本|jp|japan|🇯🇵|韩国|kr|korea|🇰🇷|澳门|mo|macau|🇲🇴/i))
  }
})

config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});


function sanitize(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/[\x00-\x1F]/g, '')
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize)
  }
  if (obj && typeof obj === 'object') {
    for (let k in obj) {
      obj[k] = sanitize(obj[k])
    }
  }
  return obj
}
config = sanitize(config)


$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
