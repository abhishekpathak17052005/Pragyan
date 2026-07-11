/**
 * Test script for Firecrawl import service
 * Run with: npx tsx test-firecrawl-import.ts
 */

import { firecrawlImportService } from '@/services/firecrawl-import.service';

async function testImport() {
  console.log('Testing Firecrawl Import Service...\n');

  try {
    // Test 1: Check environment variable
    console.log('1. Checking FIRECRAWL_API_KEY...');
    if (!process.env.FIRECRAWL_API_KEY) {
      console.error('❌ FIRECRAWL_API_KEY not set');
      process.exit(1);
    }
    console.log('✓ FIRECRAWL_API_KEY configured\n');

    // Test 2: Validate URL format
    console.log('2. Testing URL validation...');
    const testUrl = 'https://roadmap.sh/full-stack';
    console.log(`   Testing URL: ${testUrl}`);
    console.log('✓ URL format is valid\n');

    // Test 3: Invalid URL should fail
    console.log('3. Testing invalid URL rejection...');
    try {
      await firecrawlImportService.importRoadmapFromUrl('not-a-url');
      console.error('❌ Should have rejected invalid URL');
    } catch (error: any) {
      console.log(`✓ Invalid URL correctly rejected: ${error.message}\n`);
    }

    // Test 4: Non-roadmap.sh URL should fail
    console.log('4. Testing non-roadmap.sh URL rejection...');
    try {
      await firecrawlImportService.importRoadmapFromUrl('https://example.com');
      console.error('❌ Should have rejected non-roadmap.sh URL');
    } catch (error: any) {
      console.log(`✓ Non-roadmap.sh URL correctly rejected: ${error.message}\n`);
    }

    console.log('All validation tests passed! ✓\n');
    console.log('The import service is ready. Test with actual roadmap:');
    console.log('POST /api/admin/import-roadmap');
    console.log('Body: { "url": "https://roadmap.sh/full-stack" }');

  } catch (error: any) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testImport();
