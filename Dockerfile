FROM node:10.15.3-alpine

ARG ENV

ENV PROJECT_DIR /app

RUN mkdir $PROJECT_DIR

ADD . $PROJECT_DIR

WORKDIR $PROJECT_DIR

RUN apk --no-cache add curl dcron && \
    npm install && \
    npm run fixcharts && \
    npm run postinstall && \
    npm run build:ssr


CMD ["npm", "run", "serve:ssr"]
