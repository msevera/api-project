For the past couple of years, I've built dozens of MVPs and prototypes, and our team needed an API with a monolithic architecture that could be easily modified at its core and scaled as needed. This API was developed and improved incrementally. This repository contains the core code and demonstrates, using two example entities, *User* and *Product*, how to use and build on top of it.

The architecture consists of multiple layers:
- **GraphQL Resolver**
- **Domain Layer** with Cross-Domain Transactions
- **Datasource Layer**
- **Security Layer** with Token Management
- **Services Layer**

The system is configured for deployment on a local Kubernetes cluster and uses Redis and MongoDB deployments.

## Kubernetes setup

1. Install [Docker Desktop](https://www.docker.com/).
2. Enable Kubernetes in Docker settings.
3. Install Helm with `brew install helm`.
4. Install `ingress-nginx` with:
    ```
    helm upgrade --install ingress-nginx ingress-nginx \
      --repo https://kubernetes.github.io/ingress-nginx \
      --namespace ingress-nginx --create-namespace
    ```

## API setup
1. Restore `.env` file from `template.env`.
2. Add `127.0.0.1 dev.api.project.com` entry to your `hosts` file.
3. Decide whether you are going to use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) or a local MongoDB instance and follow the relevant steps below.

### MongoDB Atlas
4. Update `DB` in `.env` to the connection string pointing to your MongoDB Atlas instance.
5. Run `skaffold.sh` - that's it. 
6. Open `http://dev.api.project.com/graphql` in browser.

### MongoDB local instance
4. Run `skaffold.sh` - this command will set up all necessary Kubernetes resources. Note that the API will not start yet as MongoDB requires further configuration.

#### MongoDB configuration
5. Run `kubectl exec -ti mongo-statefulset-0 -n pt -- mongosh`
   1. If configuring for the first time, this command will initialize the replica set:
      ```
      rs.initiate(
      {
         _id: "rs0",
         version: 1,
         members: [
            { _id: 0, host : "mongo-statefulset-0.mongo-headless:27017" }        
         ]
      }
      ```
   2. If reconfiguration is needed, run:
        ```
        rs.reconfig({
          _id: 'rs0',
          version: 1,
          members: [
            {
              _id: 0,
              host: 'mongo-statefulset-0.mongo-headless:27017',
              priority: 1
            }
          ]
        }, { force: true });
        ```
6. Re-run `skaffold.sh` again - that's it.
7. Open `http://dev.api.project.com/graphql` in browser 
8. To connect to the local MongoDB instance from external tools like MongoDB Compass, use the following connection string: `mongodb://localhost:30020/?directConnection=true` 