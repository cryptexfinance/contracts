// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;
import "./TCAPX.sol";
import "./mocks/Oracle.sol";


interface ITokenHandler {
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

  function setTCAPXContract(TCAPX _TCAPXToken) external;

  function setOracle(Oracle _oracle) external;

  function setCollateralContract(ERC20 _collateralContract) external;

  function setDivisor(uint256 _divisor) external;

  function setRatio(uint256 _ratio) external;

  function addInvestor(address _investor) external;

  function removeInvestor(address _investor) external;

  function createVault() external;

  function addCollateral(uint256 _amount) external;

  function removeCollateral(uint256 _amount) external;

  function mint(uint256 _amount) external;

  function burn(uint256 _amount) external;

  function TCAPXPrice() external view returns (uint256 price);

  function minRequiredCollateral(uint256 _amount)
    external
    view
    returns (uint256 collateral);

  function getVault(uint256 _id)
    external
    view
    returns (
      uint256,
      uint256,
      address,
      uint256
    );

  function getVaultRatio(uint256 _vaultId)
    external
    view
    returns (uint256 currentRatio);
}
