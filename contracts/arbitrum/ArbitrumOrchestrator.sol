// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "../IOrchestrator.sol";

/**
 * @title TCAP Arbitrum Orchestrator
 * @author Cryptex.finance
 * @notice Orchestrator contract in charge of managing the settings of the vaults, rewards and TCAP token. It acts as the owner of these contracts.
 */
contract ArbitrumOrchestrator is IOrchestrator {
  /// @notice Address of the arbitrum L2MessageExecutor contract.
  address public arbitrumMessageExecutor;

  /// @notice event emitted when arbitrumMessageExecutor is updated.
  event UpdatedMessageExecutor(
    address oldMessageExecutor,
    address newMessageExecutor
  );

  // @notice Throws if called by an account different from the owner
  // @dev call needs to come from arbitrumMessageExecutor
  modifier onlyOwner() override {
    require(msg.sender == arbitrumMessageExecutor, "ArbitrumOrchestrator: caller is not the owner");
    _;
  }

  /**
   * @notice Constructor
   * @param _guardian The guardian address
   **/
  constructor(
    address _guardian,
    address _owner,
    address _arbitrumMessageExecutor
  ) IOrchestrator(_guardian, _owner) {
    require(
      _arbitrumMessageExecutor != address(0),
      "ArbitrumOrchestrator::constructor: address can't be zero"
    );
    arbitrumMessageExecutor = _arbitrumMessageExecutor;
  }

  /**
   * @notice updates arbitrumMessageExecutor address
   * @param newMessageExecutor address of the new L2MessageExecutor contract
   **/
  function updateMessageExecutor(address newMessageExecutor)
    external
    onlyOwner
  {
    require(
      newMessageExecutor != address(0),
      "ArbitrumOrchestrator: new owner is the zero address"
    );
    emit UpdatedMessageExecutor(
      arbitrumMessageExecutor,
      newMessageExecutor
    );
    arbitrumMessageExecutor = newMessageExecutor;
  }
}
