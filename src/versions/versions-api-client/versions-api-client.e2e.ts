import { BugSplatApiClient, UploadableFile } from '@common';
import { config } from '@spec/config';
import { postNativeCrashAndSymbols } from '@spec/files/native/post-native-crash';
import { VersionsApiClient } from '@versions';
import fs from 'fs';
import path from 'path';

describe('VersionsApiClient', () => {
    let client: VersionsApiClient;
    let database;
    let application;
    let version = '1.0.0';

    beforeEach(async () => {
        database = config.database;
        application = 'bugsplat-js-api-client';
        version = `${Math.random() * 1000000}`;

        const bugsplat = await BugSplatApiClient.createAuthenticatedClientForNode(
            config.email,
            config.password,
            config.host
        );

        await postNativeCrashAndSymbols(
            bugsplat,
            database,
            application,
            version
        );

        client = new VersionsApiClient(bugsplat);
    });

    describe('getVersions', () => {
        it('should return 200 with a list of versions', async () => {
            const result = await client.getVersions({ database });

            const row = result.rows.find(row => row.appName === application && row.version === version);
            expect(row).toBeTruthy();
            expect(row?.appName).toEqual(application);
            expect(row?.version).toEqual(version);
            expect(Number(row?.size)).toBeGreaterThan(0);
        });
    });

    describe('putFullDumps', () => {
        it('should return invalid permissions because account is not licensed', async () => {
            const result = await client.putFullDumps(
                database,
                application,
                version,
                true
            );
            const json = await result.json();

            expect(result.status).toEqual(403);
            expect(json.message).toEqual('Invalid permissions');
        });
    });

    describe('putRetired', () => {
        it('should return 200 for put with valid database, application, and version', async () => {
            const retired = true;
            
            const result = await client.putRetired(
                database,
                application,
                version,
                retired
            );
            const json = await result.json();

            expect(result.status).toEqual(200);
            expect(json.retired).toEqual(retired ? 1 : 0);
        });
    });

    describe('deleteSymbols', () => {
        it('should return 200 for delete with valid database, application and version', async () => {
            const response = await client.deleteSymbols(
                database,
                application,
                version
            );

            expect(response.status).toEqual(200);
        });
    });

    describe('postSymbols', () => {
        it('should return 200 for post with valid database, application, version and files', async () => {
            const filePath = './spec/files/js/index.js.map';
            const name = path.basename(filePath);
            const size = fs.statSync(filePath).size;
            const file = new UploadableFile(name, size, fs.createReadStream(filePath));
            const response = await client.postSymbols(
                database,
                application,
                version,
                [file]
            );

            expect(response[0].status).toEqual(200);
        });
    });
});