// Shared "called" status for Storm Maps. No tokens: reads called.json, writes via prefilled GitHub issues.
(function(){
  var REPO='ArmourRoofCo/Storm-Maps', LS='stormmaps_pending';
  var called={}, pending={};
  try{pending=JSON.parse(localStorage.getItem(LS)||'{}');}catch(e){pending={};}
  function savePending(){try{localStorage.setItem(LS,JSON.stringify(pending));}catch(e){}}
  function findMap(){for(var k in window){try{if(k.indexOf('map_')===0&&window[k]&&window[k].eachLayer)return window[k];}catch(e){}}return null;}
  function leadOf(layer){
    if(!layer.getPopup||!layer.getPopup())return null;
    var c=layer.getPopup().getContent();var el;
    if(typeof c==='string'){el=document.createElement('div');el.innerHTML=c;}else el=c;
    var d=el&&el.querySelector?el.querySelector('.lead'):null;
    return d?{id:d.getAttribute('data-lead-id'),label:d.getAttribute('data-label')}:null;
  }
  var markers=[];
  function collect(map){
    function walk(l){
      if(l.getLayers&&!l.getPopup){l.getLayers().forEach(walk);return;}
      var ld=leadOf(l);if(ld){l._lead=ld;l._orig=l.options&&{color:l.options.color,fillColor:l.options.fillColor};markers.push(l);}
    }
    map.eachLayer(function(l){if(l.getLayers)walk(l);else walk(l);});
  }
  function state(id){if(called[id])return 'called';if(pending[id])return pending[id].action==='UNCALLED'?'pending-undo':'pending';return '';}
  function style(l){
    var s=state(l._lead.id);
    if(l.setStyle){
      if(s==='called'||s==='pending')l.setStyle({color:'#777',fillColor:'#aaa'});
      else if(l._orig)l.setStyle(l._orig);
    }
    if(l.unbindTooltip){l.unbindTooltip();if(s==='called'||s==='pending')l.bindTooltip(s==='called'?'\u2714 called':'\u2714 called (pending)');}
  }
  function statusText(id){
    var c=called[id];
    if(c)return '\u2714 Called by '+(c.called_by||'?')+' on '+(c.called_at||'').slice(0,10)+(c.notes?' \u2013 '+c.notes:'');
    if(pending[id])return pending[id].action==='UNCALLED'?'Undo pending (waiting for GitHub)':'\u2714 Called (pending, waiting for GitHub)';
    return 'Not called yet';
  }
  function openIssue(action,id,label){
    var who=prompt('Your name (who made the call)?','');if(who===null)return;
    var notes=action==='CALLED'?(prompt('Notes (optional)?','')||''):'';
    var body='lead_id: '+id+'\nlabel: '+label+'\ncaller: '+who+'\nnotes: '+notes+'\n';
    var url='https://github.com/'+REPO+'/issues/new?labels=called&title='+encodeURIComponent(action+': '+id)+'&body='+encodeURIComponent(body);
    window.open(url,'_blank');
    pending[id]={action:action,at:new Date().toISOString(),by:who};savePending();refresh();
  }
  function wirePopup(e){
    var root=e.popup.getElement();if(!root)return;var d=root.querySelector('.lead');if(!d)return;
    var id=d.getAttribute('data-lead-id'),label=d.getAttribute('data-label');
    var st=d.querySelector('.callstat'),b=d.querySelector('.callbtn');
    st.textContent=statusText(id);
    var isCalled=!!called[id]||(pending[id]&&pending[id].action==='CALLED');
    b.textContent=isCalled?'Undo called':'Mark as called';
    b.onclick=function(){openIssue(isCalled?'UNCALLED':'CALLED',id,label);st.textContent=statusText(id);};
  }
  var counter;
  function refresh(){
    // drop pending entries that the server already reflects
    Object.keys(pending).forEach(function(id){var p=pending[id];if((p.action==='CALLED'&&called[id])||(p.action==='UNCALLED'&&!called[id]&&p._seen)){delete pending[id];}});
    savePending();markers.forEach(style);
    if(counter){var ids={};markers.forEach(function(l){var s=state(l._lead.id);if(s==='called'||s==='pending')ids[l._lead.id]=1;});counter.textContent=Object.keys(ids).length+' called';}
  }
  function load(){
    fetch('called.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():{};}).catch(function(){return {};})
    .then(function(j){called=j||{};Object.keys(pending).forEach(function(id){pending[id]._seen=1;});refresh();});
  }
  window.addEventListener('load',function(){
    var map=findMap();if(!map)return;collect(map);
    counter=document.createElement('div');
    counter.style.cssText='position:fixed;top:10px;left:60px;z-index:9999;background:#fff;border:1px solid #888;padding:4px 8px;font:bold 13px sans-serif';
    counter.title='Gray markers have been called';document.body.appendChild(counter);
    map.on('popupopen',wirePopup);load();setInterval(load,60000);
  });
})();
