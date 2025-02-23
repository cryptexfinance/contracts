// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "../BaseTreasury.sol";

/**
 * @title CryptexBaseTreasury
 * @author Cryptex.finance
 * @notice This contract will hold assets on the base network.
 */
contract CryptexBaseTreasury is BaseTreasury {
  /**
   * @notice Constructor
   * @param _owner the owner of the contract
   **/
  constructor(address _owner) BaseTreasury(_owner) {}

  /// @notice renounceOwnership has been disabled so that the contract is never left without a owner
  /// @inheritdoc Proprietor
  function renounceOwnership() public override onlyOwner {
    revert("CryptexBaseTreasury::renounceOwnership: function disabled");
  }
}
