'use strict';
const el=id=>document.getElementById(id);
const chain={chainId:'0x4c18',chainName:'QMS Testnet',nativeCurrency:{name:'QMS',symbol:'QMS',decimals:18},rpcUrls:['https://rpc.testnet.qms.finance'],blockExplorerUrls:['https://testnet.qmsscan.io']};
let wallet,signer,contract,owner,busy=false,loaded=null;
const address=window.ORBIT_CONTRACT_ADDRESS||'';
const message=text=>{el('contract-message').textContent=text;};
function error(e){return e.shortMessage||e.reason||e.message||String(e);}
function buttons(){el('contract-connect').disabled=busy;el('chain-create-button').disabled=busy||!contract;el('chain-load-button').disabled=busy||!contract;el('chain-pay').disabled=busy||!loaded||loaded.status!==1n;el('chain-cancel').disabled=busy||!loaded||loaded.status!==1n||loaded.recipient.toLowerCase()!==owner?.toLowerCase();}
function reset(){contract=null;signer=null;owner=null;loaded=null;el('contract-wallet').textContent='Wallet changed. Reconnect to continue.';el('chain-details').textContent='Reconnect and reload the request.';buttons();}
async function guard(){if(!contract||!window.ethereum)throw Error('Connect your wallet first.');if(BigInt(await window.ethereum.request({method:'eth_chainId'}))!==19480n)throw Error('Switch to QMS Testnet and reconnect.');const accounts=await window.ethereum.request({method:'eth_accounts'});if(accounts[0]?.toLowerCase()!==owner.toLowerCase())throw Error('Account changed. Reconnect.');}
async function action(fn){if(busy)return;busy=true;buttons();try{await fn();}catch(e){message(error(e));}finally{busy=false;buttons();}}
async function receipt(tx){el('contract-tx').href=chain.blockExplorerUrls[0]+'/tx/'+tx.hash;el('contract-tx').hidden=false;message('Submitted: '+tx.hash+'\nWaiting for inclusion. Do not resubmit while pending.');const r=await tx.wait(1,180000);if(!r||r.status!==1)throw Error('No successful receipt. Check the explorer before retrying.');message('Successful receipt received. Recheck the explorer for confirmations.');return r;}
function id(){const value=el('chain-id').value.trim();if(!/^0x[0-9a-fA-F]{64}$/.test(value))throw Error('Enter a valid 32-byte request ID.');return value;}
async function lookup(){await guard();const key=id();const r=await contract.requests(key);loaded={id:key,recipient:r.recipient,amount:r.amount,status:r.status};el('chain-details').textContent=r.status===0n?'Request not found on this deployment.':`Request: ${key}\nRecipient: ${r.recipient}\nAmount: ${ethers.formatEther(r.amount)} test QMS\nStatus: ${['Missing','Open','Paid','Cancelled'][Number(r.status)]}\nPayer: ${r.payer}`;buttons();}
el('contract-address').textContent=address?'Configured contract: '+address:'Not deployed/configured yet. Follow DEPLOYMENT.md, then set contract-config.js. No contract transactions are available until then.';
el('contract-connect').onclick=()=>action(async()=>{
 if(!window.ethers)throw Error('Wallet library did not load. Include vendor/ethers.umd.min.js in your upload.');
 if(!ethers.isAddress(address)||address===ethers.ZeroAddress)throw Error('Deploy the contract and set its address in contract-config.js first.');
 if(!window.ethereum?.request)throw Error('Open this site in an EVM wallet browser or a desktop browser with a wallet extension.');
 if(BigInt(await ethereum.request({method:'eth_chainId'}))!==19480n){try{await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:chain.chainId}]});}catch(e){if(e.code!==4902)throw e;await ethereum.request({method:'wallet_addEthereumChain',params:[chain]});await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:chain.chainId}]});}}
 await ethereum.request({method:'eth_requestAccounts'});wallet=new ethers.BrowserProvider(ethereum);signer=await wallet.getSigner();owner=await signer.getAddress();
 if((await wallet.getNetwork()).chainId!==19480n)throw Error('Wrong chain.');
 if(await wallet.getCode(address)==='0x')throw Error('No contract at this address. Check deployment or testnet reset.');
 const candidate=new ethers.Contract(address,window.ORBIT_REQUEST_ABI,signer);
 if(await candidate.version()!=='orbit-payment-requests-v1')throw Error('Unexpected contract interface.');
 contract=candidate;el('contract-wallet').textContent='Connected: '+owner;message('QMS Testnet connected. Review every wallet prompt.');if(el('chain-id').value)await lookup();
});
if(window.ethereum?.on){ethereum.on('accountsChanged',reset);ethereum.on('chainChanged',reset);ethereum.on('disconnect',reset);}
el('chain-create').onsubmit=e=>{e.preventDefault();action(async()=>{
 await guard();const c=contract;const text=el('chain-amount').value.trim();if(!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(text))throw Error('Use a positive decimal amount, up to 18 decimals.');const amount=ethers.parseEther(text);if(amount<=0n||amount>ethers.MaxUint256)throw Error('Invalid amount.');
 const key=ethers.hexlify(ethers.randomBytes(32));message('Approve creation in your wallet. This costs testnet gas.');await receipt(await c.createRequest(key,amount));await guard();
 const url=new URL('contracts.html',location.href);url.searchParams.set('request',key);el('chain-share').value=url.href;el('chain-copy').disabled=false;el('chain-id').value=key;await lookup();
 });};
el('chain-lookup').onsubmit=e=>{e.preventDefault();action(lookup);};
el('chain-id').oninput=()=>{loaded=null;buttons();};
el('chain-pay').onclick=()=>action(async()=>{
 await lookup();const request={...loaded},c=contract;if(request.status!==1n)throw Error('Request is not open.');
 if(!confirm(`Pay ${ethers.formatEther(request.amount)} test QMS to ${request.recipient}?\nContract: ${address}\nGas is additional. Verify the recipient independently.`))return;
 await guard();await receipt(await c.payRequest(request.id,{value:request.amount}));await lookup();
});
el('chain-cancel').onclick=()=>action(async()=>{await lookup();if(loaded.recipient.toLowerCase()!==owner.toLowerCase())throw Error('Only the recipient can cancel.');if(!confirm('Cancel this request? This costs testnet gas.'))return;const key=loaded.id,c=contract;await guard();await receipt(await c.cancelRequest(key));await lookup();});
el('chain-copy').onclick=async()=>{try{await navigator.clipboard.writeText(el('chain-share').value);message('Request link copied.');}catch{el('chain-share').select();message('Copy the selected link manually.');}};
const query=new URLSearchParams(location.search);if(query.has('request')){el('chain-id').value=query.get('request');message('Connect to load this request from the configured contract. Never trust a recipient without reviewing it.');}
buttons();
