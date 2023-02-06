import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
  if (hardhatArguments.network === "arbitrum") {
    const { deployIfDifferent, log } = deployments;
    const { deployer } = await getNamedAccounts();

    // params
    const name = "Total NFT Market Cap";
    const symbol = "JPEGz";
    const cap = 0;
    let orchestrator = await deployments.get("ArbitrumOrchestrator");

    let JPEGZ;
    try {
      JPEGZ = await deployments.get("JPEGZ");
    } catch (error: any) {
      log(error.message);

      const deployResult = await deployments.deploy("JPEGZ", {
        from: deployer,
        skipIfAlreadyDeployed: true,
        log: true,
        args: [name, symbol, cap, orchestrator.address],
      });
      JPEGZ = await deployments.get("JPEGZ");
      if (deployResult.newlyDeployed) {
        log(
          `JPEGZ deployed at ${JPEGZ.address} for ${deployResult.receipt.gasUsed}`
        );
      }
    }
  }
};
module.exports.tags = ["JPEGZ"];
