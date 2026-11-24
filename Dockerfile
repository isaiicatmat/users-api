FROM node:26.8.2-alpine3.23

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

# The Prisma client must be generated from the schema inside the image.
RUN npx prisma generate

EXPOSE 3000

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
