// run with
// npx hardhat run ./scripts/CIP-35.ts --network hardhat
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
  let SSSContractAddress = "0x70236b36f86AB4bd557Fe9934E1246537B472918";

  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

  let ctxAmount = ethers.utils.parseEther("101240");

  const abi = new ethers.utils.AbiCoder();
  const targets = [ctx.address];
  const values = [BigNumber.from(0)];
  const signatures = ["transfer(address,uint256)",];
  const calldatas = [
    abi.encode(["address", "uint256"], [SSSContractAddress, ctxAmount]),
  ];
  const description = "CIP 35: 2025 Single-Sided Staking LTIP";
  console.log(targets);
  console.log(values.toString());
  console.log(signatures);
  console.log(calldatas);
  console.log(description);

  let ctxbalance = await ctxContract.balanceOf(SSSContractAddress);
  console.log(" old SSSContractAddress CTX balance", ethers.utils.formatEther(ctxbalance));

  if (hardhatArguments.network === "hardhat") {
    //Fund Multisign with ETH
    await fundMultisign("10000000000000000000");

    // Create Proposal
    await createProposal(targets, values, signatures, calldatas, description);

    // Vote
    await castVote(20, true);

    // Wait to queue
    await queueProposal(20);

    // Execute transaction
    await executeProposal(20);

    // Validate Results
    console.log("==================Check Results==================");

    let ctxbalance = await ctxContract.balanceOf(SSSContractAddress);
    console.log("new SSSContractAddress CTX balance", ethers.utils.formatEther(ctxbalance));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
