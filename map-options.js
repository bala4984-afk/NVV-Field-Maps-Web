(function(){
const panel=document.createElement('details');panel.className='map-options-panel';panel.open=true;
const heading=document.createElement('summary');heading.textContent='Layers & Map options';panel.append(heading,controls);
document.querySelector('aside').prepend(panel);
const projects=$('loaded-projects');if(projects)panel.after(projects);
})();
