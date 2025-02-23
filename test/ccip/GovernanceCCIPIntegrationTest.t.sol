// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {CCIPLocalSimulatorFork, Register} from "@chainlink/local/src/ccip/CCIPLocalSimulatorFork.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {GovernanceCCIPRelay, IGovernanceCCIPRelay} from "contracts/ccip/GovernanceCCIPRelay.sol";
import {GovernanceCCIPReceiver, IGovernanceCCIPReceiver} from "contracts/ccip/GovernanceCCIPReceiver.sol";
import {NumberUpdater} from "contracts/mocks/NumberUpdater.sol";

interface IGovernorBeta {
  enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Expired,
    Executed
  }

  function votingDelay() external pure returns (uint256);

  function votingPeriod() external pure returns (uint256);

  function state(uint256 proposalId) external view returns (ProposalState);

  function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
  ) external returns (uint256);

  function queue(uint256 proposalId) external;

  function execute(uint256 proposalId) external payable;

  function castVote(uint256 proposalId, bool support) external;

  function latestProposalIds(address) external returns (uint256);
}

interface ITimelock {
  function delay() external returns (uint256);

  function queueTransaction(
    address target,
    uint256 value,
    string memory signature,
    bytes memory data,
    uint256 eta
  ) external returns (bytes32);

  function executeTransaction(
    address target,
    uint256 value,
    string memory signature,
    bytes memory data,
    uint256 eta
  ) external payable returns (bytes memory);

  function admin() external returns (address);

  function acceptAdmin() external;
}

interface ICtx {
  function delegate(address delegatee) external;
}

interface IPriceRegistry {
  error StaleGasPrice(
    uint64 destChainSelector,
    uint256 threshold,
    uint256 timePassed
  );
  error StaleTokenPrice(address token, uint256 threshold, uint256 timePassed);

  function getTokenAndGasPrices(address token, uint64 destChainSelector)
    external
    returns (uint224, uint224);

  function convertTokenAmount(
    address fromToken,
    uint256 fromTokenAmount,
    address toToken
  ) external returns (uint256);
}

contract GovernanceCCIPIntegrationTest is Test {
  CCIPLocalSimulatorFork public ccipLocalSimulatorFork;
  uint256 public ethereumMainnetForkId;
  uint256 public polygonMainnetForkId;

  // Addresses
  uint64 public ethereumMainnetChainSelector = 5009297550715157269;
  address public ethereumMainnetCcipRouterAddress =
    0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D;
  uint64 public polygonMainnetChainSelector = 4051577828743386545;
  address public polygonMainnetCcipRouterAddress =
    0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe;
  IPriceRegistry priceRegistry =
    IPriceRegistry(0x8c9b2Efb7c64C394119270bfecE7f54763b958Ad);

  // Contracts
  GovernanceCCIPRelay public governanceRelay;
  GovernanceCCIPReceiver public governanceReceiver;
  NumberUpdater public numberUpdater;
  ICtx ctx;
  IGovernorBeta public governorBeta;
  ITimelock public timelock;

  address public user = address(0x51);
  address linkTokenMainnet = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
  address wethTokenMainet = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  function setUp() public {
    // Create forks of both networks
    string memory ETHEREUM_MAINNET_RPC_URL = vm.envString(
      "ETHEREUM_MAINNET_RPC_URL"
    );
    string memory POLYGON_MAINNET_RPC_URL = vm.envString(
      "POLYGON_MAINNET_RPC_URL"
    );
    ethereumMainnetForkId = vm.createFork(ETHEREUM_MAINNET_RPC_URL);
    polygonMainnetForkId = vm.createFork(POLYGON_MAINNET_RPC_URL);

    // Initialize CCIP Local Simulator
    ccipLocalSimulatorFork = new CCIPLocalSimulatorFork();
    vm.makePersistent(address(ccipLocalSimulatorFork));
    ccipLocalSimulatorFork.setNetworkDetails(
      137,
      Register.NetworkDetails({
        chainSelector: polygonMainnetChainSelector,
        routerAddress: polygonMainnetCcipRouterAddress,
        linkAddress: address(0), // not needed for this test
        wrappedNativeAddress: address(0), // not needed for this test
        ccipBnMAddress: address(0), // not needed for this test
        ccipLnMAddress: address(0), // not needed for this test
        rmnProxyAddress: address(0), // not needed for this test
        registryModuleOwnerCustomAddress: address(0), // not needed for this test
        tokenAdminRegistryAddress: address(0) // not needed for this test
      })
    );
    vm.selectFork(ethereumMainnetForkId);
    address governanceRelayAddress = computeCreateAddress(
      address(this),
      vm.getNonce(address(this)) + 2
    );

    // Deploy NumberUpdater on Polygon
    vm.selectFork(polygonMainnetForkId);
    numberUpdater = new NumberUpdater(0); // Initialize with number = 0
    vm.makePersistent(address(numberUpdater));

    // Deploy GovernanceReceiver on Polygon
    governanceReceiver = new GovernanceCCIPReceiver(
      polygonMainnetCcipRouterAddress, // Router address
      governanceRelayAddress
    );
    vm.makePersistent(address(governanceReceiver));

    // Deploy GovernanceRelay on Ethereum
    vm.selectFork(ethereumMainnetForkId);
    address timelockComputedAddress = computeCreateAddress(
      address(user),
      vm.getNonce(user) + 1
    );
    governanceRelay = new GovernanceCCIPRelay(
      timelockComputedAddress,
      ethereumMainnetCcipRouterAddress,
      polygonMainnetChainSelector,
      address(governanceReceiver)
    );
    vm.startPrank(user);
    address ctxAddress = deployCode(
      "Ctx.sol",
      abi.encode(user, user, block.timestamp)
    );
    ctx = ICtx(ctxAddress);
    address GovernorBetaComputedAddress = computeCreateAddress(
      address(user),
      vm.getNonce(user) + 1
    );
    address timeLockAddress = deployCode(
      "Timelock.sol",
      abi.encode(GovernorBetaComputedAddress, 2 days)
    );
    timelock = ITimelock(timeLockAddress);
    address governorBetaAddress = deployCode(
      "GovernorBeta.sol:GovernorBeta",
      abi.encode(address(timelock), ctx, user)
    );
    governorBeta = IGovernorBeta(governorBetaAddress);
    ctx.delegate(user);
    vm.stopPrank();
    vm.deal(timeLockAddress, 10 ether);
    vm.makePersistent(address(governanceRelay));
    vm.makePersistent(ctxAddress);
    vm.makePersistent(timeLockAddress);
    vm.makePersistent(governorBetaAddress);
  }

  function testCrossChainMessageRelayUpdateNumber() external {
    // Set up the source chain (Ethereum)
    vm.selectFork(ethereumMainnetForkId);

    // Prepare the message to update the number in NumberUpdater
    address target = address(numberUpdater); // Target address on Polygon
    bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42); // Update number to 42

    // Mock the CCIP router's getFee function
    uint256 fee = 1 ether;
    vm.mockCall(
      ethereumMainnetCcipRouterAddress,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    // Send the message via GovernanceRelay
    vm.deal(address(timelock), fee); // Fund the contract with enough Ether
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPRelay.MessageRelayed(target, payload);
    vm.prank(address(timelock));
    governanceRelay.relayMessage{value: fee}(target, payload);

    // Route the message to Polygon
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPReceiver.MessageExecuted(target, payload);
    ccipLocalSimulatorFork.switchChainAndRouteMessage(polygonMainnetForkId);

    // Verify the message was received and executed on Polygon
    vm.selectFork(polygonMainnetForkId);

    // Check that the number was updated in NumberUpdater
    assertEq(numberUpdater.number(), 42, "Number was not updated correctly");
  }

  function testTreasuryControl() external {
    address testAddress = address(0x51);
    vm.selectFork(polygonMainnetForkId);
    address cryptexBaseTreasury = deployCode(
      "CryptexBaseTreasury.sol",
      abi.encode(address(governanceReceiver))
    );
    vm.deal(cryptexBaseTreasury, 10 ether);
    vm.makePersistent(cryptexBaseTreasury);
    assertEq(cryptexBaseTreasury.balance, 10 ether);
    assertEq(testAddress.balance, 0);

    vm.selectFork(ethereumMainnetForkId);
    address target = cryptexBaseTreasury;
    bytes memory payload = abi.encodeWithSignature(
      "retrieveETH(address)",
      testAddress
    );

    // Mock the CCIP router's getFee function
    uint256 fee = 1 ether;
    vm.mockCall(
      ethereumMainnetCcipRouterAddress,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );
    vm.deal(address(timelock), fee);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPRelay.MessageRelayed(target, payload);
    vm.prank(address(timelock));
    governanceRelay.relayMessage{value: fee}(target, payload);

    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPReceiver.MessageExecuted(target, payload);
    ccipLocalSimulatorFork.switchChainAndRouteMessage(polygonMainnetForkId);

    vm.selectFork(polygonMainnetForkId);
    assertEq(cryptexBaseTreasury.balance, 0);
    assertEq(testAddress.balance, 10 ether);
  }

  function testGovernanceProposalUpdatesNumber() public {
    vm.selectFork(ethereumMainnetForkId);

    // Prepare governance proposal
    address target = address(numberUpdater);
    bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42);

    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);

    targets[0] = address(governanceRelay);
    values[0] = 1 ether;
    signatures[0] = "relayMessage(address,bytes)";
    calldatas[0] = abi.encode(target, payload);
    assertEq(numberUpdater.number(), 0, "Initial number should be 0");

    uint256 fee = 0.1 ether;
    vm.mockCall(
      ethereumMainnetCcipRouterAddress,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );
    (uint224 tokenPrice, uint224 gasPriceValue) = priceRegistry
      .getTokenAndGasPrices(
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
        4051577828743386545
      );
    // mock this call with the actual price, otherwise this call will fail with StaleGasPrice
    vm.mockCall(
      address(priceRegistry),
      abi.encodeWithSelector(IPriceRegistry.getTokenAndGasPrices.selector),
      abi.encode(tokenPrice, gasPriceValue)
    );
    uint256 _convertTokenAmount = priceRegistry.convertTokenAmount(
      wethTokenMainet,
      fee,
      linkTokenMainnet
    );
    // mock this call with the actual price, otherwise this call will fail with StaleTokenPrice
    vm.mockCall(
      address(priceRegistry),
      abi.encodeWithSelector(IPriceRegistry.convertTokenAmount.selector),
      abi.encode(_convertTokenAmount)
    );

    // Create and execute governance proposal
    createAndExecuteGovernanceProposal(targets, values, signatures, calldatas);

    // Route the message to Polygon via CCIP
    ccipLocalSimulatorFork.switchChainAndRouteMessage(polygonMainnetForkId);

    // Verify the number was updated
    vm.selectFork(polygonMainnetForkId);
    assertEq(numberUpdater.number(), 42, "Number was not updated correctly");
  }

  function createAndExecuteGovernanceProposal(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas
  ) internal {
    vm.startPrank(user);
    vm.roll(block.number + 100);
    governorBeta.propose(targets, values, signatures, calldatas, "");
    uint256 proposalID = governorBeta.latestProposalIds(user);
    vm.roll(block.number + governorBeta.votingDelay() + 1);
    governorBeta.castVote(proposalID, true);
    vm.roll(block.number + governorBeta.votingPeriod() + 1);
    governorBeta.queue(proposalID);
    vm.warp(block.timestamp + timelock.delay() + 1 days);
    governorBeta.execute(proposalID);
    assertEq(
      uint256(governorBeta.state(proposalID)),
      uint256(IGovernorBeta.ProposalState.Executed)
    );
    vm.stopPrank();
  }
}
