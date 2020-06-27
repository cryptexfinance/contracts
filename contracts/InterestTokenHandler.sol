// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;
import "./ITokenHandler.sol";
import "./IRToken.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract InterestTokenHandler is ITokenHandler {
  event LogSetInterestTokenAddress(
    address indexed _owner,
    IRToken _interestTokenAddress
  );

  event LogRetrieveInterest(address indexed _owner, uint256 _interest);

  IRToken public interestTokenAddress;

  /**
   * @notice Sets the address of the collateral contract
   * @param _interestTokenAddress address
   * @dev Only owner can call it
   */
  function setInterestTokenAddress(IRToken _interestTokenAddress)
    public
    onlyOwner
  {
    interestTokenAddress = _interestTokenAddress;
    emit LogSetInterestTokenAddress(msg.sender, _interestTokenAddress);
  }

  /**
   * @notice Adds collateral to vault
   * @dev Only whitelisted can call it
   * @param _amount of collateral to add
   */
  function addCollateral(uint256 _amount)
    public
    override
    onlyInvestor
    nonReentrant
    vaultExists
  {
    collateralContract.transferFrom(msg.sender, address(this), _amount);
    collateralContract.approve(address(interestTokenAddress), _amount);
    interestTokenAddress.mint(_amount);
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    vault.Collateral = vault.Collateral.add(_amount);
    emit LogAddCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Removes not used collateral from collateral
   * @param _amount of collateral to add
   */
  function removeCollateral(uint256 _amount)
    public
    override
    nonReentrant
    vaultExists
  {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 currentRatio = getVaultRatio(vault.Id);
    require(
      vault.Collateral >= _amount,
      "Transaction reverted with Retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    if (currentRatio != 0) {
      require(
        getVaultRatio(vault.Id) >= ratio,
        "Collateral below min required ratio"
      );
    }
    interestTokenAddress.redeemAndTransfer(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  /** @notice Allow owner of contract to retrieve the generated interest by burning PUSH
   * @dev only owner can call this function
   * @dev rDAI pays interests, owner gets all the DAI in the contract
   * @dev The push tokens are backed by rDAI and not DAI so it shouldn't affect staking
   */
  function retrieveInterest() public onlyOwner {
    uint256 interest = interestTokenAddress.interestPayableOf(address(this));
    interestTokenAddress.payInterest(address(this));
    collateralContract.transfer(owner(), interest);
    emit LogRetrieveInterest(msg.sender, interest);
  }
}
