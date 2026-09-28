// Figma Plugin API script (run with the Figma MCP use_figma tool, file NJrigbzm5n21AUx4S1Agbg).
// Builds the "Admin" page with the admin overview screen (header, analytics, weather) in the brand palette.
// Not yet run: the Figma Starter plan's MCP call limit was reached on 27 Sep 2026. Numbers are sample data.
const page = figma.createPage(); page.name = 'Admin';
await figma.setCurrentPageAsync(page);
const F='Plus Jakarta Sans';
for (const s of ['Regular','Medium','SemiBold','Bold','ExtraBold']) await figma.loadFontAsync({family:F,style:s});
const hex=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const fill=h=>[{type:'SOLID',color:hex(h)}];
const C={leaf800:'#123D27',leaf900:'#0B2718',leaf700:'#1A5236',leaf50:'#EDF5EF',node300:'#3BC6D9',node600:'#126B7A',cream:'#FAF7F0',ink:'#1E2528',muted:'#5B6568',line:'#E3DED2',white:'#FFFFFF',harvest50:'#FDF5E1',harvest700:'#8A5A08',web:'#2F7F47',mobile:'#1E9BB0',agent:'#C98A14',nf:'#B4533A'};
const txt=(parent,chars,size,style='Regular',color=C.ink,opts={})=>{const t=figma.createText();t.fontName={family:F,style};t.characters=chars;t.fontSize=size;t.fills=fill(color);if(opts.lh)t.lineHeight={unit:'PIXELS',value:opts.lh};parent.appendChild(t);if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,t.height);}if(opts.fillW){t.layoutSizingHorizontal='FILL';t.textAutoResize='HEIGHT';}return t;};
const al=(parent,dir,props={})=>{const f=figma.createAutoLayout(dir,props);f.fills=props.bg?fill(props.bg):[];if(parent)parent.appendChild(f);return f;};
const card=(parent,props={})=>{const f=al(parent,'VERTICAL',{itemSpacing:16,paddingTop:24,paddingBottom:24,paddingLeft:24,paddingRight:24,bg:C.white,...props});f.cornerRadius=16;f.strokes=fill(C.line);f.strokeWeight=1;return f;};
const logoSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#123D27"/><path d="M13 20h7M28 12.2 20 20l8 7.8" fill="none" stroke="#3BC6D9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/><path d="M28 12.2A11 11 0 1 0 28 27.8" fill="none" stroke="#FAF7F0" stroke-width="3.2" stroke-linecap="round"/><circle cx="28" cy="12.2" r="2.9" fill="#3BC6D9"/><circle cx="28" cy="27.8" r="2.9" fill="#3BC6D9"/><circle cx="9" cy="20" r="2.9" fill="#EFC150"/><circle cx="20" cy="20" r="3.4" fill="#78BB8A"/></svg>';

// Screen
const screen=al(null,'VERTICAL',{name:'Admin · Overview 1440',bg:C.cream});
screen.x=0;screen.y=0;screen.resize(1440,100);screen.primaryAxisSizingMode='AUTO';screen.counterAxisSizingMode='FIXED';

// Header
const header=al(screen,'HORIZONTAL',{name:'Header',bg:C.leaf800,paddingLeft:120,paddingRight:120,paddingTop:14,paddingBottom:14,itemSpacing:24,counterAxisAlignItems:'CENTER'});
header.layoutSizingHorizontal='FILL';
const brand=al(header,'HORIZONTAL',{itemSpacing:10,counterAxisAlignItems:'CENTER'});
const mark=figma.createNodeFromSvg(logoSvg);mark.resize(36,36);mark.name='Logo mark';brand.appendChild(mark);
const wm=txt(brand,'CultivaNode',20,'ExtraBold',C.cream);wm.setRangeFills(7,11,fill(C.node300));
const badge=al(brand,'HORIZONTAL',{paddingLeft:8,paddingRight:8,paddingTop:3,paddingBottom:3,bg:C.node300});badge.cornerRadius=99;txt(badge,'ADMIN',11,'Bold',C.leaf900);
const nav=al(header,'HORIZONTAL',{itemSpacing:4,counterAxisAlignItems:'CENTER'});nav.layoutGrow=1;nav.primaryAxisAlignItems='CENTER';
['Overview','Approvals','Users','Inbox','Privacy requests','Website','Audit','Integrations'].forEach((l,i)=>{const it=al(nav,'HORIZONTAL',{paddingLeft:12,paddingRight:12,paddingTop:8,paddingBottom:8,bg:i===0?'#1F5A3A':undefined});it.cornerRadius=8;if(i!==0)it.fills=[];txt(it,l,14,'SemiBold',i===0?C.white:'#D5E3DA');});
const so=al(header,'HORIZONTAL',{paddingLeft:16,paddingRight:16,paddingTop:9,paddingBottom:9});so.cornerRadius=10;so.strokes=[{type:'SOLID',color:hex('#FFFFFF'),opacity:0.6}];so.strokeWeight=2;txt(so,'Sign out',14,'Bold',C.white);

// Body
const body=al(screen,'VERTICAL',{name:'Body',paddingLeft:120,paddingRight:120,paddingTop:40,paddingBottom:64,itemSpacing:32});body.layoutSizingHorizontal='FILL';
const intro=al(body,'VERTICAL',{itemSpacing:6});intro.layoutSizingHorizontal='FILL';
txt(intro,'Welcome, Quadri',32,'ExtraBold',C.leaf800);
txt(intro,'Super admin · what is happening on CultivaNode in the pilot states',16,'Regular',C.muted);

// Analytics header + period switch
const ah=al(body,'HORIZONTAL',{counterAxisAlignItems:'CENTER'});ah.layoutSizingHorizontal='FILL';ah.primaryAxisAlignItems='SPACE_BETWEEN';
txt(ah,'Analytics',24,'Bold',C.ink);
const seg=al(ah,'HORIZONTAL',{paddingLeft:4,paddingRight:4,paddingTop:4,paddingBottom:4,itemSpacing:4,bg:C.white});seg.cornerRadius=12;seg.strokes=fill(C.line);
['7 days','30 days','90 days'].forEach((l,i)=>{const b=al(seg,'HORIZONTAL',{paddingLeft:14,paddingRight:14,paddingTop:7,paddingBottom:7,bg:i===1?C.leaf800:undefined});b.cornerRadius=9;if(i!==1)b.fills=[];txt(b,l,13,'Bold',i===1?C.white:C.ink);});

// KPI tiles
const kpis=al(body,'HORIZONTAL',{itemSpacing:20,name:'KPI tiles'});kpis.layoutSizingHorizontal='FILL';
[['People signed up','248','+18% vs previous 30 days',C.leaf700],['Finished set-up','191','77% of sign-ups',C.leaf700],['Awaiting approval','12','3 older than 48 h',C.harvest700],['Website page views','5,430','+9% vs previous 30 days',C.leaf700]].forEach(([l,v,d,dc])=>{const k=card(kpis,{itemSpacing:6});k.layoutGrow=1;txt(k,l,14,'SemiBold',C.muted);txt(k,v,36,'ExtraBold',C.ink);txt(k,d,13,'SemiBold',dc);});

// Charts row
const row=al(body,'HORIZONTAL',{itemSpacing:20});row.layoutSizingHorizontal='FILL';
const c1=card(row);c1.layoutGrow=1;
txt(c1,'Sign-ups per day, by channel',18,'Bold');
const legend=al(c1,'HORIZONTAL',{itemSpacing:16});
[['Website',C.web],['Mobile app',C.mobile],['Field agent',C.agent],['Did not finish',C.nf]].forEach(([l,c])=>{const g=al(legend,'HORIZONTAL',{itemSpacing:6,counterAxisAlignItems:'CENTER'});const d=figma.createRectangle();d.resize(10,10);d.cornerRadius=3;d.fills=fill(c);g.appendChild(d);txt(g,l,13,'Medium',C.muted);});
const plot=figma.createFrame();plot.name='Stacked columns';plot.resize(540,200);plot.fills=[];c1.appendChild(plot);plot.layoutSizingHorizontal='FILL';
const data=[[3,2,1,1],[4,3,0,1],[5,2,2,0],[2,4,1,1],[6,3,2,1],[5,5,1,0],[3,2,0,1],[7,4,3,1],[6,3,2,2],[8,5,2,1],[5,6,3,1],[9,4,2,0],[7,6,3,1],[10,5,4,2]];
const W=560,H=200,bw=26,gap=(W-14*bw)/14,scale=H/22;
for(let g=0;g<=2;g++){const ln=figma.createRectangle();ln.resize(W,1);ln.y=H-g*10*scale;ln.fills=fill('#ECE7DC');plot.appendChild(ln);}
data.forEach((d,i)=>{let y=H;d.forEach((v,j)=>{if(!v)return;const r=figma.createRectangle();r.resize(bw,v*scale-2);y-=v*scale;r.x=gap/2+i*(bw+gap);r.y=y+1;r.fills=fill([C.web,C.mobile,C.agent,C.nf][j]);r.topLeftRadius=j===d.length-1||d.slice(j+1).every(x=>!x)?4:0;r.topRightRadius=r.topLeftRadius;plot.appendChild(r);});});
const xl=al(c1,'HORIZONTAL');xl.layoutSizingHorizontal='FILL';xl.primaryAxisAlignItems='SPACE_BETWEEN';['14 Sep','21 Sep','27 Sep'].forEach(s=>txt(xl,s,12,'Medium',C.muted));
txt(c1,'Table view available · gold bars are labelled for contrast',12,'Regular',C.muted);

const c2=card(row);c2.resize(420,c2.height);c2.layoutSizingHorizontal='FIXED';
txt(c2,'Users by role',18,'Bold');
[['Crop farmer',142],['Farm hand',96],['Livestock farmer',41],['Machinery owner',23],['Input dealer',17],['Buyer / off-taker',11]].forEach(([l,v])=>{const r=al(c2,'VERTICAL',{itemSpacing:6});r.layoutSizingHorizontal='FILL';const top=al(r,'HORIZONTAL');top.layoutSizingHorizontal='FILL';top.primaryAxisAlignItems='SPACE_BETWEEN';txt(top,l,14,'Medium');txt(top,String(v),14,'Bold');const track=figma.createFrame();track.resize(372,8);track.cornerRadius=4;track.fills=fill('#EEF1EE');r.appendChild(track);track.layoutSizingHorizontal='FILL';const b=figma.createRectangle();b.resize(Math.round(372*v/142),8);b.cornerRadius=4;b.fills=fill(C.leaf700);track.appendChild(b);});

// Row 2: states + verification
const row2=al(body,'HORIZONTAL',{itemSpacing:20});row2.layoutSizingHorizontal='FILL';
const c3=card(row2);c3.layoutGrow=1;txt(c3,'Users by state',18,'Bold');
[['Oyo',121],['Ogun',64],['Osun',48],['Ondo',39],['Ekiti',30],['Lagos',28]].forEach(([l,v])=>{const r=al(c3,'HORIZONTAL',{itemSpacing:12,counterAxisAlignItems:'CENTER'});r.layoutSizingHorizontal='FILL';const lb=txt(r,l,14,'Medium');lb.resize(60,lb.height);lb.textAutoResize='HEIGHT';const b=figma.createRectangle();b.resize(Math.round(420*v/121),14);b.cornerRadius=4;b.fills=fill(C.node600);r.appendChild(b);txt(r,String(v),14,'Bold');});
const c4=card(row2);c4.layoutGrow=1;txt(c4,'Verification and approvals',18,'Bold');
const steps=al(c4,'HORIZONTAL',{itemSpacing:12});steps.layoutSizingHorizontal='FILL';
[['Submitted','64',C.ink],['Approved','47',C.leaf700],['Waiting','12',C.harvest700],['Rejected','5','#9A3B26']].forEach(([l,v,c])=>{const s=al(steps,'VERTICAL',{itemSpacing:4,paddingTop:14,paddingBottom:14,paddingLeft:14,paddingRight:14,bg:C.cream});s.cornerRadius=12;s.layoutGrow=1;txt(s,v,28,'ExtraBold',c);txt(s,l,13,'SemiBold',C.muted);});
txt(c4,'Median time to decision: 19 h · target under 48 h',14,'Medium',C.muted);

// Weather
const wh=al(body,'VERTICAL',{itemSpacing:6});wh.layoutSizingHorizontal='FILL';
txt(wh,'Weather in the pilot states',24,'Bold');
txt(wh,'2 of 6 pilot states have a farm alert in the forecast. Alerts: rain ≥ 25 mm in a day, under 5 mm in 7 days, ≥ 36°C, wind ≥ 40 km/h.',14,'Regular',C.muted,{fillW:true});
const grid=al(body,'VERTICAL',{itemSpacing:20,name:'Weather cards'});grid.layoutSizingHorizontal='FILL';
const places=[['Oyo','Ibadan',28,'Partly cloudy',79,[[30,22,3],[31,23,0],[29,22,31],[30,22,8],[31,23,2],[32,23,0],[31,22,4]],'Heavy rain on Wed (31 mm): delay fertiliser and spraying, check drainage'],['Ogun','Abeokuta',29,'Cloudy',82,[[31,23,1],[31,23,4],[30,23,12],[31,23,6],[32,24,0],[31,23,3],[30,23,2]],null],['Osun','Osogbo',27,'Rain',88,[[28,21,14],[29,22,9],[28,21,27],[29,22,11],[30,22,5],[30,22,2],[29,21,6]],'Heavy rain on Wed (27 mm): delay fertiliser and spraying, check drainage'],['Ondo','Akure',27,'Drizzle',85,[[29,22,4],[30,22,3],[29,22,9],[30,22,2],[30,22,1],[31,23,0],[30,22,3]],null],['Ekiti','Ado-Ekiti',26,'Partly cloudy',80,[[29,21,2],[30,21,1],[29,21,6],[30,22,3],[30,22,0],[31,22,0],[30,21,2]],null],['Lagos','Ikeja',29,'Cloudy',84,[[31,25,6],[31,25,3],[30,24,11],[31,25,7],[31,25,2],[32,25,1],[31,25,5]],null]];
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let wrow;
places.forEach((p,i)=>{if(i%3===0){wrow=al(grid,'HORIZONTAL',{itemSpacing:20});wrow.layoutSizingHorizontal='FILL';}
  const w=card(wrow,{itemSpacing:12,paddingTop:20,paddingBottom:20,paddingLeft:20,paddingRight:20});w.layoutGrow=1;
  const top=al(w,'HORIZONTAL');top.layoutSizingHorizontal='FILL';top.primaryAxisAlignItems='SPACE_BETWEEN';
  const nm=al(top,'VERTICAL',{itemSpacing:2});txt(nm,p[0],16,'Bold');txt(nm,p[1],13,'Regular',C.muted);
  const now=al(top,'VERTICAL',{itemSpacing:0,counterAxisAlignItems:'MAX'});txt(now,`${p[2]}°C`,26,'ExtraBold');txt(now,`${p[3]} · ${p[4]}% humid`,12,'Regular',C.muted);
  const strip=al(w,'HORIZONTAL');strip.layoutSizingHorizontal='FILL';strip.primaryAxisAlignItems='SPACE_BETWEEN';
  p[5].forEach((d,j)=>{const col=al(strip,'VERTICAL',{itemSpacing:2,counterAxisAlignItems:'CENTER'});col.resize(44,10);col.counterAxisSizingMode='FIXED';txt(col,days[j],12,'SemiBold',C.muted);txt(col,`${d[0]}°`,13,'Bold');txt(col,`${d[1]}°`,12,'Regular',C.muted);txt(col,d[2]>=1?`${d[2]}mm`:'–',11,d[2]>=25?'Bold':'Regular',d[2]>=25?C.node600:C.muted);});
  if(p[6]){const a=al(w,'HORIZONTAL',{paddingLeft:10,paddingRight:10,paddingTop:8,paddingBottom:8,bg:C.harvest50});a.cornerRadius=8;a.layoutSizingHorizontal='FILL';txt(a,'⚠ '+p[6],13,'SemiBold',C.harvest700,{fillW:true});}
});
txt(body,'Powered by WeatherAPI.com. Updated 27 Sep, 10:00 (Lagos time).',12,'Regular',C.muted);
return {page:page.id,screen:screen.id,h:screen.height};
