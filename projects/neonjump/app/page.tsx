import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set');
}

const THEME = {
  brand: '#7C3AED',
  brand2: '#A78BFA',
  bg: '#05050B',
  bg2: '#120827',
  surface: 'rgba(15,10,35,.86)',
  text: '#F8FAFC',
  muted: '#DDD6FE',
  coin: '#FACC15',
  success: '#22C55E',
  danger: '#FB7185',
  cyan: '#67E8F9',
  focus: '#FFFFFF'
} as const;

const pageVars = {
  '--brand': THEME.brand,
  '--brand-2': THEME.brand2,
  '--bg': THEME.bg,
  '--bg-2': THEME.bg2,
  '--surface': THEME.surface,
  '--surface-soft': 'rgba(255,255,255,.06)',
  '--surface-strong': 'rgba(0,0,0,.74)',
  '--text': THEME.text,
  '--muted': THEME.muted,
  '--coin': THEME.coin,
  '--success': THEME.success,
  '--danger': THEME.danger,
  '--cyan': THEME.cyan,
  '--focus': THEME.focus
} as unknown as import('react').CSSProperties;

const ogImage = '/opengraph-image';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  title: 'NeonJump — juego arcade de plataformas neón',
  description:
    'Saltá entre plataformas, esquivá enemigos eléctricos, juntá monedas y llegá a la Cima Neón en este juego arcade gratuito.',
  openGraph: {
    title: 'NeonJump — juego arcade de plataformas neón',
    description:
      'Un juego de plataformas vertical con monedas, impulsos, enemigos y dificultad creciente.',
    type: 'website',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'NeonJump con plataformas neón, monedas y un personaje saltando'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeonJump',
    description: 'Saltá sin parar hasta la Cima Neón.',
    images: [
      {
        url: ogImage,
        alt: 'NeonJump con plataformas neón, monedas y un personaje saltando'
      }
    ]
  }
};

const gameScript = String.raw`(function(){ if(window.__neonJumpMounted) return; window.__neonJumpMounted=true; var THEME=${JSON.stringify(THEME)}; var BRAND=THEME.brand; var PX_PER_M=4; var TARGETS={'Fácil':1500,'Normal':2500,'Difícil':3500,'Experto':5000}; var DIFF_API={'Fácil':'easy','Normal':'normal','Difícil':'hard','Experto':'expert'}; var LEVELS=['Inicio Luminoso','Calles de Neón','Zona Inestable','Cables Vivos','Órbita Violeta','Cima Neón']; var canvas=document.getElementById('neonjump-canvas'); var wrap=document.getElementById('neonjump-wrap'); if(!canvas||!wrap) return; var ctx=canvas.getContext('2d'); if(!ctx) return; var mode='menu'; var difficulty='Normal'; var playerName='Jugador'; var input={left:false,right:false,axis:0}; var dim={w:390,h:680,dpr:1}; var last=0; var game=emptyGame(); function byId(id){return document.getElementById(id)} function difficultyCode(){return DIFF_API[difficulty]||'normal'} function track(name,props){var payload=props||{}; try{ if(window.va&&typeof window.va==='function') window.va('event',name,payload); if(window.gtag&&typeof window.gtag==='function') window.gtag('event',name,payload); window.dataLayer=window.dataLayer||[]; window.dataLayer.push({event:name,neonjump:payload}); window.dispatchEvent(new CustomEvent('neonjump:event',{detail:{event:name,props:payload}})); }catch (e) {} } function elapsedMs(){return game.startedAt?Math.max(0,Math.round(performance.now()-game.startedAt)):0} function bestLocal(){var raw=window.localStorage.getItem('neonjump_record'); var n=raw?Number(raw):0; return Number.isFinite(n)?n:0} function rand(min,max){return min+Math.random()*(max-min)} function levelIndex(m){return Math.min(5,Math.max(0,Math.floor(m/500)))} function emptyGame(){return{player:{x:190,y:120,vx:0,vy:0,r:16,shield:0,heli:0,jet:0,boost:0},platforms:[],coins:[],powers:[],enemies:[],hazards:[],particles:[],cameraY:0,autoCameraY:0,maxY:0,coinsCount:0,bonus:0,winBonus:false,goalPassed:false,lastPlatformY:0,nextId:1,time:0,ended:false,posted:false,startedAt:0}} function scoreOf(g){var h=Math.max(0,Math.floor(g.maxY/PX_PER_M)); return h+g.coinsCount*25+g.bonus+(g.winBonus?500:0)} function text(id,v){var el=byId(id); if(el) el.textContent=String(v)} function rounded(c,x,y,w,h,r){var rr=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+rr,y); c.lineTo(x+w-rr,y); c.quadraticCurveTo(x+w,y,x+w,y+rr); c.lineTo(x+w,y+h-rr); c.quadraticCurveTo(x+w,y+h,x+w-rr,y+h); c.lineTo(x+rr,y+h); c.quadraticCurveTo(x,y+h,x,y+h-rr); c.lineTo(x,y+rr); c.quadraticCurveTo(x,y,x+rr,y); c.closePath()} function spark(g,x,y,color,n){for(var i=0;i<n;i+=1) g.particles.push({x:x,y:y,vx:rand(-130,130),vy:rand(20,210),life:rand(.25,.75),color:color,size:rand(2,5)})} function addPlatform(g){var meters=Math.max(0,g.lastPlatformY/PX_PER_M); var seg=levelIndex(meters); var diffMul=difficulty==='Fácil'?.86:difficulty==='Difícil'?1.15:difficulty==='Experto'?1.32:1; var gap=rand(70+seg*7,105+seg*10)*diffMul; g.lastPlatformY+=gap; var width=Math.max(44,rand(92-seg*8,135-seg*7)*(difficulty==='Fácil'?1.12:difficulty==='Difícil'?.88:difficulty==='Experto'?.78:1)); var type='stable'; var roll=Math.random(); if(seg>=1&&roll<.18+seg*.035) type='moving'; if(seg>=2&&roll>.72-seg*.035) type='break'; if(seg>=3&&roll>.88-seg*.02) type='ghost'; var p={id:g.nextId++,x:rand(width/2,dim.w-width/2),y:g.lastPlatformY,w:width,h:13,type:type,vx:type==='moving'?rand(38,82)*(Math.random()<.5?-1:1):0,broken:false,born:g.time}; g.platforms.push(p); if(Math.random()<.45+seg*.03) g.coins.push({id:g.nextId++,x:Math.max(18,Math.min(dim.w-18,p.x+rand(-70,70))),y:p.y+rand(35,66),taken:false}); if(Math.random()<.085+seg*.012) g.powers.push({id:g.nextId++,x:p.x,y:p.y+25,type:['spring','shield','heli','jet'][Math.floor(rand(0,4))],taken:false}); if(seg>=1&&Math.random()<.13+seg*.035) g.enemies.push({id:g.nextId++,x:rand(35,dim.w-35),y:p.y+rand(72,125),r:seg>=3&&Math.random()<.3?24:18,type:seg>=3&&Math.random()<.35?'ufo':'bug',vx:rand(32,78)*(Math.random()<.5?-1:1),near:false,phase:rand(0,9)}); if(seg>=4&&Math.random()<.09+seg*.02) g.hazards.push({id:g.nextId++,x:rand(45,dim.w-45),y:p.y+rand(95,155),r:rand(18,29),taken:false})} function setMode(next){if(mode===next) return; if(mode==='playing'&&next==='paused') track('game_pause',{difficulty:difficulty,difficultyCode:difficultyCode(),score:scoreOf(game),coins:game.coinsCount,elapsedMs:elapsedMs()}); if(mode==='paused'&&next==='playing') track('game_resume',{difficulty:difficulty,difficultyCode:difficultyCode(),score:scoreOf(game),coins:game.coinsCount,elapsedMs:elapsedMs()}); mode=next; renderPanels()} function updateStats(){var score=scoreOf(game); var altura=Math.max(0,Math.floor(game.maxY/PX_PER_M)); text('nj-altura',altura+' m'); text('nj-monedas','🪙 '+game.coinsCount); text('nj-record',Math.max(bestLocal(),score)); text('nj-score',score); text('nj-tramo',LEVELS[levelIndex(altura)]); text('nj-target',TARGETS[difficulty]+' m')} function renderPanels(){['menu','paused','win','gameover'].forEach(function(p){var el=byId('nj-panel-'+p); if(el) el.style.display=mode===p?'flex':'none'}); var pauseBtn=byId('nj-pause-top'); if(pauseBtn) pauseBtn.style.display=mode==='playing'?'block':'none'; updateStats()} function setDifficulty(next,tracked){difficulty=next; ['Fácil','Normal','Difícil','Experto'].forEach(function(d){var b=byId('nj-diff-'+d); if(!b) return; b.style.backgroundColor=d===difficulty?'var(--brand)':'rgba(255,255,255,.1)'; b.style.borderColor=d===difficulty?'var(--focus)':'rgba(255,255,255,.15)'}); if(tracked) track('difficulty_selected',{difficulty:difficulty,difficultyCode:difficultyCode()}); updateStats()} function startGame(){var nameEl=byId('nj-name'); playerName=((nameEl&&nameEl.value)||'Jugador').trim().slice(0,18)||'Jugador'; game=emptyGame(); game.startedAt=performance.now(); game.player.x=dim.w/2; game.player.y=92; game.player.vy=250; game.lastPlatformY=45; game.platforms.push({id:game.nextId++,x:dim.w/2,y:42,w:160,h:14,type:'stable',vx:0,broken:false,born:0}); for(var i=0;i<16;i+=1) addPlatform(game); text('nj-record',bestLocal()); track('game_start',{difficulty:difficulty,difficultyCode:difficultyCode(),score:0,coins:0,elapsedMs:0}); setMode('playing')} function postScore(score){if(game.posted) return; game.posted=true; var props={score:Math.floor(score),coins:game.coinsCount,difficulty:difficulty,difficultyCode:difficultyCode(),elapsedMs:elapsedMs()}; track('score_submit_attempt',props); fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:playerName,score:Math.floor(score),difficulty:difficultyCode()})}).then(function(res){if(!res.ok) throw new Error('score_submit_error'); track('score_submit_success',props); loadScores('submit_success')}).catch(function(err){track('score_submit_error',Object.assign({},props,{message:String(err&&err.message?err.message:err)}))})} function finish(kind){if(game.ended) return; game.ended=true; if(kind==='win') game.winBonus=true; var finalScore=scoreOf(game); var altura=Math.floor(game.maxY/PX_PER_M); var old=bestLocal(); var nuevo=finalScore>old; if(nuevo) window.localStorage.setItem('neonjump_record',String(finalScore)); text('nj-final-title',kind==='win'?'¡Cima alcanzada!':'Fin de la partida'); text('nj-win-title',kind==='win'?'¡Cima alcanzada!':'Victoria'); text('nj-final-altura',altura+' m'); text('nj-final-monedas',game.coinsCount); text('nj-final-score',finalScore); text('nj-final-record',Math.max(old,finalScore)); text('nj-win-altura',altura+' m'); text('nj-win-monedas',game.coinsCount); text('nj-win-score',finalScore); text('nj-win-record',Math.max(old,finalScore)); var nf=byId('nj-final-new'); if(nf) nf.style.display=nuevo?'block':'none'; var nw=byId('nj-win-new'); if(nw) nw.style.display=nuevo?'block':'none'; var props={score:finalScore,coins:game.coinsCount,altura:altura,difficulty:difficulty,difficultyCode:difficultyCode(),elapsedMs:elapsedMs(),outcome:kind}; track('game_over',props); if(kind==='win') track('game_win',props); postScore(finalScore); setMode(kind==='win'?'win':'gameover')} function clearList(list){while(list.firstChild) list.removeChild(list.firstChild)} function liWith(textValue,cls){var li=document.createElement('li'); li.className=cls||''; li.textContent=textValue; return li} function loadScores(source){var list=byId('nj-scores'); if(!list) return; clearList(list); for(var i=0;i<4;i+=1) list.appendChild(liWith('Cargando ranking','nj-score-skeleton nj-shimmer')); track('leaderboard_view',{source:source||'page',difficulty:difficulty,difficultyCode:difficultyCode()}); fetch('/api/scores').then(function(res){if(!res.ok) throw new Error('sin récords'); return res.json()}).then(function(data){var raw=Array.isArray(data)?data:Array.isArray(data&&data.scores)?data.scores:[]; var clean=raw.map(function(s){return{name:String((s&&s.name)||'Jugador'),score:Number((s&&s.score)||0)}}).filter(function(s){return Number.isFinite(s.score)}).sort(function(a,b){return b.score-a.score}).slice(0,10); clearList(list); track('leaderboard_view',{source:source||'page',status:'success',count:clean.length,difficulty:difficulty,difficultyCode:difficultyCode()}); if(!clean.length){list.appendChild(liWith('Todavía no hay saltadores en la cima','nj-score-empty')); return} clean.forEach(function(s,i){var li=document.createElement('li'); li.className='nj-score-row '+(i<3?'nj-score-top':''); var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1)+'.'; var name=String(s.name).replace(/[<>&]/g,'').slice(0,18); var left=document.createElement('span'); left.textContent=medal+' '+name; var right=document.createElement('b'); right.textContent=String(s.score); li.appendChild(left); li.appendChild(right); list.appendChild(li)})}).catch(function(err){clearList(list); track('leaderboard_view',{source:source||'page',status:'error',difficulty:difficulty,difficultyCode:difficultyCode(),message:String(err&&err.message?err.message:err)}); var li=liWith('No pudimos cargar el ranking.','nj-score-error'); var btn=document.createElement('button'); btn.type='button'; btn.textContent='Reintentar'; btn.onclick=function(){loadScores('retry')}; li.appendChild(btn); list.appendChild(li)})} function resize(){var rect=wrap.getBoundingClientRect(); var w=Math.max(300,Math.min(560,rect.width)); var h=Math.max(480,Math.min(760,window.innerHeight-185)); var dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1)); dim={w:w,h:h,dpr:dpr}; canvas.style.width=w+'px'; canvas.style.height=h+'px'; canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr)} function screenY(y){return dim.h-(y-game.cameraY)} function update(dt){var g=game,p=g.player,meters=Math.max(0,Math.floor(g.maxY/PX_PER_M)),seg=levelIndex(meters),diffSpeed=difficulty==='Fácil'?.82:difficulty==='Difícil'?1.24:difficulty==='Experto'?1.42:1; g.time+=dt; var axis=Math.max(-1,Math.min(1,input.axis)); var maxV=p.heli>0?220:310; p.vx+=axis*(p.heli>0?980:1450)*dt; p.vx*=Math.pow(.0018,dt); p.vx=Math.max(-maxV,Math.min(maxV,p.vx)); p.x+=p.vx*dt; if(p.x<-p.r) p.x=dim.w+p.r; if(p.x>dim.w+p.r) p.x=-p.r; if(p.jet>0){p.jet-=dt; p.vy=Math.max(p.vy,760)} else if(p.heli>0){p.heli-=dt; p.vy=Math.max(p.vy,330)} else p.vy-=1560*dt; if(p.shield>0) p.shield-=dt; if(p.boost>0) p.boost-=dt; var oldY=p.y; p.y+=p.vy*dt; g.maxY=Math.max(g.maxY,p.y); g.platforms.forEach(function(pl){if(pl.type==='moving'){pl.x+=pl.vx*dt; if(pl.x<pl.w/2||pl.x>dim.w-pl.w/2){pl.x=Math.max(pl.w/2,Math.min(dim.w-pl.w/2,pl.x)); pl.vx*=-1}} if(pl.type==='ghost'&&g.time-pl.born>4.4) pl.broken=true; if(!pl.broken&&p.vy<=0){var top=pl.y+pl.h/2; if(oldY-p.r>=top&&p.y-p.r<=top&&Math.abs(p.x-pl.x)<pl.w/2+p.r*.7){p.y=top+p.r; p.vy=pl.type==='break'?650:690; p.boost=.18; spark(g,p.x,top,pl.type==='break'?THEME.danger:BRAND,pl.type==='break'?18:8); if(pl.type==='break') pl.broken=true}}}); g.coins.forEach(function(c){if(!c.taken){var dx=c.x-p.x,dy=c.y-p.y; if(dx*dx+dy*dy<34*34){c.taken=true; g.coinsCount+=1; spark(g,c.x,c.y,THEME.coin,12)}}}); g.powers.forEach(function(pow){if(!pow.taken){var dx=pow.x-p.x,dy=pow.y-p.y; if(dx*dx+dy*dy<36*36){pow.taken=true; g.bonus+=50; if(pow.type==='spring'){p.vy=970; p.boost=.35} if(pow.type==='heli') p.heli=3.8; if(pow.type==='jet') p.jet=1.25; if(pow.type==='shield') p.shield=12; spark(g,pow.x,pow.y,pow.type==='shield'?BRAND:THEME.cyan,22)}}}); g.enemies.forEach(function(e){e.phase+=dt; e.x+=e.vx*dt; if(e.x<e.r||e.x>dim.w-e.r){e.x=Math.max(e.r,Math.min(dim.w-e.r,e.x)); e.vx*=-1} var dx=e.x-p.x,dy=e.y-p.y,d2=dx*dx+dy*dy; if(!e.near&&d2<72*72&&d2>(e.r+p.r+8)*(e.r+p.r+8)){e.near=true; g.bonus+=10; spark(g,p.x,p.y,THEME.brand2,6)} if(d2<(e.r+p.r)*(e.r+p.r)){if(p.shield>0){p.shield=0; e.y=-99999; spark(g,e.x,e.y,BRAND,26)} else finish('gameover')}}); g.hazards.forEach(function(hz){if(!hz.taken){var dx=hz.x-p.x,dy=hz.y-p.y; if(dx*dx+dy*dy<(hz.r+p.r-2)*(hz.r+p.r-2)){if(p.shield>0){p.shield=0; hz.taken=true; spark(g,hz.x,hz.y,BRAND,30)} else finish('gameover')}}}); var camTarget=p.y-dim.h*.48; if(camTarget>g.cameraY) g.cameraY+=(camTarget-g.cameraY)*Math.min(1,8*dt); g.autoCameraY+=(18+seg*7)*diffSpeed*dt; g.cameraY=Math.max(g.cameraY,g.autoCameraY); while(g.lastPlatformY<g.cameraY+dim.h+450) addPlatform(g); var low=g.cameraY-150; g.platforms=g.platforms.filter(function(pl){return pl.y>low&&!((pl.type==='break'||pl.type==='ghost')&&pl.broken&&pl.y<g.cameraY+dim.h)}); g.coins=g.coins.filter(function(c){return c.y>low&&!c.taken}); g.powers=g.powers.filter(function(pow){return pow.y>low&&!pow.taken}); g.enemies=g.enemies.filter(function(e){return e.y>low&&e.y>-9000}); g.hazards=g.hazards.filter(function(hz){return hz.y>low&&!hz.taken}); g.particles.forEach(function(part){part.x+=part.vx*dt; part.y+=part.vy*dt; part.vy-=520*dt; part.life-=dt}); g.particles=g.particles.filter(function(part){return part.life>0}); if(screenY(p.y)>dim.h+55) finish('gameover'); if(!g.goalPassed&&g.maxY>=TARGETS[difficulty]*PX_PER_M){g.goalPassed=true; spark(g,p.x,p.y,BRAND,34); finish('win')} updateStats()} function draw(){var g=game,w=dim.w,h=dim.h; ctx.setTransform(dim.dpr,0,0,dim.dpr,0,0); var bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,THEME.bg2); bg.addColorStop(.55,THEME.bg); bg.addColorStop(1,THEME.bg); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h); ctx.globalAlpha=.16; ctx.strokeStyle=THEME.brand2; ctx.lineWidth=1; var grid=32,off=-((g.cameraY*.35)%grid); for(var x=0;x<=w;x+=grid){ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke()} for(var y=off;y<=h;y+=grid){ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke()} ctx.globalAlpha=1; function toY(y){return h-(y-g.cameraY)} var targetY=TARGETS[difficulty]*PX_PER_M; if(!g.goalPassed&&Math.abs(targetY-g.cameraY)<h+150){var syGoal=toY(targetY); ctx.save(); ctx.shadowBlur=28; ctx.shadowColor=BRAND; ctx.strokeStyle=BRAND; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(w/2,syGoal,88,Math.PI,0); ctx.stroke(); ctx.fillStyle=THEME.text; ctx.font='bold 20px system-ui'; ctx.textAlign='center'; ctx.fillText('Cima Neón',w/2,syGoal-22); ctx.restore()} g.platforms.forEach(function(pl){if(pl.broken&&pl.type!=='break') return; var sy=toY(pl.y); if(sy<-40||sy>h+40) return; var alpha=pl.type==='ghost'?Math.max(.22,1-(g.time-pl.born)/4.4):1; ctx.save(); ctx.globalAlpha=alpha; ctx.shadowBlur=16; ctx.shadowColor=pl.type==='break'?THEME.danger:pl.type==='ghost'?THEME.cyan:BRAND; rounded(ctx,pl.x-pl.w/2,sy-pl.h/2,pl.w,pl.h,7); ctx.fillStyle=pl.type==='break'?THEME.danger:pl.type==='ghost'?'rgba(103,232,249,.38)':pl.type==='moving'?THEME.brand2:BRAND; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=pl.type==='ghost'?THEME.cyan:THEME.muted; ctx.stroke(); ctx.restore()}); g.coins.forEach(function(c){var sy=toY(c.y); if(sy<-30||sy>h+30) return; ctx.save(); ctx.shadowBlur=18; ctx.shadowColor=THEME.coin; ctx.fillStyle=THEME.coin; ctx.beginPath(); ctx.arc(c.x,sy,10,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=THEME.focus; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle=THEME.bg; ctx.font='bold 11px system-ui'; ctx.textAlign='center'; ctx.fillText('$',c.x,sy+4); ctx.restore()}); g.powers.forEach(function(pow){var sy=toY(pow.y); if(sy<-30||sy>h+30) return; ctx.save(); ctx.shadowBlur=18; ctx.shadowColor=BRAND; ctx.fillStyle=pow.type==='shield'?BRAND:THEME.cyan; ctx.beginPath(); ctx.arc(pow.x,sy,13,0,Math.PI*2); ctx.fill(); ctx.fillStyle=THEME.focus; ctx.font='16px system-ui'; ctx.textAlign='center'; ctx.fillText(pow.type==='spring'?'⚡':pow.type==='heli'?'↟':pow.type==='jet'?'▲':'🛡️',pow.x,sy+6); ctx.restore()}); g.hazards.forEach(function(hz){var sy=toY(hz.y); if(sy<-50||sy>h+50) return; ctx.save(); ctx.shadowBlur=22; ctx.shadowColor=THEME.danger; ctx.strokeStyle=THEME.danger; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(hz.x,sy,hz.r,0,Math.PI*2); ctx.stroke(); ctx.restore()}); g.enemies.forEach(function(e){var sy=toY(e.y); if(sy<-60||sy>h+60) return; ctx.save(); ctx.shadowBlur=20; ctx.shadowColor=THEME.cyan; ctx.fillStyle=e.type==='ufo'?BRAND:THEME.cyan; if(e.type==='ufo'){ctx.beginPath(); ctx.ellipse(e.x,sy,e.r*1.55,e.r*.55,0,0,Math.PI*2); ctx.fill()} else {ctx.beginPath(); ctx.arc(e.x,sy,e.r,0,Math.PI*2); ctx.fill()} ctx.fillStyle=THEME.focus; ctx.beginPath(); ctx.arc(e.x-6,sy-2,4,0,Math.PI*2); ctx.arc(e.x+6,sy-2,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle=THEME.bg; ctx.beginPath(); ctx.arc(e.x-5,sy-2,1.8,0,Math.PI*2); ctx.arc(e.x+7,sy-2,1.8,0,Math.PI*2); ctx.fill(); ctx.restore()}); g.particles.forEach(function(part){var sy=toY(part.y); ctx.globalAlpha=Math.max(0,part.life); ctx.fillStyle=part.color; ctx.beginPath(); ctx.arc(part.x,sy,part.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1}); var p=g.player,py=toY(p.y); ctx.save(); if(p.boost>0||p.jet>0||p.heli>0){var grd=ctx.createLinearGradient(p.x,py+8,p.x,py+90); grd.addColorStop(0,'rgba(124,58,237,.75)'); grd.addColorStop(1,'rgba(124,58,237,0)'); ctx.fillStyle=grd; ctx.beginPath(); ctx.moveTo(p.x-10,py+8); ctx.lineTo(p.x+10,py+8); ctx.lineTo(p.x,py+90); ctx.closePath(); ctx.fill()} if(p.shield>0){ctx.shadowBlur=24+Math.sin(g.time*8)*7; ctx.shadowColor=BRAND; ctx.strokeStyle=THEME.brand2; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(p.x,py,p.r+10+Math.sin(g.time*7)*2,0,Math.PI*2); ctx.stroke()} ctx.shadowBlur=20; ctx.shadowColor=BRAND; ctx.fillStyle=BRAND; ctx.beginPath(); ctx.arc(p.x,py,p.r,0,Math.PI*2); ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=THEME.focus; ctx.stroke(); ctx.fillStyle=THEME.focus; ctx.beginPath(); ctx.arc(p.x-6,py-4,5,0,Math.PI*2); ctx.arc(p.x+7,py-4,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle=THEME.bg; ctx.beginPath(); ctx.arc(p.x-5,py-3,2,0,Math.PI*2); ctx.arc(p.x+8,py-3,2,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha=.9; rounded(ctx,w-82,16,66,38,16); ctx.fillStyle='rgba(124,58,237,.65)'; ctx.fill(); ctx.fillStyle=THEME.focus; ctx.font='bold 15px system-ui'; ctx.textAlign='center'; ctx.fillText('Pausa',w-49,41); ctx.restore()} function loop(t){var dt=Math.min(.033,((t||0)-(last||t||0))/1000); last=t||0; if(document.hidden) dt=0; if(mode==='playing') update(dt); draw(); requestAnimationFrame(loop)} function shareFinal(){var props={difficulty:difficulty,difficultyCode:difficultyCode(),score:scoreOf(game),coins:game.coinsCount,elapsedMs:elapsedMs()}; track('share_click',props); var txt='Mi puntaje en NeonJump: '+props.score+' puntos. ¿Podés superarlo?'; if(navigator.share) navigator.share({title:'NeonJump',text:txt,url:location.href}).catch(function(){}); else if(navigator.clipboard) navigator.clipboard.writeText(txt+' '+location.href).catch(function(){})} function bind(){byId('nj-start').onclick=startGame; byId('nj-restart').onclick=startGame; byId('nj-retry-win').onclick=startGame; byId('nj-menu-restart').onclick=function(){setMode('menu'); loadScores('menu_after_gameover')}; byId('nj-menu-win').onclick=function(){setMode('menu'); loadScores('menu_after_win')}; byId('nj-continue').onclick=function(){setMode('playing')}; byId('nj-keep-playing').onclick=function(){game.ended=false; setMode('playing')}; byId('nj-pause-top').onclick=function(){setMode('paused')}; byId('nj-share-gameover').onclick=shareFinal; byId('nj-share-win').onclick=shareFinal; byId('nj-diff-Fácil').onclick=function(){setDifficulty('Fácil',true)}; byId('nj-diff-Normal').onclick=function(){setDifficulty('Normal',true)}; byId('nj-diff-Difícil').onclick=function(){setDifficulty('Difícil',true)}; byId('nj-diff-Experto').onclick=function(){setDifficulty('Experto',true)}; window.addEventListener('keydown',function(ev){var k=ev.key.toLowerCase(); if(k==='arrowleft'||k==='a') input.left=true; if(k==='arrowright'||k==='d') input.right=true; input.axis=(input.right?1:0)+(input.left?-1:0); if(k===' '||k==='p'){ev.preventDefault(); if(mode==='playing') setMode('paused'); else if(mode==='paused') setMode('playing')} if(k==='enter'){if(mode==='menu'||mode==='gameover') startGame(); else if(mode==='paused') setMode('playing')}}); window.addEventListener('keyup',function(ev){var k=ev.key.toLowerCase(); if(k==='arrowleft'||k==='a') input.left=false; if(k==='arrowright'||k==='d') input.right=false; input.axis=(input.right?1:0)+(input.left?-1:0)}); canvas.addEventListener('pointerdown',pointer); canvas.addEventListener('pointermove',pointer); window.addEventListener('pointerup',function(){input.axis=(input.right?1:0)+(input.left?-1:0)}); document.addEventListener('visibilitychange',function(){if(document.hidden&&mode==='playing') setMode('paused')}); window.addEventListener('resize',resize)} function pointer(ev){var rect=canvas.getBoundingClientRect(); var x=ev.clientX-rect.left; var y=ev.clientY-rect.top; if(mode==='playing'&&y<72&&x>rect.width-92){setMode('paused'); return} input.axis=x<rect.width/2?-1:1} resize(); bind(); setDifficulty('Normal',false); renderPanels(); loadScores('initial'); requestAnimationFrame(loop);})();`;

export default function Page() {
  return (
    <main
      className='nj-ui min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center p-3 sm:p-5 overflow-x-hidden'
      style={pageVars}
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            `.nj-ui button,.nj-ui input{min-height:44px}.nj-ui button{transition:transform .12s ease,filter .12s ease,box-shadow .12s ease}.nj-ui button:hover{filter:brightness(1.12)}.nj-ui button:active{transform:scale(.96)}.nj-ui button:focus-visible,.nj-ui input:focus-visible,.nj-ui a:focus-visible{outline:2px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 4px rgba(124,58,237,.45),0 0 24px rgba(103,232,249,.28)}.nj-primary{background:var(--brand);color:var(--text)}.nj-card{border:1px solid rgba(167,139,250,.18);background:var(--surface-soft);color:var(--text)}.nj-panel{background:var(--surface-strong);color:var(--text)}.nj-input{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:var(--text)}.nj-muted{color:rgba(221,214,254,.78)}.nj-link{color:var(--muted);text-decoration:underline;text-decoration-color:var(--brand-2);text-underline-offset:4px}.nj-trust{border:1px solid rgba(167,139,250,.24);background:rgba(15,10,35,.72);color:rgba(248,250,252,.9)}.nj-score-row{display:flex;justify-content:space-between;gap:.75rem;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);border-radius:1rem;padding:.55rem .7rem;color:var(--text)}.nj-score-top{border-color:rgba(250,204,21,.55);box-shadow:0 0 18px rgba(250,204,21,.12)}.nj-score-empty{border:1px dashed rgba(167,139,250,.45);border-radius:1rem;padding:.8rem;color:var(--muted);background:rgba(124,58,237,.14)}.nj-score-error{border:1px solid rgba(251,113,133,.6);border-radius:1rem;padding:.8rem;color:var(--danger);background:rgba(251,113,133,.1);display:grid;gap:.55rem}.nj-score-error button{border-radius:.9rem;background:var(--brand);color:var(--text);font-weight:800;padding:.45rem .8rem}.nj-score-skeleton{position:relative;overflow:hidden;height:38px;border-radius:1rem;background:rgba(255,255,255,.07);color:transparent;border:1px solid rgba(167,139,250,.12)}.nj-shimmer::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(124,58,237,.35),transparent);animation:nj-shimmer 1.25s infinite}@keyframes nj-shimmer{100%{transform:translateX(100%)}}`
        }}
      />

      <header className='w-full max-w-[760px] flex items-center justify-between gap-3 mb-3'>
        <div>
          <h1 id='game-title' className='text-3xl sm:text-4xl font-black tracking-tight'>
            <span style={{ color: 'var(--brand)' }}>Neon</span>Jump
          </h1>
          <p className='text-xs sm:text-sm nj-muted'>
            Flechas/WASD para moverte · Espacio/P pausa · Enter jugar
          </p>
        </div>
        <button
          id='nj-pause-top'
          type='button'
          className='nj-primary rounded-2xl px-4 py-3 font-bold shadow-lg'
          style={{ display: 'none' }}
        >
          Pausa
        </button>
      </header>

      <section aria-labelledby='seo-summary' className='w-full max-w-[760px] mb-4 rounded-3xl nj-card p-4'>
        <p id='seo-summary'>
          NeonJump es un juego arcade de plataformas vertical ambientado en una torre neón: saltá sin parar,
          juntá monedas, usá impulsos y esquivá enemigos eléctricos mientras sube la dificultad.
        </p>
        <p className='mt-3 rounded-2xl nj-trust p-3 text-sm'>
          NeonJump es gratuito, sin compras ni anuncios. Si guardás tu puntaje, tu nombre, dificultad y score
          aparecerán en el ranking público. Usamos analítica básica y controles antifraude; no ingreses datos
          personales.
        </p>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <section>
            <h2 className='font-black'>Cómo jugar</h2>
            <p className='text-sm nj-muted'>
              Movete con flechas, WASD o tocando los lados del canvas. Pausá con Espacio, P o el botón superior.
            </p>
          </section>
          <section>
            <h2 className='font-black'>Objetivo</h2>
            <p className='text-sm nj-muted'>
              Subí por la torre neón, encadená plataformas, recolectá monedas y alcanzá la Cima Neón para ganar
              bonus.
            </p>
          </section>
          <section>
            <h2 className='font-black'>Dificultades</h2>
            <p className='text-sm nj-muted'>
              Fácil, Normal, Difícil y Experto ajustan distancia entre plataformas, velocidad de cámara y meta de
              altura.
            </p>
          </section>
          <section>
            <h2 className='font-black'>Ranking</h2>
            <p className='text-sm nj-muted'>
              El puntaje combina altura, monedas, bonus y victoria; los mejores resultados se envían al leaderboard
              público.
            </p>
          </section>
        </div>
      </section>

      <div className='w-full max-w-[760px] grid grid-cols-4 gap-2 mb-3 text-center'>
        <div className='rounded-2xl nj-card p-2'>
          <div className='text-[11px] nj-muted'>Altura</div>
          <div id='nj-altura' className='font-black'>
            0 m
          </div>
        </div>
        <div className='rounded-2xl nj-card p-2'>
          <div className='text-[11px] nj-muted'>Monedas</div>
          <div id='nj-monedas' className='font-black'>
            🪙 0
          </div>
        </div>
        <div className='rounded-2xl nj-card p-2'>
          <div className='text-[11px] nj-muted'>Score</div>
          <div id='nj-score' className='font-black'>
            0
          </div>
        </div>
        <div className='rounded-2xl nj-card p-2'>
          <div className='text-[11px] nj-muted'>Récord</div>
          <div id='nj-record' className='font-black'>
            0
          </div>
        </div>
      </div>

      <section id='neonjump-wrap' aria-labelledby='game-title' className='relative flex justify-center w-full max-w-[760px]'>
        <canvas
          id='neonjump-canvas'
          className='rounded-[28px] border border-violet-300/25 shadow-2xl shadow-violet-900/40 select-none bg-[var(--bg)]'
          style={{ touchAction: 'none' }}
        />
        <div
          id='nj-panel-menu'
          className='nj-panel absolute inset-0 m-auto flex flex-col items-center justify-center rounded-[28px] backdrop-blur-sm p-5 text-center overflow-y-auto'
        >
          <div className='text-5xl mb-2' aria-hidden='true'>
            ⚡
          </div>
          <div role='heading' aria-level={2} className='text-4xl font-black mb-2'>
            NeonJump
          </div>
          <p className='max-w-sm nj-muted mb-4'>
            Saltá entre plataformas neón, juntá monedas y esquivá enemigos eléctricos hasta cruzar la Cima Neón.
          </p>
          <label htmlFor='nj-name' className='text-sm nj-muted mb-1'>
            Nombre
          </label>
          <input
            id='nj-name'
            defaultValue='Jugador'
            maxLength={18}
            className='nj-input mb-2 w-56 rounded-2xl px-4 py-3 text-center outline-none'
          />
          <p className='nj-trust mb-3 max-w-md rounded-2xl p-3 text-xs'>
            NeonJump es gratuito, sin compras ni anuncios. Si guardás tu puntaje, tu nombre, dificultad y score
            aparecerán en el ranking público. Usamos analítica básica y controles antifraude; no ingreses datos
            personales. Responsable: equipo NeonJump. Contacto:{' '}
            <a className='nj-link' href='mailto:privacidad@neonjump.app'>
              privacidad@neonjump.app
            </a>
            . Ver{' '}
            <a className='nj-link' href='#privacidad'>
              Privacidad
            </a>{' '}
            y{' '}
            <a className='nj-link' href='#terminos'>
              Términos
            </a>
            .
          </p>
          <div className='flex flex-wrap justify-center gap-2 mb-4'>
            <button id='nj-diff-Fácil' type='button' className='rounded-2xl border px-4 py-2 font-bold'>
              Fácil
            </button>
            <button id='nj-diff-Normal' type='button' className='rounded-2xl border px-4 py-2 font-bold'>
              Normal
            </button>
            <button id='nj-diff-Difícil' type='button' className='rounded-2xl border px-4 py-2 font-bold'>
              Difícil
            </button>
            <button id='nj-diff-Experto' type='button' className='rounded-2xl border px-4 py-2 font-bold'>
              Experto
            </button>
          </div>
          <button id='nj-start' type='button' className='nj-primary rounded-2xl px-6 py-3 font-black'>
            Jugar
          </button>
          <ul id='nj-scores' className='mt-4 w-full max-w-md grid gap-2 list-none p-0' />
        </div>
      </section>

      <div id='nj-panel-paused' style={{ display: 'none' }} />
      <div id='nj-panel-win' style={{ display: 'none' }} />
      <div id='nj-panel-gameover' style={{ display: 'none' }} />
      <div id='nj-tramo' style={{ display: 'none' }} />
      <div id='nj-target' style={{ display: 'none' }} />
      <div id='nj-final-title' style={{ display: 'none' }} />
      <div id='nj-win-title' style={{ display: 'none' }} />
      <div id='nj-final-altura' style={{ display: 'none' }} />
      <div id='nj-final-monedas' style={{ display: 'none' }} />
      <div id='nj-final-score' style={{ display: 'none' }} />
      <div id='nj-final-record' style={{ display: 'none' }} />
      <div id='nj-win-altura' style={{ display: 'none' }} />
      <div id='nj-win-monedas' style={{ display: 'none' }} />
      <div id='nj-win-score' style={{ display: 'none' }} />
      <div id='nj-win-record' style={{ display: 'none' }} />
      <div id='nj-final-new' style={{ display: 'none' }} />
      <div id='nj-win-new' style={{ display: 'none' }} />
      <button id='nj-restart' type='button' style={{ display: 'none' }} />
      <button id='nj-retry-win' type='button' style={{ display: 'none' }} />
      <button id='nj-menu-restart' type='button' style={{ display: 'none' }} />
      <button id='nj-menu-win' type='button' style={{ display: 'none' }} />
      <button id='nj-continue' type='button' style={{ display: 'none' }} />
      <button id='nj-keep-playing' type='button' style={{ display: 'none' }} />
      <button id='nj-share-gameover' type='button' style={{ display: 'none' }} />
      <button id='nj-share-win' type='button' style={{ display: 'none' }} />

      <script dangerouslySetInnerHTML={{ __html: gameScript }} />
    </main>
  );
}
