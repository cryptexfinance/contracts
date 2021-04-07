import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const governance: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "mainnet") {
        const Gov = await deployments.getOrNull("GovernorAlpha");
        const { log } = deployments;
        if (!Gov) {
            const ethers = hre.ethers;

            const namedAccounts = await hre.getNamedAccounts();
            const oneYear = 1649282061; // Wednesday, April 6, 2022 5:54:21 PM
            const threeDays = 259200;
            const [owner] = await ethers.getSigners();
            let nonce = 0; // set to 0 because of revert
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

            // const ctxDeployment = await deployments.deploy("Ctx", {
            //     from: namedAccounts.deployer,
            //     args: [namedAccounts.deployer, timelockAddress, oneYear],
            // });

            // log(
            //     `Ctx deployed at ${ctxDeployment.address} for ${ctxDeployment.receipt?.gasUsed}`
            // );

            // const timelockDeployment = await deployments.deploy("Timelock", {
            //     from: namedAccounts.deployer,
            //     args: [governorAddress, threeDays],
            // });

            // log(
            //     `Timelock deployed at ${timelockDeployment.address} for ${timelockDeployment.receipt?.gasUsed}`
            // );

            const governorDeployment = await deployments.deploy(
                "GovernorAlpha",
                {
                    from: namedAccounts.deployer,
                    args: [
                        "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8",
                        "0x321C2fE4446C7c963dc41Dd58879AF648838f98D",
                    ],
                }
            );

            log(
                `Governor Alpha deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
            );
        } else {
            log("Governance already deployed");
        }
    }
};
export default governance;
