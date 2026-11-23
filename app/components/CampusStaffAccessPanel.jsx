'use client';
import {useEffect,useState} from 'react';
import './CampusStaffAccessPanel.css';

const ROLES=[
 {id:'agent',label:'Agent agréé',detail:'Inspections, missions terrain, récupération, livraison et encaissement sur le campus.'},
 {id:'operations',label:'Responsable des opérations',detail:'Gestion des annonces, commandes, équipe terrain, étudiants et modération.'},
 {id:'finance',label:'Responsable caisse',detail:'Suivi de la caisse et des reversements aux vendeurs.'},
 {id:'admin',label:'Administrateur',detail:'Accès complet à l’ERP, y compris l’attribution des rôles et la gestion des accès.'}
];
const roleName=id=>ROLES.find(role=>role.id===id)?.label||id||'Aucun accès';
export default function CampusStaffAccessPanel({sb,studentId,profile,currentStaff,currentUserId,onClose,onSaved}){
 const member=currentStaff||null;
 const [role,setRole]=useState(member?.role||'agent');
 const [active,setActive]=useState(member?.active??true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [showDetails,setShowDetails]=useState(false);
 const myOwnAccess=currentUserId===studentId;
 const changed=!member||member.role!==role||member.active!==active;
 useEffect(()=>{
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onKey=e=>{if(e.key==='Escape'&&!busy)onClose()};
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKey)};
 },[busy,onClose]);
 const submit=async e=>{
  e.preventDefault();
  if(busy||!changed)return;
  setError('');
  if(myOwnAccess&&(role!=='admin'||!active)){
   setError('Tu ne peux pas retirer tes propres droits administrateur.');return
  }
  const name=profile?.display_name?.trim()||'cet étudiant';
  const description=active?
   ('Confirmer '+(member?'le changement de rôle':'l’attribution d’un accès ERP')+' pour '+name+' en tant que '+roleName(role)+' ?'+
   (role==='admin'?'\n\nATTENTION : cet accès donne également le droit de promouvoir d’autres utilisateurs et de gérer l’ensemble de CAMPUS.':'')):
   ('Désactiver l’accès ERP de '+name+' ? La personne conservera son compte étudiant et ses annonces.');
  if(!window.confirm(description))return;
  setBusy(true);
  try{
   const {data,error:fail}=await sb.rpc('campus_manage_staff_by_user_id',{
    p_user_id:studentId,p_role:role,p_active:active
   });
   if(fail)throw fail;
   await onSaved?.({role,active,changed:Boolean(data?.changed)});
  }catch(err){setError(err.message||'Impossible de mettre à jour les autorisations ERP.')}
  finally{setBusy(false)}
 };
 return <div className="campus-role-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)onClose()}}>
  <section className="campus-role-dialog" role="dialog" aria-modal="true" aria-labelledby="campus-role-title">
   <header className="campus-role-heading">
    <div><small>GESTION DES ACCÈS · CAMPUS</small><h2 id="campus-role-title">{member?'Modifier l’accès ERP':'Promouvoir vers l’ERP'}</h2>
     <p>{profile?.display_name?.trim()||'Étudiant CAMPUS'}{profile?.university?' · '+profile.university:''}</p>
    </div>
    <button type="button" className="campus-role-close" aria-label="Fermer" onClick={onClose} disabled={busy}>×</button>
   </header>
   <form onSubmit={submit} className="campus-role-form">
    <div className="campus-role-existing">
     <span>Accès actuel</span>
     <strong>{member?(roleName(member.role)+(member.active?' · Actif':' · Désactivé')):'Compte étudiant — aucun rôle ERP'}</strong>
    </div>
    <label className="campus-role-select">Rôle à attribuer
     <select value={role} onChange={e=>setRole(e.target.value)} disabled={busy}>
      {ROLES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
     </select>
    </label>
    <p className={'campus-role-description'+(role==='admin'?' campus-role-description-alert':'')}>
     <strong>{roleName(role)}</strong>
     {ROLES.find(x=>x.id===role)?.detail}
    </p>
    {member&&<label className="campus-role-active">
     <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} disabled={busy||(myOwnAccess&&role==='admin')}/>
     Accès ERP actif
    </label>}
    {!member&&<div className="campus-role-new-note">L’étudiant pourra se connecter à l’ERP avec les identifiants de son compte CAMPUS, sans créer de nouveau compte.</div>}
    <button type="button" className="campus-role-what-button" aria-expanded={showDetails} onClick={()=>setShowDetails(v=>!v)}>Voir le détail des 4 rôles {showDetails?'−':'+'}</button>
    {showDetails&&<div className="campus-role-permissions">{ROLES.map(x=><div key={x.id}><strong>{x.label}</strong><p>{x.detail}</p></div>)}</div>}
    <p className="campus-role-confidentiality">Accès réservé aux comptes autorisés. Les changements sont enregistrés dans l’historique de sécurité ; le compte conserve ses droits d’achat et de vente sur CAMPUS.</p>
    {error&&<div className="campus-role-error" role="alert">{error}</div>}
    <div className="campus-role-footer">
     <button type="button" onClick={onClose} disabled={busy}>Annuler</button>
     <button type="submit" className={active?'campus-role-save':'campus-role-disable'} disabled={busy||!changed||myOwnAccess&&(role!=='admin'||!active)}>
      {busy?'Enregistrement…':!active?'Désactiver l’accès':member?'Enregistrer les autorisations':'Donner accès à l’ERP'}
     </button>
    </div>
   </form>
  </section>
 </div>;
}
