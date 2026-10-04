/* OpenStreetMap village-name markers, loaded on demand and saved with the survey. */
(function(root){
 function villageFeatures(data,date){
  if(data.remark)throw Error('The village service returned an incomplete result. Zoom in and try again.');
  if(!Array.isArray(data.elements))throw Error('The village service returned an unreadable response.');
  const features=[];const seen=new Set();
  for(const e of data.elements){
   if(!['node','way','relation'].includes(e.type)||!Number.isSafeInteger(e.id))continue;
   const t=e.tags||{},name=t.name||t['name:en']||t['name:te'];
   if(!name||!['village','hamlet'].includes(t.place))continue;
   const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;
   const osmId=`${e.type}/${e.id}`;if(seen.has(osmId))continue;seen.add(osmId);
   const bilingual=t['name:te']&&t['name:te']!==name?`${name} / ${t['name:te']}`:name;
   features.push({id:`osm-${e.type}-${e.id}`,osmId,name:bilingual,type:'Point',group:'village',source:'OpenStreetMap',sourceDate:date,description:`Village-name reference from OpenStreetMap contributors, ODbL. https://www.openstreetmap.org/${osmId} . Retrieved ${date}. Settlement label location, not an administrative boundary.`,points:[{lat,lon,alt:null,label:bilingual}]});
  }
  return features;
 }
 root.villageFeatures=villageFeatures;
 if(typeof module!=='undefined')module.exports={villageFeatures};
})(typeof window==='undefined'?globalThis:window);
if(typeof document!=='undefined'){
 const loadVillages=document.createElement('button');loadVillages.id='load-villages';loadVillages.textContent='Download village labels for this area';loadVillages.style.cssText='width:100%;margin-top:8px';
 const cancelVillages=document.createElement('button');cancelVillages.id='cancel-villages';cancelVillages.textContent='Cancel village download';cancelVillages.hidden=true;
 const villageStatus=document.createElement('p');villageStatus.className='muted';villageStatus.id='village-status';villageStatus.setAttribute('role','status');villageStatus.textContent='Adds village labels to the area shown on your map and saves them for offline use. Zoom in before downloading.';
 const credit=document.createElement('p');credit.className='muted';credit.innerHTML='Village source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors · ODbL</a>';
 $('village').hidden=true; $('village').after(loadVillages,cancelVillages,villageStatus,credit);
 map.attributionControl.addAttribution('Village data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
 let request=null;
 cancelVillages.onclick=()=>request?.abort();
 loadVillages.onclick=async()=>{
  const b=map.getBounds(),south=Math.max(-90,b.getSouth()),north=Math.min(90,b.getNorth()),west=b.getWest(),east=b.getEast();
  if(north-south>0.75||east-west>0.75||west< -180||east>180){villageStatus.textContent='Zoom in to an area smaller than about 80 × 80 km, then load village names.';toast(villageStatus.textContent);return}
  if(!navigator.onLine){villageStatus.textContent='Connect to the internet to load more names. Previously saved villages remain available.';return}
  const query=`[out:json][timeout:25];node["place"~"^(village|hamlet)$"](${south},${west},${north},${east});out center tags;`;
  request=new AbortController();const timeout=setTimeout(()=>request?.abort(),40000),startedState=state;
  loadVillages.disabled=true;cancelVillages.hidden=false;villageStatus.textContent='Loading village names from OpenStreetMap…';
  try{
   const response=await fetch('https://overpass.private.coffee/api/interpreter?'+new URLSearchParams({data:query}),{signal:request.signal});
   if(!response.ok)throw Error(response.status===429?'Village service is busy. Wait a minute and try again.':`Village service unavailable (${response.status}). Try again later.`);
   const all=villageFeatures(await response.json(),new Date().toISOString().slice(0,10));
   if(all.length>4000)throw Error('Too many villages in this area. Zoom in and try again.');
   if(state!==startedState)throw Error('The project changed during download. Load villages again for the current project.');
   const existing=new Set(state.features.map(f=>f.osmId||f.id)),fresh=all.filter(f=>!existing.has(f.osmId)&&!existing.has(f.id));
   S.validate({...state,features:[...state.features,...fresh]});
   if(fresh.length){$('showvillages').checked=true;commit(()=>state.features.push(...fresh))}
   villageStatus.textContent=all.length?`${fresh.length} village names added; ${all.length-fresh.length} already saved. Source: OpenStreetMap, ${new Date().toLocaleDateString()}.`:'No mapped village or hamlet names were returned for this area. Try a nearby area or add a name manually.';
   toast(villageStatus.textContent);
  }catch(e){villageStatus.textContent=e.name==='AbortError'?'Village download cancelled or timed out. Saved data is unchanged.':e.message==='Failed to fetch'?'Could not reach OpenStreetMap. Check the connection and try again.':e.message;toast(villageStatus.textContent)}
  finally{clearTimeout(timeout);request=null;loadVillages.disabled=false;cancelVillages.hidden=true}
 };
}


