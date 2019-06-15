
//WALLET CORE
import { User } from 'universal-authenticator-library'
import { UALJs } from 'ual-plainjs-renderer'
import { JsonRpc } from 'eosjs'

// WALLET PLUGINS
import { TokenPocket } from 'ual-token-pocket'
import { MeetOne } from 'ual-meetone'
import { Scatter } from 'ual-scatter'
import { Lynx } from 'ual-lynx'
//import { Ledger } from 'ual-ledger'
//^bug: https://github.com/EOSIO/ual-ledger/issues/28

//TRANSACTION SCHEMAS
import demoTransaction from './demo-transaction'
import stakeTransaction from './stake-transaction'
import unstakeTransaction from './unstake-transaction'
import selectTransaction from './select-transaction'
import hodlStakeTransaction from './hodl-stake-transaction'
import hodlUnstakeTransaction from './hodl-unstake-transaction'

//DATA FETCHING STUFF
import { DappClient } from "dapp-client"
import fetch from "isomorphic-fetch"
const endpoint = "https://dsp.eosn.io"
const client = new DappClient(endpoint, { fetch })

// Example environment type definition
interface ExampleEnv {
  CHAIN_ID: string,
  RPC_PROTOCOL: string,
  RPC_HOST: string,
  RPC_PORT: string
}

declare var EXAMPLE_ENV: ExampleEnv

let loggedInUser: User

const exampleNet = {
  chainId: EXAMPLE_ENV.CHAIN_ID,
  rpcEndpoints: [{
    protocol: EXAMPLE_ENV.RPC_PROTOCOL,
    host: EXAMPLE_ENV.RPC_HOST,
    port: Number(EXAMPLE_ENV.RPC_PORT),
  }]
}

let balanceUpdateInterval

var json:any = {
  'providers':[],
  'staked': 0,
  'users': 0
}

/* !!!!!!!!!!!!  USE THIS SOMEWHERE   !!!!!!!!!!!
async function more(provider_index, service_index, package_index) {
  const pkg = json['providers'][provider_index]['services'][service_index]['packages'][package_index]
  var uri = pkg['package_json_uri']
  if (uri.startsWith("http") && uri.endsWith(".json")) {
    try {
        await fetch(uri)
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        }).then(function(info) {
            pkg['service_level_agreement'] = info['service_level_agreement']
            pkg['description'] = info['description']
            pkg['locations'] = info['locations']
            pkg['pinning'] = info['pinning']
            pkg['name'] = info['name']
            uri = info['dsp_json_uri']
            json['providers'][provider_index]['logo'] = info['logo']
            if (uri.startsWith("http") && uri.endsWith("/dsp.json")) {
              await fetch(uri)
              .then(function(response) {
                  if (response.status >= 400) {
                      throw new Error("Bad response from server");
                  }
                  return response.json();
              }).then(function(info) {
                json['providers'][provider_index]['telegram'] = info['social']['telegram']
              })
            }
        })
        json['providers'][provider_index]['services'][service_index]['packages'][package_index] = pkg
    } catch (e) {}
  }
}
*/

async function once() 
{
  const response = await client.get_table_package({limit: 500});
  if(!response) once();

  for (const row of response.rows) {
    if (row['api_endpoint'] == 'null')
        continue
  
    var pkg = {
      'package_id': row['package_id'],
      'quota': row['quota'],
      'package_period': row['package_period'],
      'min_stake_quantity': row['min_stake_quantity'],
      'min_unstake_period': row['min_unstake_period'],
      'users': 0,
      'staked': 0,
      'user_staked': 0, //starting quota is (user_staked/min_stake_quantity) * quota
      'user_expire': 0, //if this is not 0...
      'quota_left': 0 //...then 0 here means no more quota left, all starting quota used
    }
    var service = {
      'service':row['service'],
      'packages': [pkg],
      'staked': 0,
      'users': 0,
      'user_staked': 0,
    }
    var provider = {
      'provider' : row['provider'],
      'enabled' : row['enabled'],
      'users': 0,
      'staked': 0,
      'user_staked': 0,
      'website': '',
      'services' : [service],
    }
    var uri = row['package_json_uri']
    var slash = uri.lastIndexOf('/')
    if (slash !== -1)
      provider['website'] = uri.slice(8, slash)

    var found = false
        
    for (var p = 0; p < json['providers'].length; p++) {
      if (json['providers'][p]['provider'] === row['provider']) {
        if (slash !== -1 && json['providers'][p]['website'] === '')
          json['providers'][p]['website'] = uri.slice(8, slash)
        

        found = false;
        for (var s = 0; s < json['providers'][p]['services'].length; s++ ) {
          if (json['providers'][p]['services'][s]['service'] === row['service']) {
            
            found = false
            for (var k = 0; k < json['providers'][p]['services'][s]['packages'].length; k++ ) {
              if (json['providers'][p]['services'][s]['service'][s]['packages'][k]['package_id'] === row['package_id']) {
                found = true //PACKAGE FOUND
                break //LEAVE THE PACKAGES LOOP
              }
            }
            if (found == false) //PACKAGE NOT FOUND
              json['providers'][p]['services'][s]['packages'].push(pkg) //ADD THE PACKAGE
            

            found = true //FOUND THE SERVICE
            break //LEAVE THE SERVICES LOOP
          }  
        }
        if (found == false) //SERVICE NOT FOUND
          json['providers'][p]['services'].push(service) //ADD THE SERVICE


        found = true //FOUND THE PROVIDER
        break //LEAVE THE PROVIDER LOOP
      }
    }
    if (found == false)
      json['providers'].push(provider)  
  } 
}

async function always() 
{
  const response = await client.get_table_accountext({limit: 99999999999});
  const userAccountName = await loggedInUser.getAccountName()

  for (const row of response.rows) {
    const balance = parseFloat(row['balance'].split(' ')[0])
    const own = userAccountName === row['account']
    
    json['staked'] += balance
    json['users'] += 1 

    for (var p = 0; p < json['providers'].length; p++) 
    {
      if (json['providers'][p]['provider'] === row['provider']) 
      {
        json['providers'][p]['users'] += 1
        json['providers'][p]['staked'] += balance

        if (own)
          json['providers'][p]['user_staked'] += balance
        
        for (var s = 0; s < json['providers'][p]['services'].length; s++ ) 
        {
          if(json['providers'][p]['services'][s]['service'] === row['service']) 
          {
            json['providers'][p]['services'][s]['users'] += 1
            json['providers'][p]['services'][s]['staked'] += balance
            
            if (own)
              json['providers'][p]['services'][s]['user_staked'] += balance
            
            for (var k = 0; k < json['providers'][p]['services'][s]['packages'].length; k++) 
            {
              if (json['providers'][p]['services'][s]['packages'][k]['package_id'] === row['pending_package']) 
              { 
                json['providers'][p]['services'][s]['packages'][k]['users'] += 1
                json['providers'][p]['services'][s]['packages'][k]['staked'] += balance 
                
                if (own) {
                  json['providers'][p]['services'][s]['packages'][k]['user_staked'] += balance
                  json['providers'][p]['services'][s]['packages'][k]['user_expire'] = row['package_end']
                  json['providers'][p]['services'][s]['packages'][k]['quota_left'] = row['quota']
                }
                break
              }
            }
            break
          }
        }
        break;
      }
    }    
  }
}
//====================================== WALLET SETUP ===========================================

async function updateBalance() {
  const balanceTag = document.getElementById('p-transfer')
  const dappBalanceTag = document.getElementById('p-dapp-balance')
  const hodlBalanceTag = document.getElementById('p-hodl-balance')

  try {
    const rpc = new JsonRpc(`${EXAMPLE_ENV.RPC_PROTOCOL}://${EXAMPLE_ENV.RPC_HOST}:${EXAMPLE_ENV.RPC_PORT}`)
    const accountName = await loggedInUser.getAccountName()
    const data = await rpc.get_account(accountName)
    const code = 'dappservices';
    const scope = accountName;
    const table = 'accounts';
    const callParams = {
      code,
      scope,
      table,
    };
    const dapp = await rpc.get_table_rows(callParams);
    console.log(dapp.rows[0].balance)

    const hodl = await client.get_dapphdl_accounts(accountName);  

    const { core_liquid_balance: balance } = data
    balanceTag!.innerHTML = `Account Liquid Balance: ${balance}`
    dappBalanceTag!.innerHTML = `Account DAPP Balance: ${dapp}`
    hodlBalanceTag!.innerHTML = `Account DAPPHODL Balance: ${hodl}`
    
    always()
    
  } catch (e) {
    console.error(e)
    balanceTag!.innerHTML = `Unable to retrieve account balance at this time`
  }
}

const userCallback = async (users: User[]) => {
  loggedInUser = users[0]
  console.info('User Information:')
  console.info('Account Name:', await loggedInUser.getAccountName())
  console.info('Chain Id:', await loggedInUser.getChainId())

  balanceUpdateInterval = setInterval(updateBalance, 1000)

  const transferDiv = document.getElementById('div-transfer')
  transferDiv!.style.display = 'block'

  once()
}
const ual = new UALJs(
  userCallback,
  [exampleNet],
  'DSP Mission Control',
  [
    new Scatter([exampleNet], {appName: 'UAL Example'}),
    new Lynx([exampleNet]),
    //new Ledger([exampleNet]), // BROKEN
    new TokenPocket([exampleNet]),
    new MeetOne([exampleNet])
  ],
  {
    containerElement: document.getElementById('ual-div')
  }
)
ual.init()

//====================================== BUTTON LISTENERS: =======================================

addTransferButtonEventListener()
function addTransferButtonEventListener() {
  const transferButton = document.getElementById('btn-transfer')

  transferButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    demoTransaction.actions[0].authorization[0].actor = userAccountName
    demoTransaction.actions[0].data.from = userAccountName
  
    loggedInUser.signTransaction(
      demoTransaction,
      { broadcast: true }
    ).then(function(info) {
      const transaction = 'https://bloks.io/transaction/'+info.transaction['transaction_id']
      console.log(transaction)
    })
  })
}

addStakeButtonEventListener()
function addStakeButtonEventListener() {
  const stakeButton = document.getElementById('btn-stake')

  stakeButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    stakeTransaction.actions[0].authorization[0].actor = userAccountName
    stakeTransaction.actions[0].data.from = userAccountName

    loggedInUser.signTransaction(
      stakeTransaction,
      { broadcast: true }
    )
  })
}

addUnstakeButtonEventListener()
function addUnstakeButtonEventListener() {
  const unstakeButton = document.getElementById('btn-unstake')

  unstakeButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    unstakeTransaction.actions[0].authorization[0].actor = userAccountName
    unstakeTransaction.actions[0].data.to = userAccountName

    loggedInUser.signTransaction(
      unstakeTransaction,
      { broadcast: true }
    )
  })
}

addSelectButtonEventListener()
function addSelectButtonEventListener() {
  const selectButton = document.getElementById('btn-select')

  selectButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    selectTransaction.actions[0].authorization[0].actor = userAccountName
    selectTransaction.actions[0].data.owner = userAccountName

    loggedInUser.signTransaction(
      selectTransaction,
      { broadcast: true }
    )
  })
}

addHodlStakeButtonEventListener()
function addHodlStakeButtonEventListener() {
  const hodlStakeButton = document.getElementById('btn-hodl-stake')

  hodlStakeButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    hodlStakeTransaction.actions[0].authorization[0].actor = userAccountName
    hodlStakeTransaction.actions[0].data.owner = userAccountName

    loggedInUser.signTransaction(
      hodlStakeTransaction,
      { broadcast: true }
    )
  })
}

addHodlUnstakeButtonEventListener()
function addHodlUnstakeButtonEventListener() {
  const hodlUnstakeButton = document.getElementById('btn-hodl-unstake')

  hodlUnstakeButton!.addEventListener('click', async () => {
    // Update our demo transaction to use the logged in user
    const userAccountName = await loggedInUser.getAccountName()
    hodlUnstakeTransaction.actions[0].authorization[0].actor = userAccountName
    hodlUnstakeTransaction.actions[0].data.owner = userAccountName

    loggedInUser.signTransaction(
      hodlUnstakeTransaction,
      { broadcast: true }
    )
  })
}

addLogoutButtonListener()
function addLogoutButtonListener() {
  const logoutButton = document.getElementById('btn-logout')

  logoutButton!.addEventListener('click', async () => {
    clearInterval(balanceUpdateInterval)

    const transferDiv = document.getElementById('div-transfer')
    transferDiv!.style.display = 'none'

    ual.logoutUser()
  })
}