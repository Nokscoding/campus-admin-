self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
 let n={};try{n=e.data?.json()||{}}catch{n={title:'CAMPUS',body:e.data?.text()||''}}
 const url=typeof n.url==='string'&&n.url.startsWith('/')&&!n.url.startsWith('//')?n.url:'/compte?onglet=notifications';
 e.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  if(windows.some(w=>w.visibilityState==='visible'&&w.url.startsWith(self.location.origin)))return;
  await self.registration.showNotification(String(n.title||'CAMPUS').slice(0,160),{
   body:String(n.body||'Nouvelle notification').slice(0,350),icon:'https://www.campus-rdc.com/favicon.ico',badge:'https://www.campus-rdc.com/favicon.ico',
   tag:'campus-'+String(n.id||Date.now()),data:{url}
  });
 })());
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();const target=new URL(e.notification.data?.url||'/compte?onglet=notifications',self.location.origin).href;
 e.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const c of clients)if(c.url.startsWith(self.location.origin)){await c.navigate(target);return c.focus();}
 return self.clients.openWindow(target);})());
});
