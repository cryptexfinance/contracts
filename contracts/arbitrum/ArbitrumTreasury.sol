// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "../ITreasury.sol";

/**
 * @title TCAP Arbitrum Treasury
 * @author Cryptex.finance
 * @notice This contract will hold the assets generated by the arbitrum network.
 */
contract ArbitrumTreasury is ITreasury {
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
    require(
      msg.sender == arbitrumMessageExecutor,
      "ArbitrumTreasury: : caller is not the owner"
    );
    _;
  }

  /**
   * @notice Constructor
   * @param _owner the owner of the contract
   * @param _arbitrumMessageExecutor address of the arbitrum L2MessageExecutor contract
   */
  constructor(address _owner, address _arbitrumMessageExecutor)
    ITreasury(_owner)
  {
    require(
      _arbitrumMessageExecutor != address(0),
      "ArbitrumTreasury::constructor: address can't be zero"
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
      "ArbitrumTreasury: new owner is the zero address"
    );
    emit UpdatedMessageExecutor(arbitrumMessageExecutor, newMessageExecutor);
    arbitrumMessageExecutor = newMessageExecutor;
  }
}