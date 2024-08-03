import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [stack, setStack] = useState('');
  const [stacks, setStacks] = useState([]);
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [repoStats, setRepoStats] = useState({ totalRepos: 0, stackUpdates: {} });

  // Fetch user repositories
  const fetchUserRepositories = async () => {
    try {
      const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`);
      console.log('Fetched User Repositories:', reposResponse.data);
      setRepos(reposResponse.data);
      setRepoStats((prevStats) => ({ ...prevStats, totalRepos: reposResponse.data.length }));
    } catch (error) {
      console.error('Error fetching user repositories:', error);
    }
  };

  // Calculate stack percentage in a repository
  const calculateStackPercentage = async (repo, stack) => {
    try {
      const languagesResponse = await axios.get(repo.languages_url);
      const totalBytes = Object.values(languagesResponse.data).reduce((acc, value) => acc + value, 0);
      const stackBytes = languagesResponse.data[stack] || 0;
      const percentage = (stackBytes / totalBytes) * 100;
      return percentage.toFixed(2);
    } catch (error) {
      console.error(`Error fetching languages for repo ${repo.name}:`, error);
      return 0;
    }
  };

  // Fetch commits for a repository
  const fetchCommits = async (repo) => {
    try {
      const commitsResponse = await axios.get(`${repo.commits_url.replace('{/sha}', '')}?per_page=1`);
      return commitsResponse.data.length;
    } catch (error) {
      console.error(`Error fetching commits for repo ${repo.name}:`, error);
      return 0;
    }
  };

  // Filter repositories by stacks and gather stats
  const filterRepositoriesByStacks = async (repos) => {
    const filtered = [];
    const stackUpdates = {};
    
    for (const stack of stacks) {
      stackUpdates[stack] = { reposCount: 0, totalCommits: 0 };
    }

    for (const repo of repos) {
      for (const stack of stacks) {
        const percentage = await calculateStackPercentage(repo, stack);
        if (percentage > 0) {
          const commitsCount = await fetchCommits(repo);
          stackUpdates[stack].reposCount += 1;
          stackUpdates[stack].totalCommits += commitsCount;
          
          filtered.push({
            ...repo,
            stack,
            stackPercentage: percentage,
            commitsCount
          });
          break; // Once a stack is found, stop checking other stacks
        }
      }
    }

    console.log('Filtered Repositories:', filtered);
    console.log('Stack Updates:', stackUpdates);
    setFilteredRepos(filtered);
    setRepoStats((prevStats) => ({ ...prevStats, stackUpdates }));
  };

  // Handle fetch data button click
  const handleFetchData = async () => {
    if (username && stacks.length > 0) {
      await fetchUserRepositories();
      await filterRepositoriesByStacks(repos);
    }
  };

  // Handle add stack button click
  const handleAddStack = () => {
    if (stack && !stacks.includes(stack)) {
      setStacks([...stacks, stack]);
      setStack(''); // Clear input after adding
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GitHub Repository Language Tracker</h1>
        <input
          type="text"
          placeholder="GitHub Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Preferred Language"
          value={stack}
          onChange={(e) => setStack(e.target.value)}
        />
        <button onClick={handleAddStack}>Add Stack</button>
        <button onClick={handleFetchData}>Fetch Repositories</button>
        <div className="stack-container">
          {stacks.map((s, index) => (
            <div key={index} className="stack-box">{s}</div>
          ))}
        </div>
        {username && <div className="username-box">{username}</div>}
        <div className="repo-container">
          {filteredRepos.map((repo) => (
            <div key={repo.id} className="repo-card">
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-link">
                <h2 className="repo-name">{repo.name}</h2>
                <p className="repo-description">{repo.description || 'No description available'}</p>
                <p className="repo-stack-percentage">
                  {repo.stack.charAt(0).toUpperCase() + repo.stack.slice(1)} Usage: {repo.stackPercentage}%
                </p>
                <p className="repo-commits">
                  Commits: {repo.commitsCount}
                </p>
              </a>
            </div>
          ))}
        </div>
        <div className="stats-box">
          <h2>Repository Stats</h2>
          <p>Total Repositories: {repoStats.totalRepos}</p>
          {Object.keys(repoStats.stackUpdates).map(stack => (
            <div key={stack}>
              <h3>{stack.charAt(0).toUpperCase() + stack.slice(1)} Stack</h3>
              <p>Repositories Count: {repoStats.stackUpdates[stack].reposCount}</p>
              <p>Total Commits: {repoStats.stackUpdates[stack].totalCommits}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
