// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NumberUpdater
 * @dev A simple contract that allows a user to update a number.
 */
contract NumberUpdater {
    /// @notice The current number stored in the contract.
    uint256 public number;

    /// @notice Emitted when the number is updated.
    /// @param oldNumber The previous value of the number.
    /// @param newNumber The new value of the number.
    event NumberUpdated(uint256 oldNumber, uint256 newNumber);

    /**
     * @dev Initializes the contract with an initial number.
     * @param _initialNumber The initial value of the number.
     */
    constructor(uint256 _initialNumber) {
        number = _initialNumber;
        emit NumberUpdated(0, _initialNumber); // Emit event for initial number
    }

    /**
     * @notice Updates the number stored in the contract.
     * @param _newNumber The new value of the number.
     */
    function updateNumber(uint256 _newNumber) external {
        uint256 oldNumber = number; // Store the old number
        number = _newNumber; // Update the number
        emit NumberUpdated(oldNumber, _newNumber); // Emit event
    }
}
