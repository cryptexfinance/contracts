// run with
// npx hardhat run ./scripts/CIP-TOWER.ts --network hardhat
import hre, {deployments, network, hardhatArguments} from "hardhat";
import {castVote, createProposal, executeProposal, fundMultisign, queueProposal} from "./utils";
import {BigNumber} from "ethers";

async function main() {
	const ethers = hre.ethers;

	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
	let tcap = await deployments.get("TCAP");
	//TODO: waiting for real deployment
	let tcapContract = await ethers.getContractAt("TCAP", tcap.address);
	let usdcHardVault = await deployments.get("AaveVaultHandler");
	let daiHardVault = await deployments.get("LinkVaultHandler");
	let ethHardkVault = await deployments.get("LinkVaultHandler");
	let wbtcHardVault = await deployments.get("LinkVaultHandler");

	const abi = new ethers.utils.AbiCoder();
	const targets = [orchestratorAddress, orchestratorAddress, orchestratorAddress, orchestratorAddress];
	const values = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)];
	const signatures = ["addTCAPVault(address,address)", "addTCAPVault(address,address)", "addTCAPVault(address, address)", "addTCAPVault(address, address)"];
	const calldatas = [
		abi.encode(["address", "address"], [tcap.address, usdcHardVault.address]),
		abi.encode(["address", "address"], [tcap.address, daiHardVault.address]),
		abi.encode(["address", "address"], [tcap.address, ethHardkVault.address]),
		abi.encode(["address", "address"], [tcap.address, wbtcHardVault.address]),
	];
	const description = "CIP-TOWER: Add Tower vaults";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let usdcStatus = await tcapContract.vaultHandlers(usdcHardVault.address);
	console.log(usdcStatus);

	let ethStatus = await tcapContract.vaultHandlers(ethHardkVault.address);
	console.log(ethStatus);

	let daiStatus = await tcapContract.vaultHandlers(daiHardVault.address);
	console.log(daiStatus);

	let wbtcStatus = await tcapContract.vaultHandlers(wbtcHardVault.address);
	console.log(wbtcStatus);


	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(4, true);

		// Wait to queue
		await queueProposal(4);

		// Execute transaction
		await executeProposal(4);

		// Validate Results
		console.log("==================Check Results==================");

		usdcStatus = await tcapContract.vaultHandlers(usdcHardVault.address);
		console.log(usdcStatus);

		ethStatus = await tcapContract.vaultHandlers(ethHardkVault.address);
		console.log(ethStatus);

		daiStatus = await tcapContract.vaultHandlers(daiHardVault.address);
		console.log(daiStatus);

		wbtcStatus = await tcapContract.vaultHandlers(wbtcHardVault.address);
		console.log(wbtcStatus);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
