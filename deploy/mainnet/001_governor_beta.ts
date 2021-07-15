import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {deployments, hardhatArguments} from "hardhat";

const governorBeta: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const ethers = hre.ethers;
    const provider = ethers.getDefaultProvider();
    const blockN = await provider.getBlockNumber();
    const currentBlock = await provider.getBlock(blockN);

    if (hardhatArguments.network === "mainnet") {
        const governorBeta = await deployments.getOrNull("GovernorBeta");
        const {log} = deployments;
        if (!governorBeta) {
            const ethers = hre.ethers;

            const namedAccounts = await hre.getNamedAccounts();
            const ctx = "0x321C2fE4446C7c963dc41Dd58879AF648838f98D";
            const timelock = "0xa54074b2cc0e96a43048d4a68472f7f046ac0da8";
            const guardian = "0xa70b638b70154edfcbb8dbbbd04900f328f32c35";

            const governorDeployment = await deployments.deploy(
                "GovernorBeta",
                {
                    contract: "GovernorBeta",
                    from: namedAccounts.deployer,
                    args: [
                        timelock,
                        ctx,
                        guardian,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                    nonce: 46,
                }
            );

            log(
                `Governor Beta deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
            );

        } else {
            log("Governor Beta already deployed");
        }
    }
};
export default governorBeta;
