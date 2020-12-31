// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "./IVaultHandler.sol";
import "./TCAP.sol";
import "./oracles/ChainlinkOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TCAP Orchestrator
 * @author Cristian Espinoza
 * @notice Orchestrator contract in charge of managing the settings of the vaults and TCAP token
 */
contract Orchestrator is Ownable {
  /** @dev Interface constants*/
  bytes4 private constant _INTERFACE_ID_IVAULT = 0x9e75ab0c;
  bytes4 private constant _INTERFACE_ID_TCAP = 0xa9ccee51;
  bytes4 private constant _INTERFACE_ID_CHAINLINK_ORACLE = 0x85be402b;

  /**
   * @notice Throws if vault is not valid.
   * @param _vault address
   */
  modifier validVault(IVaultHandler _vault) {
    require(
      ERC165Checker.supportsInterface(address(_vault), _INTERFACE_ID_IVAULT),
      "Not a valid vault"
    );
    _;
  }

  /**
   * @notice Throws if TCAP Token is not valid.
   * @param _tcap address
   */
  modifier validTCAP(TCAP _tcap) {
    require(
      ERC165Checker.supportsInterface(address(_tcap), _INTERFACE_ID_TCAP),
      "Not a valid TCAP ERC20"
    );
    _;
  }

  /**
   * @notice Throws if Chainlink Oracle is not valid.
   * @param _oracle address
   */
  modifier validChainlinkOracle(address _oracle) {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
    _;
  }

  /**
   * @dev CREATED AS STACK IS TOO DEEP ON INITIALIZE
   * @notice Throws if Chainlink Oracle is not valid
   * @param _oracle address
   */
  function _validChainlinkOracle(address _oracle) private view {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
  }

  /**
   * @notice Sets the ratio of a vault
   * @param _vault address
   * @param _ratio value
   * @dev Only owner can call it
   */
  function setRatio(IVaultHandler _vault, uint256 _ratio)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.setRatio(_ratio);
  }

  /**
   * @notice Sets the burn fee of a vault
   * @param _vault address
   * @param _burnFee value
   * @dev Only owner can call it
   */
  function setBurnFee(IVaultHandler _vault, uint256 _burnFee)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.setBurnFee(_burnFee);
  }

  /**
   * @notice Sets the burn fee to 0, only used on a black swan event
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function setEmergencyBurnFee(IVaultHandler _vault)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.setBurnFee(0);
  }

  /**
   * @notice Sets the liquidation penalty of a vault
   * @param _vault address
   * @param _liquidationPenalty value
   * @dev Only owner can call it
   */
  function setLiquidationPenalty(
    IVaultHandler _vault,
    uint256 _liquidationPenalty
  ) external onlyOwner validVault(_vault) {
    _vault.setLiquidationPenalty(_liquidationPenalty);
  }

  /**
   * @notice Sets the liquidation penalty of a vault to 0, only used on a black swan event
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function setEmergencyLiquidationPenalty(IVaultHandler _vault)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.setLiquidationPenalty(0);
  }

  /**
   * @notice Pauses the Vault
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function pauseVault(IVaultHandler _vault)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.pause();
  }

  /**
   * @notice Unpauses the Vault
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function unpauseVault(IVaultHandler _vault)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.unpause();
  }

  /**
   * @notice Retrieves a vault fees and put it on the Orchestrator
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function retrieveVaultFees(IVaultHandler _vault)
    external
    onlyOwner
    validVault(_vault)
  {
    _vault.retrieveFees();
  }

  /**
   * @notice Retrieves the fees on the orchestrator
   * @dev Only owner can call it
   * @dev Transfer the balance to the contract owner
   */
  function retrieveFees() external onlyOwner {
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
  }

  /**
   * @notice Enables or disables the TCAP Cap
   * @param _tcap address
   * @param _enable bool
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   */
  function enableTCAPCap(TCAP _tcap, bool _enable)
    external
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.enableCap(_enable);
  }

  /**
   * @notice Sets the TCAP maximum minting value
   * @param _tcap address
   * @param _cap uint value
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   */
  function setTCAPCap(TCAP _tcap, uint256 _cap)
    external
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.setCap(_cap);
  }

  /**
   * @notice Adds Vault to TCAP ERC20
   * @param _tcap address
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   * @dev Validates if _vault is valid
   */
  function addTCAPVault(TCAP _tcap, IVaultHandler _vault)
    external
    onlyOwner
    validTCAP(_tcap)
    validVault(_vault)
  {
    _tcap.addTokenHandler(address(_vault));
  }

  /**
   * @notice Allows the contract to receive ETH
   */
  receive() external payable {}
}
