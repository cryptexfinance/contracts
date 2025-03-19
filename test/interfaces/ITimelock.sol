// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITimelock {
  function delay() external returns (uint256);

  function queueTransaction(
    address target,
    uint256 value,
    string memory signature,
    bytes memory data,
    uint256 eta
  ) external returns (bytes32);

  function executeTransaction(
    address target,
    uint256 value,
    string memory signature,
    bytes memory data,
    uint256 eta
  ) external payable returns (bytes memory);

  function admin() external returns (address);

  function acceptAdmin() external;
}
