/* Independent reference layers. Survey geometry and administrative lookup stay separate. */
(()=>{
 const section=document.createElement('section');section.className='forest-controls';
 section.innerHTML='<div class="section-title">FOREST & PROTECTED AREAS</div><label class="check"><input type="checkbox" id="forest-master" checked> Show forest layers</label><div id="forest-children"></div><p id="forest-status" class="muted" role="status">Loading forest catalogue…</p><button id="forest-retry" hidden>Retry forest loading</button><p class="muted">Reference polygons from your files. Tap a boundary for details. Opened regions are cached for offline use; the full dataset is included in the app folder. These layers do not change survey exports.</p>';
 document.querySelector('.layer-controls').append(section);
 const styles={ap:['AP Forest','#16864c',true],telangana:['Telangana Forest','#607d23',false],soi:['SOI Forest','#c57516',false],gati:['GatiShakti · other protected areas','#1e83b5',false],parks:['National Parks · GatiShakti','#b2449c',true]},checks={},groups={},loaded=new Map();
 const master=$('forest-master'),status=$('forest-status'),retry=$('forest-retry');
 map.createPane('forest-reference');map.getPane('forest-reference').style.zIndex=340;
 const renderer=L.canvas({pane:'forest-reference',padding:0.1});let manifest,epoch=0;
 let saved={};try{saved=JSON.parse(localStorage.getItem('line-survey-forests')||'{}')}catch{}
 master.checked=saved.master??true;
 for(const [key,[name,color,on]] of Object.entries(styles)){
  const label=document.createElement('label');label.className='check';label.style.marginLeft='14px';
  const input=document.createElement('input');input.type='checkbox';input.checked=saved[key]??on;input.id='forest-'+key;checks[key]=input;
  const swatch=document.createElement('span');swatch.style.cssText=`display:inline-block;width:12px;height:12px;background:${color};border-radius:2px`;
  label.append(input,swatch,document.createTextNode(' '+name));$('forest-children').append(label);groups[key]=L.layerGroup().addTo(map);
  input.onchange=()=>{save();draw()};
 }
 function save(){try{localStorage.setItem('line-survey-forests',JSON.stringify({master:master.checked,...Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,v.checked]))}))}catch{}}
 function popup(f,layer){
  const box=document.createElement('div');box.className='forest-popup';const title=document.createElement('strong');title.textContent=f.properties.name;box.append(title);
  const source=document.createElement('p');source.textContent=styles[layer][0]+' · '+f.properties.state;box.append(source);
  const table=document.createElement('table');for(const [key,value] of Object.entries(f.properties.details||{})){if(!String(value).trim())continue;const row=document.createElement('tr'),k=document.createElement('th'),v=document.createElement('td');k.textContent=key;v.textContent=value;row.append(k,v);table.append(row)}box.append(table);
  const origin=document.createElement('p');origin.textContent='File: '+f.properties.sourceFile;box.append(origin);return box;
 }
 function overlaps(a,b){return a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1]}
 async function load(shard){
  if(loaded.has(shard.file))return loaded.get(shard.file);
  const promise=(async()=>{const r=await fetch(shard.file);if(!r.ok)throw Error('Forest file unavailable. Open the full local app folder, then retry.');const zip=await JSZip.loadAsync(await r.arrayBuffer()),file=zip.file('features.geojson');if(!file)throw Error('Incomplete forest archive.');const data=JSON.parse(await file.async('string'));if(data.features.length!==shard.count)throw Error('Forest record count mismatch.');return VillageBoundaries.createIndex(data)})();
  loaded.set(shard.file,promise);try{return await promise}catch(e){loaded.delete(shard.file);throw e}
 }
 async function draw(){
  const turn=++epoch;Object.values(groups).forEach(g=>g.clearLayers());retry.hidden=true;
  if(!manifest)return;if(!master.checked){status.textContent='Forest layers hidden.';return}
  if(map.getZoom()<8){status.textContent='Forest layers ready. Zoom in to show boundaries.';return}
  const b=map.getBounds(),bounds=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];
  const wanted=manifest.shards.filter(s=>checks[s.layer].checked&&overlaps(s.bbox,bounds));
  if(!wanted.length){status.textContent='No selected forest data in this view.';return}
  status.textContent='Loading forest boundaries for this area…';
  try{
   const sets=[];for(const shard of wanted){const index=await load(shard);if(turn!==epoch)return;sets.push([shard,index.query(bounds)])}
   const total=sets.reduce((n,[s,fs])=>n+fs.length,0);if(total>2500){status.textContent=`${total.toLocaleString()} forest polygons in view. Zoom in to display them.`;return}
   for(const [shard,features] of sets)for(const f of features){
    const shape=L.geoJSON(f,{pane:'forest-reference',renderer,style:{color:styles[shard.layer][1],weight:2,fillOpacity:0.09}}).addTo(groups[shard.layer]);
    shape.bindPopup(()=>popup(f,shard.layer),{maxWidth:360});
    const label=document.createElement('span');label.textContent=f.properties.name;shape.bindTooltip(label,{sticky:true});
   }
   status.textContent=`${total.toLocaleString()} forest / protected-area polygons in view. Tap a polygon for source details.`;
  }catch(e){if(turn!==epoch)return;status.textContent=e.message==='Failed to fetch'?'This region is not cached. Open the local app while connected, then retry.':e.message;retry.hidden=false}
 }
 async function init(){try{const r=await fetch('data/forests/manifest.json');if(!r.ok)throw Error('Forest catalogue unavailable.');manifest=await r.json();for(const [k,c] of Object.entries(checks)){const total=manifest.shards.filter(s=>s.layer===k).reduce((n,s)=>n+s.count,0);c.closest('label').title=total.toLocaleString()+' supplied polygons'}draw()}catch(e){status.textContent=e.message;retry.hidden=false}}
 master.onchange=()=>{save();draw()};retry.onclick=()=>manifest?draw():init();map.on('moveend',draw);
 map.attributionControl.addAttribution('Forest layers: user-supplied AP / Telangana / SOI / GatiShakti files');init();
})();
