/**
 * Script to kill process on port 3000 (Windows)
 * Usage: node scripts/kill-port.js [port]
 */

const { exec } = require('child_process');
const port = process.argv[2] || '3000';

console.log(`🔍 Checking for process on port ${port}...`);

// Find process using the port
exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
  if (error) {
    console.log(`✅ Port ${port} is free (no process found)`);
    process.exit(0);
  }

  if (stdout) {
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`✅ Port ${port} is free`);
      process.exit(0);
    }

    console.log(`⚠️  Found ${pids.size} process(es) using port ${port}:`);
    pids.forEach(pid => console.log(`   PID: ${pid}`));

    // Kill all processes
    let killedCount = 0;
    const totalPids = pids.size;
    
    pids.forEach(pid => {
      console.log(`🔪 Killing process ${pid}...`);
      exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
        killedCount++;
        if (killError) {
          console.error(`❌ Failed to kill process ${pid}: ${killError.message}`);
        } else {
          console.log(`✅ Process ${pid} killed successfully`);
        }
        
        // Check after all kills are attempted
        if (killedCount === totalPids) {
          setTimeout(() => {
            exec(`netstat -ano | findstr :${port}`, (checkError, checkStdout) => {
              if (checkError || !checkStdout) {
                console.log(`\n✅ Port ${port} is now free!`);
                process.exit(0);
              } else {
                console.log(`\n⚠️  Port ${port} may still be in use. Please check manually.`);
                process.exit(1);
              }
            });
          }, 1500);
        }
      });
    });
  } else {
    console.log(`✅ Port ${port} is free`);
    process.exit(0);
  }
});

