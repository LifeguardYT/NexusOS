import { getUncachableGitHubClient } from '../server/github';

async function createRepo() {
  try {
    const octokit = await getUncachableGitHubClient();
    const response = await octokit.repos.createForAuthenticatedUser({
      name: 'NexusOS',
      description: 'A web-based operating system simulation built with React and TypeScript',
      private: false,
      auto_init: false
    });
    console.log('Repository created successfully!');
    console.log('URL:', response.data.html_url);
    console.log('Clone URL:', response.data.clone_url);
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data));
    }
  }
}

createRepo();
