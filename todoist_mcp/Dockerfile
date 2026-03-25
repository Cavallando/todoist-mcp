FROM node:20-alpine

# jq is used by run.sh to read /data/options.json (HAOS add-on config)
RUN apk add --no-cache jq

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

# Compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# Drop dev dependencies to keep the image lean
RUN yarn install --frozen-lockfile --non-interactive --production

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
