# Start from the base image, which already has an app directory and packages installed
FROM mod-res-base

ARG env=dev

WORKDIR /app
ADD ./pages ./pages
ADD ./src ./src
ADD ./server.js ./server.js

RUN if [[$env == prod]];\
    then yarn run build;\
    fi

ENTRYPOINT yarn run start