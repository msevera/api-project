#!/bin/sh

# Define the namespace
NAMESPACE="pt"
PROJECT="api"

# Function to delete the namespace
cleanup() {
  echo "Cleaning up..."
  kubectl get all -n "$NAMESPACE" -o name | grep "$PROJECT" | xargs --no-run-if-empty kubectl delete -n "$NAMESPACE"
  echo "All resources deleted"
}

# Set up trap for SIGINT (Ctrl+C) and SIGTERM
trap cleanup INT TERM

# Run skaffold dev and wait for it
skaffold debug --cleanup=false --auto-sync=true --port-forward
wait

# Explicit call to cleanup if you want to delete the namespace even if skaffold dev exits normally
cleanup
