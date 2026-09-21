FROM oven/bun:1-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f

WORKDIR /app
COPY --chown=bun:bun frontend ./frontend
COPY --chown=bun:bun experiments/three-arcade ./experiments/three-arcade

USER bun
EXPOSE 3100
ENV PORT=3100

CMD ["bun", "run", "experiments/three-arcade/server.ts"]
