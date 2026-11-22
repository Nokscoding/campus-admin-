'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import './CampusStudentProfile.css';

const DATE_OPTIONS={day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Africa/Lubumbashi'};
function dateLabel(value){
 if(!value)return 'Date non renseignée';
 const d=new Date(value);
 return Number.isNaN(d.valueOf())?'Date non renseignée':d.toLocaleString('fr-FR',DATE_OPTIONS);
}
function money(amount,currency){
 return Number(amount||0).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+(currency||'USD');
}
const statusLabels={
 pending:'En attente de validation',published:'Publiée',draft:'Brouillon',
 hidden:'Masquée par CAMPUS',rejected:'Refusée',reserved:'Vente en cours',
 sold:'Vendue',deleted:'Supprimée',archived:'Retirée du catalogue'
};
const auditActions={
 approved:'Annonce validée',rejected:'Annonce refusée',updated:'Annonce modifiée',
 revised:'Annonce corrigée',hidden:'Annonce masquée',
 correction_requested:'Correction demandée',restored:'Remise en validation',
 deleted:'Annonce supprimée',archived:'Annonce retirée',
 moderator_message:'Message de modération',submitted:'Annonce soumise',revision_submitted:'Modifications proposées',revision_approved:'Modifications approuvées',revision_rejected:'Modifications refusées'
};
function ProfileAvatar({profile,sb}){
 const choice=profile?.avatar_choice||'';
 const index=/^avatar-(0[1-9]|1[01])$/.test(choice)?Number(choice.slice(-2))-1:-1;
 let style=null;
 if(choice==='custom'&&profile?.avatar_path&&sb){
  const {data}=sb.storage.from('campus-profile-photos').getPublicUrl(profile.avatar_path);
  if(data?.publicUrl)style={backgroundImage:'url("'+data.publicUrl.replace(/"/g,'%22')+'?t='+encodeURIComponent(profile.avatar_updated_at||'1')+'")',backgroundSize:'cover',backgroundPosition:'center'};
 }else if(index===8){
  style={backgroundImage:"url('https://res.cloudinary.com/jrgtsxkt/image/upload/v1795113099/campus/avatars/avatar-09-tresses-noires.webp')",backgroundSize:'cover',backgroundPosition:'center'};
 }else if(index>=0){
  style={backgroundImage:"url('https://res.cloudinary.com/jrgtsxkt/image/upload/e_upscale/f_webp,q_90/v1795169694/campus/avatars/campus-avatar-sprite-original.webp')",backgroundSize:'400% 300%',backgroundPosition:(index%4)*100/3+'% '+Math.floor(index/4)*50+'%'};
 }
 return <span role="img" aria-label="Photo de profil" className="campus-student-avatar" style={style||{}}>{!style&&(profile?.display_name?.trim().charAt(0).toUpperCase()||'C')}</span>;
}
function deletionLabel(listing,events,profileId,staffIds){
 if(!['archived','deleted'].includes(listing.status))return null;
 const e=events.find(a=>a.action===(listing.status==='deleted'?'deleted':'archived'));
 if(!e)return {label:listing.status==='deleted'?'Suppression : auteur non documenté':'Retrait : auteur non documenté',kind:'unknown',reason:null,when:null};
 let label='Action non attribuée';
 let kind='unknown';
 if(e.actor_id===profileId&&listing.status==='archived'){
  label='Retirée par le vendeur lui-même';kind='seller';
 }else if(staffIds.has(e.actor_id)||listing.status==='deleted'&&e.action==='deleted'){
  label=listing.status==='deleted'?'Supprimée par CAMPUS':'Retirée par CAMPUS';kind='staff';
 }else if(e.actor_id===profileId){
  label='Supprimée par le vendeur lui-même';kind='seller';
 }
 return {label,kind,reason:typeof e.details?.message==='string'?e.details.message:null,when:e.created_at};
}
export default function CampusStudentProfile({sb,studentId,initialProfile,onBack,onManageListing,staff=[]}){
 const [profile,setProfile]=useState(initialProfile||null);
 const [listings,setListings]=useState([]);
 const [audits,setAudits]=useState([]);
 const [listingRevisions,setListingRevisions]=useState([]);
 const [orders,setOrders]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [filter,setFilter]=useState('all');
 const [search,setSearch]=useState('');
 const [expanded,setExpanded]=useState({});
 const [truncated,setTruncated]=useState(false);
 const [avatarFull,setAvatarFull]=useState(false);
 useEffect(()=>{if(!avatarFull)return;const onKey=e=>{if(e.key==='Escape')setAvatarFull(false)};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[avatarFull]);
 const load=useCallback(async()=>{
  if(!sb||!studentId)return;
  setLoading(true);setError('');
  try{
   const profileQuery=sb.from('campus_profiles')
    .select('user_id,display_name,phone,university,avatar_choice,avatar_path,avatar_updated_at,created_at')
    .eq('user_id',studentId).maybeSingle();
   const all=[];
   let maxed=false;
   for(let offset=0;offset<1600;offset+=200){
    const {data,error}=await sb.from('campus_listings')
     .select('id,seller_id,title,description,price,currency,category,status,images,created_at')
     .eq('seller_id',studentId).order('created_at',{ascending:false}).range(offset,offset+199);
    if(error)throw error;
    all.push(...(data||[]));
    if((data||[]).length<200)break;
    if(offset+200>=1600)maxed=true;
   }
   const relatedAudits=[],relatedOrders=[];
   for(let i=0;i<all.length;i+=70){
    const ids=all.slice(i,i+70).map(x=>x.id);
    const [auditResult,orderResult]=await Promise.all([
     sb.from('campus_listing_audit')
      .select('listing_id,actor_id,action,details,created_at')
      .in('listing_id',ids).order('created_at',{ascending:false}).limit(1000),
     sb.from('campus_orders')
      .select('id,listing_id,status,product_price,currency,created_at')
      .in('listing_id',ids).order('created_at',{ascending:false}).limit(1000)
    ]);
    if(auditResult.error)throw auditResult.error;
    if(orderResult.error)throw orderResult.error;
    relatedAudits.push(...(auditResult.data||[]));
    relatedOrders.push(...(orderResult.data||[]));
   }
   const [{data:profileData,error:profileError},{data:revData,error:revError}]=await Promise.all([profileQuery,sb.from('campus_listing_revisions').select('listing_id,status,rejection_reason,submitted_at').eq('seller_id',studentId).limit(1000)]);
   if(profileError)throw profileError;
   if(revError)throw revError;
   setProfile(profileData||initialProfile||null);
   setListings(all);setAudits(relatedAudits);setOrders(relatedOrders);setListingRevisions(revData||[]);
   setTruncated(maxed);
  }catch(e){setError(e.message||'Impossible de charger le profil et son historique.')}
  finally{setLoading(false);}
 },[sb,studentId,initialProfile]);
 useEffect(()=>{setFilter('all');setSearch('');setExpanded({});load()},[load]);

 const staffIds=useMemo(()=>new Set(staff.map(x=>x.user_id)),[staff]);
 const auditsByListing=useMemo(()=>{
  const map=new Map();
  for(const a of audits){if(!map.has(a.listing_id))map.set(a.listing_id,[]);map.get(a.listing_id).push(a)}
  return map;
 },[audits]);
 const ordersByListing=useMemo(()=>{
  const map=new Map();
  for(const o of orders){if(!map.has(o.listing_id))map.set(o.listing_id,[]);map.get(o.listing_id).push(o)}
  return map;
 },[orders]);
 const enriched=useMemo(()=>listings.map(l=>{
  const logs=auditsByListing.get(l.id)||[];
  const orders=ordersByListing.get(l.id)||[];
  const completed=orders.filter(o=>o.status==='completed');
  const revision=listingRevisions.find(r=>r.listing_id===l.id)||null;
  const sold=l.status==='sold'||completed.length>0;
  const removed=deletionLabel(l,logs,studentId,staffIds);
  const group=removed?'removed':sold?'sold':l.status==='pending'?'pending':l.status==='published'?'published':l.status==='reserved'?'ongoing':'other';
  return {...l,logs,orders,completed,sold,removed,group,revision};
 }),[listings,auditsByListing,ordersByListing,studentId,staffIds,listingRevisions]);
 const totals=useMemo(()=>({
  all:enriched.length,
  pending:enriched.filter(l=>l.group==='pending').length,
  published:enriched.filter(l=>l.group==='published').length,
  ongoing:enriched.filter(l=>l.group==='ongoing').length,
  sold:enriched.filter(l=>l.group==='sold').length,
  removed:enriched.filter(l=>l.group==='removed').length,
  other:enriched.filter(l=>l.group==='other').length
 }),[enriched]);
 const visible=enriched.filter(l=>(filter==='all'||l.group===filter)&&(!search||[l.title,l.description,l.category].join(' ').toLowerCase().includes(search.trim().toLowerCase())));
 const phone=profile?.phone?.trim()||'';
 const phoneHref=phone?'tel:'+phone.replace(/[^+0-9]/g,''):null;
 const tabOptions=[
  ['all','Toutes'],['pending','En attente'],['published','Publiées'],
  ['ongoing','Vente en cours'],['sold','Ventes effectuées'],['removed','Supprimées / retirées'],['other','Autres']
 ];
 return <section className="campus-student-page">
  <div className="campus-student-topbar">
   <button type="button" className="campus-student-back" onClick={onBack}>← Retour aux profils</button>
   <button type="button" className="campus-student-refresh" onClick={load} disabled={loading}>{loading?'Chargement…':'Actualiser la fiche'}</button>
  </div>
  <div className="campus-student-identity">
   <button className="campus-student-avatar-button" type="button" onClick={()=>setAvatarFull(true)} aria-label="Agrandir la photo de profil" title="Agrandir la photo"><ProfileAvatar profile={profile} sb={sb}/></button>
   <div className="campus-student-identity-info">
    <span className="campus-student-overline">FICHE ÉTUDIANT · CAMPUS ERP</span>
    <h1>{profile?.display_name?.trim()||'Profil étudiant'}</h1>
    <p>{profile?.university||'Université non renseignée'}</p>
    <div className="campus-student-details">
     <span>Inscrit : {dateLabel(profile?.created_at)}</span>
     <span>Référence : {String(studentId||'').slice(0,8).toUpperCase()}</span>
     <span>{phoneHref?<a href={phoneHref}>{phone}</a>:'Téléphone non renseigné'}</span>
    </div>
   </div>
  </div>
  {avatarFull&&<div className="campus-student-modal" role="presentation" onClick={e=>{if(e.target===e.currentTarget)setAvatarFull(false)}}><section className="campus-student-modal-inner" role="dialog" aria-modal="true" aria-label="Photo de profil agrandie"><button type="button" className="campus-student-modal-close" onClick={()=>setAvatarFull(false)} aria-label="Fermer">×</button><ProfileAvatar profile={profile} sb={sb}/><p>{profile?.display_name?.trim()||'Étudiant CAMPUS'}</p></section></div>}
  {error&&<div className="campus-student-error" role="alert">{error}<button type="button" onClick={load}>Réessayer</button></div>}
  <div className="campus-student-kpis" aria-label="Résumé des annonces">
   {[
    ['Annonces au total',totals.all],
    ['En attente',totals.pending],
    ['Actuellement en ligne',totals.published],
    ['Ventes effectuées',totals.sold],
    ['Supprimées / retirées',totals.removed]
   ].map(([label,value])=><div className="campus-student-kpi" key={label}><span>{label}</span><strong>{loading?'…':value}</strong></div>)}
  </div>
  <div className="campus-student-section-title"><div><h2>Historique des annonces</h2><p>Tous les statuts sont conservés dans cette fiche, y compris les annonces retirées du catalogue.</p></div></div>
  <div className="campus-student-tabs" role="group" aria-label="Filtrer les annonces">
   {tabOptions.map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}<span>{totals[key]}</span></button>)}
  </div>
  <label className="campus-student-search">Rechercher une annonce
   <input type="search" placeholder="Titre, catégorie ou description" value={search} onChange={e=>setSearch(e.target.value)}/>
  </label>
  {truncated&&<p className="campus-student-warning">Ce compte a plus de 1 600 annonces : seuls les enregistrements les plus récents sont chargés.</p>}
  {loading?<div className="campus-student-empty" role="status">Chargement des annonces et de leur historique…</div>:
   !visible.length?<div className="campus-student-empty">Aucune annonce correspondant à ce filtre.</div>:
   <div className="campus-student-list">
    {visible.map(l=><article className="campus-student-listing" key={l.id}>
     <div className="campus-student-cover">{l.images?.[0]?<img src={l.images[0]} alt="" loading="lazy"/>:<span>Photo indisponible</span>}</div>
     <div className="campus-student-listing-main">
      <div className="campus-student-labelrow">
       <span className={'campus-student-status campus-student-status-'+l.group}>{l.sold?'Vente effectuée':statusLabels[l.status]||l.status}</span>
       {l.removed&&<span className={'campus-student-origin campus-student-origin-'+l.removed.kind}>{l.removed.label}</span>}{l.status==='published'&&l.revision?.status==='pending'&&<span className="campus-student-origin campus-student-origin-seller">Modification en attente</span>}{l.status==='published'&&l.revision?.status==='rejected'&&<span className="campus-student-origin campus-student-origin-staff">Dernière modification refusée</span>}
      </div>
      <h3>{l.title}</h3>{l.revision?.status==='rejected'&&l.revision.rejection_reason&&<p className="campus-student-listing-sub"><strong>Motif du refus :</strong> {l.revision.rejection_reason}</p>}
      <p className="campus-student-listing-sub">{l.category} · {money(l.price,l.currency)} · Déposée le {dateLabel(l.created_at)}</p>
      {l.removed&&<div className="campus-student-removal">
       <strong>{l.removed.label}</strong>
       {l.removed.when&&<span>Le {dateLabel(l.removed.when)}</span>}
       {l.removed.reason&&<p>Motif : {l.removed.reason}</p>}
      </div>}
      {l.sold&&<p className="campus-student-sold">{l.completed.length?'Commande clôturée dans l’ERP.':'Annonce marquée comme vendue dans CAMPUS.'}</p>}
      <div className="campus-student-listing-actions">
       <button type="button" onClick={()=>setExpanded(old=>({...old,[l.id]:!old[l.id]}))} aria-expanded={Boolean(expanded[l.id])}>
        {expanded[l.id]?'Masquer l’historique':'Voir l’historique'} ({l.logs.length})
       </button>
       {onManageListing&&<button type="button" onClick={()=>onManageListing(l)}>Gérer dans les annonces</button>}
       {l.status==='published'&&<a href={'https://campus-rdc.com/produit/'+encodeURIComponent(l.id)} target="_blank" rel="noopener noreferrer">Ouvrir l’annonce publique</a>}
      </div>
      {expanded[l.id]&&<div className="campus-student-history" aria-label={'Historique de '+l.title}>
       <h4>Historique des actions</h4>
       {l.logs.length?<ul>{l.logs.map((a,i)=><li key={a.listing_id+'-'+a.action+'-'+a.created_at+'-'+i}>
        <strong>{auditActions[a.action]||a.action}</strong>
        <span>{dateLabel(a.created_at)} · {a.actor_id===studentId&&['archived','updated','revised','submitted'].includes(a.action)?'Vendeur':staffIds.has(a.actor_id)?'Équipe CAMPUS':a.actor_id===studentId?'Compte du vendeur / équipe':'Auteur non identifié'}</span>
        {typeof a.details?.message==='string'&&a.details.message&&<p>Motif / message : {a.details.message}</p>}
       </li>)}</ul>:<p>Pas d'action historisée pour cette annonce.</p>}
      </div>}
     </div>
    </article>)}
   </div>}
 </section>;
}
