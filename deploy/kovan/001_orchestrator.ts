import { hardhatArguments } from "hardhat";
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "kovan") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        let orchestrator;
        try {
            orchestrator = await deployments.get("Orchestrator");
        } catch (error) {
            try {
                const deployResult = await deployIfDifferent(
                    ["data"],
                    "Orchestrator",
                    { from: deployer, gas: 8000000 },
                    "Orchestrator",
                    deployer
                );
                orchestrator = await deployments.get("Orchestrator");
                if (deployResult.newlyDeployed) {
                    log(
                        `Orchestrator deployed at ${orchestrator.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
            } catch (error) {
                log(error.message);
            }
        }
    }
};
module.exports.tags = ["Orchestrator"];
