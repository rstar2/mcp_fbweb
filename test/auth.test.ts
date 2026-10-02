import {describe, it, before, after} from "node:test";
import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

// Set XDG_CACHE_HOME to a temp directory for testing
const testCacheDir = path.join(os.tmpdir(), `fileflex_mcp_test_${Date.now()}`);
process.env.XDG_CACHE_HOME = testCacheDir;

const clientId = process.env.FBWEB_AUTH_CLIENT_ID;
const rootRefreshToken = process.env.FBWEB_AUTH_REFRESH_TOKEN;

import * as authModule from "../src/lib/auth.js";

// Clear auth state before each test
function clearAuthState() {
    authModule.clearAuth();
}

describe("auth store/restore", () => {
    let cacheDir: string;
    let authFilePath: string;

    before(async () => {
        cacheDir = path.join(testCacheDir, "fileflex_mcp");
        authFilePath = path.join(cacheDir, "auth.json");
    });

    after(async () => {
        // Clean up test directory
        try {
            await fs.rm(testCacheDir, {recursive: true, force: true});
        } catch {
            // Ignore cleanup errors
        }
    });

    it("storeAuth creates file and directory if not exists", async () => {
        clearAuthState();

        const testAuth = {
            accessToken: "test-access-token-1",
            refreshToken: "test-refresh-token-1",
            uid: "test-uid-1",
        };

        await authModule.storeAuth(testAuth);

        // Verify file was created
        const fileExists = await fs
            .access(authFilePath)
            .then(() => true)
            .catch(() => false);
        assert.strictEqual(fileExists, true);

        // Verify file content
        const content = await fs.readFile(authFilePath, "utf-8");
        const parsed = JSON.parse(content);
        assert.ok(Array.isArray(parsed));
        assert.strictEqual(parsed.length, 1);
        assert.strictEqual(parsed[0].clientId, clientId);
        assert.strictEqual(parsed[0].rootRefreshToken, rootRefreshToken);
        assert.strictEqual(parsed[0].accessToken, "test-access-token-1");
        assert.strictEqual(parsed[0].refreshToken, "test-refresh-token-1");
        assert.strictEqual(parsed[0].uid, "test-uid-1");
    });

    it("storeAuth updates existing entry for same client", async () => {
        clearAuthState();

        const testAuth1 = {
            accessToken: "access-1",
            refreshToken: "refresh-1",
            uid: "uid-1",
        };

        const testAuth2 = {
            accessToken: "access-2",
            refreshToken: "refresh-2",
            uid: "uid-2",
        };

        // Store first auth
        await authModule.storeAuth(testAuth1);

        // Store second auth (should update, not add)
        await authModule.storeAuth(testAuth2);

        // Verify only one entry exists
        const content = await fs.readFile(authFilePath, "utf-8");
        const parsed = JSON.parse(content);
        assert.ok(Array.isArray(parsed));
        assert.strictEqual(parsed.length, 1);
        assert.strictEqual(parsed[0].accessToken, "access-2");
        assert.strictEqual(parsed[0].refreshToken, "refresh-2");
        assert.strictEqual(parsed[0].uid, "uid-2");
    });

    it("storeAuth adds new entry for different client", async () => {
        clearAuthState();

        // Create file manually with multiple auth entries
        const multipleAuths = [
            {
                clientId,
                rootRefreshToken,
                accessToken: "access-1",
                refreshToken: "refresh-1",
                uid: "uid-1",
            },
            {
                clientId: "other-client-id",
                rootRefreshToken: "other-refresh-token",
                accessToken: "other-access",
                refreshToken: "other-refresh",
                uid: "other-uid",
            },
        ];

        await fs.mkdir(cacheDir, {recursive: true});
        await fs.writeFile(authFilePath, JSON.stringify(multipleAuths, null, 2));

        // Now store auth for the test client - should update, not add
        const testAuth = {
            accessToken: "updated-access",
            refreshToken: "updated-refresh",
            uid: "updated-uid",
        };

        await authModule.storeAuth(testAuth);

        // Verify we still have 2 entries (updated first one)
        const content = await fs.readFile(authFilePath, "utf-8");
        const parsed = JSON.parse(content);
        assert.ok(Array.isArray(parsed));
        assert.strictEqual(parsed.length, 2);

        // Verify the test client's entry was updated
        const testClientEntry = parsed.find(
            (a: any) =>
                a.clientId === clientId &&
                a.rootRefreshToken === rootRefreshToken,
        );
        assert.strictEqual(testClientEntry.accessToken, "updated-access");
    });

    it("restoreAuth loads auth for matching client", async () => {
        clearAuthState();

        const testAuth = {
            accessToken: "restore-access-token",
            refreshToken: "restore-refresh-token",
            uid: "restore-uid",
        };

        // Store auth
        await authModule.storeAuth(testAuth);

        // Clear in-memory auth
        clearAuthState();

        // Restore from file
        await authModule.restoreAuth();

        // Verify auth was loaded via getAccessToken
        const accessToken = await authModule.getAccessToken();
        assert.strictEqual(accessToken, "restore-access-token");
    });

    it("restoreAuth does nothing when file doesn't exist", async () => {
        clearAuthState();

        // Delete auth file if it exists
        try {
            await fs.rm(cacheDir, {recursive: true, force: true});
        } catch {
            // Ignore
        }

        // Should not throw
        await assert.doesNotReject(authModule.restoreAuth());

        // getAccessToken should throw since no auth is loaded
        await assert.rejects(
            async () => await authModule.getAccessToken(),
            /Not authorized/,
        );
    });

    it("restoreAuth finds correct auth when multiple exist", async () => {
        clearAuthState();

        // Clear and create new file with multiple auths
        await fs.rm(cacheDir, {recursive: true, force: true});
        await fs.mkdir(cacheDir, {recursive: true});

        const multipleAuths = [
            {
                clientId: "other-client-1",
                rootRefreshToken: "other-refresh-1",
                accessToken: "other-access-1",
                refreshToken: "other-token-1",
                uid: "other-uid-1",
            },
            {
                clientId,
                rootRefreshToken,
                accessToken: "correct-access-token",
                refreshToken: "correct-refresh-token",
                uid: "correct-uid",
            },
            {
                clientId: "other-client-2",
                rootRefreshToken: "other-refresh-2",
                accessToken: "other-access-2",
                refreshToken: "other-token-2",
                uid: "other-uid-2",
            },
        ];

        await fs.writeFile(
            authFilePath,
            JSON.stringify(multipleAuths, null, 2),
            "utf-8",
        );

        // Restore should find the matching auth
        await authModule.restoreAuth();

        const accessToken = await authModule.getAccessToken();
        assert.strictEqual(accessToken, "correct-access-token");
    });

    it("file has owner-only read/write permissions", async () => {
        clearAuthState();

        const testAuth = {
            accessToken: "permissions-test",
            refreshToken: "permissions-refresh",
            uid: "permissions-uid",
        };

        await authModule.storeAuth(testAuth);

        // Check file permissions
        const stats = await fs.stat(authFilePath);
        // On Windows, mode might be different, so we check on Unix-like systems
        if (os.platform() !== "win32") {
            const mode = stats.mode & 0o777;
            // Owner should have read (0o400) and write (0o200) permissions
            assert.ok(mode & 0o400, "Owner should have read permission");
            assert.ok(mode & 0o200, "Owner should have write permission");
        }
    });

    it("restoreAuth handles invalid JSON gracefully", async () => {
        clearAuthState();

        // Create file with invalid JSON
        await fs.mkdir(cacheDir, {recursive: true});
        await fs.writeFile(authFilePath, "invalid json {{", "utf-8");

        // Should not throw
        await assert.doesNotReject(authModule.restoreAuth());

        // getAccessToken should throw since no auth is loaded
        await assert.rejects(
            async () => await authModule.getAccessToken(),
            /Not authorized/,
        );
    });
});
