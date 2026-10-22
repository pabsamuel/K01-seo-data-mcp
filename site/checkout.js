(async()=>{
  const config=await fetch('/api/config').then(r=>r.json()).catch(()=>({mode:'preview'}));
  if(config.mode!=='open')return;
  const status=document.querySelector('#checkout-status');
  const notice=document.querySelector('.notice');
  notice.textContent='Paid plans are available. Provider credentials are required separately.';
  let install=localStorage.getItem('seo-install');
  if(!/^[a-f0-9]{64}$/.test(install||'')){install=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('seo-install',install);}
  let loaded;
  function loadPaddle(){return loaded??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.paddle.com/paddle/v2/paddle.js';s.onload=()=>{Paddle.Initialize({token:config.clientToken,eventCallback:e=>{if(e.name==='checkout.completed'){status.textContent='Payment received. Retrieve your license after the webhook is processed.';document.querySelector('#retrieve').hidden=false;}}});resolve();};s.onerror=reject;document.head.append(s);});}
  for(const button of document.querySelectorAll('[data-plan]')){button.hidden=false;button.onclick=async()=>{try{await loadPaddle();Paddle.Checkout.open({items:[{priceId:button.dataset.plan==='starter'?config.starterPrice:config.proPrice,quantity:1}],customData:{app:'seo-data-mcp',seo_install:install}});}catch{status.textContent='Checkout could not load. Try again later.';}};}
  const retrieve=document.querySelector('#retrieve');retrieve.hidden=false;
  retrieve.onclick=async()=>{const r=await fetch('/api/license',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({install})});const body=await r.json();if(!r.ok){status.textContent='License not ready. Wait for payment processing, then retrieve again.';return;}const box=document.querySelector('#license');box.hidden=false;box.value=body.license;status.textContent='Save this key privately and set SEO_MCP_LICENSE_FILE in your MCP client. Retrieve a fresh key after each renewal.';};
})();
