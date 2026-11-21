'use client';
import {useEffect,useRef,useState} from 'react';
import './CampusPromoCropEditor.css';

export const DEFAULT_CROP={zoom:1,x:0,y:0};
const W=1536,H=1024;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fit=s=>Math.min(W/s.width,H/s.height);
function constrain(c,s){
 if(!s?.width||!s?.height)return c;
 const scale=fit(s)*clamp(c.zoom,1,4);
 const maxX=Math.max(0,(s.width*scale-W)/2),maxY=Math.max(0,(s.height*scale-H)/2);
 return {zoom:clamp(c.zoom,1,4),x:clamp(c.x,-maxX,maxX),y:clamp(c.y,-maxY,maxY)};
}
export async function prepareCampusPromoImage(file,crop){
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{
   const element=new Image();
   element.onload=()=>resolve(element);
   element.onerror=()=>reject(new Error("Impossible de lire l'image."));
   element.src=url;
  });
  const size={width:img.naturalWidth,height:img.naturalHeight};
  if(!size.width||!size.height)throw Error('Dimensions invalides.');
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Recadrage indisponible.');
  ctx.fillStyle='#3a1676';ctx.fillRect(0,0,W,H);
  const cover=Math.max(W/size.width,H/size.height)*1.15;
  ctx.save();ctx.filter='blur(36px) brightness(.8)';
  ctx.drawImage(img,(W-size.width*cover)/2,(H-size.height*cover)/2,size.width*cover,size.height*cover);
  ctx.restore();
  const safe=constrain(crop,size),scale=fit(size)*safe.zoom;
  ctx.drawImage(img,(W-size.width*scale)/2+safe.x,(H-size.height*scale)/2+safe.y,size.width*scale,size.height*scale);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.92));
  if(!blob||blob.type!=='image/webp')throw Error('Export WebP indisponible sur ce navigateur.');
  return new File([blob],'campus-carrousel-1536x1024.webp',{type:'image/webp'});
 }finally{URL.revokeObjectURL(url)}
}
export default function CampusPromoCropEditor({file,crop,onChange,badge}){
 const [src,setSrc]=useState(''),[size,setSize]=useState(null);
 const stage=useRef(null),points=useRef(new Map()),gesture=useRef(null),latest=useRef(crop);
 latest.current=crop;
 useEffect(()=>{
  if(!file){setSrc('');setSize(null);return}
  const url=URL.createObjectURL(file);setSrc(url);setSize(null);
  points.current.clear();gesture.current=null;
  return()=>URL.revokeObjectURL(url);
 },[file]);
 const update=c=>onChange(constrain(c,size));
 function point(e){const r=stage.current.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
 function snapshot(){
  const a=[...points.current.values()];
  if(a.length===1)gesture.current={mode:'drag',origin:a[0],crop:latest.current};
  else if(a.length>=2){const center={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};gesture.current={mode:'pinch',center,dist:Math.max(1,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)),crop:latest.current}}
  else gesture.current=null;
 }
 function down(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  points.current.set(e.pointerId,point(e));snapshot();
 }
 function move(e){
  if(!points.current.has(e.pointerId))return;
  e.preventDefault();points.current.set(e.pointerId,point(e));
  const a=[...points.current.values()],g=gesture.current;if(!g)return;
  if(a.length===1&&g.mode==='drag')update({...g.crop,x:g.crop.x+a[0].x-g.origin.x,y:g.crop.y+a[0].y-g.origin.y});
  else if(a.length>=2&&g.mode==='pinch'){
   const center={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
   const dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
   const zoom=clamp(g.crop.zoom*dist/g.dist,1,4),ratio=zoom/g.crop.zoom;
   update({zoom,x:g.crop.x*ratio+(center.x-g.center.x)+(g.center.x-W/2)*(1-ratio),y:g.crop.y*ratio+(center.y-g.center.y)+(g.center.y-H/2)*(1-ratio)});
  }
 }
 function up(e){if(points.current.has(e.pointerId)){points.current.delete(e.pointerId);snapshot()}}
 function wheel(e){e.preventDefault();update({...crop,zoom:clamp(crop.zoom*(e.deltaY>0?.94:1.06),1,4)})}
 const b=size?fit(size):1;
 const style=size?{width:(size.width*b/W*100)+'%',height:(size.height*b/H*100)+'%',left:(50+crop.x/W*100)+'%',top:(50+crop.y/H*100)+'%',transform:'translate(-50%,-50%) scale('+crop.zoom+')'}:{};
 return <div className="campus-promo-crop-editor">
  <div className="campus-promo-crop-heading"><strong>Recadrer l’image</strong><span>3:2 · 1536 × 1024 px</span></div>
  <div ref={stage} className="campus-promo-crop-stage" role="img" aria-label="Aperçu recadrable de la publicité"
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}>
   {src&&<><img src={src} alt="" draggable="false" className="campus-promo-crop-backdrop"/>
    <img src={src} alt="" draggable="false" className="campus-promo-crop-image" style={style} onLoad={e=>setSize({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})}/></>}
   {!size&&<span className="campus-promo-crop-wait">Préparation de l’image…</span>}
   <span className="campus-promo-crop-badge">{badge}</span>
  </div>
  <p className="campus-promo-crop-hint"><strong>Sur téléphone :</strong> pince avec deux doigts pour zoomer, glisse pour déplacer l'image. Sur PC : glisse ou ajuste le zoom.</p>
  <div className="campus-promo-crop-tools">
   <label htmlFor="campus-promo-zoom">Zoom <span>{Math.round(crop.zoom*100)} %</span></label>
   <input id="campus-promo-zoom" type="range" min="1" max="4" step="0.01" value={crop.zoom} onChange={e=>update({...crop,zoom:Number(e.target.value)})}/>
   <button type="button" className="campus-promo-crop-reset" onClick={()=>onChange({...DEFAULT_CROP})}>Tout afficher</button>
  </div>
  <p className="campus-promo-crop-hint">Par défaut, aucune partie de ton image n’est coupée. Le cadrage choisi sera enregistré lors de la publication.</p>
 </div>;
}
