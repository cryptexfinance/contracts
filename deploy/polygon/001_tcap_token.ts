import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const tcap: DeployFunction = async function(
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const tcap = await deployments.getOrNull("TCAP");
        const { log } = deployments;
        if (!tcap) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const name = "Total Crypto Market Cap";
            const symbol = "pTCAP";
            const cap = 0;
            const orchestrator = await deployments.get("Orchestrator");

            const tcapDeployment = await deployments.deploy(
                "TCAP",
                {
                    contract: "TCAP",
                    from: namedAccounts.deployer,
                    args: [
                        name,
                        symbol, 
                        cap,
                        orchestrator.address
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true
                }
            );
            log(
                `TCAP token deployed at ${tcapDeployment.address} for ${tcapDeployment.receipt?.gasUsed}`
            );
        } else {
            log("TCAP token already deployed");
        }
    }
};
export default tcap;

