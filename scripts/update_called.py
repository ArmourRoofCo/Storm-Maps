"""Apply a CALLED:/UNCALLED: issue to called.json. Env: ISSUE_TITLE, ISSUE_BODY, ISSUE_USER, ISSUE_NUMBER, ISSUE_URL, ISSUE_CREATED."""
import json,os,re,sys
t=os.environ['ISSUE_TITLE'].strip();b=os.environ.get('ISSUE_BODY') or ''
m=re.match(r'^(CALLED|UNCALLED):\s*(L[0-9a-f]{10})\s*$',t)
if not m: print('bad title'); sys.exit(2)
act,lid=m.groups()
def f(k):
  x=re.search(rf'^{k}:\s*(.*)$',b,re.M);return x.group(1).strip()[:300] if x else ''
d=json.load(open('called.json'))
if act=='CALLED':
  d[lid]={'called_by':f('caller') or os.environ['ISSUE_USER'],'called_at':os.environ['ISSUE_CREATED'],'notes':f('notes'),'label':f('label'),'issue':os.environ['ISSUE_URL'],'github_user':os.environ['ISSUE_USER']}
else: d.pop(lid,None)
json.dump(d,open('called.json','w'),indent=1,sort_keys=True);open('called.json','a').write('\n')
print(act,lid)
