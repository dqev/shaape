import React, { useEffect, useState } from 'react';

export const GitHubStarBtn: React.FC = () => {
  const [starCount, setStarCount] = useState<string>('1');

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('github_stars_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.time < 300000 && parsed.count !== undefined) {
          setStarCount(parsed.count);
          return;
        }
      }
    } catch (e) {}

    fetch('https://api.github.com/repos/dqev/shaape')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          const count =
            data.stargazers_count >= 1000
              ? (data.stargazers_count / 1000).toFixed(1) + 'k'
              : String(data.stargazers_count);
          setStarCount(count);
          try {
            sessionStorage.setItem(
              'github_stars_cache',
              JSON.stringify({ count, time: Date.now() })
            );
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href="https://github.com/dqev/shaape"
      target="_blank"
      rel="noopener noreferrer"
      className="header-github-btn"
      aria-label="Star dqev/shaape on GitHub"
      title="Star dqev/shaape on GitHub"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
      <span className="github-star-divider" aria-hidden="true"></span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="github-star-icon"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span className="github-star-count" id="githubStarCount">{starCount}</span>
    </a>
  );
};

export default GitHubStarBtn;
