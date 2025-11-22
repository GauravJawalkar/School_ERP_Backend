import { defineConfig } from 'drizzle-kit'

const config = defineConfig({
    dialect: "postgresql",
    schema: './src/models/index.ts',
    out: './src/drizzle',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})

export default config