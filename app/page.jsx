'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import CampusPushControl,{unsubscribeFromCampusPush} from './components/CampusPushControl';
import CampusPromoManager from './components/CampusPromoManager';
import CampusMarketingDashboard from './components/CampusMarketingDashboard';
import CampusStudentProfile from './components/CampusStudentProfile';
import CampusAdminEditListing from './components/CampusAdminEditListing';
import CampusMessagesLibrary from './components/CampusMessagesLibrary';
import CampusEmailDeliveryStatus from './components/CampusEmailDeliveryStatus';
const logo='https://res.cloudinary.com/jrgtsxkt/image/upload/v1794856878/campus/brand/approved-ribbon-mark.png';
const steps={assigned:['pickup_scheduled','Programmer le retrait'],pickup_scheduled:['collected','Produit récupéré'],collected:['inspecting',"Démarrer l'inspection"],inspecting:['approved',"Valider l'inspection"],approved:['delivery','Partir en livraison sur le campus']};
const status={pending:'À modérer',published:'Publiée',draft:'Brouillon',hidden:'Masquée',deleted:'Supprimée',rejected:'Refusée',reserved:'Réservée',sold:'Vendue',requested:'Nouvelle demande',awaiting_confirmation:'Accord acheteur requis',assigned:'Agent affecté',pickup_scheduled:'Retrait programmé',collected:'Récupéré',inspecting:'Inspection',approved:'Contrôlé',delivery:'Livraison sur le campus',paid:'Cash encaissé',completed:'Livraison confirmée',cancelled:'Annulée',disputed:'Litige'};
const roles={admin:'Administrateur',operations:'Responsable opérations',agent:'Agent agréé',finance:'Responsable caisse'};
const curr=(n,c)=>Number(n||0).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+(c||'USD');

const campusHasDirectContact=(value)=>/(\+?243(?:[\s().-]*[0-9]){9}|(?:^|[^0-9])0[89](?:[\s().-]*[0-9]){8}|wa\.me\/|api\.whatsapp\.com\/|chat\.whatsapp\.com\/|instagram\.com\/|t\.me\/)/i.test(String(value||''));


function campusWhatsAppReminder(profile,listing,correction){
 const phone=String(profile?.phone||'').trim().replace(/[^0-9]/g,'');
 let digits=phone;
 if(/^0[0-9]{9}$/.test(digits))digits='243'+digits.slice(1);
 if(!/^[1-9][0-9]{7,14}$/.test(digits))return null;
 const name=profile?.display_name?.trim()||'';
 const warning=correction.warning_about_masking?
  'Si l’annonce reste non conforme, elle pourra être masquée par la modération.':'Merci de nous transmettre une version corrigée.';
 const message='Bonjour'+(name?' '+name:'')+',\n\n'+'L’équipe de modération CAMPUS a relevé un problème dans votre annonce « '+listing.title+' ».\n\n'
  +'Correction demandée : '+correction.message+'\n\n'
  +'Merci de modifier l’annonce ici : https://www.campus-rdc.com/annonce/'+listing.id+'/modifier\n\n'
  +warning+'\n\nMerci pour votre compréhension.\nL’équipe CAMPUS';
 return 'https://wa.me/'+digits+'?text='+encodeURIComponent(message);
}

function Icon({name,size=19}){const p={grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,package:<><path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/></>,clipboard:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 12l2 2 4-4M9 18h6"/></>,users:<><circle cx="9" cy="8" r="3"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5"/></>,cash:<><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 8h2m10 8h2"/></>,refresh:<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>,logout:<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>,shield:<><path d="m12 2 9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6zM8 12l3 3 5-6"/></>};return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]||p.grid}</svg>}

function SellerAvatar({profile,sb,large=false}){
 const choice=profile?.avatar_choice||'';
 const index=/^avatar-(0[1-9]|1[01])$/.test(choice)?Number(choice.slice(-2))-1:-1;
 let style=null;
 if(choice==='custom'&&profile?.avatar_path&&sb){
  const {data}=sb.storage.from('campus-profile-photos').getPublicUrl(profile.avatar_path);
  if(data?.publicUrl)style={backgroundImage:'url('+JSON.stringify(data.publicUrl+'?t='+encodeURIComponent(profile.avatar_updated_at||'1')).slice(1,-1)+')',backgroundSize:'cover',backgroundPosition:'center'};
 }else if(index===8){
  style={backgroundImage:"url('https://res.cloudinary.com/jrgtsxkt/image/upload/v1795113099/campus/avatars/avatar-09-tresses-noires.webp')",backgroundSize:'cover',backgroundPosition:'center'};
 }else if(index>=0){
  style={backgroundImage:"url('https://res.cloudinary.com/jrgtsxkt/image/upload/e_upscale/f_webp,q_90/v1795169694/campus/avatars/campus-avatar-sprite-original.webp')",backgroundSize:'400% 300%',backgroundPosition:(index%4)*100/3+'% '+Math.floor(index/4)*50+'%'};
 }
 return <span className={'campus-seller-avatar'+(large?' large':'')} style={style||{}} role="img" aria-label="Avatar du vendeur">
  {!style&&(profile?.display_name?.trim()?.charAt(0).toUpperCase()||'C')}
 </span>;
}
function SellerProfileCard({profile,sellerId,sb,defaultExpanded=false,adsCount,onOpenProfile}){
 const [expanded,setExpanded]=useState(defaultExpanded),[avatarExpanded,setAvatarExpanded]=useState(false);
 const avatarClose=useRef(null);
 useEffect(()=>{
  if(!avatarExpanded)return;
  const previous=document.activeElement;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  avatarClose.current?.focus();
  const onEscape=e=>{if(e.key==='Escape')setAvatarExpanded(false)};
  document.addEventListener('keydown',onEscape);
  return()=>{document.removeEventListener('keydown',onEscape);document.body.style.overflow=overflow;previous?.focus?.()};
 },[avatarExpanded]);
 const displayName=profile?.display_name?.trim()||'Nom non renseigné';
 const phone=profile?.phone?.trim()||'';
 const phoneHref=phone?'tel:'+phone.replace(/[^+0-9]/g,''):null;
 return <section className="campus-erp-seller" aria-label="Profil du vendeur">
  <div className="campus-erp-seller-head">
   <button type="button" className="campus-erp-seller-avatar-button" onClick={()=>setAvatarExpanded(true)} aria-label={'Agrandir la photo de profil de '+displayName} title="Voir la photo en grand"><SellerAvatar profile={profile} sb={sb}/></button>
   <div className="campus-erp-seller-identity"><small>Vendeur CAMPUS</small>{onOpenProfile?<button type="button" className="campus-seller-name-link" onClick={()=>onOpenProfile(sellerId)} aria-label={'Ouvrir la fiche de '+displayName}>{displayName}</button>:<strong>{displayName}</strong>}<span>{profile?.university||'Université non renseignée'}</span></div>
   <button type="button" className="campus-erp-seller-toggle" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?'Masquer':'Voir le profil'}</button>
  </div>
  {expanded&&<div className="campus-erp-seller-details">
   <dl><div><dt>Nom affiché</dt><dd>{displayName}</dd></div>
    <div><dt>Université</dt><dd>{profile?.university||'Non renseignée'}</dd></div>

    <div><dt>Téléphone</dt><dd>{phoneHref?<a href={phoneHref}>{phone}</a>:'Non renseigné'}</dd></div>
    {profile?.created_at&&<div><dt>Profil créé le</dt><dd>{new Date(profile.created_at).toLocaleDateString('fr-FR')}</dd></div>}
    <div><dt>Référence vendeur</dt><dd className="campus-erp-seller-id">{sellerId.slice(0,8).toUpperCase()}</dd></div>
    {typeof adsCount==='number'&&<div><dt>Annonces dans l'ERP</dt><dd>{adsCount}</dd></div>}
   </dl>
   {onOpenProfile&&<button className="campus-erp-seller-go" type="button" onClick={()=>onOpenProfile(sellerId)}>Ouvrir la fiche complète</button>}
   {!profile&&<p className="campus-erp-seller-missing">Le profil de cet étudiant n'est pas disponible avec les autorisations de ce compte.</p>}
  </div>}
  {avatarExpanded&&<div className="campus-erp-avatar-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAvatarExpanded(false)}}>
   <section className="campus-erp-avatar-dialog" role="dialog" aria-modal="true" aria-labelledby={'campus-erp-avatar-title-'+sellerId}>
    <button ref={avatarClose} type="button" className="campus-erp-avatar-close" onClick={()=>setAvatarExpanded(false)} aria-label="Fermer la photo">×</button>
    <span className="campus-erp-avatar-overline">PHOTO DE PROFIL CAMPUS</span>
    <SellerAvatar profile={profile} sb={sb} large/>
    <h3 id={'campus-erp-avatar-title-'+sellerId}>{displayName}</h3>
    <p>{profile?.university||'Étudiant CAMPUS'}</p>
    <button type="button" className="campus-erp-avatar-done" onClick={()=>setAvatarExpanded(false)}>Fermer</button>
   </section>
  </div>}
 </section>;
}

export default function ERP(){
 const sb=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return u&&k?createClient(u,k):null},[]);
 const [user,setUser]=useState(null),[role,setRole]=useState(null),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[toast,setToast]=useState(''),[tab,setTab]=useState('overview'),[bellOpen,setBellOpen]=useState(false),[permission,setPermission]=useState('unsupported');
 const bellRef=useRef(null);
 const [selectedStudentId,setSelectedStudentId]=useState(null),[profileReturnTab,setProfileReturnTab]=useState('sellers'),[profileSearch,setProfileSearch]=useState('');
 const [adminEditingListing,setAdminEditingListing]=useState(null);
 const [bugs,setBugs]=useState([]),[orders,setOrders]=useState([]),[categories,setCategories]=useState([]),[fallbackByListing,setFallbackByListing]=useState({}),[notifications,setNotifications]=useState([]),[listings,setListings]=useState([]),[agents,setAgents]=useState([]),[profiles,setProfiles]=useState([]),[sellerFilter,setSellerFilter]=useState(null),[showDeleted,setShowDeleted]=useState(false),[listingFilters,setListingFilters]=useState({search:'',status:'',university:'',category:'',currency:'',minPrice:'',maxPrice:'',sort:'newest'}),[moderationMessages,setModerationMessages]=useState({}),[revisions,setRevisions]=useState([]),[corrections,setCorrections]=useState([]),[cash,setCash]=useState([]),[inspections,setInspections]=useState([]);
 const [quoteId,setQuoteId]=useState(null),[deliveryFee,setDeliveryFee]=useState(''),[assignedAgent,setAssignedAgent]=useState(''),[quoteNote,setQuoteNote]=useState('');
 const [inspectionNotes,setInspectionNotes]=useState(''),[inspectionFiles,setInspectionFiles]=useState([]),[receipt,setReceipt]=useState(''),[staffEmail,setStaffEmail]=useState(''),[staffRole,setStaffRole]=useState('agent'),[staffActive,setStaffActive]=useState(true);
 async function refresh(account){
  if(!sb)return;setChecking(true);
  try{
   const person=account|| (await sb.auth.getUser()).data.user;setUser(person||null);
   if(!person){setRole(null);return}
   const {data:staff,error:staffError}=await sb.from('campus_staff').select('role,active').eq('user_id',person.id).maybeSingle();
   if(staffError)throw staffError;
   if(!staff?.active){setRole(null);return}
   setRole(staff.role);
   const calls=[sb.from('campus_orders').select('id,listing_id,buyer_id,agent_id,status,product_price,seller_fee,delivery_fee,currency,created_at,campus_listings(title,seller_id)').order('created_at',{ascending:false}).limit(200),sb.from('campus_listings').select('id,title,description,price,currency,category,category_proposal,has_issue,issue_details,status,images,seller_id,created_at').order('created_at',{ascending:false}).limit(200),sb.from('campus_staff').select('user_id,role,active').limit(200),sb.from('campus_profiles').select('user_id,display_name,phone,university,avatar_choice,avatar_path,avatar_updated_at,created_at').limit(300),sb.from('campus_cash_ledger').select('id,order_id,kind,amount,currency,receipt_number,recorded_by,created_at').order('created_at',{ascending:false}).limit(250),sb.from('campus_inspections').select('id,order_id,result,notes,photos,created_at,agent_id').order('created_at',{ascending:false}).limit(150)];
   const [o,l,s,p,c,i,n,cat,bug,rev,req]=await Promise.all([...calls,sb.from('campus_notifications').select('id,kind,title,body,read_at,listing_id,created_at').order('created_at',{ascending:false}).limit(80),sb.from('campus_categories').select('name,slug').order('created_at',{ascending:true}).limit(100),sb.from('campus_bug_reports').select('id,user_id,subject,description,status,created_at').order('created_at',{ascending:false}).limit(100),['admin','operations'].includes(staff.role)?sb.from('campus_listing_revisions').select('id,listing_id,seller_id,title,description,price,condition,category,category_proposal,has_issue,issue_details,images,status,submitted_at').eq('status','pending').order('submitted_at',{ascending:false}).limit(300):Promise.resolve({data:[],error:null}),['admin','operations'].includes(staff.role)?sb.from('campus_listing_correction_requests').select('id,listing_id,seller_id,message,status,warning_about_masking,created_at,seen_at,submitted_at,resolved_at,whatsapp_sent_at,whatsapp_sent_by').order('created_at',{ascending:false}).limit(400):Promise.resolve({data:[],error:null})]);
   setOrders(o.data||[]);setListings(l.data||[]);setAgents(s.data||[]);setProfiles(p.data||[]);setCash(c.data||[]);setInspections(i.data||[]);setNotifications(n.data||[]);setCategories(cat.data||[]);setBugs(bug.data||[]);setRevisions(rev.data||[]);setCorrections(req.data||[]);
   const errors=[o.error,l.error,s.error,p.error,c.error,i.error,n.error,cat.error,bug.error,rev.error,req.error].filter(Boolean);if(errors.length)setToast('Certaines données sont limitées par ton rôle : '+errors[0].message);
  }catch(e){setToast(e.message||'Impossible de charger le tableau de bord')}finally{setChecking(false)}
 }
 useEffect(()=>{if(!sb){setChecking(false);setToast('Supabase non configuré.');return}let alive=true;sb.auth.getUser().then(({data})=>{if(alive)refresh(data.user)});const {data:{subscription}}=sb.auth.onAuthStateChange((type,session)=>{if(alive&&(type==='SIGNED_IN'||type==='SIGNED_OUT')){refresh(session?.user)}});return()=>{alive=false;subscription.unsubscribe()}},[sb]);
 async function login(e){e.preventDefault();if(!sb)return;setBusy(true);setToast('');try{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;await refresh(data.user)}catch(e){setToast(e.message||'Identifiants incorrects')}finally{setBusy(false)}}
 async function recordInspection(id,result){if(busy)return;if(inspectionNotes.trim().length<15||!inspectionFiles.length){setToast('Note détaillée et au moins une photo de contrôle requises.');return}setBusy(true);setToast('Envoi des preuves de contrôle…');try{const paths=[];for(const file of inspectionFiles){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)throw Error('Photos JPG, PNG ou WebP, 5 Mo maximum.');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const name=user.id+'/'+id+'/'+crypto.randomUUID()+'.'+ext;const {error}=await sb.storage.from('campus-inspection-proof').upload(name,file,{contentType:file.type,upsert:false});if(error)throw error;paths.push(name)}const {error}=await sb.rpc('campus_record_inspection_evidence',{p_order:id,p_result:result,p_notes:inspectionNotes,p_photos:paths});if(error)throw error;setToast(result==='passed'?'Inspection conforme et preuves enregistrées.':'Non-conformité enregistrée : signale maintenant le litige.');setInspectionFiles([]);setInspectionNotes('');await refresh(user)}catch(e){setToast(e.message||'Erreur inspection')}finally{setBusy(false)}}async function logout(){await unsubscribeFromCampusPush(sb);await sb.auth.signOut();setUser(null);setRole(null);setTab('overview');setToast('')}
 async function perform(name,args,confirmText,successMessage){if(busy)return;if(confirmText&&!window.confirm(confirmText))return;setBusy(true);setToast('');try{const {error}=await sb.rpc(name,args);if(error)throw error;await refresh(user);setToast(successMessage||'Opération enregistrée.')}catch(e){setToast(e.message||'Erreur de traitement')}finally{setBusy(false)}}
 
 async function reviewSubmission(listing,approve,categoryDecision='none',fallbackCategory=null){
  if(busy||!sb||!user)return;
  const reason=(moderationMessages[listing.id]||'').trim();
  if(!approve&&reason.length>600){setToast('Le motif doit contenir au maximum 600 caractères.');return;}
  if(!approve&&!window.confirm(listing.is_revision?'Refuser ces modifications ? La version actuellement en ligne restera publiée.':'Refuser cette annonce ? Le vendeur pourra corriger et la soumettre à nouveau.'))return;
  setBusy(true);setToast('');
  try{
   const {error}=await sb.rpc(listing.is_revision?'campus_review_listing_revision':'campus_review_listing_reason',{
    p_id:listing.id,p_approve:approve,p_category_decision:categoryDecision,
    p_fallback_category:fallbackCategory,p_reason:!approve?(reason||null):null
   });
   if(error)throw error;
   if(!approve)setModerationMessages(prev=>({...prev,[listing.id]:''}));
   await refresh(user);
   setToast(listing.is_revision?(approve?'Modifications approuvées : elles remplacent maintenant la version publique.':'Modifications refusées : l’annonce d’origine reste en ligne.'):(approve?'Annonce approuvée et publiée.':'Annonce refusée. Le vendeur a été notifié'+(reason?' avec le motif.':'.')));
  }catch(e){setToast(e.message||'Impossible de traiter cette décision.');}finally{setBusy(false)}
 }
  async function moderateListing(id,action){
  if(busy||!sb||!user)return;
  const message=(moderationMessages[id]||'').trim();
  if(action!=='restore'&&message.length<8){setToast('Explique ta décision ou ta demande au vendeur en au moins 8 caractères.');return;}
  if(message.length>1200){setToast('Le message doit contenir 1 200 caractères au maximum.');return;}
  if(action==='delete'&&!window.confirm("Supprimer cette annonce du catalogue ? Cette action ne pourra pas être annulée depuis l'ERP. Son historique administratif sera conservé."))return;
  if(action==='hide'&&!window.confirm("Masquer immédiatement cette annonce du catalogue CAMPUS ?"))return;
  setBusy(true);setToast('');
  try{
   const {error}=await sb.rpc('campus_moderate_listing_action',{p_id:id,p_action:action,p_message:action==='restore'?null:message});
   if(error)throw error;
   if(action!=='restore')setModerationMessages(current=>({...current,[id]:''}));
   await refresh(user);
   setToast(({message:'Message envoyé au vendeur.',hide:'Annonce masquée et vendeur informé.',request_correction:'Correction demandée et notification créée. L’annonce reste visible si elle était publiée. Prépare maintenant la relance WhatsApp.',restore:'Annonce renvoyée en modération.',delete:'Annonce supprimée du catalogue ; historique conservé.'})[action]||'Action enregistrée.');
  }catch(e){setToast(e.message||'Impossible de modifier cette annonce.')}
  finally{setBusy(false)}
 }

 async function confirmCorrectionWhatsApp(id){
  if(!sb||!user||busy)return;
  if(!window.confirm('Confirmer uniquement après avoir envoyé le message dans WhatsApp. Le lien seul ne transmet pas le message.'))return;
  setBusy(true);setToast('');
  try{
   const {error}=await sb.rpc('campus_mark_correction_whatsapp_sent',{p_id:id});
   if(error)throw error;
   await refresh(user);
   setToast('Relance WhatsApp marquée comme envoyée par votre compte.');
  }catch(e){setToast(e.message||'Impossible de confirmer la relance WhatsApp.')}
  finally{setBusy(false)}
 }
 async function markAdminNotification(id){if(!sb)return;const when=new Date().toISOString();const {error}=await sb.from('campus_notifications').update({read_at:when}).eq('id',id);if(error){setToast('Impossible de marquer cette notification comme lue.');return;}setNotifications(arr=>arr.map(n=>n.id===id?{...n,read_at:when}:n));}
 useEffect(()=>{if(!sb||!user)return;const handle=setInterval(async()=>{const {data,error}=await sb.from('campus_notifications').select('id,kind,title,body,read_at,listing_id,created_at').order('created_at',{ascending:false}).limit(80);if(!error)setNotifications(data||[])},30000);return()=>clearInterval(handle)},[sb,user?.id]);
 useEffect(()=>{if(typeof window!=='undefined'){const tab=new URLSearchParams(window.location.search).get('tab');if(['orders','review','listings','sellers','notifications','bugs'].includes(tab))setTab(tab)}},[]);
 useEffect(()=>{
  if(typeof window!=='undefined')setPermission('Notification' in window?Notification.permission:'unsupported');
 },[]);
 useEffect(()=>{
  if(!sb||!user?.id||!role)return;
  let active=true;
  const fetchAlerts=async()=>{
   const {data,error}=await sb.from('campus_notifications').select('id,kind,title,body,read_at,listing_id,created_at').order('created_at',{ascending:false}).limit(80);
   if(active&&!error)setNotifications(data||[]);
  };
  const channel=sb.channel('campus-erp-alerts-'+user.id)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'campus_notifications',filter:'user_id=eq.'+user.id},({new:note})=>{
    if(!active||!note)return;
    setNotifications(old=>old.some(x=>x.id===note.id)?old:[note,...old].slice(0,80));
    setToast('CAMPUS : '+note.title);
    if('Notification' in window&&Notification.permission==='granted')try{new Notification('CAMPUS ERP · '+note.title,{body:note.body,tag:'campus-erp-'+note.id})}catch{}
   })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'campus_notifications',filter:'user_id=eq.'+user.id},({new:note})=>{
    if(active&&note)setNotifications(old=>old.map(x=>x.id===note.id?{...x,read_at:note.read_at}:x));
   }).subscribe();
  const onFocus=()=>{if(document.visibilityState==='visible')fetchAlerts()};
  window.addEventListener('focus',onFocus);
  document.addEventListener('visibilitychange',onFocus);
  return()=>{active=false;window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);sb.removeChannel(channel)};
 },[sb,user?.id,role]);
 useEffect(()=>{
  if(!bellOpen)return;
  const outside=e=>{if(bellRef.current&&!bellRef.current.contains(e.target))setBellOpen(false)};
  const escape=e=>{if(e.key==='Escape')setBellOpen(false)};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[bellOpen]);
 async function allowAlerts(){
  if(typeof window!=='undefined'&&'Notification' in window){
   try{setPermission(await Notification.requestPermission())}catch{}
  }
 }
 async function markAllNotifications(){
  if(!sb||!user)return;
  const now=new Date().toISOString();
  const {error}=await sb.from('campus_notifications').update({read_at:now}).eq('user_id',user.id).is('read_at',null);
  if(error){setToast('Impossible de mettre à jour les notifications.');return}
  setNotifications(old=>old.map(x=>({...x,read_at:x.read_at||now})));
 }
 async function updateBug(id,status){if(!sb)return;setBusy(true);const {error}=await sb.from('campus_bug_reports').update({status}).eq('id',id);if(error)setToast(error.message);else{setBugs(old=>old.map(b=>b.id===id?{...b,status}:b));setToast('Signalement mis à jour.')}setBusy(false)}
 const canOperate=role==='admin'||role==='operations',canFinance=role==='admin'||role==='finance',canStaff=role==='admin';
 const activeAgents=agents.filter(s=>['agent','admin'].includes(s.role)&&s.active);
 const profileOf=(id)=>profiles.find(p=>p.user_id===id)||null;
 const sellers=[...new Set(listings.map(l=>l.seller_id).filter(Boolean))];
 const studentIds=[...new Set([...profiles.map(p=>p.user_id),...sellers].filter(Boolean))].sort((a,b)=>(profileOf(a)?.display_name||'').localeCompare(profileOf(b)?.display_name||'','fr'));
 const matchingStudentIds=studentIds.filter(id=>[profileOf(id)?.display_name,profileOf(id)?.university,profileOf(id)?.phone].join(' ').toLowerCase().includes(profileSearch.trim().toLowerCase()));
 const listingFiltersDefault={search:'',status:'',university:'',category:'',currency:'',minPrice:'',maxPrice:'',sort:'newest'};
 const updateListingFilter=(key,value)=>setListingFilters(prev=>({...prev,[key]:value}));
 const resetListingFilters=()=>{setListingFilters({...listingFiltersDefault});setSellerFilter(null)};
 const lookupFilterText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const reviewQueue=[...listings.filter(l=>l.status==='pending'),...revisions.filter(r=>r.status==='pending').map(r=>{const original=listings.find(l=>l.id===r.listing_id);return original?.status==='published'?{...original,...r,id:r.listing_id,currency:original.currency,status:'pending',is_revision:true,original,created_at:r.submitted_at}:null}).filter(Boolean)];
 const baseListings=(tab==='review'?reviewQueue:listings).filter(l=>(!sellerFilter||l.seller_id===sellerFilter)&&(
  tab==='review'?true:
  showDeleted?l.status==='deleted':l.status!=='deleted'&&l.status!=='pending'
 ));
 const categoryFilterOptions=[...new Set(listings.filter(l=>l.status!=='pending'&&l.status!=='deleted').map(l=>l.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
 const universityFilterOptions=[...new Set(listings.filter(l=>l.status!=='pending'&&l.status!=='deleted').map(l=>profiles.find(p=>p.user_id===l.seller_id)?.university).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
 const sellerListings=tab==='review'?baseListings.filter(l=>!listingFilters.search||lookupFilterText(l.title).includes(lookupFilterText(listingFilters.search.trim()))):baseListings.filter(l=>{
  const q=lookupFilterText(listingFilters.search.trim()),p=profiles.find(x=>x.user_id===l.seller_id);
  if(q&&!lookupFilterText([l.title,l.description,p?.display_name,p?.phone].join(' ')).includes(q))return false;
  if(listingFilters.status&&l.status!==listingFilters.status)return false;
  if(listingFilters.university&&p?.university!==listingFilters.university)return false;
  if(listingFilters.category&&l.category!==listingFilters.category)return false;
  if(listingFilters.currency&&l.currency!==listingFilters.currency)return false;
  if(listingFilters.minPrice!==''&&Number(l.price)<Number(listingFilters.minPrice))return false;
  if(listingFilters.maxPrice!==''&&Number(l.price)>Number(listingFilters.maxPrice))return false;
  return true;
 }).sort((a,b)=>{
  if(listingFilters.sort==='oldest')return new Date(a.created_at)-new Date(b.created_at);
  if(listingFilters.sort==='price_asc')return Number(a.price)-Number(b.price);
  if(listingFilters.sort==='price_desc')return Number(b.price)-Number(a.price);
  return new Date(b.created_at)-new Date(a.created_at);
 });
 const listingFiltersActive=Boolean(sellerFilter||listingFilters.search||listingFilters.status||listingFilters.university||listingFilters.category||listingFilters.currency||listingFilters.minPrice!==''||listingFilters.maxPrice!==''||listingFilters.sort!=='newest');
 const openStudentProfile=(studentId)=>{if(!canOperate||!studentId)return;setProfileReturnTab(tab==='student_profile'?'sellers':tab);setSelectedStudentId(studentId);setTab('student_profile');window.scrollTo({top:0,behavior:'instant'});};
 const backFromStudentProfile=()=>{setTab(profileReturnTab);setSelectedStudentId(null);};
 const openAdminListing=(listing)=>{if(!canStaff||!listing)return;const original=listings.find(l=>l.id===listing.id);setAdminEditingListing(original||listing);};
 const saveAdminListing=async()=>{await refresh(user);setAdminEditingListing(null);setToast('Annonce modifiée par l’administration. Le vendeur a reçu une notification CAMPUS.');};
 const manageProfileListing=(listing)=>{setSellerFilter(listing.seller_id);setShowDeleted(listing.status==='deleted');setListingFilters({...listingFiltersDefault,search:listing.title});setTab(listing.status==='pending'?'review':'listings');setSelectedStudentId(null);};
 const nameOf=(id)=>profileOf(id)?.display_name||'Étudiant',phoneOf=(id)=>profileOf(id)?.phone||'Non renseigné';
 const unreadCount=notifications.filter(n=>!n.read_at).length;
 const menus=[{id:'overview',name:'Vue générale',icon:'grid'},...(canOperate?[{id:'marketing',name:'Marketing & audience',icon:'users'},{id:'messages',name:'Messages',icon:'clipboard'}]:[]),{id:'notifications',name:'Notifications'+(notifications.filter(n=>!n.read_at).length?' ('+notifications.filter(n=>!n.read_at).length+')':''),icon:'clipboard'},{id:'orders',name:'Commandes & missions',icon:'clipboard'},...(canOperate?[{id:'review',name:'À valider'+(reviewQueue.length?' ('+reviewQueue.length+')':''),icon:'clipboard'},{id:'listings',name:'Annonces',icon:'package'},{id:'sellers',name:'Étudiants',icon:'users'},{id:'staff',name:'Agents & équipes',icon:'users'},...(canStaff?[{id:'promotions',name:'Publicités & carrousel',icon:'grid'}]:[]),{id:'bugs',name:'Signalements'+(bugs.filter(b=>b.status==='open').length?' ('+bugs.filter(b=>b.status==='open').length+')':''),icon:'shield'}]:[]),...(canFinance?[{id:'finance',name:'Caisse & reversements',icon:'cash'}]:[])];
 const pending=reviewQueue.length,newOrders=orders.filter(o=>['requested','awaiting_confirmation'].includes(o.status)).length,activeMission=orders.filter(o=>!['completed','cancelled','disputed'].includes(o.status)).length;
 const totalCash=cash.filter(c=>c.kind==='collected'&&c.currency==='USD').reduce((a,c)=>a+Number(c.amount),0);
 const totals=[{label:'Annonces en attente',value:pending,icon:'package'},{label:'Demandes à traiter',value:newOrders,icon:'clipboard'},{label:'Missions en cours',value:activeMission,icon:'shield'},{label:'Encaissements USD consignés',value:canFinance?curr(totalCash,'USD'):'—',icon:'cash'}];
 const contentHeader=(title,desc)=><div className="content-header"><div><h1>{title}</h1><p>{desc}</p></div><button type="button" className="soft-button" onClick={()=>refresh(user)} disabled={checking}><Icon name="refresh"/> Actualiser</button></div>;
 const orderCard=(o)=>{
  const s=o.campus_listings?.seller_id,passed=inspections.filter(i=>i.order_id===o.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]?.result==='passed',hasPayout=cash.some(c=>c.order_id===o.id&&c.kind==='seller_payout');
  const next=steps[o.status];const lastInspection=inspections.filter(i=>i.order_id===o.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  return <article className="order-card" key={o.id}><div className="order-card-header"><div><span className="order-kicker">COMMANDE #{o.id.slice(0,8).toUpperCase()}</span><h3>{o.campus_listings?.title||'Produit étudiant'}</h3></div><span className={'status-tag status-'+o.status}>{status[o.status]||o.status}</span></div><div className="order-facts"><div><small>Prix de vente</small><strong>{curr(o.product_price,o.currency)}</strong></div><div><small>Livraison</small><strong>{curr(o.delivery_fee,o.currency)}</strong></div><div><small>Commission vendeur</small><strong>{curr(o.seller_fee,o.currency)}</strong></div></div><div className="order-contacts"><span><b>Acheteur :</b> {canOperate?<button type="button" className="campus-profile-inline-link" onClick={()=>openStudentProfile(o.buyer_id)}>{nameOf(o.buyer_id)}</button>:nameOf(o.buyer_id)} {canOperate||role==='agent'?'· '+phoneOf(o.buyer_id):''}</span><span><b>Vendeur :</b> {canOperate?<button type="button" className="campus-profile-inline-link" onClick={()=>openStudentProfile(s)}>{nameOf(s)}</button>:nameOf(s)} {canOperate||role==='agent'?'· '+phoneOf(s):''}</span><span><b>Responsable :</b> {o.agent_id?nameOf(o.agent_id):'Non affecté'}</span></div><p className="campus-delivery-scope"><strong>Livraison sur le campus uniquement.</strong> Fixe un point de rendez-vous avec l'acheteur sur son campus. Pas de livraison à domicile.</p>{role==='admin'&&o.agent_id&&o.agent_id!==user?.id&&['awaiting_confirmation','assigned','pickup_scheduled','collected','inspecting','approved','delivery'].includes(o.status)&&<div className="order-action"><button className="soft-button" disabled={busy} onClick={()=>perform('campus_take_over_mission',{p_order:o.id},'Reprendre cette mission à la place du responsable actuel ? Cette décision sera enregistrée dans l’historique de la commande.','Mission reprise. Tu peux maintenant effectuer les étapes de retrait, contrôle, livraison sur le campus et encaissement.')}>Reprendre cette mission (administrateur)</button></div>}{canOperate&&o.status==='requested'&&<div className="order-action"><button className="button" onClick={()=>{setQuoteId(quoteId===o.id?null:o.id);setDeliveryFee('');setAssignedAgent('');setQuoteNote('')}}>Préparer le devis de livraison</button>{quoteId===o.id&&<form className="inline-form" onSubmit={e=>{e.preventDefault();perform('campus_quote_order',{p_order:o.id,p_agent:assignedAgent,p_delivery_fee:Number(deliveryFee),p_note:quoteNote});setQuoteId(null)}}><label>Responsable de la mission<select required value={assignedAgent} onChange={e=>setAssignedAgent(e.target.value)}><option value="">Choisir un agent ou un administrateur</option>{activeAgents.map(a=><option key={a.user_id} value={a.user_id}>{a.user_id===user?.id?'Moi-même · Administrateur':nameOf(a.user_id)+' · '+(a.role==='admin'?'Administrateur':'Agent')}</option>)}</select></label><label>Frais de livraison ({o.currency})<input required type="number" min="0" step=".01" value={deliveryFee} onChange={e=>setDeliveryFee(e.target.value)}/></label><label>Point de rendez-vous sur le campus (préciser dans la note)<input maxLength={300} value={quoteNote} onChange={e=>setQuoteNote(e.target.value)} placeholder="Ex. Entrée principale du campus, à confirmer avec l'acheteur"/></label><button className="button" disabled={busy||!assignedAgent}>Soumettre à l'acheteur</button><p className="tiny">L'acheteur doit accepter les frais avant la récupération. La remise se fait uniquement sur le campus, au point convenu avec l'acheteur.</p></form>}{!activeAgents.length&&<p className="tiny">Ajoute d'abord un agent CAMPUS actif ou un administrateur dans Agents & équipes.</p>}</div>}{(role==='agent'||role==='admin')&&o.agent_id===user?.id&&next&&<div className="order-action">{o.status==='inspecting'&&<><label>Compte rendu d'inspection<textarea rows={3} value={inspectionNotes} onChange={e=>setInspectionNotes(e.target.value)} placeholder="Tests effectués, état, accessoires, défauts… (15 caractères minimum)"/></label><label>Photos de contrôle (1 à 6)<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>setInspectionFiles(Array.from(e.target.files||[]).slice(0,6))}/></label><p className="tiny">{inspectionFiles.length} photo(s) sélectionnée(s). Les images d'inspection sont privées et accessibles aux personnes autorisées.</p><div className="action-row"><button className="button" disabled={busy||inspectionNotes.trim().length<15||!inspectionFiles.length} onClick={()=>recordInspection(o.id,'passed')}>Inspection conforme</button><button className="soft-button" disabled={busy||inspectionNotes.trim().length<15||!inspectionFiles.length} onClick={()=>recordInspection(o.id,'failed')}>Signaler un défaut</button></div>{lastInspection?.result==='failed'&&<button className="soft-button" disabled={busy} onClick={()=>perform('campus_flag_order',{p_order:o.id},'Signaler officiellement un litige sur ce produit ?')}>Mettre en litige</button>}{passed&&<p className="positive">Inspection conforme enregistrée. Tu peux maintenant valider cette étape.</p>}</>}{(o.status!=='inspecting'||passed)&&<button className="button" disabled={busy} onClick={()=>perform('campus_agent_progress',{p_order:o.id,p_next:next[0],p_note:''})}>{next[1]}</button>}</div>}{(role==='agent'||role==='admin')&&o.agent_id===user?.id&&o.status==='delivery'&&<form className="order-action" onSubmit={e=>{e.preventDefault();perform('campus_record_cash',{p_order:o.id,p_receipt:receipt},"Confirmer que tu as réellement encaissé "+curr(Number(o.product_price)+Number(o.delivery_fee),o.currency)+" en espèces ?");setReceipt('')}}><label>Numéro du reçu cash<input required minLength={5} maxLength={80} value={receipt} onChange={e=>setReceipt(e.target.value)} placeholder="CAMPUS-RECU-0001"/></label><button className="button" disabled={busy}>Enregistrer l'encaissement réel</button></form>}{canFinance&&o.status==='completed'&&!hasPayout&&<form className="order-action" onSubmit={e=>{e.preventDefault();const val=e.currentTarget.elements.namedItem('payoutReceipt').value;perform('campus_record_payout',{p_order:o.id,p_receipt:val},"Confirmer que le vendeur a réellement reçu "+curr(Number(o.product_price)-Number(o.seller_fee),o.currency)+" ?")}}><label>Justificatif de reversement vendeur<input name="payoutReceipt" required minLength={5} maxLength={80} placeholder="PAYOUT-0001"/></label><button className="button" disabled={busy}>Enregistrer le reversement effectué</button></form>}{o.status==='paid'&&<p className="subtle-note">En attente de la confirmation de réception par l'acheteur depuis son espace CAMPUS.</p>}{hasPayout&&<p className="positive">Reversement vendeur déjà enregistré.</p>}</article>
 };
 return <><header className="erp-mobile-brand"><img src={logo} alt="" width="36" height="36"/><strong>CAMPUS <span>ERP</span></strong></header>{checking&&!user?<main className="auth-view"><p>Connexion à CAMPUS…</p></main>:!user?<main className="auth-view"><div className="auth-panel"><div className="auth-mark"><img src={logo} alt="Logo CAMPUS" width="66" height="66"/><strong>CAMPUS <span>ERP</span></strong></div><span className="overline">ESPACE RÉSERVÉ</span><h1>Gérer les transactions en toute confiance.</h1><p>Connecte-toi avec ton compte agent ou administrateur autorisé. Les agents assurent aussi la livraison sur le campus.</p><form onSubmit={login}><label htmlFor="admin-email">Adresse email<input id="admin-email" required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label htmlFor="admin-password">Mot de passe<input id="admin-password" required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label><button className="button full" disabled={busy}>Se connecter à l'ERP</button></form><div className="auth-foot">Accès sécurisé · CAMPUS by NKS Services</div>{toast&&<div className="notice-error" role="alert">{toast}</div>}</div></main>:!role?<main className="auth-view"><div className="auth-panel"><h1>Accès non autorisé</h1><p>Ton compte est connecté, mais aucun rôle actif ne t'a été attribué dans CAMPUS ERP.</p><button className="button" onClick={logout}>Déconnexion</button></div></main>:<div className="erp-shell"><aside className="erp-sidebar"><div className="sidebar-logo"><img src={logo} width="43" height="43" alt=""/><strong>CAMPUS <span>ERP</span></strong></div><div className="sidebar-title">ESPACE DE TRAVAIL</div><nav aria-label="Navigation ERP">{menus.map(m=><button key={m.id} type="button" className={tab===m.id?'active':''} onClick={()=>setTab(m.id)}><Icon name={m.icon}/>{m.name}</button>)}</nav><div className="sidebar-footer"><div className="user-avatar">{user.email?.slice(0,1)?.toUpperCase()||'C'}</div><div><strong>{roles[role]}</strong><small>{user.email}</small></div><button aria-label="Déconnexion" className="icon-button" onClick={logout}><Icon name="logout"/></button></div></aside><main className="erp-main"><div className="erp-mobile-nav" role="navigation" aria-label="Sections ERP">{menus.map(m=><button key={m.id} type="button" className={tab===m.id?'active':''} onClick={()=>setTab(m.id)}>{m.name}</button>)}</div>{role&&<div className="erp-notification-bar" aria-label="Notifications de l'équipe">
 <CampusPushControl compact/><div className="erp-notification-bell" ref={bellRef}>
  <button type="button" className="erp-notification-trigger" aria-label={'Notifications ERP'+(unreadCount?' : '+unreadCount+' non lues':'')} aria-haspopup="dialog" aria-expanded={bellOpen} onClick={()=>setBellOpen(v=>!v)}>
   <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9zM10 21h4"/></svg>
   {unreadCount>0&&<span className="erp-notification-count">{unreadCount>9?'9+':unreadCount}</span>}
  </button>
  {bellOpen&&<div className="erp-notification-popover" role="dialog" aria-label="Dernières notifications ERP">
   <div className="erp-notification-popover-head"><div><strong>Notifications</strong><small>{unreadCount?unreadCount+' non lue'+(unreadCount>1?'s':''):'Tout est à jour'}</small></div><button type="button" aria-label="Fermer" onClick={()=>setBellOpen(false)}>×</button></div>
   {notifications.length?<div className="erp-notification-popover-list">{notifications.slice(0,6).map(n=><article key={n.id} className={'erp-notification-popover-item'+(!n.read_at?' unread':'')}><strong>{n.title}</strong><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString('fr-FR')}</small>{!n.read_at&&<button type="button" onClick={()=>markAdminNotification(n.id)}>Marquer comme lue</button>}</article>)}</div>:<p className="erp-notification-popover-empty">Aucune notification pour le moment.</p>}
   <div className="erp-notification-popover-foot">
    <button type="button" onClick={()=>{setTab('notifications');setBellOpen(false)}}>Toutes les notifications</button>
    {unreadCount>0&&<button type="button" onClick={markAllNotifications}>Tout marquer comme lu</button>}
    {permission==='default'&&<button type="button" onClick={allowAlerts}>Activer les alertes</button>}
   </div>
  </div>}
 </div>
</div>}{toast&&<div className="notice-info" role="status">{toast}<button type="button" onClick={()=>setToast('')} aria-label="Fermer">×</button></div>}{tab==='promotions'&&canStaff&&<CampusPromoManager sb={sb}/>} {tab==='marketing'&&canOperate&&<CampusMarketingDashboard sb={sb}/>} {tab==='messages'&&canOperate&&<CampusMessagesLibrary profiles={profiles} listings={listings}/>} {tab==='overview'&&<>{contentHeader('Tableau de bord','Un aperçu en temps réel des opérations CAMPUS.')}{<div className="stats-grid">{totals.map(t=><div className="stat-card" key={t.label}><div className="stat-icon"><Icon name={t.icon} size={23}/></div><strong>{t.value}</strong><span>{t.label}</span></div>)}</div>}<div className="welcome-grid"><div className="panel"><h2>Activité récente</h2>{orders.slice(0,5).length?orders.slice(0,5).map(o=><div className="activity-item" key={o.id}><span>{o.campus_listings?.title||'Commande'}</span><b>{status[o.status]||o.status}</b></div>):<p className="muted">Aucune commande pour le moment.</p>}</div><div className="panel help-panel"><Icon name="shield" size={32}/><h2>Une plateforme contrôlée</h2><p>Les encaissements ne sont jamais simulés : chaque paiement et reversement nécessite une action d'un membre autorisé ainsi qu'un justificatif unique.</p><button className="soft-button" onClick={()=>setTab('orders')}>Consulter les missions</button></div></div></>}{tab==='notifications'&&role&&<>{contentHeader('Notifications CAMPUS','Alertes de mission, commandes, inspections, livraison et modération.')}{<CampusEmailDeliveryStatus sb={sb} user={user} notifications={notifications}/>}{!notifications.length?<div className="empty-panel">Aucune notification à afficher.</div>:<div className="panel erp-notification-panel">{notifications.map(n=><article className={'erp-notification-entry'+(!n.read_at?' unread':'')} key={n.id}><div className="erp-notification-copy"><div className="erp-notification-overline">{['listing_review_requested','listing_revision_review_requested'].includes(n.kind)?'À VALIDER':'MISE À JOUR'} {!n.read_at&&<span className="erp-notification-ping">NOUVEAU</span>}</div><h3>{n.title}</h3><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString('fr-FR')}</small></div><div className="erp-notification-actions">{['listing_review_requested','listing_revision_review_requested'].includes(n.kind)&&canOperate&&<button className="button" type="button" onClick={()=>{setSellerFilter(null);setShowDeleted(false);setTab('review');markAdminNotification(n.id)}}>Examiner l'annonce</button>}{n.kind.startsWith('order_')&&<button className="button" type="button" onClick={()=>{setTab('orders');markAdminNotification(n.id)}}>Voir les missions</button>}{n.kind==='bug_reported'&&canOperate&&<button className="button" type="button" onClick={()=>{setTab('bugs');markAdminNotification(n.id)}}>Voir le signalement</button>}{!n.read_at&&<button type="button" className="soft-button" onClick={()=>markAdminNotification(n.id)}>Marquer comme lue</button>}</div></article>)}</div>}</>}{tab==='bugs'&&canOperate&&<>{contentHeader('Signalements de bugs','Problèmes transmis par les étudiants.')}{!bugs.length?<div className="empty-panel">Aucun signalement pour le moment.</div>:<div className="panel campus-bugs-list">{bugs.map(b=><article className="campus-bug-item" key={b.id}><div><span className="tag">{b.status==='open'?'À examiner':b.status==='investigating'?'En cours':'Résolu'}</span><h3>{b.subject}</h3><p>{b.description}</p><small>{new Date(b.created_at).toLocaleString('fr-FR')}</small></div><select disabled={busy} aria-label={'Statut du bug '+b.subject} value={b.status} onChange={e=>updateBug(b.id,e.target.value)}><option value="open">À examiner</option><option value="investigating">En cours</option><option value="resolved">Résolu</option></select></article>)}</div>}</>}{adminEditingListing&&canStaff&&<CampusAdminEditListing key={adminEditingListing.id} sb={sb} listing={adminEditingListing} categories={categories} onClose={()=>setAdminEditingListing(null)} onSaved={saveAdminListing}/>}{tab==='student_profile'&&canOperate&&selectedStudentId&&<CampusStudentProfile key={selectedStudentId} sb={sb} studentId={selectedStudentId} initialProfile={profileOf(selectedStudentId)} staff={agents} onBack={backFromStudentProfile} onManageListing={manageProfileListing} onEditListing={canStaff?openAdminListing:undefined}/>}{tab==='sellers'&&canOperate&&<>{contentHeader('Profils étudiants','Ouvre la fiche de chaque étudiant pour consulter toutes ses annonces, ses ventes et ses retraits ou suppressions.')}<label className="campus-profile-directory-search">Rechercher un étudiant<input type="search" value={profileSearch} placeholder="Nom, université, téléphone…" onChange={e=>setProfileSearch(e.target.value)}/></label>{!matchingStudentIds.length?<div className="empty-panel">Aucun étudiant correspondant à la recherche.</div>:<div className="campus-erp-sellers-grid">{matchingStudentIds.map(studentId=><SellerProfileCard key={studentId} sellerId={studentId} profile={profileOf(studentId)} sb={sb} onOpenProfile={openStudentProfile}/>)}</div>}</>}
 {(tab==='review'||tab==='listings')&&canOperate&&<>{contentHeader(
 tab==='review'?'Annonces à valider':'Gestion des annonces',
 tab==='review'?'Nouvelles annonces et propositions de modification : les versions publiques restent en ligne pendant leur examen.':'Annonces déjà traitées : publiées, masquées, refusées ou clôturées. Les annonces en attente sont dans « À valider ».'
)}{tab==='listings'&&<>
 <div className="campus-moderation-filter"><span>{showDeleted?'Archives des annonces supprimées':'Annonces hors attente de validation'}</span><button type="button" onClick={()=>{setShowDeleted(v=>!v);updateListingFilter('status','')}}>{showDeleted?'Retour aux annonces':'Voir les annonces supprimées'}</button></div>
 <section className="campus-listing-filter-panel" aria-label="Filtrer les annonces">
  <div className="campus-listing-filter-header"><strong>Rechercher et filtrer</strong><button type="button" onClick={resetListingFilters} disabled={!listingFiltersActive}>Effacer les filtres</button></div>
  <div className="campus-listing-filter-grid">
   <label className="campus-listing-filter-search">Rechercher un produit ou un vendeur<input type="search" value={listingFilters.search} placeholder="Nom du produit, vendeur…" onChange={e=>updateListingFilter('search',e.target.value)} autoComplete="off"/></label>
   {!showDeleted&&<label>Statut<select value={listingFilters.status} onChange={e=>updateListingFilter('status',e.target.value)}>
    <option value="">Tous les statuts</option><option value="published">Publiées</option><option value="hidden">Masquées</option><option value="rejected">Refusées</option><option value="draft">Brouillons</option><option value="reserved">Réservées</option><option value="sold">Vendues</option><option value="archived">Archivées</option>
   </select></label>}
   <label>Université<select value={listingFilters.university} onChange={e=>updateListingFilter('university',e.target.value)}>
    <option value="">Toutes les universités</option>{universityFilterOptions.map(u=><option key={u} value={u}>{u}</option>)}
   </select></label>
   <label>Catégorie<select value={listingFilters.category} onChange={e=>updateListingFilter('category',e.target.value)}>
    <option value="">Toutes les catégories</option>{categoryFilterOptions.map(c=><option key={c} value={c}>{c}</option>)}
   </select></label>
   <label>Devise<select value={listingFilters.currency} onChange={e=>updateListingFilter('currency',e.target.value)}>
    <option value="">Toutes</option><option value="USD">USD</option><option value="CDF">CDF</option>
   </select></label>
   <label>Prix minimum<input type="number" min="0" step="any" inputMode="decimal" placeholder="Min." value={listingFilters.minPrice} onChange={e=>updateListingFilter('minPrice',e.target.value)}/></label>
   <label>Prix maximum<input type="number" min="0" step="any" inputMode="decimal" placeholder="Max." value={listingFilters.maxPrice} onChange={e=>updateListingFilter('maxPrice',e.target.value)}/></label>
   <label>Trier par<select value={listingFilters.sort} onChange={e=>updateListingFilter('sort',e.target.value)}>
    <option value="newest">Plus récentes</option><option value="oldest">Plus anciennes</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option>
   </select></label>
  </div>
  <div className="campus-listing-filter-results" aria-live="polite">
   <strong>{sellerListings.length}</strong> annonce{sellerListings.length!==1?'s':''} affichée{sellerListings.length!==1?'s':''} sur {baseListings.length}
   {listingFilters.currency===''&&(listingFilters.minPrice!==''||listingFilters.maxPrice!=='')&&<span>Les montants sont comparés dans leur devise d’origine. Choisis USD ou CDF pour un filtre de prix précis.</span>}
  </div>
 </section>
 </>}{sellerFilter&&<div className="campus-erp-seller-filter"><span>Annonces de <strong>{nameOf(sellerFilter)}</strong></span><button type="button" onClick={()=>setSellerFilter(null)}>Afficher toutes les annonces</button></div>}{!sellerListings.length?<div className="empty-panel">{tab==='review'?'Aucune annonce en attente de validation.':listingFiltersActive?'Aucune annonce ne correspond aux filtres choisis.':showDeleted?'Aucune annonce supprimée.':'Aucune annonce dans cette section.'}</div>:<div className="listing-grid">{sellerListings.map(l=><article className="listing-card" key={l.id}><div className="listing-cover">{l.images?.[0]?<img src={l.images[0]} alt={l.title}/>:<div className="placeholder-cover"><Icon name="package" size={46}/></div>}</div><div className="listing-body"><span className={'status-tag status-'+l.status}>{l.is_revision?'Modification à valider':status[l.status]||l.status}</span>{!l.is_revision&&revisions.some(r=>r.listing_id===l.id&&r.status==='pending')&&<span className="campus-revision-live-tag">Modifications en attente · annonce toujours en ligne</span>}<h3>{l.title}</h3><p className="muted">{l.description}</p><strong>{curr(l.price,l.currency)}</strong><div className="listing-meta">{l.category_proposal&&l.status==='pending'?'Catégorie à valider':l.category} · {l.images?.length||0} photo(s)</div>
<SellerProfileCard key={l.seller_id} sellerId={l.seller_id} profile={profileOf(l.seller_id)} sb={sb} onOpenProfile={openStudentProfile}/>
{canStaff&&!l.is_revision&&['draft','pending','published','rejected','hidden'].includes(l.status)&&<div className="campus-admin-edit-entry"><button type="button" className="campus-admin-edit-entry-button" disabled={busy} onClick={()=>openAdminListing(l)}><Icon name="clipboard" size={16}/> Modifier l’annonce</button><span>Édition administrative · vendeur notifié automatiquement</span></div>}

{!l.is_revision&&campusHasDirectContact(l.description)&&<div className="campus-contact-warning-erp" role="note">
 <strong>Coordonnées personnelles ou lien externe détecté dans la description</strong>
 <p>Ce contenu peut entraîner une transaction en dehors de CAMPUS. Demande au vendeur de retirer ses coordonnées avant de poursuivre la vente.</p>
 <button type="button" onClick={()=>setModerationMessages(current=>({...current,[l.id]:"Votre annonce contient un numéro personnel ou un moyen de contact direct. Les transactions doivent passer par CAMPUS pour permettre l’inspection, la livraison sur le campus et le suivi du paiement. Veuillez retirer ces coordonnées de la description et soumettre les modifications à validation. Sans correction, l’annonce pourra être masquée."}))}>Préparer le message de correction</button>
</div>}


{!l.is_revision&&corrections.filter(r=>r.listing_id===l.id).slice(0,1).map(req=>{
 const href=campusWhatsAppReminder(profileOf(l.seller_id),l,req);
 return <section key={req.id} className="campus-correction-followup" aria-label={'Demande de changement pour '+l.title}>
  <div className="campus-correction-followup-top"><strong>Demande de changement transmise</strong>
   <span>{req.status==='requested'?'En attente de correction':req.status==='submitted'?'Correction envoyée en validation':req.status==='resolved'?'Correction validée':req.status==='masked'?'Annonce masquée':'Remplacée par une nouvelle demande'}</span>
  </div>
  <p>{req.message}</p>
  <small>Créée le {new Date(req.created_at).toLocaleString('fr-FR',{timeZone:'Africa/Lubumbashi'})}
   {req.seen_at?' · Alerte ouverte par le vendeur':' · Alerte non encore confirmée'}</small>
  {req.status!=='superseded'&&<div className="campus-correction-whatsapp-actions">
   {href?<a href={href} target="_blank" rel="noopener noreferrer" className="campus-correction-whatsapp-link">Ouvrir WhatsApp avec le message préparé</a>:<span className="campus-correction-whatsapp-missing">Numéro WhatsApp du vendeur non renseigné ou invalide.</span>}
   {req.whatsapp_sent_at?<span className="campus-correction-whatsapp-done">Relance WhatsApp déclarée envoyée le {new Date(req.whatsapp_sent_at).toLocaleString('fr-FR',{timeZone:'Africa/Lubumbashi'})}</span>:href&&<button type="button" disabled={busy} onClick={()=>confirmCorrectionWhatsApp(req.id)}>J’ai envoyé le WhatsApp</button>}
  </div>}
  <small>Le message WhatsApp n'est pas envoyé automatiquement : il faut cliquer sur Envoyer dans WhatsApp, puis confirmer ici.</small>
 </section>;
})}


{l.is_revision&&<section className="campus-revision-comparison" aria-label="Comparaison de la version publique et des modifications">
 <strong>Modification d’une annonce déjà publiée</strong>
 <p>La version approuvée reste visible aux acheteurs jusqu’à une validation. En cas de refus, elle reste inchangée.</p>
 <div className="campus-revision-versions">
  <div><span>VERSION ACTUELLEMENT PUBLIÉE</span><h4>{l.original.title}</h4><p>{l.original.description}</p><b>{curr(l.original.price,l.original.currency)}</b><small>Catégorie : {l.original.category} · {l.original.images?.length||0} photo(s)</small></div>
  <div><span>MODIFICATIONS PROPOSÉES</span><h4>{l.title}</h4><p>{l.description}</p><b>{curr(l.price,l.currency)}</b><small>Catégorie : {l.category} · {l.images?.length||0} photo(s)</small></div>
 </div>
</section>}

{l.has_issue?<div className="campus-review-defect"><strong>Défaut déclaré par le vendeur</strong><p>{l.issue_details}</p></div>:<p className="campus-review-no-defect">Aucun défaut déclaré par le vendeur.</p>}
{l.category_proposal&&l.status==='pending'&&<div className="campus-category-review">
 <div className="campus-category-proposal-heading"><span className="campus-category-proposal-label">Catégorie proposée par le vendeur</span><strong>« {l.category_proposal} »</strong></div>
 <p>En validant cette catégorie, elle sera ajoutée au catalogue CAMPUS (si elle n'existe pas encore), et cette annonce sera publiée directement dedans.</p>
 <button className="campus-category-approve-button" type="button" disabled={busy||!l.images?.length} onClick={()=>reviewSubmission(l,true,'accept')}>Valider la catégorie</button>
 <label htmlFor={'fallback-'+l.id}>Ou reclasser cette annonce</label>
 <select id={'fallback-'+l.id} value={fallbackByListing[l.id]||''} onChange={e=>setFallbackByListing(current=>({...current,[l.id]:e.target.value}))}><option value="">Choisir une catégorie existante</option>{categories.map(cat=><option key={cat.slug} value={cat.name}>{cat.name}</option>)}</select>
 <button type="button" className="soft-button" disabled={busy||!l.images?.length||!fallbackByListing[l.id]} onClick={()=>reviewSubmission(l,true,'fallback',fallbackByListing[l.id])}>Reclasser et approuver</button>
</div>}

{l.status!=='deleted'&&!l.is_revision&&<section className="campus-moderation-panel" aria-label={'Modération de '+l.title}>
 <div className="campus-moderation-heading"><strong>Contacter le vendeur</strong><small>Son compte recevra la notification dans CAMPUS.</small></div>
 <label htmlFor={'moderation-message-'+l.id}>Message ou motif à transmettre</label>
 <textarea id={'moderation-message-'+l.id} rows={3} maxLength={1200} value={moderationMessages[l.id]||''}
 onChange={e=>setModerationMessages(current=>({...current,[l.id]:e.target.value}))}
 placeholder="Ex. Ajoute une photo nette du produit, sans filtre, et précise l'état de la batterie."/>
 <div className="campus-moderation-actions">
 {l.status!=='archived'&&l.status!=='sold'&&<button className="campus-moderation-btn" disabled={busy} type="button" onClick={()=>moderateListing(l.id,'message')}>Envoyer un message</button>}
 {['draft','pending','published','rejected','hidden'].includes(l.status)&&<button className="campus-moderation-btn primary" disabled={busy} type="button" onClick={()=>moderateListing(l.id,'request_correction')}>Demander un changement</button>}
 {['draft','pending','published','rejected'].includes(l.status)&&<button className="campus-moderation-btn caution" disabled={busy} type="button" onClick={()=>moderateListing(l.id,'hide')}>Masquer</button>}
 {l.status==='hidden'&&<button className="campus-moderation-btn primary" disabled={busy} type="button" onClick={()=>moderateListing(l.id,'restore')}>Remettre en validation</button>}
 {canStaff&&!['reserved','sold'].includes(l.status)&&<button className="campus-moderation-btn danger" disabled={busy} type="button" onClick={()=>moderateListing(l.id,'delete')}>Supprimer l'annonce</button>}
 </div>
 <small className="campus-moderation-footnote">Une demande de changement avertit le vendeur sans masquer automatiquement une annonce déjà publiée. Le masquage immédiat reste une décision de modération distincte.</small>
 </section>}

{l.status==='pending'&&<section className="campus-review-decision"><label htmlFor={'review-reason-'+l.id}>Motif du refus <span>(facultatif, transmis au vendeur)</span></label><textarea id={'review-reason-'+l.id} rows={2} maxLength={600} value={moderationMessages[l.id]||''} onChange={e=>setModerationMessages(prev=>({...prev,[l.id]:e.target.value}))} placeholder="Ex. Photo floue, informations inexactes, description à préciser…"/><div className="action-row">
 {!l.category_proposal&&<button className="button" disabled={busy||!l.images?.length} onClick={()=>reviewSubmission(l,true)}>Approuver</button>}
 <button className="soft-button" disabled={busy} onClick={()=>reviewSubmission(l,false)}>{l.is_revision?'Refuser les modifications':"Refuser l'annonce"}</button>
</div></section>}</div></article>)}</div>}</>}{tab==='orders'&&<>{contentHeader(role==='agent'?'Mes missions':'Commandes et missions','Suivi des récupérations, des inspections, des remises sur campus et des paiements. Un agent peut livrer; un administrateur peut également prendre en charge une mission.')}{!orders.length?<div className="empty-panel">Aucune commande pour le moment. Les demandes des acheteurs apparaîtront ici.</div>:<div className="order-grid">{orders.map(orderCard)}</div>}</>}{tab==='staff'&&canOperate&&<>{contentHeader('Agents et équipe','Comptes habilités aux inspections, opérations et encaissements.')}{canStaff&&<form className="panel staff-form" onSubmit={e=>{e.preventDefault();perform('campus_grant_staff',{p_user_email:staffEmail,p_role:staffRole,p_active:staffActive},"Attribuer le rôle "+staffRole+" à "+staffEmail+" ?")}}><h2>Attribuer un rôle</h2><p className="muted">Le collaborateur doit d'abord créer un compte sur CAMPUS avec son adresse email.</p><div className="staff-fields"><label>Email du collaborateur<input type="email" required value={staffEmail} onChange={e=>setStaffEmail(e.target.value)}/></label><label>Rôle<select value={staffRole} onChange={e=>setStaffRole(e.target.value)}><option value="agent">Agent</option><option value="operations">Opérations</option><option value="finance">Finances</option><option value="admin">Administrateur</option></select></label><label className="checkbox-label"><input type="checkbox" checked={staffActive} onChange={e=>setStaffActive(e.target.checked)}/>Compte actif</label></div><button className="button" disabled={busy}>Enregistrer les autorisations</button></form>}<div className="panel"><h2>Collaborateurs enregistrés</h2>{!agents.length?<p>Aucun collaborateur actif. Un premier administrateur doit être créé manuellement dans Supabase.</p>:<div className="staff-list">{agents.map(a=><div className="staff-item" key={a.user_id}><div className="user-avatar">{nameOf(a.user_id).slice(0,1).toUpperCase()}</div><div><strong>{nameOf(a.user_id)}</strong><small>{a.user_id.slice(0,8)}</small></div><span className="status-tag">{roles[a.role]||a.role} {a.active?'· Actif':'· Désactivé'}</span></div>)}</div>}</div></>}{tab==='finance'&&canFinance&&<>{contentHeader('Caisse et reversements','Mouvements d’espèces enregistrés et contrôles comptables.')}{<div className="stats-grid"><div className="stat-card"><div className="stat-icon"><Icon name="cash"/></div><strong>{curr(totalCash,'USD')}</strong><span>Cash collecté en USD (historique)</span></div><div className="stat-card"><div className="stat-icon"><Icon name="clipboard"/></div><strong>{cash.filter(c=>c.kind==='seller_payout').length}</strong><span>Reversements consignés</span></div></div>}<div className="panel"><h2>Journal de caisse</h2>{!cash.length?<p className="muted">Aucun encaissement enregistré. Aucun montant fictif n'est affiché.</p>:<div className="table-scroll"><table><thead><tr><th>Opération</th><th>Montant</th><th>Justificatif</th><th>Date</th></tr></thead><tbody>{cash.map(c=><tr key={c.id}><td>{c.kind==='collected'?'Espèces collectées':c.kind==='seller_payout'?'Paiement vendeur':c.kind}</td><td>{curr(c.amount,c.currency)}</td><td>{c.receipt_number||'—'}</td><td>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td></tr>)}</tbody></table></div>}</div><p className="muted">Pour enregistrer un reversement, ouvre la commande concernée dans « Commandes et missions » une fois la réception confirmée par l'acheteur.</p></>}</main></div>}</>
}
