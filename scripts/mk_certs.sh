#!/bin/bash

cd "$(dirname "$0")" || exit
source "lib_certs.sh"
cd ..

# Root Certificate

create_root_keystore \
  "config/crypto/arrowhead.p12" "arrowhead.eu"

