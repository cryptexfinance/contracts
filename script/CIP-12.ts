// run with
// npx hardhat run ./scripts/CIP-12.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";
import { BigNumber } from "ethers";

async function main() {
	const ethers = hre.ethers;

	let multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
	let ctxAmount = ethers.utils.parseEther("6000");
	let usdcAmout = ethers.utils.parseUnits("1060000", 6);
	let ethAmount = ethers.utils.parseEther("55");
	console.log(ethAmount.toString());
	let ctx = await deployments.get("Ctx");
	let ctxContract = await ethers.getContractAt("Ctx", ctx.address);
	let usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
	let usdcContract = await ethers.getContractAt("Ctx", usdc);

	const abi = new ethers.utils.AbiCoder();
	const targets = [multisig, usdc, ctx.address];
	const values = [ethAmount, BigNumber.from(0), BigNumber.from(0)];
	const signatures = ["", "transfer(address,uint256)", "transfer(address,uint256)"];
	const calldatas = [
		"0x000000000000000000000000000000000000000000000000000000000000000000000000",
		abi.encode(["address", "uint256"], [multisig, usdcAmout]),
		abi.encode(["address", "uint256"], [multisig, ctxAmount]),
	];
	const description = "CIP-12: Q1 + Q2 Brand, Marketing & Development Budget";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ethers.provider.getBalance(multisig);
	console.log("Old Balance is: ", ethers.utils.formatEther(balance));

	let ctxbalance = await ctxContract.balanceOf(multisig);
	console.log("multisig old CTX balance", ethers.utils.formatEther(ctxbalance));

	let usdcbalance = await usdcContract.balanceOf(multisig);
	console.log("multisig old USDC balance", ethers.utils.formatUnits(usdcbalance, 6));

	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(5, true);

		// Wait to queue
		await queueProposal(5);

		// Execute transaction
		await executeProposal(5);

		// Validate Results
		console.log("==================Check Results==================");

		balance = await ethers.provider.getBalance(multisig);
		console.log("New Balance is: ", ethers.utils.formatEther(balance));
		ctxbalance = await ctxContract.balanceOf(multisig);
		console.log("multisig new CTX balance", ethers.utils.formatEther(ctxbalance));

		usdcbalance = await usdcContract.balanceOf(multisig);
		console.log("multisig new USDC balance", ethers.utils.formatUnits(usdcbalance, 6));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
