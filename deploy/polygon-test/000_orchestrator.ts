
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {deployments, hardhatArguments} from "hardhat";

const orchestrator: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        console.log("=====Polygon Deploy=====");
        const orchestrator = await deployments.getOrNull("Orchestrator");
        const {log} = deployments;
        if (!orchestrator) {
            const namedAccounts = await hre.getNamedAccounts();
            const guardian = "0xf77E8426EceF4A44D5Ec8986FB525127BaD32Fd1" ; // Multi sign

            const orchestratorDeployment = await deployments.deploy(
                "Orchestrator",
                {
                    contract: "Orchestrator",
                    from: namedAccounts.deployer,
                    args: [
                        guardian,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `Orchestrator deployed at ${orchestratorDeployment.address} for ${orchestratorDeployment.receipt?.gasUsed}`
            );
        } else {
            log("Orchestrator already deployed");
        }
    }
};
export default orchestrator;

1