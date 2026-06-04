#!/bin/bash

export E2E_BASE_URL=http://gateway/egen
export CI=true

while [ "$(curl -s -o /dev/null -w ''%{http_code}'' http://gateway/egen/login.htm)" != "200" ]; do
  echo "Waiting for the backend to be up..."
  sleep 10
done

cp example.env .env

yarn test-e2e
