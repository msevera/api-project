#!/bin/sh

PROJECT=$1

kubectl apply -f k8s/namespace.yml
kubectl delete secret regcred -n=${PROJECT}
kubectl create secret generic regcred \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson -n=${PROJECT}

while IFS="=" read line val || [ -n "$line" ]; do
  if [[ "$line" != "#"* && "$line" != $'' ]]; then
    loweredVal=$(echo "$line" | tr '[:upper:]' '[:lower:]')
    nospacesVal=${val//[$'\t\r\n']/}
    replacedVal=${loweredVal//_/-}
    kubectl delete secret api-$replacedVal -n=${PROJECT}
    kubectl create secret generic api-$replacedVal --from-literal API_$line="$nospacesVal" -n=${PROJECT}
  fi
done <.env

kubectl apply -f k8s/pt/development/mongodb-headless-service.yml -n=${PROJECT}
kubectl apply -f k8s/pt/development/mongodb-nodeport-service.yml -n=${PROJECT}
kubectl apply -f k8s/pt/development/mongodb-statefulset.yml -n=${PROJECT}

kubectl apply -f k8s/pt/development/redis-ssd-persistent-volume.yml -n=${PROJECT}
kubectl apply -f k8s/redis-statefulset.yml -n=${PROJECT}
kubectl apply -f k8s/redis-cluster-ip-service.yml -n=${PROJECT}

# kubectl delete secret dev-api-project-com-tls -n=${PROJECT}
# kubectl create secret tls dev-api-project-com-tls --cert=dev.api.project.com.pem --key=dev.api.project.com-key.pem -n=${PROJECT}
