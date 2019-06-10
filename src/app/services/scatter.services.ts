import {Injectable} from '@angular/core';
import {Observable, SubscriptionLike, Subject, Observer, interval} from 'rxjs';

const {DappClient} = require("dapp-client");
const fetch = require("isomorphic-fetch");

const endpoint = "https://dsp.eosn.io";
const client = new DappClient(endpoint, {fetch});


@Injectable()
export class ScatterService {


    public getData() {
        let self = this;
        return new Promise((resolve) => {
            resolve(self.start());
        })
    }

    async start() {
        let json = {
            'providers': []
        }
        const response = await client.get_table_package({limit: 50});
        //console.log(response.rows[0])

        for (const row of response.rows) {
            if (row['enabled'] != true)
                continue
            let found = false
            let pkg = {
                'package_id': row['package_id'],
                'quota': row['quota'],
                'package_period': row['package_period'],
                'min_stake_quantity': row['min_stake_quantity'],
                'min_unstake_period': row['min_unstake_period']
            }
            let uri = row['package_json_uri']
            let logo = {}
            if (uri.startsWith("http") && uri.endsWith(".json")) {
                try {
                    await fetch(uri)
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
                            'packages': [pkg,]
                        })
                    }
                    found = true
                    break
                }
            }
            if (found == false) {
                let provider = {
                    'provider': row['provider'],
                    'logo': logo,
                    'services': [
                        {
                            'service': row['service'],
                            'packages': [pkg],
                        },
                    ],
                }
                if (uri.startsWith("http") && uri.endsWith("/dsp.json")) {
                    try {
                        await fetch(uri)
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

        return json;
    }
}

