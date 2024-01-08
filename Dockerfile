FROM node:18 AS base

USER node
WORKDIR /AquaEnhancer
RUN chown -R node:node /AquaEnhancer

FROM base AS builder
# Run 'docker image prune --filter label=stage=build' to remove this dangling image
LABEL stage=build
USER node
WORKDIR /AquaEnhancer/src
COPY --chown=node:node ./src/package.json .
COPY --chown=node:node ./src/package-lock.json .
RUN npm ci

# .dockerignore ignores node_modules on host system, so pull it from builder stage
FROM base AS production
USER node
WORKDIR /AquaEnhancer
# Only copy what we need
# Copy from relative path xxxx/src into container
COPY --chown=node:node --from=builder /AquaEnhancer/src/node_modules ./src/node_modules
COPY --chown=node:node ./src ./src/
ENTRYPOINT [ "node", "src/aqua.js" ]