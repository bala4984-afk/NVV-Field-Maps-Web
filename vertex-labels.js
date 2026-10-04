/* Visible labels for all imported survey geometry, independent of selection. */
(()=>{
 const control=document.createElement('label');control.className='check';control.innerHTML='<input id="show-vertex-labels" type="checkbox" checked> Vertex labels';
 $('showactive').closest('label').after(control);
 const toggle=$('show-vertex-labels'),labels=L.layerGroup().addTo(map);
 try{toggle.checked=localStorage.getItem('line-survey-vertex-labels')!=='hidden'}catch{}
 function refresh(){
  labels.clearLayers();if(!toggle.checked)return;
  const bounds=map.getBounds().pad(0.05),occupied=new Set();
  for(const f of state.features){if(f.circle||!visible(f)||f.type==='Point'||!FeatureStyle.get(f).labels||group(f)==='village')continue;if(f.type==='LineString'&&((editSession&&f.id===selected)||map.getZoom()<13))continue;if(f.type==='Polygon'&&map.getZoom()<12&&f.id!==selected)continue;
   const closing=new Set();if(f.type==='Polygon'){let n=0;for(const size of f.ringLengths){n+=size;closing.add(n-1)}}
   f.points.forEach((p,i)=>{
    if(closing.has(i)||!bounds.contains([p.lat,p.lon]))return;
    const screen=map.latLngToContainerPoint([p.lat,p.lon]),cell=Math.floor(screen.x/90)+':'+Math.floor(screen.y/35);if(occupied.has(cell))return;occupied.add(cell);const text=document.createElement('span');text.textContent=S.vertexLabel(f,i);text.title=f.name;
    L.tooltip({permanent:true,direction:'top',offset:[0,-7],className:'survey-vertex-label',interactive:false,opacity:1}).setLatLng([p.lat,p.lon]).setContent(FeatureStyle.label(f,text.textContent)).addTo(labels);
    if(f.type==='Polygon')L.circleMarker([p.lat,p.lon],{radius:3,color:'#377e58',fillOpacity:1,interactive:false}).addTo(labels);
   });
  }
 }
 const previousRender=render;render=function(){previousRender();refresh()};
 toggle.onchange=()=>{try{localStorage.setItem('line-survey-vertex-labels',toggle.checked?'visible':'hidden')}catch{}refresh()};
 let refreshTimer;map.on('moveend',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120)});refresh();
})();

