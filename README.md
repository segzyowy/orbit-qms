# On-chain payment requests

The optional contract-based flow is available at `contracts.html`; read **DEPLOYMENT.md** first. It is configured for a QMS Testnet deployment, is unaudited, and supports native QMS requests only. The main dashboard also supports the four listed ERC-20 tokens for direct transfers and shareable payment links.

# Orbit — QMS Testnet Payments

A static, non-custodial QMS Testnet payments MVP. It supports native QMS plus four ERC-20 tokens listed by [QWAP Testnet](https://testnet.qwap.xyz/). Open `index.html` in the workspace preview. No build step, backend, API keys, or custom smart contract is required for wallet transfers and shareable payment links.

## Included

- Responsive dashboard with explicitly labeled sample data until a wallet connects.
- Connect an injected EIP-1193 wallet (for example MetaMask or Rabby), switch to QMS Testnet, and read native QMS and selected-token balances.
- Send native QMS or the listed ERC-20 test tokens with token-specific decimal precision, balance checks, gas estimation, and wallet approval.
- Create shareable payment links with an address, token and amount. Links never automatically send funds.
- Track transaction receipts for transactions submitted through this app; export local history to CSV.
- Requests and transaction metadata persist in this browser's localStorage. Private labels are local, not encrypted by this standalone app, and are not included in transaction data.

## Deployment

1. Publish `index.html`, `style.css`, and `app.js` together at an HTTPS static site, such as GitHub Pages, Netlify, or Cloudflare Pages. Preserve their relative paths. No build command is necessary; the publishing directory is the folder containing these files.
2. Open the hosted URL in a browser with an injected EVM wallet. Embedded workspace previews may not expose the wallet extension; this is not a WalletConnect integration.
3. Connect your wallet and verify its network details against the official QMS docs before approving network setup.
4. Claim free test QMS from the official faucet.
5. Send a very small test payment to a separate address you control. Inspect the destination and amount in the wallet, then verify the receipt in the explorer.
6. Create a request using your hosted URL, open it in a second browser, and verify that the form is prefilled correctly.

The frontend is hosted on the web; its transactions execute on QMS. This application uses native transfers and therefore does not deploy a Solidity contract. Nothing has been published or broadcast just by generating these files.

## Network configuration

Configured in `app.js`:

- Chain ID: 19480 (`0x4c18`)
- RPC: https://rpc.testnet.qms.finance
- Currency: QMS, 18 decimals
- Explorer: https://testnet.qmsscan.io
- Faucet: https://faucet.testnet.qms.finance
- Official network reference: https://docs.qms.finance/for-developers/network-and-rpc

ERC-20 test tokens from the QWAP Testnet registry (all addresses are on chain ID 19480):

| Token | Contract address | Decimals |
| --- | --- | ---: |
| USDT · Tether USD | `0x5d1386fc130143f92511bc2d18124d3e414ed429` | 6 |
| WBTC · Wrapped Bitcoin | `0x5ebfe302200a5b22e182a5c0d10444fe44b2a678` | 8 |
| WETH · Wrapped Ether | `0x43D7c8434A5290a32C8725224870ad6f85132a31` | 18 |
| WQMS · Wrapped QMS | `0x9AA510295aC664A3d5A3182a3eFe959DE2B12c34` | 18 |

The dashboard sends these ERC-20s directly with `transfer`. The separate smart-contract request page and `OrbitPaymentRequests.sol` currently support native QMS only and require a deployed contract.

Recheck configuration before deployment and after any announced testnet reset. Reset or orphaned transactions may remain in browser history; verify them in the explorer. Transactions without a receipt after ten minutes are marked “Check explorer,” not assumed successful or failed.

## Scope and honest limitations

- Testnet-only, unaudited MVP. No real assets. Test tokens have no monetary value.
- Standard EVM wallet signing, not post-quantum signing or ERC-4337 smart accounts.
- No arbitrary or unlisted ERC-20 tokens, escrow, recurring payments, or invoice reconciliation. Listed test tokens are experimental and have no monetary value.
- Activity is not complete wallet history: it only includes outgoing transactions recorded in this browser. Request count is a local counter, not payment settlement tracking.
- Receipts are treated as confirmed once returned; the app does not wait for a configurable finality depth or continuously revalidate previously confirmed transactions.
- No account backend, cross-device sync, WalletConnect, or transaction replacement tracking. A replaced/dropped transaction may stay unresolved; inspect your wallet and explorer.
- Addresses receive syntax and zero-address checks, not EIP-55 checksum verification. Independently verify the address in your wallet. Never trust a payment link blindly.
- Wallet gas estimates are estimates. Your wallet determines the final gas parameters, which may change before inclusion.
- Links include the recipient and amount in the URL. Hosting services, browser history, and recipients may see those details.
- The public RPC may rate-limit, be unavailable, or change. Wallet/RPC integration must be tested against the live network before release.
- Google Fonts is requested for typography; system fonts are used as fallback. Remove the CSS import to avoid that third-party font request.

## Manual acceptance tests

1. Without a wallet: demo data is labeled; a demo payment opens a preview and broadcasts nothing.
2. Reject a wallet connection or network switch: show an error, retain usable UI.
3. Connect on the wrong network: request a switch/add; never silently submit on another chain.
4. For each listed ERC-20, check the balance and decimals; verify the contract and recipient in the wallet; reject insufficient tokens or native QMS for gas.
5. Invalid/zero recipient, zero/negative amount, exponent notation, and amounts exceeding the selected token precision: reject.
6. Insufficient token balance or native QMS for amount plus estimated gas: reject before wallet submission.
7. Reject a transfer in the wallet: do not add a transaction record.
8. Approve a transfer: show pending first; only a successful receipt changes it to confirmed.
9. Switch accounts: filter history by the connected sender and clear the stale balance.
10. Request link: prefill token, recipient and amount only; require explicit submission and wallet approval.
11. Export: demo CSV is labeled; CSV formula prefixes are escaped.
12. Refresh/reopen: retain local history; continue checking unresolved receipts after wallet reconnect.
13. Mobile layout: ensure forms and controls fit and the activity table scrolls horizontally.

Live wallet transactions and production deployment have not been exercised from this workspace. Perform the above acceptance tests before sharing with users.
