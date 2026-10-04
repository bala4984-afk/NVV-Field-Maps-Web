/* Polygon containment in WGS84. No nearest-place substitution. */
(function(root){
 const EPS=1e-10,STEP=0.1;
 function ringRelation(x,y,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[j],b=ring[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
   if(len&&Math.abs((x-a[0])*dy-(y-a[1])*dx)<=EPS*len&&x>=Math.min(a[0],b[0])-EPS&&x<=Math.max(a[0],b[0])+EPS&&y>=Math.min(a[1],b[1])-EPS&&y<=Math.max(a[1],b[1])+EPS)return 2;
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?1:0;
 }
 function polygonRelation(x,y,poly){
  const outer=ringRelation(x,y,poly[0]);if(outer!==1)return outer;
  for(let i=1;i<poly.length;i++){const r=ringRelation(x,y,poly[i]);if(r===2)return 2;if(r===1)return 0}
  return 1;
 }
 function relation(x,y,g){let r=0;for(const poly of g.type==='Polygon'?[g.coordinates]:g.coordinates){const n=polygonRelation(x,y,poly);if(n===1)return 1;r=Math.max(r,n)}return r}
 function intersects(a,b){return a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1]}
 function createIndex(data,gazette){
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||!data.features.length)throw Error('Village boundary data is unavailable.');
  const features=data.features,grid=new Map();
  features.forEach((f,i)=>{
   if(!['Polygon','MultiPolygon'].includes(f.geometry?.type)||!f.properties?.name||!Array.isArray(f.bbox)||f.bbox.length!==4||!f.bbox.every(Number.isFinite))throw Error('Invalid village boundary record.');
   const b=f.bbox;
   for(let x=Math.floor((b[0]-EPS)/STEP);x<=Math.floor((b[2]+EPS)/STEP);x++)for(let y=Math.floor((b[1]-EPS)/STEP);y<=Math.floor((b[3]+EPS)/STEP);y++){const k=x+','+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i)}
  });
  function query(b){const ids=new Set();for(let x=Math.floor(b[0]/STEP);x<=Math.floor(b[2]/STEP);x++)for(let y=Math.floor(b[1]/STEP);y<=Math.floor(b[3]/STEP);y++)for(const i of grid.get(x+','+y)||[])if(intersects(features[i].bbox,b))ids.add(i);return [...ids].map(i=>features[i])}
  function lookup(p){
   if(!Number.isFinite(p.lon)||!Number.isFinite(p.lat))throw Error('Invalid vertex coordinates.');
   const matches=[];let edge=false;
   for(const f of query([p.lon-EPS,p.lat-EPS,p.lon+EPS,p.lat+EPS])){const r=relation(p.lon,p.lat,f.geometry);if(r){matches.push(f);edge=edge||r===2}}
   const join=k=>[...new Set(matches.map(f=>f.properties[k]).filter(Boolean))].join(' / ');
   const admin=matches.map(f=>gazette?.matches?.[f.id]),allMatched=admin.length>0&&admin.every(a=>a?.status==='Census 2011 code matched');
   const adminJoin=k=>[...new Set(admin.map(a=>a?.[k]).filter(Boolean))].join(' / ');
   return {village:allMatched?adminJoin('name'):join('name'),code:join('code'),mandal:gazette?(allMatched?adminJoin('mandal'):''):join('mandal'),district:gazette?(allMatched?adminJoin('district'):''):join('district'),legacyMandal:join('mandal'),legacyDistrict:join('district'),lgd:allMatched?adminJoin('lgd'):'',gazetteStatus:!matches.length?'No boundary match':allMatched?'Census 2011 code matched':gazette?'Gazette match pending — verify':'Gazette not loaded',gazetteReference:allMatched?admin.map(a=>`${a.file}, row ${a.row}`).join(' / '):'',status:edge?'On boundary — verify':matches.length>1?'Overlapping boundaries — verify':matches.length?'Inside boundary':'No boundary match',matches};
  }
  return {features,query,lookup};
 }
 root.VillageBoundaries={createIndex,relation};if(typeof module!=='undefined')module.exports=root.VillageBoundaries;
})(typeof window==='undefined'?globalThis:window);
