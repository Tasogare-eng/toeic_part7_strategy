import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock environment variables
vi.stubEnv("OPENAI_API_KEY", "test-api-key")
vi.stubEnv("OPENAI_MODEL", "gpt-4-turbo-preview")
vi.stubEnv("OPENAI_MAX_TOKENS", "4000")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")
