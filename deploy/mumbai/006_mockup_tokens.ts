import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "mumbai") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        log(
            `${hardhatArguments.network} found, deploying mockup DAI contracts`
        );

        //Deploy Mock DAIs
        let DAI
        try {
            DAI = await deployments.get("DAI");
        } catch (error) {
            log(error.message);

            const deployResult = await deployIfDifferent(
                ["data"],
                "DAI",
                { from: deployer },
                "DAI"
            );
            DAI = await deployments.get("DAI");
            if (deployResult.newlyDeployed) {
                log(
                    `DAI deployed at ${DAI.address} for ${deployResult.receipt.gasUsed}`
                );
            }
        }
        let wBTC
        try {
            wBTC = await deployments.get("WBTC");
        } catch (error) {
            log(error.message);

            const _deployResult = await deployIfDifferent(
                ["data"],
                "WBTC",
                { from: deployer },
                "WBTC"
            );
            wBTC = await deployments.get("WBTC");
            if (_deployResult.newlyDeployed) {
                log(
                    `WBTC deployed at ${wBTC.address} for ${_deployResult.receipt.gasUsed}`
                );
            }
        }
    }
};
module.exports.tags = ["DAI", "WBTC"];
