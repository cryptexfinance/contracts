import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
  if (hardhatArguments.network === "arbitrum") {
    let jpegzWETHVaultHandler = await deployments.get("jpegzWETHVaultHandler");
    let jpegzDAIVaultHandler = await deployments.get("jpegzDAIVaultHandler");
    let OrchestratorDeployment = await deployments.get("ArbitrumOrchestrator");
    let l2MessageExecutorProxy = await deployments.get(
      "L2MessageExecutorProxy"
    );
    let jpegz = await deployments.get("JPEGZ");

    let orchestrator = await ethershardhat.getContractAt(
      "ArbitrumOrchestrator",
      OrchestratorDeployment.address
    );

    console.log("Adding jpegz vault Handlers");
    let tx = await orchestrator.addTCAPVault(
      jpegz.address,
      jpegzWETHVaultHandler.address
    );
    await tx.wait();
    tx = await orchestrator.addTCAPVault(
      jpegz.address,
      jpegzDAIVaultHandler.address
    );
    await tx.wait();
    tx = await orchestrator.transferOwnership(l2MessageExecutorProxy.address);
    await tx.wait();
    console.log("Transferred Ownership to DAO");
  }
};

module.exports.tags = ["Initialize"];
