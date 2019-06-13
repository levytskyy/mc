export default {
  actions: [{
    account: "dappservices",
    name: "selectpkg",
    authorization: [{
      actor: "", // use account that was logged in
      permission: "active",
    }],
    data: {
      owner: "", // use account that was logged in
      package: "package1",
      provider: "atticlabdapp",
      service: "ipfsservice1",
    },
  }],
}
