import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const AggregatorInterfaceJPEGZ: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "arbitrumGoerli") {
        const { log } = deployments;

        const namedAccounts = await hre.getNamedAccounts();
        const jpegzAggregator = await deployments.getOrNull(
            "AggregatorInterfaceJPEGZ"
        );

        if (!jpegzAggregator) {
            const deployResult = await deployments.deploy(
                "AggregatorInterfaceJPEGZ",
                {
                    from: namedAccounts.deployer,
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `AggregatorInterfaceJPEGZ deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
            );
        }
    }
};

export default AggregatorInterfaceJPEGZ;
