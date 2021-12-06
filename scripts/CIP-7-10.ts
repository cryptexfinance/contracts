// run with
// npx hardhat run ./scripts/CIP-7-10.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";

async function main() {
	const ethers = hre.ethers;

	const amount = ethers.utils.parseEther("8100");
	const multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
	let ctx = await deployments.get("Ctx");
	let ctxContract = await ethers.getContractAt("Ctx", ctx.address);
	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
	let tcap = await deployments.get("TCAP");
	let tcapContract = await ethers.getContractAt("TCAP", tcap.address);
	let aaveVault = await deployments.get("AaveVaultHandler");
	let linkVault = await deployments.get("LinkVaultHandler");

	const abi = new ethers.utils.AbiCoder();
	const targets = [ctx.address, orchestratorAddress, orchestratorAddress];
	const values = [0, 0, 0];
	const signatures = [
		"transfer(address,uint256)",
		"addTCAPVault(address,address)",
		"addTCAPVault(address,address)",
	];
	const calldatas = [
		abi.encode(["address", "uint256"], [multisig, amount]),
		abi.encode(["address", "address"], [tcap.address, aaveVault.address]),
		abi.encode(["address", "address"], [tcap.address, linkVault.address]),
	];
	const description =
		"CIP-7: Airdrop early TCAP Testers, CIP-10 Cryptex Community Grants Program Q4 & CIP-11 Add AAVE and LINK Vaults";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ctxContract.balanceOf(multisig);
	console.log("multisig old CTX balance", ethers.utils.formatEther(balance));

	let aaveStatus = await tcapContract.vaultHandlers(aaveVault.address);
	console.log(aaveStatus);
	let linkStatus = await tcapContract.vaultHandlers(linkVault.address);
	console.log(linkStatus);

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
		balance = await ctxContract.balanceOf(multisig);
		console.log("Multisig new CTX balance", ethers.utils.formatEther(balance));

		aaveStatus = await tcapContract.vaultHandlers(aaveVault.address);
		console.log(aaveStatus);
		linkStatus = await tcapContract.vaultHandlers(linkVault.address);
		console.log(linkStatus);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
