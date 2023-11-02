import { Octokit } from 'octokit';

// Create an Octokit instance by providing your GitHub personal access token or authentication method.
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
});

async function getReleaseStatistics(owner: string, repo: string) {
  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
    });

    const releaseMetrics = releases.map((release) => ({
      ReleaseName: release.name,
      ReleaseTag: release.tag_name,
      PublishedAt: release.published_at,
      ReleaseNotes: release.body,
      Assets: release.assets.map((asset) => ({
        AssetName: asset.name,
        AssetSize: asset.size,
      })),
    }));

    console.log('Release Statistics:');
    console.table(releaseMetrics);
    console.log('Total Number of Releases:', releases.length);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace 'OWNER' and 'REPO' with your GitHub repository's owner and name.
getReleaseStatistics('OWNER', 'REPO');
