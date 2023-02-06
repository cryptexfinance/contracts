import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    if (hardhatArguments.network === "arbitrum") {
        let jpgzWETHVaultHandler = await deployments.get("jpgzWETHVaultHandler");
        let jpgzDAIVaultHandler = await deployments.get("jpgzDAIVaultHandler");
        let OrchestratorDeployment = await deployments.get("ArbitrumOrchestrator");
        let l2MessageExecutorProxy = await deployments.get("L2MessageExecutorProxy");
        let jpegz = await deployments.get("JPEGZ");

        let orchestrator = await ethershardhat.getContractAt(
            "ArbitrumOrchestrator",
            OrchestratorDeployment.address
        );

        console.log("Adding jpegz vault Handlers");
        await orchestrator.addTCAPVault(jpegz.address, jpgzWETHVaultHandler.address);
        await orchestrator.addTCAPVault(jpegz.address, jpgzDAIVaultHandler.address);
        await orchestrator.transferOwnership(l2MessageExecutorProxy.address);
    }
};

module.exports.tags = ["Initialize"];
