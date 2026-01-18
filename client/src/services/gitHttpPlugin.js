import { CapacitorHttp } from '@capacitor/core';
import { Buffer } from 'buffer';

export const capacitorHttpPlugin = {
  async request({ url, method, headers, body }) {
    let data = null;

    // Handle request body (for push operations)
    if (body) {
      const chunks = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      // Convert buffer to base64 string for CapacitorHttp
      data = Buffer.concat(chunks).toString('base64');
    }

    // Determine if we are authenticated (headers might contain Authorization)
    // CapacitorHttp handles headers fine.

    try {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data,
        // We request arraybuffer (blob) to handle binary git packfiles correctly
        responseType: 'arraybuffer'
      });

      // Capacitor returns binary data as base64 string when responseType is arraybuffer/blob
      let responseBody = response.data;
      if (typeof responseBody === 'string') {
        responseBody = Buffer.from(responseBody, 'base64');
      } else {
          // If it's somehow not a string (e.g. JSON object automatically parsed?), handle it.
          // For git, we expect binary.
          if (typeof responseBody === 'object') {
              responseBody = Buffer.from(JSON.stringify(responseBody));
          }
      }

      return {
        url,
        method,
        headers: response.headers,
        statusCode: response.status,
        statusMessage: 'OK',
        body: [responseBody] // Return as an array (iterable) of Uint8Array/Buffer
      };
    } catch (error) {
      console.error('Git HTTP Plugin Error:', error);
      throw error;
    }
  }
};
