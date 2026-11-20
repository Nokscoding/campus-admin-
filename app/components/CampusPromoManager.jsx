'use client';
import {useEffect,useState} from 'react';
import './CampusPromoManager.css';

const empty={title:'',subtitle:'',badge:'Sponsorisé',button_text:'Découvrir',button_url:'',sort_order:0,active:true,starts_at:'',ends_at:''};
function localDate(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())}
function safeUrl(value){const s=String(value||'').trim();if(!s)return true;if(s.startsWith('/')&&!s.startsWith('//'))return true;try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)}catch{return false}}
const labels=['Sponsorisé','Publicité','Annonce','Partenaire','À la une'];
export default function CampusPromoManager({sb}){
 const [items,setItems]=useState([]),[form,setForm]=useState({...empty}),[editing,setEditing]=useState(null),[file,setFile]=useState(null),[preview,setPreview]=useState(''),[fileKey,setFileKey]=useState(0),[working,setWorking]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 useEffect(()=>{if(!file){setPreview('');return}const u=URL.createObjectURL(file);setPreview(u);return()=>URL.revokeObjectURL(u)},[file]);
 async function load(){
  if(!sb)return;setLoading(true);
  const {data,error}=await sb.from('campus_promotions').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false}).limit(120);
  if(error)setMessage('Impossible de charger les publicités : '+error.message);
  else setItems(data||[]);
  setLoading(false);
 }
 useEffect(()=>{load()},[sb]);
 const set=(field,value)=>setForm(v=>({...v,[field]:value}));
 function reset(){setEditing(null);setForm({...empty});setFile(null);setFileKey(k=>k+1)}
 function edit(item){
  setEditing(item);
  setForm({title:item.title||'',subtitle:item.subtitle||'',badge:item.badge||'Annonce',button_text:item.button_text||'',button_url:item.button_url||'',sort_order:item.sort_order||0,active:item.active,starts_at:localDate(item.starts_at),ends_at:localDate(item.ends_at)});
  setFile(null);setFileKey(k=>k+1);setMessage('');
  document.querySelector('#campus-promo-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 async function save(e){
  e.preventDefault();if(working)return;
  if(!editing&&!file){setMessage('Choisis une image avant de publier.');return}
  if(!safeUrl(form.button_url)){setMessage('Lien invalide : utilise une adresse https:// ou un chemin interne commençant par /.');return}
  if(form.button_url.trim()&&!form.button_text.trim()){setMessage('Ajoute le texte du bouton ou enlève son lien.');return}
  if(form.starts_at&&form.ends_at&&new Date(form.ends_at)<=new Date(form.starts_at)){setMessage('La date de fin doit être postérieure à la date de début.');return}
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>7*1024*1024)){setMessage('Image JPG, PNG ou WebP uniquement, 7 Mo maximum.');return}
  setWorking(true);setMessage('Enregistrement en cours…');
  let uploadedPath=null;
  try{
   let imageUrl=editing?.image_url||'',imagePath=editing?.image_path||null;
   if(file){
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    uploadedPath='promotions/'+crypto.randomUUID()+'.'+ext;
    const {error:uploadError}=await sb.storage.from('campus-promo-images').upload(uploadedPath,file,{contentType:file.type,cacheControl:'3600',upsert:false});
    if(uploadError)throw uploadError;
    imagePath=uploadedPath;
    imageUrl=sb.storage.from('campus-promo-images').getPublicUrl(uploadedPath).data.publicUrl;
   }
   const payload={image_url:imageUrl,image_path:imagePath,title:form.title.trim(),subtitle:form.subtitle.trim(),badge:form.badge,button_text:form.button_url.trim()?form.button_text.trim():'',button_url:form.button_url.trim(),sort_order:Number(form.sort_order)||0,active:form.active,starts_at:form.starts_at?new Date(form.starts_at).toISOString():null,ends_at:form.ends_at?new Date(form.ends_at).toISOString():null,updated_at:new Date().toISOString()};
   const query=editing?sb.from('campus_promotions').update(payload).eq('id',editing.id):sb.from('campus_promotions').insert(payload);
   const {error}=await query.select('id').single();
   if(error)throw error;
   if(editing?.image_path&&uploadedPath&&editing.image_path!==uploadedPath)await sb.storage.from('campus-promo-images').remove([editing.image_path]);
   reset();await load();setMessage('Publicité enregistrée. Le carrousel du site affichera la mise à jour.');
  }catch(error){
   if(uploadedPath)await sb.storage.from('campus-promo-images').remove([uploadedPath]);
   setMessage('Erreur : '+(error?.message||'Enregistrement impossible'));
  }finally{setWorking(false)}
 }
 async function toggle(item){
  if(working)return;setWorking(true);
  const {error}=await sb.from('campus_promotions').update({active:!item.active,updated_at:new Date().toISOString()}).eq('id',item.id);
  if(error)setMessage('Erreur : '+error.message);else{setItems(v=>v.map(x=>x.id===item.id?{...x,active:!x.active}:x));setMessage(item.active?'Publicité désactivée.':'Publicité activée.')}
  setWorking(false);
 }
 async function remove(item){
  if(working||!window.confirm('Supprimer définitivement cette publicité du carrousel CAMPUS ?'))return;
  setWorking(true);
  const {error}=await sb.from('campus_promotions').delete().eq('id',item.id);
  if(error)setMessage('Erreur : '+error.message);
  else{
   if(item.image_path)await sb.storage.from('campus-promo-images').remove([item.image_path]);
   setItems(v=>v.filter(x=>x.id!==item.id));if(editing?.id===item.id)reset();setMessage('Publicité supprimée.');
  }
  setWorking(false);
 }
 return <section className="campus-promos-admin">
  <div className="content-header"><div><h1>Publicités & carrousel</h1><p>Gère les visuels affichés à la place de l'illustration sur la page d'accueil CAMPUS.</p></div><button className="soft-button" type="button" onClick={load} disabled={loading||working}>Actualiser</button></div>
  {message&&<div className="campus-promos-message" role="status">{message}</div>}
  <div className="campus-promos-layout">
   <form className="panel campus-promos-editor" id="campus-promo-editor" onSubmit={save}>
    <div className="campus-promos-editor-head"><h2>{editing?'Modifier la publicité':'Ajouter une publicité'}</h2>{editing&&<button type="button" className="soft-button" onClick={reset}>Annuler</button>}</div>
    <label className="campus-promo-field">Image {editing?'(facultatif pour conserver la précédente)':'(obligatoire)'}
     <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)} required={!editing}/>
    </label>
    <p className="campus-promos-help">Conseillé : image paysage 1536 × 1024 px (ratio 3:2). JPG, PNG ou WebP, 7 Mo maximum. Le site adapte l'image aux mobiles.</p>
    {(preview||editing?.image_url)&&<div className="campus-promo-preview"><img src={preview||editing.image_url} alt="Aperçu du visuel publicitaire"/><span>{form.badge}</span></div>}
    <label className="campus-promo-field">Titre court<input maxLength={100} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="La rentrée à petit prix"/></label>
    <label className="campus-promo-field">Petit texte de présentation<input maxLength={180} value={form.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="Découvre les offres de nos partenaires"/></label>
    <div className="campus-promos-two">
     <label className="campus-promo-field">Mention affichée en bas<select value={form.badge} onChange={e=>set('badge',e.target.value)}>{labels.map(l=><option key={l} value={l}>{l}</option>)}</select></label>
     <label className="campus-promo-field">Ordre d'affichage<input type="number" min={0} max={9999} value={form.sort_order} onChange={e=>set('sort_order',e.target.value)}/></label>
    </div>
    <div className="campus-promos-two">
     <label className="campus-promo-field">Texte du bouton<input maxLength={45} value={form.button_text} onChange={e=>set('button_text',e.target.value)} placeholder="Voir l'offre"/></label>
     <label className="campus-promo-field">Lien du bouton<input type="text" maxLength={2048} value={form.button_url} onChange={e=>set('button_url',e.target.value)} placeholder="/categorie/ordinateurs ou https://..."/></label>
    </div>
    <p className="campus-promos-help">Le bouton apparaît seulement si un texte et un lien sont indiqués. Un lien externe s'ouvre dans un nouvel onglet.</p>
    <div className="campus-promos-two">
     <label className="campus-promo-field">Début (facultatif)<input type="datetime-local" value={form.starts_at} onChange={e=>set('starts_at',e.target.value)}/></label>
     <label className="campus-promo-field">Fin (facultatif)<input type="datetime-local" value={form.ends_at} onChange={e=>set('ends_at',e.target.value)}/></label>
    </div>
    <label className="campus-promos-checkbox"><input type="checkbox" checked={form.active} onChange={e=>set('active',e.target.checked)}/> Afficher cette publicité sur le site</label>
    <button className="button campus-promos-save" type="submit" disabled={working}>{working?'Enregistrement…':editing?'Enregistrer les modifications':'Ajouter au carrousel'}</button>
   </form>
   <div className="panel campus-promos-list"><div className="campus-promos-editor-head"><h2>Diapositives ({items.length})</h2><span>Ordre croissant</span></div>
    {loading?<p>Chargement…</p>:!items.length?<p className="campus-promos-empty">Aucune publicité enregistrée. L'illustration CAMPUS habituelle reste visible sur le site.</p>:items.map(item=><article className="campus-promos-row" key={item.id}>
     <img src={item.image_url} alt={item.title||'Visuel promotionnel'}/>
     <div className="campus-promos-row-text"><strong>{item.title||'Publicité sans titre'}</strong><span>{item.badge} · Position {item.sort_order}</span><small>{item.active?'Active':'Désactivée'}{item.ends_at?' · Jusqu’au '+new Date(item.ends_at).toLocaleDateString('fr-FR'):''}</small></div>
     <div className="campus-promos-row-buttons">
      <button type="button" disabled={working} onClick={()=>edit(item)}>Modifier</button>
      <button type="button" disabled={working} onClick={()=>toggle(item)}>{item.active?'Désactiver':'Activer'}</button>
      <button type="button" className="danger" disabled={working} onClick={()=>remove(item)}>Supprimer</button>
     </div>
    </article>)}
   </div>
  </div>
 </section>
}
