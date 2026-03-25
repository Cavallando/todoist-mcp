# BUILD_FROM is injected by the HA Supervisor build system (see build.yaml).
# When building locally for testing, pass it explicitly:
#   docker build --build-arg BUILD_FROM=node:20-alpine .
ARG BUILD_FROM
FROM ${BUILD_FROM}

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# Prune dev dependencies to keep the image lean
RUN yarn install --frozen-lockfile --non-interactive --production

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
