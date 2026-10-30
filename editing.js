/* Floating forms, feature properties, and reversible map edits. */
(()=>{
 const dialog=$('dialog');let positions={};try{positions=JSON.parse(localStorage.getItem('nvv-dialog-positions')||'{}')}catch{}
 const titleKey=el=>el===dialog?'form:'+($('dialog-title').firstChild?.textContent||''):el.id||el.className;
 function clamp(el){if(!el.getClientRects().length)return;const v=visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight,x=v?.offsetLeft||0,y=v?.offsetTop||0;if(el===dialog){el.style.maxHeight=Math.max(120,h-16)+'px';const target=el.classList.contains('compact-point-editor')?innerHeight*.56-26:el.classList.contains('feature-properties')?innerHeight*.58:h-70;$('form').style.maxHeight=Math.max(90,Math.min(target,h-44))+'px';}const b=el.getBoundingClientRect();el.style.position='fixed';el.style.margin='0';el.style.right='auto';el.style.bottom='auto';el.style.left=Math.max(x,Math.min(x+w-b.width,b.left))+'px';el.style.top=Math.max(y,Math.min(y+h-Math.min(b.height,h),b.top))+'px';}
 function remember(el){const b=el.getBoundingClientRect();positions[titleKey(el)]={x:b.left/innerWidth,y:b.top/innerHeight};try{localStorage.setItem('nvv-dialog-positions',JSON.stringify(positions))}catch{}}
 function restore(el){const p=positions[titleKey(el)];delete el.dataset.userMoved;if(p){el.dataset.userMoved='true';el.style.position='fixed';el.style.margin='0';el.style.right='auto';el.style.bottom='auto';el.style.left=p.x*innerWidth+'px';el.style.top=p.y*innerHeight+'px';}clamp(el)}
 window.NVVFloating={remember,restore,clamp};
 document.addEventListener('click',e=>{const dock=document.querySelector('.point-edit-dock'),busy=dialog.open||dock&&!dock.hidden;if(!busy||dialog.contains(e.target)||dock?.contains(e.target))return;const b=e.target.closest('button,.file');if(!b)return;const label=b.getAttribute('aria-label')||b.title||'';if(/^(Zoom in|Zoom out|North \/ map rotation|My Location|Fit Survey)$/.test(label))return;e.preventDefault();e.stopImmediatePropagation();toast('Save or Cancel the open editor first.');},true);
 // Existing title handles provide mouse and touch dragging; restore saved positions on open.
 for(const el of document.querySelectorAll('.field-panel,#editor'))new MutationObserver(()=>{if(!el.hidden)restore(el)}).observe(el,{attributes:true,attributeFilter:['hidden']});
 const priorSelect=select;select=function(id){if(dialog.open&&dialog.classList.contains('feature-properties')&&id!==selected)return toast('Save or Cancel properties first.');return priorSelect(id);};
 const priorModal=modal;modal=function(title,fields,save){if(dialog.open){toast('Save or Cancel the open form first.');return;}delete dialog.dataset.userMoved;priorModal(title,fields,save);restore(dialog);};
 window.NVVConfirm=message=>new Promise(resolve=>{if(dialog.open){toast('Save or Cancel the open form first.');resolve(false);return;}let accepted=false;modal('Confirm',[],()=>{accepted=true});$('fields').textContent=message;const submit=$('form').querySelector('[type=submit]');submit.textContent=message.startsWith('Delete')?'Delete':'Continue';dialog.addEventListener('close',()=>{submit.textContent='Save';resolve(accepted);},{once:true});});
 function resized(){for(const el of document.querySelectorAll('dialog[open],.field-panel:not([hidden]),#editor:not([hidden])'))clamp(el)}
 visualViewport?.addEventListener('resize',resized);window.addEventListener('resize',resized);
 new ResizeObserver(()=>{if(dialog.open)clamp(dialog)}).observe(dialog);
 // Do not let page shortcuts steal Escape from a floating form.
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open){e.preventDefault();e.stopImmediatePropagation();dialog.close();}},true);

 let session=null,featureId=null,back=[],forward=[];
 function syncHistory(){if(session!==editSession||featureId!==selected){session=editSession;featureId=selected;back=[];forward=[];}}
 window.NVVRecordEdit=before=>{syncHistory();if(!before)return;back.push(before);forward=[];while(back.length>30||back.length>1&&back.reduce((n,s)=>n+s.length,0)>10000000)back.shift();};
 const renderBefore=render;render=function(){renderBefore();syncHistory();if(editSession){$('undo').disabled=!back.length||dialog.open;$('redo').disabled=!forward.length||dialog.open;}};
 const previousUndo=$('undo').onclick,previousRedo=$('redo').onclick;
 function step(from,to){syncHistory();const f=active();if(!editSession||!f||!from.length)return;to.push(JSON.stringify(f));const next=JSON.parse(from.pop());for(const k of Object.keys(f))delete f[k];Object.assign(f,next);stateRevision++;render();}
 $('undo').onclick=()=>editSession?step(back,forward):previousUndo();$('redo').onclick=()=>editSession?step(forward,back):previousRedo();
 dialog.addEventListener('close',()=>render());

 window.NVVProperties=id=>{
  const f=state.features.find(f=>f.id===id);if(!f)return toast('Select a feature first.');if(dialog.open)return toast('Save or Cancel the open form first.');
  const original={name:f.name,description:f.description,style:f.style?structuredClone(f.style):undefined,label:f.points[0]?.label},s=FeatureStyle.get(f);let saved=false;
  const fields=[{id:'name',label:'Name',value:f.name,required:true},{id:'description',label:'Description',value:f.description||''},{id:'color',label:'Colour',type:'color',value:s.color},{id:'labels',label:'Labels',value:s.labels?'show':'hide',options:[['show','Show'],['hide','Hide']]}];
  if(f.type==='Point')fields.push({id:'icon',label:'Point icon',value:s.iconHref||s.iconAsset?'source':s.icon,options:[...(s.iconHref||s.iconAsset?[['source','Imported icon']]:[]),['circle','Circle'],['square','Square'],['diamond','Diamond'],['tower','Tower'],['pin','Pin']]},{id:'size',label:'Icon size (px)',type:'number',value:s.size});
  else fields.push({id:'width',label:'Line weight (px)',type:'number',value:s.width},{id:'opacity',label:'Opacity (%)',type:'number',value:s.opacity*100},{id:'dash',label:'Line style',value:s.dash,options:[['solid','Solid'],['dashed','Dashed']]});
  if(f.type==='Polygon')fields.push({id:'fillColor',label:'Fill colour',type:'color',value:s.fillColor},{id:'fillOpacity',label:'Fill opacity (%)',type:'number',value:s.fillOpacity*100});
  const restore=()=>{f.name=original.name;if(original.description===undefined)delete f.description;else f.description=original.description;if(original.style===undefined)delete f.style;else f.style=structuredClone(original.style);if(original.label===undefined)delete f.points[0].label;else f.points[0].label=original.label;};
  function values(v){if(!v.name.trim())throw Error('Enter a name.');const style={...(original.style||{}),color:v.color,labels:v.labels==='show'};for(const [key,min,max,scale]of [['size',8,96,1],['width',1,15,1],['opacity',0,100,.01],['fillOpacity',0,100,.01]])if(v[key]!==undefined){const n=Number(v[key]);if(!v[key].trim()||!Number.isFinite(n)||n<min||n>max)throw Error(key+' must be '+min+'–'+max+'.');style[key]=n*scale;}
   if(v.icon&&v.icon!=='source'){style.icon=v.icon;delete style.iconHref;delete style.iconAsset;delete style.hotSpot;style.heading=0;style.iconTint='#ffffff';}else if(v.icon==='source')style.iconTint=v.color;
   if(v.dash)style.dash=v.dash;if(v.fillColor)style.fillColor=v.fillColor;return {name:v.name.trim(),description:v.description,style};}
  dialog.classList.add('feature-properties');
  modal('Feature properties',fields,v=>{const next=values(v);restore();commit(()=>{Object.assign(f,next);if(f.type==='Point')f.points[0].label=f.name;});saved=true;if(editSession)NVVSaveEdit();});
  const preview=()=>{try{Object.assign(f,values(Object.fromEntries(new FormData($('form')))));stateRevision++;renderMap(false);$('form-error').textContent='';}catch(e){$('form-error').textContent=e.message;}};
  $('fields').addEventListener('input',preview);$('fields').addEventListener('change',preview);
  dialog.addEventListener('close',()=>{$('fields').removeEventListener('input',preview);$('fields').removeEventListener('change',preview);dialog.classList.remove('feature-properties');if(!saved&&state.features.includes(f)){restore();stateRevision++;render();}},{once:true});
 };
 // Expose properties beside project feature actions as well as map selection.
 const tree=$('project-tree');if(tree)new MutationObserver(()=>{for(const actions of tree.querySelectorAll('.feature-actions')){if(actions.querySelector('[data-properties]'))continue;const edit=actions.querySelector('button');if(!edit)continue;const b=document.createElement('button');b.type='button';b.textContent='◐';b.dataset.properties='true';b.setAttribute('aria-label','Properties '+edit.getAttribute('aria-label')?.replace(/^Edit /,''));b.onclick=()=>{const name=edit.getAttribute('aria-label')?.replace(/^Edit /,'');const row=actions.parentElement,selectButton=row.querySelector('.feature-name');selectButton?.click();if(active()?.name===name)NVVProperties(selected);};actions.append(b);}}).observe(tree,{childList:true,subtree:true});
 for(const head of document.querySelectorAll('.drag-dialog-handle'))head.dataset.movable='true';
 const registerDialogs=()=>{for(const el of document.querySelectorAll('dialog,[role=dialog],.field-panel')){const head=el.querySelector('h2,.panel-head,.dialog-title');if(head&&!head.dataset.movable&&!head.classList.contains('drag-dialog-handle')){head.dataset.movable='true';window.NVVMakeMovable?.(el,head);}}};
 new MutationObserver(registerDialogs).observe(document.body,{childList:true,subtree:true});registerDialogs();
 render();
})();
