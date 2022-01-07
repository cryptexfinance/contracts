#!/usr/bin/env bash
export DAPP_LINK_TEST_LIBRARIES=0
export DAPP_TEST_SMTTIMEOUT=500000
#export PROPTEST_CASES=50000
#export RUST_LOG=evm_adapters=trace
forge test -vvv --contracts test --remappings @openzeppelin/=node_modules/@openzeppelin/ @chainlink/=node_modules/@chainlink/ fx-portal-contracts/=node_modules/fx-portal-contracts

