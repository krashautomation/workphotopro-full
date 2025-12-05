/**
 * Test Appwrite Connection from React Native
 * 
 * This utility can be imported and called from your app to test connectivity
 */

import { account } from './client';

export interface ConnectionTestResult {
  success: boolean;
  endpoint: string;
  duration: number;
  error?: string;
  statusCode?: number;
}

/**
 * Test if Appwrite is accessible by attempting to get current user
 * This will fail gracefully if not authenticated, but will succeed if Appwrite is reachable
 */
export async function testAppwriteConnection(): Promise<ConnectionTestResult> {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Appwrite connection...');
    console.log('📍 Endpoint:', endpoint);
    
    // Try to get current user (will fail if not authenticated, but that's OK)
    // The important thing is whether the request completes or times out
    const user = await Promise.race([
      account.get(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
      }),
    ]);
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Appwrite connection test PASSED');
    console.log(`   Response time: ${duration}ms`);
    console.log(`   User: ${user ? user.email : 'Not authenticated (expected)'}`);
    
    return {
      success: true,
      endpoint,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Check if it's a timeout (connection issue) or auth error (connection OK)
    const isTimeout = error?.message?.includes('timeout');
    const isAuthError = error?.code === 401 || error?.message?.includes('401');
    
    if (isTimeout) {
      console.error('❌ Appwrite connection test FAILED - Timeout');
      console.error(`   Duration: ${duration}ms`);
      console.error('   ⚠️  Appwrite appears to be DOWN or unreachable!');
      
      return {
        success: false,
        endpoint,
        duration,
        error: 'Connection timeout - Appwrite may be down',
      };
    } else if (isAuthError) {
      // 401 means the server is reachable, just not authenticated
      console.log('✅ Appwrite connection test PASSED (401 = server reachable)');
      console.log(`   Response time: ${duration}ms`);
      
      return {
        success: true,
        endpoint,
        duration,
        statusCode: 401,
      };
    } else {
      console.error('❌ Appwrite connection test FAILED');
      console.error(`   Error: ${error?.message || error}`);
      console.error(`   Duration: ${duration}ms`);
      
      return {
        success: false,
        endpoint,
        duration,
        error: error?.message || 'Unknown error',
      };
    }
  }
}

/**
 * Test Appwrite health endpoint directly via fetch
 */
export async function testAppwriteHealth(): Promise<ConnectionTestResult> {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
  const healthUrl = `${endpoint}/health`;
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Appwrite health endpoint...');
    console.log('📍 URL:', healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    const isSuccess = response.ok;
    
    if (isSuccess) {
      console.log('✅ Appwrite health check PASSED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response time: ${duration}ms`);
    } else {
      console.log('⚠️  Appwrite health check returned non-200 status');
      console.log(`   Status: ${response.status}`);
    }
    
    return {
      success: isSuccess,
      endpoint,
      duration,
      statusCode: response.status,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.error('❌ Appwrite health check FAILED - Timeout');
      console.error(`   Duration: ${duration}ms`);
      console.error('   ⚠️  Appwrite appears to be DOWN or unreachable!');
      
      return {
        success: false,
        endpoint,
        duration,
        error: 'Request timeout - Appwrite may be down',
      };
    } else {
      console.error('❌ Appwrite health check FAILED');
      console.error(`   Error: ${error?.message || error}`);
      
      return {
        success: false,
        endpoint,
        duration,
        error: error?.message || 'Unknown error',
      };
    }
  }
}
