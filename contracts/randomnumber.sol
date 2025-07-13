// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract NameTwitterRandom is VRFConsumerBaseV2Plus {
    struct Entry {
        string name;
        string twitter;
        uint256 randomScore;
    }

    mapping(address => Entry) public entries;
    mapping(uint256 => address) private requestToUser;

    bytes32 public keyHash;
    uint256 public subscriptionId;
    uint32 public callbackGasLimit = 200_000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    event Requested(address indexed user, uint256 requestId);
    event Scored(address indexed user, string name, string twitter, uint256 score);

    constructor(
        address vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    function requestScore(string calldata name, string calldata twitter) external {
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({ nativePayment: false })
                )
            })
        );
        requestToUser[requestId] = msg.sender;
        entries[msg.sender] = Entry(name, twitter, 0);
        emit Requested(msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata words) internal override {
        address user = requestToUser[requestId];
        uint256 score = (words[0] % 100) + 1; // 1–100
        entries[user].randomScore = score;
        emit Scored(user, entries[user].name, entries[user].twitter, score);
    }
}
