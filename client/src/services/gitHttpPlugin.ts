import { CapacitorHttp } from '@capacitor/core';
import { Buffer } from 'buffer';

export const capacitorHttpPlugin = {
  async request({ url, method, headers, body }: { url: string; method: string; headers: Record<string, string>; body?: AsyncIterable<Uint8Array> }) {
    let data: string | null = null;

    if (body) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      data = Buffer.concat(chunks).toString('utf8');
    }

    try {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data: data || undefined,
        responseType: 'arraybuffer'
      });

      let responseBody: Buffer;
      // CapacitorHttp with responseType: 'arraybuffer' returns base64 string on Android/iOS usually
      if (typeof response.data === 'string') {
        responseBody = Buffer.from(response.data, 'base64');
      } else {
         // Web implementation might return ArrayBuffer directly
         responseBody = Buffer.from(response.data as any);
      }

      return {
        url,
        method,
        headers: response.headers,
        statusCode: response.status,
        statusMessage: response.status === 200 ? 'OK' : `HTTP ${response.status}`,
        body: [responseBody]
      };
    } catch (error) {
      console.error('Git HTTP Plugin Error:', error);
      throw error;
    }
  }
};
