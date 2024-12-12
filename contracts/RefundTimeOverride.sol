// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@poolzfinance/poolz-helper-v2/contracts/interfaces/ILockDealNFT.sol";
import "@ironblocks/firewall-policy/contracts/FirewallPolicyBase.sol";

contract RefundTimeOverride is FirewallPolicyBase {
    ILockDealNFT public immutable lockDealNFT;
    uint256 public immutable validTimeStamp;
    uint256 public immutable collateralPoolId;

    bytes4 public constant REFUND_SELECTOR = bytes4(keccak256("handleRefund(uint256,address,uint256)"));

    error InvalidTime();
    error ZeroAddress();
    error ZeroPoolId();

    constructor(
        ILockDealNFT _lockDealNFT,
        uint256 _validTimeStamp,
        uint256 _collateralPoolId
    ) {
        if (address(_lockDealNFT) == address(0)) revert ZeroAddress();
        if (_validTimeStamp < block.timestamp) revert InvalidTime();
        if (_collateralPoolId == 0) revert ZeroPoolId();
        lockDealNFT = _lockDealNFT;
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
