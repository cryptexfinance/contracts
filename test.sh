#!/usr/bin/env bash
export DAPP_LINK_TEST_LIBRARIES=0
export DAPP_TEST_SMTTIMEOUT=500000
#export PROPTEST_CASES=50000
#export RUST_LOG=evm_adapters=trace
$HOME/.foundry/bin/forge test -vv --contracts test --force --offline -m testShouldAllowMintTCAP
