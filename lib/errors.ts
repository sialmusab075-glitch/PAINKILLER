import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "AppError";
  }
}

export const badRequest = (message: string) => new AppError(400, message);
export const unauthorized = (message = "Sign in to continue.") => new AppError(401, message);
export const paymentRequired = (message: string) => new AppError(402, message);
export const conflict = (message: string) => new AppError(409, message);

/** Convert any thrown value into a JSON response without leaking internals. */
export function toResponse(error: unknown, fallbackMessage = "Something went wrong.") {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.publicMessage }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
