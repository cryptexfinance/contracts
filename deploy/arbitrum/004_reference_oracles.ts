import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
  if (hardhatArguments.network === "arbitrumGoerli") {
    const { deployIfDifferent, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let JPEGZOracle, WETHOracle, DAIOracle;

    //params
    const l2MessageExecutor = await deployments.get("L2MessageExecutor");
    const daiAggregator = "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB";
    const jpegzAggregator = "0x8D0e319eBAA8DF32e088e469062F85abF2eBe599";
    const ethAggregator = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";

    try {
      DAIOracle = await deployments.get("DAIOracle");
    } catch (error: any) {
      log(error.message);

      const deployResult = await deployments.deploy("DAIOracle", {
        from: deployer,
        contract: "ChainlinkOracle",
        skipIfAlreadyDeployed: true,
        log: true,
        args: [daiAggregator, l2MessageExecutor.address],
      });

      DAIOracle = await deployments.get("DAIOracle");
      if (deployResult.newlyDeployed) {
        log(
          `Oracle deployed at ${DAIOracle.address} for ${deployResult.receipt.gasUsed}`
        );
      }
    }

    try {
      WETHOracle = await deployments.get("WETHOracle");
    } catch (error: any) {
      log(error.message);
      // arbitrum
      const deployResult = await deployments.deploy("WETHOracle", {
        from: deployer,
        contract: "ChainlinkOracle",
        skipIfAlreadyDeployed: true,
        log: true,
        args: [ethAggregator, l2MessageExecutor.address],
      });
      WETHOracle = await deployments.get("WETHOracle");
      if (deployResult.newlyDeployed) {
        log(
          `Price Feed Oracle deployed at ${WETHOracle.address} for ${deployResult.receipt.gasUsed}`
        );
      }
    }

    try {
      JPEGZOracle = await deployments.get("JPEGZOracle");
    } catch (error: any) {
      log(error.message);

      const deployResult = await deployments.deploy("JPEGZOracle", {
        from: deployer,
        contract: "ChainlinkOracle",
        skipIfAlreadyDeployed: true,
        log: true,
        args: [jpegzAggregator, l2MessageExecutor.address],
      });

      JPEGZOracle = await deployments.get("JPEGZOracle");
      if (deployResult.newlyDeployed) {
        log(
          `Oracle deployed at ${JPEGZOracle.address} for ${deployResult.receipt.gasUsed}`
        );
      }
    }
  }
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
