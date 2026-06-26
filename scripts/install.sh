#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const runCommand = (command, cwd) => {
  try {
    execSync(command, { stdio: 'inherit', cwd })
  } catch (error) {
    console.error(`Error running ${command}:`, error)
    process.exit(1)
  }
}

const main = () => {
  const projectRoot = path.join(__dirname, '..')
  
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  if (majorVersion < 20) {
    console.log('Node.js version 20+ is required')
    console.log('Please update Node.js')
    process.exit(1)
  }

  console.log('Building WQS IMS Application...')

  const packages = [
    'npm:install',
    'npm:scripts',
    'cargo:release',
    'tauri:build',
  ]

  packages.forEach((packageName) => {
    const [manager, command] = packageName.split(':')
    if (manager === 'npm') {
      runCommand(`npm run ${command}`, projectRoot)
    } else if (manager === 'cargo') {
      runCommand(`cargo ${command}`, projectRoot)
    }
  })

  console.log('\nBuild completed successfully!')
  console.log('\nNext steps:')
  console.log('1. Test the application locally with: cargo tauri dev')
  console.log('2. Build Windows installer with: cargo tauri build --release')
  console.log('3. Upload to desired repository or S3 for distribution')
}

main()