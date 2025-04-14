export default function logger(message: string, color?: string) {
    const messageColour = color || "green";
    console.log(`%c ${message}`, `color: ${messageColour}`);
}