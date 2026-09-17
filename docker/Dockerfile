FROM oven/bun:1-alpine

WORKDIR /app
COPY --chown=bun:bun backend ./backend
COPY --chown=bun:bun frontend ./frontend

USER bun
EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "backend/server.ts"]
