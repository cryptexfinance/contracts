// run with
// npx hardhat run ./scripts/CIP-37.ts --network hardhat
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
  let ctxAmount = ethers.utils.parseEther("120000");
  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

  const abi = new ethers.utils.AbiCoder();
  const targets = [ctx.address];
  const values = [BigNumber.from(0)];
  const signatures = ["transfer(address,uint256)"];
  const calldatas = [
    abi.encode(["address", "uint256"], [multisig, ctxAmount]),
  ];
  const description =
    "CIP-37: Supplemental Treasury Transfer to Sustain Q2 2025 Operations";
  console.log(targets);
  console.log(values.toString());
  console.log(signatures);
  console.log(calldatas);
  console.log(description);

  let ctxbalance = await ctxContract.balanceOf(multisig);
  console.log("multisig old CTX balance", ethers.utils.formatEther(ctxbalance));

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

    ctxbalance = await ctxContract.balanceOf(multisig);
    console.log(
      "multisig new CTX balance",
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
