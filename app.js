'use strict';
const NETWORK = {chainId:'0x4c18', chainName:'QMS Testnet', nativeCurrency:{name:'QMS',symbol:'QMS',decimals:18}, rpcUrls:['https://rpc.testnet.qms.finance'], blockExplorerUrls:['https://testnet.qmsscan.io']};
const STORE='orbit-qms-v1';
const $=id=>document.getElementById(id);
let account=null, provider=null, busy=false, balanceWei=null, toastTimer;
let records=[], requests=[];
try { const data=JSON.parse(localStorage.getItem(STORE)||'{}'); records=Array.isArray(data.records)?data.records:[]; requests=Array.isArray(data.requests)?data.requests:[]; } catch {}
const demo=[{label:'Design milestone',to:'0x8a24…b791',amount:'150',status:'Demo',date:'Sample',type:'Payment sent'},{label:'Developer grant',to:'0x72f0…c340',amount:'100',status:'Demo',date:'Sample',type:'Payment sent'},{label:'Infrastructure',to:'0x19bc…f812',amount:'75',status:'Demo',date:'Sample',type:'Payment sent'}];
function notify(message){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),8500);}
function save(){try{localStorage.setItem(STORE,JSON.stringify({records,requests}));}catch{notify('Browser storage is unavailable. History may not persist.');}}
function short(a){return a.slice(0,6)+'…'+a.slice(-4);}
function parseAmount(value){if(!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value))throw Error('Enter a positive amount with up to 18 decimal places, without commas.');const [whole,fraction='']=value.split('.');const wei=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));if(wei<=0n||wei>=2n**256n)throw Error('Amount is outside the supported range.');return wei;}
function formatWei(wei,places=6){const neg=wei<0n;if(neg)wei=-wei;const whole=(wei/10n**18n).toLocaleString('en-US');const frac=(wei%10n**18n).toString().padStart(18,'0').slice(0,places).replace(/0+$/,'');return (neg?'-':'')+whole+(frac?'.'+frac:'');}
function validateAddress(address){if(!/^0x[0-9a-fA-F]{40}$/.test(address)||/^0x0{40}$/i.test(address))throw Error('Enter a valid, nonzero EVM address. Verify mixed-case checksums in your wallet.');return address;}
function tab(name){if(!['overview','send','request'].includes(name))return;document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('hidden',e.id!==name));document.querySelectorAll('.nav').forEach(e=>e.classList.toggle('active',e.dataset.tab===name));$('page-name').textContent={overview:'Overview',send:'Send payment',request:'Request payment'}[name];}
document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>tab(el.dataset.tab)));
function visibleRecords(){return account?records.filter(r=>r.from?.toLowerCase()===account.toLowerCase()):demo;}
function cell(row,text){const td=document.createElement('td');td.textContent=text;row.append(td);return td;}
function render(){
 $('connect').textContent=account?short(account)+' · Connected':'Connect wallet ↗';
 $('mode-label').textContent=account?'TESTNET MODE':'DEMO MODE';
 $('mode-text').textContent=account?'Wallet connected. Transfers require your explicit wallet approval.':'You’re viewing sample data. Connect a wallet to use QMS Testnet.';
 $('wallet-caption').textContent=account?short(account)+' · Native QMS':'Sample wallet · Demo balance';
 $('balance').textContent=account?(balanceWei===null?'—':formatWei(balanceWei)):'2,450.00';
 $('send-button').textContent=account?'Review in wallet ↗':'Preview demo payment ↗';
 $('activity-caption').textContent=account?'Transactions sent through this app on this browser':'Sample transactions · Not onchain';
 const list=visibleRecords();
 let sent=0n;for(const r of list)if(r.status==='confirmed')try{sent+=parseAmount(r.amount);}catch{}
 $('sent').textContent=account?formatWei(sent)+' QMS':'325.00 QMS';
 $('requests').textContent=account?String(requests.filter(r=>r.to.toLowerCase()===account.toLowerCase()).length):'3';
 const body=$('transactions');body.replaceChildren();
 if(!list.length){const row=document.createElement('tr');const td=cell(row,'No payments yet. Send your first test QMS payment.');td.colSpan=5;body.append(row);}
 for(const r of list.slice(0,50)){
 const row=document.createElement('tr'),name=document.createElement('td'),wrapper=document.createElement('div');wrapper.className='tx-name';
 const icon=document.createElement('span');icon.className='tx-icon';icon.textContent='↗';
 const label=document.createElement('div');label.textContent=r.label||'QMS payment';const subtitle=document.createElement('small');subtitle.textContent=r.type||'Payment sent';label.append(subtitle);wrapper.append(icon,label);name.append(wrapper);row.append(name);
 cell(row,account?short(r.to):r.to);cell(row,r.amount+' QMS');const status=cell(row,'');const badge=document.createElement('span');badge.className='status '+(['pending','failed','unknown'].includes(r.status)?r.status:'');badge.textContent=r.status==='unknown'?'Check explorer':r.status;status.append(badge);
 const date=cell(row,account?new Date(r.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}):r.date);
 if(account&&/^0x[0-9a-fA-F]{64}$/.test(r.hash)){const a=document.createElement('a');a.href=NETWORK.blockExplorerUrls[0]+'/tx/'+r.hash;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' ↗';a.title='View transaction';date.append(a);}
 body.append(row);
 }
}
async function ensureNetwork(){const chain=await provider.request({method:'eth_chainId'});if(BigInt(chain)!==19480n){try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:NETWORK.chainId}]});}catch(e){if(e.code===4902){await provider.request({method:'wallet_addEthereumChain',params:[NETWORK]});await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:NETWORK.chainId}]});}else throw e;}}if(BigInt(await provider.request({method:'eth_chainId'}))!==19480n)throw Error('Switch your wallet to QMS Testnet to continue.');}
async function refresh(){if(!account){notify('Connect a wallet to retrieve your live testnet balance.');return;}try{await ensureNetwork();const a=account;const value=await provider.request({method:'eth_getBalance',params:[a,'latest']});if(a===account)balanceWei=BigInt(value);await checkPending();render();}catch(e){balanceWei=null;render();notify(e.message||'Unable to refresh balance.');}}
let listeners=false;
$('connect').addEventListener('click',async()=>{
 if(busy)return;busy=true;$('connect').disabled=true;
 try{provider=window.ethereum;if(!provider?.request)throw Error('No injected EVM wallet was found. Open a hosted copy in MetaMask/Rabby or your wallet browser. Embedded previews may not expose wallet extensions.');await ensureNetwork();const accounts=await provider.request({method:'eth_requestAccounts'});if(!accounts.length)throw Error('No account was selected.');account=accounts[0];$('request-address').value=account;
 if(!listeners&&provider.on){listeners=true;provider.on('accountsChanged',as=>{account=as[0]||null;balanceWei=null;$('request-address').value=account||'';render();if(account)refresh();});provider.on('chainChanged',chain=>{balanceWei=null;render();if(BigInt(chain)!==19480n)notify('Your wallet network changed. Switch back to QMS Testnet before using Orbit.');else if(account)refresh();});provider.on('disconnect',()=>{account=null;balanceWei=null;render();});}
 render();await refresh();
 }catch(e){notify(e.message||'Wallet connection failed.');}finally{busy=false;$('connect').disabled=false;}
});
$('refresh').addEventListener('click',refresh);
async function checkPending(){if(!provider||!account)return;const owner=account.toLowerCase();let changed=false;for(const r of records.filter(r=>r.from?.toLowerCase()===owner&&['pending','unknown'].includes(r.status))){try{const receipt=await provider.request({method:'eth_getTransactionReceipt',params:[r.hash]});if(receipt){r.status=BigInt(receipt.status)===1n?'confirmed':'failed';changed=true;}else if(Date.now()-new Date(r.date).getTime()>600000&&r.status==='pending'){r.status='unknown';changed=true;}}catch{}}if(changed)save();}
$('send-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 try{
 const to=validateAddress($('recipient').value.trim()),amount=$('amount').value.trim(),wei=parseAmount(amount),label=$('memo').value.trim();
 if(!account){$('demo-details').textContent=`Send ${amount} test QMS to ${to}${label?' · '+label:''}`;$('demo-dialog').showModal();return;}
 busy=true;$('send-button').disabled=true;const sender=account;await ensureNetwork();
 const addresses=await provider.request({method:'eth_accounts'});if(addresses[0]?.toLowerCase()!==sender.toLowerCase()||account!==sender)throw Error('Wallet account changed. Review the payment and retry.');
 const balance=BigInt(await provider.request({method:'eth_getBalance',params:[sender,'pending']}));
 const tx={from:sender,to,value:'0x'+wei.toString(16)};
 const gas=BigInt(await provider.request({method:'eth_estimateGas',params:[tx]}));const gasPrice=BigInt(await provider.request({method:'eth_gasPrice'}));
 if(wei+gas*gasPrice>balance)throw Error('Insufficient test QMS for the transfer plus estimated network gas. Get test tokens from the faucet.');
 if(account!==sender||BigInt(await provider.request({method:'eth_chainId'}))!==19480n)throw Error('Wallet changed before submission. Review and retry.');
 const hash=await provider.request({method:'eth_sendTransaction',params:[{...tx,chainId:NETWORK.chainId}]});
 records.unshift({hash,from:sender,to,amount,label,date:new Date().toISOString(),status:'pending'});save();render();tab('overview');notify('Transaction submitted, not yet confirmed. Check its explorer link or refresh for status.');$('send-form').reset();await refresh();
 }catch(e){notify(e.code===4001?'Transaction cancelled in your wallet.':e.message||'Payment failed.');}finally{busy=false;$('send-button').disabled=false;}
});
$('close-demo').addEventListener('click',()=>$('demo-dialog').close());
$('request-form').addEventListener('submit',event=>{event.preventDefault();try{const to=validateAddress($('request-address').value.trim()),amount=$('request-amount').value.trim();parseAmount(amount);const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('to',to);url.searchParams.set('amount',amount);$('payment-link').value=url.href;$('request-result').classList.remove('hidden');requests.push({to,amount,date:new Date().toISOString()});save();render();notify('Payment link created. It is not a confirmed payment.');}catch(e){notify(e.message);}});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('payment-link').value);notify('Payment link copied.');}catch{$('payment-link').select();notify('Clipboard access is blocked. Copy the selected link manually.');}});
$('export').addEventListener('click',()=>{const rows=[['Label','Recipient','QMS','Status','Date','Transaction hash'],...visibleRecords().map(r=>[r.label||'QMS payment',r.to,r.amount,r.status,r.date,r.hash||'DEMO'])];const csv=rows.map(row=>row.map(v=>{let s=String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=account?'orbit-testnet-payments.csv':'orbit-DEMO-payments.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();
try{const params=new URLSearchParams(location.search);if(params.has('to')){const to=validateAddress(params.get('to'));const amount=params.get('amount')||'';parseAmount(amount);$('recipient').value=to;$('amount').value=amount;tab('send');notify('Payment request loaded. Verify the recipient and amount independently before sending.');}}catch(e){notify('Invalid payment link: '+e.message);}
setInterval(async()=>{if(!account||!provider||busy||document.hidden)return;try{if(BigInt(await provider.request({method:'eth_chainId'}))===19480n){await checkPending();render();}}catch{}},15000);
