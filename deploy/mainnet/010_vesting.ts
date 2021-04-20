// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import { deployments, hardhatArguments } from "hardhat";

// const vesting: DeployFunction = async function (
//     hre: HardhatRuntimeEnvironment
// ) {
//     let run = process.env.INITIAL_RUN == "true" ? true : false;
//     if (hardhatArguments.network === "mainnet" && run) {
//         const teamVesting = await deployments.getOrNull("TeamVester");
//         const advisorVesting1 = await deployments.getOrNull("AdvisorVester1");
//         const advisorVesting2 = await deployments.getOrNull("AdvisorVester2");
//         const { log } = deployments;
//         if (!teamVesting && !advisorVesting1 && !advisorVesting2) {
//             const namedAccounts = await hre.getNamedAccounts();
//             let ctxDeployment = await deployments.get("Ctx");

//             // TODO
//             const oneYear = 1649282061; // Wednesday, April 6, 2022 5:54:21 PM
//             const ctx = ctxDeployment.address;
//             const vestingBegin = 0;
//             const vestingEnd = 0;
//             const vestingCliff = oneYear;
//             const vestingAmountTeam = 0; // Wei
//             const vestingAmountAdvisor = 0; // Wei
//             const teamAddress = "";
//             const advisorAddress1 = "";
//             const advisorAddress2 = "";

//             const teamDeployment = await deployments.deploy("TeamVester", {
//                 from: namedAccounts.deployer,
//                 contract: "TreasuryVester",
//                 args: [
//                     ctx,
//                     teamAddress,
//                     vestingAmountTeam,
//                     vestingBegin,
//                     vestingCliff,
//                     vestingEnd,
//                 ],
//             });

//             log(
//                 `Team Vestingdeployed at ${teamDeployment.address} for ${teamDeployment.receipt?.gasUsed}`
//             );

//             const advisor1Deployment = await deployments.deploy(
//                 "AdvisorVester1",
//                 {
//                     from: namedAccounts.deployer,
//                     contract: "TreasuryVester",
//                     args: [
//                         ctx,
//                         advisorAddress1,
//                         vestingAmountAdvisor,
//                         vestingBegin,
//                         vestingCliff,
//                         vestingEnd,
//                     ],
//                 }
//             );

//             log(
//                 `Team Vestingdeployed at ${advisor1Deployment.address} for ${advisor1Deployment.receipt?.gasUsed}`
//             );

//             const advisor2Deployment = await deployments.deploy(
//                 "AdvisorVester2",
//                 {
//                     from: namedAccounts.deployer,
//                     contract: "TreasuryVester",
//                     args: [
//                         ctx,
//                         advisorAddress2,
//                         vestingAmountTeam,
//                         vestingBegin,
//                         vestingCliff,
//                         vestingEnd,
//                     ],
//                 }
//             );

//             log(
//                 `Team Vestingdeployed at ${advisor2Deployment.address} for ${advisor2Deployment.receipt?.gasUsed}`
//             );
//         } else {
//             log("Vesting already deployed");
//         }
//     }
// };
// export default vesting;
