// run with
// npx hardhat run ./scripts/CIP-29.ts --network hardhat
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
  let wintermuteAddress = "0xDbefB887662Ca19CD485381F3386fe5F8537B910";
  let wintermuteAmount = ethers.utils.parseEther("400000");
  let skynetAddress = "0x07147b70576B7295B04b954ea454b0043243Cca3";
  let skynetAmount = ethers.utils.parseEther("200000");
  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);

  const abi = new ethers.utils.AbiCoder();
  const targets = [ctx.address, ctx.address];
  const values = [BigNumber.from(0), BigNumber.from(0)];
  const signatures = ["transfer(address,uint256)", "transfer(address,uint256)"];
  const calldatas = [
    abi.encode(["address", "uint256"], [wintermuteAddress, wintermuteAmount]),
    abi.encode(["address", "uint256"], [skynetAddress, skynetAmount]),
  ];
  const description = "CIP-29: Renew Wintermute Trading/SkyNet Trading";
  console.log(targets);
  console.log(values.toString());
  console.log(signatures);
  console.log(calldatas);
  console.log(description);

  let ctxbalance = await ctxContract.balanceOf(wintermuteAddress);
  console.log(" old wintermuteAddress CTX balance", ethers.utils.formatEther(ctxbalance));

  ctxbalance = await ctxContract.balanceOf(skynetAddress);
  console.log("old skynetAddress CTX balance", ethers.utils.formatEther(ctxbalance));

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

    let ctxbalance = await ctxContract.balanceOf(wintermuteAddress);
    console.log("new wintermuteAddress CTX balance", ethers.utils.formatEther(ctxbalance));

    ctxbalance = await ctxContract.balanceOf(skynetAddress);
    console.log("new skynetAddress CTX balance", ethers.utils.formatEther(ctxbalance));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
