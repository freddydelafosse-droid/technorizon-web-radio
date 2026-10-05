function parisParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const dow = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 }[v.weekday] || 1;
  return { h:Number(v.hour), m:Number(v.minute), dow };
}

function h24Allowed(h,m,dow) {
  let H=h, M;
  if (m < 13) M=13;
  else if (m < 33) M=33;
  else if (m < 53) M=53;
  else { H=(h+1)%24; M=13; }

  let ok=false;
  if (dow>=1 && dow<=5) {
    if (H===5 && M===13) ok=true;
    else if (H>=6 && H<13) ok=true;
    else if (H>=13 && H<16 && (M===13 || M===33)) ok=true;
    else if (H>=16 && H<20) ok=true;
    else if (H>=20 && H<22 && (M===13 || M===33)) ok=true;
    else if (H===22 && M===13) ok=true;
  } else if (dow===6) {
    if (H===5 && M===13) ok=true;
    else if (H>=6 && H<13) ok=true;
    else if (H>=13 && H<17 && M===13) ok=true;
    else if (H>=17 && H<23) ok=true;
  } else {
    if (H>=9 && H<21 && (M===13 || M===33 || M===53)) ok=true;
  }

  if ((H===7 || H===8) && (M===13 || M===33)) ok=false;
  if ([6,8,10,12,13,15,17,18].includes(H) && M===53) ok=false;
  if ([6,8,10].includes(h) && m>=45) ok=false;
  if ([7,8].includes(h) && m>=5 && m<=30) ok=false;
  if ([12,13,15,17,18].includes(h) && m>=10 && m<=35) ok=false;
  return ok;
}

function editorialAction(h,m) {
  if (h===6 && m>=45) return {action:"weather-now"};
  if (h===7 && m<=15) return {action:"weather-now"};
  if (h===8 && m>=45) return {action:"flash-replay",period:"07"};
  if (h===9 && m<=15) return {action:"flash-replay",period:"07"};
  if (h===10 && m>=45) return {action:"weather-now"};
  if (h===11 && m<=15) return {action:"weather-now"};
  if (h===12 && m>=15 && m<=45) return {action:"flash-replay",period:"11"};
  if (h===13 && m>=15 && m<=45) return {action:"weather-now"};
  if (h===15 && m>=15 && m<=45) return {action:"flash-replay",period:"13"};
  if (h===17 && m>=15 && m<=45) return {action:"weather-now"};
  if (h===18 && m>=15 && m<=45) return {action:"flash-replay",period:"17"};
  if (h===7 && m>=13 && m<=28) return {action:"horoscope-generate"};
  if ((h===7 && m>=55) || (h===8 && m<=28)) return {action:"horoscope-replay"};
  return null;
}

module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if (req.method!=="GET") return res.status(405).json({ok:false,error:"GET only"});
  const secret=process.env.CRON_SECRET;
  if (!secret || req.headers.authorization!=="Bearer "+secret) return res.status(401).json({ok:false,error:"Unauthorized"});

  const {h,m,dow}=parisParts();
  const editorial=editorialAction(h,m);
  const body=editorial || (h24Allowed(h,m,dow) ? null : undefined);
  if (body===undefined) return res.status(200).json({ok:true,state:"IDLE",paris:{h,m,dow}});

  const target="https://www.technorizon.fr/api/azuracast-test";
  const options={headers:{Authorization:"Bearer "+secret,"Content-Type":"application/json"}};
  if (body) { options.method="POST"; options.body=JSON.stringify(body); }
  const r=await fetch(target,options);
  const text=await r.text();
  res.status(r.status);
  res.setHeader("Content-Type",r.headers.get("content-type")||"application/json");
  return res.send(text);
};
