// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// This policy outlines the procedures for addressing issues detailed in the following document:
/// https://docs.google.com/document/d/1uhbRpDJbSKRSrwvVm-DJNTHlqsEaAG6tUbPAxh400xI

import "@poolzfinance/poolz-helper-v2/contracts/interfaces/ILockDealNFT.sol";
import "@ironblocks/firewall-policy/contracts/FirewallPolicyBase.sol";

contract RefundTimeOverride is FirewallPolicyBase {
    uint256 public immutable validTimeStamp;
    uint256 public immutable collateralPoolId;

    bytes4 public constant REFUND_SELECTOR = bytes4(keccak256("handleRefund(uint256,address,uint256)"));

    error InvalidTime();
    error ZeroPoolId();

    constructor(
        uint256 _validTimeStamp,
        uint256 _collateralPoolId
    ) {
        if (_collateralPoolId == 0) revert ZeroPoolId();
        validTimeStamp = _validTimeStamp;
        collateralPoolId = _collateralPoolId;
    }

    function preExecution(
        address,
        address,
        bytes memory data,
        uint
    ) external view override {
        bytes4 functionSelector;
        assembly {
            functionSelector := mload(add(data, 0x20))
        }
        if (functionSelector == REFUND_SELECTOR) {
            uint256 poolId;
            assembly {
                poolId := mload(add(data, 0x24))
            }
            _check(poolId);
        }
    }

    function postExecution(
        address,
        address,
        bytes calldata,
        uint
    ) external override {
        // do nothing
    }

    function _check(uint256 poolId) private view {
        if (poolId == collateralPoolId && block.timestamp > validTimeStamp) {
            revert InvalidTime();
        }
    }
}
