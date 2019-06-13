export default {
  actions: [{
    account: "eosio.token",
    name: "transfer",
    authorization: [{
      actor: "", // use account that was logged in
      permission: "active",
    }],
    data: {
      from: "", // use account that was logged in
      to: "eosusd.com",
      quantity: "0.0001 EOS",
      memo: "UAL works!",
    },
  }],
}
