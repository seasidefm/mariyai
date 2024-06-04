FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .

RUN bun i

COPY . .

CMD ["bun", "run", "src/server.ts"]
