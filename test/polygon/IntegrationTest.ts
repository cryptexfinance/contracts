import { expect } from "chai";
import { Contract, constants, utils } from "ethers";
import hre, { waffle } from "hardhat";

import { governanceFixture } from "../governance/fixtures";
import { DELAY } from "../governance/utils";
import { deployContract } from "../utils";

const [wallet, acc1, acc2, acc3, acc4] = waffle.provider.getWallets();
const loadFixture = waffle.createFixtureLoader([wallet], waffle.provider);

let ctx: Contract;
let timelock: Contract;
let governorBeta: Contract;
let targets: string[];
let values: number[];
let signatures: string[];
let callDatas: string[];
let deploymentPolygonMessenger: Contract;
let polygonMessenger: Contract;
let polygonOrchestrator: Contract;
let fxChild: Contract;
let fxRoot: Contract;
let stateSender: Contract;
let aggregatorInterfaceTCAP: Contract;
let tCAP: Contract;
let polygonTreasury: Contract;
let tCAPOracle: Contract;
let wMATIC: Contract;
let wMATICOracle: Contract;
let wMATICVaultHandler: Contract;
let abiCoder = new utils.AbiCoder();

enum ProposalState {
	Pending,
	Active,
	Canceled,
	Defeated,
	Succeeded,
	Queued,
	Expired,
	Executed,
}

async function makePolygonMessageCall(
	_polygonMessenger: Contract,
	_target_address: string,
	function_name: string,
	args_type: string[],
	args: any[]
) {
	let ABI = [`function ${function_name}(${args_type.toString()})`];
	let iface = new hre.ethers.utils.Interface(ABI);
	let _data = iface.encodeFunctionData(function_name, args);
	let _callData = abiCoder.encode(["address", "bytes"], [_target_address, _data]);
	await _polygonMessenger.functions.processMessageFromRoot(1, wallet.address, _callData);
}

async function makePolygonMessageCallViaFxRoot(
	_polygonMessenger: Contract,
	_target_address: string,
	function_name: string,
	args_type: string[],
	args: any[]
) {
	let ABI = [`function ${function_name}(${args_type.toString()})`];
	let iface = new hre.ethers.utils.Interface(ABI);
	let _data = iface.encodeFunctionData(function_name, args);
	let _callData = abiCoder.encode(["address", "bytes"], [_target_address, _data]);
	await fxRoot.functions.sendMessageToChild(_polygonMessenger.address, _callData);
}

async function transferOwnershipToDAO() {
	// Change polygonMessenger
	// This call will be made from polygon mainnet or mumbai
	await makePolygonMessageCall(
		deploymentPolygonMessenger,
		polygonOrchestrator.address,
		"updatePolygonMessenger",
		["address"],
		[polygonMessenger.address]
	);
	// Transfer Orchestrator OwnerShip
	// This call will be made from ethereum mainet or goerli
	await makePolygonMessageCallViaFxRoot(
		polygonMessenger,
		polygonOrchestrator.address,
		"transferOwnership",
		["address"],
		[timelock.address]
	);
	// Transfer polyMessenger OwnerShip to timelock
	// This call will be made from ethereum mainet or goerli
	await makePolygonMessageCallViaFxRoot(
		polygonMessenger,
		polygonMessenger.address,
		"updateFxRootSender",
		["address"],
		[timelock.address]
	);
}

async function executeProposal(
	targets: string[],
	values: number[],
	signatures: string[],
	callDatas: string[]
) {
	await governorBeta.functions.propose(targets, values, signatures, callDatas, "");
	const proposalID = await governorBeta.functions.latestProposalIds(wallet.address);
	let [status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.equal(ProposalState.Pending);

	// 		Mine block to surpass votingDelay
	await hre.network.provider.send("evm_mine");
	[status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.be.eq(ProposalState.Pending);

	await ctx.functions.transfer(acc1.address, "100000000000000000000000");
	await ctx.connect(acc1).delegate(acc1.address);
	await hre.network.provider.send("evm_mine");

	// 		Mine block to surpass votingDelay
	await governorBeta.functions.castVote(proposalID.toString(), true);
	for (let i = 0; i < 20000; i++) {
		await hre.network.provider.send("evm_mine");
	}
	[status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.be.eq(ProposalState.Succeeded);

	// 		Queue
	await governorBeta.functions.queue(proposalID.toString());
	[status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.be.eq(ProposalState.Queued);

	let trivialProposal = await governorBeta.functions.proposals(proposalID.toString());

	//  forward time to surpass proposal ETA
	await hre.network.provider.request({
		method: "evm_setNextBlockTimestamp",
		params: [trivialProposal.eta.toNumber()],
	});
	[status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.be.eq(ProposalState.Queued);

	// 	Execute proposal
	await governorBeta.functions.execute(proposalID.toString());
	[status] = await governorBeta.functions.state(proposalID.toString());
	expect(status).to.be.eq(ProposalState.Executed);
}

describe("Polygon Integration Test", async function () {
	beforeEach(async () => {
		const fixture = await loadFixture(governanceFixture);
		ctx = fixture.ctx;
		timelock = fixture.timelock;
		governorBeta = fixture.governorBeta;
		await ctx.functions.delegate(wallet.address);
		stateSender = await deployContract("StateSender", wallet, []);
		fxRoot = await deployContract("FxRoot", wallet, [stateSender.address]);
		fxChild = await deployContract("MockFxChild", wallet, []);
		await fxRoot.setFxChild(fxChild.address);
		await stateSender.register(fxRoot.address, fxChild.address);

		let nonce = await wallet.getTransactionCount();
		const polygonOrchestratorAddress = hre.ethers.utils.getContractAddress({
			from: wallet.address,
			nonce: nonce + 2,
		});
		const polygonTreasuryAddress = hre.ethers.utils.getContractAddress({
			from: wallet.address,
			nonce: nonce + 3,
		});
		// Messenger used to setup vaults
		deploymentPolygonMessenger = await deployContract("PolygonL2Messenger", wallet, [
			wallet.address,
			wallet.address,
		]);

		polygonMessenger = await deployContract(
			"PolygonL2Messenger",
			wallet,
			// set FxRootSender to deployer. This will be changed later
			[wallet.address, fxChild.address]
		);

		polygonOrchestrator = await deployContract("PolygonOrchestrator", wallet, [
			wallet.address,
			wallet.address, // For deployment only. Should be set to timelock post deployment
			deploymentPolygonMessenger.address, // For deployment only. Should be set to correct polygonMessenger post deployment
		]);

		polygonTreasury = await deployContract("PolygonTreasury", wallet, [
			timelock.address,
			polygonMessenger.address,
		]);
		aggregatorInterfaceTCAP = await deployContract("AggregatorInterfaceTCAP", wallet, []);
		tCAP = await deployContract("TCAP", wallet, [
			"TCAP Token",
			"TCAP",
			0,
			polygonOrchestrator.address,
		]);
		tCAPOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceTCAP.address,
			timelock.address,
		]);
		wMATIC = await deployContract("WMATIC", wallet, []);
		wMATICOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceTCAP.address,
			timelock.address,
		]);

		wMATICVaultHandler = await deployContract("MATICVaultHandler", wallet, [
			polygonOrchestrator.address,
			"10000000000",
			"200",
			"1",
			"10",
			tCAPOracle.address,
			tCAP.address,
			wMATIC.address,
			wMATICOracle.address,
			wMATICOracle.address,
			polygonTreasury.address,
		]);
	});

	it("...Add new vault without Governance", async () => {
		expect(await tCAP.vaultHandlers(wMATICVaultHandler.address)).to.be.false;
		let ABI = ["function addTCAPVault(address,address)"];
		let iface = new hre.ethers.utils.Interface(ABI);
		const _data = iface.encodeFunctionData("addTCAPVault", [
			tCAP.address,
			wMATICVaultHandler.address,
		]);
		const _callData = abiCoder.encode(["address", "bytes"], [polygonOrchestrator.address, _data]);
		await deploymentPolygonMessenger.functions.processMessageFromRoot(1, wallet.address, _callData);
		expect(await tCAP.vaultHandlers(wMATICVaultHandler.address)).to.be.true;
	});

	it("...Transfer OwnerShip to DAO post setup", async () => {
		const [oldPolygonMessenger] = await polygonOrchestrator.functions.polygonMessenger();
		expect(oldPolygonMessenger).to.be.eq(deploymentPolygonMessenger.address);
		// Change polygonMessenger
		// This call will be made from polygon mainnet or mumbai
		await makePolygonMessageCall(
			deploymentPolygonMessenger,
			polygonOrchestrator.address,
			"updatePolygonMessenger",
			["address"],
			[polygonMessenger.address]
		);
		const [newPolygonMessenger] = await polygonOrchestrator.functions.polygonMessenger();
		expect(newPolygonMessenger).to.be.eq(polygonMessenger.address);

		const [oldOrchestratorOwner] = await polygonOrchestrator.functions.owner();
		expect(oldOrchestratorOwner).to.be.eq(wallet.address);
		// Transfer Orchestrator OwnerShip
		// This call will be made from ethereum mainet or goerli
		await makePolygonMessageCallViaFxRoot(
			polygonMessenger,
			polygonOrchestrator.address,
			"transferOwnership",
			["address"],
			[timelock.address]
		);
		const [newOrchestratorOwner] = await polygonOrchestrator.functions.owner();
		expect(newOrchestratorOwner).to.be.eq(timelock.address);

		const [oldFxRootSender] = await polygonMessenger.functions.fxRootSender();
		expect(oldFxRootSender).to.be.eq(wallet.address);
		// Transfer polyMessenger OwnerShip to timelock
		// This call will be made from ethereum mainet or goerli
		await makePolygonMessageCallViaFxRoot(
			polygonMessenger,
			polygonMessenger.address,
			"updateFxRootSender",
			["address"],
			[timelock.address]
		);
		const [newFxRootSender] = await polygonMessenger.functions.fxRootSender();
		expect(newFxRootSender).to.be.eq(timelock.address);
	});

	it("...Add new vault through Governance", async () => {
		await transferOwnershipToDAO();

		expect(await tCAP.vaultHandlers(wMATICVaultHandler.address)).to.be.false;

		let ABI = ["function addTCAPVault(address,address)"];
		let iface = new hre.ethers.utils.Interface(ABI);
		let _data = iface.encodeFunctionData("addTCAPVault", [
			tCAP.address,
			wMATICVaultHandler.address,
		]);
		let _callData = abiCoder.encode(["address", "bytes"], [polygonOrchestrator.address, _data]);

		targets = [fxRoot.address];
		values = [0];
		signatures = ["sendMessageToChild(address,bytes)"];
		callDatas = [abiCoder.encode(["address", "bytes"], [polygonMessenger.address, _callData])];

		await executeProposal(targets, values, signatures, callDatas);
		expect(await tCAP.vaultHandlers(wMATICVaultHandler.address)).to.be.true;
	});
});
