// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title OrbitPaymentRequests
/// @notice Unaudited testnet prototype. Native-token requests; no fees, admin, or escrow.
/// @dev Request recipients must create their own requests. All request data is public.
contract OrbitPaymentRequests {
    enum Status { Missing, Open, Paid, Cancelled }
    struct Request {
        address payable recipient;
        uint256 amount;
        Status status;
        address payer;
    }
    mapping(bytes32 => Request) public requests;
    uint256 private locked = 1;

    event RequestCreated(bytes32 indexed id, address indexed recipient, uint256 amount);
    event RequestPaid(bytes32 indexed id, address indexed payer, address indexed recipient, uint256 amount);
    event RequestCancelled(bytes32 indexed id, address indexed recipient);

    error InvalidRequest();
    error RequestAlreadyExists();
    error RequestNotOpen();
    error WrongAmount();
    error NotRecipient();
    error TransferFailed();
    error ReentrantCall();

    modifier nonReentrant() {
        if (locked != 1) revert ReentrantCall();
        locked = 2;
        _;
        locked = 1;
    }

    function version() external pure returns (string memory) {
        return "orbit-payment-requests-v1";
    }

    /// @notice Caller is the recipient. Use a fresh random ID, not personal information.
    function createRequest(bytes32 id, uint256 amount) external nonReentrant {
        if (id == bytes32(0) || amount == 0) revert InvalidRequest();
        if (requests[id].status != Status.Missing) revert RequestAlreadyExists();
        requests[id] = Request(payable(msg.sender), amount, Status.Open, address(0));
        emit RequestCreated(id, msg.sender, amount);
    }

    /// @notice Pay exactly the requested native-token amount. Gas is additional.
    /// @dev State is updated before the external call; failed forwarding reverts everything.
    function payRequest(bytes32 id) external payable nonReentrant {
        Request storage request = requests[id];
        if (request.status != Status.Open) revert RequestNotOpen();
        if (msg.value != request.amount) revert WrongAmount();
        request.status = Status.Paid;
        request.payer = msg.sender;
        (bool sent,) = request.recipient.call{value: msg.value}("");
        if (!sent) revert TransferFailed();
        emit RequestPaid(id, msg.sender, request.recipient, msg.value);
    }

    function cancelRequest(bytes32 id) external nonReentrant {
        Request storage request = requests[id];
        if (request.status != Status.Open) revert RequestNotOpen();
        if (msg.sender != request.recipient) revert NotRecipient();
        request.status = Status.Cancelled;
        emit RequestCancelled(id, request.recipient);
    }
}
