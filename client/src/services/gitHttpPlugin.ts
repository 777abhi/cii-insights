import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { Buffer } from 'buffer';

export const capacitorHttpPlugin = {
  async request({ url, method, headers, body }: { url: string; method: string; headers: any; body: any }) {
    let data: string | undefined = undefined;

    if (body) {
      const chunks: any[] = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      data = Buffer.concat(chunks).toString('utf8');
    }

    try {
      const response: HttpResponse = await CapacitorHttp.request({
        url,
        method,
        headers,
        data,
        responseType: 'arraybuffer'
      });

      let responseBody: Buffer;
      if (typeof response.data === 'string') {
        responseBody = Buffer.from(response.data, 'base64');
      } else if (typeof response.data === 'object') {
          responseBody = Buffer.from(JSON.stringify(response.data));
      } else {
        responseBody = Buffer.from(response.data);
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
