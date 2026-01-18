"use server";
import bcrypt from "bcrypt";
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db, { schema } from "@/lib/db";
import { z } from "zod";
import { logInUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

const { users } = schema;

const checkEmailExists = async (email: string) => {
    const [user] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    // if(user){
    //   return true
    // } else {
    //   return false
    // }
    return Boolean(user);
};

const formSchema = z.object({
    email: z
        .string()
        .email()
        .toLowerCase()
        .refine(checkEmailExists, "An account with this email does not exist."),
    password: z.string({
        required_error: "Password is required",
    }),
    // .min(PASSWORD_MIN_LENGTH),
    // .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export async function logIn(prevState: any, formData: FormData) {
    const data = {
        email: formData.get("email"),
        password: formData.get("password"),
    };
    const result = await formSchema.safeParseAsync(data);
    if (!result.success) {
        return result.error.flatten();
    } else {
        const [user] = await db.select({
            id: users.id,
            password: users.password,
        })
        .from(users)
        .where(eq(users.email, result.data.email))
        .limit(1);
        
        if (!user) {
            return {
                fieldErrors: {
                    password: ["Wrong password."],
                    email: [],
                },
            };
        }
        
        const ok = await bcrypt.compare(
            result.data.password,
            user.password ?? "xxxx"
        );
        if (ok) {
            await logInUser(user.id);
        } else {
            return {
                fieldErrors: {
                    password: ["Wrong password."],
                    email: [],
                },
            };
        }
    }
}

