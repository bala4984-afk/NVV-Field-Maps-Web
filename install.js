(function(){
let pending=null;
const button=document.createElement('button');button.id='install-app';button.type='button';button.textContent='Install app';$('help').before(button);
const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function refresh(){button.textContent=installed()?'App installed':'Install app';button.disabled=installed()}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;refresh()});
window.addEventListener('appinstalled',()=>{pending=null;button.textContent='App installed';button.disabled=true;toast('NVV Field maps installed. Open it from your home screen.')});
button.onclick=async()=>{
if(pending){const prompt=pending;pending=null;try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted')toast('Installation requested. Check your home screen.');else toast('You can install later using Install app.')}catch{showInstructions()}return}
showInstructions();
};
function showInstructions(){modal('Install NVV Field maps',[],()=>{});$('fields').replaceChildren();const steps=[
'Android: open this link in Chrome. Open the browser menu (⋮), then choose Install app or Add to Home screen.',
'iPhone / iPad: open this link in Safari. Tap Share, then Add to Home Screen and Add.',
'If you opened the link inside another app, open it in Chrome or Safari first. Installation depends on your browser and device.',
'For offline fieldwork: open the app online first and wait for Ready for offline use. Keep your survey backup. Saved surveys and the cached AP village/district data work offline; forest regions must have been opened online first.',
'Satellite and OpenStreetMap backgrounds need internet. Select Plain · offline when offline. Installing the app does not download satellite imagery.'
];for(const text of steps){const p=document.createElement('p');p.textContent=text;$('fields').append(p)}}
refresh();
})();
