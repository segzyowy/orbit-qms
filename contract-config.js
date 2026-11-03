'use strict';
// After deployment, paste YOUR QMS testnet contract address between the quotes.
// Never put a private key or seed phrase in this file.
window.ORBIT_CONTRACT_ADDRESS = '0x1487F618FC5ca22dc8A648206B6f602DDBFaA1EE';
window.ORBIT_REQUEST_ABI = [
 'function version() view returns (string)',
 'function requests(bytes32) view returns (address recipient,uint256 amount,uint8 status,address payer)',
 'function createRequest(bytes32 id,uint256 amount)',
 'function payRequest(bytes32 id) payable',
 'function cancelRequest(bytes32 id)',
 'event RequestCreated(bytes32 indexed id,address indexed recipient,uint256 amount)',
 'event RequestPaid(bytes32 indexed id,address indexed payer,address indexed recipient,uint256 amount)',
 'event RequestCancelled(bytes32 indexed id,address indexed recipient)',
 'error InvalidRequest()', 'error RequestAlreadyExists()', 'error RequestNotOpen()',
 'error WrongAmount()', 'error NotRecipient()', 'error TransferFailed()', 'error ReentrantCall()'
];
