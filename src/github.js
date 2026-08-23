const API_ROOT = "https://api.github.com";

function assertRepository(repo) {
  if (!/^[^/]+\/[^/]+$/.test(repo || "")) {
    throw new Error("Repository must use the owner/name format.");
  }
}

async function requestGitHub(path, { token, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${API_ROOT}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${detail || response.statusText}`);
  }

  return response.json();
}

export async function listGitHubIssues(repo, options = {}) {
  assertRepository(repo);
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
  const params = new URLSearchParams({ state: options.state || "open", per_page: "100" });
  const items = await requestGitHub(`/repos/${repo}/issues?${params}`, options);

  return items
    .filter((item) => !item.pull_request)
    .slice(0, limit)
    .map((item) => ({
      number: item.number,
      title: item.title,
      body: item.body || "",
      url: item.html_url,
      author: item.user?.login || "unknown",
      labels: (item.labels || []).map((label) => label.name)
    }));
}

export async function listGitHubPullRequests(repo, options = {}) {
  assertRepository(repo);
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
  const params = new URLSearchParams({ state: options.state || "open", per_page: String(limit) });
  const pulls = await requestGitHub(`/repos/${repo}/pulls?${params}`, options);

  return Promise.all(pulls.slice(0, limit).map(async (pull) => {
    const files = await requestGitHub(`/repos/${repo}/pulls/${pull.number}/files?per_page=100`, options);
    return {
      number: pull.number,
      title: pull.title,
      body: pull.body || "",
      url: pull.html_url,
      author: pull.user?.login || "unknown",
      files: files.map((file) => file.filename)
    };
  }));
}
