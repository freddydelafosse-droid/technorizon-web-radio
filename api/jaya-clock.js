// Passerelle sécurisée QStash -> moteur Jaya.
// Phase 1: mode shadow uniquement. Elle décide ce qui serait dû à l'heure de Paris
// sans injecter quoi que ce soit à l'antenne. GitHub Actions reste donc actif.

function parisParts(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Europe/Paris",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const dow={Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[v.weekday]||0;
  return {hour:Number(v.hour),minute:Number(v.minute),dow};
}

function decision({hour:h,minute:m,dow}){
  const total=h*60+m;
  // Priorité 1: Infos + Météo / rediffusions.
  const editorial=[
    {from:6*60+45,to:7*60+15,action:"weather-now",target:"07:00"},
    {from:8*60+45,to:9*60+15,action:"flash-replay",period:"07",target:"09:00"},
    {from:10*60+45,to:11*60+15,action:"weather-now",target:"11:00"},
    {from:12*60+15,to:12*60+45,action:"flash-replay",period:"11",target:"12:30"},
    {from:13*60+15,to:13*60+45,action:"weather-now",target:"13:30"},
    {from:15*60+15,to:15*60+45,action:"flash-replay",period:"13",target:"15:30"},
    {from:17*60+15,to:17*60+45,action:"weather-now",target:"17:30"},
    {from:18*60+15,to:18*60+45,action:"flash-replay",period:"17",target:"18:30"}
  ];
  const ed=editorial.find(x=>total>=x.from&&total<=x.to);
  if(ed)return {kind:"editorial",...ed};

  // Priorité 2: Technoroscope.
  if(total>=7*60+13&&total<=7*60+28)return {kind:"horoscope",action:"horoscope-generate",target:"07:15"};
  if((total>=7*60+55&&total<=8*60+28))return {kind:"horoscope",action:"horoscope-replay",target:"08:15"};

  // Priorité 3: Jaya H24. Créneaux logiques :13/:33/:53.
  let th=h,tm=m<13?13:m<33?33:m<53?53:13;
  if(m>=53)th=(h+1)%24;
  let allow=false;
  if(dow>=1&&dow<=5)allow=th>=7&&th<23;
  else if(dow===6)allow=(th===5&&tm===13)||(th>=6&&th<13)||(th>=13&&th<17&&tm===13)||(th>=17&&th<23);
  else if(dow===7)allow=th>=9&&th<21;
  if(allow)return {kind:"h24",action:"h24",target:String(th).padStart(2,"0")+":"+String(tm).padStart(2,"0")};
  return {kind:"idle",action:"none"};
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({ok:false,error:"GET or POST only"});
  const secret=process.env.CRON_SECRET;
  const authorized=!!secret&&req.headers.authorization==="Bearer "+secret;
  // QStash signe les appels en production. Pendant la phase shadow, CRON_SECRET
  // reste le chemin de test explicite; aucune mutation antenne n'est autorisée ici.
  if(!authorized)return res.status(401).json({ok:false,error:"Unauthorized"});
  const p=parisParts();
  const due=decision(p);
  console.log("JAYA_QSTASH_SHADOW",JSON.stringify({...p,due}));
  return res.status(200).json({
    ok:true,mode:"shadow",source:"qstash-bridge",timezone:"Europe/Paris",
    paris:p,due,antenna_mutation:false,
    message:"Bridge ready; GitHub scheduler remains authoritative."
  });
}
