(function(root){
 function turn(a,b,c){
  const u=[b[0]-a[0],b[1]-a[1]],v=[c[0]-b[0],c[1]-b[1]];
  if(Math.hypot(...u)<1e-8||Math.hypot(...v)<1e-8)return [null,'Duplicate adjacent vertex'];
  const d=Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1])*180/Math.PI;
  return [Math.abs(d),Math.abs(d)<1e-7?'Straight':Math.abs(Math.abs(d)-180)<1e-7?'Reversal':d>0?'Left':'Right'];
 }
 function deviations(s){return s.features.flatMap(f=>{
  if(f.type==='Point')return [[null,'Point']];
  if(f.type==='Polygon')return Survey.rings(f).flatMap(r=>{const pts=r.slice(0,-1).map(p=>Survey.xy(p,s)),n=pts.length,values=pts.map((p,i)=>turn(pts[(i+n-1)%n],p,pts[(i+1)%n]));return [...values,values[0]]});
  const pts=f.points.map(p=>Survey.xy(p,s));return pts.map((p,i)=>i===0||i===pts.length-1?[null,'Endpoint']:turn(pts[i-1],p,pts[i+1]));
 })}
 root.VertexAngles={turn,deviations};if(typeof module!=='undefined')module.exports=root.VertexAngles;
})(typeof window==='undefined'?globalThis:window);
