import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const governance: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {

    if (hardhatArguments.network === "goerli") {
        const Ctx = await deployments.getOrNull("Ctx");
        const { log } = deployments;
        if (!Ctx) {
            const ethers = hre.ethers;

            const namedAccounts = await hre.getNamedAccounts();
            const oneYear = 1641193154; // Monday, January 3, 2022 6:59:14 AM
            const threeDays = 259200;
            const [owner] = await ethers.getSigners();

            let nonce = await owner.getTransactionCount();
            const ctxAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const timelockAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const governorAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const ctxDeployment = await deployments.deploy("Ctx", {
                from: namedAccounts.deployer,
                args: [namedAccounts.deployer, timelockAddress, oneYear],
            });

            log(
                `Ctx deployed at ${ctxDeployment.address} for ${ctxDeployment.receipt?.gasUsed}`
            );

            const timelockDeployment = await deployments.deploy("Timelock", {
                from: namedAccounts.deployer,
                args: [governorAddress, 0],
						// FIXME: replace 0 with threeDays
            });

            log(
                `Timelock deployed at ${timelockDeployment.address} for ${timelockDeployment.receipt?.gasUsed}`
            );

            const governorDeployment = await deployments.deploy(
                "GovernorAlpha",
                {
                    from: namedAccounts.deployer,
                    args: [timelockAddress, ctxAddress],
                }
            );

            log(
                `Governor Alpha deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
            );
        } else {
            log("Ctx Token already deployed");
        }
    }
};
export default governance;
