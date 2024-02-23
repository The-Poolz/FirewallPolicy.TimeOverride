// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ironblocks/firewall-policy/contracts/interfaces/IFirewallPolicy.sol";
import "./IFirewall.sol";

contract MockFirewall is IFirewall {
    IFirewallPolicy public policy;

    constructor(IFirewallPolicy _policy) {
        policy = _policy;
    }

    function preExecution(address sender, bytes memory data, uint value) external override {
        policy.preExecution(sender, sender, data, value);
    }

    function postExecution(address sender, bytes memory data, uint value) external override {
        policy.postExecution(sender, sender, data, value);
    }
}