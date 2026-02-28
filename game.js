/* c:\Users\Steven Arias\Documents\2\BombardoTestPlay\game.js */
const CONFIG={TILE:32,COLS:15,ROWS:11,WIDTH:480,HEIGHT:352,SPEED_BASE:2,BRICK_DENSITY:0.6,BOMB_RANGE_BASE:2,MAX_BOMBS_BASE:1,WIN_SCORE:3,ROUND_TIME:120};
// Sprites Mapping (Fila 5 es y=4)
const SPRITES={
    ITEM_FIRE:{x:0,y:4},ITEM_BOMB:{x:1,y:4},ITEM_SPEED:{x:2,y:4}, // A5, B5, C5
    L1:{FLOOR:{x:0,y:1},WALL_S:{x:0,y:0},WALL_B:{x:1,y:0}}, 
    L2:{FLOOR:{x:1,y:1},WALL_S:{x:2,y:0},WALL_B:{x:6,y:4}},
    BOMB_IDLE:[{x:0,y:2},{x:1,y:2}],EXPLOSION_ANIM:[{x:3,y:4},{x:4,y:4}], // D5, E5
    CHAR:{IDLE_DOWN:[{x:3,y:0}],WALK_DOWN:[{x:4,y:0},{x:3,y:0},{x:5,y:0}],IDLE_SIDE:[{x:6,y:0}],WALK_SIDE:[{x:3,y:1},{x:4,y:1},{x:5,y:1}],IDLE_UP:[{x:3,y:2}],WALK_UP:[{x:4,y:2},{x:3,y:2},{x:5,y:2}],DIE:[{x:6,y:2},{x:3,y:3},{x:4,y:3},{x:5,y:3}]}
};
const PALETTE=[{name:'Red',hex:'#ac3232',filter:'none'},{name:'Blue',hex:'#3498db',filter:'hue-rotate(210deg) brightness(1.2)'},{name:'Green',hex:'#2ecc71',filter:'hue-rotate(120deg) brightness(1.2)'},{name:'Yellow',hex:'#f1c40f',filter:'hue-rotate(60deg) brightness(1.5)'},{name:'Purple',hex:'#9b59b6',filter:'hue-rotate(290deg) brightness(1.1)'},{name:'Cyan',hex:'#00cec9',filter:'hue-rotate(180deg) brightness(1.3)'},{name:'Enemy',hex:'#555',filter:'invert(1) grayscale(1)'}];
const assets={spritesheet:new Image(),coloredSheets:[],loaded:false};
function loadAssets(){assets.spritesheet.src='sprites.png';assets.spritesheet.onload=()=>{generateColoredSprites();setFavicon();assets.loaded=true;console.log("OK");showMainMenu();};assets.spritesheet.onerror=()=>{console.warn("Err");assets.loaded=false;showMainMenu();};}
function generateColoredSprites(){PALETTE.forEach((pal,idx)=>{const c=document.createElement('canvas');c.width=assets.spritesheet.width;c.height=assets.spritesheet.height;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;if(pal.filter!=='none')ctx.filter=pal.filter;ctx.drawImage(assets.spritesheet,0,0);assets.coloredSheets[idx]=c;});}
function setFavicon(){const c=document.createElement('canvas');c.width=32;c.height=32;const ctx=c.getContext('2d');ctx.drawImage(assets.spritesheet,32,128,32,32,0,0,32,32);const l=document.getElementById('favicon');if(l)l.href=c.toDataURL();}
function showMainMenu(){document.getElementById('screen-loading').style.display='none';document.getElementById('screen-login').style.display='none';document.getElementById('screen-mode-select').style.display='none';document.getElementById('screen-main-menu').style.display='flex';init();initUI();}
function showModeSelect(){document.getElementById('screen-main-menu').style.display='none';document.getElementById('screen-mode-select').style.display='flex';document.getElementById('create-room-id').value='';}
function showJoinScreen(){document.getElementById('screen-main-menu').style.display='none';document.getElementById('screen-login').style.display='flex';}

let mapGrid=[], bombs=[], explosions=[], items=[], particles=[];
const TILE_TYPE={EMPTY:0,WALL:1,BRICK:2,BOMB:3}; const ITEM_TYPE={NONE:0,FIRE:1,BOMB:2,SPEED:3};
let currentLevel=1;
const state={status:'LOGIN',mode:'PVP',input:{x:0,y:0,active:false},localPlayer:null,players:{},lobbyPlayers:{},frame:0,scores:{1:0,2:0,3:0,4:0},processingDeath:false,winner:null,timeLeft:CONFIG.ROUND_TIME};
let myProfile={name:'',colorIdx:0,isReady:false};

function initUI(){
    const inp=document.getElementById('my-name-input'); inp.replaceWith(inp.cloneNode(true));
    document.getElementById('my-name-input').addEventListener('input',(e)=>{if(myProfile.isReady)return;myProfile.name=e.target.value.toUpperCase();if(net.id)sendProfileUpdate();});
    updatePaletteUI();
    document.getElementById('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});
}
function updatePaletteUI(){
    const taken=new Set(); for(let p in state.lobbyPlayers)if(parseInt(p)!==net.id)taken.add(state.lobbyPlayers[p].colorIdx);
    const c=document.getElementById('color-palette'); c.innerHTML='';
    PALETTE.forEach((col,idx)=>{if(idx===6)return;const d=document.createElement('div');d.className='color-btn';d.style.backgroundColor=col.hex;if(idx===myProfile.colorIdx)d.classList.add('selected');if(taken.has(idx))d.classList.add('taken');else d.onclick=()=>{if(!myProfile.isReady)setLocalColor(idx);};c.appendChild(d);});
}
function setLocalColor(idx){for(let p in state.lobbyPlayers)if(parseInt(p)!==net.id && state.lobbyPlayers[p].colorIdx===idx)return;myProfile.colorIdx=idx;updatePaletteUI();if(net.id)sendProfileUpdate();}
function toggleReady(){if(!net.id||net.id===1)return;myProfile.isReady=!myProfile.isReady;const b=document.getElementById('btnReady'),e=document.getElementById('profile-editor');if(myProfile.isReady){b.innerText="CANCELAR";b.classList.add('is-ready');e.classList.add('locked');document.getElementById('my-name-input').disabled=true;}else{b.innerText="LISTO";b.classList.remove('is-ready');e.classList.remove('locked');document.getElementById('my-name-input').disabled=false;}sendProfileUpdate();}
function sendProfileUpdate(){net.send({t:'profile_update',id:net.id,name:myProfile.name||`P${net.id}`,cIdx:myProfile.colorIdx,rdy:myProfile.isReady});updateLobbyData(net.id,myProfile.name||`P${net.id}`,myProfile.colorIdx,myProfile.isReady);}
function updateLobbyData(id,name,colorIdx,isReady){
    state.lobbyPlayers[id]={name,colorIdx,isReady};renderLobbySlots();updatePaletteUI();
    if(net.id===1){const b=document.getElementById('btnStartGame');const o=Object.keys(state.lobbyPlayers).filter(p=>p!=1);const r=o.length>0&&o.every(p=>state.lobbyPlayers[p].isReady);if(r||o.length===0){b.disabled=false;b.style.opacity="1";}else{b.disabled=true;b.style.opacity="0.5";}}
    if(state.players[id]){state.players[id].name=name;state.players[id].colorIdx=colorIdx;}
}
function renderLobbySlots(){
    for(let i=1;i<=4;i++){
        const s=document.getElementById(`slot-${i}`),d=s.querySelector('.status-dot'),p=state.lobbyPlayers[i];
        if(state.mode==='COOP' && i>2){s.style.display='none';continue;}else s.style.display='flex';
        d.className='status-dot'; s.className='player-slot '+(i===1?'p1':(i===2?'p2':(i===3?'p3':'p4')));
        if(p){s.classList.add('active');s.childNodes[0].nodeValue=`${p.name} ${i===1?'(HOST)':''}`;const c=PALETTE[p.colorIdx]||PALETTE[0];s.style.backgroundColor=c.hex;s.style.color=(p.colorIdx===3||p.colorIdx===5)?'#000':'#fff';if(p.isReady||i===1)s.classList.add('ready');else s.classList.remove('ready');d.classList.add('connected');}
        else{s.classList.remove('active','ready');s.style.backgroundColor='#333';s.style.color='#777';s.childNodes[0].nodeValue=`P${i}: ...`;}
    }
    for(let i=1;i<=4;i++){const p=state.lobbyPlayers[i],e=document.getElementById(`p${i}-score`);if(p){e.innerText=`${p.name}: ${state.scores[i]||0}`;e.style.color=PALETTE[p.colorIdx].hex;}else e.style.display='none';}
}
function updateStatsUI(){if(!state.localPlayer)return;document.getElementById('stat-bomb').innerText=state.localPlayer.stats.maxBombs;document.getElementById('stat-fire').innerText=state.localPlayer.stats.range;document.getElementById('stat-speed').innerText=state.localPlayer.stats.speed;}

class Net{
    constructor(){this.ws=null;this.id=0;}
    connect(r){log("Conectando...");this.ws=new WebSocket('wss://mi-bombardo-server.onrender.com');this.ws.onopen=()=>{log("WS OK");this.ws.send(JSON.stringify({type:'join',room:r}));};this.ws.onmessage=e=>this.handle(JSON.parse(e.data));this.ws.onerror=()=>log("Error WS");}
    handle(m){
        switch(m.type){
            case 'id':this.id=m.id;if(!myProfile.name){myProfile.name=`P${m.id}`;document.getElementById('my-name-input').value=myProfile.name;}myProfile.colorIdx=(m.id-1)%PALETTE.length;if(m.id===1){document.getElementById('btnReady').style.display='none';if(state.mode==='PVP')document.getElementById('host-settings').style.display='block';}enterLobby(m.id);break;
            case 'user_joined':if(this.id===1)this.send({t:'lobby_sync_full',list:state.lobbyPlayers,mode:state.mode});break;
            case 'user_left':delete state.lobbyPlayers[m.id];delete state.players[m.id];renderLobbySlots();updatePaletteUI();break;
            case 'data':onNetData(m.data, m.from);break;
        }
    }
    send(d){if(this.ws&&this.ws.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify({type:'data',data:d}));}
    broadcast(d){this.send(d);}
}

class Player{
    constructor(id,c,r,n,idx){this.id=id;this.name=n;this.colorIdx=idx;this.spawnX=c*CONFIG.TILE;this.spawnY=r*CONFIG.TILE;this.activeBombs=0;this.sentIdlePacket=true;this.stats={speed:CONFIG.SPEED_BASE,maxBombs:CONFIG.MAX_BOMBS_BASE,range:CONFIG.BOMB_RANGE_BASE};this.reset();}
    reset(){this.x=this.spawnX;this.y=this.spawnY;this.targetX=this.x;this.targetY=this.y;this.isMoving=false;this.isDead=false;this.animState='IDLE_DOWN';this.facingLeft=false;this.deadTimer=0;this.activeBombs=0;this.sentIdlePacket=true;this.stats={speed:CONFIG.SPEED_BASE,maxBombs:CONFIG.MAX_BOMBS_BASE,range:CONFIG.BOMB_RANGE_BASE};if(this.id===net.id)updateStatsUI();}
    die(){if(this.isDead)return;this.isDead=true;this.animState='DIE';this.deadTimer=90;if(this.id===net.id)triggerHaptic(200);}
    update(){
        if(this.isDead){if(this.deadTimer>0)this.deadTimer--;else if(this.deadTimer===0){this.deadTimer=-1;this.reset();if(this.id===net.id)net.send({t:'respawn',id:this.id});}return;}
        if(this.isMoving){
            if(this.id===net.id || (this.id<0 && net.id===1)){if(this.targetY>this.y)this.animState='WALK_DOWN';else if(this.targetY<this.y)this.animState='WALK_UP';else if(this.targetX>this.x){this.animState='WALK_SIDE';this.facingLeft=false;}else if(this.targetX<this.x){this.animState='WALK_SIDE';this.facingLeft=true;}}
            const spd=this.stats.speed;
            if(this.x<this.targetX)this.x+=spd;if(this.x>this.targetX)this.x-=spd;if(this.y<this.targetY)this.y+=spd;if(this.y>this.targetY)this.y-=spd;
            if(Math.abs(this.x-this.targetX)<spd && Math.abs(this.y-this.targetY)<spd){this.x=this.targetX;this.y=this.targetY;this.isMoving=false;this.checkInput();}
        }else{if(this.id===net.id || (this.id<0 && net.id===1)){if(this.animState==='WALK_DOWN')this.animState='IDLE_DOWN';if(this.animState==='WALK_UP')this.animState='IDLE_UP';if(this.animState==='WALK_SIDE')this.animState='IDLE_SIDE';}this.checkInput();}
    }
    checkInput(){
        if(this.id!==net.id || state.winner)return;
        const myC=Math.round(this.x/CONFIG.TILE),myR=Math.round(this.y/CONFIG.TILE);
        // Pickups logic
        const itIdx=items.findIndex(i=>i.c===myC&&i.r===myR&&!i.hidden);
        if(itIdx!==-1){
            const it=items[itIdx]; if(it.type===ITEM_TYPE.FIRE)this.stats.range++; if(it.type===ITEM_TYPE.BOMB)this.stats.maxBombs++; if(it.type===ITEM_TYPE.SPEED&&this.stats.speed<4)this.stats.speed+=0.5;
            updateStatsUI(); net.send({t:'pickup',idx:itIdx,id:this.id}); items.splice(itIdx,1); playSound('item');
        }
        if(state.input.active){
            let col=Math.round(this.x/CONFIG.TILE),row=Math.round(this.y/CONFIG.TILE),nextCol=col+state.input.x,nextRow=row+state.input.y;
            if(nextCol>=0&&nextCol<CONFIG.COLS&&nextRow>=0&&nextRow<CONFIG.ROWS){
                if(mapGrid[nextRow][nextCol].type===TILE_TYPE.EMPTY){
                    const b=bombs.find(x=>x.col===nextCol&&x.row===nextRow);
                    if(!b||b.exploded){
                        this.targetX=nextCol*CONFIG.TILE;this.targetY=nextRow*CONFIG.TILE;this.isMoving=true;this.sentIdlePacket=false;
                        let anim=this.animState,face=this.facingLeft;
                        if(state.input.y>0)anim='WALK_DOWN';else if(state.input.y<0)anim='WALK_UP';else if(state.input.x>0){anim='WALK_SIDE';face=false;}else if(state.input.x<0){anim='WALK_SIDE';face=true;}
                        net.send({t:'m',tx:this.targetX,ty:this.targetY,x:this.x,y:this.y,id:this.id,a:anim,f:face,s:this.stats.speed});
                    }
                }
            }
        }else if(!this.sentIdlePacket){
            let idle=this.animState; if(idle.startsWith('WALK_DOWN'))idle='IDLE_DOWN';if(idle.startsWith('WALK_UP'))idle='IDLE_UP';if(idle.startsWith('WALK_SIDE'))idle='IDLE_SIDE';
            this.animState=idle; net.send({t:'m',tx:this.x,ty:this.y,x:this.x,y:this.y,id:this.id,a:idle,f:this.facingLeft,s:this.stats.speed}); this.sentIdlePacket=true;
        }
    }
    placeBomb(){
        if(this.isDead||this.activeBombs>=this.stats.maxBombs||state.winner)return;
        const c=Math.round(this.x/CONFIG.TILE),r=Math.round(this.y/CONFIG.TILE);
        if(mapGrid[r][c].type===TILE_TYPE.BOMB)return;if(bombs.some(b=>b.col===c&&b.row===r))return;
        createBomb(c,r,this.id,this.stats.range);this.activeBombs++;net.send({t:'b',c:c,r:r,oid:this.id,rng:this.stats.range}); playSound('bomb');triggerHaptic(50);
    }
    draw(ctx){
        if(this.isDead&&this.deadTimer<=0)return;
        const anim=SPRITES.CHAR[this.animState]; let frame=0;
        if(this.animState==='DIE') frame=Math.min(Math.floor((1-(this.deadTimer/90))*anim.length),anim.length-1); else frame=Math.floor(state.frame/10)%anim.length;
        const coord=anim[frame]||anim[0], dx=Math.floor(this.x), dy=Math.floor(this.y-8);
        ctx.save();
        if(this.facingLeft){ctx.translate(dx+CONFIG.TILE,dy);ctx.scale(-1,1);drawSprite(ctx,coord,0,0,this.colorIdx);}else drawSprite(ctx,coord,dx,dy,this.colorIdx);
        ctx.restore();
        if(!this.isDead){
            ctx.fillStyle=PALETTE[this.colorIdx]?.hex||'#fff'; ctx.beginPath(); ctx.moveTo(Math.floor(this.x+16),Math.floor(this.y-12)); ctx.lineTo(Math.floor(this.x+12),Math.floor(this.y-18)); ctx.lineTo(Math.floor(this.x+20),Math.floor(this.y-18)); ctx.fill();
        }
    }
}
class AIPlayer extends Player{
    constructor(id,c,r){super(id,c,r,'BOT',6);this.aiTimer=0;this.currDir={x:0,y:0};this.stats.speed=1.3;}
    checkInput(){
        if(this.isDead||state.winner||this.isMoving)return;
        this.aiTimer--;
        if(this.aiTimer<=0){
            this.aiTimer=Math.floor(Math.random()*30+30);
            const dirs=[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
            this.currDir=dirs[Math.floor(Math.random()*dirs.length)];
            if(Math.random()<0.1) this.placeBomb();
        }
        const dx=this.currDir.x, dy=this.currDir.y;
        if(dx===0&&dy===0)return;
        let col=Math.round(this.x/CONFIG.TILE),row=Math.round(this.y/CONFIG.TILE),nextCol=col+dx,nextRow=row+dy;
        if(nextCol>=0&&nextCol<CONFIG.COLS&&nextRow>=0&&nextRow<CONFIG.ROWS){
            if(mapGrid[nextRow][nextCol].type===TILE_TYPE.EMPTY){
                const b=bombs.find(x=>x.col===nextCol&&x.row===nextRow);
                if(!b||b.exploded){
                    this.targetX=nextCol*CONFIG.TILE;this.targetY=nextRow*CONFIG.TILE;this.isMoving=true;this.sentIdlePacket=false;
                    let anim=this.animState,face=this.facingLeft;
                    if(dy>0)anim='WALK_DOWN';else if(dy<0)anim='WALK_UP';else if(dx>0){anim='WALK_SIDE';face=false;}else if(dx<0){anim='WALK_SIDE';face=true;}
                    this.animState=anim; this.facingLeft=face;
                    net.broadcast({t:'m',tx:this.targetX,ty:this.targetY,x:this.x,y:this.y,id:this.id,a:anim,f:face,s:this.stats.speed});
                }
            }
        }
    }
}

class Bomb{constructor(c,r,o,rn){this.col=c;this.row=r;this.ownerId=o;this.range=rn;this.timer=180;this.exploded=false;} update(){if(this.exploded)return true;this.timer--;return this.timer<=0;} detonate(){this.timer=0;this.exploded=true;} draw(ctx){const f=SPRITES.BOMB_IDLE,i=Math.floor(state.frame/15)%f.length;drawSprite(ctx,f[i],this.col*CONFIG.TILE,this.row*CONFIG.TILE);}}
class Explosion{constructor(c,r,o,t){this.col=c;this.row=r;this.ownerId=o;this.timer=30;this.sprite=t==='center'?SPRITES.EXPLOSION_ANIM[0]:SPRITES.EXPLOSION_ANIM[1];} update(){this.timer--;checkPlayerHit(this.col,this.row,state.localPlayer,this.ownerId);for(let p in state.players)checkPlayerHit(this.col,this.row,state.players[p],this.ownerId);const i=items.findIndex(x=>x.c===this.col&&x.row===this.row);if(i!==-1&&!items[i].hidden)items.splice(i,1);return this.timer<=0;} draw(ctx){const f=this.timer>15?0:1;drawSprite(ctx,SPRITES.EXPLOSION_ANIM[f],this.col*CONFIG.TILE,this.row*CONFIG.TILE);}}
class Particle{constructor(x,y,c){this.x=x;this.y=y;this.vx=(Math.random()-0.5)*3;this.vy=(Math.random()-0.5)*3;this.life=Math.random()*15+10;this.color=c;} update(){this.x+=this.vx;this.y+=this.vy;this.life--;return this.life>0;} draw(ctx){ctx.fillStyle=this.color;ctx.globalAlpha=this.life/25;ctx.fillRect(this.x,this.y,3,3);ctx.globalAlpha=1;}}
function spawnParticles(c,r,t){const x=c*CONFIG.TILE+16,y=r*CONFIG.TILE+16;const col=t==='brick'?['#7f8c8d','#95a5a6']:['#f1c40f','#e67e22','#e74c3c'];for(let i=0;i<6;i++)particles.push(new Particle(x,y,col[Math.floor(Math.random()*col.length)]));}

function checkPlayerHit(c,r,p,k){if(!p||p.isDead||state.winner)return;if(Math.round(p.x/CONFIG.TILE)===c&&Math.round(p.y/CONFIG.TILE)===r){p.die();updateScore(k,p.id);}}
function updateScore(k,v){if(state.processingDeath||state.winner)return;state.processingDeath=true;setTimeout(()=>state.processingDeath=false,500);if(k===v)state.scores[k]=Math.max(0,(state.scores[k]||0)-1);else{if(!state.scores[k])state.scores[k]=0;state.scores[k]++;}renderLobbySlots();checkWinCondition();}
function checkWinCondition(){
    if(state.mode==='PVP'){
        for(let p in state.scores)if(state.scores[p]>=CONFIG.WIN_SCORE){const n=state.lobbyPlayers[p]?.name||`P${p}`;endGame(n,`Llegó a ${CONFIG.WIN_SCORE} pts`);return;}
    } else {
        // COOP WIN: No bots left
        const bots=Object.values(state.players).filter(p=>p instanceof AIPlayer && !p.isDead);
        if(bots.length===0){endGame("EQUIPO", "¡Enemigos derrotados!");return;}
        // COOP LOSE: All humans dead
        const humans=[state.localPlayer,...Object.values(state.players).filter(p=>!(p instanceof AIPlayer))];
        if(humans.every(h=>h.isDead)){endGame("IA", "Jugadores eliminados");return;}
    }
}
function endGame(w,r){state.winner=w;document.getElementById('game-over-overlay').style.display='flex';document.getElementById('winner-text').innerText=`GANADOR ${w}`;document.getElementById('winner-reason').innerText=r;}
function updateHUD(){const t=document.getElementById('timer-box');if(t){t.innerText=state.timeLeft;t.style.color=state.timeLeft<10?'#e74c3c':'#fff';}}
function drawSprite(ctx,c,x,y,idx=-1){if(!assets.loaded||!c)return;let s=assets.spritesheet;if(idx>=0&&assets.coloredSheets[idx])s=assets.coloredSheets[idx];ctx.drawImage(s,c.x*32,c.y*32,32,32,x,y,32,32);}

// --- MAIN ---
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d'),net=new Net();
window.onload=()=>{loadAssets(); document.addEventListener('click', ()=> { if(audioCtx.state==='suspended') audioCtx.resume(); }, {once:true});};
function init(){ctx.imageSmoothingEnabled=false;window.addEventListener('resize',resizeViewport);setupInputs();if('ontouchstart'in window||navigator.maxTouchPoints>0)document.getElementById('gamepad-area').style.display='flex';resizeViewport();requestAnimationFrame(gameLoop);window.addEventListener('contextmenu',e=>e.preventDefault());}
function createRoom(m){const v=document.getElementById('create-room-id').value.trim().toUpperCase();if(!v){alert("Ingresa un nombre para la sala");return;}state.mode=m;document.getElementById('roomInput').value=v;connectToServer();}
function connectToServer(){const r=document.getElementById('roomInput').value;if(!r)return;document.getElementById('btnConnect').disabled=true;document.getElementById('btnConnect').innerText="...";net.connect(r.toUpperCase());}
function enterLobby(id){state.status='LOBBY';document.getElementById('screen-login').style.display='none';document.getElementById('screen-main-menu').style.display='none';document.getElementById('screen-mode-select').style.display='none';document.getElementById('screen-lobby').style.display='flex';sendProfileUpdate();if(id===1){document.getElementById('btnStartGame').style.display='block';document.getElementById('btnStartGame').disabled=false;document.getElementById('lobby-msg').innerText="Eres el HOST.";}}
function hostStartGame(){
    if(net.id!==1)return;
    let lvl=parseInt(document.getElementById('set-level').value), den=parseFloat(document.getElementById('set-density').value);
    let itemsAllowed=[]; if(document.getElementById('chk-fire').checked)itemsAllowed.push(ITEM_TYPE.FIRE);if(document.getElementById('chk-bomb').checked)itemsAllowed.push(ITEM_TYPE.BOMB);if(document.getElementById('chk-speed').checked)itemsAllowed.push(ITEM_TYPE.SPEED);
    if(state.mode==='COOP'){lvl=1;den=0.2;itemsAllowed=[1,2,3];}
    currentLevel=(lvl===0)?(Math.random()>0.5?2:1):lvl; generateMap(den, itemsAllowed, state.mode==='COOP');
    state.timeLeft=CONFIG.ROUND_TIME; net.broadcast({t:'start',grid:mapGrid,lvl:currentLevel,items:items}); beginGameLoop();
}
function beginGameLoop(){
    state.status='GAME';document.getElementById('screen-lobby').style.display='none';document.getElementById('hud-container').style.display='flex';document.getElementById('hud').style.display='flex';for(let i=1;i<=4;i++)document.getElementById(`p${i}-score`).style.display='block'; playSound('start');
    const i=getSpawnInfo(net.id), d=state.lobbyPlayers[net.id]||{name:`P${net.id}`,colorIdx:0}; state.localPlayer=new Player(net.id,i.x,i.y,d.name,d.colorIdx);
    for(let p in state.lobbyPlayers){const pid=parseInt(p);if(pid!==net.id){const pi=getSpawnInfo(pid),pd=state.lobbyPlayers[pid];state.players[pid]=new Player(pid,pi.x,pi.y,pd.name,pd.colorIdx);}}
    if(net.id===1 && state.mode==='COOP'){spawnBots(3);} // Spawn 3 bots for host
    updateStatsUI();
}
function onNetData(d,pid){
    const tid=d.id||pid;
    if(d.t==='profile_update'){updateLobbyData(d.id,d.name,d.cIdx,d.rdy);return;}
    if(d.t==='chat'&&pid!==net.id){const p=state.lobbyPlayers[pid];appendChat(p?p.name:`P${pid}`,p?p.colorIdx:0,d.txt);return;}
    if(d.t==='lobby_sync_full'){state.mode=d.mode||'PVP';for(let p in d.list)updateLobbyData(p,d.list[p].name,d.list[p].colorIdx,d.list[p].isReady);return;}
    if(state.status==='LOBBY'&&d.t==='start'){mapGrid=d.grid;currentLevel=d.lvl;items=d.items;beginGameLoop();return;}
    if(state.status==='GAME'){
        if(d.t==='tick'){state.timeLeft=d.time;updateHUD();return;}
        if(d.t==='game_over'){const n=state.lobbyPlayers[d.winner]?.name||`P${d.winner}`;endGame(n,"¡Tiempo!");return;}
        if(d.t==='reset_round'){mapGrid=d.grid;currentLevel=d.lvl;items=d.items;if(state.localPlayer)state.localPlayer.reset();for(let k in state.players)state.players[k].reset();return;}
        if(d.t==='pickup'){items.splice(d.idx,1); playSound('item');}
        let p=state.players[tid];
        if(d.t==='m'){
            if(tid===net.id)return;
            if(!p){
                if(tid<0) state.players[tid]=new AIPlayer(tid,0,0); // Bot ghost
                else {const i=getSpawnInfo(tid),pd=state.lobbyPlayers[tid]||{name:`P${tid}`,colorIdx:0};state.players[tid]=new Player(tid,i.x,i.y,pd.name,pd.colorIdx);}
                p=state.players[tid];
            }
            // Lógica de Suavizado (Lag Smoothing):
            // Solo forzamos la posición (snap) si el desync es mayor a 16px (medio tile). Si no, dejamos que interpole hacia targetX/Y.
            if(Math.abs(p.x-d.x)>16 || Math.abs(p.y-d.y)>16){ p.x=d.x; p.y=d.y; }
            p.targetX=d.tx;p.targetY=d.ty;p.isMoving=true;if(d.a)p.animState=d.a;if(d.f!==undefined)p.facingLeft=d.f;if(d.s)p.stats.speed=d.s;
        }
        if(d.t==='b'){createBomb(d.c,d.r,d.oid,d.rng); playSound('bomb');}
        if(d.t==='respawn'&&p)p.reset();
    }
}
function getSpawnInfo(id){const x=(id===1||id===4)?1:CONFIG.COLS-2,y=(id===1||id===3)?1:CONFIG.ROWS-2;return{x:x,y:y};}
function generateMap(den=0.6, allowed=[1,2,3], coop=false){
    mapGrid=[];items=[];const safe=(c,r)=>(c<=2&&r<=2)||(c>=CONFIG.COLS-3&&r>=CONFIG.ROWS-3)||(c>=CONFIG.COLS-3&&r<=2)||(c<=2&&r>=CONFIG.ROWS-3);
    for(let r=0;r<CONFIG.ROWS;r++){let row=[];for(let c=0;c<CONFIG.COLS;c++){let t={type:TILE_TYPE.EMPTY};if(r===0||c===0||r===CONFIG.ROWS-1||c===CONFIG.COLS-1||(r%2===0&&c%2===0))t.type=TILE_TYPE.WALL;else if((!coop && !safe(c,r)) || (coop && c>2)){if(Math.random()<CONFIG.BRICK_DENSITY){t.type=TILE_TYPE.BRICK;if(allowed.length>0&&Math.random()<den){const rt=allowed[Math.floor(Math.random()*allowed.length)];items.push({c:c,r:r,type:rt,hidden:true});}}}row.push(t);}mapGrid.push(row);}
}
function spawnBots(n){
    let spawned=0;
    while(spawned<n){
        const r=Math.floor(Math.random()*(CONFIG.ROWS-4))+4; // Filas 4 a 10 (evita top)
        const c=Math.floor(Math.random()*(CONFIG.COLS-2))+1;
        if(mapGrid[r][c].type===TILE_TYPE.EMPTY){
            const id=-(spawned+1);
            state.players[id]=new AIPlayer(id,c,r);
            spawned++;
        }
    }
}
function createBomb(c,r,o,rng){mapGrid[r][c].type=TILE_TYPE.BOMB;bombs.push(new Bomb(c,r,o,rng));}
function explode(b){
    const cc=b.col,cr=b.row;if(state.localPlayer&&state.localPlayer.id===b.ownerId)state.localPlayer.activeBombs--;else if(state.players[b.ownerId])state.players[b.ownerId].activeBombs--;
    mapGrid[cr][cc].type=TILE_TYPE.EMPTY;explosions.push(new Explosion(cc,cr,b.ownerId,'center'));spawnParticles(cc,cr,'fire');
    const dirs=[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}]; playSound('exp');
    dirs.forEach(d=>{for(let i=1;i<=b.range;i++){const nc=cc+d.x*i,nr=cr+d.y*i;if(nc<0||nr<0||nc>=CONFIG.COLS||nr>=CONFIG.ROWS)break;const t=mapGrid[nr][nc].type;if(t===TILE_TYPE.WALL)break;if(t===TILE_TYPE.BRICK){mapGrid[nr][nc].type=TILE_TYPE.EMPTY;const it=items.find(x=>x.c===nc&&x.r===nr);if(it)it.hidden=false;explosions.push(new Explosion(nc,nr,b.ownerId,'mid'));spawnParticles(nc,nr,'brick');break;}else if(t===TILE_TYPE.BOMB){const ch=bombs.find(x=>x.col===nc&&x.row===nr&&!x.exploded);if(ch)ch.detonate();explosions.push(new Explosion(nc,nr,b.ownerId,'mid'));spawnParticles(nc,nr,'fire');}else{explosions.push(new Explosion(nc,nr,b.ownerId,'mid'));spawnParticles(nc,nr,'fire');}}});
}
function checkMapReset(){if(state.mode==='COOP')return;let h=false;for(let r=0;r<CONFIG.ROWS;r++)for(let c=0;c<CONFIG.COLS;c++)if(mapGrid[r][c].type===TILE_TYPE.BRICK){h=true;break;}if(!h){currentLevel=currentLevel===1?2:1;generateMap(0.25,[1,2,3]);if(state.localPlayer)state.localPlayer.reset();for(let k in state.players)state.players[k].reset();net.broadcast({t:'reset_round',grid:mapGrid,lvl:currentLevel,items:items});}}
function resizeViewport(){const h=document.getElementById('gamepad-area').style.display==='flex'?240:0;const sc=Math.min(window.innerWidth/CONFIG.WIDTH,(window.innerHeight-h-100)/CONFIG.HEIGHT);const vp=document.getElementById('game-viewport');vp.style.width=(CONFIG.WIDTH*sc)+"px";vp.style.height=(CONFIG.HEIGHT*sc)+"px";canvas.width=CONFIG.WIDTH;canvas.height=CONFIG.HEIGHT;ctx.imageSmoothingEnabled=false;}

let lastTime=0, accumulator=0; const STEP=1000/60;
function gameLoop(timestamp){
    if(!lastTime) lastTime=timestamp;
    let dt=timestamp-lastTime; lastTime=timestamp;
    if(dt>250) dt=250; // Evitar saltos grandes si la pestaña estaba inactiva
    accumulator+=dt;
    while(accumulator>=STEP){
        state.frame++;
        if(state.status==='GAME'){
            update();
            if(net.id===1&&!state.winner&&state.frame%60===0){
                state.timeLeft--;updateHUD();net.broadcast({t:'tick',time:state.timeLeft});
                if(state.timeLeft<=0){
                    if(state.mode==='COOP'){net.broadcast({t:'game_over',winner:'IA'});endGame("IA","Tiempo agotado");}
                    else{let max=-1,w=null;for(let p in state.scores)if(state.scores[p]>max){max=state.scores[p];w=p;}else if(state.scores[p]===max)w='EMPATE';
                    net.broadcast({t:'game_over',winner:w||1});endGame(state.lobbyPlayers[w]?.name||w||"EMPATE","Tiempo!");}
                }
            }
        }
        accumulator-=STEP;
    }
    if(state.status==='GAME') draw();
    requestAnimationFrame(gameLoop);
}
function update(){if(state.localPlayer)state.localPlayer.update();for(let p in state.players)state.players[p].update();for(let i=bombs.length-1;i>=0;i--){if(bombs[i].update()){explode(bombs[i]);bombs.splice(i,1);if(net.id===1)checkMapReset();}}for(let i=explosions.length-1;i>=0;i--)if(explosions[i].update())explosions.splice(i,1);for(let i=particles.length-1;i>=0;i--)if(!particles[i].update())particles.splice(i,1);}
function draw(){
    ctx.imageSmoothingEnabled=false;ctx.fillStyle="#111";ctx.fillRect(0,0,canvas.width,canvas.height);
    const ts=currentLevel===1?SPRITES.L1:SPRITES.L2;
    for(let r=0;r<CONFIG.ROWS;r++)for(let c=0;c<CONFIG.COLS;c++){
        const x=c*CONFIG.TILE,y=r*CONFIG.TILE,cell=mapGrid[r][c];
        drawSprite(ctx,ts.FLOOR,x,y);
        const it=items.find(i=>i.c===c&&i.r===r);
        if(it&&!it.hidden){let s=SPRITES.ITEM_FIRE;if(it.type===ITEM_TYPE.BOMB)s=SPRITES.ITEM_BOMB;if(it.type===ITEM_TYPE.SPEED)s=SPRITES.ITEM_SPEED;const off=Math.sin(state.frame*0.1)*2;drawSprite(ctx,s,x,y+off);}
        if(cell.type===TILE_TYPE.WALL)drawSprite(ctx,ts.WALL_S,x,y);else if(cell.type===TILE_TYPE.BRICK)drawSprite(ctx,ts.WALL_B,x,y);
    }
    bombs.forEach(b=>b.draw(ctx));explosions.forEach(e=>e.draw(ctx));
    particles.forEach(p=>p.draw(ctx));
    const all=[];if(state.localPlayer)all.push(state.localPlayer);for(let p in state.players)all.push(state.players[p]);all.sort((a,b)=>a.y-b.y);all.forEach(p=>p.draw(ctx));
}
function setupInputs(){const set=(x,y)=>{state.input.x=x;state.input.y=y;state.input.active=(x!==0||y!==0);};window.addEventListener('keydown',e=>{if(e.repeat)return;if(['ArrowUp','w'].includes(e.key))set(0,-1);if(['ArrowDown','s'].includes(e.key))set(0,1);if(['ArrowLeft','a'].includes(e.key))set(-1,0);if(['ArrowRight','d'].includes(e.key))set(1,0);if(e.code==='Space'&&state.localPlayer)state.localPlayer.placeBomb();});window.addEventListener('keyup',e=>{if(['ArrowUp','w','ArrowDown','s','ArrowLeft','a','ArrowRight','d'].includes(e.key))set(0,0);});const b=document.getElementById('action-btn');b.addEventListener('touchstart',e=>{e.preventDefault();if(state.localPlayer)state.localPlayer.placeBomb();},{passive:false});bindTouch('btn-up',0,-1);bindTouch('btn-down',0,1);bindTouch('btn-left',-1,0);bindTouch('btn-right',1,0);}
function bindTouch(id,x,y){const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();state.input.x=x;state.input.y=y;state.input.active=true;el.style.opacity="0.6";},{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();state.input.active=false;el.style.opacity="1";});}
function log(t){document.getElementById('login-log').innerText=t;}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;
function toggleMute(){
    isMuted = !isMuted;
    document.getElementById('btn-mute').innerText = isMuted ? '🔇' : '🔊';
    if(!isMuted && audioCtx.state === 'suspended') audioCtx.resume();
}
function triggerHaptic(ms){if(navigator.vibrate)navigator.vibrate(ms);}
function playSound(t){
    if(isMuted) return;
    if(audioCtx.state==='suspended') audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);
    const now=audioCtx.currentTime;
    if(t==='bomb'){o.frequency.setValueAtTime(600,now);o.frequency.exponentialRampToValueAtTime(100,now+0.1);g.gain.setValueAtTime(0.3,now);g.gain.exponentialRampToValueAtTime(0.01,now+0.1);o.start(now);o.stop(now+0.1);}
    if(t==='exp'){o.type='sawtooth';o.frequency.setValueAtTime(100,now);o.frequency.exponentialRampToValueAtTime(10,now+0.3);g.gain.setValueAtTime(0.5,now);g.gain.exponentialRampToValueAtTime(0.01,now+0.3);o.start(now);o.stop(now+0.3);}
    if(t==='item'){o.type='square';o.frequency.setValueAtTime(600,now);o.frequency.setValueAtTime(1200,now+0.1);g.gain.setValueAtTime(0.1,now);g.gain.linearRampToValueAtTime(0.01,now+0.2);o.start(now);o.stop(now+0.2);}
    if(t==='start'){o.type='triangle';o.frequency.setValueAtTime(440,now);o.frequency.linearRampToValueAtTime(880,now+0.5);g.gain.setValueAtTime(0.3,now);g.gain.linearRampToValueAtTime(0.01,now+1);o.start(now);o.stop(now+1);}
}
function sendChat(){
    const inp=document.getElementById('chat-input'),txt=inp.value.trim(); if(!txt)return;
    appendChat(myProfile.name||`P${net.id}`,myProfile.colorIdx,txt); net.send({t:'chat',txt:txt}); inp.value='';
}
function appendChat(n,cIdx,t){
    const h=document.getElementById('chat-history'),d=document.createElement('div'); d.className='chat-msg';
    const c=PALETTE[cIdx]?.hex||'#fff',s=document.createElement('span'); s.style.color=c; s.textContent=n+': ';
    d.appendChild(s); d.appendChild(document.createTextNode(t)); h.appendChild(d); h.scrollTop=h.scrollHeight;
}
