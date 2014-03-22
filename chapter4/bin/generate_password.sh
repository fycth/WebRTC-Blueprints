#!/bin/sh

TTL=3600
timestamp=$(date +%s)
USERNAME=user1
TMP_USERNAME=` expr ${timestamp} + ${TTL}`:${USERNAME}
SECRET_KEY=abc

#echo -n ${TMP_USERNAME} | openssl sha1 -hmac ${SECRET_KEY}
#RES=$(echo -n "1394654493:user1" | openssl dgst -sha1 -hmac "abc" -binary | base64)
RES=$(echo -n "${TMP_USERNAME}" | openssl dgst -sha1 -hmac ${SECRET_KEY} -binary | base64)

echo -n "user: ${TMP_USERNAME}\n"
echo "res: ${RES}"
