FROM node:7-alpine

ADD . /app

WORKDIR /app

RUN npm i --production

CMD ["npm", "start"]
