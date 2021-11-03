import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (
        hardhatArguments.network === "rinkeby" ||
        hardhatArguments.network === "ropsten" ||
        hardhatArguments.network === "hardhat"
    ) {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        log(
            `${hardhatArguments.network} found, deploying mockup AAVE contracts`
        );

        //Deploy Mock DAIs
        let AAVE, LINK;
        try {
            AAVE = await deployments.get("AAVE");
        } catch (error) {
            log(error.message);

            const deployResult = await deployIfDifferent(
                ["data"],
                "AAVE",
                { from: deployer },
                "AAVE"
            );
            AAVE = await deployments.get("AAVE");
            if (deployResult.newlyDeployed) {
                log(
                    `AAVE deployed at ${AAVE.address} for ${deployResult.receipt.gasUsed}`
                );
            }

            try {
                LINK = await deployments.get("LINK");
            } catch (error) {
                log(error.message);

                const deployResult = await deployIfDifferent(
                    ["data"],
                    "LINK",
                    { from: deployer },
                    "LINK"
                );
                LINK = await deployments.get("LINK");
                if (deployResult.newlyDeployed) {
                    log(
                        `LINK deployed at ${LINK.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
            }
        }
    }
};
module.exports.tags = ["AAVE", "LINK"];
