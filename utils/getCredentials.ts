import { createUser } from "./createUser.ts";
import { getCookies } from "./getCookies.ts";

export default async function getCredentials() {
    try {
        const foundCredentials = await Deno.readTextFile("./login-creds.json");
        console.log(`%c   Credentials found, using existing user ${JSON.parse(foundCredentials).email}`, "background-color: green");
        await getCookies(JSON.parse(foundCredentials).email, JSON.parse(foundCredentials).password, JSON.parse(foundCredentials).otpToken);
      }
      catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          console.log("%c   No Pay credentials found, creating new user...", "color: orange");
          await createUser();
          const credentials = await Deno.readTextFile("./login-creds.json");
          console.log(`%c   Using user ${JSON.parse(credentials).email}`, "color: orange");
          await getCookies(JSON.parse(credentials).email, JSON.parse(credentials).password, JSON.parse(credentials).otpToken);
        } else {
          throw error;
        }
      }
}