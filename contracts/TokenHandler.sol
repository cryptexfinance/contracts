// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./mocks/Oracle.sol";
import "./TCAPX.sol";
import "./ITokenHandler.sol";

//Debug
import "@nomiclabs/buidler/console.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract TokenHandler is
  ITokenHandler,
  Ownable,
  AccessControl,
  ReentrancyGuard
{
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPXContract(address indexed _owner, TCAPX _token);
  event LogSetOracle(address indexed _owner, Oracle _oracle);
  event LogSetCollateralContract(
    address indexed _owner,
    ERC20 _collateralContract
  );
  event LogSetDivisor(address indexed _owner, uint256 _divisor);
  event LogSetRatio(address indexed _owner, uint256 _ratio);
  event LogCreateVault(address indexed _owner, uint256 indexed _id);
  event LogAddCollateral(
    address indexed _owner,
    uint256 indexed _id,
    uint256 _amount
  );
  event LogRemoveCollateral(
    address indexed _owner,
    uint256 indexed _id,
    uint256 _amount
  );
  event LogMint(address indexed _owner, uint256 indexed _id, uint256 _amount);
  event LogBurn(address indexed _owner, uint256 indexed _id, uint256 _amount);

  using SafeMath for uint256;
  using Counters for Counters.Counter;

  Counters.Counter counter;

  bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

  struct Vault {
    uint256 Id;
    uint256 Collateral;
    address Owner;
    uint256 Debt;
  }

  TCAPX public TCAPXToken;
  Oracle public oracle;
  ERC20 public collateralContract;
  uint256 public divisor;
  uint256 public ratio;
  mapping(address => uint256) public vaultToUser;
  mapping(uint256 => Vault) public vaults;

  /** @notice Throws if called by any account other than the investor. */
  modifier onlyInvestor() {
    require(hasRole(INVESTOR_ROLE, msg.sender), "Caller is not investor");
    _;
  }

  /** @notice Throws if vault hasn't been created. */
  modifier vaultExists() {
    require(vaultToUser[msg.sender] != 0, "No Vault created");
    _;
  }

  /** @dev counter starts in one as 0 is reserved for empty objects */
  constructor() public {
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /**
   * @notice Sets the address of the TCAPX ERC20 contract
   * @param _TCAPXToken address
   * @dev Only owner can call it
   */
  function setTCAPXContract(TCAPX _TCAPXToken) public override onlyOwner {
    TCAPXToken = _TCAPXToken;
    emit LogSetTCAPXContract(msg.sender, _TCAPXToken);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setOracle(Oracle _oracle) public override onlyOwner {
    oracle = _oracle;
    emit LogSetOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the address of the collateral contract
   * @param _collateralContract address
   * @dev Only owner can call it
   */
  function setCollateralContract(ERC20 _collateralContract)
    public
    override
    onlyOwner
  {
    collateralContract = _collateralContract;
    emit LogSetCollateralContract(msg.sender, _collateralContract);
  }

  /**
   * @notice Sets the divisor amount for token price calculation
   * @param _divisor uint
   * @dev Only owner can call it
   */
  function setDivisor(uint256 _divisor) public override onlyOwner {
    divisor = _divisor;
    emit LogSetDivisor(msg.sender, _divisor);
  }

  /**
   * @notice Sets the collateral ratio needed to mint tokens
   * @param _ratio uint
   * @dev Only owner can call it
   */
  function setRatio(uint256 _ratio) public override onlyOwner {
    ratio = _ratio;
    emit LogSetRatio(msg.sender, _ratio);
  }

  /**
   * @notice Add the investor role to an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function addInvestor(address _investor) public override onlyOwner {
    grantRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Remove the investor role from an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function removeInvestor(address _investor) public override onlyOwner {
    revokeRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Creates a Vault
   * @dev Only whitelisted can call it
   */
  function createVault() public override onlyInvestor {
    require(vaultToUser[msg.sender] == 0, "Vault already created");
    uint256 id = counter.current();
    vaultToUser[msg.sender] = id;
    Vault memory vault = Vault(id, 0, msg.sender, 0);
    vaults[id] = vault;
    counter.increment();
    emit LogCreateVault(msg.sender, id);
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
    require(
      vault.Collateral >= _amount,
      "Transaction reverted with Retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    collateralContract.transfer(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Mints TCAP.X Tokens staking the collateral
   * @param _amount of tokens to mint
   */
  function mint(uint256 _amount) public override nonReentrant vaultExists {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 requiredCollateral = minRequiredCollateral(_amount);
    require(vault.Collateral >= requiredCollateral, "Not enough collateral");
    vault.Debt = vault.Debt.add(_amount);
    require(
      getVaultRatio(vault.Id) >= ratio,
      "Collateral below min required ratio"
    );
    TCAPXToken.mint(msg.sender, _amount);
    emit LogMint(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Burns TCAP.X Tokens freen the staked collateral
   * @param _amount of tokens to burn
   */
  function burn(uint256 _amount) public override nonReentrant vaultExists {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    require(vault.Debt >= _amount, "Amount greater than debt");
    vault.Debt = vault.Debt.sub(_amount);
    TCAPXToken.burn(msg.sender, _amount);
    emit LogBurn(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Returns the price of the TCAPX token
   * @dev TCAPX token is 18 decimals
   * @return price of the TCAPX Token
   */
  function TCAPXPrice() public override view returns (uint256 price) {
    uint256 totalMarketPrice = oracle.price();
    price = totalMarketPrice.div(divisor);
  }

  /**
   * @notice Returns the minimal required collateral to mint TCAPX token
   * @dev TCAPX token is 18 decimals
   * @param _amount uint amount to mint
   * @return collateral of the TCAPX Token
   */
  function minRequiredCollateral(uint256 _amount)
    public
    override
    view
    returns (uint256 collateral)
  {
    uint256 price = TCAPXPrice();
    collateral = (price.mul(_amount).mul(ratio)).div(100 ether);
  }

  /**
   * @notice Returns the vault object
   * @param _id Id of the vault
   * @return id the vault
   * @return collateral added
   * @return owner of the vault
   */
  function getVault(uint256 _id)
    public
    override
    view
    returns (
      uint256,
      uint256,
      address,
      uint256
    )
  {
    Vault memory vault = vaults[_id];
    return (vault.Id, vault.Collateral, vault.Owner, vault.Debt);
  }

  /**
   * @notice Returns the current collateralization ratio
   * @param _vaultId uint of the vault
   * @return currentRatio
   */
  function getVaultRatio(uint256 _vaultId)
    public
    override
    view
    returns (uint256 currentRatio)
  {
    Vault memory vault = vaults[_vaultId];
    if (vault.Id == 0 || vault.Debt == 0) {
      currentRatio = 0;
    } else {
      currentRatio = (
        (vault.Collateral.mul(100 ether)).div(vault.Debt.mul(TCAPXPrice()))
      );
    }
  }
}
