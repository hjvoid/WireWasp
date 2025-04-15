export async function createUser() {

    const TEMP_FILE = "./login-creds.json"

    const cmd = new Deno.Command("sh", {
        args: ["-c", "pay local user"],
    })
    const { stdout } = await cmd.output()
    const output = new TextDecoder().decode(stdout)

    function parseCredentials(output: string) {
        const lines = output.split("\n").map((line) => line.trim())
        const credentials: Record<string, string> = {}

        for (const line of lines) {
            if (line.startsWith("📧")) {
                credentials.email = line.split("Email:")[1]?.trim()
            } else if (line.startsWith("🛂")) {
                credentials.password = line.split("Password:")[1]?.trim()
            } else if (line.startsWith("🔑")) {
                credentials.otpKey = line.split("OTP key:")[1]?.trim()
            } else if (line.startsWith("📱")) {
                credentials.otpToken = line.split("OTP token:")[1]?.trim()
            }
        }

        return credentials
    }

    const credentials = parseCredentials(output)

    await Deno.writeTextFile(TEMP_FILE, JSON.stringify(credentials, null, 2))

}