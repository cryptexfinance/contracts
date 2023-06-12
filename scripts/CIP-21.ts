// run with
// npx hardhat run ./scripts/CIP-21.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";
import { BigNumber } from "ethers";

async function main() {
	const ethers = hre.ethers;

	let multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
    let skyNetAccount ="0xC8D26A776a8171225542a298b559622B7bad3A0A";
	let ctxAmountMarketMaker = ethers.utils.parseEther("375000");
    let ctxAmountCamelot = ethers.utils.parseEther("45000");
	let ctx = await deployments.get("Ctx");
	let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

	const abi = new ethers.utils.AbiCoder();
	const targets = [ctx.address,ctx.address];
	const values = [BigNumber.from(0),BigNumber.from(0)];
	const signatures = ["transfer(address,uint256)","transfer(address,uint256)"];
	const calldatas = [
		abi.encode(["address", "uint256"], [skyNetAccount, ctxAmountMarketMaker]),
        abi.encode(["address", "uint256"], [multisig, ctxAmountCamelot])
	];
	const description = "CIP 21: Liquidity Provisioning and Camelot DEX Integration";
	console.log(targets);
	console.log(values.toString());
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let ctxbalance = await ctxContract.balanceOf(multisig);
	console.log("multisig old CTX balance", ethers.utils.formatEther(ctxbalance));
    let ctxbalanceSkyNet = await ctxContract.balanceOf(skyNetAccount);
	console.log("skyNet old CTX balance", ethers.utils.formatEther(ctxbalanceSkyNet));

	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(12, true);

		// Wait to queue
		await queueProposal(12);

		// Execute transaction
		await executeProposal(12);

		// Validate Results
		console.log("==================Check Results==================");

		ctxbalance = await ctxContract.balanceOf(multisig);
		console.log("multisig new CTX balance", ethers.utils.formatEther(ctxbalance));
        ctxbalanceSkyNet = await ctxContract.balanceOf(skyNetAccount);
		console.log("skyNet new CTX balance", ethers.utils.formatEther(ctxbalanceSkyNet));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
