/* Excel report generated from current vertex positions and the permanent polygons. */
(function(root){
 async function buildVertexWorkbook(s,index,meta,districtIndex,options={}){
  const cols=options.columns||Array.from({length:26},(_,i)=>i),metrics=cols.some(i=>[6,7,9,10,11,24,25].includes(i)),angles=cols.some(i=>i>=24)?VertexAngles.deviations(s):s.features.flatMap(f=>f.points.map(()=>[null,''])),rows=Survey.rows(s,metrics),points=s.features.flatMap(f=>f.points),wb=new ExcelJS.Workbook();wb.creator='Line Survey';
  const ws=wb.addWorksheet('Vertex report',{views:[{state:'frozen',ySplit:4,xSplit:4}]});
  ws.addRow([s.name+' — Vertex report']);ws.mergeCells('A1:Z1');ws.getCell('A1').font={bold:true,size:18,color:{argb:'FF17343F'}};
  ws.addRow([`WGS84 UTM ${s.zone}${s.hemisphere}; metres. Chainage resets per route. Source altitude is not a surveyed ground elevation.`]);ws.mergeCells('A2:Z2');
  ws.addRow(['Village = polygon containing vertex; boundary/overlap/no-match results need review. Mandal and district use supplied gazette codes; district fallback uses OSM polygons and is marked for verification; unresolved mandals stay blank.']);ws.mergeCells('A3:Z3');
  ws.addRow(['Layer','Geometry','Vertex #','Vertex name','Latitude °','Longitude °','Easting m','Northing m','Source altitude m','Previous span m','Chainage m','CRS','Altitude mode','Village name','Census village code','Mandal (gazette)','District (gazette / OSM)','Village match status','Gazette match status','LGD village code','Mandal (boundary source)','District (boundary source)','Gazette reference','District assignment source','Deviation angle °','Turn direction']);
  rows.forEach((r,i)=>{const v=index.lookup(points[i]);let districtSource=v.district?'Gazette Census code match':'Unresolved';if(!v.district&&districtIndex){const d=districtIndex.lookup(points[i]);if(d.status==='Inside boundary'){v.district=d.village;districtSource='OSM district polygon reference — verify'}else districtSource='OSM: '+d.status}ws.addRow([...r,v.village,v.code,v.mandal,v.district,v.status,v.gazetteStatus,v.lgd,v.legacyMandal,v.legacyDistrict,v.gazetteReference,districtSource,...angles[i]])});
  ws.autoFilter='A4:Z'+ws.rowCount;ws.getRow(4).height=32;
  ws.getRow(4).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173B49'}};c.alignment={wrapText:true,vertical:'middle'}});
  ws.columns.forEach((c,i)=>{c.width=[26,14,10,24,16,16,18,18,19,19,18,25,20,30,16,25,25,34,34,18,27,27,60,43,20,27][i];if(i===24)c.numFmt='0.000';if(i>=4&&i<=10)c.numFmt=i<=5?'0.0000000':'0.000'});
  ws.eachRow((r,n)=>{if(n>4){if(n%2)r.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEFF5F7'}});if(r.getCell(19).value!=='Census 2011 code matched')r.getCell(19).font={bold:true,color:{argb:'FF9C5700'}};if(r.getCell(18).value!=='Inside boundary')r.getCell(18).font={bold:true,color:{argb:'FF9C5700'}}}});
  const source=wb.addWorksheet('Village source');
  const facts=[['Village boundary source',meta.source],['Source page',meta.url],['Records',meta.count],['Portal update date',meta.portalUpdated],['Downloaded',meta.retrieved],['Coverage and dates',meta.notes],['Preparation',meta.processing],['License',meta.license],['Copyright policy',meta.copyrightPolicy],['Match method','WGS84 point-in-polygon, including polygon holes. Exact edges and overlaps flagged. No nearest-village guessing.'],['No boundary match','Vertex is outside these polygons or in a source coverage gap. Blank village is intentional.'],['Layer visibility','Boundary lookup works even if the boundary layer is hidden. Scope is selected layer only or all visible survey layers, as chosen in the export dialog.']];
  if(meta.gazette)facts.push(['Mandal / district source',meta.gazette.source],['Gazette coverage',`${meta.gazette.districtCount} districts; ${meta.gazette.records} rows. ${meta.gazette.counts.matched} boundary records matched by Census 2011 code.`],['Gazette exceptions','No unique code match: gazette mandal/district are blank. Original boundary-source names remain in separate columns. No fuzzy or nearest-name substitution.'],['Boundary geometry','Gazette updates administrative attributes only. It does not provide new polygon geometry.']);if(districtIndex)facts.push(['District polygon fallback',districtIndex.metadata.source+'; '+districtIndex.metadata.url],['District fallback limits',districtIndex.metadata.notes+' Used only when gazette district is unresolved and one district polygon contains the vertex. Does not infer mandal.']);facts.forEach(r=>source.addRow(r));source.getColumn(1).width=27;source.getColumn(2).width=105;
  source.eachRow(r=>{r.getCell(1).font={bold:true};r.getCell(2).alignment={wrapText:true,vertical:'top'};r.height=44});
  const angleNote='Deviation angle is change of travel direction in the chosen WGS84 UTM grid: 0° straight, 90° quarter turn. Left/Right follows vertex order. Polygon rings wrap independently; open endpoints and duplicate segments have no angle.';
  source.addRow(['Deviation angles',angleNote]);source.lastRow.height=60;source.lastRow.getCell(2).alignment={wrapText:true};
  if(options.omitClosure){let row=5,remove=[];for(const f of s.features){if(f.type==='Polygon'){let n=0;for(const size of f.ringLengths){n+=size;remove.push(row+n-1)}}row+=f.points.length}for(const n of remove.reverse())ws.spliceRows(n,1)}
  for(let r=1;r<=3;r++)ws.unMergeCells(`A${r}:Z${r}`);
  for(let i=25;i>=0;i--)if(!cols.includes(i))ws.spliceColumns(i+1,1);
  const last=ws.getColumn(cols.length).letter;for(let r=1;r<=3;r++)ws.mergeCells(`A${r}:${last}${r}`);ws.autoFilter=`A4:${last}${ws.rowCount}`;
  ws.views=[{state:'frozen',ySplit:4,xSplit:Math.min(2,cols.length-1)}];
  if(!cols.some(i=>i>=13&&i<=23)){wb.removeWorksheet(source.id);ws.getCell('A3').value=angleNote}
  return wb;
 }
 root.buildVertexWorkbook=buildVertexWorkbook;
 if(typeof module!=='undefined')module.exports=buildVertexWorkbook;
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
