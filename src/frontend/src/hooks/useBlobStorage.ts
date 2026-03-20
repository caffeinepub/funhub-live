import { HttpAgent } from "@icp-sdk/core/agent";
import { ExternalBlob } from "../backend";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

let storageClientPromise: Promise<{
  client: StorageClient;
  gatewayUrl: string;
}> | null = null;

async function getStorageClient() {
  if (!storageClientPromise) {
    storageClientPromise = loadConfig().then(async (config) => {
      const agent = await HttpAgent.create({
        host: config.backend_host || "https://icp-api.io",
      });
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      return { client, gatewayUrl: config.storage_gateway_url };
    });
  }
  return storageClientPromise;
}

export function useBlobStorage() {
  const uploadFile = async (file: File): Promise<string> => {
    const { client } = await getStorageClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes);
    const blobBytes = await blob.getBytes();
    const { hash } = await client.putFile(blobBytes);
    return hash;
  };

  const getUrl = (hash: string): string => {
    return `https://blob.caffeine.ai/v1/blob/${hash}`;
  };

  return { uploadFile, getUrl };
}
