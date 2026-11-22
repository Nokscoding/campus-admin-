'use client';
import {useEffect,useState} from 'react';
import './CampusEmailDeliveryStatus.css';

const time=value=>{
 if(!value)return '';
 try{return new Date(value).toLocaleString('fr-FR',{timeZone:'Africa/Lubumbashi',dateStyle:'short',timeStyle:'short'})}
 catch{return ''}
};
const labels={queued:'En attente',sending:'En cours',sent:'Envoyé',failed:'Nouvelle tentative prévue'};

export default function CampusEmailDeliveryStatus({sb,user,notifications=[]}){
 const [records,setRecords]=useState([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const refresh=async()=>{
  if(!sb||!user?.id)return;
  setLoading(true);setError('');
  const {data,error:e}=await sb.from('campus_email_deliveries')
   .select('notification_id,status,attempts,created_at,sent_at')
   .eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
  if(e)setError('Le suivi des alertes e-mail est momentanément indisponible.');
  else setRecords(data||[]);
  setLoading(false);
 };
 useEffect(()=>{
  if(!sb||!user?.id)return;
  let cancelled=false;
  const run=async()=>{
   const {data,error:e}=await sb.from('campus_email_deliveries')
    .select('notification_id,status,attempts,created_at,sent_at')
    .eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
   if(cancelled)return;
   if(e)setError('Le suivi des alertes e-mail est momentanément indisponible.');
   else setRecords(data||[]);
   setLoading(false);
  };
  run();
  const timer=setInterval(run,60000);
  return()=>{cancelled=true;clearInterval(timer)};
 },[sb,user?.id]);
 const sent=records.filter(r=>r.status==='sent').length;
 const latest=records.slice(0,5);
 return <section className="campus-email-status">
  <div className="campus-email-status-header">
   <div><span className="campus-email-status-overline">EMAILJS · NKS SERVICES</span><h2>Alertes par e-mail</h2>
    <p>Les notifications opérationnelles de l’ERP te sont également adressées par e-mail.</p>
   </div>
   <button type="button" onClick={refresh} disabled={loading}>{loading?'Vérification…':'Vérifier les envois'}</button>
  </div>
  <div className="campus-email-status-info">
   <div><small>Adresse du compte Campus</small><strong>{user?.email||'Adresse e-mail non renseignée'}</strong></div>
   <div><small>Derniers envois enregistrés</small><strong>{sent} / {records.length}</strong></div>
  </div>
  {!!error&&<p className="campus-email-status-error">{error}</p>}
  {!loading&&!records.length&&!error&&<p className="campus-email-status-empty">Aucune alerte par e-mail enregistrée pour ton compte depuis l’activation du suivi.</p>}
  {latest.length>0&&<div className="campus-email-status-list">
   {latest.map(row=>{
    const notification=notifications.find(n=>n.id===row.notification_id);
    return <div className="campus-email-status-entry" key={row.notification_id}>
     <div><strong>{notification?.title||'Notification ERP'}</strong><small>{time(row.created_at)}</small></div>
     <span className={'campus-email-status-pill campus-email-status-pill-'+row.status}>{labels[row.status]||row.status}</span>
    </div>
   })}
  </div>}
  <p className="campus-email-status-caption">Le statut « Envoyé » confirme que le service e-mail a accepté le message ; il ne garantit pas qu’il a été lu. Les anciennes notifications ne sont pas renvoyées.</p>
 </section>;
}
