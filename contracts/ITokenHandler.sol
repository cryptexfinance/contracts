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
import "./oracles/ChainlinkOracle.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
abstract contract ITokenHandler is Ownable, AccessControl, ReentrancyGuard {
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPXContract(address indexed _owner, TCAPX _token);
  event LogSetTCAPOracle(address indexed _owner, Oracle _oracle);
  event LogSetCollateralContract(
    address indexed _owner,
    ERC20 _collateralContract
  );
  event LogSetCollateralPriceOracle(
    address indexed _owner,
    ChainlinkOracle _priceOracle
  );
  event LogSetDivisor(address indexed _owner, uint256 _divisor);
  event LogSetRatio(address indexed _owner, uint256 _ratio);
  event LogSetBurnFee(address indexed _owner, uint256 _burnFee);
  event LogEnableWhitelist(address indexed _owner, bool _enable);
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
  event LogRetrieveFees(address indexed _owner, uint256 _amount);

  using SafeMath for uint256;
  using Counters for Counters.Counter;

  /** @dev vault id counter */
  Counters.Counter counter;

  bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

  struct Vault {
    uint256 Id;
    uint256 Collateral;
    address Owner;
    uint256 Debt;
  }
  /** @dev TCAP Token Address */
  TCAPX public TCAPXToken;
  /** @dev Total Market Cap Oracle */
  Oracle public tcapOracle;
  /** @dev Collateral Token Address*/
  ERC20 public collateralContract;
  /** @dev Collateral Oracle Address*/
  ChainlinkOracle public collateralPriceOracle;

  /**
   * @notice divisor value to set the TCAP.X price
   * @dev Is 1x10^10 so the result is a token with 18 decimals
   */
  uint256 public divisor;
  /** @dev Liquidation Ratio */
  uint256 public ratio;
  /** @dev Fee charged when burning TCAP.X Tokens */
  uint256 public burnFee;
  /** @dev Flag that allows any users to create vaults*/
  bool public whitelistEnabled;
  mapping(address => uint256) public vaultToUser;
  mapping(uint256 => Vault) public vaults;

  /** @notice Throws if called by any account other than the investor. */
  modifier onlyInvestor() {
    if (whitelistEnabled) {
      require(hasRole(INVESTOR_ROLE, msg.sender), "Caller is not investor");
    }
    _;
  }

  /** @notice Throws if vault hasn't been created. */
  modifier vaultExists() {
    require(vaultToUser[msg.sender] != 0, "No Vault created");
    _;
  }

  /** @dev counter starts in one as 0 is reserved for empty objects */
  constructor() public {
    whitelistEnabled = true;
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /**
   * @notice Sets the address of the TCAPX ERC20 contract
   * @param _TCAPXToken address
   * @dev Only owner can call it
   */
  function setTCAPXContract(TCAPX _TCAPXToken) public virtual onlyOwner {
    TCAPXToken = _TCAPXToken;
    emit LogSetTCAPXContract(msg.sender, _TCAPXToken);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setTCAPOracle(Oracle _oracle) public virtual onlyOwner {
    tcapOracle = _oracle;
    emit LogSetTCAPOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the address of the collateral contract
   * @param _collateralContract address
   * @dev Only owner can call it
   */
  function setCollateralContract(ERC20 _collateralContract)
    public
    virtual
    onlyOwner
  {
    collateralContract = _collateralContract;
    emit LogSetCollateralContract(msg.sender, _collateralContract);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _collateral address
   * @dev Only owner can call it
   */
  function setCollateralPriceOracle(ChainlinkOracle _collateral)
    public
    onlyOwner
  {
    collateralPriceOracle = _collateral;
    emit LogSetCollateralPriceOracle(msg.sender, _collateral);
  }

  /**
   * @notice Sets the divisor amount for token price calculation
   * @param _divisor uint
   * @dev Only owner can call it
   */
  function setDivisor(uint256 _divisor) public virtual onlyOwner {
    divisor = _divisor;
    emit LogSetDivisor(msg.sender, _divisor);
  }

  /**
   * @notice Sets the collateral ratio needed to mint tokens
   * @param _ratio uint
   * @dev Only owner can call it
   */
  function setRatio(uint256 _ratio) public virtual onlyOwner {
    ratio = _ratio;
    emit LogSetRatio(msg.sender, _ratio);
  }

  /**
   * @notice Sets the collateral ratio needed to mint tokens
   * @param _burnFee uint
   * @dev Only owner can call it
   */
  function setBurnFee(uint256 _burnFee) public virtual onlyOwner {
    burnFee = _burnFee;
    emit LogSetBurnFee(msg.sender, _burnFee);
  }

  /**
   * @notice Sets the flag to true in order to allow only investor to use the contract
   * @param _enable uint
   * @dev Only owner can call it
   */
  function enableWhitelist(bool _enable) public virtual onlyOwner {
    whitelistEnabled = _enable;
    emit LogEnableWhitelist(msg.sender, whitelistEnabled);
  }

  /**
   * @notice Add the investor role to an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function addInvestor(address _investor) public virtual onlyOwner {
    grantRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Remove the investor role from an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function removeInvestor(address _investor) public virtual onlyOwner {
    revokeRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Creates a Vault
   * @dev Only whitelisted can call it
   */
  function createVault() public virtual onlyInvestor {
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
    virtual
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
    virtual
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

    collateralContract.transfer(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Mints TCAP.X Tokens staking the collateral
   * @param _amount of tokens to mint
   */
  function mint(uint256 _amount) public virtual nonReentrant vaultExists {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 requiredCollateral = requiredCollateral(_amount); // TODO: rename to collateral for mint
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
  function burn(uint256 _amount)
    public
    virtual
    payable
    nonReentrant
    vaultExists
  {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 fee = getFee(_amount);
    require(vault.Debt >= _amount, "Amount greater than debt");
    require(fee == msg.value, "Burn fee different than required");
    vault.Debt = vault.Debt.sub(_amount);
    TCAPXToken.burn(msg.sender, _amount);
    emit LogBurn(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Sends the owner of the contract the Fees saved on ETH
   */
  function retrieveFees() public virtual onlyOwner {
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
    emit LogRetrieveFees(msg.sender, amount);
  }

  /**
   * @notice Returns the price of the TCAPX token
   * @dev TCAPX token is 18 decimals
   * @dev oracle totalMarketPrice must be in wei format
   * @return price of the TCAPX Token
   */
  function TCAPXPrice() public virtual view returns (uint256 price) {
    uint256 totalMarketPrice = tcapOracle.price();
    price = totalMarketPrice.div(divisor);
  }

  /**
   * @notice Returns the minimal required collateral to mint TCAPX token
   * @dev TCAPX token is 18 decimals
   * @dev Is only divided by 100 as eth price comes in wei to cancel the additional 0
   * @param _amount uint amount to mint
   * @return collateral of the TCAPX Token
   */
  function requiredCollateral(uint256 _amount)
    public
    virtual
    view
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPXPrice();
    uint256 collateralPrice = uint256(collateralPriceOracle.getLatestAnswer());
    collateral = ((tcapPrice.mul(_amount).mul(ratio)).div(100)).div(
      collateralPrice
    );
  }

  /**
   * @notice Returns the vault object
   * @param _id Id of the vault
   * @return id the vault
   * @return collateral added
   * @return owner of the vault
   * @return debt of the vault
   */
  function getVault(uint256 _id)
    public
    virtual
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
   * @dev is multiplied by 100 to cancel the wei value of the tcapx price
   * @dev ratio is not 100% accurate as decimals precisions is complicated
   * @param _vaultId uint of the vault
   * @return currentRatio
   */
  function getVaultRatio(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 currentRatio)
  {
    Vault memory vault = vaults[_vaultId];
    if (vault.Id == 0 || vault.Debt == 0) {
      currentRatio = 0;
    } else {
      uint256 collateralPrice = uint256(
        collateralPriceOracle.getLatestAnswer()
      );
      currentRatio = (
        (collateralPrice.mul(vault.Collateral.mul(100))).div(
          vault.Debt.mul(TCAPXPrice())
        )
      );
    }
  }

  /**
   * @notice Calculates the burn fee for a specified amount
   * @param _amount uint to calculate from
   * @dev it's divided by 100 to cancel the wei value of the tcapx price
   * @return fee
   */
  function getFee(uint256 _amount) public virtual view returns (uint256 fee) {
    uint256 collateralPrice = uint256(collateralPriceOracle.getLatestAnswer());
    fee = (TCAPXPrice().mul(_amount).mul(burnFee)).div(100).div(
      collateralPrice
    );
  }
}
