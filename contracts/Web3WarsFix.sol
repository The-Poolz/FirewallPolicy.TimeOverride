// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@poolzfinance/poolz-helper-v2/contracts/interfaces/ILockDealNFT.sol";

contract Web3WarsFix {
    ILockDealNFT public lockDealNFT;

    constructor(ILockDealNFT _lockDealNFT) {
        require(address(_lockDealNFT) != address(0), "Web3WarsFix: ILockDealNFT is a zero address");
        lockDealNFT = _lockDealNFT;
    }

    function check(uint256 _poolId) public view {
        _check(lockDealNFT.getData(_poolId), block.timestamp);
    }

    function _check(ILockDealNFT.BasePoolInfo memory poolInfo, uint256 blockTimeStamp) internal pure {
        if(poolInfo.vaultId == 10 && poolInfo.params.length == 2) {
            uint256 time = poolInfo.params[1];
            if(time == 1709799300) {
                require(blockTimeStamp >= 1715069700, "Web3WarsFix: invalid time");
            }
            else if(time == 1712477700) {
                require(blockTimeStamp >= 1723018500, "Web3WarsFix: invalid time");
            }
            else if(time == 1715069700) {
                require(blockTimeStamp >= 1730967300, "Web3WarsFix: invalid time");
            }
            else if(time == 1717748100) {
                require(blockTimeStamp >= 1738916100, "Web3WarsFix: invalid time");
            }
        }
    }
}
