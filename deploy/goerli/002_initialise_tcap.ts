import hre, { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { Contract, utils } from "ethers";
require("dotenv").config();

let abiCoder = new utils.AbiCoder();

async function makePolygonMessageCallViaFxRoot(
		_fxRoot: Contract,
		_polygonMessenger_address: string,
		_target_address: string,
		function_name: string,
		args_type: string[],
		args: any[],
) {
	let ABI = [ `function ${function_name}(${args_type.toString()})` ];
	let iface = new hre.ethers.utils.Interface(ABI);
	let _data = iface.encodeFunctionData(function_name, args);
	let _callData = abiCoder.encode(['address', 'bytes'], [_target_address, _data])
	return await _fxRoot.functions.sendMessageToChild(_polygonMessenger_address, _callData);
}

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "goerli") {
		return;
	}

	const { log } = deployments;
	const { deployer } = await getNamedAccounts();
	const timelockDeployResult = await deployments.get("Timelock");
	const polygonOrchestratorAddress = process.env.MUMBAI_ORCHESTRATOR_ADDRESS as string;
	const TCAPAddress = process.env.MUMBAI_TCAP_ADDRESS as string;
	const WMATICVaultAddress = process.env.MUMBAI_WMATIC_VAULT_ADDRESS as string;
	const WBTCVaultAddress = process.env.MUMBAI_WBTC_VAULT_ADDRESS as string;
	const DAIVaultAddress = process.env.MUMBAI_DAI_VAULT_ADDRESS as string;

	const polygonMessengerAddress = process.env.MUMBAI_MESSENGER_ADDRESS as string;
	if(polygonMessengerAddress === "") {
		log(
			"Please run this script after deploying Polygon Contracts and then set MUMBAI_MESSENGER_ADDRESS in .env"
		);
		process.exit();
	}

	const polygonMessenger = await ethershardhat.getContractAt(
		"PolygonL2Messenger",
		polygonMessengerAddress
	);

	const fxRootAddress = process.env.GOERLI_FXROOT_ADDRESS as string;
	const fxRoot = await ethershardhat.getContractAt(
		"FxRoot",
		fxRootAddress
	);

	// add WETH vault to TCAP
	let tx = await makePolygonMessageCallViaFxRoot(
		fxRoot,
		polygonMessenger.address,
		polygonOrchestratorAddress,
		"addTCAPVault",
		["address", "address"],
		[TCAPAddress, WMATICVaultAddress]
	);
	await tx.wait();

	// add WBTC vault to TCAP
	tx = await makePolygonMessageCallViaFxRoot(
		fxRoot,
		polygonMessenger.address,
		polygonOrchestratorAddress,
		"addTCAPVault",
		["address", "address"],
		[TCAPAddress, WBTCVaultAddress]
	);
	await tx.wait();

	// add DAI vault to TCAP
	tx = await makePolygonMessageCallViaFxRoot(
		fxRoot,
		polygonMessenger.address,
		polygonOrchestratorAddress,
		"addTCAPVault",
		["address", "address"],
		[TCAPAddress, DAIVaultAddress]
	);
	await tx.wait();

	// Transfer polygonOrchestrator OwnerShip to timelock
	tx = await makePolygonMessageCallViaFxRoot(
		fxRoot,
		polygonMessenger.address,
		polygonOrchestratorAddress,
		"transferOwnership",
		["address"],
		[timelockDeployResult.address]
	);
	await tx.wait();

	// Transfer polyMessenger OwnerShip to timelock
	tx = await makePolygonMessageCallViaFxRoot(
		fxRoot,
		polygonMessenger.address,
		polygonMessenger.address,
		"updateFxRootSender",
		["address"],
		[timelockDeployResult.address]
	);
	await tx.wait();
	log("Transferred onwership to DAO");
};

module.exports.tags = ["InitialiseTCAP"]
