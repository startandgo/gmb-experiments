const axios = require('axios');
const { google } = require('googleapis');
const key = require('./keyfile.json');

function generateUpdateMask(object) {
  const attributes = Object.keys(object)
  return attributes.length > 0
      ? attributes.reduce((actualMask, attribute, index) => (index === 0 ? attribute : `${actualMask},${attribute}`))
      : ''
}

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
  for await (const invitation of invitations) {
    const response = await acceptInvitation(invitation);
    console.log(response);
  }
}

async function getLocations(account) {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?pageSize=100&readMask=name,storeCode,title,storefrontAddress`;
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

async function listAttributes() {
  const token = await authenticate();
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/attributes?regionCode=IT&languageCode=IT&categoryName=gcid:insurance_agency`;
  const resp = await axios.get(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return resp.data;
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

let token = null;
async function authenticate() {
  if (token) return token;
  const scopes = [
    'https://www.googleapis.com/auth/business.manage'
  ];
  
  const jwt = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    subject: key.client_email,
    scopes
  });

  const resp = await jwt.authorize();
  token = resp.access_token.replace(/\.{2,}/g, '');
  return token;
}

function error() {
  console.error('Usage: node gmb.js <action>');
  console.error('  action: list-invitations, accept-invitations, accounts-list, locations-list, reviews-list categories-list');
  process.exit(1);
}

async function main() {
  if (process.argv.length < 3) {
    error();
  }

  const accounts = await getAccounts();
  switch (process.argv[2]) {
    case 'accept-invitations':
      for await (const account of accounts) {
        await acceptInvitations(account.name);
      }
      console.log('Invitations accepted');
      process.exit(0);
      break;
    case 'list-invitations':
      for await (const account of accounts) {
        const invitations = await listInvitations(account.name);
        console.log(invitations);
      }
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
    case 'attributes-list':
      const attributes = await listAttributes();
      console.log(JSON.stringify(attributes));
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