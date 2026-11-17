'use client';
import {useEffect,useMemo,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
const key=process.env.NEXT_PUBLIC_CAMPUS_VAPID_PUBLIC_KEY;
const bytes=s=>Uint8Array.from(atob((s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function unsubscribeFromCampusPush(sb){
 if(typeof window==='undefined'||!('serviceWorker' in navigator)||!sb)return;
 try{const r=await navigator.serviceWorker.getRegistration('/campus-sw.js');const sub=await r?.pushManager?.getSubscription();
 if(sub){await sb.from('campus_push_subscriptions').delete().eq('endpoint',sub.endpoint);await sub.unsubscribe();}}catch{}
}
export default function CampusPushControl({compact=false}){
 const sb=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return u&&k?createClient(u,k):null},[]);
 const [user,setUser]=useState(null),[status,setStatus]=useState('loading'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!sb)return;let live=true;
  sb.auth.getUser().then(({data})=>{if(live)setUser(data.user||null)});
  const {data:{subscription}}=sb.auth.onAuthStateChange((_e,s)=>{if(live)setUser(s?.user||null)});
  return()=>{live=false;subscription.unsubscribe()};
 },[sb]);
 useEffect(()=>{if(!user)return;let live=true;
  if(typeof window==='undefined'||!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)||!key){setStatus('unsupported');return;}
  navigator.serviceWorker.getRegistration('/campus-sw.js').then(async r=>{const s=await r?.pushManager?.getSubscription();if(live)setStatus(s&&Notification.permission==='granted'?'enabled':Notification.permission==='denied'?'denied':'off')}).catch(()=>{if(live)setStatus('off')});
  return()=>{live=false};
 },[user?.id]);
 async function toggle(){
  if(!sb||!user||busy)return;setBusy(true);setMessage('');
  try{
   if(status==='enabled'){await unsubscribeFromCampusPush(sb);setStatus('off');setMessage('Notifications push désactivées sur cet appareil.');return;}
   if(!key||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Push non pris en charge sur cet appareil.');
   const permission=await Notification.requestPermission();
   if(permission!=='granted'){setStatus(permission==='denied'?'denied':'off');throw Error('Autorisation refusée dans les réglages du navigateur.');}
   const r=await navigator.serviceWorker.register('/campus-sw.js',{scope:'/'});
   await navigator.serviceWorker.ready;
   let subscription=await r.pushManager.getSubscription();
   if(!subscription)subscription=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(key)});
   const keys=subscription.toJSON().keys;
   if(!keys?.p256dh||!keys?.auth)throw Error('Abonnement invalide.');
   const {error}=await sb.from('campus_push_subscriptions').upsert({user_id:user.id,endpoint:subscription.endpoint,
    p256dh:keys.p256dh,auth_secret:keys.auth,app_origin:location.origin,updated_at:new Date().toISOString()},{onConflict:'endpoint'});
   if(error)throw Error('Enregistrement échoué : '+error.message);
   setStatus('enabled');setMessage('Notifications push activées sur cet appareil.');
  }catch(e){setMessage(e?.message||'Impossible d’activer les notifications.');}
  finally{setBusy(false)}
 }
 if(!user)return null;
 return <div className={'campus-push-control'+(compact?' compact':'')}>
  <button type="button" disabled={busy||status==='loading'||status==='unsupported'||status==='denied'} className={status==='enabled'?'campus-push-enabled':''} onClick={toggle}>
   {busy?'Configuration…':status==='enabled'?'Push activé · Désactiver':status==='denied'?'Notifications bloquées':status==='unsupported'?'Push indisponible':'Activer les notifications push'}
  </button>
  {!compact&&<><p>Reçois les alertes de tes annonces, achats et livraisons même quand CAMPUS est fermé, sur les appareils compatibles.</p><small>Sur iPhone, installe CAMPUS sur l'écran d'accueil avant d'activer les notifications push.</small></>}
  {message&&<span className="campus-push-message" role="status">{message}</span>}
 </div>;
}
