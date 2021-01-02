#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:10-alpine AS builder

WORKDIR /usr/src/app

RUN apk --update add --no-cache python make g++

COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
RUN npm ci --quiet && npm run build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:10-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json .
## We just need the build to execute the command
COPY --from=builder /usr/src/app/dist /app/dist
COPY --from=builder /usr/src/app/node_modules /app/node_modules


CMD [ "npm", "start" ]