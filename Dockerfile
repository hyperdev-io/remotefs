FROM node:8-alpine

ADD . /app

WORKDIR /app

RUN apk --update --no-cache add coreutils python make g++ && \
    npm i --production


FROM node:8-alpine

COPY --from=0 /app /app

WORKDIR /app

CMD ["npm", "start"]
