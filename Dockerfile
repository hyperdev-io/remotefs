FROM node:8-alpine

ADD . /app

WORKDIR /app

RUN apk --update --no-cache add coreutils python make g++ && \
    npm i --production

EXPOSE 9228
ENTRYPOINT npm run dev