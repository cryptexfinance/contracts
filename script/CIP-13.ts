// run with
// npx hardhat run ./scripts/CIP-13.ts --network hardhat
import hre, {deployments, network, hardhatArguments} from "hardhat";
import {castVote, createProposal, executeProposal, fundMultisign, queueProposal} from "./utils";
import {BigNumber} from "ethers";

async function main() {
	const ethers = hre.ethers;

	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
	let tcap = await deployments.get("TCAP");

	let tcapContract = await ethers.getContractAt("TCAP", tcap.address);
	let usdcHardVault = "0xa8CcA36A624215a39D5af6854ac24868559424d3";
	let daiHardVault = "0xA5b3Bb6e1f206624B3B8CE0c6A0f7614fd35Fa03";
	let ethHardVault = "0xc2Ba6B8E0EE3cf48B045D966F1dCda767df74833";
	let wbtcHardVault = "0x2364536F4891Ed560A6728f4B36871de8176eE5c";

	const abi = new ethers.utils.AbiCoder();
	const targets = [orchestratorAddress, orchestratorAddress, orchestratorAddress, orchestratorAddress];
	const values = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)];
	const signatures = ["addTCAPVault(address,address)", "addTCAPVault(address,address)", "addTCAPVault(address,address)", "addTCAPVault(address,address)"];
	const calldatas = [
		abi.encode(["address", "address"], [tcap.address, usdcHardVault]),
		abi.encode(["address", "address"], [tcap.address, daiHardVault]),
		abi.encode(["address", "address"], [tcap.address, ethHardVault]),
		abi.encode(["address", "address"], [tcap.address, wbtcHardVault]),
	];
	const description = "CIP-13: Add hard mode vaults to TCAP";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let usdcStatus = await tcapContract.vaultHandlers(usdcHardVault);
	console.log(usdcStatus);

	let ethStatus = await tcapContract.vaultHandlers(ethHardVault);
	console.log(ethStatus);

	let daiStatus = await tcapContract.vaultHandlers(daiHardVault);
	console.log(daiStatus);

	let wbtcStatus = await tcapContract.vaultHandlers(wbtcHardVault);
	console.log(wbtcStatus);


	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(6, true);

		// Wait to queue
		await queueProposal(6);

		// Execute transaction
		await executeProposal(6);

		// Validate Results
		console.log("==================Check Results==================");

		usdcStatus = await tcapContract.vaultHandlers(usdcHardVault);
		console.log(usdcStatus);

		ethStatus = await tcapContract.vaultHandlers(ethHardVault);
		console.log(ethStatus);

		daiStatus = await tcapContract.vaultHandlers(daiHardVault);
		console.log(daiStatus);

		wbtcStatus = await tcapContract.vaultHandlers(wbtcHardVault);
		console.log(wbtcStatus);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
