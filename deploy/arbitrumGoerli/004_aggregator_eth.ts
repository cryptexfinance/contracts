import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const AggregatorInterfaceETH: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "arbitrumGoerli") {
        const { log } = deployments;

        const namedAccounts = await hre.getNamedAccounts();
        const tcapAggregator = await deployments.getOrNull(
            "AggregatorInterfaceETH"
        );

        if (!tcapAggregator) {
            const deployResult = await deployments.deploy(
                "AggregatorInterfaceETH",
                {
                    from: namedAccounts.deployer,
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `AggregatorInterfaceETH deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
            );
        }
    }
};

export default AggregatorInterfaceETH;
