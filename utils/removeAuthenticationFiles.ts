export async function removeAuthCredentials () {
    try {
      await Deno.remove("./login-creds.json")
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err
      }
    }
  
    try {
      await Deno.remove("./cookies.json")
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err
      }
    }
  }