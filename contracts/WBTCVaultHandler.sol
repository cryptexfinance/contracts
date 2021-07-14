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
   * @notice Returns the minimal required collateral to mint TCAP token
   * @param _amount uint amount to mint
   * @return collateral of the TCAP Token
   * @dev TCAP token is 18 decimals
   * @dev C = ((P * A * r) / 100) / cp
   * C = Required Collateral
   * P = TCAP Token Price
   * A = Amount to Mint
   * cp = Collateral Price
   * r = Minimum Ratio for Liquidation
   * Is only divided by 100 as eth price comes in wei to cancel the additional 0s
   */
  function requiredCollateral(uint256 _amount)
    public
    view
    override
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPPrice();
    uint256 ethDecimals = 18;
    uint256 tokenDigits =
      10**((ethDecimals).sub(collateralContract.decimals()));
    console.log("amount of tcap: ", _amount);
    console.log("token digits: ", tokenDigits);
    console.log("tcap price: ", tcapPrice);
    uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
    console.log("collateral price: ", collateralPrice);
    collateral = ((tcapPrice.mul(_amount).mul(ratio))).div(
      collateralPrice.mul(tokenDigits).mul(100)
    );
  }

  /**
   * @notice Returns the minimal required TCAP to liquidate a Vault
   * @param _vaultId of the vault to liquidate
   * @return amount required of the TCAP Token
   * @dev LT = ((((D * r) / 100) - cTcap) * 100) / (r - (p + 100))
   * cTcap = ((C * cp) / P)
   * LT = Required TCAP
   * D = Vault Debt
   * C = Required Collateral
   * P = TCAP Token Price
   * cp = Collateral Price
   * r = Min Vault Ratio
   * p = Liquidation Penalty
   */
  function requiredLiquidationTCAP(uint256 _vaultId)
    public
    view
    override
    returns (uint256 amount)
  {
    Vault memory vault = vaults[_vaultId];
    uint256 tcapPrice = TCAPPrice();
    uint256 ethDecimals = 18;
    uint256 tokenDigits =
      10**((ethDecimals).sub(collateralContract.decimals()));
    uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
    uint256 collateralTcap =
      (vault.Collateral.mul(collateralPrice)).div(tcapPrice);
    uint256 reqDividend =
      (((vault.Debt.mul(ratio)).div(100)).sub(collateralTcap)).mul(100);
    uint256 reqDivisor = ratio.sub(liquidationPenalty.add(100));
    amount = reqDividend.div(reqDivisor);
    // TODO: ;liquidation error is here
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
