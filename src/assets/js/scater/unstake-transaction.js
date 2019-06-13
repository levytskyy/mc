export default {
  actions: [{
    account: "dappservices",
    name: "stake",
    authorization: [{
      actor: "", // use account that was logged in
      permission: "active",
    }],
    data: {
      to: "", // use account that was logged in
      provider: "atticlabdapp",
      service: "ipfsservice1",
      quantity: "1.0000 DAPP",
    },
  }],
}
