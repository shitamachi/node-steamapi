#!/usr/bin/env node

/**
 * Build script to inject version information from package.json into version.ts
 * This replaces the need for dynamic require() calls in WASM environments
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  try {
    // Read package.json
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Read the version.ts template
    const versionTsPath = join(__dirname, '..', 'src', 'version.ts');
    let versionContent = readFileSync(versionTsPath, 'utf8');
    
    // Replace the version and name placeholders
    versionContent = versionContent.replace(
      /export const version = ['"]UNKNOWN['"];/,
      `export const version = '${packageJson.version}';`
    );
    
    versionContent = versionContent.replace(
      /export const name = ['"]steamapi['"];/,
      `export const name = '${packageJson.name}';`
    );
    
    // Write back the modified content
    writeFileSync(versionTsPath, versionContent, 'utf8');
    
    console.log(`✅ Version injected: ${packageJson.name}@${packageJson.version}`);
    
  } catch (error) {
    console.error('❌ Failed to inject version:', error.message);
    process.exit(1);
  }
}

main(); 