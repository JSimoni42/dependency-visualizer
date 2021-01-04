FROM alpine:3.12

# Get yarn and install necessary dependencies
RUN apk add --no-cache yarn nodejs

# Carve out a working directory for the application
# and build it
RUN mkdir /app
WORKDIR /app
ADD ./ ./
RUN yarn install 
RUN yarn run build

# Start the app
ENTRYPOINT yarn run start