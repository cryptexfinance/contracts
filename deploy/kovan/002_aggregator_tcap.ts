import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const AggregatorInterfaceTCAP: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "kovan") {
        const { log } = deployments;

        const namedAccounts = await hre.getNamedAccounts();
        const tcapAggregator = await deployments.getOrNull(
            "AggregatorInterfaceTCAP"
        );

        if (!tcapAggregator) {
            const deployResult = await deployments.deploy(
                "AggregatorInterfaceTCAP",
                {
                    from: namedAccounts.deployer,
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `AggregatorInterfaceTCAP deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
            );
        }
    }
};

export default AggregatorInterfaceTCAP;
