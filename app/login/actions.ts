"use server";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { z } from "zod";

const logInSchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
});

export async function logIn(prevState: any, formData: FormData) {
    const data = {
        email: formData.get("email"),
        password: formData.get("password"),
    };
    const result = logInSchema.safeParse(data);
    if (!result.success) {
        return result.error.flatten();
    }
}

