// VRF for mangafire.to
// Ported from CoorenLabs/CoorenLabs (Apache-2.0), credits: keiyoushi/extensions-source PR #10988

var _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function _b64Dec(s) {
  s = s.replace(/[^A-Za-z0-9+/]/g, '');
  var out = '', buf = 0, bits = 0;
  for (var i = 0; i < s.length; i++) {
    buf = (buf << 6) | _B64.indexOf(s[i]);
    bits += 6;
    if (bits >= 8) { bits -= 8; out += String.fromCharCode((buf >> bits) & 0xff); }
  }
  return out;
}

function _b64Enc(s) {
  var out = '', i = 0;
  while (i < s.length) {
    var b0 = s.charCodeAt(i++) & 0xff;
    var b1 = i < s.length ? s.charCodeAt(i++) & 0xff : 0;
    var b2 = i < s.length ? s.charCodeAt(i++) & 0xff : 0;
    var n = (b0 << 16) | (b1 << 8) | b2;
    out += _B64[(n >> 18) & 63] + _B64[(n >> 12) & 63] + _B64[(n >> 6) & 63] + _B64[n & 63];
  }
  var pad = s.length % 3;
  if (pad === 1) out = out.slice(0, -2) + '==';
  else if (pad === 2) out = out.slice(0, -1) + '=';
  return out;
}

var _VRF_C = {
  rc4Keys: [
    'FgxyJUQDPUGSzwbAq/ToWn4/e8jYzvabE+dLMb1XU1o=',
    'CQx3CLwswJAnM1VxOqX+y+f3eUns03ulxv8Z+0gUyik=',
    'fAS+otFLkKsKAJzu3yU+rGOlbbFVq+u+LaS6+s1eCJs=',
    'Oy45fQVK9kq9019+VysXVlz1F9S1YwYKgXyzGlZrijo=',
    'aoDIdXezm2l3HrcnQdkPJTDT8+W6mcl2/02ewBHfPzg=',
  ],
  seeds: [
    'yH6MXnMEcDVWO/9a6P9W92BAh1eRLVFxFlWTHUqQ474=',
    'RK7y4dZ0azs9Uqz+bbFB46Bx2K9EHg74ndxknY9uknA=',
    'rqr9HeTQOg8TlFiIGZpJaxcvAaKHwMwrkqojJCpcvoc=',
    '/4GPpmZXYpn5RpkP7FC/dt8SXz7W30nUZTe8wb+3xmU=',
    'wsSGSBXKWA9q1oDJpjtJddVxH+evCfL5SO9HZnUDFU8=',
  ],
  pfxKeys: ['l9PavRg=', 'Ml2v7ag1Jg==', 'i/Va0UxrbMo=', 'WFjKAHGEkQM=', '5Rr27rWd'],
};

function _vrfBytes(s) {
  var a = [];
  for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 0xff);
  return a;
}

function _vrfStr(a) {
  return a.map(function(b) { return String.fromCharCode(b & 0xff); }).join('');
}

function _rc4(key, data) {
  var s = [], j = 0, t, i;
  for (i = 0; i < 256; i++) s[i] = i;
  for (i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
    t = s[i]; s[i] = s[j]; s[j] = t;
  }
  var out = [], x = 0, y = 0;
  for (i = 0; i < data.length; i++) {
    x = (x + 1) & 0xff;
    y = (y + s[x]) & 0xff;
    t = s[x]; s[x] = s[y]; s[y] = t;
    out.push(((data[i] || 0) ^ s[(s[x] + s[y]) & 0xff]) & 0xff);
  }
  return out;
}

function _xform(data, seed, pfx, ops) {
  var out = [];
  for (var i = 0; i < data.length; i++) {
    if (i < pfx.length) out.push(pfx[i] || 0);
    var op = ops[i % 10];
    if (op) out.push(op(((data[i] || 0) ^ (seed[i % 32] || 0)) & 0xff) & 0xff);
  }
  return out;
}

function _add(n) { return function(c) { return (c + n) & 0xff; }; }
function _sub(n) { return function(c) { return (c - n + 256) & 0xff; }; }
function _rotl(n) { return function(c) { return ((c << n) | (c >>> (8 - n))) & 0xff; }; }
function _rotr(n) { return function(c) { return ((c >>> n) | (c << (8 - n))) & 0xff; }; }

function _vrf(input) {
  var sc = [
    [_sub(223),_rotr(4),_rotr(4),_add(234),_rotr(7),_rotr(2),_rotr(7),_sub(223),_rotr(7),_rotr(6)],
    [_add(19),_rotr(7),_add(19),_rotr(6),_add(19),_rotr(1),_add(19),_rotr(6),_rotr(7),_rotr(4)],
    [_sub(223),_rotr(1),_add(19),_sub(223),_rotl(2),_sub(223),_add(19),_rotl(1),_rotl(2),_rotl(1)],
    [_add(19),_rotl(1),_rotl(1),_rotr(1),_add(234),_rotl(1),_sub(223),_rotl(6),_rotl(4),_rotl(1)],
    [_rotr(1),_rotl(1),_rotl(6),_rotr(1),_rotl(2),_rotr(4),_rotl(1),_rotl(1),_sub(223),_rotl(2)],
  ];
  var b = _vrfBytes(encodeURIComponent(input));
  for (var i = 0; i < 5; i++) {
    b = _rc4(_b64Dec(_VRF_C.rc4Keys[i]), b);
    var p = _vrfBytes(_b64Dec(_VRF_C.pfxKeys[i]));
    b = _xform(b, _vrfBytes(_b64Dec(_VRF_C.seeds[i])), p, sc[i]);
  }
  return _b64Enc(_vrfStr(b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function _decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'");
}

const source = {
  id: 'mangafire',
  name: 'MangaFire',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  searchRequest(query, page, lang) {
    var base = 'https://mangafire.to/filter?language%5B%5D=' + encodeURIComponent(lang) + '&page=' + page;
    if (query) {
      base += '&keyword=' + encodeURIComponent(query) + '&vrf=' + encodeURIComponent(_vrf(query));
    }
    return { url: base };
  },

  detailRequest(mangaId) {
    return { url: 'https://mangafire.to/manga/' + mangaId };
  },

  chaptersRequest(mangaId) {
    var numId = mangaId.split('.').pop();
    var vrfKey = numId + '@chapter@en';
    return {
      url: 'https://mangafire.to/ajax/read/' + numId + '/chapter/en?vrf=' + encodeURIComponent(_vrf(vrfKey)),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    };
  },

  pagesRequest(chapterId) {
    return {
      url: 'https://mangafire.to/ajax/read/chapter/' + chapterId + '?vrf=' + encodeURIComponent(_vrf('chapter@' + chapterId)),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    };
  },
  parseSearch(body) {
    var results = [];
    var parts = body.split('<div class="inner">');
    for (var i = 1; i < parts.length; i++) {
      var part = parts[i];
      if (part.indexOf('href="/manga/') === -1) continue;
      var idMatch = part.match(/href="\/manga\/([^"]+)"/);
      var imgMatch = part.match(/<img src="([^"]+)"/);
      var titleMatch = part.match(/href="\/manga\/[^"]+">([^<]+)<\/a>/);
      if (!idMatch || !titleMatch) continue;
      results.push({
        id: idMatch[1],
        title: _decodeHtml(titleMatch[1]),
        coverUrl: imgMatch ? imgMatch[1] : null,
      });
    }
    return JSON.stringify(results);
  },
  parseDetail(body) {
    var idMatch = body.match(/<link rel="canonical" href="https:\/\/mangafire\.to\/manga\/([^"]+)">/);
    var titleMatch = body.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var title = titleMatch ? _decodeHtml(titleMatch[1]) : null;

    var synopsis = '';
    var synIdx = body.indexOf('id="synopsis"');
    if (synIdx >= 0) {
      var mcStart = body.indexOf('class="modal-content', synIdx);
      var gt = body.indexOf('>', mcStart);
      var block = body.slice(gt + 1, gt + 3000);
      synopsis = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    var author = null;
    var authIdx = body.indexOf('Author:</span>');
    if (authIdx >= 0) {
      var authMatch = body.slice(authIdx, authIdx + 300).match(/<a[^>]+>([^<]+)<\/a>/);
      if (authMatch) author = authMatch[1];
    }

    var status = 'unknown';
    var infoIdx = body.indexOf('<div class="info">');
    if (infoIdx >= 0) {
      var pMatch = body.slice(infoIdx, infoIdx + 200).match(/<p>([^<]+)<\/p>/);
      if (pMatch) {
        var s = pMatch[1].toLowerCase().trim();
        if (s === 'completed') status = 'completed';
        else if (s === 'releasing') status = 'ongoing';
        else if (s === 'on_hiatus') status = 'hiatus';
        else if (s === 'discontinued') status = 'cancelled';
      }
    }

    var tags = [];
    var genreIdx = body.indexOf('Genres:</span>');
    if (genreIdx >= 0) {
      var genreBlock = body.slice(genreIdx, genreIdx + 500);
      var tagRe = /<a href="\/genre\/[^"]+">([^<]+)<\/a>/g;
      var tm;
      while ((tm = tagRe.exec(genreBlock)) !== null) tags.push(tm[1]);
    }

    return JSON.stringify({
      id: idMatch ? idMatch[1] : null,
      title: title,
      synopsis: synopsis,
      author: author,
      status: status,
      tags: tags,
    });
  },
  parseChapters(body) {
    var html = JSON.parse(body).result.html;
    var chapters = [];
    var liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/g;
    var lm;
    while ((lm = liRe.exec(html)) !== null) {
      var li = lm[1];
      var idMatch = li.match(/data-id="([^"]+)"/);
      var numMatch = li.match(/data-number="([^"]+)"/);
      var titleMatch = li.match(/\btitle="([^"]*)"/);
      if (!idMatch || !numMatch) continue;
      chapters.push({
        id: idMatch[1],
        number: numMatch[1],
        title: titleMatch ? _decodeHtml(titleMatch[1]) : '',
        lang: 'en',
        date: '',
      });
    }
    return JSON.stringify(chapters);
  },
  parsePages(body) {
    var images = JSON.parse(body).result.images;
    var urls = images.map(function(img) {
      var url = img[0];
      var offset = img[2];
      return offset > 0 ? url + '#scrambled_' + offset : url;
    });
    return JSON.stringify(urls);
  },
};
