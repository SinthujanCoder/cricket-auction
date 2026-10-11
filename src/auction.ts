export type Player = {id:string;name:string;role:string;country:string;base:number;photo:string;status:'waiting'|'sold'|'unsold';team?:string;price?:number};
export type Team = {id:string;name:string;short:string;color:string;budget:number;limit:number};
export type Settings = {name:string;season:string;currency:string;accent:string};
export type State = {players:Player[];teams:Team[];settings:Settings;active:string|null;bid:number;team:string;history:string[]};
export const initial:State = {
 settings:{name:'Colombo Premier League',season:'2026',currency:'LKR',accent:'#dfb86c'},active:'p1',bid:5000,team:'t1',history:[],
 teams:[{id:'t1',name:'Colombo Kings',short:'CK',color:'#dfb86c',budget:150000,limit:11},{id:'t2',name:'Galle Gladiators',short:'GG',color:'#b0a0dd',budget:150000,limit:11},{id:'t3',name:'Kandy Falcons',short:'KF',color:'#82b3ab',budget:150000,limit:11},{id:'t4',name:'Jaffna Stallions',short:'JS',color:'#d99179',budget:150000,limit:11}],
 players:[['p1','Kavindu Perera','All-rounder','Sri Lanka','12'],['p2','Ashan Fernando','Batter','Sri Lanka','13'],['p3','Dinesh Silva','Bowler','Sri Lanka','14'],['p4','Ruwan Jayasuriya','Wicketkeeper','Sri Lanka','15'],['p5','Nimal Rajapaksa','Batter','Sri Lanka','16'],['p6','Tharindu Mendis','Bowler','Sri Lanka','17'],['p7','Sachin de Alwis','All-rounder','Sri Lanka','18'],['p8','Kasun Wickrama','Batter','Sri Lanka','19']].map(([id,name,role,country])=>({id,name,role,country,base:5000,photo:'',status:'waiting'}))
};
export const spent = (s:State,id:string) => s.players.filter(p=>p.status==='sold'&&p.team===id).reduce((v,p)=>v+(p.price||0),0);
export function sell(s:State):State {
 const p=s.players.find(p=>p.id===s.active); const t=s.teams.find(t=>t.id===s.team);
 if(!p||p.status!=='waiting'||!t) throw new Error('Choose an eligible player and team.');
 if(!Number.isFinite(s.bid)||s.bid<p.base) throw new Error('The final bid must meet the base price.');
 if(s.bid>t.budget-spent(s,t.id)) throw new Error('This team does not have enough budget.');
 if(s.players.filter(p=>p.team===t.id&&p.status==='sold').length>=t.limit) throw new Error('This team’s squad is full.');
 return {...s,players:s.players.map(x=>x.id===p.id?{...x,status:'sold',team:t.id,price:s.bid}:x),history:[`${p.name} → ${t.name}`,...s.history].slice(0,20)};
}
export function selectRandom(players:Player[]):Player|undefined {
 const pool=players.filter(p=>p.status==='waiting'); if(!pool.length)return;
 const a=new Uint32Array(1); const bound=Math.floor(4294967296/pool.length)*pool.length; do{crypto.getRandomValues(a);}while(a[0]>=bound); return pool[a[0]%pool.length];
}
export function load():State { try { const raw=localStorage.getItem('bidxi-v1');if(raw){const x=JSON.parse(raw);if(Array.isArray(x.players)&&Array.isArray(x.teams)&&x.settings)return x;} }catch{}return structuredClone(initial); }
