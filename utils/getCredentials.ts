import { createUser } from "./createUser.ts"
import { getCookies } from "./getCookies.ts"
import logger from "./logger.ts"

export default async function getCredentials() {
    try {
        const foundCredentials = await Deno.readTextFile("./login-creds.json")
        logger(`   Credentials found, using existing user ${JSON.parse(foundCredentials).email}`, "orange")
        await getCookies(JSON.parse(foundCredentials).email, JSON.parse(foundCredentials).password, JSON.parse(foundCredentials).otpToken)
      }
      catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          logger("   No Pay credentials found, creating new user...", "orange")
          await createUser()
          const credentials = await Deno.readTextFile("./login-creds.json")
          logger(`   Using user ${JSON.parse(credentials).email}`, "orange")
          await getCookies(JSON.parse(credentials).email, JSON.parse(credentials).password, JSON.parse(credentials).otpToken)
        } else {
          throw error
        }
      }
}