(()=>{
 const columns=['Layer','Geometry','Vertex #','Vertex label','Latitude','Longitude','Easting','Northing','Source altitude','Previous span','Chainage','CRS','Altitude mode','Village','Census village code','Mandal','District','Village match status','Gazette match status','LGD village code','Original mandal','Original district','Gazette reference','District assignment source','Deviation angle','Turn direction'];
 $('excel').onclick=()=>{
  const chosen=active();
  modal('Excel export options',[{id:'scope',label:'Export layers',value:chosen?'selected':'visible',options:[...(chosen?[['selected','Selected only: '+chosen.name]]:[]),['visible','All visible survey layers']]}],v=>{
   const fs=v.scope==='selected'?[state.features.find(f=>f.id===chosen?.id)].filter(Boolean):state.features.filter(visible).filter(f=>group(f)!=='village');
   if(!fs.length)throw Error('Select a layer or turn on a survey layer first.');
   const selectedColumns=[0,3,...columns.flatMap((c,i)=>v['column-'+i]==='on'?[i]:[])].sort((a,b)=>a-b);
   const snapshot=JSON.parse(JSON.stringify({...state,features:fs}));
   exportReport(snapshot,{columns:[...new Set(selectedColumns)],omitClosure:false});
  });
  const submit=$('form').querySelector('button[type=submit]');submit.textContent='Export Excel';$('dialog').addEventListener('close',()=>{submit.textContent='Save'},{once:true});
  const note=document.createElement('p');note.className='muted';note.textContent='Layer and vertex label are always included. Select only the data you need. Angles are direction changes: 0° straight; Left/Right follows vertex order.';$('fields').append(note);
  const grid=document.createElement('div');grid.className='export-column-grid';
  const defaults=new Set([1,2,4,5,6,7,9,10,13,15,16,17,18,23,24,25]);
  columns.forEach((name,i)=>{if(i===0||i===3)return;const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.name='column-'+i;input.checked=defaults.has(i);label.append(input,document.createTextNode(name));grid.append(label)});$('fields').append(grid);
  const closure=document.createElement('p');closure.className='muted';closure.textContent='Closed polygon rings repeat the first vertex and its label at the end. Open lines do not add a closing vertex.';$('fields').append(closure);
 };
 async function exportReport(s,options){
  $('excel').disabled=true;
  try{
   toast('Preparing selected Excel data…');const needsAdmin=options.columns.some(i=>i>=13&&i<=23);
   const index=needsAdmin?await APBoundaries.ensure():{lookup:()=>({})},districtIndex=needsAdmin?await APDistricts.ensure():null;
   const wb=await buildVertexWorkbook(s,index,needsAdmin?APBoundaries.metadata:{},districtIndex,options);
   const name=s.features.length===1?s.features[0].name:s.name;
   download(await wb.xlsx.writeBuffer(),(name.replace(/[^\w\- ]/g,'_')||'vertices')+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast(`Excel exported: ${s.features.length} layer(s), selected columns only.`);
  }catch(e){toast(e.message)}finally{$('excel').disabled=false}
 }
})();
