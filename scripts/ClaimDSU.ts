// run with
// npx hardhat run ./scripts/ClaimDSU.ts --network hardhat
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
    let multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
    const amount = BigNumber.from("11234761");
    const perennialProxy = "0x0d49c416103Cbd276d9c3cd96710dB264e3A0c27";
    const tokenAddress = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
    const abi = new ethers.utils.AbiCoder();
    const targets = [tokenAddress];
    const values = [BigNumber.from(0)];
    const signatures = ["transfer(address,uint256)"];
    const calldatas = [
        abi.encode(["address", "uint256"], ["0x2ba97337F33f5bC059AAbd1446806b16F561C48D", amount]),
    ];
    const description =
        "CIP-43: 2026 Operating Expenditures Authorization";
    console.log(targets);
    console.log(values.toString());
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
