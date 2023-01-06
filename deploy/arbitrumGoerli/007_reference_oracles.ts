import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
  if (hardhatArguments.network === "arbitrumGoerli") {
    const { deployIfDifferent, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let TCAPOracle, JPEGZOracle, WETHOracle, DAIOracle;

    const l2MessageExecutor = await deployments.get("L2MessageExecutor");
    const tcapAggregator = await deployments.getOrNull(
      "AggregatorInterfaceTCAP"
    );
    const jpegzAggregator = await deployments.getOrNull(
      "AggregatorInterfaceJPEGZ"
    );

    try {
      TCAPOracle = await deployments.get("TCAPOracle");
    } catch (error: any) {
      log(error.message);
      let oracleAddress = tcapAggregator.address;

      const deployResult = await deployments.deploy("TCAPOracle", {
        from: deployer,
        contract: "ChainlinkOracle",
        skipIfAlreadyDeployed: true,
        log: true,
        args: [oracleAddress, l2MessageExecutor.address],
      });

      TCAPOracle = await deployments.get("TCAPOracle");
      if (deployResult.newlyDeployed) {
        log(
          `Oracle deployed at ${TCAPOracle.address} for ${deployResult.receipt.gasUsed}`
        );
      }
      try {
        WETHOracle = await deployments.get("WETHOracle");
      } catch (error: any) {
        log(error.message);
        // Couldn't find oracle address for arbitrum
        let oracleAddress = tcapAggregator.address;
        const deployResult = await deployments.deploy("WETHOracle", {
          from: deployer,
          contract: "ChainlinkOracle",
          skipIfAlreadyDeployed: true,
          log: true,
          args: [oracleAddress, l2MessageExecutor.address],
        });
        WETHOracle = await deployments.get("WETHOracle");
        if (deployResult.newlyDeployed) {
          log(
            `Price Feed Oracle deployed at ${WETHOracle.address} for ${deployResult.receipt.gasUsed}`
          );
        }
      }
    }

    try {
        JPEGZOracle = await deployments.get("JPEGZOracle");
    } catch (error: any) {
      log(error.message);
      let oracleAddress = jpegzAggregator.address;

      const deployResult = await deployments.deploy("JPEGZOracle", {
        from: deployer,
        contract: "ChainlinkOracle",
        skipIfAlreadyDeployed: true,
        log: true,
        args: [oracleAddress, l2MessageExecutor.address],
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
