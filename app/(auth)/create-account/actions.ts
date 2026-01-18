"use server";
import bcrypt from "bcrypt";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { logInUser } from "@/lib/auth";
import { z } from "zod";

const checkUsername = (username: string) => !username.includes("potato");

const checkPasswords = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

const formSchema = z
  .object({
    username: z
      .string({
        invalid_type_error: "Username must be a string!",
        required_error: "Where is my username???",
      })
      .trim()
      .toLowerCase()
      // .transform((username) => `🔥 ${username} 🔥`)
      .refine(checkUsername, "No potatoes allowed!"),
    email: z.string().email().toLowerCase(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    //.regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirm_password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .superRefine(async ({ username }, ctx) => {
    // Drizzle: Check username existence
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));

    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "This username is already taken",
        path: ["username"],
        fatal: true,
      });
    }
  })
  .superRefine(async ({ email }, ctx) => {
    // Drizzle: Check email existence
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "This email is already taken",
        path: ["email"],
        fatal: true,
      });
    }
  })
  .refine(checkPasswords, {
    message: "Both passwords should be the same!",
    path: ["confirm_password"],
  });

/**
 * Request 처리: FormData 파싱 및 검증
 */
async function validateCreateAccountRequest(formData: FormData) {
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };
  const result = await formSchema.spa(data);
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.flatten(),
    };
  }
  return {
    success: true as const,
    data: result.data,
  };
}

/**
 * Response 처리: DB 저장 및 세션 생성
 */
async function createAccountResponse(validatedData: {
  username: string;
  email: string;
  password: string;
}) {
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Drizzle: Insert user
  const [user] = await db
    .insert(users)
    .values({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
    })
    .returning({ id: users.id });

  // Note: .returning() returns an array, so we destructure the first element.
  if (user) {
    await logInUser(user.id);
  }
}

/**
 * 회원가입 메인 함수
 */
export async function createAccount(prevState: any, formData: FormData) {
  // Request 처리: 검증
  const validationResult = await validateCreateAccountRequest(formData);
  if (!validationResult.success) {
    return validationResult.error;
  }

  // Response 처리: DB 저장 및 로그인
  await createAccountResponse(validationResult.data);
}

