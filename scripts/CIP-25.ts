// run with
// npx hardhat run ./scripts/CIP-25.ts --network hardhat
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
  let claimContract = "0xc994129188ca4f3ecc2266a1f2ccd3980a68177c";
  let ctxAmount = ethers.utils.parseEther("50000");
  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

  const abi = new ethers.utils.AbiCoder();
  const targets = [ctx.address];
  const values = [BigNumber.from(0)];
  const signatures = ["transfer(address,uint256)"];
  const calldatas = [
    abi.encode(["address", "uint256"], [claimContract, ctxAmount]),
  ];
  const description =
    "CIP-25: CTX Retroactive Airdrop Distribution";
  console.log(targets);
  console.log(values.toString());
  console.log(signatures);
  console.log(calldatas);
  console.log(description);

  let ctxbalance = await ctxContract.balanceOf(claimContract);
  console.log("claimContract old CTX balance", ethers.utils.formatEther(ctxbalance));

  if (hardhatArguments.network === "hardhat") {
    //Fund Multisign with ETH
    await fundMultisign("10000000000000000000");

    // Create Proposal
    await createProposal(targets, values, signatures, calldatas, description);

    // Vote
    await castVote(15, true);

    // Wait to queue
    await queueProposal(15);

    // Execute transaction
    await executeProposal(15);

    // Validate Results
    console.log("==================Check Results==================");

    ctxbalance = await ctxContract.balanceOf(claimContract);
    console.log(
      "claimContract new CTX balance",
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
