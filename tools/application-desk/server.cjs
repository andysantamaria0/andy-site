const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT || 3231);
const staticFiles = new Set(['index.html','styles.css','pilot.css','pilot.js']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
  if(name==='config.js'||name==='opportunities.js'){
    const stem=name.slice(0,-3),local=stem+'.local.js';
    name=fs.existsSync(path.join(__dirname,local))?local:stem+'.example.js';
  }else if(!staticFiles.has(name)){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,name),(err,data)=>{
    if(err){res.writeHead(500);res.end('Unable to load local asset');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end(req.method==='HEAD'?undefined:data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`Application Desk: http://127.0.0.1:${port}`));
