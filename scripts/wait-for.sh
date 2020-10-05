#!/usr/bin/env bash

SLEEP_SECONDS=$3

echo "Waiting for $1:$2 ..."

until (echo > "/dev/tcp/$1/$2") >/dev/null 2>&1; do
  sleep 1
done

echo "$1 is up, waiting ${SLEEP_SECONDS} seconds before starting ..."
sleep "${SLEEP_SECONDS}"
echo "Done waiting for $1, starting ..."