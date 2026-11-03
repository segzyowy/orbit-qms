# Deploy Orbit’s payment-request contract

Status: source and frontend prepared; NOT compiled, audited, deployed, or live-wallet tested in this workspace. Existing native-transfer functionality remains separate. Use test tokens only.

## 1. Compile in your browser

1. Open https://remix.ethereum.org (check the domain carefully).
2. Create `OrbitPaymentRequests.sol` in Remix and paste the contents of `contracts/OrbitPaymentRequests.sol` from this project.
3. In Solidity Compiler, select **0.8.26**, enable optimization with **200 runs**, and choose EVM version **cancun** under advanced settings.
4. Compile. Resolve errors before proceeding. No imports or constructor arguments are required.

## 2. Test before deploying to QMS

Use Remix VM (Cancun or a later supported VM) with disposable accounts:

- Account A: createRequest with a unique nonzero bytes32 ID and amount 1000000000000000 (0.001 QMS in wei).
- requests(id) must show A, that amount, status 1 and zero payer.
- Account B: set transaction VALUE to 0.001 ether (Remix uses this denomination label for native tokens), then payRequest(id). Status must become 2, with B as payer and payment delivered to A.
- A second payment, a missing request, and an incorrect amount must revert.
- Reset VALUE to 0 before nonpayable calls. Create another request; B cannot cancel it, A can; payment after cancellation must revert.
- Creating a zero ID, zero amount or duplicate ID must revert.
- Before public use, add automated EVM tests for malicious/reentrant recipients, reverting recipients, events and exact balance accounting. Those tests have not been executed here.

## 3. Deploy with your own wallet

Use a dedicated test wallet. Never paste private keys or seed phrases into chat, GitHub or the app.

Official reference: https://docs.qms.finance/for-developers/network-and-rpc

- Network: QMS Testnet
- Chain ID: 19480
- RPC: https://rpc.testnet.qms.finance
- Currency: QMS (18 decimals)
- Explorer: https://testnet.qmsscan.io
- Faucet: https://faucet.testnet.qms.finance

1. Add/switch to QMS Testnet in your wallet and get test QMS from the faucet.
2. In Remix, open Deploy & Run Transactions and choose the injected/browser wallet provider (label may vary by Remix version).
3. Verify the wallet chain is **19480** and your intended test account is selected. Set VALUE to **0**.
4. Select OrbitPaymentRequests and click Deploy. Approve only the expected testnet deployment in your wallet.
5. Wait for a successful receipt. Copy the deployed contract address and deployment transaction hash. Confirm code exists at that address on QMSScan.
6. Verify the source on the explorer using the exact compiler version, optimizer settings and EVM target above. There are no constructor arguments. Keep the compiler metadata/artifacts from Remix.

QMS deployment reference: https://docs.qms.finance/for-developers/deploy-a-smart-contract
EVM target reference: https://docs.qms.finance/for-developers/evm-compatibility

## 4. Configure and publish

Edit `contract-config.js` and set:

```javascript
window.ORBIT_CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS';
```

Replace the whole placeholder with the real address. This is public information, not a key.

Upload the updated website files to GitHub, preserving paths:

- index.html, style.css, app.js
- contracts.html, contract-app.js, contract-config.js
- vendor/ethers.umd.min.js
- contracts/OrbitPaymentRequests.sol
- DEPLOYMENT.md and README.md

Netlify should redeploy from your connected repository. No build command; publish directory `.`. Open `https://orbit-qms.netlify.app/contracts.html` after deployment. If your site address differs, use that address instead.

## 5. End-to-end acceptance

Use two independently controlled test wallets. Create a small request from A, open the link in B, review A’s address and amount, and pay. Verify the receipt, event and contract state in QMSScan. Refresh the UI: the request must say Paid and prevent another payment. Test cancellation, rejection, account/network switching and failed transactions. Keep enough test tokens for gas. The app requires connection to look up requests.

## Limitations

Unaudited prototype. No production-security claim. No post-quantum accounts, admin, fees, upgrades or escrow. No automatic recovery of accidentally force-sent native tokens. Requests never expire; recipients can cancel open requests. No names or invoice text should be put in IDs. Duplicate-ID races can reject creation; retry with a fresh random ID. Requests and events are public, and links are visible to hosting/browser systems.

The frontend is pinned to the configured deployment; URLs cannot select arbitrary contracts. The version check only checks an interface, not code authenticity: verify the configured deployment and source yourself. Existing request links refer to the currently configured address; replacing it or a testnet reset can invalidate old links. Preserve old deployments/links or explicitly retire them when changing configuration.

Only one inclusion is awaited, not finality; QMS currently does not provide safe/finalized tags with useful latest state. Recheck explorer confirmations. On timeout, check the wallet/explorer before retrying; a pending transaction may still succeed. Created request IDs can be recovered from RequestCreated events if the browser closes before showing the share link. No global user analytics are included. A contract address is not proof of users.

The bundled ethers library is version 6.13.5 (MIT), obtained from the npm CDN; it is served locally. Review dependencies and contract code before release.
