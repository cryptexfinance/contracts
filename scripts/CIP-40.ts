// run with
// npx hardhat run ./scripts/CIP-40.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import {
    castVote,
    createProposal,
    executeProposal,
    fundMultisign,
    queueProposal,
} from "./utils";
import { BigNumber } from "ethers";

async function main() {
    const ethers = hre.ethers;
    let accWallet = "0x046Dd590b4c6F324fE549dBBa28a7c3B9796B3EB";
    let ctxAmount = ethers.utils.parseEther("100000");
    let ctx = await deployments.get("Ctx");
    let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

    const abi = new ethers.utils.AbiCoder();
    const targets = [ctx.address];
    const values = [BigNumber.from(0)];
    const signatures = ["transfer(address,uint256)"];
    const calldatas = [
        abi.encode(["address", "uint256"], [accWallet, ctxAmount]),
    ];
    const description =
        "CIP-40: Fund ACC Wallet";
    console.log(targets);
    console.log(values.toString());
    console.log(signatures);
    console.log(calldatas);
    console.log(description);

    let ctxbalance = await ctxContract.balanceOf(accWallet);
    console.log("team old CTX balance", ethers.utils.formatEther(ctxbalance));

    if (hardhatArguments.network === "hardhat") {
        //Fund Multisign with ETH
        await fundMultisign("10000000000000000000");

        // Create Proposal
        await createProposal(targets, values, signatures, calldatas, description);

        // Vote
        await castVote(17, true);

        // Wait to queue
        await queueProposal(17);

        // Execute transaction
        await executeProposal(17);

        // Validate Results
        console.log("==================Check Results==================");

        ctxbalance = await ctxContract.balanceOf(accWallet);
        console.log(
            "team new CTX balance",
            ethers.utils.formatEther(ctxbalance)
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
