'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import './CampusMarketingDashboard.css';

const START='2026-11-22T11:10:00.000Z';
const format=n=>Number(n||0).toLocaleString('fr-FR');
const campaigns=[
 {label:'WhatsApp',source:'whatsapp',medium:'social'},
 {label:'TikTok',source:'tiktok',medium:'social'},
 {label:'Instagram',source:'instagram',medium:'social'},
 {label:'Affiches / QR',source:'affiche',medium:'offline'}
];
function Card({label,value,sub}){return <div className="mk-kpi"><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}
export default function CampusMarketingDashboard({sb}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[copied,setCopied]=useState('');
 const [windowDays,setWindowDays]=useState('all');
 const since=useMemo(()=>{
  if(windowDays==='all')return START;
  const d=new Date();d.setUTCDate(d.getUTCDate()-Number(windowDays));
  return new Date(Math.max(d.getTime(),new Date(START).getTime())).toISOString();
 },[windowDays]);
 const load=useCallback(async()=>{
  if(!sb)return;
  setBusy(true);
  const {data:report,error:fail}=await sb.rpc('campus_marketing_report',{p_since:since});
  if(fail)setError(fail.message||'Impossible de lire les statistiques');
  else{setData(report);setError('')}
  setBusy(false);
 },[sb,since]);
 useEffect(()=>{load();const timer=window.setInterval(load,60000);return()=>window.clearInterval(timer)},[load]);
 const sessions=Number(data?.sessions||0),orders=Number(data?.orders_created||0);
 const conversion=sessions?(orders/sessions*100).toFixed(1).replace('.',',')+' %':'—';
 const sources=Array.isArray(data?.sources)?data.sources:[];
 const days=Array.isArray(data?.days)?data.days:[];
 const maxSource=Math.max(1,...sources.map(s=>Number(s.visits)||0));
 const maxDay=Math.max(1,...days.map(s=>Number(s.visits)||0));
 const base='https://campus-rdc.com/';
 async function copyLink(c){
  const link=base+'?utm_source='+c.source+'&utm_medium='+c.medium+'&utm_campaign=lancement_campus_nov2026';
  try{await navigator.clipboard.writeText(link);setCopied(c.source)}catch{setCopied('')}
 }
 return <section className="mk-dashboard" aria-label="Statistiques marketing CAMPUS">
  <div className="content-header"><div><h1>Marketing & audience</h1><p>Suivi de la campagne depuis le 22 novembre 2026 à 13h10 (heure de Lubumbashi).</p></div><button className="soft-button" onClick={load} disabled={busy}>{busy?'Actualisation…':'Actualiser'}</button></div>
  <div className="mk-window" role="group" aria-label="Période de suivi">
   {[['all','Depuis le checkpoint'],['1','24 dernières heures'],['7','7 derniers jours']].map(([v,label])=><button key={v} type="button" className={windowDays===v?'active':''} onClick={()=>setWindowDays(v)}>{label}</button>)}
  </div>
  {error&&<div className="notice-info" role="alert">{error}</div>}
  {!data&&!error&&<div className="panel"><p>Chargement des résultats de la campagne…</p></div>}
  {data&&<><div className="mk-kpis">
   <Card label="Pages vues" value={format(data.page_views)} sub="Chaque affichage de page"/>
   <Card label="Visiteurs distincts" value={format(data.visitors)} sub="Estimation par navigateur"/>
   <Card label="Visites / sessions" value={format(data.sessions)} sub="Sessions navigateur distinctes"/>
   <Card label="Fiches produit consultées" value={format(data.product_views)}/>
   <Card label="Inscriptions" value={format(data.registrations)} sub="Profils étudiants créés"/>
   <Card label="Annonces créées" value={format(data.listings_created)}/>
   <Card label="Demandes d'achat" value={format(data.orders_created)} sub={'Conversion visites → commandes : '+conversion}/>
   <Card label="Livraisons conclues" value={format(data.orders_completed)} sub="Commandes terminées"/>
  </div>
  <div className="mk-columns">
   <article className="mk-panel"><h2>Origine des visiteurs</h2><p>Provenance détectée ou source UTM des liens marketing.</p>
    {sources.length?sources.map(row=><div className="mk-source" key={row.name}><div><strong>{row.name||'direct'}</strong><b>{format(row.visits)} sessions</b></div><div className="mk-track"><span style={{width:Math.max(2,Number(row.visits)/maxSource*100)+'%'}}/></div></div>):<p className="mk-empty">Les premières visites seront affichées ici.</p>}
   </article>
   <article className="mk-panel"><h2>Évolution des visites</h2><p>Nombre de sessions par jour, heure locale de Lubumbashi.</p>
    {days.length?<div className="mk-chart">{days.map(d=><div className="mk-day" key={d.day} title={d.day+' : '+format(d.visits)+' sessions, '+format(d.views)+' pages'}><span>{format(d.visits)}</span><div className="mk-day-bar" style={{height:Math.max(4,Number(d.visits)/maxDay*128)+'px'}}/><small>{String(d.day).slice(5)}</small></div>)}</div>:<p className="mk-empty">Aucune visite comptabilisée sur la période.</p>}
   </article>
  </div></>}
  <article className="mk-panel"><h2>Liens de campagne à partager</h2><p>Utilise ces liens plutôt que l'adresse nue : ils permettent de comparer TikTok, WhatsApp, Instagram et les affiches.</p><div className="mk-links">{campaigns.map(c=><button key={c.source} type="button" onClick={()=>copyLink(c)}>{copied===c.source?'Lien copié — '+c.label:'Copier le lien '+c.label}</button>)}</div></article>
  <p className="mk-note">Les visites sont enregistrées par le navigateur lorsque la page charge et que la mesure n'est pas désactivée. Des bloqueurs, navigateurs différents ou visites automatiques peuvent modifier les chiffres : ce sont des indicateurs de performance, pas un recensement exact des personnes.</p>
 </section>;
}
