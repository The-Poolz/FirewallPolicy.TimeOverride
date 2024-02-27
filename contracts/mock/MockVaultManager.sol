// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockVaultManager  {
    mapping(uint => address) public vaultIdtoToken;
    mapping(address => uint) public tokenToVaultId;
    bool isLockTimeOverride = false;

    function safeDeposit(address _tokenAddress, uint, address, bytes memory signature) external returns (uint vaultId) {
        require(keccak256(abi.encodePacked(signature)) == keccak256(abi.encodePacked("signature")), "wrong signature");
        vaultId = _depositByToken(_tokenAddress);
    }

    function _depositByToken(address _tokenAddress) internal returns (uint vaultId) {
        vaultId = isLockTimeOverride ? 10 : 1;
        vaultIdtoToken[vaultId] = _tokenAddress;
        tokenToVaultId[_tokenAddress] = vaultId;
    }

    function withdrawByVaultId(uint _vaultId, address to, uint _amount) external {
        // do nothing
    }
        
    function vaultIdToTokenAddress(uint _vaultId) external view returns (address) {
        return vaultIdtoToken[_vaultId];
    }

    function setLockTimeOverride(bool _isLockTimeOverride) public {
        isLockTimeOverride = _isLockTimeOverride;
    }
}