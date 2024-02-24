// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

interface IFirewall {
    function preExecution(address sender, bytes memory data, uint value) external;
    function postExecution(address sender, bytes memory data, uint value) external;
}
