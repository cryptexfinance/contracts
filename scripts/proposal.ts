// run with
// npx hardhat run ./scripts/proposal.ts --network mainnet
import hre, { deployments } from "hardhat";

async function main() {
	const ethers = hre.ethers;
	console.log("Print proposal DATA for Multisign");
	let ethVaultHandler = await deployments.get("WETHVaultHandler");
	let orchestrator = await deployments.get("Orchestrator");
	const abi = new ethers.utils.AbiCoder();
	const newRatio = 150;
	const targets = [orchestrator.address];
	const values = [0];
	const signatures = ["setRatio(address,uint256)"];
	const calldatas = [abi.encode(["address", "uint256"], [ethVaultHandler.address, newRatio])];
	const description = "Reduce ETH Vault liquidation ratio to 150%";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
