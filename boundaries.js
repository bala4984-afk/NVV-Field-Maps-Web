/* Permanent, locally bundled AP village polygons, separate from survey edits. */
const APBoundaries=(()=>{
 let index=null,metadata=null,pending=null;
 const label=document.createElement('label');label.className='check';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.id='show-ap-boundaries';toggle.checked=true;
 label.append(toggle,document.createTextNode('AP village boundaries · permanent'));
 const status=document.createElement('p');status.className='muted';status.id='boundary-status';status.setAttribute('role','status');
 const details=document.createElement('p');details.className='muted';details.innerHTML='Boundaries: <a href="https://www.nwdp.nwic.gov.in/dataset/village-boundary/resource/80335829-b05e-4b0f-a920-91971a93bce1" target="_blank" rel="noopener">SOI / National Water Data Portal</a>. Mandal and new district names use your 28-district gazette files. Unmatched records are flagged in Excel. Boundary shapes are unchanged.';
 const retry=document.createElement('button');retry.textContent='Retry boundary loading';retry.hidden=true;
 $('showvillages').closest('label').after(label,status,retry,details);
 // Keep existing user/imported place points; hide them initially to distinguish polygons.
 $('showvillages').checked=false;$('showvillages').closest('label').lastChild.textContent='Village name points · optional';render();
 map.createPane('village-boundaries');map.getPane('village-boundaries').style.zIndex=350;
 const renderer=L.canvas({pane:'village-boundaries',padding:0.2}),layer=L.layerGroup().addTo(map);
 try{toggle.checked=localStorage.getItem('line-survey-ap-boundaries')!=='hidden'}catch{}
 function draw(){
  layer.clearLayers();if(!index)return;
  if(!toggle.checked){status.textContent=`${index.features.length.toLocaleString()} boundaries saved with app · hidden on map. Excel village lookup is active.`;return}
  if(map.getZoom()<10){status.textContent=`${index.features.length.toLocaleString()} boundaries saved with app. Zoom in to see village boundaries and names.`;return}
  const b=map.getBounds(),visible=index.query([Math.max(76,b.getWest()),Math.max(12,b.getSouth()),Math.min(85,b.getEast()),Math.min(20,b.getNorth())]);
  if(visible.length>1800){status.textContent='Zoom in further to display village boundaries. Excel village lookup is active statewide.';return}
  for(const f of visible){
   const name=document.createElement('span'),admin=metadata.gazette.matches[f.id];name.className='village-admin-box';const matched=admin?.status==='Census 2011 code matched';for(const [label,value]of [['Village',matched?admin.name:f.properties.name],['Mandal',matched?admin.mandal:null],['District',matched?admin.district:null]]){if(!value)continue;const row=document.createElement('span');row.textContent=value;name.append(row)}
   const shape=L.geoJSON(f,{pane:'village-boundaries',renderer,style:{color:'#8459b5',weight:1.5,opacity:0.9,fillOpacity:0.035},interactive:false}).addTo(layer);
   shape.bindTooltip(name,{permanent:map.getZoom()>=12,direction:'center',className:'village-boundary-label'});
  }
  status.textContent=`${index.features.length.toLocaleString()} boundaries saved with app · ${visible.length} in view. ${map.getZoom()<12?'Zoom in for names. ':''}17,480 records matched to your gazette; 620 need review.`;
 }
 async function ensure(){
  if(index)return index;if(pending)return pending;
  status.textContent='Loading permanent AP village boundaries…';retry.hidden=true;
  pending=(async()=>{
   const [r,m,g]=await Promise.all([fetch('data/ap-villages.zip'),fetch('data/ap-villages-source.json'),fetch('data/ap-gazette.json')]);
   if(!r.ok||!m.ok||!g.ok)throw Error('Boundary or gazette files unavailable. Open the app from its full folder, then retry.');
   metadata=await m.json();metadata.gazette=await g.json();const zip=await JSZip.loadAsync(await r.arrayBuffer()),file=zip.file('villages.geojson');
   if(!file)throw Error('Boundary file is incomplete.');
   const data=JSON.parse(await file.async('string'));
   if(data.features?.length!==metadata.count)throw Error('Boundary record count does not match the source.');
   index=VillageBoundaries.createIndex(data,metadata.gazette);draw();return index;
  })().catch(e=>{status.textContent=e.message;retry.hidden=false;throw e}).finally(()=>pending=null);
  return pending;
 }
 toggle.onchange=()=>{try{localStorage.setItem('line-survey-ap-boundaries',toggle.checked?'visible':'hidden')}catch{}draw()};
 retry.onclick=()=>ensure().catch(()=>{});map.on('moveend',draw);
 map.attributionControl.addAttribution('Village boundaries: <a href="https://www.nwdp.nwic.gov.in/dataset/village-boundary">SOI / NWIC</a>');
 ensure().catch(()=>{});
 return {ensure,get metadata(){return metadata}};
})();
