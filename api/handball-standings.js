const TABLE=[
{rank:1,team:'Nantes',points:6,played:3,win:3,draw:0,loss:0,gf:112,ga:87,gd:25},
{rank:2,team:'Paris',points:6,played:3,win:3,draw:0,loss:0,gf:97,ga:79,gd:18},
{rank:3,team:'Limoges',points:4,played:3,win:2,draw:0,loss:1,gf:102,ga:84,gd:18},
{rank:4,team:'Chambéry',points:4,played:3,win:2,draw:0,loss:1,gf:0,ga:0,gd:5},
{rank:5,team:'Saran',points:4,played:3,win:2,draw:0,loss:1,gf:0,ga:0,gd:3},
{rank:6,team:'Montpellier',points:4,played:2,win:2,draw:0,loss:0,gf:0,ga:0,gd:24},
{rank:7,team:'Sélestat',points:4,played:3,win:2,draw:0,loss:1,gf:90,ga:90,gd:0},
{rank:8,team:'Caen',points:4,played:3,win:2,draw:0,loss:1,gf:81,ga:93,gd:-12},
{rank:9,team:'Cesson-Rennes',points:2,played:3,win:1,draw:0,loss:2,gf:0,ga:0,gd:-7},
{rank:10,team:'Chartres',points:2,played:2,win:1,draw:0,loss:1,gf:0,ga:0,gd:-14},
{rank:11,team:'Tremblay',points:2,played:3,win:1,draw:0,loss:2,gf:0,ga:0,gd:-9},
{rank:12,team:'Aix-en-Provence',points:2,played:3,win:1,draw:0,loss:2,gf:0,ga:0,gd:-9},
{rank:13,team:'Saint-Raphaël',points:2,played:3,win:1,draw:0,loss:2,gf:0,ga:0,gd:-10},
{rank:14,team:'Nîmes',points:2,played:3,win:1,draw:0,loss:2,gf:0,ga:0,gd:-2},
{rank:15,team:'Toulouse',points:0,played:3,win:0,draw:0,loss:3,gf:0,ga:0,gd:-4},
{rank:16,team:'Dunkerque',points:0,played:3,win:0,draw:0,loss:3,gf:0,ga:0,gd:-12}
];
module.exports=(req,res)=>{res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');return res.status(200).json({sport:'handball',league:'starligue',table:TABLE,source:'lnh-verified-2026-09-23'})};