const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking for missing dependencies...');

// List of essential devDependencies to check
const essentialDevDependencies = [
  'vite-tsconfig-paths',
  '@types/node'
];

try {
  // Check for package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found!');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devDependencies = packageJson.devDependencies || {};

  // Identify missing dependencies
  const missingDeps = essentialDevDependencies.filter(dep => !devDependencies[dep]);

  if (missingDeps.length === 0) {
    console.log('✅ All essential dependencies are installed.');
    process.exit(0);
  }

  console.log(`Missing dependencies: ${missingDeps.join(', ')}`);
  console.log('Installing missing dependencies...');

  // Choose the right package manager based on what's available
  const useYarn = fs.existsSync(path.join(__dirname, 'yarn.lock'));
  const useNpm = fs.existsSync(path.join(__dirname, 'package-lock.json'));

  const installCmd = useYarn
    ? `yarn add ${missingDeps.join(' ')} --dev`
    : useNpm
      ? `npm install ${missingDeps.join(' ')} --save-dev`
      : `npm install ${missingDeps.join(' ')} --save-dev`;

  console.log(`Executing: ${installCmd}`);
  execSync(installCmd, { stdio: 'inherit' });

  console.log('✅ Missing dependencies installed successfully!');
  console.log('You can now start the development server with "npm run dev" or "yarn dev"');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  console.log('\nPlease manually install the following dependencies:');
  console.log(`npm install vite-tsconfig-paths --save-dev`);
  process.exit(1);
}
