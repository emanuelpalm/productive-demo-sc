#!/bin/bash

cd "$(dirname "$0")" || exit
source "lib_certs.sh"
cd ..

# Root Certificate

create_root_keystore \
  "config/crypto/arrowhead.p12" "arrowhead.eu"

create_cloud_keystore \
  "config/crypto/arrowhead.p12" "arrowhead.eu" \
  "config/crypto/cloud.p12" "cloud.p4sc.arrowhead.eu"

create_p4sc_system_keystore() {
  SYSTEM_NAME=$1

  create_system_keystore \
    "config/crypto/arrowhead.p12" "arrowhead.eu" \
    "config/crypto/cloud.p12" "cloud.p4sc.arrowhead.eu" \
    "config/crypto/system.${SYSTEM_NAME}.p12" "${SYSTEM_NAME}.cloud.p4sc.arrowhead.eu" \
    "dns:${SYSTEM_NAME//_/-}.p4sc"
}

create_p4sc_system_keystore "authorization"
create_p4sc_system_keystore "event_handler"
create_p4sc_system_keystore "orchestrator"
create_p4sc_system_keystore "service_registry"

create_p4sc_system_keystore "plant-agent-purchasing"
create_p4sc_system_keystore "plant-proxy"

create_p4sc_system_keystore "carrier-agent-booking"
create_p4sc_system_keystore "carrier-proxy"

create_p4sc_system_keystore "supplier-agent-forecasting"
create_p4sc_system_keystore "supplier-agent-sales"
create_p4sc_system_keystore "supplier-proxy"


create_sysop_keystore \
  "config/crypto/arrowhead.p12" "arrowhead.eu" \
  "config/crypto/cloud.p12" "cloud.p4sc.arrowhead.eu" \
  "config/crypto/sysop.p12" "sysop.cloud.p4sc.arrowhead.eu"

create_truststore \
  "config/crypto/truststore.p12" \
  "config/crypto/arrowhead.crt" "arrowhead.eu" \
  "config/crypto/cloud.crt" "cloud.p4sc.arrowhead.eu"