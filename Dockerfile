FROM node:8-alpine

ADD . /app

WORKDIR /app

RUN apk --update --no-cache add coreutils python && \
    npm i --production

CMD ["npm", "start"]
