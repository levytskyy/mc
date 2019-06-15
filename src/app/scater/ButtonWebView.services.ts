import {Injectable, OnInit, PLATFORM_ID, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';

//WALLET CORE
import {User} from 'universal-authenticator-library';
import {UALJs} from 'ual-plainjs-renderer';
import {JsonRpc} from 'eosjs';

declare var window: any;

// WALLET PLUGINS
import {TokenPocket} from 'ual-token-pocket';
import {MeetOne} from 'ual-meetone';
import {Scatter} from 'ual-scatter';
import {Lynx} from 'ual-lynx';

import {AuthService} from '../services/auth.services';

//TRANSACTION SCHEMAS
import demoTransaction from './demo-transaction';
import stakeTransaction from './stake-transaction';
import unstakeTransaction from './unstake-transaction';
import selectTransaction from './select-transaction'


import hodlStakeTransaction from './hodl-stake-transaction'
import hodlUnstakeTransaction from './hodl-unstake-transaction'

//DATA FETCHING STUFF
import {DappClient} from "dapp-client";
import fetch from "isomorphic-fetch";
const endpoint = "https://dsp.eosn.io";
const client = new DappClient(endpoint, {fetch})

// Example environment type definition
interface ExampleEnv {
    CHAIN_ID: string,
    RPC_PROTOCOL: string,
    RPC_HOST: string,
    RPC_PORT: string
}

declare var EXAMPLE_ENV: ExampleEnv;

var loggedInUser: User;


var balanceUpdateInterval;

var json: any = {
    'providers': [],
    'staked': 0,
    'users': 0
}

var exampleNet = {
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    rpcEndpoints: [{
        protocol: 'https',
        host: 'api.eosn.io',
        port: 443,
    }]
};

import * as $ from 'jquery';


@Injectable()
export class ButtonWebViewServices implements OnInit {
    isBrowser: boolean;

    constructor(public http: HttpClient,
                public authService: AuthService,
                @Inject(PLATFORM_ID) platformId: string) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    userCallback = async(users: User[]) => {
        loggedInUser = users[0];
        this.authService.onAuth('authorized');
    }

    ngOnInit() {}

    init() {
        let _self = this;
        $(function () {
            let ul = new UALJs(
                _self.userCallback,
                [exampleNet],
                'DSP Mission Control',
                [
                    new Scatter([exampleNet], {appName: 'UAL Example'}),
                    new Lynx([exampleNet]),
                    //new Ledger([exampleNet]), // BROKEN
                    new TokenPocket([exampleNet]),
                    //new MeetOne([exampleNet])
                ], {containerElement: $('#ual-div')[0]});
            ul.init();
        });
    }

    public getData() {
        let self = this;
        return new Promise((resolve) => {
            resolve(self.once());
        })
    }

    public getAlways() {
        let self = this;
        return new Promise((resolve) => {
            resolve(self.always());
        })
    }

    async once() {
        const response = await client.get_table_package({limit: 500});
        if (!response) this.once();

        for (const row of response.rows) {
            if (row['api_endpoint'] == 'null')
                continue

            let pkg = {
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
            let service = {
                'service': row['service'],
                'packages': [pkg],
                'staked': 0,
                'users': 0,
                'user_staked': 0,
            }
            let provider = {
                'provider': row['provider'],
                'enabled': row['enabled'],
                'users': 0,
                'staked': 0,
                'user_staked': 0,
                'website': '',
                'services': [service],
            }
            let uri = row['package_json_uri']
            let slash = uri.lastIndexOf('/')
            if (slash !== -1)
                provider['website'] = uri.slice(8, slash)

            let found = false;

            for (let p = 0; p < json['providers'].length; p++) {
                if (json['providers'][p]['provider'] === row['provider']) {
                    if (slash !== -1 && json['providers'][p]['website'] === '')
                        json['providers'][p]['website'] = uri.slice(8, slash)


                    found = false;
                    for (let s = 0; s < json['providers'][p]['services'].length; s++) {
                        if (json['providers'][p]['services'][s]['service'] === row['service']) {

                            found = false
                            for (let k = 0; k < json['providers'][p]['services'][s]['packages'].length; k++) {
                                if (json['providers'][p]['services'][s]['packages'][k]['package_id'] === row['package_id']) {
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
        return json;
    }

    async always() {
        const response = await client.get_table_accountext({limit: 99999999999});
        let userAccountName;
        if (loggedInUser) {
            userAccountName = await loggedInUser['accountName'];
        }

        for (const row of response.rows) {
            const balance = parseFloat(row['balance'].split(' ')[0]);
            const own = userAccountName === row['account'];

            json['staked'] += balance;
            json['users'] += 1;

            for (var p = 0; p < json['providers'].length; p++) {
                if (json['providers'][p]['provider'] === row['provider']) {
                    json['providers'][p]['users'] += 1
                    json['providers'][p]['staked'] += balance

                    if (own)
                        json['providers'][p]['user_staked'] += balance

                    for (var s = 0; s < json['providers'][p]['services'].length; s++) {
                        if (json['providers'][p]['services'][s]['service'] === row['service']) {
                            json['providers'][p]['services'][s]['users'] += 1
                            json['providers'][p]['services'][s]['staked'] += balance

                            if (own)
                                json['providers'][p]['services'][s]['user_staked'] += balance

                            for (var k = 0; k < json['providers'][p]['services'][s]['packages'].length; k++) {
                                if (json['providers'][p]['services'][s]['packages'][k]['package_id'] === row['pending_package']) {
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
        return json;
    }

    addHodlStakeButtonEventListener(data) {
        return new Promise((resolve, reject) => {
            // Update our demo transaction to use the logged in user
            const userAccountName = loggedInUser.getAccountName()
            hodlStakeTransaction.actions[0].authorization[0].actor = userAccountName;
            hodlStakeTransaction.actions[0].data.owner = userAccountName;

            stakeTransaction.actions[0].data.provider = data['provider'];
            stakeTransaction.actions[0].data.service = data['service'];
            stakeTransaction.actions[0].data.quantity = data['quantity'];

            loggedInUser.signTransaction(
                hodlStakeTransaction,
                {broadcast: true}
            ).then(function (data) {
                resolve(data);
            }, reason => {
                reject(reason);
            });
        })
    }


    addHodlUnstakeButtonEventListener(data) {
        return new Promise((resolve, reject) => {
            const userAccountName = loggedInUser['accountName'];
            hodlUnstakeTransaction.actions[0].authorization[0].actor = userAccountName;
            hodlUnstakeTransaction.actions[0].data.owner = userAccountName;

            stakeTransaction.actions[0].data.provider = data['provider'];
            stakeTransaction.actions[0].data.service = data['service'];
            stakeTransaction.actions[0].data.quantity = data['quantity'];

            loggedInUser.signTransaction(
                hodlUnstakeTransaction,
                {broadcast: true}
            ).then(function (data) {
                resolve(data);
            }, reason => {
                reject(reason);
            });
        })
    }


    addStakeButtonEventListener(data) {
        return new Promise((resolve, reject) => {
            if (!loggedInUser) {
                reject('Error: You are not authorized');
            }

            const userAccountName = loggedInUser['accountName'];
            stakeTransaction.actions[0].authorization[0].actor = userAccountName;
            stakeTransaction.actions[0].data.from = userAccountName;

            stakeTransaction.actions[0].data.provider = data['provider'];
            stakeTransaction.actions[0].data.service = data['service'];
            stakeTransaction.actions[0].data.quantity = data['quantity'];

            loggedInUser.signTransaction(
                stakeTransaction,
                {broadcast: true}
            ).then(function (data) {
                resolve(data);
            }, reason => {
                reject(reason);
            });
        })
    }

    addUnstakeButtonEventListener(data) {
        return new Promise((resolve, reject) => {
            // Update our demo transaction to use the logged in user
            if (!loggedInUser) {
                reject('Error: You are not authorized');
            }
            const userAccountName = loggedInUser['accountName'];
            unstakeTransaction.actions[0].authorization[0].actor = userAccountName;
            unstakeTransaction.actions[0].data.to = userAccountName;

            unstakeTransaction.actions[0].data.provider = data['provider'];
            unstakeTransaction.actions[0].data.service = data['service'];
            unstakeTransaction.actions[0].data.quantity = data['quantity'];

            loggedInUser.signTransaction(
                unstakeTransaction,
                {broadcast: true}
            ).then(function (data) {
                resolve(data);
            }, reason => {
                reject(reason);
            });
        })
    }

    public addSelectButtonEventListener(data) {
        return new Promise((resolve, reject) => {
            if (!loggedInUser) {
                reject('Error: You are not authorized');
            }
            const userAccountName = loggedInUser['accountName'];
            selectTransaction.actions[0].authorization[0].actor = userAccountName;

            selectTransaction.actions[0].data.owner = userAccountName;
            selectTransaction.actions[0].data.provider = data['provider'];
            selectTransaction.actions[0].data.package = data['package'];
            selectTransaction.actions[0].data.service = data['service'];

            console.log(selectTransaction);

            loggedInUser.signTransaction(
                selectTransaction,
                {broadcast: true}
            ).then(function (info) {
                resolve(info);
            }, reason => {
                reject(reason);
            });
        })
    }

    getUserBallance() {
        let _self = this;
        return new Promise((resolve) => {
            resolve(_self.updateBalance());
        })
    }

    async updateBalance() {
        let _self = this;

        try {
            const rpc = new JsonRpc(`${exampleNet['rpcEndpoints'][0]['protocol']}://${exampleNet['rpcEndpoints'][0]['host']}:${exampleNet['rpcEndpoints'][0]['port']}`)
            const accountName = await loggedInUser['accountName'];
            const data = await rpc.get_account(accountName);
            const code = 'dappservices';
            const scope = accountName;
            const table = 'accounts';
            const callParams = {
                code,
                scope,
                table,
            };

            //var response = await rpc.get_table_rows(callParams);
            //const total_staked = response.rows[0].total_staked;

            const dapp = await rpc.get_table_rows(callParams);

            const hodl = await client.get_dapphdl_accounts(accountName);

            const {core_liquid_balance: balance} = data;

            let results = {
                balance: balance,
                dapp: dapp,
                hodl: hodl,
                core_liquid_balance: data
            };

            _self.always();
            return results;

        } catch (e) {
            alert(`Unable to retrieve account balance at this time`);
        }
    }


}
