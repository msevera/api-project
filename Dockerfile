FROM node:21.4.0-alpine
WORKDIR '/app'
COPY package.json .
RUN apk add --update --no-cache \
    file \
    make \
    g++ \
    linux-headers \
    python3
RUN npm install
RUN npm install -g migrate-mongo
COPY . .
CMD ["npm", "run", "start"]

