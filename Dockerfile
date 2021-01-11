# Start from the base image, which already has an app directory and packages installed
FROM mod-res-dev-base

ARG env=dev

WORKDIR /app
ADD ./pages ./pages
ADD ./src ./src

RUN if [[$env == prod]];\
    then yarn run build;\
    fi

ENTRYPOINT if [[$env == prod]];\
            then yarn run start;\
            else yarn run dev;\
            fi