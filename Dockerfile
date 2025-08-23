FROM node:20-slim

WORKDIR /home/node/app

RUN apt-get update -y && apt-get install -y openssl

#COPY package.json yarn.lock ./

COPY . .

WORKDIR /home/node/app

USER node

CMD ["sh", "-c", "yarn migration:run && yarn start:dev"]