import fs from 'fs';
import path from 'path';

const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'public', '.vercel'];
const ALLOWED_EXTS = ['.js', '.jsx', '.css', '.html', '.json', '.sql', '.md'];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!IGNORE_DIRS.includes(f)) {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const outputFile = path.join(process.cwd(), 'full_project_context.txt');
fs.writeFileSync(outputFile, 'Project Context Dump\n\n');

walkDir(process.cwd(), (filePath) => {
  const ext = path.extname(filePath);
  if (ALLOWED_EXTS.includes(ext) || path.basename(filePath) === '.env.example') {
    // skip this script itself
    if (path.basename(filePath) === 'generate_context.js') return;
    if (path.basename(filePath) === 'full_project_context.txt') return;
    if (path.basename(filePath) === 'package-lock.json') return;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      fs.appendFileSync(outputFile, `\n\n---\nFile: ${relativePath}\n---\n\n`);
      fs.appendFileSync(outputFile, content);
    } catch (e) {
      console.error(`Could not read file: ${filePath}`);
    }
  }
});

console.log('Successfully generated full_project_context.txt');
