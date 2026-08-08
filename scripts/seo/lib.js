/**
 * Shared DataForSEO helpers for PhotoVault SEO scripts.
 * Enforces: per-task status checking, spend printing, hard spend cap.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const RAW_DIR = path.join(ROOT, 'docs', 'seo', 'raw');

function loadEnv() {
  const raw = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv();
const AUTH = Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`).toString('base64');

function makeClient({ maxSpend = 15.0, quiet = false } = {}) {
  let spent = 0;
  return {
    spent: () => spent,
    /**
     * opts.okStatuses  — additional acceptable task status codes (e.g. 20100 "Task Created."
     *                    which Standard/async endpoints return with a null result).
     * opts.returnTask  — resolve with the whole task object instead of task.result
     *                    (needed for task_post, where the id lives on the task).
     */
    async post(endpoint, payload, label, opts = {}) {
      const { okStatuses = [], returnTask = false } = opts;
      if (spent >= maxSpend) {
        throw new Error(`ABORT: spend cap $${maxSpend} reached ($${spent.toFixed(4)})`);
      }
      const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      const task = (json.tasks || [])[0] || {};
      const statusOk = task.status_code === 20000 || okStatuses.includes(task.status_code);
      // Top-level can read 20000 Ok while the task itself failed. Check both, always.
      // A result is required only for statuses that are supposed to carry one.
      if (json.status_code !== 20000 || !statusOk || (task.status_code === 20000 && !task.result)) {
        throw new Error(
          `[${label}] top=${json.status_code} "${json.status_message}" | ` +
            `task=${task.status_code} "${task.status_message}"`
        );
      }
      spent += json.cost || 0;
      if (!quiet) {
        console.log(
          `  [${label}] $${(json.cost || 0).toFixed(4)} | total $${spent.toFixed(4)}`
        );
      }
      return returnTask ? task : task.result;
    },

    /** GET form, for endpoints like on_page/summary/{id} and appendix/user_data. */
    async get(endpoint, label, opts = {}) {
      const { okStatuses = [] } = opts;
      const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
        headers: { Authorization: `Basic ${AUTH}` },
      });
      const json = await res.json();
      const task = (json.tasks || [])[0] || {};
      const statusOk = task.status_code === 20000 || okStatuses.includes(task.status_code);
      if (json.status_code !== 20000 || !statusOk) {
        throw new Error(
          `[${label}] top=${json.status_code} "${json.status_message}" | ` +
            `task=${task.status_code} "${task.status_message}"`
        );
      }
      spent += json.cost || 0;
      if (!quiet && json.cost) {
        console.log(`  [${label}] $${json.cost.toFixed(4)} | total $${spent.toFixed(4)}`);
      }
      return task.result;
    },
  };
}

function save(name, data) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(path.join(RAW_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}
const load = (name) => JSON.parse(fs.readFileSync(path.join(RAW_DIR, `${name}.json`), 'utf8'));

const MADISON = { location_name: 'Madison,Wisconsin,United States', language_name: 'English' };
const USA = { location_code: 2840, language_code: 'en' };

module.exports = { makeClient, save, load, MADISON, USA, RAW_DIR, ROOT };
