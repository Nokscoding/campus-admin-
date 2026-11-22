'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CAMPUS_MESSAGE_CATEGORIES,CAMPUS_MESSAGE_TEMPLATES} from './CampusMessagesCatalog';
import './CampusMessagesLibrary.css';

const STORAGE_KEY='campus-erp-communication-library-v1';
const ALL='Tous les messages';
const requiredLabels={produit:'nom du produit',universite:'université',details:'précisions / motif',date:'date et heure',lieu:'lieu de rendez-vous',montant:'montant'};
const searchable=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function normalizeWhatsapp(value){
 let digits=String(value||'').replace(/\D/g,'');
 if(/^0\d{9}$/.test(digits))digits='243'+digits.slice(1);
 return /^[1-9]\d{7,14}$/.test(digits)?digits:null;
}
function availableTokens(text){
 return [...new Set(Array.from(String(text||'').matchAll(/\{\{([a-z]+)\}\}/gi)).map(m=>m[1].toLowerCase()))];
}
function buildMessage(raw,values){
 let rendered=String(raw||'').replace(/\{\{([a-z]+)\}\}/gi,(_,token)=>{
  const key=token.toLowerCase();
  if(key==='salutation')return values.nom?'Bonjour '+values.nom.trim().split(/\s+/)[0]:'Bonjour';
  return values[key]?.trim()||'[à compléter : '+(requiredLabels[key]||key)+']';
 });
 rendered=rendered.trim();
 if(!/—\s*l[’']équipe CAMPUS\s*$/i.test(rendered))rendered+='\n\n— L’équipe CAMPUS';
 return rendered;
}
async function copyToClipboard(value){
 if(navigator.clipboard?.writeText){
  try{await navigator.clipboard.writeText(value);return}catch{}
 }
 const target=document.createElement('textarea');
 target.value=value;target.style.position='fixed';target.style.opacity='0';target.style.left='-9999px';
 document.body.appendChild(target);target.focus();target.select();
 try{if(!document.execCommand('copy'))throw Error('Copie impossible');}
 finally{document.body.removeChild(target);}
}

export default function CampusMessagesLibrary({profiles=[],listings=[]}){
 const [category,setCategory]=useState(ALL);
 const [search,setSearch]=useState('');
 const [favoritesOnly,setFavoritesOnly]=useState(false);
 const [favorites,setFavorites]=useState([]);
 const [overrides,setOverrides]=useState({});
 const [custom,setCustom]=useState([]);
 const [selectedId,setSelectedId]=useState('welcome');
 const [editedText,setEditedText]=useState('');
 const [editing,setEditing]=useState(false);
 const [studentId,setStudentId]=useState('');
 const [nom,setNom]=useState('');
 const [universite,setUniversite]=useState('');
 const [telephone,setTelephone]=useState('');
 const [produit,setProduit]=useState('');
 const [details,setDetails]=useState('');
 const [date,setDate]=useState('');
 const [lieu,setLieu]=useState('');
 const [montant,setMontant]=useState('');
 const [showCreate,setShowCreate]=useState(false);
 const [newTitle,setNewTitle]=useState('');
 const [newCategory,setNewCategory]=useState('Accueil');
 const [newBody,setNewBody]=useState('');
 const [notice,setNotice]=useState('');
 const [loaded,setLoaded]=useState(false);
 const previewRef=useRef(null);
 const allTemplates=useMemo(()=>[...CAMPUS_MESSAGE_TEMPLATES,...custom],[custom]);
 const selected=allTemplates.find(x=>x.id===selectedId)||allTemplates[0];
 const isCustom=selected?.id?.startsWith('custom-');
 const baseText=isCustom?selected?.text||'':overrides[selected?.id]??selected?.text??'';

 useEffect(()=>{
  try{
   const data=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||'{}');
   if(Array.isArray(data.favorites))setFavorites(data.favorites.filter(x=>typeof x==='string'));
   if(data.overrides&&typeof data.overrides==='object')setOverrides(data.overrides);
   if(Array.isArray(data.custom))setCustom(data.custom.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.text==='string').slice(0,100));
  }catch{}
  setLoaded(true);
 },[]);
 useEffect(()=>{
  if(!loaded)return;
  try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify({favorites,overrides,custom}))}catch{}
 },[loaded,favorites,overrides,custom]);
 useEffect(()=>{setEditedText(baseText);setEditing(false)},[selected?.id,baseText]);
 const activeText=editing?editedText:baseText;
 const values={nom,produit,universite,details,date,lieu,montant};
 const required=availableTokens(activeText).filter(token=>token!=='salutation'&&!values[token]?.trim());
 const ready=required.length===0;
 const message=buildMessage(activeText,values);
 const whatsappPhone=normalizeWhatsapp(telephone);
 const whatsappLink=ready&&whatsappPhone?'https://wa.me/'+whatsappPhone+'?text='+encodeURIComponent(message):null;
 const studentOptions=useMemo(()=>[...profiles].filter(p=>p.user_id).sort((a,b)=>String(a.display_name||'').localeCompare(String(b.display_name||''),'fr')),[profiles]);
 const studentListings=useMemo(()=>listings.filter(l=>!studentId||l.seller_id===studentId).filter(l=>l.id&&l.title).sort((a,b)=>String(a.title).localeCompare(String(b.title),'fr')),[listings,studentId]);
 const filtered=allTemplates.filter(t=>{
  if(category!==ALL&&t.category!==category)return false;
  if(favoritesOnly&&!favorites.includes(t.id))return false;
  if(search&&![t.title,t.description,t.category,overrides[t.id]||t.text].some(v=>searchable(v).includes(searchable(search))))return false;
  return true;
 });
 const selectTemplate=id=>{
  setSelectedId(id);setNotice('');
  if(window.matchMedia('(max-width: 800px)').matches){
   window.requestAnimationFrame(()=>previewRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
 };
 const selectStudent=id=>{
  setStudentId(id);
  if(!id){setNom('');setUniversite('');setTelephone('');setProduit('');return}
  const person=studentOptions.find(p=>p.user_id===id);
  setNom(person?.display_name||'');
  setUniversite(person?.university||'');
  setTelephone(person?.phone||'');
  const owned=listings.filter(l=>l.seller_id===id);
  setProduit(owned.length===1?owned[0].title:'');
  setNotice('');
 };
 const copy=async()=>{
  if(!ready){setNotice('Complète les champs requis avant de copier le message.');return}
  try{await copyToClipboard(message);setNotice('Message copié. Tu peux maintenant le coller dans WhatsApp ou ailleurs.')}
  catch{setNotice('La copie automatique a échoué. Sélectionne le texte dans l’aperçu pour le copier manuellement.')}
 };
 const saveText=()=>{
  if(editedText.trim().length<15){setNotice('Le modèle doit contenir au moins 15 caractères.');return}
  if(isCustom)setCustom(old=>old.map(t=>t.id===selected.id?{...t,text:editedText.trim()}:t));
  else setOverrides(old=>({...old,[selected.id]:editedText.trim()}));
  setEditing(false);setNotice('Personnalisation enregistrée sur cet appareil.');
 };
 const resetText=()=>{
  if(isCustom){setEditedText(selected.text);setEditing(false);return}
  setOverrides(old=>{const next={...old};delete next[selected.id];return next});
  setEditing(false);setNotice('Modèle rétabli dans sa version CAMPUS.');
 };
 const addCustom=e=>{
  e.preventDefault();
  if(newTitle.trim().length<3||newBody.trim().length<15){setNotice('Entre un nom et un message d’au moins 15 caractères.');return}
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const entry={id,category:newCategory,title:newTitle.trim().slice(0,90),description:'Modèle personnalisé',text:newBody.trim()};
  setCustom(old=>[...old,entry]);setCategory(ALL);setFavoritesOnly(false);setSearch('');setSelectedId(id);
  setNewTitle('');setNewBody('');setShowCreate(false);setNotice('Modèle personnel créé et conservé sur cet appareil.');
 };
 const removeCustom=()=>{
  if(!isCustom||!window.confirm('Supprimer ce modèle personnalisé enregistré sur cet appareil ?'))return;
  setCustom(old=>old.filter(t=>t.id!==selected.id));setFavorites(old=>old.filter(id=>id!==selected.id));
  setSelectedId('welcome');setNotice('Modèle personnalisé supprimé.');
 };
 const toggleFavorite=id=>setFavorites(old=>old.includes(id)?old.filter(v=>v!==id):[...old,id]);

 return <section className="campus-messages-library">
  <div className="campus-msg-hero">
   <div><span className="campus-msg-eyebrow">COMMUNICATION · CAMPUS</span>
    <h1>Messages</h1>
    <p>Des textes prêts à envoyer aux étudiants, vendeurs et acheteurs. Choisis un cas, personnalise-le et copie-le en un clic.</p>
    <div className="campus-msg-hero-meta"><span>{CAMPUS_MESSAGE_TEMPLATES.length} modèles officiels</span><span>{CAMPUS_MESSAGE_CATEGORIES.length} catégories</span>{custom.length>0&&<span>{custom.length} personnel{custom.length>1?'s':''}</span>}</div>
   </div>
   <button type="button" className="campus-msg-create-button" onClick={()=>{setShowCreate(v=>!v);setNotice('')}}>{showCreate?'Fermer':'Ajouter mon message'}</button>
  </div>
  {showCreate&&<form className="campus-msg-new" onSubmit={addCustom}>
   <h2>Créer un modèle personnel</h2><p>Ton modèle est enregistré dans ce navigateur, pas partagé automatiquement avec les autres appareils.</p>
   <div className="campus-msg-new-fields"><label>Nom du modèle<input required minLength={3} maxLength={90} value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Ex. Relance vendeur indisponible"/></label>
   <label>Catégorie<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}>{CAMPUS_MESSAGE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label></div>
   <label>Message préécrit<textarea required minLength={15} rows={5} value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder={'{{salutation}},\n\nConcernant « {{produit}} »...'} /></label>
   <small>Variables possibles : {'{{salutation}}'}, {'{{produit}}'}, {'{{universite}}'}, {'{{details}}'}, {'{{date}}'}, {'{{lieu}}'}, {'{{montant}}'}.</small>
   <button type="submit">Enregistrer mon modèle</button>
  </form>}
  <div className="campus-msg-layout">
   <div className="campus-msg-browser">
    <div className="campus-msg-searchbar">
     <label>Rechercher un message<input type="search" placeholder="Bienvenue, correction, livraison..." value={search} onChange={e=>setSearch(e.target.value)}/></label>
     <button type="button" className={'campus-msg-star-filter'+(favoritesOnly?' active':'')} aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(v=>!v)} title="Mes favoris">☆ Favoris</button>
    </div>
    <div className="campus-msg-categories" role="group" aria-label="Catégorie de messages">
     {[ALL,...CAMPUS_MESSAGE_CATEGORIES].map(c=><button key={c} type="button" className={category===c?'active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}
    </div>
    <div className="campus-msg-list-meta">{filtered.length} message{filtered.length>1?'s':''} disponible{filtered.length>1?'s':''}</div>
    <div className="campus-msg-list">
     {!filtered.length&&<div className="campus-msg-empty">Aucun message ne correspond à cette recherche.</div>}
     {filtered.map(t=><article key={t.id} className={'campus-msg-item'+(selected?.id===t.id?' active':'')}>
      <button type="button" className="campus-msg-item-open" onClick={()=>selectTemplate(t.id)}>
       <span className="campus-msg-item-category">{t.category}{t.id.startsWith('custom-')?' · Personnel':''}</span>
       <strong>{t.title}</strong><span className="campus-msg-item-description">{t.description}</span>
      </button>
      <button type="button" className={'campus-msg-favorite'+(favorites.includes(t.id)?' active':'')} aria-pressed={favorites.includes(t.id)} aria-label={(favorites.includes(t.id)?'Retirer des favoris : ':'Ajouter aux favoris : ')+t.title} onClick={()=>toggleFavorite(t.id)}>{favorites.includes(t.id)?'★':'☆'}</button>
     </article>)}
    </div>
   </div>

   <div className="campus-msg-detail" ref={previewRef}>
    <div className="campus-msg-detail-head"><span>{selected?.category}</span><h2>{selected?.title}</h2><p>{selected?.description}</p></div>
    <div className="campus-msg-fields">
     <div className="campus-msg-section-heading"><strong>Personnaliser le destinataire</strong><span>Les informations restent dans l’ERP</span></div>
     <label className="campus-msg-student-select">Étudiant enregistré (facultatif)
      <select value={studentId} onChange={e=>selectStudent(e.target.value)}>
       <option value="">Saisir manuellement</option>
       {studentOptions.map(p=><option key={p.user_id} value={p.user_id}>{p.display_name?.trim()||'Étudiant sans nom'}{p.university?' · '+p.university:''}</option>)}
      </select>
     </label>
     <div className="campus-msg-fields-grid">
      <label>Nom de l’étudiant<input type="text" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Prénom ou nom"/></label>
      <label>Numéro WhatsApp<input type="tel" inputMode="tel" value={telephone} onChange={e=>setTelephone(e.target.value)} placeholder="+243..."/></label>
      <label>Université<input type="text" value={universite} onChange={e=>setUniversite(e.target.value)} placeholder="UNH, UPL, UNILU..."/></label>
      <label>Annonce enregistrée<select value={studentListings.find(l=>l.title===produit)?.id||''} onChange={e=>setProduit(studentListings.find(l=>l.id===e.target.value)?.title||'')}>
       <option value="">Saisir le produit ci-dessous</option>
       {studentListings.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}
      </select></label>
      <label>Nom du produit<input type="text" value={produit} onChange={e=>setProduit(e.target.value)} placeholder="Ex. HP EliteBook 830 G5"/></label>
      <label>Montant si nécessaire<input type="text" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="Ex. 5 USD"/></label>
      <label>Date et heure si nécessaire<input type="text" value={date} onChange={e=>setDate(e.target.value)} placeholder="Ex. mardi à 14 h"/></label>
      <label>Lieu si nécessaire<input type="text" value={lieu} onChange={e=>setLieu(e.target.value)} placeholder="Ex. entrée principale de l’UNH"/></label>
     </div>
     <label>Motif ou précision à ajouter<textarea rows={2} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Ex. Retirer le numéro personnel de la description." /></label>
    </div>
    <div className="campus-msg-preview-head"><div><strong>Message prêt à copier</strong><p>Signature CAMPUS ajoutée automatiquement</p></div>
     <button type="button" className="campus-msg-edit-toggle" onClick={()=>{setEditing(v=>!v);setNotice('')}}>{editing?'Fermer l’édition':'Modifier le modèle'}</button>
    </div>
    {editing&&<section className="campus-msg-template-editor">
     <label>Modifier le texte du modèle<textarea rows={10} value={editedText} onChange={e=>setEditedText(e.target.value)}/></label>
     <small>Utilise les variables entre doubles accolades pour réutiliser automatiquement les champs du destinataire.</small>
     <div><button type="button" onClick={saveText}>Enregistrer ma version</button><button type="button" onClick={()=>{setEditedText(baseText);setEditing(false)}}>Annuler</button>
      {!isCustom&&overrides[selected?.id]&&<button type="button" onClick={resetText}>Version d’origine</button>}
      {isCustom&&<button type="button" className="danger" onClick={removeCustom}>Supprimer le modèle</button>}</div>
    </section>}
    <textarea className="campus-msg-preview" readOnly value={message} rows={12} aria-label="Aperçu du message à copier"/>
    {required.length>0&&<p className="campus-msg-required" role="status">À compléter pour pouvoir copier : {required.map(k=>requiredLabels[k]||k).join(', ')}.</p>}
    {notice&&<p className="campus-msg-notice" role="status">{notice}</p>}
    <div className="campus-msg-actions">
     <button type="button" className="campus-msg-copy" onClick={copy} disabled={!ready}>Copier le message</button>
     {whatsappLink?<a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="campus-msg-whatsapp">Ouvrir dans WhatsApp</a>:
     <span className="campus-msg-whatsapp-disabled">Renseigne le numéro et les champs requis pour ouvrir WhatsApp</span>}
    </div>
    <p className="campus-msg-disclaimer">Aucun message n’est envoyé automatiquement : WhatsApp s’ouvre avec le texte préparé, et tu confirmes toi-même l’envoi. Vérifie que le cas correspond bien à la situation réelle du vendeur ou de l’acheteur.</p>
    <p className="campus-msg-storage-disclaimer">Les modèles officiels sont disponibles sur tous les appareils. Les modèles personnalisés, favoris et modifications sont enregistrés uniquement dans ce navigateur.</p>
   </div>
  </div>
 </section>;
}
