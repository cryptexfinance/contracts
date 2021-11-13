#!/usr/bin/env bash

export DAPP_TEST_COV_MATCH=D[a-zA-Z]+[^\.t]\.sol #only runs Delegator and Delegator Factory
export DAPP_BUILD_OPTIMIZE=1
export DAPP_BUILD_OPTIMIZE_RUNS=1000000
export DAPP_LINK_TEST_LIBRARIES=0
export DAPP_TEST_SMTTIMEOUT=500000
export DAPP_TEST_VERBOSITY=1

dapp test --coverage
