import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken || accessToken.trim() === "") {
  throw new Error(
    "Environment variable of polar must be set and non-empty before initializing the Polar client.",
  );
}

export const polarClient = new Polar({
  server: process.env.POLAR_SERVER as "production" | "sandbox",
  accessToken,
});
