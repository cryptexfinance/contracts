// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

contract L2MessageExecutorProxy is TransparentUpgradeableProxy {
  constructor(
    address l2MessageExecutor,
    address timelock,
    bytes memory callData
  ) TransparentUpgradeableProxy(l2MessageExecutor, timelock, callData) {}
}
