FROM oven/bun:1-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f

WORKDIR /app
COPY --chown=bun:bun backend ./backend
COPY --chown=bun:bun frontend ./frontend

USER bun
EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "backend/server.ts"]
