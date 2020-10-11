// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "./TCAP.sol";
import "./Orchestrator.sol";
import "./oracles/ChainlinkOracle.sol";

/**
 * @title TCAP Vault Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP Token and stake
 */
abstract contract IVaultHandler is
  Ownable,
  AccessControl,
  ReentrancyGuard,
  Pausable,
  IERC165
{
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPContract(address indexed _owner, TCAP _token);
  event LogSetTCAPOracle(address indexed _owner, ChainlinkOracle _oracle);
  event LogSetCollateralContract(
    address indexed _owner,
    IERC20 _collateralContract
  );
  event LogSetCollateralPriceOracle(
    address indexed _owner,
    ChainlinkOracle _priceOracle
  );
  event LogSetETHPriceOracle(
    address indexed _owner,
    ChainlinkOracle _priceOracle
  );
  event LogSetDivisor(address indexed _owner, uint256 _divisor);
  event LogSetRatio(address indexed _owner, uint256 _ratio);
  event LogSetBurnFee(address indexed _owner, uint256 _burnFee);
  event LogSetLiquidationPenalty(
    address indexed _owner,
    uint256 _liquidationPenalty
  );
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
  event LogLiquidateVault(
    uint256 indexed _vaultId,
    address indexed _liquidator,
    uint256 _liquidationCollateral,
    uint256 _reward
  );
  event LogRetrieveFees(address indexed _owner, uint256 _amount);

  /** @dev Open Zeppelin libraries */
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  /** @dev vault id counter */
  Counters.Counter counter;

  /**
   * @notice There is one vault per user. it saves an unique identifier,
   * the current collateral provided by the owner, the debt and the owner address
   */
  struct Vault {
    uint256 Id;
    uint256 Collateral;
    uint256 Debt;
    address Owner;
  }
  /** @dev TCAP Token Address */
  TCAP public TCAPToken;
  /** @dev Total Market Cap Oracle */
  ChainlinkOracle public tcapOracle;
  /** @dev Collateral Token Address*/
  IERC20 public collateralContract;
  /** @dev Collateral Oracle Address*/
  ChainlinkOracle public collateralPriceOracle;
  /** @dev Collateral Oracle Address*/
  ChainlinkOracle public ETHPriceOracle;

  /**
   * @notice divisor value to set the TCAP price
   * @dev Is 1x10^10 so the result is a token with 18 decimals
   */
  uint256 public divisor;
  /** @dev Liquidation Ratio */
  uint256 public ratio;
  /** @dev Fee charged when burning TCAP Tokens */
  uint256 public burnFee;
  /** @dev Penalty charged when an account gets liquidated */
  uint256 public liquidationPenalty;
  /** @dev Owner to Vault Id */
  mapping(address => uint256) public vaultToUser;
  /** @dev Id To Vault */
  mapping(uint256 => Vault) public vaults;

  /** @notice Throws if vault hasn't been created. */
  modifier vaultExists() {
    require(vaultToUser[msg.sender] != 0, "No Vault created");
    _;
  }

  /** @notice Throws if value is 0. */
  modifier notZero(uint256 _value) {
    require(_value != 0, "Value can't be 0");
    _;
  }

  /**
   * @dev the computed interface ID according to ERC-165. The interface ID is a XOR of all
   * all interface method selectors.
   *
   * initialize.selector ^
   * setTCAPContract.selector ^
   * setTCAPOracle.selector ^
   * setCollateralContract.selector ^
   * setCollateralPriceOracle.selector ^
   * setETHPriceOracle.selector ^
   * setDivisor.selector ^
   * setRatio.selector ^
   * setBurnFee.selector ^
   * setLiquidationPenalty.selector ^
   * i.pause.selector ^
   * i.unpause.selector =>  0x409e4a0f
   */
  bytes4 private constant _INTERFACE_ID_IVAULT = 0x409e4a0f;

  /* bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7 */
  bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

  /** @dev counter starts in one as 0 is reserved for empty objects */
  constructor(Orchestrator _orchestrator) public {
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    transferOwnership(address(_orchestrator));
  }

  /**
   * @notice Allows the orchestrator to initialize the contract
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _liquidationPenalty uint256
   * @param _tcapOracle address
   * @param _tcapAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   * @dev Only owner can call it
   * @dev Can only be called once
   */
  function initialize(
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  ) public virtual onlyOwner {
    divisor = _divisor;
    ratio = _ratio;
    burnFee = _burnFee;
    liquidationPenalty = _liquidationPenalty;
    tcapOracle = ChainlinkOracle(_tcapOracle);
    collateralContract = IERC20(_collateralAddress);
    collateralPriceOracle = ChainlinkOracle(_collateralOracle);
    ETHPriceOracle = ChainlinkOracle(_ethOracle);
    TCAPToken = _tcapAddress;
  }

  /**
   * @notice Sets the address of the TCAP ERC20 contract
   * @param _TCAPToken address
   * @dev Only owner can call it
   */
  function setTCAPContract(TCAP _TCAPToken) public virtual onlyOwner {
    TCAPToken = _TCAPToken;
    emit LogSetTCAPContract(msg.sender, _TCAPToken);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setTCAPOracle(ChainlinkOracle _oracle) public virtual onlyOwner {
    tcapOracle = _oracle;
    emit LogSetTCAPOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the address of the collateral contract
   * @param _collateralContract address
   * @dev Only owner can call it
   */
  function setCollateralContract(IERC20 _collateralContract)
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
   * @notice Sets the address of the oracle contract for the ETH price feed
   * @param _ethPriceOracle address
   * @dev Only owner can call it
   */
  function setETHPriceOracle(ChainlinkOracle _ethPriceOracle) public onlyOwner {
    ETHPriceOracle = _ethPriceOracle;
    emit LogSetETHPriceOracle(msg.sender, _ethPriceOracle);
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
   * @notice Sets the liquidation penalty % charged on liquidation
   * @param _liquidationPenalty uint
   * @dev Only owner can call it
   */
  function setLiquidationPenalty(uint256 _liquidationPenalty)
    public
    virtual
    onlyOwner
  {
    liquidationPenalty = _liquidationPenalty;
    emit LogSetLiquidationPenalty(msg.sender, _liquidationPenalty);
  }

  /**
   * @notice Creates a Vault
	 * @dev Only one vault per address can be created
   */
  function createVault() public virtual whenNotPaused {
    require(vaultToUser[msg.sender] == 0, "Vault already created");
    uint256 id = counter.current();
    vaultToUser[msg.sender] = id;
    Vault memory vault = Vault(id, 0, 0, msg.sender);
    vaults[id] = vault;
    counter.increment();
    emit LogCreateVault(msg.sender, id);
  }

  /**
   * @notice Adds collateral to vault
   * @param _amount of collateral to add
   * @dev _amount should be higher than 0
   */
  function addCollateral(uint256 _amount)
    public
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    collateralContract.transferFrom(msg.sender, address(this), _amount);
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    vault.Collateral = vault.Collateral.add(_amount);
    emit LogAddCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Removes not used collateral from collateral
   * @param _amount of collateral to remove
   * @dev _amount should be higher than 0
   */
  function removeCollateral(uint256 _amount)
    public
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
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
   * @notice Mints TCAP Tokens staking the collateral
   * @param _amount of tokens to mint
   * @dev _amount should be higher than 0
   */
  function mint(uint256 _amount)
    public
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 requiredCollateral = requiredCollateral(_amount);
    require(vault.Collateral >= requiredCollateral, "Not enough collateral");
    vault.Debt = vault.Debt.add(_amount);
    require(
      getVaultRatio(vault.Id) >= ratio,
      "Collateral below min required ratio"
    );
    TCAPToken.mint(msg.sender, _amount);
    emit LogMint(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Burns TCAP Tokens releasing the staked collateral
   * @param _amount of tokens to burn
   * @dev _amount should be higher than 0
   */
  function burn(uint256 _amount)
    public
    virtual
    payable
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault memory vault = vaults[vaultToUser[msg.sender]];
    _checkBurnFee(_amount);
    _burn(vault.Id, _amount);
    emit LogBurn(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Allow users to liquidate vaults with low collateral ratio
   * @param _vaultId to liquidate
   */
  function liquidateVault(uint256 _vaultId, uint256 requiredCollateral)
    public
    payable
    nonReentrant
    whenNotPaused
  {
    Vault storage vault = vaults[_vaultId];
    require(vault.Id != 0, "No Vault created");
    uint256 vaultRatio = getVaultRatio(vault.Id);
    require(vaultRatio < ratio, "Vault is not liquidable");
    uint256 req = requiredLiquidationCollateral(vault.Id);
    require(
      requiredCollateral == req,
      "Liquidation amount different than required"
    );
    uint256 reward = liquidationReward(vault.Id);
    _checkBurnFee(requiredCollateral);
    _burn(vault.Id, requiredCollateral);
    vault.Collateral = vault.Collateral.sub(reward);
    collateralContract.transfer(msg.sender, reward);
    emit LogLiquidateVault(vault.Id, msg.sender, req, reward);
  }

  /**
   * @notice Allows owner to Pause the Contract
   */
  function pause() public onlyOwner {
    _pause();
  }

  /**
   * @notice Allows owner to Unpause the Contract
   */
  function unpause() public onlyOwner {
    _unpause();
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
   * @notice Returns the price of the TCAP token
   * @return price of the TCAP Token
   * @dev TCAP token is 18 decimals
   * @dev oracle totalMarketPrice must be in wei format
   * @dev P = M / d
   * P = TCAP Token Price
   * M = Total Crypto Market Cap
   * d = Divisor
   */
  function TCAPPrice() public virtual view returns (uint256 price) {
    uint256 totalMarketPrice = tcapOracle.getLatestAnswer();
    price = totalMarketPrice.div(divisor);
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
   * Is only divided by 100 as eth price comes in wei to cancel the additional 0s
   */
  function requiredCollateral(uint256 _amount)
    public
    virtual
    view
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = collateralPriceOracle.getLatestAnswer();
    collateral = ((tcapPrice.mul(_amount).mul(ratio)).div(100)).div(
      collateralPrice
    );
  }

  /**
   * @notice Returns the minimal required TCAP to liquidate a Vault
   * @param _vaultId of the vault to liquidate
   * @return collateral required of the TCAP Token
   * @dev LC = ((((D * r) / 100) - cTcap) * 100) / (r - (p + 100))
   * cTcap = ((C * cp) / P)
   * LC = Required Liquidation Collateral
   * D = Vault Debt
   * C = Required Collateral
   * P = TCAP Token Price
   * cp = Collateral Price
   * r = Min Vault Ratio
   * p = Liquidation Penalty
   */
  function requiredLiquidationCollateral(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 collateral)
  {
    Vault memory vault = vaults[_vaultId];
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = collateralPriceOracle.getLatestAnswer();
    uint256 collateralTcap = (vault.Collateral.mul(collateralPrice)).div(
      tcapPrice
    );
    uint256 reqDividend = (
      ((vault.Debt.mul(ratio)).div(100)).sub(collateralTcap)
    )
      .mul(100);
    uint256 reqDivisor = ratio.sub(liquidationPenalty.add(100));
    collateral = reqDividend.div(reqDivisor);
  }

  /**
   * @notice Returns Reward for liquidating a vault
   * @param _vaultId of the vault to liquidate
   * @return rewardCollateral for liquidating Vault
   * @dev the returned value is returned on the vault collateral
   * @dev R = (LC * (p  + 100)) / 100
   * R = Liquidation Reward
   * LC = Required Liquidation Collateral
   * p = liquidation penalty
   */
  function liquidationReward(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 rewardCollateral)
  {
    uint256 req = requiredLiquidationCollateral(_vaultId);
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = collateralPriceOracle.getLatestAnswer();
    uint256 reward = (req.mul(liquidationPenalty.add(100))).div(100);
    rewardCollateral = (reward.mul(tcapPrice)).div(collateralPrice);
  }

  /**
   * @notice Returns the Vault information
   * @param _id of vault
   * @return Id, Collateral, Owner, Debt
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
   * @notice Returns the Collateral Ratio fo the Vault
   * @param _vaultId id of vault
   * @return currentRatio
   * @dev vr = (cp * (C * 100)) / D - P
   * vr = Vault Ratio
   * C = Vault Collateral
   * cp = Collateral Price
   * D = Vault Debt
   * P = TCAP Token Price
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
      uint256 collateralPrice = collateralPriceOracle.getLatestAnswer();
      currentRatio = (
        (collateralPrice.mul(vault.Collateral.mul(100))).div(
          vault.Debt.mul(TCAPPrice())
        )
      );
    }
  }

  /**
   * @notice Returns the required fee to burn the TCAP tokens
   * @param _amount to burn
   * @return fee
   * @dev The returned value is returned on ETH
   * @dev f = ((P * A * b)/ 100)
   * f = Burn Fee Value
   * P = TCAP Token Price
   * A = Amount to Burn
   * b = Burn Fee %
   */
  function getFee(uint256 _amount) public virtual view returns (uint256 fee) {
    uint256 ethPrice = ETHPriceOracle.getLatestAnswer();
    fee = (TCAPPrice().mul(_amount).mul(burnFee)).div(100).div(ethPrice);
  }

  /**
   * @notice Returns the required fee to burn the TCAP tokens
   * @param _amount to burn
   */
  function _checkBurnFee(uint256 _amount) internal {
    uint256 fee = getFee(_amount);
    require(fee == msg.value, "Burn fee different than required");
  }

  /**
   * @notice Burns an amount of TCAP Tokens
   * @param _vaultId vault id
   * @param _amount to burn
   */
  function _burn(uint256 _vaultId, uint256 _amount) internal {
    Vault storage vault = vaults[_vaultId];
    require(vault.Debt >= _amount, "Amount greater than debt");
    vault.Debt = vault.Debt.sub(_amount);
    TCAPToken.burn(msg.sender, _amount);
  }

  /**
   * @notice ERC165 Standard for support of interfaces
   * @param interfaceId bytes of interface
   * @return bool
   */
  function supportsInterface(bytes4 interfaceId)
    external
    override
    view
    returns (bool)
  {
    return (interfaceId == _INTERFACE_ID_IVAULT ||
      interfaceId == _INTERFACE_ID_ERC165);
  }
}
