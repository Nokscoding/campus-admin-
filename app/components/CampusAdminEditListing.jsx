'use client';
import {useEffect,useMemo,useState} from 'react';
import './CampusAdminEditListing.css';

const EDITABLE_STATUSES=new Set(['draft','pending','published','rejected','hidden']);
const CONDITIONS=['Neuf','Comme neuf','Bon état','État correct','À réparer'];
const CONTACT_REGEX=/(\+?243(?:[\s().-]*[0-9]){9}|(?:^|[^0-9])0[89](?:[\s().-]*[0-9]){8}|wa\.me\/|api\.whatsapp\.com\/|chat\.whatsapp\.com\/|instagram\.com\/|t\.me\/)/i;
const money=(price,currency)=>Number(price||0).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+(currency||'USD');
const label=(status)=>({draft:'Brouillon',pending:'En attente de validation',published:'Publiée',rejected:'Refusée',hidden:'Masquée'})[status]||status;

export default function CampusAdminEditListing({sb,listing,categories=[],onClose,onSaved}){
 const [current,setCurrent]=useState(null);
 const [title,setTitle]=useState('');
 const [description,setDescription]=useState('');
 const [price,setPrice]=useState('');
 const [condition,setCondition]=useState('Bon état');
 const [category,setCategory]=useState('');
 const [hasIssue,setHasIssue]=useState(false);
 const [issueDetails,setIssueDetails]=useState('');
 const [images,setImages]=useState([]);
 const [newFiles,setNewFiles]=useState([]);
 const [previews,setPreviews]=useState([]);
 const [note,setNote]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [pendingRevision,setPendingRevision]=useState(false);
 const [feedback,setFeedback]=useState('');
 const normalizedCategories=useMemo(()=>{
  const all=categories.map(c=>c?.name).filter(Boolean);
  if(current?.category&&!all.includes(current.category))all.unshift(current.category);
  return all;
 },[categories,current?.category]);

 useEffect(()=>{
  if(!sb||!listing?.id)return;
  let active=true;
  (async()=>{
   setLoading(true);setError('');
   const [row,revision]=await Promise.all([
    sb.from('campus_listings').select('*').eq('id',listing.id).maybeSingle(),
    sb.from('campus_listing_revisions').select('status').eq('listing_id',listing.id).maybeSingle()
   ]);
   if(!active)return;
   if(row.error||!row.data){setError(row.error?.message||'Annonce introuvable.');setLoading(false);return}
   const data=row.data;
   setCurrent(data);
   setTitle(data.title||'');
   setDescription(data.description||'');
   setPrice(String(data.price??''));
   setCondition(data.condition||'Bon état');
   setCategory(data.category||'');
   setHasIssue(Boolean(data.has_issue));
   setIssueDetails(data.issue_details||'');
   setImages(data.images||[]);
   setPendingRevision(revision.data?.status==='pending');
   if(revision.error)setError('Vérification des modifications en attente impossible : '+revision.error.message);
   setLoading(false);
  })();
  return()=>{active=false};
 },[sb,listing?.id]);

 useEffect(()=>{
  const values=newFiles.map((file)=>({file,url:URL.createObjectURL(file)}));
  setPreviews(values);
  return()=>{values.forEach(entry=>URL.revokeObjectURL(entry.url))};
 },[newFiles]);

 useEffect(()=>{
  const former=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onEscape=e=>{if(e.key==='Escape'&&!busy)onClose()};
  document.addEventListener('keydown',onEscape);
  return()=>{document.body.style.overflow=former;document.removeEventListener('keydown',onEscape)};
 },[busy,onClose]);

 const photoCount=images.length+newFiles.length;
 const contactDetected=CONTACT_REGEX.test(description);
 const invalid=loading||busy||pendingRevision||!EDITABLE_STATUSES.has(current?.status)||Boolean(error);
 const addPhotos=e=>{
  const next=Array.from(e.target.files||[]);
  e.target.value='';
  if(!next.length)return;
  if(photoCount+next.length>5){setFeedback('Maximum 5 photos par annonce. Retire des photos avant d’en ajouter.');return}
  if(next.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){
   setFeedback('Photos JPG, PNG ou WebP de 5 Mo maximum.');return
  }
  setNewFiles(previous=>[...previous,...next]);
  setFeedback('');
 };
 const movePhoto=(index,direction)=>{
  setImages(existing=>{
   const next=[...existing],other=index+direction;
   if(other<0||other>=next.length)return existing;
   [next[index],next[other]]=[next[other],next[index]];
   return next;
  });
 };

 const submit=async e=>{
  e.preventDefault();if(invalid)return;
  setBusy(true);setFeedback('');
  try{
   if(contactDetected)throw Error('Retire d’abord les coordonnées personnelles ou liens de messagerie de la description.');
   if(title.trim().length<5||title.trim().length>100)throw Error('Le titre doit contenir de 5 à 100 caractères.');
   if(description.trim().length<20||description.trim().length>3000)throw Error('La description doit contenir de 20 à 3 000 caractères.');
   if(!Number.isFinite(Number(price))||Number(price)<=0)throw Error('Indique un prix valide.');
   if(photoCount<1||photoCount>5)throw Error('Conserve de 1 à 5 photos.');
   if(!category)throw Error('Choisis une catégorie.');
   if(hasIssue&&issueDetails.trim().length<10)throw Error('Décris le défaut en 10 caractères minimum.');
   if(!window.confirm('Appliquer directement ces modifications et notifier le vendeur de « '+(current?.title||listing?.title)+' » ?'))return;
   let finalPhotos=[...images];
   if(newFiles.length){
    const {data:{user},error:authError}=await sb.auth.getUser();
    if(authError||!user)throw Error('Ta session a expiré. Reconnecte-toi à l’ERP.');
    for(let i=0;i<newFiles.length;i++){
     const file=newFiles[i];
     const extension=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
     const path=user.id+'/'+current.id+'/'+crypto.randomUUID()+'.'+extension;
     setFeedback('Envoi de la photo '+(i+1)+' sur '+newFiles.length+'…');
     const {error:uploadError}=await sb.storage.from('campus-listing-photos').upload(path,file,{contentType:file.type,upsert:false});
     if(uploadError)throw Error('La photo n’a pas pu être envoyée : '+uploadError.message);
     const {data}=sb.storage.from('campus-listing-photos').getPublicUrl(path);
     if(!data?.publicUrl)throw Error('Impossible de récupérer le lien de la photo.');
     finalPhotos.push(data.publicUrl);
    }
   }
   setFeedback('Enregistrement des modifications et notification au vendeur…');
   const {error:saveError}=await sb.rpc('campus_admin_edit_listing',{
    p_id:current.id,
    p_title:title.trim(),
    p_description:description.trim(),
    p_price:Number(price),
    p_condition:condition,
    p_category:category,
    p_has_issue:hasIssue,
    p_issue_details:hasIssue?issueDetails.trim():null,
    p_images:finalPhotos,
    p_note:note.trim()||null
   });
   if(saveError)throw saveError;
   await onSaved?.();
  }catch(e){
   setFeedback('');
   setError(e.message||'Impossible de modifier l’annonce.');
  }finally{setBusy(false)}
 };

 if(!listing)return null;
 return <div className="campus-admin-edit-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)onClose()}}>
  <section className="campus-admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="campus-admin-edit-title">
   <div className="campus-admin-edit-head">
    <div><span>ADMINISTRATION CAMPUS · MODIFICATION DIRECTE</span>
     <h2 id="campus-admin-edit-title">Modifier l’annonce</h2>
     <p>{current?.title||listing.title} · {label(current?.status||listing.status)}</p>
    </div>
    <button type="button" className="campus-admin-edit-close" aria-label="Fermer" onClick={onClose} disabled={busy}>×</button>
   </div>
   {loading?<div className="campus-admin-edit-state">Chargement de la version actuelle…</div>:
    <form onSubmit={submit} className="campus-admin-edit-form">
     {pendingRevision&&<div className="campus-admin-edit-warning" role="alert">
      <strong>Modification du vendeur en attente</strong>
      <p>Examine ou refuse d’abord sa proposition dans « À valider ». La modification directe est bloquée pour ne pas l’écraser.</p>
     </div>}
     {!EDITABLE_STATUSES.has(current?.status)&&<div className="campus-admin-edit-warning" role="alert">
      Cette annonce ne peut pas être modifiée dans son état actuel ({label(current?.status)}).
     </div>}
     {error&&<div role="alert" className="campus-admin-edit-error">{error}<button type="button" onClick={()=>setError('')}>Fermer le message</button></div>}
     <label>Titre de l’annonce<input type="text" required minLength={5} maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} disabled={busy}/></label>
     <label>Description<textarea required minLength={20} maxLength={3000} rows={6} value={description} onChange={e=>setDescription(e.target.value)} disabled={busy}/></label>
     {contactDetected&&<div className="campus-admin-edit-warning" role="alert">Des coordonnées personnelles ont été détectées. Supprime-les avant d’enregistrer pour respecter les règles Campus.</div>}
     <div className="campus-admin-edit-two">
      <label>Prix ({current?.currency||'USD'})<input required type="number" min=".01" step=".01" value={price} onChange={e=>setPrice(e.target.value)} disabled={busy}/></label>
      <label>Catégorie<select required value={category} onChange={e=>setCategory(e.target.value)} disabled={busy}>
       <option value="">Choisir une catégorie</option>
       {normalizedCategories.map(name=><option key={name} value={name}>{name}</option>)}
      </select></label>
     </div>
     <label>État du produit<select value={condition} onChange={e=>setCondition(e.target.value)} disabled={busy}>
      {CONDITIONS.concat(condition&&!CONDITIONS.includes(condition)?[condition]:[]).map(v=><option key={v} value={v}>{v}</option>)}
     </select></label>
     <label className="campus-admin-edit-check"><input type="checkbox" checked={hasIssue} onChange={e=>setHasIssue(e.target.checked)} disabled={busy}/> Le produit présente un défaut signalé</label>
     {hasIssue&&<label>Précisions sur le défaut<textarea rows={3} minLength={10} maxLength={600} value={issueDetails} onChange={e=>setIssueDetails(e.target.value)} required disabled={busy}/></label>}
     <div className="campus-admin-edit-photos">
      <strong>Photos de l’annonce <small>{photoCount}/5</small></strong>
      <p>Tu peux retirer ou réordonner les images. Les anciennes photos restent conservées dans l’historique, sans supprimer les fichiers du vendeur.</p>
      <div className="campus-admin-edit-gallery">
       {images.map((url,i)=><div className="campus-admin-edit-photo" key={'old-'+url+'-'+i}>
        <img src={url} alt={'Photo existante '+(i+1)}/>
        <div className="campus-admin-edit-photo-controls">
         <button type="button" onClick={()=>movePhoto(i,-1)} disabled={busy||i===0} aria-label={'Déplacer la photo '+(i+1)+' à gauche'}>←</button>
         <button type="button" onClick={()=>movePhoto(i,1)} disabled={busy||i===images.length-1} aria-label={'Déplacer la photo '+(i+1)+' à droite'}>→</button>
         <button type="button" onClick={()=>setImages(curr=>curr.filter((_,j)=>j!==i))} disabled={busy} aria-label={'Retirer la photo '+(i+1)}>×</button>
        </div>
       </div>)}
       {previews.map((entry,i)=><div className="campus-admin-edit-photo" key={'new-'+i+'-'+entry.file.name}>
        <img src={entry.url} alt={'Nouvelle photo '+(i+1)}/>
        <div className="campus-admin-edit-photo-controls"><button type="button" disabled={busy} onClick={()=>setNewFiles(curr=>curr.filter((_,j)=>j!==i))}>Retirer</button></div>
       </div>)}
      </div>
      {photoCount<5&&<label className="campus-admin-edit-upload">Ajouter des photos (JPG, PNG, WebP · 5 Mo max)<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addPhotos} disabled={busy}/></label>}
     </div>
     <label>Message au vendeur <span className="campus-admin-edit-optional">(facultatif)</span>
      <textarea maxLength={500} rows={3} placeholder="Ex. Nous avons retiré le numéro personnel de la description. Les transactions passent exclusivement par CAMPUS." value={note} onChange={e=>setNote(e.target.value)} disabled={busy}/>
     </label>
     <p className="campus-admin-edit-notification"><strong>Notification automatique :</strong> le vendeur sera informé des champs modifiés et recevra ton message éventuel. La modification sera enregistrée dans l’historique avec ton compte administrateur.</p>
     {!!feedback&&<div role="status" className="campus-admin-edit-feedback">{feedback}</div>}
     <div className="campus-admin-edit-footer">
      <button type="button" onClick={onClose} disabled={busy}>Annuler</button>
      <button className="campus-admin-edit-save" type="submit" disabled={invalid||contactDetected||photoCount<1}>{busy?'Enregistrement…':'Enregistrer et notifier le vendeur'}</button>
     </div>
    </form>}
  </section>
 </div>;
}
