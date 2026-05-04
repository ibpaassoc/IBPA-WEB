import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), "app/backend/.env"),
});

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: false,
});

dotenv.config({
  path: path.resolve(process.cwd(), "apps/backend/.env"),
  override: false,
});
