const axios = require('axios');
const { google } = require('googleapis');
const key = require('./keyfile.json');

async function listInvitations(account) {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/invitations`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data.invitations;
}

async function acceptInvitation(invitation) {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${invitation.name}:accept`;
  const resp = await axios.post(url, null, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data;
}

async function acceptInvitations(account) {
  const invitations = await listInvitations(account);
  invitations.forEach(async invitation => {
    await acceptInvitation(invitation);
  });
}

async function getLocations(account) {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?readMask=name,categories.primaryCategory,serviceArea,storefrontAddress`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data.locations;
}

async function getCategories() {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/categories?regionCode=IT&languageCode=it&view=BASIC`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data.categories;
}

async function getAccounts() {
  const token = await authenticate();
  const url = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data.accounts;
}

async function getReviews(accountId, locationId) {
  const token = await authenticate();
  const url = `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data.reviews;
}

async function authenticate() {
  const scopes = [
    'https://www.googleapis.com/auth/business.manage'
  ];

  const jwt = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    subject: 'google-my-business@helical-study-426812-f4.iam.gserviceaccount.com',
    scopes
  });

  const resp = await jwt.authorize();
  return resp.access_token.replace(/\.{2,}/g, '');
}

function error() {
  console.error('Usage: node gmb.js <action>');
  console.error('  action: accept-invitations, accounts-list, locations-list, reviews-list categories-list');
  process.exit(1);
}

async function main() {
  if (process.argv.length < 3) {
    error();
  }

  const accounts = await getAccounts();
  switch (process.argv[2]) {
    case 'accept-invitations':
      accounts.forEach(async account => {
        await acceptInvitations(account.name);
      });
      console.log('Invitations accepted');
      process.exit(0);
      break;
    case 'accounts-list':
      console.table(accounts);
      process.exit(0);
      break;
    case 'locations-list':
      for (let i = 0; i < accounts.length; i++) {
        const locations = await getLocations(accounts[i].name);
        if (!locations) continue;
        console.log(JSON.stringify(locations));
      }
      process.exit(0);
      break;
    case 'categories-list':
      for (let i = 0; i < accounts.length; i++) {
        const locations = await getCategories();
        if (!locations) continue;
        console.log(JSON.stringify(locations));
      }
      process.exit(0);
      break;
    case 'reviews-list':
      for (let i = 0; i < accounts.length; i++) {
        const locations = await getLocations(accounts[i].name);
        if (!locations) continue;
        for (let j = 0; j < locations.length; j++) {
          const reviews = await getReviews(accounts[i].name, locations[j].name);
          console.log(reviews);
        }
      }
      process.exit(0);
      break;

    default:
      error();
      break;
  }

}

main();