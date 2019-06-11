import {Injectable} from '@angular/core';
import {Observable, SubscriptionLike, Subject, Observer, interval} from 'rxjs';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {map, catchError} from "rxjs/operators";

const {DappClient} = require("dapp-client");
const fetch = require("isomorphic-fetch");

const endpoint = "https://dsp.eosn.io";
const client = new DappClient(endpoint, {fetch});


@Injectable()
export class ScatterService {
    constructor(public http: HttpClient){

    }

    public getData() {
        let self = this;
        return new Promise((resolve) => {
            resolve(self.start());
        })
    }

    public get_table_package(){
        return client.get_table_package({limit: 99999999999});
    }

    public get_table_accountext(){
        return client.get_table_accountext({limit: 99999999999});
    }



    public getProvider(url):Observable<any> {
        return this.http.get(url)
            .pipe(
                map(result => result)
            );
    }

    async start() {
        let json = {
            'providers': []
        };

        var provider;

        var response = await client.get_table_package({limit: 99999999999});

        if(!response) return;

        for (const row of response.rows) {
            if (row['api_endpoint'] == 'null' || row['enabled'] == 0)
                continue
            let found = false
            let pkg = {
                'package_id': row['package_id'],
                'quota': row['quota'],
                'package_period': row['package_period'],
                'min_stake_quantity': row['min_stake_quantity'],
                'min_unstake_period': row['min_unstake_period'],
                'users': 0,
                'staked': 0,
            }
            let uri = row['package_json_uri']
            let logo = "N/A"
            if (uri.startsWith("http") && uri.endsWith(".json")) {

                console.error('uri', uri);

                try {
                    await
                    fetch(uri)
                        .then(function (response) {
                            if (response.status >= 400) {
                                throw new Error("Bad response from server");
                            }
                            return response.json();
                        }).then(function (info) {
                        pkg['service_level_agreement'] = info['service_level_agreement']
                        pkg['description'] = info['description']
                        pkg['locations'] = info['locations']
                        pkg['pinning'] = info['pinning']
                        pkg['name'] = info['name']
                        uri = info['dsp_json_uri']
                        logo = info['logo']
                    })
                } catch (e) {
                }
            }
            for (var p = 0; p < json['providers'].length; p++) {
                if (json['providers'][p]['provider'] === row['provider']) {
                    found = false;
                    for (var s = 0; s < json['providers'][p]['services'].length; s++) {
                        if (json['providers'][p]['services'][s]['service'] === row['service']) {
                            json['providers'][p]['services'][s]['packages'].push(pkg)
                            found = true
                            break
                        }
                    }
                    if (found == false) {
                        json['providers'][p]['services'].push({
                            'service': row['service'],
                            'packages': [pkg],
                            'staked': 0,
                            'users': 0
                        })
                    }
                    found = true
                    break
                }
            }
            if (found == false) {
                provider = {
                    'provider': row['provider'],
                    'logo': logo,
                    'users': 0,
                    'staked': 0,
                    'services': [
                        {
                            'service': row['service'],
                            'packages': [pkg],
                        },
                    ],
                };
                if (uri.startsWith("http") && uri.endsWith("/dsp.json")) {
                    try {
                        await
                        fetch(uri)
                            .then(function (response) {
                                if (response.status >= 400) {
                                    throw new Error("Bad response from server");
                                }
                                return response.json();
                            }).then(function (info) {
                            provider['website'] = info['website']
                        })
                    } catch (e) {
                    }
                }
                json['providers'].push(provider)
            }

        }
        response = await
        client.get_table_accountext({limit: 99999999999});

        for (const row of response.rows) {
            let balance = parseFloat(row['balance'].split(' ')[0])
            json['staked'] += balance
            json['users'] += 1
            for (var p = 0; p < json['providers'].length; p++) {
                if (json['providers'][p]['provider'] === row['provider']) {
                    json['providers'][p]['users'] += 1
                    json['providers'][p]['staked'] += balance
                    for (var s = 0; s < json['providers'][p]['services'].length; s++) {
                        if (json['providers'][p]['services'][s]['service'] === row['service']) {
                            json['providers'][p]['services'][s]['users'] += 1
                            json['providers'][p]['services'][s]['staked'] += balance
                            for (var k = 0; k < json['providers'][p]['services'][s]['packages'].length; k++) {
                                if (json['providers'][p]['services'][s]['packages'][k]['package_id'] === row['pending_package']) {
                                    json['providers'][p]['services'][s]['packages'][k]['users'] += 1
                                    json['providers'][p]['services'][s]['packages'][k]['staked'] += balance
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
}
