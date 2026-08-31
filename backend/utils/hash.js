import bcrypt from "bcrypt";


export async function hashPassword(password, saltRounds = 10) {
    try {
        const hashed = await bcrypt.hash(password, saltRounds);
        return hashed;
    } catch (err) {
        console.error("Error hashing password:", err);
        throw err;
    }
}

export async function comparePassword(password, hashedPassword) {
    try {
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    } catch (err) {
        console.error("Error comparing password:", err);
        throw err;
    }
}
