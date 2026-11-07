import json, os, urllib.request

req = urllib.request.Request(
    f'https://api.github.com/gists/{os.environ["GIST_ID"]}',
    headers={
        'Authorization': f'token {os.environ["PAT"]}',
        'User-Agent': 'sync/1.0',
        'Accept': 'application/vnd.github+json'
    }
)
with urllib.request.urlopen(req) as r:
    files = json.load(r).get('files', {})

os.makedirs('data', exist_ok=True)
out = {'files': {}}
for name, f in files.items():
    content = f.get('content', '')
    out['files'][name] = {'content': content}
    with open(f'data/{name}.json', 'w') as fp:
        json.dump({'content': content}, fp)

with open('data/all.json', 'w') as fp:
    json.dump(out, fp)

print(f'synced {len(files)} files')
