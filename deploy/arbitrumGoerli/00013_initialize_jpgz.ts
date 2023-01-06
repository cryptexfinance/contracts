import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    if (hardhatArguments.network === "arbitrumGoerli") {
        let jWETHHandler = await deployments.get("jWETHVaultHandler");
        let OrchestratorDeployment = await deployments.get("ArbitrumOrchestrator");
        let jpegz = await deployments.get("JPEGZ");

        let orchestrator = await ethershardhat.getContractAt(
            "ArbitrumOrchestrator",
            OrchestratorDeployment.address
        );

        console.log("Adding jpegz vault Handlers");
        await orchestrator.addTCAPVault(jpegz.address, jWETHHandler.address);
    }
};

module.exports.tags = ["Initialize"];
