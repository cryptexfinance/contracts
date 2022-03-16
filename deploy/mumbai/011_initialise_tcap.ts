import hre, { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { Contract, utils } from "ethers";
require("dotenv").config();

let abiCoder = new utils.AbiCoder();

async function makePolygonMessageCall(
		_polygonMessenger: Contract,
		_target_address: string,
		deployer_address: string,
		function_name: string,
		args_type: string[],
		args: any[],
) {
	let ABI = [ `function ${function_name}(${args_type.toString()})` ];
	let iface = new hre.ethers.utils.Interface(ABI);
	let _data = iface.encodeFunctionData(function_name, args);
	let _callData = abiCoder.encode(['address', 'bytes'], [_target_address, _data]);
	return await _polygonMessenger.functions.processMessageFromRoot(1, deployer_address, _callData);
}

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mumbai") {
		return;
	}
	let DAIHandler = await deployments.get("DAIVaultHandler");
	let WMATICHandler = await deployments.get("MATICVaultHandler");
	let OrchestratorDeployment = await deployments.get("PolygonOrchestrator");
	let tcap = await deployments.get("TCAP");
	const { deployer } = await getNamedAccounts();

	const deploymentPolygonMessengerDeployment = await deployments.get("deploymentPolygonMessenger");
	const deploymentPolygonMessenger = await ethershardhat.getContractAt(
		"PolygonL2Messenger",
		deploymentPolygonMessengerDeployment.address
	);
	const polygonMessengerDeployment = await deployments.get("PolygonL2Messenger");

	let tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"addTCAPVault",
		["address", "address"],
		[tcap.address, WMATICHandler.address]
	);
	await tx.wait();

	tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"addTCAPVault",
		["address", "address"],
		[tcap.address, DAIHandler.address]
	);
	await tx.wait();

	let tcapContract = await ethershardhat.getContractAt("TCAP", tcap.address);
	console.log("DAI Vault", await tcapContract.vaultHandlers(DAIHandler.address));
	console.log("WETHHandler Vault", await tcapContract.vaultHandlers(WMATICHandler.address));
	tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"updatePolygonMessenger",
		["address"],
		[polygonMessengerDeployment.address]
	);
	await tx.wait();

};
module.exports.tags = ["Initialize"];
module.exports.dependencies = ['DAIVaultHandler', 'WMATICVaultHandler'];
