import cafesData from "../data/cafes.json";
import { createApp } from "./app.ts";

// wrangler.jsonc의 run_worker_first 설정으로 /api/* 요청만 여기로 온다
export default createApp(() => cafesData);
