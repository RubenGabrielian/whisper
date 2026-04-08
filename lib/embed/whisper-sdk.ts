export function buildWhisperSdkScript(origin: string): string {
  const W = JSON.stringify(origin.replace(/\/$/, ""));
  return `(function(){
'use strict';

var W=${W};

/* =========================
   EARLY CONSOLE CAPTURE (FIXED)
========================= */
if(!window.__whisper_console_patched){
  window.__whisper_console_patched = true;

  var cons = [];

  function safeStringify(v){
    if(v==null)return '';
    if(typeof v==='string')return v;
    if(typeof v==='number'||typeof v==='boolean')return String(v);

    if(v instanceof Error){
      return (v.name||'Error')+': '+(v.message||'')+(v.stack?('\\n'+v.stack):'');
    }

    try{
      var seen=new WeakSet();
      return JSON.stringify(v,function(_k,val){
        if(val&&typeof val==='object'){
          if(seen.has(val))return '[Circular]';
          seen.add(val);
        }
        return val;
      });
    }catch(_){
      try{return String(v);}catch(__){return '[Unserializable]';}
    }
  }

  function argsToMessage(args){
    try{
      return Array.prototype.map.call(args,function(a){return safeStringify(a);}).join(' ');
    }catch(_){return '';}
  }

  function pushCons(type,args,stack){
    var now=Date.now();
    var msg=argsToMessage(args);

    var entry={
      type:type,
      message:String(msg||'').slice(0,4000),
      timestamp:now
    };

    if(stack)entry.stack=String(stack).slice(0,6000);
    else{
      try{
        for(var i=0;i<args.length;i++){
          var a=args[i];
          if(a instanceof Error && a.stack){
            entry.stack=String(a.stack).slice(0,6000);
            break;
          }
        }
      }catch(_){}
    }

    cons.push(entry);
    if(cons.length>100)cons=cons.slice(cons.length-100);
  }

  var orig={
    log:console.log,
    warn:console.warn,
    error:console.error,
    info:console.info,
    debug:console.debug
  };

  function wrap(type,key){
    return function(){
      try{pushCons(type,arguments);}catch(_){}
      return orig[key].apply(console,arguments);
    };
  }

  console.log=wrap('log','log');
  console.warn=wrap('warn','warn');
  console.error=wrap('error','error');
  console.info=wrap('info','info');
  console.debug=wrap('debug','debug');

  window.addEventListener('error',function(e){
    try{
      var msg=(e&&e.message)?e.message:'Uncaught error';
      pushCons('error',[msg],(e&&e.error&&e.error.stack)?e.error.stack:null);
    }catch(_){}
  });

  window.addEventListener('unhandledrejection',function(e){
    try{
      var r=e&&e.reason;
      var st=(r&&r.stack)?r.stack:null;
      var msg=(r&&r.message)?r.message:safeStringify(r);
      pushCons('error',['Unhandled rejection: '+msg],st);
    }catch(_){}
  });

  window.getConsoleLogs=function(){return cons.slice();}
}

/* =========================
   ORIGINAL SDK CONTINUES
========================= */

function scripts(){return document.querySelectorAll('script[src*="api/embed/sdk"]');}
function lastScript(){var n=scripts();return n.length?n[n.length-1]:null;}
function uid(){return'w_'+Math.random().toString(36).slice(2)+Date.now().toString(36);}
function attr(el,k,d){if(!el)return d;var v=el.getAttribute(k);return v==null||v===''?d:v;}
function clampMs(sec){var n=parseInt(String(sec),10);return(n===10||n===30||n===60)?n*1000:30000;}

var sc=lastScript();
if(!sc)return;

var apiKey=attr(sc,'data-id','');
if(!apiKey)return;

/* =========================
   BOOT (UNCHANGED EXCEPT FIX)
========================= */

function boot(cfg){

  cfg = cfg || {}; // ✅ FIX: always run

  var captureConsole = cfg.captureConsole !== false;

  var events=[];
  var net=[];

  function getConsoleLogs(){
    if(!captureConsole) return [];
    try{return window.getConsoleLogs?window.getConsoleLogs():[];}catch(_){return [];}
  }

  /* ===== UI SEND ===== */

  function send(msg){
    fetch(W+'/api/widget/feedback',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Whisper-Key':apiKey
      },
      body:JSON.stringify({
        message:msg,
        console:getConsoleLogs(),
        events:events,
        network:net,
        url:location.href,
        userAgent:navigator.userAgent
      })
    });
  }

  /* minimal button */

  var btn=document.createElement('button');
  btn.innerText='Report Bug';
  btn.style.position='fixed';
  btn.style.bottom='20px';
  btn.style.right='20px';
  btn.style.zIndex='999999';

  document.body.appendChild(btn);

  btn.onclick=function(){
    var msg=prompt('What happened?');
    if(!msg)return;
    send(msg);
  };
}

/* =========================
   FETCH CONFIG (FIXED)
========================= */

fetch(W+'/api/embed/config?id='+encodeURIComponent(apiKey)+'&v='+Date.now(),{
  credentials:'omit',
  cache:'no-store'
})
.then(function(r){
  return r.json().catch(function(){return null});
})
.then(function(cfg){
  boot(cfg); // ✅ FIX: always boot
})
.catch(function(){
  boot({}); // ✅ FIX: fallback
});

})();`;
}