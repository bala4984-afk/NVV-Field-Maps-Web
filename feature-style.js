(function(root){
 const icons={circle:'●',square:'■',diamond:'◆',tower:'♜',pin:'📍'};
 const color=(v,d)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:d;
 const num=(v,d,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
 function get(f){const s=f.style||{};return {color:color(s.color,color(f.sourceColor,f.type==='Polygon'?'#377e58':f.group==='final'?'#637e96':f.group==='village'?'#8c5f9c':'#d99a31')),width:num(s.width,3,1,15),dash:s.dash==='dashed'?'dashed':'solid',fillColor:color(s.fillColor,'#377e58'),fillOpacity:num(s.fillOpacity,0.12,0,1),icon:icons[s.icon]?s.icon:'circle',size:num(s.size,18,10,48),labels:s.labels!==false,labelColor:color(s.labelColor,'#17343f'),labelSize:num(s.labelSize,12,8,24)}}
 function path(f){const s=get(f);return {color:s.color,weight:s.width,dashArray:s.dash==='dashed'?'8 6':null,fillColor:s.fillColor,fillOpacity:s.fillOpacity}}
 function label(f,text){const e=document.createElement('span'),s=get(f);e.textContent=text;e.style.color=s.labelColor;e.style.fontSize=s.labelSize+'px';return e}
 function icon(f,selected=false){const s=get(f),paths={circle:'<circle cx="12" cy="12" r="8"/>',square:'<rect x="4" y="4" width="16" height="16" rx="2"/>',diamond:'<path d="M12 2 22 12 12 22 2 12Z"/>',tower:'<path d="M12 2 4 22h16L12 2ZM7 9h10M5 14h14M8 18h8" fill="none" stroke-width="2"/>',pin:'<path d="M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13Z"/><circle cx="12" cy="9" r="3" fill="white" stroke="none"/>'};return L.divIcon({className:'styled-point'+(selected?' selected-feature':''),html:`<svg viewBox="0 0 24 24" width="${s.size}" height="${s.size}" fill="${s.color}" stroke="${s.color}" aria-hidden="true">${paths[s.icon]}</svg>`,iconSize:[s.size,s.size],iconAnchor:[s.size/2,s.size/2]})}
 function kml(f){const s=get(f),c=(v,a=1)=>Math.round(a*255).toString(16).padStart(2,'0')+v.slice(5,7)+v.slice(3,5)+v.slice(1,3);return `<Style><LineStyle><color>${c(s.color)}</color><width>${s.width}</width></LineStyle><PolyStyle><color>${c(s.fillColor,s.fillOpacity)}</color></PolyStyle><IconStyle><color>${c(s.color)}</color><scale>${s.size/24}</scale></IconStyle><LabelStyle><color>${c(s.labelColor)}</color><scale>${s.labels?s.labelSize/12:0}</scale></LabelStyle></Style>`}
 root.FeatureStyle={get,path,label,icon,kml,icons};if(typeof module!=='undefined')module.exports=root.FeatureStyle;
})(typeof window==='undefined'?globalThis:window);

