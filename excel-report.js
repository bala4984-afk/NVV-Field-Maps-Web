(function(root){
 async function buildVertexWorkbook(s,index,meta,districtIndex){
 const originals=s.features;s={...s,features:originals.map(f=>f.circle?{...f,type:'Point',points:[{...f.circle.center,label:f.name}]}:f)};const extra=originals.some(f=>f.circle||f.crossing),end=extra?'R':'N';const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Vertex report');wb.creator='NVV Field maps';
 ws.addRow([s.name+' — Vertex report']);ws.mergeCells('A1:'+end+'1');ws.addRow(['WGS84 UTM '+s.zone+s.hemisphere+'; metres. Chainage resets per route.']);ws.mergeCells('A2:'+end+'2');ws.addRow(['Village, mandal and district from reference boundaries. Unresolved names remain blank.']);ws.mergeCells('A3:'+end+'3');
 ws.addRow(['Sl.No','Vertex no','Label','Deviation angle (DMS)','Previous span m','Chainage m','Easting m (WGS 84)','Northing m (UTM '+s.zone+s.hemisphere+')','Latitude °','Longitude °','Source altitude m','Village name','Mandal (gazette)','District (gazette / OSM)',...(extra?['Circle radius m','Circle area m²','Crossing','Crossing chainage m']:[])]);
 const rows=Survey.rows(s),points=s.features.flatMap(f=>f.points),angles=VertexAngles.deviations(s);const owners=s.features.flatMap((f,i)=>f.points.map(()=>originals[i]));
 rows.forEach((row,i)=>{const v=index.lookup(points[i]);if(!v.district&&districtIndex){const d=districtIndex.lookup(points[i]);if(d.status==='Inside boundary')v.district=d.village}const [angle,direction]=angles[i];let text='';if(angle!==null&&Number.isFinite(angle)){const seconds=Math.round(Math.abs(angle)*3600),deg=Math.floor(seconds/3600),min=Math.floor(seconds%3600/60),sec=seconds%60;text=deg+'° '+String(min).padStart(2,'0')+'′ '+String(sec).padStart(2,'0')+'″ '+(direction==='Left'?'LT':direction==='Right'?'RT':'Straight')}ws.addRow([i+1,'V'+row[2],(owners[i].circle?owners[i].name:owners[i].points[row[2]-1].label?.trim())||('V'+row[2]),text,row[9],row[10],row[6],row[7],row[4],row[5],row[8],v.village,v.mandal,v.district,...(extra?(()=>{const f=owners[i],route=originals.find(r=>r.id===f.crossing?.routeId),hit=route&&root.NVVCrossingLocation?root.NVVCrossingLocation(route,f.points[0]):null;return [f.circle?.radius??null,f.circle?.area??null,f.crossing?f.crossing.type+' · '+f.name:'',f.crossing?(hit?.chainage??f.crossing.chainage):null]})():[])])});
 const widths=[9,12,24,25,19,18,24,26,17,17,19,28,25,28,20,22,32,23];ws.columns.forEach((c,i)=>{c.width=widths[i];if([4,5,6,7,10,14,15,17].includes(i))c.numFmt='0.000';if([8,9].includes(i))c.numFmt='0.0000000'});ws.views=[{state:'frozen',ySplit:4,xSplit:3}];ws.autoFilter='A4:'+end+ws.rowCount;ws.getRow(4).height=38;ws.getRow(4).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173B49'}};c.alignment={wrapText:true,vertical:'middle'}});ws.getCell('A1').font={bold:true,size:18};ws.eachRow((row,n)=>{if(n>4&&n%2)row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEFF5F7'}})});return wb;
 }root.buildVertexWorkbook=buildVertexWorkbook;if(typeof module!=='undefined')module.exports=buildVertexWorkbook;
})(typeof window==='undefined'?globalThis:window);
if(typeof document!=='undefined')$('excel').onclick=async()=>{
 const button=$('excel');button.disabled=true;
 try{
  const s=JSON.parse(JSON.stringify(exportState()));s.features=s.features.filter(f=>group(f)!=='village');
  if(!s.features.length)throw Error('Show a working survey or finalized project to export vertices.');
  toast('Preparing vertex report with village names…');
  const index=await APBoundaries.ensure(),districtIndex=await APDistricts.ensure(),wb=await buildVertexWorkbook(s,index,APBoundaries.metadata,districtIndex);
  download(await wb.xlsx.writeBuffer(),(s.name.replace(/[^\w\- ]/g,'_')||'survey')+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('Excel exported with village names for each vertex.');
 }catch(e){toast(e.message)}finally{button.disabled=false}
};
