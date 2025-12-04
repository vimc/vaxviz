import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./tests/unit/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
