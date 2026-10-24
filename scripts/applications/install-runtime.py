"""Install an immutable, reviewed Application Desk release; preserve credentials/schedules."""
import hashlib,json,os,shutil,subprocess,time
from pathlib import Path
SOURCE=Path(__file__).resolve().parents[2]
RUNTIME=Path.home()/'Library/Application Support/Application Desk'
FILES=['lib/applications/core.mjs','lib/applications/knit.mjs','lib/applications/forms.mjs','lib/applications/workflow.mjs','scripts/applications/browser.mjs','scripts/applications/prepare.mjs','scripts/applications/worker-v2.mjs']
def main():
    if not (RUNTIME/'config.json').exists():raise SystemExit('Existing Application Desk configuration is required')
    dirty=subprocess.check_output(['git','status','--porcelain','--']+FILES,cwd=SOURCE,text=True)
    if dirty.strip():raise SystemExit('Commit the tested worker source before installing')
    revision=subprocess.check_output(['git','rev-parse','--short=12','HEAD'],cwd=SOURCE,text=True).strip()
    release=RUNTIME/'releases'/revision
    if release.exists():raise SystemExit('This release is already staged; inspect it before reinstalling')
    release.mkdir(parents=True,mode=0o700)
    manifest={'revision':revision,'installedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'files':{}}
    for name in FILES:
        src=SOURCE/name;dst=release/name;dst.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        content=src.read_bytes();dst.write_bytes(content);dst.chmod(0o600);manifest['files'][name]=hashlib.sha256(content).hexdigest()
    for name in ['playwright','playwright-core']:
        src=SOURCE/'node_modules'/name
        version=json.loads((src/'package.json').read_text())['version']
        if version!='1.64.1':raise SystemExit('Unexpected Playwright version; test the runtime version before installing')
        shutil.copytree(src.resolve(),release/'node_modules'/name)
        manifest[name]=version
    (release/'manifest.json').write_text(json.dumps(manifest,indent=2));(release/'manifest.json').chmod(0o600)
    backups=RUNTIME/'release-backups';backups.mkdir(exist_ok=True,mode=0o700)
    for name in ['worker.cjs','research.py','research.schema.json']:
        if (RUNTIME/name).exists():shutil.copy2(RUNTIME/name,backups/(revision+'-'+name))
    link=RUNTIME/'current.next';link.symlink_to(release);os.replace(link,RUNTIME/'current')
    bootstrap="const {pathToFileURL}=require('node:url');const path=require('node:path');import(pathToFileURL(path.join(__dirname,'current/scripts/applications/worker-v2.mjs')).href).then(m=>m.main()).catch(e=>{console.error(JSON.stringify({at:new Date().toISOString(),stage:'startup',error:e.message}));process.exitCode=1});\n"
    for name,content in [('worker.cjs',bootstrap.encode()),('research.py',(SOURCE/'scripts/applications/research.py').read_bytes()),('research.schema.json',(SOURCE/'scripts/applications/research.schema.json').read_bytes())]:
        temp=RUNTIME/(name+'.next');temp.write_bytes(content);temp.chmod(0o600);os.replace(temp,RUNTIME/name)
    print(json.dumps({'installed':revision,'engine':'applications-2.0.0','playwright':manifest['playwright'],'credentialsChanged':False,'schedulesChanged':False,'applicationsSubmitted':False}))
if __name__=='__main__':main()
