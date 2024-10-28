#!/bin/sh

PROJECT=$1

kubectl exec statefulset/redis-statefulset -n=${PROJECT} -- sh -c "redis-cli --scan | grep -v ens: | xargs -r redis-cli del"
