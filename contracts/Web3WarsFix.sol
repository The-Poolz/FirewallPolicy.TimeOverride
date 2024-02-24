// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@poolzfinance/poolz-helper-v2/contracts/interfaces/ILockDealNFT.sol";
import "@ironblocks/firewall-policy/contracts/FirewallPolicyBase.sol";

contract Web3WarsFix is FirewallPolicyBase {
    ILockDealNFT immutable public lockDealNFT;
    uint256 immutable public invalidTimeStamp;
    uint256 immutable public validTimeStamp;
    uint256 immutable public vaultId;

    bytes4 public constant WITHDRAW_SELECTOR = bytes4(keccak256("withdraw(uint256)"));

    constructor(ILockDealNFT _lockDealNFT, uint256 _invalidTimeStamp, uint256 _validTimeStamp, uint256 _vaultId) {
        require(address(_lockDealNFT) != address(0), "Web3WarsFix: ILockDealNFT is a zero address");
        require(_invalidTimeStamp > block.timestamp, "Web3WarsFix: time is in the past");
        require(_validTimeStamp > block.timestamp, "Web3WarsFix: time is in the past");
        lockDealNFT = _lockDealNFT;
        invalidTimeStamp = _invalidTimeStamp;
        validTimeStamp = _validTimeStamp;
        vaultId = _vaultId;
    }

    function preExecution(
        address,
        address,
        bytes memory data,
        uint256
    ) external view override {
        bytes4 functionSelector;
        assembly {
            functionSelector := mload(add(data, 0x20))
        }
        if (functionSelector == WITHDRAW_SELECTOR) {
            uint256 poolId;
            assembly {
                poolId := mload(add(data, 0x24))
            }
            _check(lockDealNFT.getData(poolId), block.timestamp);
        }
    }

    function postExecution(address consumer, address sender, bytes memory data, uint value) external override {
        // do nothing
    }

    function _check(ILockDealNFT.BasePoolInfo memory poolInfo, uint256 blockTimeStamp) internal view {
        if(poolInfo.vaultId == vaultId && poolInfo.params.length == 2) {
            uint256 time = poolInfo.params[1];
            if(time == invalidTimeStamp) {
                require(blockTimeStamp >= validTimeStamp, "Web3WarsFix: invalid time");
            }
        }
    }
}
