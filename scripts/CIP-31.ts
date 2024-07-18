// run with
// npx hardhat run ./scripts/CIP-30.ts --network hardhat
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
  let multisigAddress = "0xa70b638b70154edfcbb8dbbbd04900f328f32c35"

  let usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  let usdcAmount = ethers.utils.parseUnits("695000", 6);

  let ctx = await deployments.get("Ctx");
  let ctxContract = await ethers.getContractAt("Ctx", ctx.address);
  let usdcContract = await ethers.getContractAt("Ctx", usdcAddress);

  let ctxAmount = ethers.utils.parseEther("24000");

  const abi = new ethers.utils.AbiCoder();
  const targets = [usdcAddress, ctx.address];
  const values = [BigNumber.from(0), BigNumber.from(0)];
  const signatures = ["transfer(address,uint256)", "transfer(address,uint256)"];
  const calldatas = [
    abi.encode(["address", "uint256"], [multisigAddress, usdcAmount]),
    abi.encode(["address", "uint256"], [multisigAddress, ctxAmount]),
  ];
  const description = "CIP:31 2024 Operating Expenditures Treasury Transfers for Q3+Q4";
  console.log(targets);
  console.log(values.toString());
  console.log(signatures);
  console.log(calldatas);
  console.log(description);

  let ctxbalance = await ctxContract.balanceOf(multisigAddress);
  console.log(" old subDAOMultisig CTX balance", ethers.utils.formatEther(ctxbalance));

  let usdcbalance = await usdcContract.balanceOf(multisigAddress);
  console.log("old subDAOMultisig CTX balance", usdcbalance/ 10 ** 6);

  if (hardhatArguments.network === "hardhat") {
    //Fund Multisign with ETH
    await fundMultisign("10000000000000000000");

    // Create Proposal
    await createProposal(targets, values, signatures, calldatas, description);

    // Vote
    await castVote(21, true);

    // Wait to queue
    await queueProposal(21);

    // Execute transaction
    await executeProposal(21);

    // Validate Results
    console.log("==================Check Results==================");

    let ctxbalance = await ctxContract.balanceOf(multisigAddress);
    console.log("new subDAOMultisig CTX balance", ethers.utils.formatEther(ctxbalance));

    let usdcBalance = await usdcContract.balanceOf(multisigAddress);
    console.log("new subDAOMultisig usdcBalance balance", usdcBalance/ 10 ** 6);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
