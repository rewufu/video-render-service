const jobs = new Map();

function now() {
  return Date.now();
}

function createJob(type, payload) {
  const id = require("uuid").v4();
  const job = {
    id,
    type, // renderPage
    status: "queued", // queued | running | done | failed
    progress: 0,
    payload,
    result: null,
    error: null,
    createdAt: now(),
    updatedAt: now(),
  };
  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function patchJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  const next = { ...job, ...patch, updatedAt: now() };
  jobs.set(id, next);
  return next;
}

module.exports = { createJob, getJob, patchJob };
