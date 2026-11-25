import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        // Integration tests share one database, so run files sequentially.
        fileParallelism: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**'],
            // Entry point only wires dependencies and listens; nothing to unit test.
            exclude: ['src/server.ts'],
        },
    },
});
