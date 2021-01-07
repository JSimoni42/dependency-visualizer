FROM alpine:3.12

ARG env=dev

# Get yarn and install necessary dependencies
RUN apk add --no-cache yarn nodejs

# Carve out a working directory for the application
# and build it
RUN mkdir /app
WORKDIR /app
ADD ./ ./
RUN yarn install 

RUN if [[$env == prod]];\ 
    then yarn run build;\
    fi

ENTRYPOINT if [[$env == prod]];\
            then yarn run start;\
            else yarn run dev;\
            fi