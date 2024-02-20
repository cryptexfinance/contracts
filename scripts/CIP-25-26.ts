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
  let claimContract = "0xa026Fa5DF25185101e99F2731F8138262Af9F656";
  let sssContract = "0x70236b36f86AB4bd557Fe9934E1246537B472918";
  let ctxAmount = ethers.utils.parseEther("50000");
  let sssAmount = ethers.utils.parseEther("70000");
  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

  const abi = new ethers.utils.AbiCoder();
  const targets = [ctx.address, ctx.address];
  const values = [BigNumber.from(0), BigNumber.from(0)];
  const signatures = [
  	"transfer(address,uint256)",
  	"transfer(address,uint256)"
  ];
  const calldatas = [
    abi.encode(["address", "uint256"], [claimContract, ctxAmount]),
    abi.encode(["address", "uint256"], [sssContract, sssAmount])
  ];
  const description =
    "CIP-25-26: SSS & CTX Retroactive Airdrop Distribution";
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
