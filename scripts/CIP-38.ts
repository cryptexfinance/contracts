// run with
// npx hardhat run ./scripts/CIP-38.ts --network hardhat
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
    let davinciWallet = "0x55981Be98EEaF4E57aC466BE72C6323F2Cc659Aa";
    let ctxAmount = ethers.utils.parseEther("300000");
    let ctx = await deployments.get("Ctx");
    let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

    const abi = new ethers.utils.AbiCoder();
    const targets = [ctx.address];
    const values = [BigNumber.from(0)];
    const signatures = ["transfer(address,uint256)"];
    const calldatas = [
        abi.encode(["address", "uint256"], [davinciWallet, ctxAmount]),
    ];
    const description =
        "CIP-38: Renew Market Making Agreement with DaVinci Trading";
    console.log(targets);
    console.log(values.toString());
    console.log(signatures);
    console.log(calldatas);
    console.log(description);

    let ctxbalance = await ctxContract.balanceOf(davinciWallet);
    console.log("davinci old CTX balance", ethers.utils.formatEther(ctxbalance));

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

        ctxbalance = await ctxContract.balanceOf(davinciWallet);
        console.log(
            "davinci new CTX balance",
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
