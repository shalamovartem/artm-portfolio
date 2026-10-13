"""Integration test: run only against a disposable DATA_DIR with the QA account."""
import json, urllib.request, urllib.error, http.cookiejar, copy, os
assert os.environ.get("PORTFOLIO_DISPOSABLE_TEST")=="1", "Run only on an isolated QA DATA_DIR; set PORTFOLIO_DISPOSABLE_TEST=1"
base='http://127.0.0.1:5173'
jar=http.cookiejar.CookieJar(); client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def req(path,body=None,method=None):
 r=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Origin':base,'Content-Type':'application/json'})
 try:
  with client.open(r) as res:return res.status,res.read().decode()
 except urllib.error.HTTPError as e:return e.code,e.read().decode()
assert req('/api/auth',{'username':'qa','password':'Preview-Only-2026'},'POST')[0]==200
code,raw=req('/api/document?draft=1');assert code==200
state=json.loads(raw);doc=state['document'];rev=state['revision']
assert 'icon' in doc['cards'][0] and 'description' in doc['sections'][0]
doc['cards'][0]['url']='/?section=photos'
doc['sections'][0]['description']='Проверка редактирования раздела'
root=copy.deepcopy(doc['projects'][0]);root.update(slug='qa-root-page',location='root',title='QA Root Page',browserTitle='QA root title')
doc['projects'].append(root)
code,raw=req('/api/document',{'document':doc,'revision':rev,'action':'draft'},'PUT');assert code==200,raw;rev=json.loads(raw)['revision']
assert req('/qa-root-page?edit=1')[0]==200
assert req('/qa-root-page')[0]==404
assert req('/projects/qa-root-page?edit=1')[0]==404
invalid=copy.deepcopy(doc);invalid['projects'][-1]['slug']='login'
assert req('/api/document',{'document':invalid,'revision':rev,'action':'draft'},'PUT')[0]==400
invalid=copy.deepcopy(doc);invalid['cards'][0]['url']='javascript:alert(1)'
assert req('/api/document',{'document':invalid,'revision':rev,'action':'draft'},'PUT')[0]==400
code,raw=req('/api/document',{'document':doc,'revision':rev,'action':'publish'},'PUT');assert code==200,raw
assert 'QA root title' in req('/qa-root-page')[1]
print('PASS: section URL and description, schema migration, root draft/publish routes, reserved route and unsafe URL rejection')
