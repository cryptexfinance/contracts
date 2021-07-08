// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";

/**
 * @title ERC-20 TCAP Vault
 * @author Cryptex.finance
 * @notice Contract in charge of handling the TCAP Vault and stake using a Collateral ERC20
 */
contract WBTCVaultHandler is IVaultHandler {
  using SafeMath for uint256;

  /**
   * @notice Constructor
   * @param _orchestrator address
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _liquidationPenalty uint256
   * @param _tcapOracle address
   * @param _tcapAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   * @param _rewardHandler address
   * @param _treasury address
   */
  constructor(
    Orchestrator _orchestrator,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle,
    address _rewardHandler,
    address _treasury
  )
    IVaultHandler(
      _orchestrator,
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _tcapOracle,
      _tcapAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle,
      _rewardHandler,
      _treasury
    )
  {}

  /**
   * @notice Uses collateral to generate debt on TCAP Tokens which are minted and assigned to caller
   * @param _amount of tokens to mint
   * @dev _amount should be higher than 0
   * @dev requires to have a vault ratio above the minimum ratio
   * @dev if reward handler is set stake to earn rewards
   */
  function mint(uint256 _amount)
    external
    override
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault storage vault = vaults[userToVault[msg.sender]];
    uint256 collateral = requiredCollateral(_amount);
    console.log("amount to mint: ", _amount);
    console.log("required collateral: ", collateral);
    console.log("current collateral: ", vault.Collateral);
    console.log("current vault ratio: ", getVaultRatio(vault.Id));
    console.log("current TCAP Price: ", TCAPPrice());
    console.log(
      "current collateral price:",
      getOraclePrice(collateralPriceOracle)
    );
    require(
      vault.Collateral >= collateral,
      "VaultHandler::mint: not enough collateral"
    );

    vault.Debt = vault.Debt.add(_amount);
    console.log("Vault Debt: ", vault.Debt);
    require(
      getVaultRatio(vault.Id) >= ratio,
      "VaultHandler::mint: collateral below min required ratio"
    );

    if (address(rewardHandler) != address(0)) {
      rewardHandler.stake(msg.sender, _amount);
    }

    TCAPToken.mint(msg.sender, _amount);
    emit TokensMinted(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Returns the Collateral Ratio of the Vault
   * @param _vaultId id of vault
   * @return currentRatio
   * @dev vr = (cp * (C * 100)) / D * P
   * vr = Vault Ratio
   * C = Vault Collateral
   * cp = Collateral Price
   * D = Vault Debt
   * P = TCAP Token Price
   */
  function getVaultRatio(uint256 _vaultId)
    public
    view
    override
    returns (uint256 currentRatio)
  {
    Vault memory vault = vaults[_vaultId];
    if (vault.Id == 0 || vault.Debt == 0) {
      currentRatio = 0;
    } else {
      uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
      // here it's needed to multiply by the amount of digits missing from 18
      uint256 ethDecimals = 18;
      uint256 tokenDigits =
        10**((ethDecimals).sub(collateralContract.decimals()));
      console.log("Token digits math: ", tokenDigits);
      currentRatio = (
        (collateralPrice.mul(vault.Collateral.mul(100).mul(tokenDigits))).div(
          vault.Debt.mul(TCAPPrice())
        )
      );
      console.log("cr: ", currentRatio);
    }
  }
}
