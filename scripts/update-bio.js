const axios = require('axios');
const fs = require('fs');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

if (!GITHUB_USERNAME) {
  console.error('Error: GITHUB_USERNAME environment variable is not set.');
  process.exit(1);
}

const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;
const BIO_FILE_PATH = '_data/bio.json';

async function updateBio() {
  try {
    console.log(`Fetching GitHub profile data for ${GITHUB_USERNAME}...`);
    const response = await axios.get(GITHUB_API_URL);
    const githubData = response.data;
    console.log('GitHub profile data fetched successfully.');

    console.log(`Reading existing bio data from ${BIO_FILE_PATH}...`);
    let bioData;
    try {
      const fileContent = fs.readFileSync(BIO_FILE_PATH, 'utf8');
      bioData = JSON.parse(fileContent);
      console.log('Existing bio data read and parsed successfully.');
    } catch (error) {
      console.error(`Error reading or parsing ${BIO_FILE_PATH}:`, error.message);
      console.log('Creating a new bio object as the file does not exist or is invalid.');
      // Initialize with a basic structure if the file doesn't exist or is invalid
      bioData = {
        basics: {
          name: '',
          label: '',
          image: '',
          email: '',
          phone: '',
          url: '',
          summary: '',
          location: {
            address: '',
            postalCode: '',
            city: '',
            countryCode: '',
            region: ''
          },
          profiles: [
            {
              network: 'Github',
              username: '',
              url: ''
            }
          ]
        },
        // Add other top-level keys if your schema expects them e.g., work: [], volunteer: [], etc.
      };
    }

    console.log('Updating bio data with GitHub profile information...');
    bioData.basics.name = githubData.name || bioData.basics.name;
    bioData.basics.picture = githubData.avatar_url || bioData.basics.picture; // Use basics.picture
    bioData.basics.summary = githubData.bio || bioData.basics.summary;
    bioData.basics.website = githubData.blog || bioData.basics.website;
    bioData.basics.public_repos = githubData.public_repos; // New field

    if (!bioData.basics.profiles) {
      bioData.basics.profiles = [];
    }

    let githubProfile = bioData.basics.profiles.find(p => p.network && p.network.toLowerCase() === 'github');

    if (!githubProfile) {
      githubProfile = { network: 'Github' }; // Standardized to 'Github'
      bioData.basics.profiles.push(githubProfile);
    }

    githubProfile.username = githubData.login;
    githubProfile.url = githubData.html_url;
    console.log('Bio data updated.');

    console.log(`Writing updated bio data to ${BIO_FILE_PATH}...`);
    fs.writeFileSync(BIO_FILE_PATH, JSON.stringify(bioData, null, 2));
    console.log(`${BIO_FILE_PATH} updated successfully.`);

  } catch (error) {
    if (error.response) {
      console.error(`Error fetching data from GitHub API: ${error.response.status} ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('Error making request to GitHub API:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

updateBio();
