/**
 * Vanilla browser loader for third-party sites. `origin` must be the Whisper app base URL (no trailing slash).
 * Widget UI is driven by `GET /api/embed/config?id=<data-id>` — the script tag only needs `data-id`.
 */
export function buildWhisperSdkScript(origin: string): string {
  const W = JSON.stringify(origin.replace(/\/$/, ""));
  return `(function(){
'use strict';
var W=${W};
function scripts(){return document.querySelectorAll('script[src*="api/embed/sdk"]');}
function lastScript(){var n=scripts();return n.length?n[n.length-1]:null;}
function uid(){return'w_'+Math.random().toString(36).slice(2)+Date.now().toString(36);}
function attr(el,k,d){if(!el)return d;var v=el.getAttribute(k);return v==null||v===''?d:v;}
function clampMs(sec){var n=parseInt(String(sec),10);return(n===10||n===30||n===60)?n*1000:30000;}

function clickLabel(el){
  var raw=(el.innerText||el.textContent||'').trim().replace(/\\s+/g,' ');
  if(raw)return raw.slice(0,96);
  var a=el.getAttribute('aria-label');if(a&&a.trim())return a.trim().slice(0,96);
  var t=el.getAttribute('title');if(t&&t.trim())return t.trim().slice(0,96);
  return'';
}
function describeClick(el){
  if(!el)return'Clicked (unknown)';
  var tag=(el.tagName||'').toLowerCase();
  var id=el.id?'#'+el.id:'';
  var lab=clickLabel(el);
  var suf=lab?' — "'+lab.replace(/"/g,"'")+'"':'';
  if(tag==='input'){
    var inp=el;
    var ty=(inp.type||'text').toLowerCase();
    if(ty==='submit'||ty==='button'){
      var vv=(inp.value||'').trim();
      return vv?'Clicked button — "'+vv+'"':'Clicked input[type='+ty+']'+suf;
    }
    return'Clicked '+ty+' input'+suf;
  }
  return'Clicked '+tag+id+suf;
}
function describeInput(el){
  if(!el||(!el.name&&!el.id))return'Input changed';
  var tag=(el.tagName||'').toLowerCase();
  var nm=el.name?' name='+el.name:'';
  var id=el.id?' #'+el.id:'';
  return tag+' field'+nm+id+' (value hidden)';
}

function envSnapshot(){
  var br='Unknown',bv='',ua=navigator.userAgent||'';
  if(/Edg\\//.test(ua)){br='Edge';var e=ua.match(/Edg(?:e)?\\/([0-9.]+)/);bv=e?e[1]:'';}
  else if(ua.indexOf('Chrome')>-1){br='Chrome';var c=ua.match(/Chrome\\/([0-9.]+)/);bv=c?c[1]:'';}
  else if(ua.indexOf('Firefox')>-1){br='Firefox';var f=ua.match(/Firefox\\/([0-9.]+)/);bv=f?f[1]:'';}
  else if(ua.indexOf('Safari')>-1&&!/Chrome/.test(ua)){br='Safari';var s=ua.match(/Version\\/([0-9.]+)/);bv=s?s[1]:'';}
  return{
    browser:br,browserVersion:bv,
    os:navigator.platform||'',
    screenResolution:screen.width+'×'+screen.height,
    windowSize:window.innerWidth+'×'+window.innerHeight,
    language:navigator.language||'',
    timezone:(Intl.DateTimeFormat().resolvedOptions().timeZone||''),
    url:location.href
  };
}

var sc=lastScript();
if(!sc)return;
var apiKey=attr(sc,'data-id','');
if(!apiKey)return;

function boot(cfg){
  if(!cfg||!cfg.ok)return;
  var theme=cfg.theme||'system';
  var accent=cfg.accentColor||'#06b6d4';
  var position=cfg.position||'bottom-right';
  var label=cfg.widgetLabel||'Send Feedback';
  var sessionOn=cfg.sessionTimelineEnabled!==false;
  var deviceMeta=cfg.captureDeviceMetadata!==false;
  var secAttr=cfg.sessionTimelineSeconds!=null?String(cfg.sessionTimelineSeconds):null;
  var windowMs=sessionOn?clampMs(secAttr):0;

  var events=[];
  function prune(now){if(!windowMs)return;var cut=now-windowMs;events=events.filter(function(e){return e.timestamp>=cut;});}
  function push(ev){
    if(!windowMs)return;
    var now=Date.now();prune(now);
    events.push({id:uid(),timestamp:now,type:ev.type,description:ev.description});
  }

  if(sessionOn&&windowMs){
    push({type:'navigation',description:'Page: '+(location.pathname||'/')});
    document.addEventListener('click',function(ev){
      var t=ev.target;if(!t)return;
      var el=t.nodeType===1?t:t.parentElement;if(!el||typeof el.closest!=='function')return;
      if(el.closest('[data-whisper-widget]'))return;
      push({type:'click',description:describeClick(el)});
    },true);
    var debMap=new Map();
    document.addEventListener('input',function(e){
      var t=e.target;if(!t||typeof t.closest!=='function'||!('value'in t))return;
      if(t.closest('[data-whisper-widget]'))return;
      var prev=debMap.get(t);if(prev)clearTimeout(prev);
      debMap.set(t,setTimeout(function(){
        push({type:'input',description:describeInput(t)});
        debMap.delete(t);
      },500));
    },true);
    var lastHref=location.href;
    function nav(reason){
      var h=location.href;if(h===lastHref)return;lastHref=h;
      try{var u=new URL(h);push({type:'navigation',description:reason+' '+u.pathname+(u.search||'')+(u.hash||'')});}
      catch(_){push({type:'navigation',description:reason+' '+h});}
    }
    window.addEventListener('popstate',function(){nav('Navigated to');});
    window.addEventListener('hashchange',function(){nav('Hash changed →');});
    var op=history.pushState,or=history.replaceState;
    history.pushState=function(){op.apply(history,arguments);queueMicrotask(function(){nav('Navigated to');});};
    history.replaceState=function(){or.apply(history,arguments);queueMicrotask(function(){nav('URL updated →');});};
    setInterval(function(){prune(Date.now());},2000);
  }

  function resolveTheme(){
    if(theme==='dark')return'dark';
    if(theme==='light')return'light';
    return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }

  var host=document.createElement('div');
  host.setAttribute('data-whisper-widget','1');
  host.style.cssText='position:fixed;z-index:2147483647;pointer-events:auto;'+((position==='bottom-left')?'left:20px;bottom:20px;':'right:20px;bottom:20px;');
  document.body.appendChild(host);
  var root=host.attachShadow({mode:'open'});
  var dark=resolveTheme()==='dark';
  var bg=dark?'#0f172a':'#ffffff';
  var fg=dark?'#f8fafc':'#0f172a';
  var sub=dark?'#94a3b8':'#64748b';
  var bor=dark?'#334155':'#e2e8f0';

  var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');};
  var css='.p{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;}'+
  '.p,.p *{box-sizing:border-box;}'+
  '.btn{height:44px;min-width:44px;max-width:min(240px,calc(100vw - 40px));padding:0 14px;border-radius:9999px;border:none;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'+
  '.panel{position:absolute;bottom:72px;width:min(380px,calc(100vw - 40px));border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,.2);overflow:hidden;border:1px solid '+bor+';background:'+bg+';color:'+fg+';display:none;flex-direction:column;max-height:min(520px,80vh);}'+
  '.panel.open{display:flex;}'+
  (position==='bottom-left'?'.panel{left:0;}':'.panel{right:0;}')+
  '.hd{padding:14px 16px;border-bottom:1px solid '+bor+';display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:14px;}'+
  '.bd{padding:16px;flex:1;overflow:auto;}'+
  '.ta{width:100%;max-width:100%;min-height:100px;padding:10px 12px;border-radius:10px;border:1px solid '+bor+';background:transparent;color:'+fg+';font-size:14px;resize:vertical;}'+
  '.ft{padding:12px 16px;border-top:1px solid '+bor+';display:flex;gap:8px;justify-content:flex-end;}'+
  '.b{padding:8px 16px;border-radius:10px;border:none;font-weight:600;cursor:pointer;font-size:13px;}'+
  '.b2{background:'+bor+';color:'+fg+';}'+
  '.err{font-size:12px;color:#b91c1c;margin-top:8px;}'+
  '.ok{font-size:12px;color:#047857;margin-top:8px;}';

  root.innerHTML='<style>'+css+'</style><div class="p" style="position:relative">'+
  '<div class="panel" id="wp"><div class="hd"><span>Whisper</span><button type="button" class="b b2" id="wx" aria-label="Close">×</button></div>'+
  '<div class="bd"><p style="margin:0 0 10px;font-size:13px;color:'+sub+'">Describe what went wrong. Recent activity on this page is included.</p>'+
  '<textarea class="ta" id="wt" placeholder="What happened?" maxlength="8000"></textarea><div class="err" id="we" style="display:none"></div><div class="ok" id="wo" style="display:none"></div></div>'+
  '<div class="ft"><button type="button" class="b b2" id="wc">Cancel</button><button type="button" class="b" id="ws" style="background:'+accent+';color:#fff">Send</button></div></div>'+
  '<button type="button" class="btn" id="wf" style="background:'+accent+'" aria-label="'+esc(label)+'">'+esc(label||'W')+'</button></div>';

  var fab=root.getElementById('wf');
  var panel=root.getElementById('wp');
  var ta=root.getElementById('wt');
  var send=root.getElementById('ws');
  var cancel=root.getElementById('wc');
  var close=root.getElementById('wx');
  var err=root.getElementById('we');
  var ok=root.getElementById('wo');

  function openP(){panel.classList.add('open');ok.style.display='none';ta.focus();}
  function closeP(){panel.classList.remove('open');err.style.display='none';ok.style.display='none';}
  fab.addEventListener('click',function(){panel.classList.contains('open')?closeP():openP();});
  close.addEventListener('click',closeP);
  cancel.addEventListener('click',closeP);

  send.addEventListener('click',function(){
    var msg=(ta.value||'').trim();
    if(msg.length<3){err.textContent='Please enter at least 3 characters.';err.style.display='block';ok.style.display='none';return;}
    err.style.display='none';ok.style.display='none';
    send.disabled=true;var prevTxt=send.textContent;send.textContent='Sending…';
    var ctx=deviceMeta?envSnapshot():{browser:'',browserVersion:'',os:'',screenResolution:'',windowSize:'',language:'',timezone:'',url:location.href};
    fetch(W+'/api/widget/feedback',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Whisper-Key':apiKey},
      body:JSON.stringify({message:msg,context:ctx,events:sessionOn?events:[],receiptAt:Date.now()})
    }).then(function(r){
      return r.json().then(function(j){return{ok:r.ok,status:r.status,j:j};});
    }).then(function(x){
      send.disabled=false;send.textContent=prevTxt;
      if(x.ok&&x.j&&x.j.ok){ta.value='';ok.textContent='Sent. Thank you!';ok.style.display='block';window.setTimeout(function(){closeP();ok.style.display='none';},1400);}
      else{err.textContent=(x.j&&x.j.error)||'Could not send. Try again.';err.style.display='block';}
    }).catch(function(){
      send.disabled=false;send.textContent=prevTxt;
      err.textContent='Network error. Try again.';err.style.display='block';
    });
  });
}

fetch(W+'/api/embed/config?id='+encodeURIComponent(apiKey)+'&v='+Date.now(),{credentials:'omit',cache:'no-store'})
  .then(function(r){return r.json().catch(function(){return null});})
  .then(function(cfg){if(cfg&&cfg.ok)boot(cfg);});
})();`;
}
